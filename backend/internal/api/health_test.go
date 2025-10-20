package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestHealthEndpoint(t *testing.T) {
	t.Run("healthy state returns 200", func(t *testing.T) {
		server, err := NewServer(mockConfig(), &mockDB{}, noopYouTubeService{}, noopVideoRepo{}, noopTranscriptRepo{})
		require.NoError(t, err)

		req := httptest.NewRequest(http.MethodGet, "/health", nil)
		rec := httptest.NewRecorder()

		server.router.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)

		var response HealthResponse
		require.NoError(t, json.NewDecoder(rec.Body).Decode(&response))
		assert.Equal(t, "healthy", response.Status)
		assert.Equal(t, "healthy", response.Checks["database"])
		assert.Equal(t, "healthy", response.Checks["youtube_service"])
	})

	t.Run("database failure returns 503", func(t *testing.T) {
		server, err := NewServer(mockConfig(), &mockDB{pingError: errors.New("boom")}, noopYouTubeService{}, noopVideoRepo{}, noopTranscriptRepo{})
		require.NoError(t, err)

		req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
		rec := httptest.NewRecorder()

		server.router.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusServiceUnavailable, rec.Code)

		var response HealthResponse
		require.NoError(t, json.NewDecoder(rec.Body).Decode(&response))
		assert.Equal(t, "unhealthy", response.Status)
		assert.Contains(t, response.Checks["database"], "unhealthy")
	})

	t.Run("response includes timestamp and checks", func(t *testing.T) {
		server, err := NewServer(mockConfig(), &mockDB{}, noopYouTubeService{}, noopVideoRepo{}, noopTranscriptRepo{})
		require.NoError(t, err)

		req := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
		rec := httptest.NewRecorder()

		server.router.ServeHTTP(rec, req)

		var response HealthResponse
		require.NoError(t, json.NewDecoder(rec.Body).Decode(&response))

		assert.NotEmpty(t, response.Timestamp)
		_, parseErr := time.Parse(time.RFC3339, response.Timestamp)
		assert.NoError(t, parseErr)
		assert.Contains(t, response.Checks, "database")
		assert.Contains(t, response.Checks, "youtube_service")
	})
}
