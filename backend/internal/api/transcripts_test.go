package api

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/yourusername/yt-transcript-downloader/internal/config"
	"github.com/yourusername/yt-transcript-downloader/internal/services"
)

func TestHandleFetchTranscript_Success(t *testing.T) {
	const sampleVideoID = "dQw4w9WgXcQ"

	cfg := &config.Config{APIPort: 8080}
	database := &mockDB{}

	youTube := &fakeYouTubeService{
		meta: &services.VideoMetadata{
			ID:       sampleVideoID,
			Title:    "Sample Title",
			Author:   "Sample Channel",
			Duration: 5 * time.Minute,
		},
		transcript: []services.TranscriptLine{
			{Start: 0, Duration: time.Second, Text: "Hello"},
			{Start: 2 * time.Second, Duration: 1500 * time.Millisecond, Text: "World"},
		},
	}
	videoRepo := &recordingVideoRepo{}
	transcriptRepo := &recordingTranscriptRepo{}

	server, err := NewServer(cfg, database, youTube, videoRepo, transcriptRepo)
	require.NoError(t, err)

	payload := TranscriptRequest{
		VideoURL: "https://youtu.be/" + sampleVideoID,
	}
	body, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/fetch", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	require.Len(t, videoRepo.saved, 1)
	require.Len(t, transcriptRepo.saved, 1)
	assert.Equal(t, sampleVideoID, youTube.lastTransVideo)
	assert.Equal(t, defaultTranscriptLanguage, youTube.lastLanguage)
	assert.Equal(t, videoRepo.saved[0].ID, transcriptRepo.saved[0].VideoID)

	var resp TranscriptResponse
	err = json.NewDecoder(rec.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Equal(t, sampleVideoID, resp.VideoID)
	assert.Equal(t, "Sample Title", resp.Title)
	assert.Equal(t, defaultTranscriptLanguage, resp.Language)
	require.Len(t, resp.Transcript, 2)
	assert.Equal(t, int64(0), resp.Transcript[0].Start)
	assert.Equal(t, int64(1000), resp.Transcript[0].Duration)
	assert.Equal(t, "Hello", resp.Transcript[0].Text)
	assert.Equal(t, int64(2000), resp.Transcript[1].Start)
	assert.Equal(t, int64(1500), resp.Transcript[1].Duration)
}

func TestHandleFetchTranscript_InvalidRequest(t *testing.T) {
	cfg := &config.Config{APIPort: 8080}
	database := &mockDB{}
	server, err := NewServer(cfg, database, &fakeYouTubeService{}, &recordingVideoRepo{}, &recordingTranscriptRepo{})
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/fetch", bytes.NewReader([]byte(`{"video_url":""}`)))
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
	var resp ErrorResponse
	err = json.NewDecoder(rec.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Equal(t, "video_url is required", resp.Error)
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
}

func TestHandleFetchTranscript_MissingTranscript(t *testing.T) {
	const sampleVideoID = "dQw4w9WgXcQ"

	cfg := &config.Config{APIPort: 8080}
	database := &mockDB{}
	youTube := &fakeYouTubeService{
		meta:          &services.VideoMetadata{ID: sampleVideoID},
		transcriptErr: services.ErrTranscriptUnavailable,
	}
	videoRepo := &recordingVideoRepo{}
	transcriptRepo := &recordingTranscriptRepo{}

	server, err := NewServer(cfg, database, youTube, videoRepo, transcriptRepo)
	require.NoError(t, err)

	body, err := json.Marshal(TranscriptRequest{VideoURL: "https://youtu.be/" + sampleVideoID})
	require.NoError(t, err)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/fetch", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusNotFound, rec.Code)
	assert.Empty(t, videoRepo.saved)
	var resp ErrorResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, "Transcript is empty or unavailable", resp.Error)
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)
}

func TestHandleFetchTranscript_DatabaseFailure(t *testing.T) {
	const sampleVideoID = "dQw4w9WgXcQ"

	cfg := &config.Config{APIPort: 8080}
	database := &mockDB{}
	youTube := &fakeYouTubeService{
		meta: &services.VideoMetadata{
			ID:       sampleVideoID,
			Title:    "Sample",
			Author:   "Channel",
			Duration: time.Minute,
		},
		transcript: []services.TranscriptLine{
			{Start: 0, Duration: time.Second, Text: "hello"},
		},
	}
	videoRepo := &recordingVideoRepo{err: errors.New("write failed")}
	transcriptRepo := &recordingTranscriptRepo{}

	server, err := NewServer(cfg, database, youTube, videoRepo, transcriptRepo)
	require.NoError(t, err)

	body, err := json.Marshal(TranscriptRequest{VideoURL: "https://youtu.be/" + sampleVideoID})
	require.NoError(t, err)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/fetch", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusInternalServerError, rec.Code)
	var resp ErrorResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, "Failed to store video", resp.Error)
	assert.Empty(t, transcriptRepo.saved)
}
