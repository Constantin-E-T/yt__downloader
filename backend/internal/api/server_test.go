package api

import (
	"context"
	"errors"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/yourusername/yt-transcript-downloader/internal/config"
	"github.com/yourusername/yt-transcript-downloader/internal/db"
	"github.com/yourusername/yt-transcript-downloader/internal/services"
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

type noopYouTubeService struct{}

func (noopYouTubeService) GetVideoMetadata(string) (*services.VideoMetadata, error) {
	return &services.VideoMetadata{}, nil
}

func (noopYouTubeService) GetTranscript(string, string) ([]services.TranscriptLine, error) {
	return nil, errors.New("not implemented")
}

type noopVideoRepo struct{}

func (noopVideoRepo) SaveVideo(context.Context, *db.Video) error {
	return nil
}

type noopTranscriptRepo struct{}

func (noopTranscriptRepo) SaveTranscript(context.Context, *db.Transcript) error {
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

		server, err := NewServer(cfg, database, noopYouTubeService{}, noopVideoRepo{}, noopTranscriptRepo{})

		require.NoError(t, err)
		assert.NotNil(t, server)
		assert.NotNil(t, server.router)
		assert.NotNil(t, server.srv)
		assert.Equal(t, database, server.db)
		assert.Equal(t, ":8080", server.srv.Addr)
	})

	t.Run("returns error when config is nil", func(t *testing.T) {
		database := &mockDB{}

		server, err := NewServer(nil, database, noopYouTubeService{}, noopVideoRepo{}, noopTranscriptRepo{})

		assert.Error(t, err)
		assert.Nil(t, server)
		assert.Contains(t, err.Error(), "config cannot be nil")
	})

	t.Run("returns error when database is nil", func(t *testing.T) {
		cfg := mockConfig()

		server, err := NewServer(cfg, nil, noopYouTubeService{}, noopVideoRepo{}, noopTranscriptRepo{})
		assert.Error(t, err)
		assert.Nil(t, server)
		assert.Contains(t, err.Error(), "database cannot be nil")
	})

	t.Run("returns error when youtube service is nil", func(t *testing.T) {
		cfg := mockConfig()
		database := &mockDB{}

		server, err := NewServer(cfg, database, nil, noopVideoRepo{}, noopTranscriptRepo{})

		assert.Error(t, err)
		assert.Nil(t, server)
		assert.Contains(t, err.Error(), "youtube service cannot be nil")
	})
}
