package db

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

// TranscriptRepository provides helpers for transcript persistence and retrieval.
type TranscriptRepository struct {
	db DB
}

// NewTranscriptRepository constructs a TranscriptRepository backed by the provided database handle.
func NewTranscriptRepository(database DB) *TranscriptRepository {
	return &TranscriptRepository{db: database}
}

const insertTranscriptSQL = `
INSERT INTO transcripts (video_id, language, content)
VALUES ($1, $2, $3)
RETURNING id, video_id, language, content, created_at;
`

const upsertTranscriptSQL = `
INSERT INTO transcripts (id, video_id, language, content)
VALUES ($1, $2, $3, $4)
ON CONFLICT (id) DO UPDATE
SET video_id = EXCLUDED.video_id,
    language = EXCLUDED.language,
    content = EXCLUDED.content
RETURNING id, video_id, language, content, created_at;
`

// SaveTranscript creates or updates a transcript row, including its JSONB content payload.
func (r *TranscriptRepository) SaveTranscript(ctx context.Context, transcript *Transcript) error {
	if r == nil || r.db == nil {
		return errors.New("transcript repository is nil")
	}
	if transcript == nil {
		return errors.New("transcript is nil")
	}
	if transcript.VideoID == "" {
		return errors.New("video id is required")
	}
	if transcript.Language == "" {
		return errors.New("language is required")
	}

	queryCtx, cancel := withQueryTimeout(ctx)
	defer cancel()

	var row pgx.Row
	if transcript.ID == "" {
		row = r.db.QueryRow(queryCtx, insertTranscriptSQL, transcript.VideoID, transcript.Language, transcript.Content)
	} else {
		row = r.db.QueryRow(queryCtx, upsertTranscriptSQL, transcript.ID, transcript.VideoID, transcript.Language, transcript.Content)
	}

	if err := row.Scan(&transcript.ID, &transcript.VideoID, &transcript.Language, &transcript.Content, &transcript.CreatedAt); err != nil {
		switch {
		case isDuplicateKeyError(err):
			return fmt.Errorf("transcript already exists for video %s (%s): %w", transcript.VideoID, transcript.Language, err)
		case isConnectionError(err):
			return fmt.Errorf("database connection failed: %w", err)
		default:
			return fmt.Errorf("save transcript: %w", err)
		}
	}

	return nil
}

const selectTranscriptsByVideoIDSQL = `
SELECT id, video_id, language, content, created_at
FROM transcripts
WHERE video_id = $1
ORDER BY created_at ASC;
`

// GetTranscriptsByVideoID lists transcripts associated with the provided video identifier.
func (r *TranscriptRepository) GetTranscriptsByVideoID(ctx context.Context, videoID string) ([]*Transcript, error) {
	if r == nil || r.db == nil {
		return nil, errors.New("transcript repository is nil")
	}
	if videoID == "" {
		return nil, errors.New("video id is required")
	}

	queryCtx, cancel := withQueryTimeout(ctx)
	defer cancel()

	rows, err := r.db.Query(queryCtx, selectTranscriptsByVideoIDSQL, videoID)
	if err != nil {
		if isConnectionError(err) {
			return nil, fmt.Errorf("database connection failed: %w", err)
		}
		return nil, fmt.Errorf("get transcripts by video id: %w", err)
	}
	defer rows.Close()

	transcripts := make([]*Transcript, 0)
	for rows.Next() {
		transcript := &Transcript{}
		if err := rows.Scan(&transcript.ID, &transcript.VideoID, &transcript.Language, &transcript.Content, &transcript.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan transcript: %w", err)
		}
		transcripts = append(transcripts, transcript)
	}

	if err := rows.Err(); err != nil {
		if isConnectionError(err) {
			return nil, fmt.Errorf("database connection failed: %w", err)
		}
		return nil, fmt.Errorf("iterate transcripts: %w", err)
	}

	return transcripts, nil
}

const selectTranscriptByIDSQL = `
SELECT id, video_id, language, content, created_at
FROM transcripts
WHERE id = $1
LIMIT 1;
`

// GetTranscriptByID fetches a transcript by its UUID primary key.
func (r *TranscriptRepository) GetTranscriptByID(ctx context.Context, id string) (*Transcript, error) {
	if r == nil || r.db == nil {
		return nil, errors.New("transcript repository is nil")
	}
	if id == "" {
		return nil, errors.New("id is required")
	}

	var transcript Transcript
	queryCtx, cancel := withQueryTimeout(ctx)
	defer cancel()

	err := r.db.QueryRow(queryCtx, selectTranscriptByIDSQL, id).
		Scan(&transcript.ID, &transcript.VideoID, &transcript.Language, &transcript.Content, &transcript.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		if isConnectionError(err) {
			return nil, fmt.Errorf("database connection failed: %w", err)
		}
		return nil, fmt.Errorf("get transcript by id: %w", err)
	}

	return &transcript, nil
}
