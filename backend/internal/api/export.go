package api

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/yourusername/yt-transcript-downloader/internal/db"
)

const (
	exportFormatJSON = "json"
	exportFormatText = "text"
)

// handleExportTranscript supports GET /api/v1/transcripts/{id}/export requests.
// Supported formats: json (default) and text (plain text).
func (s *Server) handleExportTranscript(w http.ResponseWriter, r *http.Request) {
	transcriptID := strings.TrimSpace(chi.URLParam(r, "id"))
	if transcriptID == "" {
		writeStructuredError(w, http.StatusBadRequest, nil, "Transcript ID is required")
		return
	}

	format := normalizeExportFormat(r.URL.Query().Get("format"))
	if format == "" {
		format = exportFormatJSON
	}
	if !isSupportedExportFormat(format) {
		writeStructuredError(w, http.StatusBadRequest, nil, "Unsupported export format. Use json or text.")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	transcript, video, apiErr := s.lookupTranscriptBundle(ctx, r.Method, r.URL.Path, transcriptID)
	if apiErr != nil {
		writeStructuredError(w, apiErr.status, apiErr.err, apiErr.message)
		return
	}

	payload := buildTranscriptResponse(video, transcript)

	switch format {
	case exportFormatJSON:
		filename := fmt.Sprintf("transcript-%s.json", transcriptID)
		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
		writeJSON(w, http.StatusOK, payload)
	case exportFormatText:
		filename := fmt.Sprintf("transcript-%s.txt", transcriptID)
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(buildPlainTextExport(payload)))
	}
}

type apiError struct {
	status  int
	err     error
	message string
}

func (s *Server) lookupTranscriptBundle(ctx context.Context, method, path, transcriptID string) (*db.Transcript, *db.Video, *apiError) {
	transcript, err := s.transcriptRepo.GetTranscriptByID(ctx, transcriptID)
	if err != nil {
		if errorsIsNotFound(err) {
			return nil, nil, &apiError{
				status:  http.StatusNotFound,
				err:     err,
				message: "Transcript not found",
			}
		}
		if isDatabaseUnavailableError(err) {
			return nil, nil, &apiError{
				status:  http.StatusServiceUnavailable,
				err:     err,
				message: "Database unavailable. Please try again later.",
			}
		}
		logAPILookupError(method, path, "get transcript", err)
		return nil, nil, &apiError{
			status:  http.StatusInternalServerError,
			err:     err,
			message: "Failed to fetch transcript",
		}
	}

	video, err := s.videoRepository.GetVideoByID(ctx, transcript.VideoID)
	if err != nil {
		if errorsIsNotFound(err) {
			return nil, nil, &apiError{
				status:  http.StatusNotFound,
				err:     err,
				message: "Video metadata not found for transcript",
			}
		}
		if isDatabaseUnavailableError(err) {
			return nil, nil, &apiError{
				status:  http.StatusServiceUnavailable,
				err:     err,
				message: "Database unavailable. Please try again later.",
			}
		}
		logAPILookupError(method, path, "get video", err)
		return nil, nil, &apiError{
			status:  http.StatusInternalServerError,
			err:     err,
			message: "Failed to fetch video metadata",
		}
	}

	return transcript, video, nil
}

func normalizeExportFormat(format string) string {
	format = strings.TrimSpace(strings.ToLower(format))
	switch format {
	case "json":
		return exportFormatJSON
	case "text", "txt", "plain", "plaintext":
		return exportFormatText
	default:
		return format
	}
}

func isSupportedExportFormat(format string) bool {
	return format == exportFormatJSON || format == exportFormatText
}

func buildPlainTextExport(resp TranscriptResponse) string {
	var b strings.Builder

	if resp.Title != "" {
		b.WriteString(resp.Title)
		b.WriteRune('\n')
	}

	if resp.VideoID != "" {
		b.WriteString("Video: https://youtube.com/watch?v=")
		b.WriteString(resp.VideoID)
		b.WriteRune('\n')
	}

	if resp.Language != "" {
		b.WriteString("Language: ")
		b.WriteString(strings.ToUpper(resp.Language))
		b.WriteRune('\n')
	}

	b.WriteString("\nTranscript\n----------\n")

	for _, line := range resp.Transcript {
		text := strings.TrimSpace(line.Text)
		if text == "" {
			continue
		}
		b.WriteString("[")
		b.WriteString(formatTimestamp(line.Start))
		b.WriteString("] ")
		b.WriteString(text)
		b.WriteRune('\n')
	}

	return b.String()
}

func formatTimestamp(milliseconds int64) string {
	if milliseconds < 0 {
		milliseconds = 0
	}
	totalSeconds := milliseconds / 1000
	hours := totalSeconds / 3600
	minutes := (totalSeconds % 3600) / 60
	seconds := totalSeconds % 60
	return fmt.Sprintf("%02d:%02d:%02d", hours, minutes, seconds)
}

func errorsIsNotFound(err error) bool {
	return err != nil && errors.Is(err, db.ErrNotFound)
}

func logAPILookupError(method, path, context string, err error) {
	log.Printf("ERROR [%s %s] %s: %v", method, path, context, err)
}
