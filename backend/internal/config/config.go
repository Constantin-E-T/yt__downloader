package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds the application configuration
type Config struct {
	DBHost     string
	DBPort     int
	DBName     string
	DBUser     string
	DBPassword string
	APIPort    int
}

// Load reads configuration from environment variables
// It automatically loads from .env file if present
func Load() (*Config, error) {
	// Try to load .env file, but don't fail if it doesn't exist
	// This allows for deployment environments where env vars are set directly
	_ = godotenv.Load()

	config := &Config{
		DBHost:     getEnvWithDefault("DB_HOST", "localhost"),
		DBName:     getEnvWithDefault("DB_NAME", "yt_transcripts"),
		DBUser:     getEnvWithDefault("DB_USER", "postgres"),
		DBPassword: os.Getenv("DB_PASSWORD"),
	}

	// Parse integer values with defaults
	var err error
	config.DBPort, err = getEnvIntWithDefault("DB_PORT", 5432)
	if err != nil {
		return nil, fmt.Errorf("invalid DB_PORT: %w", err)
	}

	config.APIPort, err = getEnvIntWithDefault("API_PORT", 8080)
	if err != nil {
		return nil, fmt.Errorf("invalid API_PORT: %w", err)
	}

	// Validate the configuration
	if err := config.Validate(); err != nil {
		return nil, fmt.Errorf("configuration validation failed: %w", err)
	}

	return config, nil
}

// Validate checks that all required configuration values are present and valid
func (c *Config) Validate() error {
	var errors []string

	// Check required fields
	if c.DBHost == "" {
		errors = append(errors, "DB_HOST is required")
	}

	if c.DBName == "" {
		errors = append(errors, "DB_NAME is required")
	}

	if c.DBUser == "" {
		errors = append(errors, "DB_USER is required")
	}

	if c.DBPassword == "" {
		errors = append(errors, "DB_PASSWORD is required")
	}

	// Validate port ranges
	if c.DBPort <= 0 || c.DBPort > 65535 {
		errors = append(errors, "DB_PORT must be between 1 and 65535")
	}

	if c.APIPort <= 0 || c.APIPort > 65535 {
		errors = append(errors, "API_PORT must be between 1 and 65535")
	}

	// Return combined errors if any
	if len(errors) > 0 {
		errorMsg := "validation errors: "
		for i, err := range errors {
			if i > 0 {
				errorMsg += "; "
			}
			errorMsg += err
		}
		return fmt.Errorf("%s", errorMsg)
	}

	return nil
}

// ConnectionString builds a PostgreSQL connection string from the configuration
func (c *Config) ConnectionString() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=disable",
		c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName)
}

// ConnectionStringWithSSL builds a PostgreSQL connection string with SSL mode
func (c *Config) ConnectionStringWithSSL(sslMode string) string {
	if sslMode == "" {
		sslMode = "require"
	}
	return fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s",
		c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName, sslMode)
}

// getEnvWithDefault gets an environment variable or returns a default value
func getEnvWithDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvIntWithDefault gets an environment variable as int or returns a default value
func getEnvIntWithDefault(key string, defaultValue int) (int, error) {
	if value := os.Getenv(key); value != "" {
		parsed, err := strconv.Atoi(value)
		if err != nil {
			return 0, fmt.Errorf("failed to parse %s as integer: %w", key, err)
		}
		return parsed, nil
	}
	return defaultValue, nil
}

// MustLoad loads configuration and panics if it fails
// Use this only in main() or init() functions where failure should be fatal
func MustLoad() *Config {
	config, err := Load()
	if err != nil {
		panic(fmt.Sprintf("failed to load configuration: %v", err))
	}
	return config
}

// LoadWithEnvFile loads configuration from a specific .env file
func LoadWithEnvFile(envFile string) (*Config, error) {
	if err := godotenv.Load(envFile); err != nil {
		return nil, fmt.Errorf("failed to load env file %s: %w", envFile, err)
	}

	config := &Config{
		DBHost:     getEnvWithDefault("DB_HOST", "localhost"),
		DBName:     getEnvWithDefault("DB_NAME", "yt_transcripts"),
		DBUser:     getEnvWithDefault("DB_USER", "postgres"),
		DBPassword: os.Getenv("DB_PASSWORD"),
	}

	var err error
	config.DBPort, err = getEnvIntWithDefault("DB_PORT", 5432)
	if err != nil {
		return nil, fmt.Errorf("invalid DB_PORT: %w", err)
	}

	config.APIPort, err = getEnvIntWithDefault("API_PORT", 8080)
	if err != nil {
		return nil, fmt.Errorf("invalid API_PORT: %w", err)
	}

	if err := config.Validate(); err != nil {
		return nil, fmt.Errorf("configuration validation failed: %w", err)
	}

	return config, nil
}

// GetDefaults returns a Config with default values (useful for testing)
func GetDefaults() *Config {
	return &Config{
		DBHost:     "localhost",
		DBPort:     5432,
		DBName:     "yt_transcripts",
		DBUser:     "postgres",
		DBPassword: "postgres", // Default password for development
		APIPort:    8080,
	}
}
