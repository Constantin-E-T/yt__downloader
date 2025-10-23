package db

import (
	"context"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTranscriptRepository_SaveAndRetrieve(t *testing.T) {
	container := setupPostgresContainer(t)

	ctx := context.Background()
	database, err := Connect(ctx, container.ConnectionString)
	require.NoError(t, err)
	defer database.Close()

	applyMigrations(t, database)

	videoRepo := NewVideoRepository(database)
	transcriptRepo := NewTranscriptRepository(database)

	_, err = transcriptRepo.GetTranscriptByID(ctx, "")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "id is required")

	_, err = transcriptRepo.GetTranscriptsByVideoID(ctx, "")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "video id is required")

	err = transcriptRepo.SaveTranscript(ctx, &Transcript{})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "video id is required")

	video := &Video{
		YouTubeID: uuid.NewString(),
		Title:     "Transcript Test",
		Channel:   "Channel A",
		Duration:  120,
	}
	err = videoRepo.SaveVideo(ctx, video)
	require.NoError(t, err)

	transcript := &Transcript{
		VideoID:  video.ID,
		Language: "en",
		Content: TranscriptSegments{
			{StartMs: 0, DurationMs: 2000, Text: "Hello"},
			{StartMs: 2000, DurationMs: 1500, Text: "World"},
		},
	}

	err = transcriptRepo.SaveTranscript(ctx, transcript)
	require.NoError(t, err)
	require.NotEmpty(t, transcript.ID)
	require.False(t, transcript.CreatedAt.IsZero())

	fetched, err := transcriptRepo.GetTranscriptByID(ctx, transcript.ID)
	require.NoError(t, err)
	assert.Equal(t, transcript.Language, fetched.Language)
	assert.Equal(t, transcript.Content, fetched.Content)
	assert.Equal(t, transcript.VideoID, fetched.VideoID)

	list, err := transcriptRepo.GetTranscriptsByVideoID(ctx, video.ID)
	require.NoError(t, err)
	require.Len(t, list, 1)
	assert.Equal(t, transcript.ID, list[0].ID)
	assert.Equal(t, transcript.Content, list[0].Content)

	// Update content to exercise JSONB upsert handling.
	transcript.Language = "en-US"
	transcript.Content = TranscriptSegments{
		{StartMs: 0, DurationMs: 1000, Text: "Updated"},
	}

	err = transcriptRepo.SaveTranscript(ctx, transcript)
	require.NoError(t, err)

	updated, err := transcriptRepo.GetTranscriptByID(ctx, transcript.ID)
	require.NoError(t, err)
	assert.Equal(t, "en-US", updated.Language)
	assert.Len(t, updated.Content, 1)
	assert.Equal(t, "Updated", updated.Content[0].Text)
}

func TestTranscriptRepository_JSONBAndConstraints(t *testing.T) {
	container := setupPostgresContainer(t)

	ctx := context.Background()
	database, err := Connect(ctx, container.ConnectionString)
	require.NoError(t, err)
	defer database.Close()

	applyMigrations(t, database)

	videoRepo := NewVideoRepository(database)
	transcriptRepo := NewTranscriptRepository(database)

	video := &Video{
		YouTubeID: uuid.NewString(),
		Title:     "JSON Video",
		Channel:   "Channel B",
		Duration:  60,
	}
	err = videoRepo.SaveVideo(ctx, video)
	require.NoError(t, err)

	emptyContentTranscript := &Transcript{
		VideoID:  video.ID,
		Language: "en",
		Content:  nil,
	}
	err = transcriptRepo.SaveTranscript(ctx, emptyContentTranscript)
	require.NoError(t, err)
	require.Len(t, emptyContentTranscript.Content, 0, "nil content should round-trip as empty slice")

	fetched, err := transcriptRepo.GetTranscriptByID(ctx, emptyContentTranscript.ID)
	require.NoError(t, err)
	require.Len(t, fetched.Content, 0)

	invalidTranscript := &Transcript{
		VideoID:  uuid.NewString(),
		Language: "en",
	}
	err = transcriptRepo.SaveTranscript(ctx, invalidTranscript)
	require.Error(t, err)
	assert.True(t, strings.Contains(err.Error(), "foreign"), "expected foreign key violation")
}

func TestTranscriptRepository_NotFound(t *testing.T) {
	container := setupPostgresContainer(t)

	ctx := context.Background()
	database, err := Connect(ctx, container.ConnectionString)
	require.NoError(t, err)
	defer database.Close()

	applyMigrations(t, database)

	repo := NewTranscriptRepository(database)

	_, err = repo.GetTranscriptByID(ctx, uuid.NewString())
	require.Error(t, err)
	assert.ErrorIs(t, err, ErrNotFound)

	transcripts, err := repo.GetTranscriptsByVideoID(ctx, uuid.NewString())
	require.NoError(t, err)
	assert.Len(t, transcripts, 0)
}
