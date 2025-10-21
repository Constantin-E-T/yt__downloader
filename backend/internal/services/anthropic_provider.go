package services

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// AnthropicProvider implements the AIProvider interface using Anthropic's Claude API
type AnthropicProvider struct {
	apiKey      string
	model       string
	maxTokens   int
	temperature float64
	httpClient  *http.Client
}

// NewAnthropicProvider creates a new Anthropic provider with the given configuration
func NewAnthropicProvider(apiKey, model string, maxTokens int, temperature float64) (*AnthropicProvider, error) {
	if apiKey == "" {
		return nil, errors.New("Anthropic API key is required")
	}

	return &AnthropicProvider{
		apiKey:      apiKey,
		model:       model,
		maxTokens:   maxTokens,
		temperature: temperature,
		httpClient:  &http.Client{},
	}, nil
}

type anthropicRequest struct {
	Model       string              `json:"model"`
	Messages    []anthropicMessage  `json:"messages"`
	MaxTokens   int                 `json:"max_tokens"`
	Temperature float64             `json:"temperature"`
	System      string              `json:"system,omitempty"`
}

type anthropicMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type anthropicResponse struct {
	Content []anthropicContent `json:"content"`
	Usage   anthropicUsage     `json:"usage"`
}

type anthropicContent struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type anthropicUsage struct {
	InputTokens  int `json:"input_tokens"`
	OutputTokens int `json:"output_tokens"`
}

func (p *AnthropicProvider) complete(ctx context.Context, systemPrompt, userPrompt string) (string, int, error) {
	reqBody := anthropicRequest{
		Model: p.model,
		Messages: []anthropicMessage{
			{
				Role:    "user",
				Content: userPrompt,
			},
		},
		MaxTokens:   p.maxTokens,
		Temperature: p.temperature,
		System:      systemPrompt,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", 0, fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.anthropic.com/v1/messages", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", 0, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", p.apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return "", 0, fmt.Errorf("anthropic completion: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", 0, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", 0, fmt.Errorf("anthropic API error (status %d): %s", resp.StatusCode, string(body))
	}

	var anthropicResp anthropicResponse
	if err := json.Unmarshal(body, &anthropicResp); err != nil {
		return "", 0, fmt.Errorf("unmarshal response: %w", err)
	}

	if len(anthropicResp.Content) == 0 {
		return "", 0, errors.New("no content in response")
	}

	totalTokens := anthropicResp.Usage.InputTokens + anthropicResp.Usage.OutputTokens
	return anthropicResp.Content[0].Text, totalTokens, nil
}

// Summarize generates a summary of the given text
func (p *AnthropicProvider) Summarize(ctx context.Context, text string, summaryType string) (*AISummary, error) {
	if p == nil {
		return nil, errors.New("anthropic provider is nil")
	}

	cleanType := strings.ToLower(strings.TrimSpace(summaryType))
	if cleanType == "" {
		return nil, errors.New("summary type is required")
	}

	systemInstructions, ok := summarySystemPrompts[cleanType]
	if !ok {
		return nil, fmt.Errorf("unsupported summary type: %s", summaryType)
	}

	if strings.TrimSpace(text) == "" {
		return nil, errors.New("text to summarize is required")
	}

	systemPrompt := fmt.Sprintf(baseSystemPrompt, systemInstructions)
	userPrompt := buildUserPrompt(cleanType, text)

	raw, tokensUsed, err := p.complete(ctx, systemPrompt, userPrompt)
	if err != nil {
		return nil, translateAnthropicError(err)
	}

	payload, err := decodeSummaryPayload(raw)
	if err != nil {
		return nil, fmt.Errorf("parse summary response: %w", err)
	}

	return &AISummary{
		Content: SummaryContent{
			Text:      payload.Text,
			KeyPoints: payload.KeyPoints,
			Sections:  convertPayloadSections(payload.Sections),
		},
		Model:      p.model,
		TokensUsed: tokensUsed,
		Type:       cleanType,
	}, nil
}

// Extract extracts specific content from the text
func (p *AnthropicProvider) Extract(ctx context.Context, text string, extractionType string) (*AIExtraction, error) {
	if p == nil {
		return nil, errors.New("anthropic provider is nil")
	}

	cleanType := strings.ToLower(strings.TrimSpace(extractionType))
	if cleanType == "" {
		return nil, errors.New("extraction type is required")
	}

	systemPrompt, ok := extractionSystemPrompts[cleanType]
	if !ok {
		return nil, fmt.Errorf("unsupported extraction type: %s", extractionType)
	}

	if strings.TrimSpace(text) == "" {
		return nil, errors.New("text to extract from is required")
	}

	userPrompt := fmt.Sprintf("Extract %s from the following transcript:\n\n%s", cleanType, strings.TrimSpace(text))

	raw, tokensUsed, err := p.complete(ctx, systemPrompt, userPrompt)
	if err != nil {
		return nil, translateAnthropicError(err)
	}

	items, err := decodeExtractionPayload(raw)
	if err != nil {
		return nil, fmt.Errorf("parse extraction response: %w", err)
	}

	return &AIExtraction{
		Items:      items,
		Model:      p.model,
		TokensUsed: tokensUsed,
		Type:       cleanType,
	}, nil
}

// Answer answers a question about the text
func (p *AnthropicProvider) Answer(ctx context.Context, text string, question string) (*AIAnswer, error) {
	if p == nil {
		return nil, errors.New("anthropic provider is nil")
	}

	if strings.TrimSpace(question) == "" {
		return nil, errors.New("question is required")
	}

	if strings.TrimSpace(text) == "" {
		return nil, errors.New("text is required")
	}

	systemPrompt := qaSystemPrompt
	userPrompt := buildQAUserPrompt(question, text)

	raw, tokensUsed, err := p.complete(ctx, systemPrompt, userPrompt)
	if err != nil {
		return nil, translateAnthropicError(err)
	}

	answer, err := decodeAnswerPayload(raw)
	if err != nil {
		return nil, fmt.Errorf("parse answer response: %w", err)
	}

	return &AIAnswer{
		Question:   question,
		Answer:     answer.Answer,
		Confidence: answer.Confidence,
		Sources:    answer.Sources,
		NotFound:   answer.NotFound,
		Model:      p.model,
		TokensUsed: tokensUsed,
	}, nil
}

// Translate is not implemented for Anthropic yet
func (p *AnthropicProvider) Translate(ctx context.Context, text string, targetLang string) (*AITranslation, error) {
	return nil, errors.New("translation not implemented for Anthropic provider")
}

func translateAnthropicError(err error) error {
	errStr := err.Error()

	if strings.Contains(errStr, "status 429") || strings.Contains(errStr, "rate") {
		return ErrAIRateLimited
	}

	if strings.Contains(errStr, "quota") || strings.Contains(errStr, "limit") {
		return ErrAIQuotaExceeded
	}

	if strings.Contains(errStr, "status 5") || strings.Contains(errStr, "unavailable") {
		return ErrAIServiceUnavailable
	}

	return err
}
