package db

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestVideoRepository_SaveAndGet(t *testing.T) {
	container := setupPostgresContainer(t)
	defer func() {
		err := container.Terminate(context.Background())
		assert.NoError(t, err)
	}()

	ctx := context.Background()
	database, err := Connect(ctx, container.ConnectionString)
	require.NoError(t, err)
	defer database.Close()

	applyMigrations(t, database)

	repo := NewVideoRepository(database)

	_, err = repo.GetVideoByID(ctx, "")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "id is required")

	_, err = repo.GetVideoByYouTubeID(ctx, "")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "youtube id is required")

	err = repo.SaveVideo(ctx, &Video{})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "youtube id is required")

	video := &Video{
		YouTubeID: "abc12345",
		Title:     "Original Title",
		Channel:   "Test Channel",
		Duration:  245,
	}

	err = repo.SaveVideo(ctx, video)
	require.NoError(t, err)
	require.NotEmpty(t, video.ID)
	require.False(t, video.CreatedAt.IsZero())

	fetched, err := repo.GetVideoByYouTubeID(ctx, video.YouTubeID)
	require.NoError(t, err)
	assert.Equal(t, video.ID, fetched.ID)
	assert.Equal(t, video.Title, fetched.Title)
	assert.Equal(t, video.Duration, fetched.Duration)

	fetchedByID, err := repo.GetVideoByID(ctx, video.ID)
	require.NoError(t, err)
	assert.Equal(t, video.YouTubeID, fetchedByID.YouTubeID)

	// Update existing video to exercise upsert logic.
	video.Title = "Updated Title"
	video.Channel = "Updated Channel"
	video.Duration = 999

	err = repo.SaveVideo(ctx, video)
	require.NoError(t, err)

	updated, err := repo.GetVideoByID(ctx, video.ID)
	require.NoError(t, err)
	assert.Equal(t, "Updated Title", updated.Title)
	assert.Equal(t, "Updated Channel", updated.Channel)
	assert.Equal(t, 999, updated.Duration)
	assert.Equal(t, video.ID, updated.ID)
}

func TestVideoRepository_NotFound(t *testing.T) {
	container := setupPostgresContainer(t)
	defer func() {
		err := container.Terminate(context.Background())
		assert.NoError(t, err)
	}()

	ctx := context.Background()
	database, err := Connect(ctx, container.ConnectionString)
	require.NoError(t, err)
	defer database.Close()

	applyMigrations(t, database)

	repo := NewVideoRepository(database)

	randomID := uuid.NewString()
	_, err = repo.GetVideoByID(ctx, randomID)
	require.Error(t, err)
	assert.ErrorIs(t, err, ErrNotFound)

	_, err = repo.GetVideoByYouTubeID(ctx, "non-existent")
	require.Error(t, err)
	assert.ErrorIs(t, err, ErrNotFound)
}
