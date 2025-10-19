package db

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"time"
)

// ErrNotFound indicates a database record was not found.
var ErrNotFound = errors.New("record not found")

// Video represents a persisted YouTube video record.
type Video struct {
	ID        string    `json:"id"`
	YouTubeID string    `json:"youtube_id"`
	Title     string    `json:"title"`
	Channel   string    `json:"channel"`
	Duration  int       `json:"duration"`
	CreatedAt time.Time `json:"created_at"`
}

// TranscriptSegment describes a single transcript fragment as stored in JSONB.
type TranscriptSegment struct {
	StartMs    int64  `json:"start_ms"`
	DurationMs int64  `json:"duration_ms"`
	Text       string `json:"text"`
}

// TranscriptSegments is a JSONB backed slice of transcript segments.
type TranscriptSegments []TranscriptSegment

// Value implements driver.Valuer so TranscriptSegments can be written to JSONB columns.
func (ts TranscriptSegments) Value() (driver.Value, error) {
	if ts == nil {
		return []byte("[]"), nil
	}

	payload, err := json.Marshal(ts)
	if err != nil {
		return nil, fmt.Errorf("marshal segments: %w", err)
	}
	return payload, nil
}

// Scan implements sql.Scanner so TranscriptSegments can be read from JSONB columns.
func (ts *TranscriptSegments) Scan(value any) error {
	if value == nil {
		*ts = TranscriptSegments{}
		return nil
	}

	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return fmt.Errorf("unexpected type %T for transcript segments", value)
	}

	if len(bytes) == 0 {
		*ts = TranscriptSegments{}
		return nil
	}

	var segments []TranscriptSegment
	if err := json.Unmarshal(bytes, &segments); err != nil {
		return fmt.Errorf("unmarshal segments: %w", err)
	}

	*ts = segments
	return nil
}

// Transcript represents a transcript row along with its JSON content.
type Transcript struct {
	ID        string             `json:"id"`
	VideoID   string             `json:"video_id"`
	Language  string             `json:"language"`
	Content   TranscriptSegments `json:"content"`
	CreatedAt time.Time          `json:"created_at"`
}
