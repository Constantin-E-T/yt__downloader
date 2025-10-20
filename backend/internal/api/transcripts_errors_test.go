package api

import (
	"bytes"
	"context"
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

func TestHandleFetchTranscript_InvalidJSON(t *testing.T) {
	server := testServer(t, &fakeYouTubeService{}, &recordingVideoRepo{}, &recordingTranscriptRepo{})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/fetch", bytes.NewReader([]byte(`{"video_url":`)))
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
	var resp ErrorResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, "Invalid JSON request body", resp.Error)
}

func TestHandleFetchTranscript_InvalidURL(t *testing.T) {
	server := testServer(t, &fakeYouTubeService{}, &recordingVideoRepo{}, &recordingTranscriptRepo{})

	body, _ := json.Marshal(TranscriptRequest{VideoURL: "https://example.com/watch?v=123"})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/fetch", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
	var resp ErrorResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Contains(t, resp.Error, "Invalid video URL")
}

func TestHandleFetchTranscript_InvalidLanguage(t *testing.T) {
	server := testServer(t, &fakeYouTubeService{}, &recordingVideoRepo{}, &recordingTranscriptRepo{})

	body, _ := json.Marshal(TranscriptRequest{VideoURL: "dQw4w9WgXcQ", Language: "toolong"})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/fetch", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
	var resp ErrorResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Contains(t, resp.Error, "Invalid language")
}

func TestHandleFetchTranscript_VideoNotFound(t *testing.T) {
	const sampleVideoID = "dQw4w9WgXcQ"

	yt := &fakeYouTubeService{metaErr: services.ErrVideoNotFound}
	server := testServer(t, yt, &recordingVideoRepo{}, &recordingTranscriptRepo{})

	body, _ := json.Marshal(TranscriptRequest{VideoURL: sampleVideoID})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/fetch", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusNotFound, rec.Code)
	var resp ErrorResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, "Video not found", resp.Error)
}

func TestHandleFetchTranscript_Timeout(t *testing.T) {
	const sampleVideoID = "dQw4w9WgXcQ"

	yt := &fakeYouTubeService{metaErr: context.DeadlineExceeded}
	server := testServer(t, yt, &recordingVideoRepo{}, &recordingTranscriptRepo{})

	body, _ := json.Marshal(TranscriptRequest{VideoURL: sampleVideoID})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/fetch", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusGatewayTimeout, rec.Code)
	var resp ErrorResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, "Request timed out while fetching video metadata", resp.Error)
}

func TestHandleFetchTranscript_TranscriptRepoFailure(t *testing.T) {
	const sampleVideoID = "dQw4w9WgXcQ"

	cfg := &config.Config{APIPort: 8080}
	database := &mockDB{}
	youTube := &fakeYouTubeService{
		meta: &services.VideoMetadata{
			ID:       sampleVideoID,
			Title:    "Example",
			Author:   "Channel",
			Duration: time.Minute,
		},
		transcript: []services.TranscriptLine{
			{Start: 0, Duration: time.Second, Text: "hello"},
		},
	}
	videoRepo := &recordingVideoRepo{}
	transcriptRepo := &recordingTranscriptRepo{err: errors.New("insert failed")}

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
	assert.Equal(t, "Failed to store transcript", resp.Error)
}

func TestHandleFetchTranscript_TranscriptErrorInternal(t *testing.T) {
	const sampleVideoID = "dQw4w9WgXcQ"

	yt := &fakeYouTubeService{
		meta:          &services.VideoMetadata{ID: sampleVideoID},
		transcriptErr: errors.New("unexpected failure"),
	}
	server := testServer(t, yt, &recordingVideoRepo{}, &recordingTranscriptRepo{})

	body, _ := json.Marshal(TranscriptRequest{VideoURL: "https://youtu.be/" + sampleVideoID})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/fetch", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusInternalServerError, rec.Code)
	var resp ErrorResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, "Failed to fetch transcript", resp.Error)
}

func testServer(t *testing.T, yt youtubeService, videoRepo videoRepository, transcriptRepo transcriptRepository) *Server {
	t.Helper()

	cfg := &config.Config{APIPort: 8080}
	server, err := NewServer(cfg, &mockDB{}, yt, videoRepo, transcriptRepo)
	require.NoError(t, err)
	return server
}
