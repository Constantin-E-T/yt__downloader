package main

import (
	"context"
	"fmt"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

func main() {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		fmt.Println("ERROR: OPENAI_API_KEY not set")
		os.Exit(1)
	}

	client := openai.NewClient(apiKey)

	// Test a simple completion
	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "gpt-4o",
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: "You are a helpful assistant. Respond with just 'Hello World'",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "Say hello",
				},
			},
			MaxTokens:   100,
			Temperature: 0.7,
		},
	)

	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		os.Exit(1)
	}

	if len(resp.Choices) == 0 {
		fmt.Println("ERROR: No choices in response")
		os.Exit(1)
	}

	fmt.Printf("SUCCESS: %s\n", resp.Choices[0].Message.Content)
	fmt.Printf("Tokens used: %d\n", resp.Usage.TotalTokens)
}
