package services

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

// GeminiProvider implements the AIProvider interface using Google's Gemini API
type GeminiProvider struct {
	apiKey      string
	model       string
	maxTokens   int
	temperature float64
	httpClient  *http.Client
}

// NewGeminiProvider creates a new Gemini provider with the given configuration
func NewGeminiProvider(apiKey, model string, maxTokens int, temperature float64) (*GeminiProvider, error) {
	if apiKey == "" {
		return nil, errors.New("Google API key is required")
	}

	// Use default model if not specified
	if model == "" {
		model = "gemini-1.5-flash" // Fast and free
	}

	return &GeminiProvider{
		apiKey:      apiKey,
		model:       model,
		maxTokens:   maxTokens,
		temperature: temperature,
		httpClient:  &http.Client{},
	}, nil
}

type geminiRequest struct {
	Contents         []geminiContent         `json:"contents"`
	GenerationConfig geminiGenerationConfig  `json:"generationConfig"`
	SystemInstruction *geminiSystemInstruction `json:"systemInstruction,omitempty"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
	Role  string       `json:"role,omitempty"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiSystemInstruction struct {
	Parts []geminiPart `json:"parts"`
}

type geminiGenerationConfig struct {
	Temperature     float64 `json:"temperature"`
	MaxOutputTokens int     `json:"maxOutputTokens"`
}

type geminiResponse struct {
	Candidates []geminiCandidate `json:"candidates"`
	UsageMetadata geminiUsageMetadata `json:"usageMetadata"`
}

type geminiCandidate struct {
	Content geminiContent `json:"content"`
}

type geminiUsageMetadata struct {
	PromptTokenCount     int `json:"promptTokenCount"`
	CandidatesTokenCount int `json:"candidatesTokenCount"`
	TotalTokenCount      int `json:"totalTokenCount"`
}

func (p *GeminiProvider) complete(ctx context.Context, systemPrompt, userPrompt string) (string, int, error) {
	reqBody := geminiRequest{
		Contents: []geminiContent{
			{
				Parts: []geminiPart{
					{Text: userPrompt},
				},
				Role: "user",
			},
		},
		GenerationConfig: geminiGenerationConfig{
			Temperature:     p.temperature,
			MaxOutputTokens: p.maxTokens,
		},
	}

	// Add system instruction if provided
	if systemPrompt != "" {
		reqBody.SystemInstruction = &geminiSystemInstruction{
			Parts: []geminiPart{
				{Text: systemPrompt},
			},
		}
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", 0, fmt.Errorf("marshal request: %w", err)
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", p.model, p.apiKey)

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", 0, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return "", 0, fmt.Errorf("gemini completion: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", 0, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", 0, fmt.Errorf("gemini API error (status %d): %s", resp.StatusCode, string(body))
	}

	var geminiResp geminiResponse
	if err := json.Unmarshal(body, &geminiResp); err != nil {
		return "", 0, fmt.Errorf("unmarshal response: %w", err)
	}

	if len(geminiResp.Candidates) == 0 {
		return "", 0, errors.New("no candidates in response")
	}

	if len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return "", 0, errors.New("no content in response")
	}

	totalTokens := geminiResp.UsageMetadata.TotalTokenCount
	return geminiResp.Candidates[0].Content.Parts[0].Text, totalTokens, nil
}

// Summarize generates a summary of the given text
func (p *GeminiProvider) Summarize(ctx context.Context, text string, summaryType string) (*AISummary, error) {
	if p == nil {
		return nil, errors.New("gemini provider is nil")
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
		return nil, translateGeminiError(err)
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
func (p *GeminiProvider) Extract(ctx context.Context, text string, extractionType string) (*AIExtraction, error) {
	if p == nil {
		return nil, errors.New("gemini provider is nil")
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
		fmt.Fprintf(os.Stderr, "DEBUG Gemini Extract - complete() error: %v\n", err)
		return nil, translateGeminiError(err)
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
func (p *GeminiProvider) Answer(ctx context.Context, text string, question string) (*AIAnswer, error) {
	if p == nil {
		return nil, errors.New("gemini provider is nil")
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
		return nil, translateGeminiError(err)
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

// Translate is not implemented for Gemini yet
func (p *GeminiProvider) Translate(ctx context.Context, text string, targetLang string) (*AITranslation, error) {
	return nil, errors.New("translation not implemented for Gemini provider")
}

func translateGeminiError(err error) error {
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
