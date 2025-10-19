package db

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

// VideoRepository provides helpers for interacting with video records.
type VideoRepository struct {
	db DB
}

// NewVideoRepository constructs a VideoRepository backed by the provided database handle.
func NewVideoRepository(database DB) *VideoRepository {
	return &VideoRepository{db: database}
}

const upsertVideoSQL = `
INSERT INTO videos (youtube_id, title, channel, duration)
VALUES ($1, $2, $3, $4)
ON CONFLICT (youtube_id) DO UPDATE
SET title = EXCLUDED.title,
    channel = EXCLUDED.channel,
    duration = EXCLUDED.duration
RETURNING id, youtube_id, title, channel, duration, created_at;
`

// SaveVideo inserts or updates a video using youtube_id as the uniqueness constraint.
func (r *VideoRepository) SaveVideo(ctx context.Context, video *Video) error {
	if r == nil || r.db == nil {
		return errors.New("video repository is nil")
	}
	if video == nil {
		return errors.New("video is nil")
	}
	if video.YouTubeID == "" {
		return errors.New("youtube id is required")
	}

	row := r.db.QueryRow(ctx, upsertVideoSQL, video.YouTubeID, video.Title, video.Channel, video.Duration)
	if err := row.Scan(&video.ID, &video.YouTubeID, &video.Title, &video.Channel, &video.Duration, &video.CreatedAt); err != nil {
		return fmt.Errorf("save video: %w", err)
	}

	return nil
}

const selectVideoByYouTubeIDSQL = `
SELECT id, youtube_id, title, channel, duration, created_at
FROM videos
WHERE youtube_id = $1
LIMIT 1;
`

// GetVideoByYouTubeID returns a video identified by its YouTube identifier.
func (r *VideoRepository) GetVideoByYouTubeID(ctx context.Context, youtubeID string) (*Video, error) {
	if r == nil || r.db == nil {
		return nil, errors.New("video repository is nil")
	}
	if youtubeID == "" {
		return nil, errors.New("youtube id is required")
	}

	var video Video
	err := r.db.QueryRow(ctx, selectVideoByYouTubeIDSQL, youtubeID).
		Scan(&video.ID, &video.YouTubeID, &video.Title, &video.Channel, &video.Duration, &video.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get video by youtube id: %w", err)
	}

	return &video, nil
}

const selectVideoByIDSQL = `
SELECT id, youtube_id, title, channel, duration, created_at
FROM videos
WHERE id = $1
LIMIT 1;
`

// GetVideoByID returns a video identified by its UUID primary key.
func (r *VideoRepository) GetVideoByID(ctx context.Context, id string) (*Video, error) {
	if r == nil || r.db == nil {
		return nil, errors.New("video repository is nil")
	}
	if id == "" {
		return nil, errors.New("id is required")
	}

	var video Video
	err := r.db.QueryRow(ctx, selectVideoByIDSQL, id).
		Scan(&video.ID, &video.YouTubeID, &video.Title, &video.Channel, &video.Duration, &video.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get video by id: %w", err)
	}

	return &video, nil
}
