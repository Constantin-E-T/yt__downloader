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

	youtube "github.com/kkdai/youtube/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/yourusername/yt-transcript-downloader/internal/config"
	"github.com/yourusername/yt-transcript-downloader/internal/db"
	"github.com/yourusername/yt-transcript-downloader/internal/services"
)

type fakeYouTubeService struct {
	meta           *services.VideoMetadata
	metaErr        error
	transcript     []services.TranscriptLine
	transcriptErr  error
	lastMetaInput  string
	lastTransVideo string
	lastLanguage   string
}

func (f *fakeYouTubeService) GetVideoMetadata(videoID string) (*services.VideoMetadata, error) {
	f.lastMetaInput = videoID
	if f.metaErr != nil {
		return nil, f.metaErr
	}
	return f.meta, nil
}

func (f *fakeYouTubeService) GetTranscript(videoID, language string) ([]services.TranscriptLine, error) {
	f.lastTransVideo = videoID
	f.lastLanguage = language
	if f.transcriptErr != nil {
		return nil, f.transcriptErr
	}
	return f.transcript, nil
}

type recordingVideoRepo struct {
	saved []*db.Video
	err   error
}

func (r *recordingVideoRepo) SaveVideo(_ context.Context, video *db.Video) error {
	if r.err != nil {
		return r.err
	}
	if video.ID == "" {
		video.ID = "video-uuid"
	}
	video.CreatedAt = time.Now()
	clone := *video
	r.saved = append(r.saved, &clone)
	return nil
}

type recordingTranscriptRepo struct {
	saved []*db.Transcript
	err   error
}

func (r *recordingTranscriptRepo) SaveTranscript(_ context.Context, transcript *db.Transcript) error {
	if r.err != nil {
		return r.err
	}
	if transcript.ID == "" {
		transcript.ID = "transcript-uuid"
	}
	transcript.CreatedAt = time.Now()
	clone := *transcript
	r.saved = append(r.saved, &clone)
	return nil
}

func TestHandleFetchTranscript_Success(t *testing.T) {
	cfg := &config.Config{APIPort: 8080}
	database := &mockDB{}

	youTube := &fakeYouTubeService{
		meta: &services.VideoMetadata{
			ID:       "abc123",
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
		VideoURL: "https://youtu.be/abc123",
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
	assert.Equal(t, "abc123", youTube.lastTransVideo)
	assert.Equal(t, defaultTranscriptLanguage, youTube.lastLanguage)
	assert.Equal(t, videoRepo.saved[0].ID, transcriptRepo.saved[0].VideoID)

	var resp TranscriptResponse
	err = json.NewDecoder(rec.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Equal(t, "abc123", resp.VideoID)
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
	var resp errorResponse
	err = json.NewDecoder(rec.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Contains(t, resp.Error, "video_url")
}

func TestHandleFetchTranscript_MissingTranscript(t *testing.T) {
	cfg := &config.Config{APIPort: 8080}
	database := &mockDB{}
	youTube := &fakeYouTubeService{
		meta:          &services.VideoMetadata{ID: "abc123"},
		transcriptErr: youtube.ErrTranscriptDisabled,
	}
	videoRepo := &recordingVideoRepo{}
	transcriptRepo := &recordingTranscriptRepo{}

	server, err := NewServer(cfg, database, youTube, videoRepo, transcriptRepo)
	require.NoError(t, err)

	body, err := json.Marshal(TranscriptRequest{VideoURL: "https://youtu.be/abc123"})
	require.NoError(t, err)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/fetch", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusNotFound, rec.Code)
	assert.Empty(t, videoRepo.saved)
	var resp errorResponse
	err = json.NewDecoder(rec.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Contains(t, resp.Error, "transcript")
}

func TestHandleFetchTranscript_DatabaseFailure(t *testing.T) {
	cfg := &config.Config{APIPort: 8080}
	database := &mockDB{}
	youTube := &fakeYouTubeService{
		meta: &services.VideoMetadata{
			ID:       "abc123",
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

	body, err := json.Marshal(TranscriptRequest{VideoURL: "https://youtu.be/abc123"})
	require.NoError(t, err)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/fetch", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusInternalServerError, rec.Code)
	var resp errorResponse
	err = json.NewDecoder(rec.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Contains(t, resp.Error, "store video")
	assert.Empty(t, transcriptRepo.saved)
}

func TestHandleFetchTranscript_TranscriptRepoFailure(t *testing.T) {
	cfg := &config.Config{APIPort: 8080}
	database := &mockDB{}
	youTube := &fakeYouTubeService{
		meta: &services.VideoMetadata{
			ID:       "abc123",
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

	body, err := json.Marshal(TranscriptRequest{VideoURL: "https://youtu.be/abc123"})
	require.NoError(t, err)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/fetch", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusInternalServerError, rec.Code)
	var resp errorResponse
	err = json.NewDecoder(rec.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Contains(t, resp.Error, "store transcript")
}

func TestHandleFetchTranscript_MetadataInvalidURL(t *testing.T) {
	cfg := &config.Config{APIPort: 8080}
	database := &mockDB{}
	youTube := &fakeYouTubeService{
		metaErr: errors.New("extract video id: invalid"),
	}

	server, err := NewServer(cfg, database, youTube, &recordingVideoRepo{}, &recordingTranscriptRepo{})
	require.NoError(t, err)

	body, err := json.Marshal(TranscriptRequest{VideoURL: ""})
	require.NoError(t, err)
	// Force non-empty payload but invalid url via metadata call
	body, err = json.Marshal(TranscriptRequest{VideoURL: "invalid"})
	require.NoError(t, err)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/fetch", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
	var resp errorResponse
	err = json.NewDecoder(rec.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Contains(t, resp.Error, "invalid video url")
}

func TestHandleFetchTranscript_TranscriptErrorInternal(t *testing.T) {
	cfg := &config.Config{APIPort: 8080}
	database := &mockDB{}
	youTube := &fakeYouTubeService{
		meta:          &services.VideoMetadata{ID: "abc123"},
		transcriptErr: errors.New("unexpected failure"),
	}

	server, err := NewServer(cfg, database, youTube, &recordingVideoRepo{}, &recordingTranscriptRepo{})
	require.NoError(t, err)

	body, err := json.Marshal(TranscriptRequest{VideoURL: "https://youtu.be/abc123"})
	require.NoError(t, err)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/fetch", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusInternalServerError, rec.Code)
	var resp errorResponse
	err = json.NewDecoder(rec.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Contains(t, resp.Error, "failed to fetch transcript")
}
