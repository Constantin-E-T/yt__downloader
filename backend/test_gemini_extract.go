package main

import (
	"context"
	"fmt"
	"os"

	"github.com/yourusername/yt-transcript-downloader/internal/services"
)

func main() {
	apiKey := "AIzaSyAMH3EokkOoM4xN8klnzvG-oPiCHEp5eBc"

	provider, err := services.NewGeminiProvider(apiKey, "gemini-2.5-flash", 4000, 0.7)
	if err != nil {
		fmt.Printf("ERROR creating provider: %v\n", err)
		os.Exit(1)
	}

	text := "Rick Astley sings about never giving you up and never letting you down. He promises to never run around and desert you. He also says he'll never make you cry or say goodbye."

	extraction, err := provider.Extract(context.Background(), text, "quotes")
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("SUCCESS!\n")
	fmt.Printf("Model: %s\n", extraction.Model)
	fmt.Printf("Tokens: %d\n", extraction.TokensUsed)
	fmt.Printf("Type: %s\n", extraction.Type)
	fmt.Printf("Items count: %d\n", len(extraction.Items))

	if len(extraction.Items) > 0 {
		fmt.Printf("\nFirst item:\n")
		item := extraction.Items[0]
		fmt.Printf("  Quote: %s\n", item.Quote)
		fmt.Printf("  Speaker: %s\n", item.Speaker)
		fmt.Printf("  Context: %s\n", item.Context)
		fmt.Printf("  Importance: %s\n", item.Importance)
	}
}
