package db

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTranscriptRepository_IndexedQueries(t *testing.T) {
	container := setupPostgresContainer(t)

	ctx := context.Background()
	database, err := Connect(ctx, container.ConnectionString)
	require.NoError(t, err)
	defer database.Close()

	applyMigrations(t, database)

	videoRepo := NewVideoRepository(database)
	repo := NewTranscriptRepository(database)

	video := &Video{
		YouTubeID: uuid.NewString(),
		Title:     "Indexed Video",
		Channel:   "Channel C",
		Duration:  90,
	}
	require.NoError(t, videoRepo.SaveVideo(ctx, video))

	var latestEN string
	languages := []string{"en", "es", "en"}
	for idx, lang := range languages {
		transcript := &Transcript{
			VideoID:  video.ID,
			Language: lang,
			Content: TranscriptSegments{
				{StartMs: int64(idx) * 1000, DurationMs: 1000, Text: lang},
			},
		}
		require.NoError(t, repo.SaveTranscript(ctx, transcript))
		if lang == "en" {
			latestEN = transcript.ID
		}
		time.Sleep(10 * time.Millisecond)
	}

	fetched, err := repo.GetTranscriptByVideoIDAndLanguage(ctx, video.ID, "en")
	require.NoError(t, err)
	assert.Equal(t, latestEN, fetched.ID)
	assert.Equal(t, "en", fetched.Language)

	list, err := repo.GetTranscriptsByVideoIDWithPagination(ctx, video.ID, 2, 0)
	require.NoError(t, err)
	require.Len(t, list, 2)
	assert.GreaterOrEqual(t, list[0].CreatedAt.UnixNano(), list[1].CreatedAt.UnixNano())
}
