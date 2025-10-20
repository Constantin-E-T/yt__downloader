package db

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// NewPool creates a new PostgreSQL connection pool with retry logic and optimized configuration
func NewPool(ctx context.Context, connString string) (*pgxpool.Pool, error) {
	// Parse configuration from connection string and apply pool settings
	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("failed to parse connection string: %w", err)
	}

	// Configure pool settings for optimal performance
	config.MaxConns = 25
	config.MinConns = 5
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute
	config.HealthCheckPeriod = time.Minute

	// Set connection timeout context
	connCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	// Retry logic with exponential backoff (3 attempts: 1s, 2s, 4s)
	var pool *pgxpool.Pool
	var lastErr error

	retryDelays := []time.Duration{
		1 * time.Second,
		2 * time.Second,
		4 * time.Second,
	}

	for attempt := 0; attempt < len(retryDelays); attempt++ {
		slog.Info("Attempting database connection",
			"attempt", attempt+1,
			"max_attempts", len(retryDelays))

		pool, err = pgxpool.NewWithConfig(connCtx, config)
		if err != nil {
			lastErr = fmt.Errorf("attempt %d: failed to create pool: %w", attempt+1, err)
			slog.Warn("Failed to create connection pool",
				"attempt", attempt+1,
				"error", err,
				"retry_in", retryDelays[attempt])

			// Sleep before retry (except on last attempt)
			if attempt < len(retryDelays)-1 {
				time.Sleep(retryDelays[attempt])
			}
			continue
		}

		// Test the connection by pinging the database
		pingCtx, pingCancel := context.WithTimeout(ctx, 5*time.Second)
		if pingErr := pool.Ping(pingCtx); pingErr != nil {
			pingCancel()
			pool.Close()
			lastErr = fmt.Errorf("attempt %d: failed to ping database: %w", attempt+1, pingErr)
			slog.Warn("Failed to ping database",
				"attempt", attempt+1,
				"error", pingErr,
				"retry_in", retryDelays[attempt])

			// Sleep before retry (except on last attempt)
			if attempt < len(retryDelays)-1 {
				time.Sleep(retryDelays[attempt])
			}
			pingCancel()
			continue
		}
		pingCancel()

		slog.Info("Successfully connected to database",
			"attempt", attempt+1,
			"max_conns", config.MaxConns,
			"min_conns", config.MinConns)

		return pool, nil
	}

	return nil, fmt.Errorf("failed to connect to database after %d attempts: %w", len(retryDelays), lastErr)
}

// PoolConfig holds the configuration options for the database connection pool
type PoolConfig struct {
	MaxConns        int32
	MinConns        int32
	MaxConnLifetime time.Duration
	MaxConnIdleTime time.Duration
	ConnTimeout     time.Duration
}

// DefaultPoolConfig returns the default pool configuration
func DefaultPoolConfig() *PoolConfig {
	return &PoolConfig{
		MaxConns:        25,
		MinConns:        5,
		MaxConnLifetime: time.Hour,
		MaxConnIdleTime: 30 * time.Minute,
		ConnTimeout:     30 * time.Second,
	}
}

// NewPoolWithConfig creates a new PostgreSQL connection pool with custom configuration
func NewPoolWithConfig(ctx context.Context, connString string, poolConfig *PoolConfig) (*pgxpool.Pool, error) {
	if poolConfig == nil {
		poolConfig = DefaultPoolConfig()
	}

	// Parse configuration from connection string
	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("failed to parse connection string: %w", err)
	}

	// Apply custom pool configuration
	config.MaxConns = poolConfig.MaxConns
	config.MinConns = poolConfig.MinConns
	config.MaxConnLifetime = poolConfig.MaxConnLifetime
	config.MaxConnIdleTime = poolConfig.MaxConnIdleTime
	config.HealthCheckPeriod = time.Minute

	// Set connection timeout context
	connCtx, cancel := context.WithTimeout(ctx, poolConfig.ConnTimeout)
	defer cancel()

	// Retry logic with exponential backoff
	var pool *pgxpool.Pool
	var lastErr error

	retryDelays := []time.Duration{
		1 * time.Second,
		2 * time.Second,
		4 * time.Second,
	}

	for attempt := 0; attempt < len(retryDelays); attempt++ {
		slog.Info("Attempting database connection with custom config",
			"attempt", attempt+1,
			"max_attempts", len(retryDelays),
			"max_conns", poolConfig.MaxConns,
			"min_conns", poolConfig.MinConns)

		pool, err = pgxpool.NewWithConfig(connCtx, config)
		if err != nil {
			lastErr = fmt.Errorf("attempt %d: failed to create pool: %w", attempt+1, err)
			slog.Warn("Failed to create connection pool",
				"attempt", attempt+1,
				"error", err,
				"retry_in", retryDelays[attempt])

			if attempt < len(retryDelays)-1 {
				time.Sleep(retryDelays[attempt])
			}
			continue
		}

		// Test the connection
		pingCtx, pingCancel := context.WithTimeout(ctx, 5*time.Second)
		if pingErr := pool.Ping(pingCtx); pingErr != nil {
			pingCancel()
			pool.Close()
			lastErr = fmt.Errorf("attempt %d: failed to ping database: %w", attempt+1, pingErr)
			slog.Warn("Failed to ping database",
				"attempt", attempt+1,
				"error", pingErr,
				"retry_in", retryDelays[attempt])

			if attempt < len(retryDelays)-1 {
				time.Sleep(retryDelays[attempt])
			}
			pingCancel()
			continue
		}
		pingCancel()

		slog.Info("Successfully connected to database with custom config",
			"attempt", attempt+1,
			"max_conns", config.MaxConns,
			"min_conns", config.MinConns)

		return pool, nil
	}

	return nil, fmt.Errorf("failed to connect to database after %d attempts: %w", len(retryDelays), lastErr)
}
