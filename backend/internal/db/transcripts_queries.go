package db

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

const selectTranscriptByVideoIDAndLanguageSQL = `
SELECT id, video_id, language, content, created_at
FROM transcripts
WHERE video_id = $1 AND language = $2
ORDER BY created_at DESC
LIMIT 1;
`

// GetTranscriptByVideoIDAndLanguage returns the most recent transcript for a video in a specific language.
func (r *TranscriptRepository) GetTranscriptByVideoIDAndLanguage(ctx context.Context, videoID, language string) (*Transcript, error) {
	if r == nil || r.db == nil {
		return nil, errors.New("transcript repository is nil")
	}
	if videoID == "" {
		return nil, errors.New("video id is required")
	}
	if language == "" {
		return nil, errors.New("language is required")
	}

	queryCtx, cancel := withQueryTimeout(ctx)
	defer cancel()

	var transcript Transcript
	err := r.db.QueryRow(queryCtx, selectTranscriptByVideoIDAndLanguageSQL, videoID, language).
		Scan(&transcript.ID, &transcript.VideoID, &transcript.Language, &transcript.Content, &transcript.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get transcript by video id and language: %w", err)
	}

	return &transcript, nil
}

const selectTranscriptsByVideoIDPaginatedSQL = `
SELECT id, video_id, language, content, created_at
FROM transcripts
WHERE video_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
`

// GetTranscriptsByVideoIDWithPagination returns transcripts with limit/offset support.
func (r *TranscriptRepository) GetTranscriptsByVideoIDWithPagination(ctx context.Context, videoID string, limit, offset int) ([]*Transcript, error) {
	if r == nil || r.db == nil {
		return nil, errors.New("transcript repository is nil")
	}
	if videoID == "" {
		return nil, errors.New("video id is required")
	}
	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	queryCtx, cancel := withQueryTimeout(ctx)
	defer cancel()

	rows, err := r.db.Query(queryCtx, selectTranscriptsByVideoIDPaginatedSQL, videoID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("get transcripts by video id with pagination: %w", err)
	}
	defer rows.Close()

	transcripts := make([]*Transcript, 0, limit)
	for rows.Next() {
		transcript := &Transcript{}
		if err := rows.Scan(&transcript.ID, &transcript.VideoID, &transcript.Language, &transcript.Content, &transcript.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan transcript: %w", err)
		}
		transcripts = append(transcripts, transcript)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate transcripts: %w", err)
	}

	return transcripts, nil
}
