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

	"github.com/yourusername/yt-transcript-downloader/internal/db"
	"github.com/yourusername/yt-transcript-downloader/internal/services"
)

const summarizeTimeout = 60 * time.Second

var allowedSummaryTypes = map[string]struct{}{
	"brief":      {},
	"detailed":   {},
	"key_points": {},
}

type summarizeRequest struct {
	SummaryType string `json:"summary_type"`
}

type summaryResponse struct {
	ID           string                 `json:"id"`
	TranscriptID string                 `json:"transcript_id"`
	SummaryType  string                 `json:"summary_type"`
	Content      summaryContentResponse `json:"content"`
	Model        string                 `json:"model"`
	TokensUsed   int                    `json:"tokens_used"`
	CreatedAt    time.Time              `json:"created_at"`
}

type summaryContentResponse struct {
	Text      string                  `json:"text"`
	KeyPoints []string                `json:"key_points,omitempty"`
	Sections  []summarySectionMessage `json:"sections,omitempty"`
}

type summarySectionMessage struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

func (s *Server) handleSummarizeTranscript(w http.ResponseWriter, r *http.Request) {
	transcriptID := chi.URLParam(r, "id")
	if strings.TrimSpace(transcriptID) == "" {
		writeStructuredError(w, http.StatusBadRequest, nil, "transcript id is required")
		return
	}

	var req summarizeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeStructuredError(w, http.StatusBadRequest, err, "Invalid JSON request body")
		return
	}

	summaryType := normalizeSummaryType(req.SummaryType)
	if !isSummaryTypeAllowed(summaryType) {
		writeStructuredError(w, http.StatusBadRequest, nil, "invalid summary_type")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), summarizeTimeout)
	defer cancel()

	if cached, err := s.aiSummaryRepo.GetAISummary(ctx, transcriptID, summaryType); err == nil {
		writeJSON(w, http.StatusOK, buildSummaryResponse(cached))
		return
	} else if !errors.Is(err, db.ErrNotFound) {
		writeStructuredError(w, http.StatusInternalServerError, err, "Failed to lookup cached summary")
		return
	}

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

	transcriptText := buildTranscriptText(transcript.Content)
	if transcriptText == "" {
		writeStructuredError(w, http.StatusNotFound, nil, "Transcript is empty or unavailable")
		return
	}

	aiSummary, err := s.aiService.Summarize(ctx, transcriptText, summaryType)
	if err != nil {
		log.Printf("ERROR [%s %s] AI summarize failed (type=%s, transcript=%s): %v",
			r.Method, r.URL.Path, summaryType, transcriptID, err)
		handleAISummarizeError(w, err)
		return
	}

	dbSummary := convertToDatabaseSummary(transcriptID, summaryType, aiSummary)

	if err := s.aiSummaryRepo.CreateAISummary(ctx, dbSummary); err != nil {
		writeStructuredError(w, http.StatusInternalServerError, err, "Failed to store AI summary")
		return
	}

	writeJSON(w, http.StatusOK, buildSummaryResponse(dbSummary))
}

func normalizeSummaryType(raw string) string {
	return strings.ToLower(strings.TrimSpace(raw))
}

func isSummaryTypeAllowed(summaryType string) bool {
	_, ok := allowedSummaryTypes[summaryType]
	return ok
}

func buildTranscriptText(segments db.TranscriptSegments) string {
	var builder strings.Builder
	for _, segment := range segments {
		if segment.Text == "" {
			continue
		}
		if builder.Len() > 0 {
			builder.WriteString(" ")
		}
		builder.WriteString(strings.TrimSpace(segment.Text))
	}
	return builder.String()
}

func handleAISummarizeError(w http.ResponseWriter, err error) {
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
		writeStructuredError(w, http.StatusGatewayTimeout, err, "AI request timed out (>60s). Try with a shorter transcript or try again later.")
	case errors.Is(err, context.Canceled):
		writeStructuredError(w, http.StatusRequestTimeout, err, "Request was canceled.")
	default:
		// Check if it's a JSON parsing error
		if strings.Contains(err.Error(), "parse") || strings.Contains(err.Error(), "unmarshal") || strings.Contains(err.Error(), "json") {
			writeStructuredError(w, http.StatusInternalServerError, err, "AI response format error. The AI returned an invalid response. Please try again.")
		} else {
			// Generic error with hint about the actual error
			writeStructuredError(w, http.StatusInternalServerError, err, fmt.Sprintf("Failed to generate AI summary: %v", err))
		}
	}
}

func convertToDatabaseSummary(transcriptID, summaryType string, summary *services.AISummary) *db.AISummary {
	sections := make([]db.Section, 0, len(summary.Content.Sections))
	for _, section := range summary.Content.Sections {
		sections = append(sections, db.Section{
			Title:   section.Title,
			Content: section.Content,
		})
	}

	return &db.AISummary{
		TranscriptID: transcriptID,
		SummaryType:  summaryType,
		Content: db.SummaryContent{
			Text:      summary.Content.Text,
			KeyPoints: summary.Content.KeyPoints,
			Sections:  sections,
		},
		Model:      summary.Model,
		TokensUsed: summary.TokensUsed,
	}
}

func buildSummaryResponse(summary *db.AISummary) summaryResponse {
	sections := make([]summarySectionMessage, 0, len(summary.Content.Sections))
	for _, section := range summary.Content.Sections {
		if section.Title == "" && section.Content == "" {
			continue
		}
		sections = append(sections, summarySectionMessage{
			Title:   section.Title,
			Content: section.Content,
		})
	}

	return summaryResponse{
		ID:           summary.ID,
		TranscriptID: summary.TranscriptID,
		SummaryType:  summary.SummaryType,
		Content: summaryContentResponse{
			Text:      summary.Content.Text,
			KeyPoints: summary.Content.KeyPoints,
			Sections:  sections,
		},
		Model:      summary.Model,
		TokensUsed: summary.TokensUsed,
		CreatedAt:  summary.CreatedAt,
	}
}
