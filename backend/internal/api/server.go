// Package api provides HTTP server implementation and API handlers
package api

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/yourusername/yt-transcript-downloader/internal/config"
	"github.com/yourusername/yt-transcript-downloader/internal/db"
	"github.com/yourusername/yt-transcript-downloader/internal/services"
)

type youtubeService interface {
	GetVideoMetadata(videoID string) (*services.VideoMetadata, error)
	GetTranscript(videoID, language string) ([]services.TranscriptLine, error)
}

type videoRepository interface {
	SaveVideo(ctx context.Context, video *db.Video) error
	GetVideoByID(ctx context.Context, id string) (*db.Video, error)
}

type transcriptRepository interface {
	SaveTranscript(ctx context.Context, transcript *db.Transcript) error
	GetTranscriptByID(ctx context.Context, id string) (*db.Transcript, error)
}

type aiService interface {
	Summarize(ctx context.Context, text string, summaryType string) (*services.AISummary, error)
	Extract(ctx context.Context, text string, extractionType string) (*services.AIExtraction, error)
	Answer(ctx context.Context, text string, question string) (*services.AIAnswer, error)
}

type aiSummaryRepository interface {
	CreateAISummary(ctx context.Context, summary *db.AISummary) error
	GetAISummary(ctx context.Context, transcriptID string, summaryType string) (*db.AISummary, error)
	ListAISummaries(ctx context.Context, transcriptID string) ([]*db.AISummary, error)
}

type aiExtractionRepository interface {
	CreateAIExtraction(ctx context.Context, extraction *db.AIExtraction) error
	GetAIExtraction(ctx context.Context, transcriptID string, extractionType string) (*db.AIExtraction, error)
	ListAIExtractions(ctx context.Context, transcriptID string) ([]*db.AIExtraction, error)
}

// Server represents the HTTP API server
type Server struct {
	db               db.DB
	router           chi.Router
	srv              *http.Server
	config           *config.Config
	youtube          youtubeService
	videoRepository  videoRepository
	transcriptRepo   transcriptRepository
	aiService        aiService
	aiSummaryRepo    aiSummaryRepository
	aiExtractionRepo aiExtractionRepository
}

// NewServer creates a new API server with the given configuration and database connection
func NewServer(cfg *config.Config, database db.DB, ytSvc youtubeService, videoRepo videoRepository, transcriptRepo transcriptRepository, aiSvc aiService, summaryRepo aiSummaryRepository, extractionRepo aiExtractionRepository) (*Server, error) {
	if cfg == nil {
		return nil, errors.New("config cannot be nil")
	}
	if database == nil {
		return nil, errors.New("database cannot be nil")
	}
	if ytSvc == nil {
		return nil, errors.New("youtube service cannot be nil")
	}
	if videoRepo == nil {
		return nil, errors.New("video repository cannot be nil")
	}
	if transcriptRepo == nil {
		return nil, errors.New("transcript repository cannot be nil")
	}
	if aiSvc == nil {
		return nil, errors.New("ai service cannot be nil")
	}
	if summaryRepo == nil {
		return nil, errors.New("ai summary repository cannot be nil")
	}
	if extractionRepo == nil {
		return nil, errors.New("ai extraction repository cannot be nil")
	}

	s := &Server{
		db:               database,
		config:           cfg,
		router:           chi.NewRouter(),
		youtube:          ytSvc,
		videoRepository:  videoRepo,
		transcriptRepo:   transcriptRepo,
		aiService:        aiSvc,
		aiSummaryRepo:    summaryRepo,
		aiExtractionRepo: extractionRepo,
	}

	// Setup routes and middleware
	s.setupRoutes()

	// Create HTTP server
	s.srv = &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.APIPort),
		Handler:      s.router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	return s, nil
}

// setupRoutes configures all middleware and routes for the server
func (s *Server) setupRoutes() {
	// Core middleware stack
	s.router.Use(middleware.RequestID)
	s.router.Use(middleware.RealIP)
	s.router.Use(middleware.Logger)
	s.router.Use(middleware.Recoverer)
	s.router.Use(requestTimer)

	// CORS configuration
	allowedOrigins := s.config.CORSAllowedOrigins
	if len(allowedOrigins) == 0 {
		allowedOrigins = config.DefaultCORSOrigins()
	}

	s.router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health and metrics routes
	s.router.Get("/health", s.handleHealth)
	s.router.Get("/metrics", s.handleMetrics)

	// API routes
	s.router.Route("/api", func(r chi.Router) {
		r.Get("/health", s.handleHealth)
		r.Get("/metrics", s.handleMetrics)

		r.Route("/v1", func(r chi.Router) {
			r.Get("/health", s.handleHealth)
			r.Get("/transcripts/{id}", s.handleGetTranscript)
			r.Post("/transcripts/fetch", s.handleFetchTranscript)
			r.Route("/transcripts/{id}/summarize", func(r chi.Router) {
				r.Post("/", s.handleSummarizeTranscript)
			})
			r.Route("/transcripts/{id}/extract", func(r chi.Router) {
				r.Post("/", s.handleExtractFromTranscript)
			})
			r.Route("/transcripts/{id}/qa", func(r chi.Router) {
				r.Post("/", s.handleTranscriptQA)
			})
			r.Get("/transcripts/{id}/export", s.handleExportTranscript)
		})
	})
}

// Start starts the HTTP server
// It blocks until the server is shut down or an error occurs
func (s *Server) Start(ctx context.Context) error {
	if s.srv == nil {
		return errors.New("server not initialized")
	}

	// Channel to capture server errors
	errChan := make(chan error, 1)

	// Start server in goroutine
	go func() {
		fmt.Printf("🚀 Server starting on http://localhost:%d\n", s.config.APIPort)
		if err := s.srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errChan <- err
		}
	}()

	// Wait for context cancellation or server error
	select {
	case <-ctx.Done():
		fmt.Println("\n🛑 Shutting down server...")
		// Create shutdown context with timeout
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		// Attempt graceful shutdown
		if err := s.srv.Shutdown(shutdownCtx); err != nil {
			return fmt.Errorf("server shutdown failed: %w", err)
		}
		fmt.Println("✅ Server shutdown complete")
		return nil

	case err := <-errChan:
		return fmt.Errorf("server error: %w", err)
	}
}

// Shutdown gracefully shuts down the server
func (s *Server) Shutdown(ctx context.Context) error {
	if s.srv == nil {
		return errors.New("server not initialized")
	}

	fmt.Println("🛑 Initiating server shutdown...")
	if err := s.srv.Shutdown(ctx); err != nil {
		return fmt.Errorf("server shutdown failed: %w", err)
	}

	fmt.Println("✅ Server shutdown complete")
	return nil
}

func requestTimer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		duration := time.Since(start)

		if duration > time.Second {
			log.Printf("SLOW REQUEST: %s %s took %v", r.Method, r.URL.Path, duration)
		}
	})
}
