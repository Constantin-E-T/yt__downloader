package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

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

func main() {
	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		fmt.Println("ERROR: ANTHROPIC_API_KEY not set")
		os.Exit(1)
	}

	reqBody := anthropicRequest{
		Model: "claude-3-5-sonnet-20241022",
		Messages: []anthropicMessage{
			{
				Role:    "user",
				Content: "Say hello",
			},
		},
		MaxTokens:   100,
		Temperature: 0.7,
		System:      "You are a helpful assistant. Respond with just 'Hello World'",
	}

	jsonData, _ := json.Marshal(reqBody)

	req, err := http.NewRequestWithContext(context.Background(), "POST", "https://api.anthropic.com/v1/messages", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("ERROR creating request: %v\n", err)
		os.Exit(1)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("ERROR (status %d): %s\n", resp.StatusCode, string(body))
		os.Exit(1)
	}

	fmt.Printf("SUCCESS: %s\n", string(body))
}
