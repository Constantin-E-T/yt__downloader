package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	youtube "github.com/kkdai/youtube/v2"

	"github.com/yourusername/yt-transcript-downloader/internal/db"
	"github.com/yourusername/yt-transcript-downloader/internal/services"
)

const defaultTranscriptLanguage = "en"

// TranscriptRequest captures the payload for transcript fetch requests.
type TranscriptRequest struct {
	VideoURL string `json:"video_url"`
	Language string `json:"language,omitempty"`
}

// TranscriptLine represents a single transcript entry returned to clients.
type TranscriptLine struct {
	Start    int64  `json:"start"`
	Duration int64  `json:"duration"`
	Text     string `json:"text"`
}

// TranscriptResponse is the API response for transcript fetch requests.
type TranscriptResponse struct {
	VideoID    string           `json:"video_id"`
	Title      string           `json:"title"`
	Language   string           `json:"language"`
	Transcript []TranscriptLine `json:"transcript"`
}

type errorResponse struct {
	Error string `json:"error"`
}

// handleFetchTranscript handles POST /api/v1/transcripts/fetch requests.
func (s *Server) handleFetchTranscript(w http.ResponseWriter, r *http.Request) {
	var req TranscriptRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request payload")
		return
	}

	req.VideoURL = strings.TrimSpace(req.VideoURL)
	if req.VideoURL == "" {
		writeError(w, http.StatusBadRequest, "video_url is required")
		return
	}

	lang := strings.TrimSpace(req.Language)
	if lang == "" {
		lang = defaultTranscriptLanguage
	}

	metadata, err := s.youtube.GetVideoMetadata(req.VideoURL)
	if err != nil {
		status, msg := classifyMetadataError(err)
		writeError(w, status, msg)
		return
	}

	transcriptLines, err := s.youtube.GetTranscript(metadata.ID, lang)
	if err != nil {
		status, msg := classifyTranscriptError(err)
		writeError(w, status, msg)
		return
	}

	videoModel := &db.Video{
		YouTubeID: metadata.ID,
		Title:     metadata.Title,
		Channel:   metadata.Author,
		Duration:  int(metadata.Duration / time.Second),
	}

	if err := s.videoRepository.SaveVideo(r.Context(), videoModel); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to store video")
		return
	}

	dbSegments, apiLines := convertTranscriptLines(transcriptLines)
	transcriptModel := &db.Transcript{
		VideoID:  videoModel.ID,
		Language: lang,
		Content:  dbSegments,
	}

	if err := s.transcriptRepo.SaveTranscript(r.Context(), transcriptModel); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to store transcript")
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

func convertTranscriptLines(lines []services.TranscriptLine) (db.TranscriptSegments, []TranscriptLine) {
	dbSegments := make(db.TranscriptSegments, 0, len(lines))
	apiLines := make([]TranscriptLine, 0, len(lines))

	for _, line := range lines {
		startMs := line.Start.Milliseconds()
		durationMs := line.Duration.Milliseconds()
		dbSegments = append(dbSegments, db.TranscriptSegment{
			StartMs:    startMs,
			DurationMs: durationMs,
			Text:       strings.TrimSpace(line.Text),
		})
		apiLines = append(apiLines, TranscriptLine{
			Start:    startMs,
			Duration: durationMs,
			Text:     strings.TrimSpace(line.Text),
		})
	}

	return dbSegments, apiLines
}

func classifyMetadataError(err error) (int, string) {
	message := err.Error()
	switch {
	case strings.Contains(message, "extract video id"):
		return http.StatusBadRequest, "invalid video url"
	case strings.Contains(message, "fetch video metadata"):
		return http.StatusNotFound, "video not found"
	default:
		return http.StatusInternalServerError, "failed to fetch video metadata"
	}
}

func classifyTranscriptError(err error) (int, string) {
	if errors.Is(err, youtube.ErrTranscriptDisabled) {
		return http.StatusNotFound, "transcript not available"
	}

	message := err.Error()
	switch {
	case strings.Contains(message, "transcript not available"),
		strings.Contains(message, "transcript empty"),
		strings.Contains(message, "fetch transcript"):
		return http.StatusNotFound, "transcript not available"
	default:
		return http.StatusInternalServerError, "failed to fetch transcript"
	}
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, errorResponse{Error: message})
}
