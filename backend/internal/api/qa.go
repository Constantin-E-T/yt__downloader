package api

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/yourusername/yt-transcript-downloader/internal/db"
	"github.com/yourusername/yt-transcript-downloader/internal/services"
)

const (
	qaTimeout        = 60 * time.Second
	questionMinLen   = 3
	questionMaxLen   = 500
)

type qaRequest struct {
	Question string `json:"question"`
}

type qaResponse struct {
	ID           string    `json:"id"`
	TranscriptID string    `json:"transcript_id"`
	Question     string    `json:"question"`
	Answer       string    `json:"answer"`
	Confidence   string    `json:"confidence"`
	Sources      []string  `json:"sources"`
	NotFound     bool      `json:"not_found"`
	Model        string    `json:"model"`
	TokensUsed   int       `json:"tokens_used"`
	CreatedAt    time.Time `json:"created_at"`
}

func (s *Server) handleTranscriptQA(w http.ResponseWriter, r *http.Request) {
	transcriptID := chi.URLParam(r, "id")
	if strings.TrimSpace(transcriptID) == "" {
		writeStructuredError(w, http.StatusBadRequest, nil, "transcript id is required")
		return
	}

	var req qaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeStructuredError(w, http.StatusBadRequest, err, "Invalid JSON request body")
		return
	}

	// Validate question
	question := strings.TrimSpace(req.Question)
	if question == "" {
		writeStructuredError(w, http.StatusBadRequest, nil, "question is required")
		return
	}

	if len(question) < questionMinLen {
		writeStructuredError(w, http.StatusBadRequest, nil, "question must be at least 3 characters")
		return
	}

	if len(question) > questionMaxLen {
		writeStructuredError(w, http.StatusRequestEntityTooLarge, nil, "question must be 500 characters or less")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), qaTimeout)
	defer cancel()

	// Get transcript
	transcript, err := s.transcriptRepo.GetTranscriptByID(ctx, transcriptID)
	if err != nil {
		if errors.Is(err, db.ErrNotFound) {
			writeStructuredError(w, http.StatusNotFound, err, "Transcript not found")
			return
		}
		if isDatabaseUnavailableError(err) {
			writeStructuredError(w, http.StatusServiceUnavailable, err, "Database unavailable. Please try again later.")
			return
		}
		writeStructuredError(w, http.StatusInternalServerError, err, "Failed to load transcript")
		return
	}

	// Build transcript text
	transcriptText := buildTranscriptText(transcript.Content)
	if transcriptText == "" {
		writeStructuredError(w, http.StatusNotFound, nil, "Transcript is empty or unavailable")
		return
	}

	// Call AI service for answer
	aiAnswer, err := s.aiService.Answer(ctx, transcriptText, question)
	if err != nil {
		log.Printf("ERROR [%s %s] AI Q&A failed (question=%s, transcript=%s): %v",
			r.Method, r.URL.Path, question, transcriptID, err)
		handleAIAnswerError(w, err)
		return
	}

	// Build response (Q&A is not cached - each question is unique)
	response := buildQAResponse(transcriptID, question, aiAnswer)

	writeJSON(w, http.StatusOK, response)
}

func handleAIAnswerError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, services.ErrAIRateLimited):
		writeStructuredError(w, http.StatusTooManyRequests, err, "AI rate limit reached. Please wait a moment and try again.")
	case errors.Is(err, services.ErrAIQuotaExceeded):
		writeStructuredError(w, http.StatusPaymentRequired, err, "AI quota exceeded. Please contact the administrator.")
	case errors.Is(err, services.ErrAIServiceUnavailable):
		writeStructuredError(w, http.StatusServiceUnavailable, err, "AI service is temporarily unavailable. Please try again in a few moments.")
	case errors.Is(err, services.ErrAIProviderNotConfigured):
		writeStructuredError(w, http.StatusServiceUnavailable, err, "AI service is not configured. Please contact the administrator.")
	case errors.Is(err, context.DeadlineExceeded):
		writeStructuredError(w, http.StatusGatewayTimeout, err, "AI request timed out (>60s). Try with a shorter question or try again later.")
	case errors.Is(err, context.Canceled):
		writeStructuredError(w, http.StatusRequestTimeout, err, "Request was canceled.")
	default:
		// Check if it's a JSON parsing error
		if strings.Contains(err.Error(), "parse") || strings.Contains(err.Error(), "unmarshal") || strings.Contains(err.Error(), "json") {
			writeStructuredError(w, http.StatusInternalServerError, err, "AI response format error. The AI returned an invalid response. Please try again.")
		} else {
			// Generic error with hint about the actual error
			writeStructuredError(w, http.StatusInternalServerError, err, fmt.Sprintf("Failed to answer question: %v", err))
		}
	}
}

func buildQAResponse(transcriptID, question string, answer *services.AIAnswer) qaResponse {
	return qaResponse{
		ID:           uuid.New().String(),
		TranscriptID: transcriptID,
		Question:     question,
		Answer:       answer.Answer,
		Confidence:   answer.Confidence,
		Sources:      answer.Sources,
		NotFound:     answer.NotFound,
		Model:        answer.Model,
		TokensUsed:   answer.TokensUsed,
		CreatedAt:    time.Now().UTC(),
	}
}
