package db

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCreateAISummary(t *testing.T) {
	container := setupPostgresContainer(t)

	ctx := context.Background()
	database, err := Connect(ctx, container.ConnectionString)
	require.NoError(t, err)
	defer database.Close()

	applyMigrations(t, database)

	videoRepo := NewVideoRepository(database)
	transcriptRepo := NewTranscriptRepository(database)
	summaryRepo := NewAISummaryRepository(database)

	video := &Video{
		YouTubeID: uuid.NewString(),
		Title:     "Summary Test",
		Channel:   "Channel",
		Duration:  120,
	}
	require.NoError(t, videoRepo.SaveVideo(ctx, video))

	transcript := &Transcript{
		VideoID:  video.ID,
		Language: "en",
		Content: TranscriptSegments{
			{StartMs: 0, DurationMs: 1000, Text: "Hello"},
			{StartMs: 1000, DurationMs: 1000, Text: "World"},
		},
	}
	require.NoError(t, transcriptRepo.SaveTranscript(ctx, transcript))

	summary := &AISummary{
		TranscriptID: transcript.ID,
		SummaryType:  "brief",
		Content:      SummaryContent{Text: "Concise summary."},
		Model:        "gpt-4",
		TokensUsed:   150,
	}

	require.NoError(t, summaryRepo.CreateAISummary(ctx, summary))
	assert.NotEmpty(t, summary.ID)
	assert.False(t, summary.CreatedAt.IsZero())
	assert.Equal(t, "Concise summary.", summary.Content.Text)

	stored, err := summaryRepo.GetAISummary(ctx, transcript.ID, "brief")
	require.NoError(t, err)
	assert.Equal(t, summary.ID, stored.ID)
	assert.Equal(t, "gpt-4", stored.Model)
	assert.Equal(t, 150, stored.TokensUsed)
}

func TestGetAISummary_NotFound(t *testing.T) {
	container := setupPostgresContainer(t)

	ctx := context.Background()
	database, err := Connect(ctx, container.ConnectionString)
	require.NoError(t, err)
	defer database.Close()

	applyMigrations(t, database)

	summaryRepo := NewAISummaryRepository(database)

	_, err = summaryRepo.GetAISummary(ctx, uuid.NewString(), "brief")
	require.Error(t, err)
	assert.ErrorIs(t, err, ErrNotFound)
}

func TestCreateAISummary_Duplicate(t *testing.T) {
	container := setupPostgresContainer(t)

	ctx := context.Background()
	database, err := Connect(ctx, container.ConnectionString)
	require.NoError(t, err)
	defer database.Close()

	applyMigrations(t, database)

	videoRepo := NewVideoRepository(database)
	transcriptRepo := NewTranscriptRepository(database)
	summaryRepo := NewAISummaryRepository(database)

	video := &Video{
		YouTubeID: uuid.NewString(),
		Title:     "Summary Duplicate",
		Channel:   "Channel",
		Duration:  90,
	}
	require.NoError(t, videoRepo.SaveVideo(ctx, video))

	transcript := &Transcript{
		VideoID:  video.ID,
		Language: "en",
		Content:  TranscriptSegments{{StartMs: 0, DurationMs: 500, Text: "Hi"}},
	}
	require.NoError(t, transcriptRepo.SaveTranscript(ctx, transcript))

	original := &AISummary{
		TranscriptID: transcript.ID,
		SummaryType:  "brief",
		Content:      SummaryContent{Text: "Original"},
		Model:        "gpt-4",
		TokensUsed:   100,
	}
	require.NoError(t, summaryRepo.CreateAISummary(ctx, original))

	duplicate := &AISummary{
		TranscriptID: transcript.ID,
		SummaryType:  "brief",
		Content:      SummaryContent{Text: "New"},
		Model:        "gpt-4",
		TokensUsed:   200,
	}
	require.NoError(t, summaryRepo.CreateAISummary(ctx, duplicate))

	assert.Equal(t, original.ID, duplicate.ID)
	assert.Equal(t, "Original", duplicate.Content.Text)
	assert.Equal(t, 100, duplicate.TokensUsed)
}

func TestListAISummaries(t *testing.T) {
	container := setupPostgresContainer(t)

	ctx := context.Background()
	database, err := Connect(ctx, container.ConnectionString)
	require.NoError(t, err)
	defer database.Close()

	applyMigrations(t, database)

	videoRepo := NewVideoRepository(database)
	transcriptRepo := NewTranscriptRepository(database)
	summaryRepo := NewAISummaryRepository(database)

	video := &Video{YouTubeID: uuid.NewString(), Title: "List", Channel: "Chan", Duration: 60}
	require.NoError(t, videoRepo.SaveVideo(ctx, video))

	transcript := &Transcript{
		VideoID:  video.ID,
		Language: "en",
		Content:  TranscriptSegments{{StartMs: 0, DurationMs: 1000, Text: "hello"}},
	}
	require.NoError(t, transcriptRepo.SaveTranscript(ctx, transcript))

	summaries := []*AISummary{
		{
			TranscriptID: transcript.ID,
			SummaryType:  "brief",
			Content:      SummaryContent{Text: "Brief"},
			Model:        "gpt-4",
			TokensUsed:   50,
		},
		{
			TranscriptID: transcript.ID,
			SummaryType:  "detailed",
			Content: SummaryContent{
				Text:     "Detailed",
				Sections: []Section{{Title: "Intro", Content: "Intro"}},
			},
			Model:      "gpt-4",
			TokensUsed: 150,
		},
	}

	for _, summary := range summaries {
		require.NoError(t, summaryRepo.CreateAISummary(ctx, summary))
		// ensure insertion order differences
		time.Sleep(10 * time.Millisecond)
	}

	list, err := summaryRepo.ListAISummaries(ctx, transcript.ID)
	require.NoError(t, err)
	require.Len(t, list, 2)
	types := []string{list[0].SummaryType, list[1].SummaryType}
	assert.Contains(t, types, "brief")
	assert.Contains(t, types, "detailed")
}

func TestGetAISummary(t *testing.T) {
	container := setupPostgresContainer(t)

	ctx := context.Background()
	database, err := Connect(ctx, container.ConnectionString)
	require.NoError(t, err)
	defer database.Close()

	applyMigrations(t, database)

	videoRepo := NewVideoRepository(database)
	transcriptRepo := NewTranscriptRepository(database)
	summaryRepo := NewAISummaryRepository(database)

	video := &Video{YouTubeID: uuid.NewString(), Title: "Get", Channel: "Chan", Duration: 30}
	require.NoError(t, videoRepo.SaveVideo(ctx, video))

	transcript := &Transcript{
		VideoID:  video.ID,
		Language: "en",
		Content:  TranscriptSegments{{StartMs: 0, DurationMs: 800, Text: "content"}},
	}
	require.NoError(t, transcriptRepo.SaveTranscript(ctx, transcript))

	expected := &AISummary{
		TranscriptID: transcript.ID,
		SummaryType:  "key_points",
		Content: SummaryContent{
			Text:      "- point",
			KeyPoints: []string{"point"},
		},
		Model:      "gpt-4",
		TokensUsed: 80,
	}
	require.NoError(t, summaryRepo.CreateAISummary(ctx, expected))

	fetched, err := summaryRepo.GetAISummary(ctx, transcript.ID, "key_points")
	require.NoError(t, err)
	assert.Equal(t, expected.ID, fetched.ID)
	assert.Equal(t, []string{"point"}, fetched.Content.KeyPoints)
}

func TestListAISummaries_NoResults(t *testing.T) {
	container := setupPostgresContainer(t)

	ctx := context.Background()
	database, err := Connect(ctx, container.ConnectionString)
	require.NoError(t, err)
	defer database.Close()

	applyMigrations(t, database)

	summaryRepo := NewAISummaryRepository(database)

	list, err := summaryRepo.ListAISummaries(ctx, uuid.NewString())
	require.NoError(t, err)
	assert.Len(t, list, 0)
}

// ========== AI Extraction Tests ==========

func TestCreateAIExtraction(t *testing.T) {
	container := setupPostgresContainer(t)

	ctx := context.Background()
	database, err := Connect(ctx, container.ConnectionString)
	require.NoError(t, err)
	defer database.Close()

	applyMigrations(t, database)

	videoRepo := NewVideoRepository(database)
	transcriptRepo := NewTranscriptRepository(database)
	extractionRepo := NewAIExtractionRepository(database)

	video := &Video{
		YouTubeID: uuid.NewString(),
		Title:     "Extract Test",
		Channel:   "Channel",
		Duration:  120,
	}
	require.NoError(t, videoRepo.SaveVideo(ctx, video))

	transcript := &Transcript{
		VideoID:  video.ID,
		Language: "en",
		Content: TranscriptSegments{
			{StartMs: 0, DurationMs: 1000, Text: "print('hello')"},
		},
	}
	require.NoError(t, transcriptRepo.SaveTranscript(ctx, transcript))

	content := []byte(`{"items":[{"language":"python","code":"print('hello')","context":"Example"}]}`)
	extraction := &AIExtraction{
		TranscriptID:   transcript.ID,
		ExtractionType: "code",
		Content:        content,
		Model:          "gpt-4",
		TokensUsed:     520,
	}

	require.NoError(t, extractionRepo.CreateAIExtraction(ctx, extraction))
	assert.NotEmpty(t, extraction.ID)
	assert.False(t, extraction.CreatedAt.IsZero())

	stored, err := extractionRepo.GetAIExtraction(ctx, transcript.ID, "code")
	require.NoError(t, err)
	assert.Equal(t, extraction.ID, stored.ID)
	assert.Equal(t, "gpt-4", stored.Model)
	assert.Equal(t, 520, stored.TokensUsed)
	assert.JSONEq(t, string(content), string(stored.Content))
}

func TestGetAIExtraction_NotFound(t *testing.T) {
	container := setupPostgresContainer(t)

	ctx := context.Background()
	database, err := Connect(ctx, container.ConnectionString)
	require.NoError(t, err)
	defer database.Close()

	applyMigrations(t, database)

	extractionRepo := NewAIExtractionRepository(database)

	_, err = extractionRepo.GetAIExtraction(ctx, uuid.NewString(), "code")
	require.Error(t, err)
	assert.ErrorIs(t, err, ErrNotFound)
}

func TestCreateAIExtraction_Duplicate(t *testing.T) {
	container := setupPostgresContainer(t)

	ctx := context.Background()
	database, err := Connect(ctx, container.ConnectionString)
	require.NoError(t, err)
	defer database.Close()

	applyMigrations(t, database)

	videoRepo := NewVideoRepository(database)
	transcriptRepo := NewTranscriptRepository(database)
	extractionRepo := NewAIExtractionRepository(database)

	video := &Video{
		YouTubeID: uuid.NewString(),
		Title:     "Duplicate Extract Test",
		Channel:   "Channel",
		Duration:  120,
	}
	require.NoError(t, videoRepo.SaveVideo(ctx, video))

	transcript := &Transcript{
		VideoID:  video.ID,
		Language: "en",
		Content:  TranscriptSegments{{StartMs: 0, DurationMs: 1000, Text: "test"}},
	}
	require.NoError(t, transcriptRepo.SaveTranscript(ctx, transcript))

	content1 := []byte(`{"items":[{"quote":"first"}]}`)
	extraction1 := &AIExtraction{
		TranscriptID:   transcript.ID,
		ExtractionType: "quotes",
		Content:        content1,
		Model:          "gpt-4",
		TokensUsed:     100,
	}
	require.NoError(t, extractionRepo.CreateAIExtraction(ctx, extraction1))
	firstID := extraction1.ID

	// Attempt duplicate
	content2 := []byte(`{"items":[{"quote":"second"}]}`)
	extraction2 := &AIExtraction{
		TranscriptID:   transcript.ID,
		ExtractionType: "quotes",
		Content:        content2,
		Model:          "gpt-4-turbo",
		TokensUsed:     200,
	}
	require.NoError(t, extractionRepo.CreateAIExtraction(ctx, extraction2))

	// Should return the first extraction
	assert.Equal(t, firstID, extraction2.ID)
	assert.Equal(t, "gpt-4", extraction2.Model)
	assert.Equal(t, 100, extraction2.TokensUsed)
	assert.JSONEq(t, string(content1), string(extraction2.Content))
}

func TestListAIExtractions(t *testing.T) {
	container := setupPostgresContainer(t)

	ctx := context.Background()
	database, err := Connect(ctx, container.ConnectionString)
	require.NoError(t, err)
	defer database.Close()

	applyMigrations(t, database)

	videoRepo := NewVideoRepository(database)
	transcriptRepo := NewTranscriptRepository(database)
	extractionRepo := NewAIExtractionRepository(database)

	video := &Video{
		YouTubeID: uuid.NewString(),
		Title:     "List Extract Test",
		Channel:   "Channel",
		Duration:  120,
	}
	require.NoError(t, videoRepo.SaveVideo(ctx, video))

	transcript := &Transcript{
		VideoID:  video.ID,
		Language: "en",
		Content:  TranscriptSegments{{StartMs: 0, DurationMs: 1000, Text: "test"}},
	}
	require.NoError(t, transcriptRepo.SaveTranscript(ctx, transcript))

	// Create multiple extractions
	codeExtraction := &AIExtraction{
		TranscriptID:   transcript.ID,
		ExtractionType: "code",
		Content:        []byte(`{"items":[]}`),
		Model:          "gpt-4",
		TokensUsed:     100,
	}
	require.NoError(t, extractionRepo.CreateAIExtraction(ctx, codeExtraction))
	time.Sleep(10 * time.Millisecond)

	quotesExtraction := &AIExtraction{
		TranscriptID:   transcript.ID,
		ExtractionType: "quotes",
		Content:        []byte(`{"items":[]}`),
		Model:          "gpt-4",
		TokensUsed:     150,
	}
	require.NoError(t, extractionRepo.CreateAIExtraction(ctx, quotesExtraction))
	time.Sleep(10 * time.Millisecond)

	actionExtraction := &AIExtraction{
		TranscriptID:   transcript.ID,
		ExtractionType: "action_items",
		Content:        []byte(`{"items":[]}`),
		Model:          "gpt-4",
		TokensUsed:     200,
	}
	require.NoError(t, extractionRepo.CreateAIExtraction(ctx, actionExtraction))

	list, err := extractionRepo.ListAIExtractions(ctx, transcript.ID)
	require.NoError(t, err)
	assert.Len(t, list, 3)

	// Verify order (most recent first)
	assert.Equal(t, "action_items", list[0].ExtractionType)
	assert.Equal(t, "quotes", list[1].ExtractionType)
	assert.Equal(t, "code", list[2].ExtractionType)
}

func TestListAIExtractions_NoResults(t *testing.T) {
	container := setupPostgresContainer(t)

	ctx := context.Background()
	database, err := Connect(ctx, container.ConnectionString)
	require.NoError(t, err)
	defer database.Close()

	applyMigrations(t, database)

	extractionRepo := NewAIExtractionRepository(database)

	list, err := extractionRepo.ListAIExtractions(ctx, uuid.NewString())
	require.NoError(t, err)
	assert.Len(t, list, 0)
}
