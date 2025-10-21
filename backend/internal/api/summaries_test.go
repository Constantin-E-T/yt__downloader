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

type stubAIService struct {
	summary *services.AISummary
	err     error
	calls   int
}

func (s *stubAIService) Summarize(ctx context.Context, text string, summaryType string) (*services.AISummary, error) {
	s.calls++
	if s.err != nil {
		return nil, s.err
	}
	clone := *s.summary
	clone.Type = summaryType
	return &clone, nil
}

func (s *stubAIService) Extract(ctx context.Context, text string, extractionType string) (*services.AIExtraction, error) {
	return &services.AIExtraction{}, nil
}

func (s *stubAIService) Answer(ctx context.Context, text string, question string) (*services.AIAnswer, error) {
	return &services.AIAnswer{}, nil
}

type inMemoryAISummaryRepo struct {
	store map[string]*db.AISummary
}

func newInMemoryAISummaryRepo() *inMemoryAISummaryRepo {
	return &inMemoryAISummaryRepo{store: make(map[string]*db.AISummary)}
}

func (r *inMemoryAISummaryRepo) CreateAISummary(ctx context.Context, summary *db.AISummary) error {
	key := summary.TranscriptID + ":" + summary.SummaryType
	if existing, ok := r.store[key]; ok {
		*summary = *existing
		return nil
	}

	summary.ID = "summary-" + summary.SummaryType
	summary.CreatedAt = time.Now().UTC()
	summary.UpdatedAt = summary.CreatedAt
	clone := *summary
	r.store[key] = &clone
	return nil
}

func (r *inMemoryAISummaryRepo) GetAISummary(ctx context.Context, transcriptID string, summaryType string) (*db.AISummary, error) {
	key := transcriptID + ":" + summaryType
	if summary, ok := r.store[key]; ok {
		clone := *summary
		return &clone, nil
	}
	return nil, db.ErrNotFound
}

func (r *inMemoryAISummaryRepo) ListAISummaries(ctx context.Context, transcriptID string) ([]*db.AISummary, error) {
	summaries := make([]*db.AISummary, 0)
	for key, summary := range r.store {
		if strings.HasPrefix(key, transcriptID+":") {
			clone := *summary
			summaries = append(summaries, &clone)
		}
	}
	return summaries, nil
}

type inMemoryTranscriptRepo struct {
	transcripts map[string]*db.Transcript
}

func newInMemoryTranscriptRepo() *inMemoryTranscriptRepo {
	return &inMemoryTranscriptRepo{transcripts: make(map[string]*db.Transcript)}
}

func (r *inMemoryTranscriptRepo) SaveTranscript(context.Context, *db.Transcript) error { return nil }

func (r *inMemoryTranscriptRepo) GetTranscriptByID(ctx context.Context, id string) (*db.Transcript, error) {
	if transcript, ok := r.transcripts[id]; ok {
		clone := *transcript
		return &clone, nil
	}
	return nil, db.ErrNotFound
}

func TestHandleSummarizeTranscript_Success(t *testing.T) {
	cfg := mockConfig()
	cfg.AIProvider = "openai"

	database := &mockDB{}
	transcriptRepo := newInMemoryTranscriptRepo()
	summaryRepo := newInMemoryAISummaryRepo()
	aiSvc := &stubAIService{
		summary: &services.AISummary{
			Content:    services.SummaryContent{Text: "Concise summary."},
			Model:      "gpt-4",
			TokensUsed: 220,
		},
	}

	transcriptID := "transcript-123"
	transcriptRepo.transcripts[transcriptID] = &db.Transcript{
		ID:        transcriptID,
		VideoID:   "video-1",
		Language:  "en",
		Content:   db.TranscriptSegments{{StartMs: 0, DurationMs: 1000, Text: "Hello"}},
		CreatedAt: time.Now(),
	}

	server, err := NewServer(cfg, database, noopYouTubeService{}, noopVideoRepo{}, transcriptRepo, aiSvc, summaryRepo, newInMemoryAIExtractionRepo())
	require.NoError(t, err)

	body := []byte(`{"summary_type":"brief"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/"+transcriptID+"/summarize", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, aiSvc.calls)

	var resp summaryResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, "brief", resp.SummaryType)
	assert.Equal(t, "Concise summary.", resp.Content.Text)
	assert.Equal(t, 220, resp.TokensUsed)
	assert.Equal(t, "gpt-4", resp.Model)
}

func TestHandleSummarizeTranscript_Cached(t *testing.T) {
	cfg := mockConfig()
	cfg.AIProvider = "openai"

	database := &mockDB{}
	transcriptRepo := newInMemoryTranscriptRepo()
	summaryRepo := newInMemoryAISummaryRepo()
	aiSvc := &stubAIService{
		summary: &services.AISummary{Content: services.SummaryContent{Text: "Should not be used"}},
	}

	transcriptID := "transcript-abc"
	transcriptRepo.transcripts[transcriptID] = &db.Transcript{ID: transcriptID, Content: db.TranscriptSegments{{Text: "Hello"}}}

	cached := &db.AISummary{
		ID:           "summary-brief",
		TranscriptID: transcriptID,
		SummaryType:  "brief",
		Content: db.SummaryContent{
			Text: "Cached summary",
		},
		Model:      "gpt-4",
		TokensUsed: 150,
		CreatedAt:  time.Now().UTC(),
	}
	require.NoError(t, summaryRepo.CreateAISummary(context.Background(), cached))

	server, err := NewServer(cfg, database, noopYouTubeService{}, noopVideoRepo{}, transcriptRepo, aiSvc, summaryRepo, newInMemoryAIExtractionRepo())
	require.NoError(t, err)

	body := []byte(`{"summary_type":"brief"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/"+transcriptID+"/summarize", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 0, aiSvc.calls)

	var resp summaryResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, "Cached summary", resp.Content.Text)
	assert.Equal(t, 150, resp.TokensUsed)
}

func TestHandleSummarizeTranscript_InvalidType(t *testing.T) {
	cfg := mockConfig()
	database := &mockDB{}
	server, err := NewServer(cfg, database, noopYouTubeService{}, noopVideoRepo{}, newInMemoryTranscriptRepo(), &stubAIService{}, newInMemoryAISummaryRepo(), newInMemoryAIExtractionRepo())
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/any/summarize", bytes.NewReader([]byte(`{"summary_type":"invalid"}`)))
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestHandleSummarizeTranscript_TranscriptNotFound(t *testing.T) {
	cfg := mockConfig()
	database := &mockDB{}
	transcriptRepo := newInMemoryTranscriptRepo()

	server, err := NewServer(cfg, database, noopYouTubeService{}, noopVideoRepo{}, transcriptRepo, &stubAIService{}, newInMemoryAISummaryRepo(), newInMemoryAIExtractionRepo())
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/transcripts/missing/summarize", bytes.NewReader([]byte(`{"summary_type":"brief"}`)))
	rec := httptest.NewRecorder()

	server.router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusNotFound, rec.Code)
}
