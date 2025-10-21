package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

type openAIClient interface {
	CreateChatCompletion(ctx context.Context, request openai.ChatCompletionRequest) (openai.ChatCompletionResponse, error)
}

// OpenAIProvider implements the AIProvider interface using OpenAI's API
type OpenAIProvider struct {
	client      openAIClient
	model       string
	maxTokens   int
	temperature float32
}

// NewOpenAIProvider creates a new OpenAI provider with the given configuration
func NewOpenAIProvider(apiKey, model string, maxTokens int, temperature float64) (*OpenAIProvider, error) {
	if apiKey == "" {
		return nil, errors.New("OpenAI API key is required")
	}

	client := openai.NewClient(apiKey)

	return &OpenAIProvider{
		client:      client,
		model:       model,
		maxTokens:   maxTokens,
		temperature: float32(temperature),
	}, nil
}

// Summarize generates a summary of the given text
func (p *OpenAIProvider) Summarize(ctx context.Context, text string, summaryType string) (*AISummary, error) {
	if p == nil {
		return nil, errors.New("openai provider is nil")
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
		return nil, translateOpenAIError(err)
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
func (p *OpenAIProvider) Extract(ctx context.Context, text string, extractionType string) (*AIExtraction, error) {
	if p == nil {
		return nil, errors.New("openai provider is nil")
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
		return nil, translateOpenAIError(err)
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

// Translate translates the text to the target language
// Implementation will be completed in Task 6.5
func (p *OpenAIProvider) Translate(ctx context.Context, text string, targetLang string) (*AITranslation, error) {
	return nil, errors.New("not implemented yet - will be completed in Task 6.5")
}

// Answer answers a question about the text
func (p *OpenAIProvider) Answer(ctx context.Context, text string, question string) (*AIAnswer, error) {
	if p == nil {
		return nil, errors.New("openai provider is nil")
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
		return nil, translateOpenAIError(err)
	}

	answer, err := decodeAnswerPayload(raw)
	if err != nil {
		return nil, fmt.Errorf("parse answer response: %w", err)
	}

	return &AIAnswer{
		Answer:     answer.Answer,
		Confidence: answer.Confidence,
		Sources:    answer.Sources,
		NotFound:   answer.NotFound,
		Model:      p.model,
		TokensUsed: tokensUsed,
	}, nil
}

// complete is a helper function to call the OpenAI API
// This will be used by the Summarize, Extract, Translate, and Answer methods
func (p *OpenAIProvider) complete(ctx context.Context, systemPrompt, userPrompt string) (string, int, error) {
	resp, err := p.client.CreateChatCompletion(
		ctx,
		openai.ChatCompletionRequest{
			Model: p.model,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: systemPrompt,
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: userPrompt,
				},
			},
			MaxTokens:   p.maxTokens,
			Temperature: p.temperature,
		},
	)

	if err != nil {
		return "", 0, fmt.Errorf("openai completion: %w", err)
	}

	if len(resp.Choices) == 0 {
		return "", 0, errors.New("no completion choices returned")
	}

	return resp.Choices[0].Message.Content, resp.Usage.TotalTokens, nil
}

const baseSystemPrompt = `
You are an expert summarizer for spoken transcripts. Always respond with strict JSON using the schema:
{
  "text": string,
  "key_points": string[],
  "sections": [{"title": string, "content": string}]
}
Do not include any additional commentary, code fences, or explanations outside the JSON object. %s
Ensure responses are factual, concise, and written in a professional tone.`

var summarySystemPrompts = map[string]string{
	"brief":      `Provide a concise 2-3 sentence summary capturing the main topic and key message. Populate only the "text" field and leave "key_points" and "sections" empty arrays.`,
	"detailed":   `Create a comprehensive summary with an introduction, 3-5 detailed sections, and a conclusion. Fill the "sections" array with informative titles and paragraph content. Include a short overall overview in "text" and leave "key_points" empty.`,
	"key_points": `Extract 5-10 key takeaways as a bulleted list in markdown format. Populate the "key_points" array with individual bullet strings and provide the combined markdown bullets in "text". Leave "sections" empty.`,
}

var extractionSystemPrompts = map[string]string{
	"code": `You are a code extraction specialist. Extract all code snippets, commands, or technical examples from the transcript.
Return ONLY a valid JSON object with this exact structure (no additional text, no code fences):
{
  "items": [
    {
      "language": "python",
      "code": "print('hello')",
      "context": "Example hello world program",
      "timestamp_hint": "mentioned at 2:30"
    }
  ]
}

Rules:
- Extract only actual code, commands, or technical syntax
- Identify the programming language (python, javascript, bash, sql, etc.)
- Provide context explaining what the code does
- Include timestamp hints if the speaker mentions a time
- If no code is found, return {"items": []}
- Do not include explanatory text outside the JSON structure`,

	"quotes": `You are a quote extraction specialist. Extract notable quotes, key statements, and memorable phrases from the transcript.
Return ONLY a valid JSON object with this exact structure (no additional text, no code fences):
{
  "items": [
    {
      "quote": "Code is read far more often than it is written",
      "speaker": "Guido van Rossum",
      "context": "Discussing the importance of readable code",
      "importance": "high"
    }
  ]
}

Rules:
- Extract direct quotes that are impactful, memorable, or insightful
- Identify the speaker if mentioned in the transcript
- Provide context for why the quote is significant
- Rate importance as "high", "medium", or "low"
- If no notable quotes are found, return {"items": []}
- Do not include explanatory text outside the JSON structure`,

	"action_items": `You are an action item extraction specialist. Extract actionable steps, recommendations, tasks, and to-dos from the transcript.
Return ONLY a valid JSON object with this exact structure (no additional text, no code fences):
{
  "items": [
    {
      "action": "Set up automated testing pipeline",
      "category": "task",
      "priority": "high",
      "context": "Required for CI/CD implementation"
    }
  ]
}

Rules:
- Extract clear, actionable items that listeners should do
- Categorize as "task" (specific action), "recommendation" (suggestion), or "step" (process step)
- Assign priority as "high", "medium", or "low"
- Provide context explaining why this action matters
- If no action items are found, return {"items": []}
- Do not include explanatory text outside the JSON structure`,
}

const qaSystemPrompt = `You are a Q&A specialist analyzing video transcripts. Answer questions accurately based ONLY on the provided transcript content. If the answer is not in the transcript, clearly state that.

Return your response as JSON with this exact structure:
{
  "answer": "The detailed answer text",
  "confidence": "high" | "medium" | "low",
  "sources": ["relevant quote 1", "relevant quote 2"],
  "not_found": false
}

If the answer is NOT in the transcript, return:
{
  "answer": "This information is not mentioned in the transcript.",
  "confidence": "high",
  "sources": [],
  "not_found": true
}

Guidelines:
- Be concise but complete
- Quote relevant parts of the transcript in "sources"
- Use "high" confidence when answer is explicit
- Use "medium" when inferring from context
- Use "low" when answer is uncertain
- NEVER make up information not in the transcript
- Do not include code fences or additional text outside the JSON object`

func buildUserPrompt(summaryType, text string) string {
	var builder strings.Builder
	builder.WriteString("Summary type: ")
	builder.WriteString(summaryType)
	builder.WriteString("\nTranscript:\n")
	builder.WriteString(strings.TrimSpace(text))
	return builder.String()
}

func buildQAUserPrompt(question, text string) string {
	var builder strings.Builder
	builder.WriteString("Question: ")
	builder.WriteString(strings.TrimSpace(question))
	builder.WriteString("\n\nTranscript:\n")
	builder.WriteString(strings.TrimSpace(text))
	return builder.String()
}

type summaryPayload struct {
	Text      string              `json:"text"`
	KeyPoints []string            `json:"key_points"`
	Sections  []summaryPayloadSec `json:"sections"`
}

type summaryPayloadSec struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

func decodeSummaryPayload(raw string) (*summaryPayload, error) {
	normalized := strings.TrimSpace(raw)
	normalized = strings.TrimPrefix(normalized, "```json")
	normalized = strings.TrimPrefix(normalized, "```JSON")
	normalized = strings.TrimPrefix(normalized, "```")
	normalized = strings.TrimSpace(normalized)
	normalized = strings.TrimSuffix(normalized, "```")
	normalized = strings.TrimSpace(normalized)

	var payload summaryPayload
	if err := json.Unmarshal([]byte(normalized), &payload); err != nil {
		return nil, err
	}

	payload.Text = strings.TrimSpace(payload.Text)

	for i := range payload.KeyPoints {
		payload.KeyPoints[i] = strings.TrimSpace(payload.KeyPoints[i])
	}

	for i := range payload.Sections {
		payload.Sections[i].Title = strings.TrimSpace(payload.Sections[i].Title)
		payload.Sections[i].Content = strings.TrimSpace(payload.Sections[i].Content)
	}

	return &payload, nil
}

func convertPayloadSections(sections []summaryPayloadSec) []SummarySection {
	if len(sections) == 0 {
		return nil
	}

	result := make([]SummarySection, 0, len(sections))
	for _, section := range sections {
		if section.Title == "" && section.Content == "" {
			continue
		}
		result = append(result, SummarySection{
			Title:   section.Title,
			Content: section.Content,
		})
	}
	return result
}

type extractionPayload struct {
	Items []ExtractionItem `json:"items"`
}

func decodeExtractionPayload(raw string) ([]ExtractionItem, error) {
	normalized := strings.TrimSpace(raw)
	normalized = strings.TrimPrefix(normalized, "```json")
	normalized = strings.TrimPrefix(normalized, "```JSON")
	normalized = strings.TrimPrefix(normalized, "```")
	normalized = strings.TrimSpace(normalized)
	normalized = strings.TrimSuffix(normalized, "```")
	normalized = strings.TrimSpace(normalized)

	var payload extractionPayload
	if err := json.Unmarshal([]byte(normalized), &payload); err != nil {
		return nil, err
	}

	// Trim whitespace from all string fields in items
	for i := range payload.Items {
		payload.Items[i].Content = strings.TrimSpace(payload.Items[i].Content)
		payload.Items[i].Context = strings.TrimSpace(payload.Items[i].Context)
		payload.Items[i].Language = strings.TrimSpace(payload.Items[i].Language)

		// Trim whitespace from metadata values
		for key, value := range payload.Items[i].Metadata {
			payload.Items[i].Metadata[key] = strings.TrimSpace(value)
		}
	}

	return payload.Items, nil
}

type answerPayload struct {
	Answer     string   `json:"answer"`
	Confidence string   `json:"confidence"`
	Sources    []string `json:"sources"`
	NotFound   bool     `json:"not_found"`
}

func decodeAnswerPayload(raw string) (*answerPayload, error) {
	normalized := strings.TrimSpace(raw)
	normalized = strings.TrimPrefix(normalized, "```json")
	normalized = strings.TrimPrefix(normalized, "```JSON")
	normalized = strings.TrimPrefix(normalized, "```")
	normalized = strings.TrimSpace(normalized)
	normalized = strings.TrimSuffix(normalized, "```")
	normalized = strings.TrimSpace(normalized)

	var payload answerPayload
	if err := json.Unmarshal([]byte(normalized), &payload); err != nil {
		return nil, err
	}

	// Trim whitespace from string fields
	payload.Answer = strings.TrimSpace(payload.Answer)
	payload.Confidence = strings.ToLower(strings.TrimSpace(payload.Confidence))

	// Trim whitespace from sources
	for i := range payload.Sources {
		payload.Sources[i] = strings.TrimSpace(payload.Sources[i])
	}

	// Validate confidence level
	if payload.Confidence != "high" && payload.Confidence != "medium" && payload.Confidence != "low" {
		// Default to medium if invalid
		payload.Confidence = "medium"
	}

	return &payload, nil
}

func translateOpenAIError(err error) error {
	var apiErr *openai.APIError
	if errors.As(err, &apiErr) {
		switch apiErr.HTTPStatusCode {
		case 429:
			return fmt.Errorf("%w: %v", ErrAIRateLimited, err)
		case 500, 502, 503, 504:
			return fmt.Errorf("%w: %v", ErrAIServiceUnavailable, err)
		default:
			return fmt.Errorf("openai api error (%d): %w", apiErr.HTTPStatusCode, err)
		}
	}

	return err
}
