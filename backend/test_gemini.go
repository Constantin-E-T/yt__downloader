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

	summary, err := provider.Summarize(context.Background(), "Rick Astley sings about never giving you up and never letting you down.", "brief")
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("SUCCESS!\n")
	fmt.Printf("Model: %s\n", summary.Model)
	fmt.Printf("Tokens: %d\n", summary.TokensUsed)
	fmt.Printf("Summary: %s\n", summary.Content.Text)
}
