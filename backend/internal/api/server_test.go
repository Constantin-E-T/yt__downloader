package api

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/yourusername/yt-transcript-downloader/internal/config"
	"github.com/yourusername/yt-transcript-downloader/internal/db"
)

// mockDB is a mock implementation of db.DB for testing
type mockDB struct {
	pingError error
}

func (m *mockDB) Ping(ctx context.Context) error {
	return m.pingError
}

func (m *mockDB) Close() {}

func (m *mockDB) Acquire(ctx context.Context) (db.Conn, error) {
	return nil, nil
}

func (m *mockDB) Exec(ctx context.Context, sql string, arguments ...any) (pgconn.CommandTag, error) {
	return pgconn.CommandTag{}, nil
}

func (m *mockDB) Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error) {
	return nil, nil
}

func (m *mockDB) QueryRow(ctx context.Context, sql string, args ...any) pgx.Row {
	return nil
}

func (m *mockDB) Begin(ctx context.Context) (pgx.Tx, error) {
	return nil, nil
}

func (m *mockDB) BeginTx(ctx context.Context, txOptions pgx.TxOptions) (pgx.Tx, error) {
	return nil, nil
}

func (m *mockDB) SendBatch(ctx context.Context, b *pgx.Batch) pgx.BatchResults {
	return nil
}

func (m *mockDB) Stat() *pgxpool.Stat {
	return nil
}

// mockConfig creates a test configuration
func mockConfig() *config.Config {
	return &config.Config{
		APIPort: 8080,
	}
}

func TestNewServer(t *testing.T) {
	t.Run("creates server successfully with valid config and database", func(t *testing.T) {
		cfg := mockConfig()
		database := &mockDB{}

		server, err := NewServer(cfg, database)

		require.NoError(t, err)
		assert.NotNil(t, server)
		assert.NotNil(t, server.router)
		assert.NotNil(t, server.srv)
		assert.Equal(t, database, server.db)
		assert.Equal(t, ":8080", server.srv.Addr)
	})

	t.Run("returns error when config is nil", func(t *testing.T) {
		database := &mockDB{}

		server, err := NewServer(nil, database)

		assert.Error(t, err)
		assert.Nil(t, server)
		assert.Contains(t, err.Error(), "config cannot be nil")
	})

	t.Run("returns error when database is nil", func(t *testing.T) {
		cfg := mockConfig()

		server, err := NewServer(cfg, nil)

		assert.Error(t, err)
		assert.Nil(t, server)
		assert.Contains(t, err.Error(), "database cannot be nil")
	})
}

func TestHealthEndpoint(t *testing.T) {
	t.Run("returns 200 and ok status when database is connected", func(t *testing.T) {
		// Setup
		cfg := mockConfig()
		database := &mockDB{pingError: nil}
		server, err := NewServer(cfg, database)
		require.NoError(t, err)

		// Create test request
		req := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
		rec := httptest.NewRecorder()

		// Execute
		server.router.ServeHTTP(rec, req)

		// Assert
		assert.Equal(t, http.StatusOK, rec.Code)

		var response HealthResponse
		err = json.NewDecoder(rec.Body).Decode(&response)
		require.NoError(t, err)

		assert.Equal(t, "ok", response.Status)
		assert.Equal(t, "connected", response.Database)
		assert.Equal(t, "application/json", rec.Header().Get("Content-Type"))
	})

	t.Run("returns 503 and error status when database is disconnected", func(t *testing.T) {
		// Setup
		cfg := mockConfig()
		database := &mockDB{pingError: errors.New("connection failed")}
		server, err := NewServer(cfg, database)
		require.NoError(t, err)

		// Create test request
		req := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
		rec := httptest.NewRecorder()

		// Execute
		server.router.ServeHTTP(rec, req)

		// Assert
		assert.Equal(t, http.StatusServiceUnavailable, rec.Code)

		var response HealthResponse
		err = json.NewDecoder(rec.Body).Decode(&response)
		require.NoError(t, err)

		assert.Equal(t, "error", response.Status)
		assert.Equal(t, "disconnected", response.Database)
		assert.Equal(t, "application/json", rec.Header().Get("Content-Type"))
	})
}

func TestCORSHeaders(t *testing.T) {
	t.Run("includes CORS headers in response", func(t *testing.T) {
		// Setup
		cfg := mockConfig()
		database := &mockDB{}
		server, err := NewServer(cfg, database)
		require.NoError(t, err)

		// Create test request with Origin header
		req := httptest.NewRequest(http.MethodOptions, "/api/v1/health", nil)
		req.Header.Set("Origin", "http://localhost:5173")
		req.Header.Set("Access-Control-Request-Method", "GET")
		rec := httptest.NewRecorder()

		// Execute
		server.router.ServeHTTP(rec, req)

		// Assert CORS headers are present
		assert.NotEmpty(t, rec.Header().Get("Access-Control-Allow-Origin"))
	})
}

func TestShutdown(t *testing.T) {
	t.Run("returns error when server not initialized", func(t *testing.T) {
		server := &Server{}
		ctx := context.Background()

		err := server.Shutdown(ctx)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "server not initialized")
	})

	t.Run("shuts down successfully", func(t *testing.T) {
		// Setup
		cfg := mockConfig()
		database := &mockDB{}
		server, err := NewServer(cfg, database)
		require.NoError(t, err)

		// Start server in background
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		serverErrChan := make(chan error, 1)
		go func() {
			serverErrChan <- server.Start(ctx)
		}()

		// Give server time to start
		time.Sleep(100 * time.Millisecond)

		// Shutdown
		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer shutdownCancel()

		err = server.Shutdown(shutdownCtx)
		assert.NoError(t, err)

		// Cancel the Start context to clean up
		cancel()

		// Wait for Start to return
		select {
		case <-serverErrChan:
			// Server stopped as expected
		case <-time.After(2 * time.Second):
			t.Fatal("server did not stop in time")
		}
	})
}

func TestStartWithContext(t *testing.T) {
	t.Run("starts and stops gracefully when context is cancelled", func(t *testing.T) {
		// Setup
		cfg := mockConfig()
		database := &mockDB{}
		server, err := NewServer(cfg, database)
		require.NoError(t, err)

		// Create context with cancel
		ctx, cancel := context.WithCancel(context.Background())

		// Start server in goroutine
		errChan := make(chan error, 1)
		go func() {
			errChan <- server.Start(ctx)
		}()

		// Give server time to start
		time.Sleep(100 * time.Millisecond)

		// Cancel context to trigger shutdown
		cancel()

		// Wait for server to stop
		select {
		case err := <-errChan:
			assert.NoError(t, err)
		case <-time.After(5 * time.Second):
			t.Fatal("server did not stop in time")
		}
	})

	t.Run("returns error when server not initialized", func(t *testing.T) {
		server := &Server{}
		ctx := context.Background()

		err := server.Start(ctx)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "server not initialized")
	})
}

func TestGetOverallStatus(t *testing.T) {
	t.Run("returns ok when database is connected", func(t *testing.T) {
		status := getOverallStatus("connected")
		assert.Equal(t, "ok", status)
	})

	t.Run("returns error when database is disconnected", func(t *testing.T) {
		status := getOverallStatus("disconnected")
		assert.Equal(t, "error", status)
	})
}
