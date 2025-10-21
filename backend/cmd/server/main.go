package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/yourusername/yt-transcript-downloader/internal/api"
	"github.com/yourusername/yt-transcript-downloader/internal/config"
	"github.com/yourusername/yt-transcript-downloader/internal/db"
	"github.com/yourusername/yt-transcript-downloader/internal/services"
)

func main() {
	// Setup context with signal handling
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Load configuration
	fmt.Println("📝 Loading configuration...")
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to load configuration: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✅ Configuration loaded successfully")

	// Connect to database
	fmt.Println("🔌 Connecting to database...")
	database, err := db.Connect(ctx, cfg.ConnectionString())
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer database.Close()
	fmt.Println("✅ Database connected successfully")

	// Initialize dependencies
	youtubeService := services.NewYouTubeService()
	videoRepo := db.NewVideoRepository(database)
	transcriptRepo := db.NewTranscriptRepository(database)
	summaryRepo := db.NewAISummaryRepository(database)
	extractionRepo := db.NewAIExtractionRepository(database)

	var aiProvider services.AIProvider
	switch cfg.AIProvider {
	case "openai":
		openAIProvider, providerErr := services.NewOpenAIProvider(cfg.OpenAIAPIKey, cfg.AIModel, cfg.AIMaxTokens, cfg.AITemperature)
		if providerErr != nil {
			fmt.Fprintf(os.Stderr, "Failed to configure OpenAI provider: %v\n", providerErr)
			os.Exit(1)
		}
		aiProvider = openAIProvider
	case "anthropic":
		fmt.Fprintln(os.Stderr, "Anthropic provider is not yet implemented")
		os.Exit(1)
	default:
		fmt.Fprintf(os.Stderr, "Unsupported AI provider: %s\n", cfg.AIProvider)
		os.Exit(1)
	}

	aiSvc := services.NewAIService(aiProvider, cfg.AIModel)

	// Create API server
	fmt.Println("🏗️  Creating API server...")
	server, err := api.NewServer(cfg, database, youtubeService, videoRepo, transcriptRepo, aiSvc, summaryRepo, extractionRepo)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to create API server: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✅ API server created successfully")

	// Setup signal handling for graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	// Start server in goroutine
	serverErrChan := make(chan error, 1)
	go func() {
		serverErrChan <- server.Start(ctx)
	}()

	// Wait for shutdown signal or server error
	select {
	case sig := <-sigChan:
		fmt.Printf("\n📡 Received signal: %v\n", sig)
		cancel() // Cancel context to trigger graceful shutdown
		// Wait for server to finish shutting down
		<-serverErrChan
	case err := <-serverErrChan:
		if err != nil {
			fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
			os.Exit(1)
		}
	}

	fmt.Println("👋 Server stopped")
}
