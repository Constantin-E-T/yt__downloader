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

	"github.com/go-chi/chi/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/yourusername/yt-transcript-downloader/internal/config"
	"github.com/yourusername/yt-transcript-downloader/internal/db"
	"github.com/yourusername/yt-transcript-downloader/internal/services"
)

type stubExtractionAIService struct {
	extraction *services.AIExtraction
	err        error
	calls      int
}

func (s *stubExtractionAIService) Summarize(ctx context.Context, text string, summaryType string) (*services.AISummary, error) {
	return nil, nil
}

func (s *stubExtractionAIService) Extract(ctx context.Context, text string, extractionType string) (*services.AIExtraction, error) {
	s.calls++
	if s.err != nil {
		return nil, s.err
	}
	clone := *s.extraction
	clone.Type = extractionType
	return &clone, nil
}

func (s *stubExtractionAIService) Answer(ctx context.Context, text string, question string) (*services.AIAnswer, error) {
	return &services.AIAnswer{}, nil
}

type inMemoryAIExtractionRepo struct {
	store map[string]*db.AIExtraction
}

func newInMemoryAIExtractionRepo() *inMemoryAIExtractionRepo {
	return &inMemoryAIExtractionRepo{store: make(map[string]*db.AIExtraction)}
}

func (r *inMemoryAIExtractionRepo) CreateAIExtraction(ctx context.Context, extraction *db.AIExtraction) error {
	key := extraction.TranscriptID + ":" + extraction.ExtractionType
	if existing, ok := r.store[key]; ok {
		*extraction = *existing
		return nil
	}

	extraction.ID = "extraction-" + extraction.ExtractionType
	extraction.CreatedAt = time.Now().UTC()
	clone := *extraction
	r.store[key] = &clone
	return nil
}

func (r *inMemoryAIExtractionRepo) GetAIExtraction(ctx context.Context, transcriptID string, extractionType string) (*db.AIExtraction, error) {
	key := transcriptID + ":" + extractionType
	if extraction, ok := r.store[key]; ok {
		clone := *extraction
		return &clone, nil
	}
	return nil, db.ErrNotFound
}

func (r *inMemoryAIExtractionRepo) ListAIExtractions(ctx context.Context, transcriptID string) ([]*db.AIExtraction, error) {
	extractions := make([]*db.AIExtraction, 0)
	for key, extraction := range r.store {
		if strings.HasPrefix(key, transcriptID+":") {
			clone := *extraction
			extractions = append(extractions, &clone)
		}
	}
	return extractions, nil
}

func TestHandleExtractFromTranscript_Code(t *testing.T) {
	cfg := &config.Config{APIPort: 8080}

	aiService := &stubExtractionAIService{
		extraction: &services.AIExtraction{
			Items: []services.ExtractionItem{
				{
					Language:      "python",
					Code:          "print('hello world')",
					Context:       "Basic hello world",
					TimestampHint: "2:30",
				},
			},
			Model:      "gpt-4",
			TokensUsed: 520,
		},
	}

	transcriptRepo := newInMemoryTranscriptRepo()
	extractionRepo := newInMemoryAIExtractionRepo()

	transcriptID := "test-transcript-123"
	transcript := &db.Transcript{
		ID:       transcriptID,
		VideoID:  "video-123",
		Language: "en",
		Content: db.TranscriptSegments{
			{StartMs: 0, DurationMs: 1000, Text: "print hello world"},
		},
	}
	transcriptRepo.transcripts[transcriptID] = transcript

	server, err := NewServer(cfg, &mockDB{}, noopYouTubeService{}, noopVideoRepo{}, transcriptRepo, aiService, newInMemoryAISummaryRepo(), extractionRepo)
	require.NoError(t, err)

	reqBody := `{"extraction_type": "code"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/"+transcriptID+"/extract", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", transcriptID)
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	w := httptest.NewRecorder()
	server.handleExtractFromTranscript(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp extractionResponse
	err = json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err)

	assert.Equal(t, transcriptID, resp.TranscriptID)
	assert.Equal(t, "code", resp.ExtractionType)
	assert.Equal(t, "gpt-4", resp.Model)
	assert.Equal(t, 520, resp.TokensUsed)
	assert.Len(t, resp.Items, 1)

	assert.Equal(t, "python", resp.Items[0]["language"])
	assert.Equal(t, "print('hello world')", resp.Items[0]["code"])
	assert.Equal(t, 1, aiService.calls)
}

func TestHandleExtractFromTranscript_Quotes(t *testing.T) {
	cfg := &config.Config{APIPort: 8080}

	aiService := &stubExtractionAIService{
		extraction: &services.AIExtraction{
			Items: []services.ExtractionItem{
				{
					Quote:      "Code is read far more often than it is written",
					Speaker:    "Guido van Rossum",
					Context:    "Discussing readable code",
					Importance: "high",
				},
			},
			Model:      "gpt-4",
			TokensUsed: 385,
		},
	}

	transcriptRepo := newInMemoryTranscriptRepo()
	extractionRepo := newInMemoryAIExtractionRepo()

	transcriptID := "test-transcript-456"
	transcript := &db.Transcript{
		ID:       transcriptID,
		VideoID:  "video-456",
		Language: "en",
		Content: db.TranscriptSegments{
			{StartMs: 0, DurationMs: 1000, Text: "Some quote"},
		},
	}
	transcriptRepo.transcripts[transcriptID] = transcript

	server, err := NewServer(cfg, &mockDB{}, noopYouTubeService{}, noopVideoRepo{}, transcriptRepo, aiService, newInMemoryAISummaryRepo(), extractionRepo)
	require.NoError(t, err)

	reqBody := `{"extraction_type": "quotes"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/"+transcriptID+"/extract", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", transcriptID)
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	w := httptest.NewRecorder()
	server.handleExtractFromTranscript(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp extractionResponse
	err = json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err)

	assert.Equal(t, "quotes", resp.ExtractionType)
	assert.Len(t, resp.Items, 1)
	assert.Equal(t, "Guido van Rossum", resp.Items[0]["speaker"])
	assert.Equal(t, "high", resp.Items[0]["importance"])
}

func TestHandleExtractFromTranscript_ActionItems(t *testing.T) {
	cfg := &config.Config{APIPort: 8080}

	aiService := &stubExtractionAIService{
		extraction: &services.AIExtraction{
			Items: []services.ExtractionItem{
				{
					Action:   "Set up CI/CD pipeline",
					Category: "task",
					Priority: "high",
					Context:  "Required for deployment",
				},
			},
			Model:      "gpt-4",
			TokensUsed: 445,
		},
	}

	transcriptRepo := newInMemoryTranscriptRepo()
	extractionRepo := newInMemoryAIExtractionRepo()

	transcriptID := "test-transcript-789"
	transcript := &db.Transcript{
		ID:       transcriptID,
		VideoID:  "video-789",
		Language: "en",
		Content: db.TranscriptSegments{
			{StartMs: 0, DurationMs: 1000, Text: "Setup CI/CD"},
		},
	}
	transcriptRepo.transcripts[transcriptID] = transcript

	server, err := NewServer(cfg, &mockDB{}, noopYouTubeService{}, noopVideoRepo{}, transcriptRepo, aiService, newInMemoryAISummaryRepo(), extractionRepo)
	require.NoError(t, err)

	reqBody := `{"extraction_type": "action_items"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/"+transcriptID+"/extract", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", transcriptID)
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	w := httptest.NewRecorder()
	server.handleExtractFromTranscript(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp extractionResponse
	err = json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err)

	assert.Equal(t, "action_items", resp.ExtractionType)
	assert.Len(t, resp.Items, 1)
	assert.Equal(t, "task", resp.Items[0]["category"])
	assert.Equal(t, "high", resp.Items[0]["priority"])
}

func TestHandleExtractFromTranscript_Cached(t *testing.T) {
	cfg := &config.Config{APIPort: 8080}

	aiService := &stubExtractionAIService{
		extraction: &services.AIExtraction{
			Items:      []services.ExtractionItem{{Code: "print('new')"}},
			Model:      "gpt-4-turbo",
			TokensUsed: 100,
		},
	}

	transcriptRepo := newInMemoryTranscriptRepo()
	extractionRepo := newInMemoryAIExtractionRepo()

	transcriptID := "cached-transcript"
	transcript := &db.Transcript{
		ID:       transcriptID,
		VideoID:  "video-cached",
		Language: "en",
		Content:  db.TranscriptSegments{{StartMs: 0, DurationMs: 1000, Text: "test"}},
	}
	transcriptRepo.transcripts[transcriptID] = transcript

	// Pre-populate cache
	cachedContent, _ := json.Marshal(map[string]interface{}{
		"items": []map[string]interface{}{
			{"code": "print('cached')", "language": "python"},
		},
	})
	extractionRepo.store[transcriptID+":code"] = &db.AIExtraction{
		ID:             "cached-extraction",
		TranscriptID:   transcriptID,
		ExtractionType: "code",
		Content:        cachedContent,
		Model:          "gpt-4",
		TokensUsed:     500,
		CreatedAt:      time.Now().UTC(),
	}

	server, err := NewServer(cfg, &mockDB{}, noopYouTubeService{}, noopVideoRepo{}, transcriptRepo, aiService, newInMemoryAISummaryRepo(), extractionRepo)
	require.NoError(t, err)

	reqBody := `{"extraction_type": "code"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/"+transcriptID+"/extract", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", transcriptID)
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	w := httptest.NewRecorder()
	server.handleExtractFromTranscript(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp extractionResponse
	err = json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err)

	// Should return cached version
	assert.Equal(t, "cached-extraction", resp.ID)
	assert.Equal(t, "gpt-4", resp.Model)
	assert.Equal(t, 500, resp.TokensUsed)
	assert.Equal(t, "print('cached')", resp.Items[0]["code"])

	// AI service should not be called
	assert.Equal(t, 0, aiService.calls)
}

func TestHandleExtractFromTranscript_InvalidType(t *testing.T) {
	cfg := &config.Config{APIPort: 8080}

	server, err := NewServer(cfg, &mockDB{}, noopYouTubeService{}, noopVideoRepo{}, newInMemoryTranscriptRepo(), &stubExtractionAIService{}, newInMemoryAISummaryRepo(), newInMemoryAIExtractionRepo())
	require.NoError(t, err)

	reqBody := `{"extraction_type": "invalid_type"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/test/extract", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "test")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	w := httptest.NewRecorder()
	server.handleExtractFromTranscript(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "invalid extraction_type")
}

func TestHandleExtractFromTranscript_TranscriptNotFound(t *testing.T) {
	cfg := &config.Config{APIPort: 8080}

	server, err := NewServer(cfg, &mockDB{}, noopYouTubeService{}, noopVideoRepo{}, newInMemoryTranscriptRepo(), &stubExtractionAIService{}, newInMemoryAISummaryRepo(), newInMemoryAIExtractionRepo())
	require.NoError(t, err)

	reqBody := `{"extraction_type": "code"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/nonexistent/extract", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "nonexistent")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	w := httptest.NewRecorder()
	server.handleExtractFromTranscript(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
	assert.Contains(t, w.Body.String(), "not found")
}

func TestHandleExtractFromTranscript_EmptyTranscript(t *testing.T) {
	cfg := &config.Config{APIPort: 8080}

	transcriptRepo := newInMemoryTranscriptRepo()
	transcriptID := "empty-transcript"
	transcript := &db.Transcript{
		ID:       transcriptID,
		VideoID:  "video-empty",
		Language: "en",
		Content:  db.TranscriptSegments{}, // Empty content
	}
	transcriptRepo.transcripts[transcriptID] = transcript

	server, err := NewServer(cfg, &mockDB{}, noopYouTubeService{}, noopVideoRepo{}, transcriptRepo, &stubExtractionAIService{}, newInMemoryAISummaryRepo(), newInMemoryAIExtractionRepo())
	require.NoError(t, err)

	reqBody := `{"extraction_type": "code"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/"+transcriptID+"/extract", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", transcriptID)
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	w := httptest.NewRecorder()
	server.handleExtractFromTranscript(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
	assert.Contains(t, w.Body.String(), "empty")
}

func TestHandleExtractFromTranscript_AIServiceError(t *testing.T) {
	cfg := &config.Config{APIPort: 8080}

	aiService := &stubExtractionAIService{
		err: services.ErrAIRateLimited,
	}

	transcriptRepo := newInMemoryTranscriptRepo()
	transcriptID := "test-transcript"
	transcript := &db.Transcript{
		ID:       transcriptID,
		VideoID:  "video-123",
		Language: "en",
		Content:  db.TranscriptSegments{{StartMs: 0, DurationMs: 1000, Text: "test"}},
	}
	transcriptRepo.transcripts[transcriptID] = transcript

	server, err := NewServer(cfg, &mockDB{}, noopYouTubeService{}, noopVideoRepo{}, transcriptRepo, aiService, newInMemoryAISummaryRepo(), newInMemoryAIExtractionRepo())
	require.NoError(t, err)

	reqBody := `{"extraction_type": "code"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/"+transcriptID+"/extract", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", transcriptID)
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	w := httptest.NewRecorder()
	server.handleExtractFromTranscript(w, req)

	assert.Equal(t, http.StatusTooManyRequests, w.Code)
	assert.Contains(t, w.Body.String(), "rate limit")
}

func TestHandleExtractFromTranscript_InvalidJSON(t *testing.T) {
	cfg := &config.Config{APIPort: 8080}

	server, err := NewServer(cfg, &mockDB{}, noopYouTubeService{}, noopVideoRepo{}, newInMemoryTranscriptRepo(), &stubExtractionAIService{}, newInMemoryAISummaryRepo(), newInMemoryAIExtractionRepo())
	require.NoError(t, err)

	reqBody := `{invalid json}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/test/extract", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "test")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	w := httptest.NewRecorder()
	server.handleExtractFromTranscript(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid JSON")
}
