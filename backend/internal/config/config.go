package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

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

	// AI Configuration
	OpenAIAPIKey    string
	AnthropicAPIKey string
	GoogleAPIKey    string
	AIProvider      string // "openai", "anthropic", "google"
	AIModel         string // "gpt-4", "gpt-3.5-turbo", "claude-3-opus", "gemini-1.5-flash", etc.
	AIMaxTokens     int
	AITemperature   float64

	// CORS configuration
	CORSAllowedOrigins []string
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

	// AI Configuration
	config.OpenAIAPIKey = os.Getenv("OPENAI_API_KEY")
	config.AnthropicAPIKey = os.Getenv("ANTHROPIC_API_KEY")
	config.GoogleAPIKey = os.Getenv("GOOGLE_API_KEY")
	config.AIProvider = getEnvWithDefault("AI_PROVIDER", "openai")
	config.AIModel = getEnvWithDefault("AI_MODEL", "gpt-4")

	config.AIMaxTokens, err = getEnvIntWithDefault("AI_MAX_TOKENS", 4000)
	if err != nil {
		return nil, fmt.Errorf("invalid AI_MAX_TOKENS: %w", err)
	}

	config.AITemperature, err = getEnvFloatWithDefault("AI_TEMPERATURE", 0.7)
	if err != nil {
		return nil, fmt.Errorf("invalid AI_TEMPERATURE: %w", err)
	}

	config.CORSAllowedOrigins = getCORSAllowedOrigins()

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

	// Production-specific validation
	if os.Getenv("GO_ENV") == "production" {
		// Enforce strong password requirements in production
		if c.DBPassword == "postgres" || c.DBPassword == "password" || len(c.DBPassword) < 12 {
			errors = append(errors, "production requires a strong DB password (min 12 characters, not default)")
		}

		// Warn about localhost in production
		if c.DBHost == "localhost" || c.DBHost == "127.0.0.1" {
			errors = append(errors, "production should use a remote database host, not localhost")
		}
	}

	// Validate port ranges
	if c.DBPort <= 0 || c.DBPort > 65535 {
		errors = append(errors, "DB_PORT must be between 1 and 65535")
	}

	if c.APIPort <= 0 || c.APIPort > 65535 {
		errors = append(errors, "API_PORT must be between 1 and 65535")
	}

	// AI configuration validation
	if c.OpenAIAPIKey == "" && c.AnthropicAPIKey == "" && c.GoogleAPIKey == "" {
		errors = append(errors, "at least one AI provider API key required")
	}

	switch c.AIProvider {
	case "openai":
		if c.OpenAIAPIKey == "" {
			errors = append(errors, "OPENAI_API_KEY is required when AI_PROVIDER is 'openai'")
		}
	case "anthropic":
		if c.AnthropicAPIKey == "" {
			errors = append(errors, "ANTHROPIC_API_KEY is required when AI_PROVIDER is 'anthropic'")
		}
	case "google":
		if c.GoogleAPIKey == "" {
			errors = append(errors, "GOOGLE_API_KEY is required when AI_PROVIDER is 'google'")
		}
	default:
		errors = append(errors, "AI_PROVIDER must be 'openai', 'anthropic', or 'google'")
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

// getEnvFloatWithDefault gets an environment variable as float64 or returns a default value
func getEnvFloatWithDefault(key string, defaultValue float64) (float64, error) {
	if value := os.Getenv(key); value != "" {
		parsed, err := strconv.ParseFloat(value, 64)
		if err != nil {
			return 0, fmt.Errorf("failed to parse %s as float: %w", key, err)
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

	// AI Configuration
	config.OpenAIAPIKey = os.Getenv("OPENAI_API_KEY")
	config.AnthropicAPIKey = os.Getenv("ANTHROPIC_API_KEY")
	config.GoogleAPIKey = os.Getenv("GOOGLE_API_KEY")
	config.AIProvider = getEnvWithDefault("AI_PROVIDER", "openai")
	config.AIModel = getEnvWithDefault("AI_MODEL", "gpt-4")

	config.AIMaxTokens, err = getEnvIntWithDefault("AI_MAX_TOKENS", 4000)
	if err != nil {
		return nil, fmt.Errorf("invalid AI_MAX_TOKENS: %w", err)
	}

	config.AITemperature, err = getEnvFloatWithDefault("AI_TEMPERATURE", 0.7)
	if err != nil {
		return nil, fmt.Errorf("invalid AI_TEMPERATURE: %w", err)
	}

	config.CORSAllowedOrigins = getCORSAllowedOrigins()

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

		// AI defaults
		AIProvider:    "openai",
		AIModel:       "gpt-4",
		AIMaxTokens:   4000,
		AITemperature: 0.7,

		CORSAllowedOrigins: DefaultCORSOrigins(),
	}
}

func getCORSAllowedOrigins() []string {
	raw := strings.TrimSpace(os.Getenv("CORS_ALLOWED_ORIGINS"))
	if raw == "" {
		return DefaultCORSOrigins()
	}

	parts := strings.Split(raw, ",")
	var origins []string
	for _, part := range parts {
		origin := strings.TrimSpace(part)
		if origin != "" {
			origins = append(origins, origin)
		}
	}

	if len(origins) == 0 {
		return DefaultCORSOrigins()
	}
	return origins
}

func DefaultCORSOrigins() []string {
	return []string{
		"http://localhost:5173",
		"http://localhost:3000",
		"https://transcriptai.serverplus.org",
		"https://transcriptai-frontend.serverplus.org",
		"https://transcriptai-backend.serverplus.org",
	}
}
