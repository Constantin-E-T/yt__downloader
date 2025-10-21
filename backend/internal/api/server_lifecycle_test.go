package api

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCORSHeaders(t *testing.T) {
	t.Run("includes CORS headers in response", func(t *testing.T) {
		server, err := NewServer(mockConfig(), &mockDB{}, noopYouTubeService{}, noopVideoRepo{}, noopTranscriptRepo{}, noopAIService{}, noopAISummaryRepo{}, noopAIExtractionRepo{})
		require.NoError(t, err)

		req := httptest.NewRequest(http.MethodOptions, "/api/v1/health", nil)
		req.Header.Set("Origin", "http://localhost:5173")
		req.Header.Set("Access-Control-Request-Method", "GET")
		rec := httptest.NewRecorder()

		server.router.ServeHTTP(rec, req)

		assert.NotEmpty(t, rec.Header().Get("Access-Control-Allow-Origin"))
	})
}

func TestShutdown(t *testing.T) {
	t.Run("returns error when server not initialized", func(t *testing.T) {
		err := (&Server{}).Shutdown(context.Background())
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "server not initialized")
	})

	t.Run("shuts down successfully", func(t *testing.T) {
		server, err := NewServer(mockConfig(), &mockDB{}, noopYouTubeService{}, noopVideoRepo{}, noopTranscriptRepo{}, noopAIService{}, noopAISummaryRepo{}, noopAIExtractionRepo{})
		require.NoError(t, err)

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		errChan := make(chan error, 1)
		go func() {
			errChan <- server.Start(ctx)
		}()

		time.Sleep(100 * time.Millisecond)

		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer shutdownCancel()

		assert.NoError(t, server.Shutdown(shutdownCtx))
		cancel()

		select {
		case <-errChan:
		case <-time.After(2 * time.Second):
			t.Fatal("server did not stop in time")
		}
	})
}

func TestStartWithContext(t *testing.T) {
	t.Run("starts and stops gracefully when context is cancelled", func(t *testing.T) {
		server, err := NewServer(mockConfig(), &mockDB{}, noopYouTubeService{}, noopVideoRepo{}, noopTranscriptRepo{}, noopAIService{}, noopAISummaryRepo{}, noopAIExtractionRepo{})
		require.NoError(t, err)

		ctx, cancel := context.WithCancel(context.Background())

		errChan := make(chan error, 1)
		go func() {
			errChan <- server.Start(ctx)
		}()

		time.Sleep(100 * time.Millisecond)
		cancel()

		select {
		case err := <-errChan:
			assert.NoError(t, err)
		case <-time.After(5 * time.Second):
			t.Fatal("server did not stop in time")
		}
	})

	t.Run("returns error when server not initialized", func(t *testing.T) {
		err := (&Server{}).Start(context.Background())
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "server not initialized")
	})
}
