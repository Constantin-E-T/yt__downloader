package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/yourusername/yt-transcript-downloader/internal/config"
	"github.com/yourusername/yt-transcript-downloader/internal/db"
)

func TestHandleExportTranscript_JSON(t *testing.T) {
	cfg := &config.Config{APIPort: 8080}
	database := &mockDB{}

	videoRepo := &recordingVideoRepo{}
	videoRepo.saved = append(videoRepo.saved, &db.Video{
		ID:        "video-uuid",
		YouTubeID: "dQw4w9WgXcQ",
		Title:     "Sample Title",
		Channel:   "Sample Channel",
	})

	transcriptRepo := &recordingTranscriptRepo{}
	transcriptRepo.saved = append(transcriptRepo.saved, &db.Transcript{
		ID:       "transcript-uuid",
		VideoID:  "video-uuid",
		Language: "en",
		Content: db.TranscriptSegments{
			{StartMs: 0, DurationMs: 1000, Text: "Hello world"},
		},
	})

	server, err := NewServer(cfg, database, noopYouTubeService{}, videoRepo, transcriptRepo, noopAIService{}, noopAISummaryRepo{}, noopAIExtractionRepo{})
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/transcripts/transcript-uuid/export?format=json", nil)
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "application/json", rec.Header().Get("Content-Type"))
	assert.Contains(t, rec.Header().Get("Content-Disposition"), ".json")

	var resp TranscriptResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, "transcript-uuid", resp.TranscriptID)
	assert.Equal(t, "dQw4w9WgXcQ", resp.VideoID)
	assert.Equal(t, "Sample Title", resp.Title)
	require.Len(t, resp.Transcript, 1)
	assert.Equal(t, "Hello world", resp.Transcript[0].Text)
}

func TestHandleExportTranscript_Text(t *testing.T) {
	cfg := &config.Config{APIPort: 8080}
	database := &mockDB{}

	videoRepo := &recordingVideoRepo{}
	videoRepo.saved = append(videoRepo.saved, &db.Video{
		ID:        "video-uuid",
		YouTubeID: "dQw4w9WgXcQ",
		Title:     "Sample Title",
	})

	transcriptRepo := &recordingTranscriptRepo{}
	transcriptRepo.saved = append(transcriptRepo.saved, &db.Transcript{
		ID:       "transcript-uuid",
		VideoID:  "video-uuid",
		Language: "en",
		Content: db.TranscriptSegments{
			{StartMs: 0, DurationMs: 1500, Text: "First line"},
			{StartMs: 5000, DurationMs: 1200, Text: "Second line"},
		},
	})

	server, err := NewServer(cfg, database, noopYouTubeService{}, videoRepo, transcriptRepo, noopAIService{}, noopAISummaryRepo{}, noopAIExtractionRepo{})
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/transcripts/transcript-uuid/export?format=text", nil)
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "text/plain; charset=utf-8", rec.Header().Get("Content-Type"))
	assert.Contains(t, rec.Header().Get("Content-Disposition"), ".txt")

	body := rec.Body.String()
	assert.Contains(t, body, "Sample Title")
	assert.Contains(t, body, "https://youtube.com/watch?v=dQw4w9WgXcQ")
	assert.Contains(t, body, "[00:00:00] First line")
	assert.Contains(t, body, "[00:00:05] Second line")
}

func TestHandleExportTranscript_InvalidFormat(t *testing.T) {
	cfg := &config.Config{APIPort: 8080}
	database := &mockDB{}

	videoRepo := &recordingVideoRepo{}
	transcriptRepo := &recordingTranscriptRepo{}

	server, err := NewServer(cfg, database, noopYouTubeService{}, videoRepo, transcriptRepo, noopAIService{}, noopAISummaryRepo{}, noopAIExtractionRepo{})
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/transcripts/transcript-uuid/export?format=xml", nil)
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
	var errResp ErrorResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&errResp))
	assert.Equal(t, "Unsupported export format. Use json or text.", errResp.Error)
	assert.Equal(t, http.StatusBadRequest, errResp.StatusCode)
}

func TestHandleExportTranscript_NotFound(t *testing.T) {
	cfg := &config.Config{APIPort: 8080}
	database := &mockDB{}

	videoRepo := &recordingVideoRepo{}
	transcriptRepo := &recordingTranscriptRepo{}

	server, err := NewServer(cfg, database, noopYouTubeService{}, videoRepo, transcriptRepo, noopAIService{}, noopAISummaryRepo{}, noopAIExtractionRepo{})
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/transcripts/missing/export?format=json", nil)
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusNotFound, rec.Code)
	var errResp ErrorResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&errResp))
	assert.Equal(t, "Transcript not found", errResp.Error)
}
