package db

import (
	"context"
	"testing"

	"github.com/google/uuid"
)

func BenchmarkGetVideoByYouTubeID(b *testing.B) {
	container := setupPostgresContainer(b)

	ctx := context.Background()
	database, err := Connect(ctx, container.ConnectionString)
	if err != nil {
		b.Fatalf("connect database: %v", err)
	}
	b.Cleanup(func() {
		database.Close()
	})

	applyMigrations(b, database)

	repo := NewVideoRepository(database)
	video := &Video{
		YouTubeID: uuid.NewString(),
		Title:     "Benchmark Video",
		Channel:   "Benchmark Channel",
		Duration:  120,
	}
	if err := repo.SaveVideo(ctx, video); err != nil {
		b.Fatalf("seed video: %v", err)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		if _, err := repo.GetVideoByYouTubeID(ctx, video.YouTubeID); err != nil {
			b.Fatalf("get video: %v", err)
		}
	}
}
