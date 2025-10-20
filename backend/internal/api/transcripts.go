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

	"github.com/yourusername/yt-transcript-downloader/internal/db"
	"github.com/yourusername/yt-transcript-downloader/internal/services"
)

const defaultTranscriptLanguage = "en"

// handleFetchTranscript handles POST /api/v1/transcripts/fetch requests.
func (s *Server) handleFetchTranscript(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	var req TranscriptRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeStructuredError(w, http.StatusBadRequest, err, "Invalid JSON request body")
		return
	}

	videoID, err := ValidateVideoURL(req.VideoURL)
	if err != nil {
		log.Printf("ERROR [%s %s] validation failed: %v", r.Method, r.URL.Path, err)
		switch {
		case errors.Is(err, ErrVideoURLRequired):
			writeStructuredError(w, http.StatusBadRequest, err, "video_url is required")
		case errors.Is(err, ErrInvalidVideoURL):
			writeStructuredError(w, http.StatusBadRequest, err, fmt.Sprintf("Invalid video URL: %v", err))
		case errors.Is(err, ErrVideoIDExtraction):
			writeStructuredError(w, http.StatusBadRequest, err, "Invalid video URL: unable to extract video ID")
		default:
			writeStructuredError(w, http.StatusBadRequest, err, "Invalid video URL")
		}
		return
	}

	if len(videoID) != 11 {
		writeStructuredError(w, http.StatusBadRequest, nil, "Invalid video ID format")
		return
	}

	lang := strings.TrimSpace(req.Language)
	if err := ValidateLanguage(lang); err != nil {
		log.Printf("ERROR [%s %s] language validation failed: %v", r.Method, r.URL.Path, err)
		writeStructuredError(w, http.StatusBadRequest, err, fmt.Sprintf("Invalid language: %v", err))
		return
	}
	if lang == "" {
		lang = defaultTranscriptLanguage
	} else {
		lang = strings.ToLower(lang)
	}

	metadata, err := fetchMetadataWithContext(ctx, s.youtube, videoID)
	if err != nil {
		log.Printf("ERROR [%s %s] metadata fetch: %v", r.Method, r.URL.Path, err)
		switch {
		case errors.Is(err, context.DeadlineExceeded):
			writeStructuredError(w, http.StatusGatewayTimeout, err, "Request timed out while fetching video metadata")
		case errors.Is(err, services.ErrVideoNotFound):
			writeStructuredError(w, http.StatusNotFound, err, "Video not found")
		case errors.Is(err, services.ErrVideoPrivate):
			writeStructuredError(w, http.StatusForbidden, err, "Video is private")
		case errors.Is(err, services.ErrVideoAgeRestricted):
			writeStructuredError(w, http.StatusForbidden, err, "Video is age-restricted and cannot be processed")
		case errors.Is(err, services.ErrRateLimited):
			writeStructuredError(w, http.StatusServiceUnavailable, err, "YouTube rate limit reached. Please try again later.")
		default:
			writeStructuredError(w, http.StatusInternalServerError, err, "Failed to fetch video metadata")
		}
		return
	}

	if metadata.Duration > 10*time.Hour {
		writeStructuredError(w, http.StatusBadRequest, nil, "Videos longer than 10 hours are not supported")
		return
	}

	transcriptLines, err := fetchTranscriptWithContext(ctx, s.youtube, metadata.ID, lang)
	if err != nil {
		log.Printf("ERROR [%s %s] transcript fetch: %v", r.Method, r.URL.Path, err)
		switch {
		case errors.Is(err, context.DeadlineExceeded):
			writeStructuredError(w, http.StatusGatewayTimeout, err, "Request timed out while fetching transcript")
		case errors.Is(err, services.ErrTranscriptDisabled):
			writeStructuredError(w, http.StatusNotFound, err, "Transcripts are disabled for this video")
		case errors.Is(err, services.ErrTranscriptUnavailable):
			writeStructuredError(w, http.StatusNotFound, err, "Transcript is empty or unavailable")
		case errors.Is(err, services.ErrRateLimited):
			writeStructuredError(w, http.StatusServiceUnavailable, err, "YouTube rate limit reached. Please try again later.")
		default:
			writeStructuredError(w, http.StatusInternalServerError, err, "Failed to fetch transcript")
		}
		return
	}

	if len(transcriptLines) == 0 {
		writeStructuredError(w, http.StatusNotFound, nil, "Transcript is empty or unavailable")
		return
	}

	videoModel := &db.Video{
		YouTubeID: metadata.ID,
		Title:     metadata.Title,
		Channel:   metadata.Author,
		Duration:  int(metadata.Duration / time.Second),
	}

	if err := s.videoRepository.SaveVideo(ctx, videoModel); err != nil {
		log.Printf("ERROR [%s %s] save video: %v", r.Method, r.URL.Path, err)
		if isDatabaseUnavailableError(err) {
			writeStructuredError(w, http.StatusServiceUnavailable, err, "Database unavailable. Please try again later.")
			return
		}
		writeStructuredError(w, http.StatusInternalServerError, err, "Failed to store video")
		return
	}

	dbSegments, apiLines := convertTranscriptLines(transcriptLines)
	transcriptModel := &db.Transcript{
		VideoID:  videoModel.ID,
		Language: lang,
		Content:  dbSegments,
	}

	if err := s.transcriptRepo.SaveTranscript(ctx, transcriptModel); err != nil {
		log.Printf("ERROR [%s %s] save transcript: %v", r.Method, r.URL.Path, err)
		if isDatabaseUnavailableError(err) {
			writeStructuredError(w, http.StatusServiceUnavailable, err, "Database unavailable. Please try again later.")
			return
		}
		writeStructuredError(w, http.StatusInternalServerError, err, "Failed to store transcript")
		return
	}

	resp := TranscriptResponse{
		VideoID:    metadata.ID,
		Title:      metadata.Title,
		Language:   lang,
		Transcript: apiLines,
	}

	writeJSON(w, http.StatusOK, resp)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
