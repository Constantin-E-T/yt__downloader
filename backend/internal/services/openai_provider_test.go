package services

import (
	"context"
	"errors"
	"testing"

	openai "github.com/sashabaranov/go-openai"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockChatCompletionClient struct {
	response openai.ChatCompletionResponse
	err      error
	calls    int
}

func (m *mockChatCompletionClient) CreateChatCompletion(ctx context.Context, request openai.ChatCompletionRequest) (openai.ChatCompletionResponse, error) {
	m.calls++
	if m.err != nil {
		return openai.ChatCompletionResponse{}, m.err
	}
	return m.response, nil
}

func TestNewOpenAIProvider(t *testing.T) {
	tests := []struct {
		name        string
		apiKey      string
		model       string
		maxTokens   int
		temperature float64
		wantErr     bool
		errContains string
	}{
		{
			name:        "valid configuration",
			apiKey:      "sk-test123",
			model:       "gpt-4",
			maxTokens:   4000,
			temperature: 0.7,
			wantErr:     false,
		},
		{
			name:        "missing api key",
			apiKey:      "",
			model:       "gpt-4",
			maxTokens:   4000,
			temperature: 0.7,
			wantErr:     true,
			errContains: "API key is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			provider, err := NewOpenAIProvider(tt.apiKey, tt.model, tt.maxTokens, tt.temperature)

			if tt.wantErr {
				require.Error(t, err)
				if tt.errContains != "" {
					assert.Contains(t, err.Error(), tt.errContains)
				}
				assert.Nil(t, provider)
				return
			}

			require.NoError(t, err)
			require.NotNil(t, provider)
			assert.Equal(t, tt.model, provider.model)
			assert.Equal(t, tt.maxTokens, provider.maxTokens)
			assert.Equal(t, float32(tt.temperature), provider.temperature)
		})
	}
}

func TestOpenAIProvider_Summarize_Brief(t *testing.T) {
	mockClient := &mockChatCompletionClient{
		response: openai.ChatCompletionResponse{
			Choices: []openai.ChatCompletionChoice{{
				Message: openai.ChatCompletionMessage{
					Role:    openai.ChatMessageRoleAssistant,
					Content: `{"text":"Concise summary.","key_points":[],"sections":[]}`,
				},
			}},
			Usage: openai.Usage{TotalTokens: 128},
		},
	}

	provider := &OpenAIProvider{
		client:      mockClient,
		model:       "gpt-4",
		maxTokens:   4000,
		temperature: 0.7,
	}

	summary, err := provider.Summarize(context.Background(), "sample transcript", "brief")
	require.NoError(t, err)
	require.NotNil(t, summary)

	assert.Equal(t, "brief", summary.Type)
	assert.Equal(t, "gpt-4", summary.Model)
	assert.Equal(t, 128, summary.TokensUsed)
	assert.Equal(t, "Concise summary.", summary.Content.Text)
	assert.Empty(t, summary.Content.KeyPoints)
	assert.Empty(t, summary.Content.Sections)
	assert.Equal(t, 1, mockClient.calls)
}

func TestOpenAIProvider_Summarize_Detailed(t *testing.T) {
	mockClient := &mockChatCompletionClient{
		response: openai.ChatCompletionResponse{
			Choices: []openai.ChatCompletionChoice{{
				Message: openai.ChatCompletionMessage{
					Role:    openai.ChatMessageRoleAssistant,
					Content: `{"text":"Overview","key_points":[],"sections":[{"title":"Intro","content":"Intro details"},{"title":"Main","content":"Main details"}]}`,
				},
			}},
			Usage: openai.Usage{TotalTokens: 256},
		},
	}

	provider := &OpenAIProvider{
		client:      mockClient,
		model:       "gpt-4",
		maxTokens:   4000,
		temperature: 0.7,
	}

	summary, err := provider.Summarize(context.Background(), "sample transcript", "detailed")
	require.NoError(t, err)
	require.NotNil(t, summary)

	assert.Equal(t, "detailed", summary.Type)
	assert.Equal(t, "Overview", summary.Content.Text)
	require.Len(t, summary.Content.Sections, 2)
	assert.Equal(t, "Intro", summary.Content.Sections[0].Title)
	assert.Empty(t, summary.Content.KeyPoints)
}

func TestOpenAIProvider_Summarize_KeyPoints(t *testing.T) {
	mockClient := &mockChatCompletionClient{
		response: openai.ChatCompletionResponse{
			Choices: []openai.ChatCompletionChoice{{
				Message: openai.ChatCompletionMessage{
					Role:    openai.ChatMessageRoleAssistant,
					Content: `{"text":"- Point one\n- Point two","key_points":["Point one","Point two"],"sections":[]}`,
				},
			}},
			Usage: openai.Usage{TotalTokens: 300},
		},
	}

	provider := &OpenAIProvider{
		client:      mockClient,
		model:       "gpt-4",
		maxTokens:   4000,
		temperature: 0.7,
	}

	summary, err := provider.Summarize(context.Background(), "sample transcript", "key_points")
	require.NoError(t, err)
	require.NotNil(t, summary)

	assert.Equal(t, "key_points", summary.Type)
	assert.Equal(t, []string{"Point one", "Point two"}, summary.Content.KeyPoints)
	assert.Contains(t, summary.Content.Text, "Point one")
	assert.Empty(t, summary.Content.Sections)
}

func TestOpenAIProvider_Summarize_InvalidType(t *testing.T) {
	provider := &OpenAIProvider{client: &mockChatCompletionClient{}, model: "gpt-4"}

	_, err := provider.Summarize(context.Background(), "sample transcript", "unsupported")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "unsupported summary type")
}

func TestOpenAIProvider_Summarize_APIErrors(t *testing.T) {
	apiErr := &openai.APIError{HTTPStatusCode: 429, Message: "rate limit"}
	mockClient := &mockChatCompletionClient{err: apiErr}

	provider := &OpenAIProvider{
		client:      mockClient,
		model:       "gpt-4",
		maxTokens:   4000,
		temperature: 0.7,
	}

	_, err := provider.Summarize(context.Background(), "sample", "brief")
	require.Error(t, err)
	assert.True(t, errors.Is(err, ErrAIRateLimited))
}

func TestOpenAIProvider_Extract_Code(t *testing.T) {
	mockClient := &mockChatCompletionClient{
		response: openai.ChatCompletionResponse{
			Choices: []openai.ChatCompletionChoice{{
				Message: openai.ChatCompletionMessage{
					Role: openai.ChatMessageRoleAssistant,
					Content: `{
						"items": [
							{
								"language": "python",
								"code": "print('hello world')",
								"context": "Basic hello world example",
								"timestamp_hint": "mentioned at 2:30"
							},
							{
								"language": "bash",
								"code": "pip install requests",
								"context": "Installing dependencies",
								"timestamp_hint": "installation step at 1:15"
							}
						]
					}`,
				},
			}},
			Usage: openai.Usage{TotalTokens: 520},
		},
	}

	provider := &OpenAIProvider{
		client:      mockClient,
		model:       "gpt-4",
		maxTokens:   4000,
		temperature: 0.7,
	}

	extraction, err := provider.Extract(context.Background(), "sample transcript with code", "code")
	require.NoError(t, err)
	require.NotNil(t, extraction)

	assert.Equal(t, "code", extraction.Type)
	assert.Equal(t, "gpt-4", extraction.Model)
	assert.Equal(t, 520, extraction.TokensUsed)
	assert.Len(t, extraction.Items, 2)

	// Check first code item
	assert.Equal(t, "python", extraction.Items[0].Language)
	assert.Equal(t, "print('hello world')", extraction.Items[0].Code)
	assert.Equal(t, "Basic hello world example", extraction.Items[0].Context)
	assert.Equal(t, "mentioned at 2:30", extraction.Items[0].TimestampHint)

	// Check second code item
	assert.Equal(t, "bash", extraction.Items[1].Language)
	assert.Equal(t, "pip install requests", extraction.Items[1].Code)
}

func TestOpenAIProvider_Extract_Quotes(t *testing.T) {
	mockClient := &mockChatCompletionClient{
		response: openai.ChatCompletionResponse{
			Choices: []openai.ChatCompletionChoice{{
				Message: openai.ChatCompletionMessage{
					Role: openai.ChatMessageRoleAssistant,
					Content: `{
						"items": [
							{
								"quote": "Code is read far more often than it is written",
								"speaker": "Guido van Rossum",
								"context": "Discussing the importance of readable code",
								"importance": "high"
							},
							{
								"quote": "Premature optimization is the root of all evil",
								"speaker": "Donald Knuth",
								"context": "Warning about over-optimization",
								"importance": "medium"
							}
						]
					}`,
				},
			}},
			Usage: openai.Usage{TotalTokens: 385},
		},
	}

	provider := &OpenAIProvider{
		client:      mockClient,
		model:       "gpt-4",
		maxTokens:   4000,
		temperature: 0.7,
	}

	extraction, err := provider.Extract(context.Background(), "sample transcript with quotes", "quotes")
	require.NoError(t, err)
	require.NotNil(t, extraction)

	assert.Equal(t, "quotes", extraction.Type)
	assert.Equal(t, 385, extraction.TokensUsed)
	assert.Len(t, extraction.Items, 2)

	// Check first quote
	assert.Equal(t, "Code is read far more often than it is written", extraction.Items[0].Quote)
	assert.Equal(t, "Guido van Rossum", extraction.Items[0].Speaker)
	assert.Equal(t, "high", extraction.Items[0].Importance)

	// Check second quote
	assert.Equal(t, "Donald Knuth", extraction.Items[1].Speaker)
	assert.Equal(t, "medium", extraction.Items[1].Importance)
}

func TestOpenAIProvider_Extract_ActionItems(t *testing.T) {
	mockClient := &mockChatCompletionClient{
		response: openai.ChatCompletionResponse{
			Choices: []openai.ChatCompletionChoice{{
				Message: openai.ChatCompletionMessage{
					Role: openai.ChatMessageRoleAssistant,
					Content: `{
						"items": [
							{
								"action": "Set up automated testing pipeline",
								"category": "task",
								"priority": "high",
								"context": "Required for CI/CD implementation"
							},
							{
								"action": "Consider using Redis for caching",
								"category": "recommendation",
								"priority": "medium",
								"context": "Performance optimization suggestion"
							},
							{
								"action": "Review security best practices",
								"category": "step",
								"priority": "high",
								"context": "Part of the deployment checklist"
							}
						]
					}`,
				},
			}},
			Usage: openai.Usage{TotalTokens: 445},
		},
	}

	provider := &OpenAIProvider{
		client:      mockClient,
		model:       "gpt-4",
		maxTokens:   4000,
		temperature: 0.7,
	}

	extraction, err := provider.Extract(context.Background(), "sample transcript with action items", "action_items")
	require.NoError(t, err)
	require.NotNil(t, extraction)

	assert.Equal(t, "action_items", extraction.Type)
	assert.Equal(t, 445, extraction.TokensUsed)
	assert.Len(t, extraction.Items, 3)

	// Check first action item
	assert.Equal(t, "Set up automated testing pipeline", extraction.Items[0].Action)
	assert.Equal(t, "task", extraction.Items[0].Category)
	assert.Equal(t, "high", extraction.Items[0].Priority)

	// Check second action item
	assert.Equal(t, "recommendation", extraction.Items[1].Category)
	assert.Equal(t, "medium", extraction.Items[1].Priority)

	// Check third action item
	assert.Equal(t, "step", extraction.Items[2].Category)
}

func TestOpenAIProvider_Extract_InvalidType(t *testing.T) {
	provider := &OpenAIProvider{client: &mockChatCompletionClient{}, model: "gpt-4"}

	_, err := provider.Extract(context.Background(), "sample transcript", "unsupported_type")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "unsupported extraction type")
}

func TestOpenAIProvider_Extract_EmptyText(t *testing.T) {
	provider := &OpenAIProvider{client: &mockChatCompletionClient{}, model: "gpt-4"}

	_, err := provider.Extract(context.Background(), "", "code")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "text to extract from is required")
}

func TestOpenAIProvider_Extract_EmptyResult(t *testing.T) {
	mockClient := &mockChatCompletionClient{
		response: openai.ChatCompletionResponse{
			Choices: []openai.ChatCompletionChoice{{
				Message: openai.ChatCompletionMessage{
					Role:    openai.ChatMessageRoleAssistant,
					Content: `{"items": []}`,
				},
			}},
			Usage: openai.Usage{TotalTokens: 50},
		},
	}

	provider := &OpenAIProvider{
		client:      mockClient,
		model:       "gpt-4",
		maxTokens:   4000,
		temperature: 0.7,
	}

	extraction, err := provider.Extract(context.Background(), "transcript with no extractable content", "code")
	require.NoError(t, err)
	require.NotNil(t, extraction)
	assert.Empty(t, extraction.Items)
	assert.Equal(t, 50, extraction.TokensUsed)
}

func TestOpenAIProvider_Extract_APIErrors(t *testing.T) {
	tests := []struct {
		name       string
		apiErr     error
		wantErrMsg string
	}{
		{
			name:       "rate limited",
			apiErr:     &openai.APIError{HTTPStatusCode: 429, Message: "rate limit"},
			wantErrMsg: "rate limit",
		},
		{
			name:       "service unavailable",
			apiErr:     &openai.APIError{HTTPStatusCode: 503, Message: "service unavailable"},
			wantErrMsg: "unavailable",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockClient := &mockChatCompletionClient{err: tt.apiErr}
			provider := &OpenAIProvider{
				client:      mockClient,
				model:       "gpt-4",
				maxTokens:   4000,
				temperature: 0.7,
			}

			_, err := provider.Extract(context.Background(), "sample", "code")
			require.Error(t, err)
			assert.Contains(t, err.Error(), tt.wantErrMsg)
		})
	}
}

// ==================== Q&A Tests ====================

func TestOpenAIProvider_Answer_Success(t *testing.T) {
	mockClient := &mockChatCompletionClient{
		response: openai.ChatCompletionResponse{
			Choices: []openai.ChatCompletionChoice{{
				Message: openai.ChatCompletionMessage{
					Role:    openai.ChatMessageRoleAssistant,
					Content: `{"answer":"The main topic is implementing CI/CD pipelines.","confidence":"high","sources":["Today we're learning CI/CD","Automated pipelines are essential"],"not_found":false}`,
				},
			}},
			Usage: openai.Usage{TotalTokens: 680},
		},
	}

	provider := &OpenAIProvider{
		client:      mockClient,
		model:       "gpt-4",
		maxTokens:   4000,
		temperature: 0.7,
	}

	answer, err := provider.Answer(context.Background(), "Today we're learning about CI/CD pipelines. Automated pipelines are essential for modern development.", "What is the main topic?")
	require.NoError(t, err)
	require.NotNil(t, answer)

	assert.Equal(t, "The main topic is implementing CI/CD pipelines.", answer.Answer)
	assert.Equal(t, "high", answer.Confidence)
	assert.False(t, answer.NotFound)
	assert.Len(t, answer.Sources, 2)
	assert.Contains(t, answer.Sources[0], "CI/CD")
	assert.Equal(t, "gpt-4", answer.Model)
	assert.Equal(t, 680, answer.TokensUsed)
	assert.Equal(t, 1, mockClient.calls)
}

func TestOpenAIProvider_Answer_NotFound(t *testing.T) {
	mockClient := &mockChatCompletionClient{
		response: openai.ChatCompletionResponse{
			Choices: []openai.ChatCompletionChoice{{
				Message: openai.ChatCompletionMessage{
					Role:    openai.ChatMessageRoleAssistant,
					Content: `{"answer":"This information is not mentioned in the transcript.","confidence":"high","sources":[],"not_found":true}`,
				},
			}},
			Usage: openai.Usage{TotalTokens: 420},
		},
	}

	provider := &OpenAIProvider{
		client:      mockClient,
		model:       "gpt-4",
		maxTokens:   4000,
		temperature: 0.7,
	}

	answer, err := provider.Answer(context.Background(), "This is about programming.", "What is the speaker's favorite color?")
	require.NoError(t, err)
	require.NotNil(t, answer)

	assert.Contains(t, answer.Answer, "not mentioned")
	assert.Equal(t, "high", answer.Confidence)
	assert.True(t, answer.NotFound)
	assert.Empty(t, answer.Sources)
	assert.Equal(t, 420, answer.TokensUsed)
}

func TestOpenAIProvider_Answer_HighConfidence(t *testing.T) {
	mockClient := &mockChatCompletionClient{
		response: openai.ChatCompletionResponse{
			Choices: []openai.ChatCompletionChoice{{
				Message: openai.ChatCompletionMessage{
					Role:    openai.ChatMessageRoleAssistant,
					Content: `{"answer":"The speaker explicitly states Python is the best language.","confidence":"high","sources":["Python is the best programming language for beginners"],"not_found":false}`,
				},
			}},
			Usage: openai.Usage{TotalTokens: 500},
		},
	}

	provider := &OpenAIProvider{
		client:      mockClient,
		model:       "gpt-4",
		maxTokens:   4000,
		temperature: 0.7,
	}

	answer, err := provider.Answer(context.Background(), "Python is the best programming language for beginners.", "Which language is best?")
	require.NoError(t, err)
	require.NotNil(t, answer)

	assert.Equal(t, "high", answer.Confidence)
	assert.False(t, answer.NotFound)
	assert.NotEmpty(t, answer.Sources)
}

func TestOpenAIProvider_Answer_MediumConfidence(t *testing.T) {
	mockClient := &mockChatCompletionClient{
		response: openai.ChatCompletionResponse{
			Choices: []openai.ChatCompletionChoice{{
				Message: openai.ChatCompletionMessage{
					Role:    openai.ChatMessageRoleAssistant,
					Content: `{"answer":"Based on context clues, the framework is likely React.","confidence":"medium","sources":["We'll be using hooks and components"],"not_found":false}`,
				},
			}},
			Usage: openai.Usage{TotalTokens: 550},
		},
	}

	provider := &OpenAIProvider{
		client:      mockClient,
		model:       "gpt-4",
		maxTokens:   4000,
		temperature: 0.7,
	}

	answer, err := provider.Answer(context.Background(), "We'll be using hooks and components in our application.", "What framework are we using?")
	require.NoError(t, err)
	require.NotNil(t, answer)

	assert.Equal(t, "medium", answer.Confidence)
	assert.False(t, answer.NotFound)
}

func TestOpenAIProvider_Answer_LowConfidence(t *testing.T) {
	mockClient := &mockChatCompletionClient{
		response: openai.ChatCompletionResponse{
			Choices: []openai.ChatCompletionChoice{{
				Message: openai.ChatCompletionMessage{
					Role:    openai.ChatMessageRoleAssistant,
					Content: `{"answer":"It's unclear from the transcript, but possibly TypeScript.","confidence":"low","sources":["We need type safety"],"not_found":false}`,
				},
			}},
			Usage: openai.Usage{TotalTokens: 480},
		},
	}

	provider := &OpenAIProvider{
		client:      mockClient,
		model:       "gpt-4",
		maxTokens:   4000,
		temperature: 0.7,
	}

	answer, err := provider.Answer(context.Background(), "We need type safety in our project.", "What language should we use?")
	require.NoError(t, err)
	require.NotNil(t, answer)

	assert.Equal(t, "low", answer.Confidence)
	assert.False(t, answer.NotFound)
}

func TestOpenAIProvider_Answer_EmptyQuestion(t *testing.T) {
	provider := &OpenAIProvider{
		client:      &mockChatCompletionClient{},
		model:       "gpt-4",
		maxTokens:   4000,
		temperature: 0.7,
	}

	_, err := provider.Answer(context.Background(), "sample text", "")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "question is required")
}

func TestOpenAIProvider_Answer_EmptyText(t *testing.T) {
	provider := &OpenAIProvider{
		client:      &mockChatCompletionClient{},
		model:       "gpt-4",
		maxTokens:   4000,
		temperature: 0.7,
	}

	_, err := provider.Answer(context.Background(), "", "What is this about?")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "text is required")
}

func TestOpenAIProvider_Answer_WithSources(t *testing.T) {
	mockClient := &mockChatCompletionClient{
		response: openai.ChatCompletionResponse{
			Choices: []openai.ChatCompletionChoice{{
				Message: openai.ChatCompletionMessage{
					Role:    openai.ChatMessageRoleAssistant,
					Content: `{"answer":"There are three main benefits discussed.","confidence":"high","sources":["First, it improves performance","Second, it reduces costs","Third, it enhances security"],"not_found":false}`,
				},
			}},
			Usage: openai.Usage{TotalTokens: 600},
		},
	}

	provider := &OpenAIProvider{
		client:      mockClient,
		model:       "gpt-4",
		maxTokens:   4000,
		temperature: 0.7,
	}

	answer, err := provider.Answer(context.Background(), "First, it improves performance. Second, it reduces costs. Third, it enhances security.", "What are the benefits?")
	require.NoError(t, err)
	require.NotNil(t, answer)

	assert.Len(t, answer.Sources, 3)
	assert.Contains(t, answer.Sources[0], "performance")
	assert.Contains(t, answer.Sources[1], "costs")
	assert.Contains(t, answer.Sources[2], "security")
}

func TestOpenAIProvider_Answer_NilProvider(t *testing.T) {
	var provider *OpenAIProvider

	_, err := provider.Answer(context.Background(), "sample text", "What is this?")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "nil")
}

func TestOpenAIProvider_Answer_InvalidJSON(t *testing.T) {
	mockClient := &mockChatCompletionClient{
		response: openai.ChatCompletionResponse{
			Choices: []openai.ChatCompletionChoice{{
				Message: openai.ChatCompletionMessage{
					Role:    openai.ChatMessageRoleAssistant,
					Content: `invalid json response`,
				},
			}},
			Usage: openai.Usage{TotalTokens: 100},
		},
	}

	provider := &OpenAIProvider{
		client:      mockClient,
		model:       "gpt-4",
		maxTokens:   4000,
		temperature: 0.7,
	}

	_, err := provider.Answer(context.Background(), "sample text", "What is this?")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "parse answer response")
}

func TestOpenAIProvider_Answer_APIError(t *testing.T) {
	tests := []struct {
		name       string
		apiErr     error
		wantErrMsg string
	}{
		{
			name:       "rate limited",
			apiErr:     &openai.APIError{HTTPStatusCode: 429, Message: "rate limit exceeded"},
			wantErrMsg: "rate limited",
		},
		{
			name:       "service unavailable",
			apiErr:     &openai.APIError{HTTPStatusCode: 503, Message: "service unavailable"},
			wantErrMsg: "unavailable",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockClient := &mockChatCompletionClient{err: tt.apiErr}
			provider := &OpenAIProvider{
				client:      mockClient,
				model:       "gpt-4",
				maxTokens:   4000,
				temperature: 0.7,
			}

			_, err := provider.Answer(context.Background(), "sample text", "What is this?")
			require.Error(t, err)
			assert.Contains(t, err.Error(), tt.wantErrMsg)
		})
	}
}

func TestOpenAIProvider_Answer_ConfidenceNormalization(t *testing.T) {
	tests := []struct {
		name               string
		rawConfidence      string
		expectedConfidence string
	}{
		{
			name:               "uppercase high",
			rawConfidence:      "HIGH",
			expectedConfidence: "high",
		},
		{
			name:               "mixed case medium",
			rawConfidence:      "Medium",
			expectedConfidence: "medium",
		},
		{
			name:               "invalid confidence defaults to medium",
			rawConfidence:      "very_high",
			expectedConfidence: "medium",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockClient := &mockChatCompletionClient{
				response: openai.ChatCompletionResponse{
					Choices: []openai.ChatCompletionChoice{{
						Message: openai.ChatCompletionMessage{
							Role:    openai.ChatMessageRoleAssistant,
							Content: `{"answer":"Test answer","confidence":"` + tt.rawConfidence + `","sources":[],"not_found":false}`,
						},
					}},
					Usage: openai.Usage{TotalTokens: 100},
				},
			}

			provider := &OpenAIProvider{
				client:      mockClient,
				model:       "gpt-4",
				maxTokens:   4000,
				temperature: 0.7,
			}

			answer, err := provider.Answer(context.Background(), "sample text", "test question")
			require.NoError(t, err)
			assert.Equal(t, tt.expectedConfidence, answer.Confidence)
		})
	}
}
