package api

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/yourusername/yt-transcript-downloader/internal/db"
	"github.com/yourusername/yt-transcript-downloader/internal/services"
)

type stubQAAIService struct {
	answer *services.AIAnswer
	err    error
	calls  int
}

func (s *stubQAAIService) Summarize(ctx context.Context, text string, summaryType string) (*services.AISummary, error) {
	return &services.AISummary{}, nil
}

func (s *stubQAAIService) Extract(ctx context.Context, text string, extractionType string) (*services.AIExtraction, error) {
	return &services.AIExtraction{}, nil
}

func (s *stubQAAIService) Answer(ctx context.Context, text string, question string) (*services.AIAnswer, error) {
	s.calls++
	if s.err != nil {
		return nil, s.err
	}
	return s.answer, nil
}

func TestHandleTranscriptQA_Success(t *testing.T) {
	cfg := mockConfig()
	cfg.AIProvider = "openai"

	database := &mockDB{}
	transcriptRepo := newInMemoryTranscriptRepo()
	aiSvc := &stubQAAIService{
		answer: &services.AIAnswer{
			Answer:     "The main topic is implementing CI/CD pipelines.",
			Confidence: "high",
			Sources:    []string{"Today we're learning CI/CD", "Automated pipelines are essential"},
			NotFound:   false,
			Model:      "gpt-4",
			TokensUsed: 680,
		},
	}

	transcriptID := "transcript-123"
	transcriptRepo.transcripts[transcriptID] = &db.Transcript{
		ID:        transcriptID,
		VideoID:   "video-1",
		Language:  "en",
		Content:   db.TranscriptSegments{{StartMs: 0, DurationMs: 1000, Text: "Today we're learning about CI/CD pipelines. Automated pipelines are essential for modern development."}},
		CreatedAt: time.Now(),
	}

	server, err := NewServer(cfg, database, noopYouTubeService{}, noopVideoRepo{}, transcriptRepo, aiSvc, newInMemoryAISummaryRepo(), newInMemoryAIExtractionRepo())
	require.NoError(t, err)

	body := []byte(`{"question":"What is the main topic?"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/"+transcriptID+"/qa", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, aiSvc.calls)

	var resp qaResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, transcriptID, resp.TranscriptID)
	assert.Equal(t, "What is the main topic?", resp.Question)
	assert.Equal(t, "The main topic is implementing CI/CD pipelines.", resp.Answer)
	assert.Equal(t, "high", resp.Confidence)
	assert.False(t, resp.NotFound)
	assert.Len(t, resp.Sources, 2)
	assert.Equal(t, "gpt-4", resp.Model)
	assert.Equal(t, 680, resp.TokensUsed)
	assert.NotEmpty(t, resp.ID)
	assert.NotZero(t, resp.CreatedAt)
}

func TestHandleTranscriptQA_NotFound(t *testing.T) {
	cfg := mockConfig()
	cfg.AIProvider = "openai"

	database := &mockDB{}
	transcriptRepo := newInMemoryTranscriptRepo()
	aiSvc := &stubQAAIService{
		answer: &services.AIAnswer{
			Answer:     "This information is not mentioned in the transcript.",
			Confidence: "high",
			Sources:    []string{},
			NotFound:   true,
			Model:      "gpt-4",
			TokensUsed: 420,
		},
	}

	transcriptID := "transcript-123"
	transcriptRepo.transcripts[transcriptID] = &db.Transcript{
		ID:        transcriptID,
		VideoID:   "video-1",
		Language:  "en",
		Content:   db.TranscriptSegments{{StartMs: 0, DurationMs: 1000, Text: "This is about programming."}},
		CreatedAt: time.Now(),
	}

	server, err := NewServer(cfg, database, noopYouTubeService{}, noopVideoRepo{}, transcriptRepo, aiSvc, newInMemoryAISummaryRepo(), newInMemoryAIExtractionRepo())
	require.NoError(t, err)

	body := []byte(`{"question":"What is the speaker's favorite color?"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/"+transcriptID+"/qa", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)

	var resp qaResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Contains(t, resp.Answer, "not mentioned")
	assert.Equal(t, "high", resp.Confidence)
	assert.True(t, resp.NotFound)
	assert.Empty(t, resp.Sources)
	assert.Equal(t, 420, resp.TokensUsed)
}

func TestHandleTranscriptQA_EmptyQuestion(t *testing.T) {
	cfg := mockConfig()
	database := &mockDB{}
	transcriptRepo := newInMemoryTranscriptRepo()
	aiSvc := &stubQAAIService{}

	transcriptID := "transcript-123"
	transcriptRepo.transcripts[transcriptID] = &db.Transcript{
		ID:       transcriptID,
		VideoID:  "video-1",
		Language: "en",
		Content:  db.TranscriptSegments{{StartMs: 0, DurationMs: 1000, Text: "Sample text"}},
	}

	server, err := NewServer(cfg, database, noopYouTubeService{}, noopVideoRepo{}, transcriptRepo, aiSvc, newInMemoryAISummaryRepo(), newInMemoryAIExtractionRepo())
	require.NoError(t, err)

	body := []byte(`{"question":""}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/"+transcriptID+"/qa", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
	assert.Equal(t, 0, aiSvc.calls)

	var errResp ErrorResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&errResp))
	assert.Contains(t, errResp.Error, "question is required")
}

func TestHandleTranscriptQA_QuestionTooShort(t *testing.T) {
	cfg := mockConfig()
	database := &mockDB{}
	transcriptRepo := newInMemoryTranscriptRepo()
	aiSvc := &stubQAAIService{}

	transcriptID := "transcript-123"
	transcriptRepo.transcripts[transcriptID] = &db.Transcript{
		ID:       transcriptID,
		VideoID:  "video-1",
		Language: "en",
		Content:  db.TranscriptSegments{{StartMs: 0, DurationMs: 1000, Text: "Sample text"}},
	}

	server, err := NewServer(cfg, database, noopYouTubeService{}, noopVideoRepo{}, transcriptRepo, aiSvc, newInMemoryAISummaryRepo(), newInMemoryAIExtractionRepo())
	require.NoError(t, err)

	body := []byte(`{"question":"Hi"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/"+transcriptID+"/qa", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
	assert.Equal(t, 0, aiSvc.calls)

	var errResp ErrorResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&errResp))
	assert.Contains(t, errResp.Error, "at least 3 characters")
}

func TestHandleTranscriptQA_QuestionTooLong(t *testing.T) {
	cfg := mockConfig()
	database := &mockDB{}
	transcriptRepo := newInMemoryTranscriptRepo()
	aiSvc := &stubQAAIService{}

	transcriptID := "transcript-123"
	transcriptRepo.transcripts[transcriptID] = &db.Transcript{
		ID:       transcriptID,
		VideoID:  "video-1",
		Language: "en",
		Content:  db.TranscriptSegments{{StartMs: 0, DurationMs: 1000, Text: "Sample text"}},
	}

	server, err := NewServer(cfg, database, noopYouTubeService{}, noopVideoRepo{}, transcriptRepo, aiSvc, newInMemoryAISummaryRepo(), newInMemoryAIExtractionRepo())
	require.NoError(t, err)

	// Create a question that's 501 characters long
	longQuestion := strings.Repeat("a", 501)
	body := []byte(`{"question":"` + longQuestion + `"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/"+transcriptID+"/qa", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusRequestEntityTooLarge, rec.Code)
	assert.Equal(t, 0, aiSvc.calls)

	var errResp ErrorResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&errResp))
	assert.Contains(t, errResp.Error, "500 characters or less")
}

func TestHandleTranscriptQA_TranscriptNotFound(t *testing.T) {
	cfg := mockConfig()
	database := &mockDB{}
	transcriptRepo := newInMemoryTranscriptRepo()
	aiSvc := &stubQAAIService{}

	server, err := NewServer(cfg, database, noopYouTubeService{}, noopVideoRepo{}, transcriptRepo, aiSvc, newInMemoryAISummaryRepo(), newInMemoryAIExtractionRepo())
	require.NoError(t, err)

	body := []byte(`{"question":"What is this about?"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/nonexistent/qa", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusNotFound, rec.Code)
	assert.Equal(t, 0, aiSvc.calls)

	var errResp ErrorResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&errResp))
	assert.Contains(t, errResp.Error, "not found")
}

func TestHandleTranscriptQA_EmptyTranscript(t *testing.T) {
	cfg := mockConfig()
	database := &mockDB{}
	transcriptRepo := newInMemoryTranscriptRepo()
	aiSvc := &stubQAAIService{}

	transcriptID := "transcript-123"
	transcriptRepo.transcripts[transcriptID] = &db.Transcript{
		ID:       transcriptID,
		VideoID:  "video-1",
		Language: "en",
		Content:  db.TranscriptSegments{}, // Empty content
	}

	server, err := NewServer(cfg, database, noopYouTubeService{}, noopVideoRepo{}, transcriptRepo, aiSvc, newInMemoryAISummaryRepo(), newInMemoryAIExtractionRepo())
	require.NoError(t, err)

	body := []byte(`{"question":"What is this about?"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/"+transcriptID+"/qa", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusNotFound, rec.Code)
	assert.Equal(t, 0, aiSvc.calls)

	var errResp ErrorResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&errResp))
	assert.Contains(t, errResp.Error, "empty or unavailable")
}

func TestHandleTranscriptQA_AIServiceError(t *testing.T) {
	cfg := mockConfig()
	database := &mockDB{}
	transcriptRepo := newInMemoryTranscriptRepo()
	aiSvc := &stubQAAIService{
		err: services.ErrAIRateLimited,
	}

	transcriptID := "transcript-123"
	transcriptRepo.transcripts[transcriptID] = &db.Transcript{
		ID:       transcriptID,
		VideoID:  "video-1",
		Language: "en",
		Content:  db.TranscriptSegments{{StartMs: 0, DurationMs: 1000, Text: "Sample text"}},
	}

	server, err := NewServer(cfg, database, noopYouTubeService{}, noopVideoRepo{}, transcriptRepo, aiSvc, newInMemoryAISummaryRepo(), newInMemoryAIExtractionRepo())
	require.NoError(t, err)

	body := []byte(`{"question":"What is this about?"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/"+transcriptID+"/qa", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusTooManyRequests, rec.Code)
	assert.Equal(t, 1, aiSvc.calls)

	var errResp ErrorResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&errResp))
	assert.Contains(t, errResp.Error, "rate limit")
}

func TestHandleTranscriptQA_InvalidJSON(t *testing.T) {
	cfg := mockConfig()
	database := &mockDB{}
	transcriptRepo := newInMemoryTranscriptRepo()
	aiSvc := &stubQAAIService{}

	transcriptID := "transcript-123"
	transcriptRepo.transcripts[transcriptID] = &db.Transcript{
		ID:       transcriptID,
		VideoID:  "video-1",
		Language: "en",
		Content:  db.TranscriptSegments{{StartMs: 0, DurationMs: 1000, Text: "Sample text"}},
	}

	server, err := NewServer(cfg, database, noopYouTubeService{}, noopVideoRepo{}, transcriptRepo, aiSvc, newInMemoryAISummaryRepo(), newInMemoryAIExtractionRepo())
	require.NoError(t, err)

	body := []byte(`{invalid json}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/"+transcriptID+"/qa", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
	assert.Equal(t, 0, aiSvc.calls)

	var errResp ErrorResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&errResp))
	assert.Contains(t, errResp.Error, "Invalid JSON")
}

func TestHandleTranscriptQA_ServiceUnavailable(t *testing.T) {
	cfg := mockConfig()
	database := &mockDB{}
	transcriptRepo := newInMemoryTranscriptRepo()
	aiSvc := &stubQAAIService{
		err: services.ErrAIServiceUnavailable,
	}

	transcriptID := "transcript-123"
	transcriptRepo.transcripts[transcriptID] = &db.Transcript{
		ID:       transcriptID,
		VideoID:  "video-1",
		Language: "en",
		Content:  db.TranscriptSegments{{StartMs: 0, DurationMs: 1000, Text: "Sample text"}},
	}

	server, err := NewServer(cfg, database, noopYouTubeService{}, noopVideoRepo{}, transcriptRepo, aiSvc, newInMemoryAISummaryRepo(), newInMemoryAIExtractionRepo())
	require.NoError(t, err)

	body := []byte(`{"question":"What is this about?"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/"+transcriptID+"/qa", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusServiceUnavailable, rec.Code)

	var errResp ErrorResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&errResp))
	assert.Contains(t, errResp.Error, "unavailable")
}

func TestHandleTranscriptQA_WithMultipleSources(t *testing.T) {
	cfg := mockConfig()
	database := &mockDB{}
	transcriptRepo := newInMemoryTranscriptRepo()
	aiSvc := &stubQAAIService{
		answer: &services.AIAnswer{
			Answer:     "There are three main benefits: performance, cost reduction, and enhanced security.",
			Confidence: "high",
			Sources: []string{
				"First, it improves performance",
				"Second, it reduces costs",
				"Third, it enhances security",
			},
			NotFound:   false,
			Model:      "gpt-4",
			TokensUsed: 720,
		},
	}

	transcriptID := "transcript-123"
	transcriptRepo.transcripts[transcriptID] = &db.Transcript{
		ID:       transcriptID,
		VideoID:  "video-1",
		Language: "en",
		Content:  db.TranscriptSegments{{StartMs: 0, DurationMs: 1000, Text: "First, it improves performance. Second, it reduces costs. Third, it enhances security."}},
	}

	server, err := NewServer(cfg, database, noopYouTubeService{}, noopVideoRepo{}, transcriptRepo, aiSvc, newInMemoryAISummaryRepo(), newInMemoryAIExtractionRepo())
	require.NoError(t, err)

	body := []byte(`{"question":"What are the benefits?"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/"+transcriptID+"/qa", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)

	var resp qaResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Len(t, resp.Sources, 3)
	assert.Contains(t, resp.Sources[0], "performance")
	assert.Contains(t, resp.Sources[1], "costs")
	assert.Contains(t, resp.Sources[2], "security")
}

func TestHandleTranscriptQA_MissingTranscriptID(t *testing.T) {
	cfg := mockConfig()
	database := &mockDB{}
	transcriptRepo := newInMemoryTranscriptRepo()
	aiSvc := &stubQAAIService{}

	server, err := NewServer(cfg, database, noopYouTubeService{}, noopVideoRepo{}, transcriptRepo, aiSvc, newInMemoryAISummaryRepo(), newInMemoryAIExtractionRepo())
	require.NoError(t, err)

	body := []byte(`{"question":"What is this about?"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts//qa", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	// Empty transcript ID triggers 400 error
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}
