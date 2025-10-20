package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMetricsEndpoint(t *testing.T) {
	server, err := NewServer(mockConfig(), &mockDB{}, noopYouTubeService{}, noopVideoRepo{}, noopTranscriptRepo{})
	require.NoError(t, err)

	t.Run("returns metrics at root path", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
		rec := httptest.NewRecorder()

		server.router.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Equal(t, "application/json", rec.Header().Get("Content-Type"))

		var response MetricsResponse
		require.NoError(t, json.NewDecoder(rec.Body).Decode(&response))
		assert.NotEmpty(t, response.Uptime)
		assert.Greater(t, response.NumCPU, 0)
		assert.GreaterOrEqual(t, response.NumGoroutine, 1)
	})

	t.Run("returns metrics under api path", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/metrics", nil)
		rec := httptest.NewRecorder()

		server.router.ServeHTTP(rec, req)
		assert.Equal(t, http.StatusOK, rec.Code)
	})
}
