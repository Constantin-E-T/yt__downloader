package api

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/yourusername/yt-transcript-downloader/internal/db"
	"github.com/yourusername/yt-transcript-downloader/internal/services"
)

const extractTimeout = 60 * time.Second

var allowedExtractionTypes = map[string]struct{}{
	"code":         {},
	"quotes":       {},
	"action_items": {},
}

type extractRequest struct {
	ExtractionType string `json:"extraction_type"`
}

type extractionResponse struct {
	ID             string                   `json:"id"`
	TranscriptID   string                   `json:"transcript_id"`
	ExtractionType string                   `json:"extraction_type"`
	Items          []map[string]interface{} `json:"items"`
	Model          string                   `json:"model"`
	TokensUsed     int                      `json:"tokens_used"`
	CreatedAt      time.Time                `json:"created_at"`
}

func (s *Server) handleExtractFromTranscript(w http.ResponseWriter, r *http.Request) {
	transcriptID := chi.URLParam(r, "id")
	if strings.TrimSpace(transcriptID) == "" {
		writeStructuredError(w, http.StatusBadRequest, nil, "transcript id is required")
		return
	}

	var req extractRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeStructuredError(w, http.StatusBadRequest, err, "Invalid JSON request body")
		return
	}

	extractionType := normalizeExtractionType(req.ExtractionType)
	if !isExtractionTypeAllowed(extractionType) {
		writeStructuredError(w, http.StatusBadRequest, nil, "invalid extraction_type (must be 'code', 'quotes', or 'action_items')")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), extractTimeout)
	defer cancel()

	// Check for cached extraction
	if cached, err := s.aiExtractionRepo.GetAIExtraction(ctx, transcriptID, extractionType); err == nil {
		writeJSON(w, http.StatusOK, buildExtractionResponse(cached))
		return
	} else if !errors.Is(err, db.ErrNotFound) {
		writeStructuredError(w, http.StatusInternalServerError, err, "Failed to lookup cached extraction")
		return
	}

	// Fetch transcript
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

	// Call AI service to extract content
	aiExtraction, err := s.aiService.Extract(ctx, transcriptText, extractionType)
	if err != nil {
		// DEBUG: Log the actual error
		fmt.Fprintf(os.Stderr, "DEBUG: AI Extract error: %v (type: %T)\n", err, err)
		handleAIExtractionError(w, err)
		return
	}

	// Convert to database format
	dbExtraction, err := convertToDatabaseExtraction(transcriptID, extractionType, aiExtraction)
	if err != nil {
		writeStructuredError(w, http.StatusInternalServerError, err, "Failed to process extraction result")
		return
	}

	// Store in database
	if err := s.aiExtractionRepo.CreateAIExtraction(ctx, dbExtraction); err != nil {
		writeStructuredError(w, http.StatusInternalServerError, err, "Failed to store AI extraction")
		return
	}

	writeJSON(w, http.StatusOK, buildExtractionResponse(dbExtraction))
}

func normalizeExtractionType(raw string) string {
	return strings.ToLower(strings.TrimSpace(raw))
}

func isExtractionTypeAllowed(extractionType string) bool {
	_, ok := allowedExtractionTypes[extractionType]
	return ok
}

func handleAIExtractionError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, services.ErrAIRateLimited):
		writeStructuredError(w, http.StatusTooManyRequests, err, "OpenAI rate limit reached. Please try again later.")
	case errors.Is(err, services.ErrAIQuotaExceeded):
		writeStructuredError(w, http.StatusTooManyRequests, err, "AI quota exceeded. Please try again later.")
	case errors.Is(err, services.ErrAIServiceUnavailable),
		errors.Is(err, services.ErrAIProviderNotConfigured):
		writeStructuredError(w, http.StatusServiceUnavailable, err, "OpenAI service unavailable")
	default:
		writeStructuredError(w, http.StatusInternalServerError, err, "Failed to generate AI extraction")
	}
}

func convertToDatabaseExtraction(transcriptID, extractionType string, extraction *services.AIExtraction) (*db.AIExtraction, error) {
	// Convert ExtractionItem to JSON
	itemsJSON, err := json.Marshal(map[string]interface{}{
		"items": extraction.Items,
	})
	if err != nil {
		return nil, err
	}

	return &db.AIExtraction{
		TranscriptID:   transcriptID,
		ExtractionType: extractionType,
		Content:        itemsJSON,
		Model:          extraction.Model,
		TokensUsed:     extraction.TokensUsed,
	}, nil
}

func buildExtractionResponse(extraction *db.AIExtraction) extractionResponse {
	// Parse the JSON content
	var content map[string]interface{}
	if err := json.Unmarshal(extraction.Content, &content); err != nil {
		// Fallback to empty items on parse error
		return extractionResponse{
			ID:             extraction.ID,
			TranscriptID:   extraction.TranscriptID,
			ExtractionType: extraction.ExtractionType,
			Items:          []map[string]interface{}{},
			Model:          extraction.Model,
			TokensUsed:     extraction.TokensUsed,
			CreatedAt:      extraction.CreatedAt,
		}
	}

	// Extract items array
	items := []map[string]interface{}{}
	if itemsRaw, ok := content["items"]; ok {
		if itemsArray, ok := itemsRaw.([]interface{}); ok {
			for _, item := range itemsArray {
				if itemMap, ok := item.(map[string]interface{}); ok {
					items = append(items, itemMap)
				}
			}
		}
	}

	return extractionResponse{
		ID:             extraction.ID,
		TranscriptID:   extraction.TranscriptID,
		ExtractionType: extraction.ExtractionType,
		Items:          items,
		Model:          extraction.Model,
		TokensUsed:     extraction.TokensUsed,
		CreatedAt:      extraction.CreatedAt,
	}
}
