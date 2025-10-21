package db

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

// AISummary represents an AI-generated summary stored in the database
type AISummary struct {
	ID           string
	TranscriptID string
	SummaryType  string
	Content      SummaryContent
	Model        string
	TokensUsed   int
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// SummaryContent represents the structured JSON content of a summary
type SummaryContent struct {
	Text      string    `json:"text"`
	KeyPoints []string  `json:"key_points,omitempty"`
	Sections  []Section `json:"sections,omitempty"`
}

// Section represents a section within a summary
type Section struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

// AIExtraction represents extracted content from a transcript
type AIExtraction struct {
	ID             string
	TranscriptID   string
	ExtractionType string
	Content        json.RawMessage
	Model          string
	TokensUsed     int
	CreatedAt      time.Time
}

// AITranslation represents a translated transcript
type AITranslation struct {
	ID                string
	TranscriptID      string
	TargetLanguage    string
	TranslatedContent json.RawMessage
	Model             string
	TokensUsed        int
	CreatedAt         time.Time
}

// AISummaryRepository handles database operations for AI summaries
type AISummaryRepository struct {
	db DB
}

// NewAISummaryRepository creates a new AI summary repository
func NewAISummaryRepository(db DB) *AISummaryRepository {
	return &AISummaryRepository{db: db}
}

const insertAISummarySQL = `
INSERT INTO ai_summaries (transcript_id, summary_type, content, model, tokens_used)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, transcript_id, summary_type, content, model, tokens_used, created_at, updated_at;
`

const selectAISummarySQL = `
SELECT id, transcript_id, summary_type, content, model, tokens_used, created_at, updated_at
FROM ai_summaries
WHERE transcript_id = $1 AND summary_type = $2
LIMIT 1;
`

const listAISummariesSQL = `
SELECT id, transcript_id, summary_type, content, model, tokens_used, created_at, updated_at
FROM ai_summaries
WHERE transcript_id = $1
ORDER BY created_at DESC;
`

const deleteAISummarySQL = `
DELETE FROM ai_summaries
WHERE id = $1;
`

// CreateAISummary stores a new AI-generated summary if it does not already exist.
// If a summary already exists for the transcript and type, the existing record is loaded into summary.
func (r *AISummaryRepository) CreateAISummary(ctx context.Context, summary *AISummary) error {
	if r == nil || r.db == nil {
		return errors.New("ai summary repository is nil")
	}
	if summary == nil {
		return errors.New("summary is nil")
	}
	if summary.TranscriptID == "" {
		return errors.New("transcript id is required")
	}
	if summary.SummaryType == "" {
		return errors.New("summary type is required")
	}

	payload, err := json.Marshal(summary.Content)
	if err != nil {
		return fmt.Errorf("marshal summary content: %w", err)
	}

	queryCtx, cancel := withQueryTimeout(ctx)
	defer cancel()

	row := r.db.QueryRow(queryCtx, insertAISummarySQL,
		summary.TranscriptID,
		summary.SummaryType,
		payload,
		summary.Model,
		summary.TokensUsed,
	)

	if err := scanAISummaryRow(row, summary); err != nil {
		if isDuplicateKeyError(err) {
			existing, getErr := r.GetAISummary(ctx, summary.TranscriptID, summary.SummaryType)
			if getErr != nil {
				return fmt.Errorf("fetch existing summary: %w", getErr)
			}
			*summary = *existing
			return nil
		}
		if isConnectionError(err) {
			return fmt.Errorf("database connection failed: %w", err)
		}
		return fmt.Errorf("create ai summary: %w", err)
	}

	return nil
}

// GetAISummary retrieves a summary by transcript ID and type.
func (r *AISummaryRepository) GetAISummary(ctx context.Context, transcriptID string, summaryType string) (*AISummary, error) {
	if r == nil || r.db == nil {
		return nil, errors.New("ai summary repository is nil")
	}
	if transcriptID == "" {
		return nil, errors.New("transcript id is required")
	}
	if summaryType == "" {
		return nil, errors.New("summary type is required")
	}

	queryCtx, cancel := withQueryTimeout(ctx)
	defer cancel()

	row := r.db.QueryRow(queryCtx, selectAISummarySQL, transcriptID, summaryType)
	summary := &AISummary{}
	if err := scanAISummaryRow(row, summary); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		if isConnectionError(err) {
			return nil, fmt.Errorf("database connection failed: %w", err)
		}
		return nil, fmt.Errorf("get ai summary: %w", err)
	}

	return summary, nil
}

// ListAISummaries retrieves all summaries for a transcript.
func (r *AISummaryRepository) ListAISummaries(ctx context.Context, transcriptID string) ([]*AISummary, error) {
	if r == nil || r.db == nil {
		return nil, errors.New("ai summary repository is nil")
	}
	if transcriptID == "" {
		return nil, errors.New("transcript id is required")
	}

	queryCtx, cancel := withQueryTimeout(ctx)
	defer cancel()

	rows, err := r.db.Query(queryCtx, listAISummariesSQL, transcriptID)
	if err != nil {
		if isConnectionError(err) {
			return nil, fmt.Errorf("database connection failed: %w", err)
		}
		return nil, fmt.Errorf("list ai summaries: %w", err)
	}
	defer rows.Close()

	var summaries []*AISummary
	for rows.Next() {
		summary := &AISummary{}
		if err := scanAISummaryRows(rows, summary); err != nil {
			return nil, err
		}
		summaries = append(summaries, summary)
	}

	if err := rows.Err(); err != nil {
		if isConnectionError(err) {
			return nil, fmt.Errorf("database connection failed: %w", err)
		}
		return nil, fmt.Errorf("iterate ai summaries: %w", err)
	}

	return summaries, nil
}

// Delete removes an AI summary by ID.
func (r *AISummaryRepository) Delete(ctx context.Context, id string) error {
	if r == nil || r.db == nil {
		return errors.New("ai summary repository is nil")
	}
	if id == "" {
		return errors.New("id is required")
	}

	queryCtx, cancel := withQueryTimeout(ctx)
	defer cancel()

	if _, err := r.db.Exec(queryCtx, deleteAISummarySQL, id); err != nil {
		if isConnectionError(err) {
			return fmt.Errorf("database connection failed: %w", err)
		}
		return fmt.Errorf("delete ai summary: %w", err)
	}

	return nil
}

func scanAISummaryRow(row pgx.Row, summary *AISummary) error {
	var contentBytes []byte
	if err := row.Scan(
		&summary.ID,
		&summary.TranscriptID,
		&summary.SummaryType,
		&contentBytes,
		&summary.Model,
		&summary.TokensUsed,
		&summary.CreatedAt,
		&summary.UpdatedAt,
	); err != nil {
		return err
	}

	return populateSummaryContent(summary, contentBytes)
}

func scanAISummaryRows(rows pgx.Rows, summary *AISummary) error {
	var contentBytes []byte
	if err := rows.Scan(
		&summary.ID,
		&summary.TranscriptID,
		&summary.SummaryType,
		&contentBytes,
		&summary.Model,
		&summary.TokensUsed,
		&summary.CreatedAt,
		&summary.UpdatedAt,
	); err != nil {
		return fmt.Errorf("scan ai summary: %w", err)
	}

	return populateSummaryContent(summary, contentBytes)
}

func populateSummaryContent(summary *AISummary, contentBytes []byte) error {
	if len(contentBytes) == 0 {
		summary.Content = SummaryContent{}
		return nil
	}

	if err := json.Unmarshal(contentBytes, &summary.Content); err != nil {
		return fmt.Errorf("unmarshal summary content: %w", err)
	}

	return nil
}

// AIExtractionRepository handles database operations for AI extractions
type AIExtractionRepository struct {
	db DB
}

// NewAIExtractionRepository creates a new AI extraction repository
func NewAIExtractionRepository(db DB) *AIExtractionRepository {
	return &AIExtractionRepository{db: db}
}

const insertAIExtractionSQL = `
INSERT INTO ai_extractions (transcript_id, extraction_type, content, model, tokens_used)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, transcript_id, extraction_type, content, model, tokens_used, created_at;
`

const selectAIExtractionSQL = `
SELECT id, transcript_id, extraction_type, content, model, tokens_used, created_at
FROM ai_extractions
WHERE transcript_id = $1 AND extraction_type = $2
LIMIT 1;
`

const listAIExtractionsSQL = `
SELECT id, transcript_id, extraction_type, content, model, tokens_used, created_at
FROM ai_extractions
WHERE transcript_id = $1
ORDER BY created_at DESC;
`

// CreateAIExtraction stores a new AI-generated extraction if it does not already exist.
// If an extraction already exists for the transcript and type, the existing record is loaded into extraction.
func (r *AIExtractionRepository) CreateAIExtraction(ctx context.Context, extraction *AIExtraction) error {
	if r == nil || r.db == nil {
		return errors.New("ai extraction repository is nil")
	}
	if extraction == nil {
		return errors.New("extraction is nil")
	}
	if extraction.TranscriptID == "" {
		return errors.New("transcript id is required")
	}
	if extraction.ExtractionType == "" {
		return errors.New("extraction type is required")
	}

	queryCtx, cancel := withQueryTimeout(ctx)
	defer cancel()

	row := r.db.QueryRow(queryCtx, insertAIExtractionSQL,
		extraction.TranscriptID,
		extraction.ExtractionType,
		extraction.Content,
		extraction.Model,
		extraction.TokensUsed,
	)

	if err := scanAIExtractionRow(row, extraction); err != nil {
		if isDuplicateKeyError(err) {
			existing, getErr := r.GetAIExtraction(ctx, extraction.TranscriptID, extraction.ExtractionType)
			if getErr != nil {
				return fmt.Errorf("fetch existing extraction: %w", getErr)
			}
			*extraction = *existing
			return nil
		}
		if isConnectionError(err) {
			return fmt.Errorf("database connection failed: %w", err)
		}
		return fmt.Errorf("create ai extraction: %w", err)
	}

	return nil
}

// GetAIExtraction retrieves an extraction by transcript ID and type.
func (r *AIExtractionRepository) GetAIExtraction(ctx context.Context, transcriptID string, extractionType string) (*AIExtraction, error) {
	if r == nil || r.db == nil {
		return nil, errors.New("ai extraction repository is nil")
	}
	if transcriptID == "" {
		return nil, errors.New("transcript id is required")
	}
	if extractionType == "" {
		return nil, errors.New("extraction type is required")
	}

	queryCtx, cancel := withQueryTimeout(ctx)
	defer cancel()

	row := r.db.QueryRow(queryCtx, selectAIExtractionSQL, transcriptID, extractionType)
	extraction := &AIExtraction{}
	if err := scanAIExtractionRow(row, extraction); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		if isConnectionError(err) {
			return nil, fmt.Errorf("database connection failed: %w", err)
		}
		return nil, fmt.Errorf("get ai extraction: %w", err)
	}

	return extraction, nil
}

// ListAIExtractions retrieves all extractions for a transcript.
func (r *AIExtractionRepository) ListAIExtractions(ctx context.Context, transcriptID string) ([]*AIExtraction, error) {
	if r == nil || r.db == nil {
		return nil, errors.New("ai extraction repository is nil")
	}
	if transcriptID == "" {
		return nil, errors.New("transcript id is required")
	}

	queryCtx, cancel := withQueryTimeout(ctx)
	defer cancel()

	rows, err := r.db.Query(queryCtx, listAIExtractionsSQL, transcriptID)
	if err != nil {
		if isConnectionError(err) {
			return nil, fmt.Errorf("database connection failed: %w", err)
		}
		return nil, fmt.Errorf("list ai extractions: %w", err)
	}
	defer rows.Close()

	var extractions []*AIExtraction
	for rows.Next() {
		extraction := &AIExtraction{}
		if err := scanAIExtractionRows(rows, extraction); err != nil {
			return nil, err
		}
		extractions = append(extractions, extraction)
	}

	if err := rows.Err(); err != nil {
		if isConnectionError(err) {
			return nil, fmt.Errorf("database connection failed: %w", err)
		}
		return nil, fmt.Errorf("iterate ai extractions: %w", err)
	}

	return extractions, nil
}

func scanAIExtractionRow(row pgx.Row, extraction *AIExtraction) error {
	return row.Scan(
		&extraction.ID,
		&extraction.TranscriptID,
		&extraction.ExtractionType,
		&extraction.Content,
		&extraction.Model,
		&extraction.TokensUsed,
		&extraction.CreatedAt,
	)
}

func scanAIExtractionRows(rows pgx.Rows, extraction *AIExtraction) error {
	if err := rows.Scan(
		&extraction.ID,
		&extraction.TranscriptID,
		&extraction.ExtractionType,
		&extraction.Content,
		&extraction.Model,
		&extraction.TokensUsed,
		&extraction.CreatedAt,
	); err != nil {
		return fmt.Errorf("scan ai extraction: %w", err)
	}
	return nil
}

// Legacy methods for backward compatibility
// Save saves an AI extraction to the database
func (r *AIExtractionRepository) Save(ctx context.Context, extraction *AIExtraction) error {
	return r.CreateAIExtraction(ctx, extraction)
}

// GetByTranscriptIDAndType retrieves an extraction by transcript ID and type
func (r *AIExtractionRepository) GetByTranscriptIDAndType(ctx context.Context, transcriptID, extractionType string) (*AIExtraction, error) {
	return r.GetAIExtraction(ctx, transcriptID, extractionType)
}

// AITranslationRepository handles database operations for AI translations
type AITranslationRepository struct {
	db DB
}

// NewAITranslationRepository creates a new AI translation repository
func NewAITranslationRepository(db DB) *AITranslationRepository {
	return &AITranslationRepository{db: db}
}

// Save saves an AI translation to the database
// Implementation will be completed in Task 6.5
func (r *AITranslationRepository) Save(ctx context.Context, translation *AITranslation) error {
	return errors.New("not implemented yet - will be completed in Task 6.5")
}

// GetByTranscriptIDAndLanguage retrieves a translation by transcript ID and target language
// Implementation will be completed in Task 6.5
func (r *AITranslationRepository) GetByTranscriptIDAndLanguage(ctx context.Context, transcriptID, targetLanguage string) (*AITranslation, error) {
	return nil, pgx.ErrNoRows
}
