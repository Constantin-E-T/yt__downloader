package services

import (
	"context"
	"errors"
)

// Custom error types for AI operations
var (
	ErrAIProviderNotConfigured = errors.New("AI provider not configured")
	ErrInvalidAIProvider       = errors.New("invalid AI provider")
	ErrAIRateLimited           = errors.New("AI provider rate limited")
	ErrAIQuotaExceeded         = errors.New("AI quota exceeded")
	ErrAIServiceUnavailable    = errors.New("AI service unavailable")
)

// AIProvider interface for multiple AI backends (OpenAI, Anthropic, etc.)
type AIProvider interface {
	Summarize(ctx context.Context, text string, summaryType string) (*AISummary, error)
	Extract(ctx context.Context, text string, extractionType string) (*AIExtraction, error)
	Translate(ctx context.Context, text string, targetLang string) (*AITranslation, error)
	Answer(ctx context.Context, text string, question string) (*AIAnswer, error)
}

// AISummary represents an AI-generated summary
type AISummary struct {
	Content    SummaryContent
	Model      string
	TokensUsed int
	Type       string // 'brief', 'detailed', 'key_points'
}

// SummaryContent captures structured summary data returned by providers.
type SummaryContent struct {
	Text      string           `json:"text"`
	KeyPoints []string         `json:"key_points,omitempty"`
	Sections  []SummarySection `json:"sections,omitempty"`
}

// SummarySection represents a titled section of a detailed summary.
type SummarySection struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

// AIExtraction represents extracted content (code, quotes, action items)
type AIExtraction struct {
	Items      []ExtractionItem
	Model      string
	TokensUsed int
	Type       string // 'code', 'quotes', 'action_items'
}

// ExtractionItem represents a single extracted item with flexible structure
// The actual fields depend on the extraction type:
// - code: language, code, context, timestamp_hint
// - quotes: quote, speaker, context, importance
// - action_items: action, category, priority, context
type ExtractionItem struct {
	// Common fields
	Context string `json:"context,omitempty"`

	// Code extraction fields
	Language      string `json:"language,omitempty"`
	Code          string `json:"code,omitempty"`
	TimestampHint string `json:"timestamp_hint,omitempty"`

	// Quote extraction fields
	Quote      string `json:"quote,omitempty"`
	Speaker    string `json:"speaker,omitempty"`
	Importance string `json:"importance,omitempty"`

	// Action item extraction fields
	Action   string `json:"action,omitempty"`
	Category string `json:"category,omitempty"`
	Priority string `json:"priority,omitempty"`

	// Legacy/generic field
	Content  string            `json:"content,omitempty"`
	Metadata map[string]string `json:"metadata,omitempty"`
}

// AITranslation represents translated content
type AITranslation struct {
	TranslatedText string
	Model          string
	TokensUsed     int
	TargetLanguage string
}

// AIAnswer represents a Q&A response
type AIAnswer struct {
	ID           string
	TranscriptID string
	Question     string
	Answer       string
	Confidence   string   // "high", "medium", "low"
	Sources      []string // Relevant quotes from transcript
	NotFound     bool     // True if answer not in transcript
	Model        string
	TokensUsed   int
}

// AIService manages AI operations with a configured provider
type AIService struct {
	provider AIProvider
	model    string
}

// NewAIService creates a new AI service with the given provider and model
func NewAIService(provider AIProvider, model string) *AIService {
	return &AIService{
		provider: provider,
		model:    model,
	}
}

// Summarize generates a summary of the given text
func (s *AIService) Summarize(ctx context.Context, text string, summaryType string) (*AISummary, error) {
	if s.provider == nil {
		return nil, ErrAIProviderNotConfigured
	}
	return s.provider.Summarize(ctx, text, summaryType)
}

// Extract extracts specific content from the text (code, quotes, action items)
func (s *AIService) Extract(ctx context.Context, text string, extractionType string) (*AIExtraction, error) {
	if s.provider == nil {
		return nil, ErrAIProviderNotConfigured
	}
	return s.provider.Extract(ctx, text, extractionType)
}

// Translate translates the text to the target language
func (s *AIService) Translate(ctx context.Context, text string, targetLang string) (*AITranslation, error) {
	if s.provider == nil {
		return nil, ErrAIProviderNotConfigured
	}
	return s.provider.Translate(ctx, text, targetLang)
}

// Answer answers a question about the text
func (s *AIService) Answer(ctx context.Context, text string, question string) (*AIAnswer, error) {
	if s.provider == nil {
		return nil, ErrAIProviderNotConfigured
	}
	return s.provider.Answer(ctx, text, question)
}
