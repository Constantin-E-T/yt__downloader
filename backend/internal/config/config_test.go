package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLoad_ValidEnvironment(t *testing.T) {
	// Set up environment variables
	envVars := map[string]string{
		"DB_HOST":        "testhost",
		"DB_PORT":        "3306",
		"DB_NAME":        "testdb",
		"DB_USER":        "testuser",
		"DB_PASSWORD":    "testpass",
		"API_PORT":       "9000",
		"OPENAI_API_KEY": "test-openai-key",
	}

	// Set environment variables
	for key, value := range envVars {
		err := os.Setenv(key, value)
		require.NoError(t, err)
	}

	// Clean up after test
	defer func() {
		for key := range envVars {
			os.Unsetenv(key)
		}
	}()

	config, err := Load()
	require.NoError(t, err)
	require.NotNil(t, config)

	assert.Equal(t, "testhost", config.DBHost)
	assert.Equal(t, 3306, config.DBPort)
	assert.Equal(t, "testdb", config.DBName)
	assert.Equal(t, "testuser", config.DBUser)
	assert.Equal(t, "testpass", config.DBPassword)
	assert.Equal(t, 9000, config.APIPort)
}

func TestLoad_DefaultValues(t *testing.T) {
	// Clear environment variables to test defaults
	envVarsToUnset := []string{"DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "API_PORT"}
	for _, key := range envVarsToUnset {
		os.Unsetenv(key)
	}

	// Set only required password
	err := os.Setenv("DB_PASSWORD", "testpass")
	require.NoError(t, err)
	defer os.Unsetenv("DB_PASSWORD")

	err = os.Setenv("OPENAI_API_KEY", "test-openai-key")
	require.NoError(t, err)
	defer os.Unsetenv("OPENAI_API_KEY")

	config, err := Load()
	require.NoError(t, err)
	require.NotNil(t, config)

	// Check default values
	assert.Equal(t, "localhost", config.DBHost)
	assert.Equal(t, 5432, config.DBPort)
	assert.Equal(t, "yt_transcripts", config.DBName)
	assert.Equal(t, "postgres", config.DBUser)
	assert.Equal(t, "testpass", config.DBPassword)
	assert.Equal(t, 8080, config.APIPort)
}

func TestLoad_MissingPassword(t *testing.T) {
	// Clear all environment variables
	envVarsToUnset := []string{"DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD", "API_PORT"}
	for _, key := range envVarsToUnset {
		os.Unsetenv(key)
	}

	err := os.Setenv("OPENAI_API_KEY", "test-openai-key")
	require.NoError(t, err)
	defer os.Unsetenv("OPENAI_API_KEY")

	config, err := Load()
	assert.Error(t, err)
	assert.Nil(t, config)
	assert.Contains(t, err.Error(), "DB_PASSWORD is required")
}

func TestLoad_InvalidPort(t *testing.T) {
	// Set up environment with invalid port
	err := os.Setenv("DB_PORT", "invalid")
	require.NoError(t, err)
	defer os.Unsetenv("DB_PORT")

	err = os.Setenv("DB_PASSWORD", "testpass")
	require.NoError(t, err)
	defer os.Unsetenv("DB_PASSWORD")

	err = os.Setenv("OPENAI_API_KEY", "test-openai-key")
	require.NoError(t, err)
	defer os.Unsetenv("OPENAI_API_KEY")

	config, err := Load()
	assert.Error(t, err)
	assert.Nil(t, config)
	assert.Contains(t, err.Error(), "invalid DB_PORT")
}

func TestLoad_InvalidAPIPort(t *testing.T) {
	// Set up environment with invalid API port
	err := os.Setenv("API_PORT", "not-a-number")
	require.NoError(t, err)
	defer os.Unsetenv("API_PORT")

	err = os.Setenv("DB_PASSWORD", "testpass")
	require.NoError(t, err)
	defer os.Unsetenv("DB_PASSWORD")

	err = os.Setenv("OPENAI_API_KEY", "test-openai-key")
	require.NoError(t, err)
	defer os.Unsetenv("OPENAI_API_KEY")

	config, err := Load()
	assert.Error(t, err)
	assert.Nil(t, config)
	assert.Contains(t, err.Error(), "invalid API_PORT")
}

func TestValidate_ValidConfig(t *testing.T) {
	config := &Config{
		DBHost:          "localhost",
		DBPort:          5432,
		DBName:          "testdb",
		DBUser:          "testuser",
		DBPassword:      "testpass",
		APIPort:         8080,
		AIProvider:      "openai",
		OpenAIAPIKey:    "test-openai-key",
		AnthropicAPIKey: "",
	}

	err := config.Validate()
	assert.NoError(t, err)
}

func TestValidate_MissingRequiredFields(t *testing.T) {
	testCases := []struct {
		name     string
		config   *Config
		expected string
	}{
		{
			name: "missing DB_HOST",
			config: &Config{
				DBHost:       "",
				DBPort:       5432,
				DBName:       "testdb",
				DBUser:       "testuser",
				DBPassword:   "testpass",
				APIPort:      8080,
				AIProvider:   "openai",
				OpenAIAPIKey: "test-openai-key",
			},
			expected: "DB_HOST is required",
		},
		{
			name: "missing DB_NAME",
			config: &Config{
				DBHost:       "localhost",
				DBPort:       5432,
				DBName:       "",
				DBUser:       "testuser",
				DBPassword:   "testpass",
				APIPort:      8080,
				AIProvider:   "openai",
				OpenAIAPIKey: "test-openai-key",
			},
			expected: "DB_NAME is required",
		},
		{
			name: "missing DB_USER",
			config: &Config{
				DBHost:       "localhost",
				DBPort:       5432,
				DBName:       "testdb",
				DBUser:       "",
				DBPassword:   "testpass",
				APIPort:      8080,
				AIProvider:   "openai",
				OpenAIAPIKey: "test-openai-key",
			},
			expected: "DB_USER is required",
		},
		{
			name: "missing DB_PASSWORD",
			config: &Config{
				DBHost:       "localhost",
				DBPort:       5432,
				DBName:       "testdb",
				DBUser:       "testuser",
				DBPassword:   "",
				APIPort:      8080,
				AIProvider:   "openai",
				OpenAIAPIKey: "test-openai-key",
			},
			expected: "DB_PASSWORD is required",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := tc.config.Validate()
			assert.Error(t, err)
			assert.Contains(t, err.Error(), tc.expected)
		})
	}
}

func TestValidate_InvalidPorts(t *testing.T) {
	testCases := []struct {
		name     string
		config   *Config
		expected string
	}{
		{
			name: "DB_PORT too low",
			config: &Config{
				DBHost:       "localhost",
				DBPort:       0,
				DBName:       "testdb",
				DBUser:       "testuser",
				DBPassword:   "testpass",
				APIPort:      8080,
				AIProvider:   "openai",
				OpenAIAPIKey: "test-openai-key",
			},
			expected: "DB_PORT must be between 1 and 65535",
		},
		{
			name: "DB_PORT too high",
			config: &Config{
				DBHost:       "localhost",
				DBPort:       65536,
				DBName:       "testdb",
				DBUser:       "testuser",
				DBPassword:   "testpass",
				APIPort:      8080,
				AIProvider:   "openai",
				OpenAIAPIKey: "test-openai-key",
			},
			expected: "DB_PORT must be between 1 and 65535",
		},
		{
			name: "API_PORT too low",
			config: &Config{
				DBHost:       "localhost",
				DBPort:       5432,
				DBName:       "testdb",
				DBUser:       "testuser",
				DBPassword:   "testpass",
				APIPort:      -1,
				AIProvider:   "openai",
				OpenAIAPIKey: "test-openai-key",
			},
			expected: "API_PORT must be between 1 and 65535",
		},
		{
			name: "API_PORT too high",
			config: &Config{
				DBHost:       "localhost",
				DBPort:       5432,
				DBName:       "testdb",
				DBUser:       "testuser",
				DBPassword:   "testpass",
				APIPort:      70000,
				AIProvider:   "openai",
				OpenAIAPIKey: "test-openai-key",
			},
			expected: "API_PORT must be between 1 and 65535",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := tc.config.Validate()
			assert.Error(t, err)
			assert.Contains(t, err.Error(), tc.expected)
		})
	}
}

func TestValidate_MultipleErrors(t *testing.T) {
	config := &Config{
		DBHost:       "",    // Missing
		DBPort:       0,     // Invalid
		DBName:       "",    // Missing
		DBUser:       "",    // Missing
		DBPassword:   "",    // Missing
		APIPort:      70000, // Invalid
		AIProvider:   "openai",
		OpenAIAPIKey: "test-openai-key",
	}

	err := config.Validate()
	assert.Error(t, err)

	errorMsg := err.Error()
	assert.Contains(t, errorMsg, "DB_HOST is required")
	assert.Contains(t, errorMsg, "DB_NAME is required")
	assert.Contains(t, errorMsg, "DB_USER is required")
	assert.Contains(t, errorMsg, "DB_PASSWORD is required")
	assert.Contains(t, errorMsg, "DB_PORT must be between 1 and 65535")
	assert.Contains(t, errorMsg, "API_PORT must be between 1 and 65535")
}

func TestValidate_AIConfig(t *testing.T) {
	base := &Config{
		DBHost:     "localhost",
		DBPort:     5432,
		DBName:     "testdb",
		DBUser:     "testuser",
		DBPassword: "testpass",
		APIPort:    8080,
	}

	t.Run("requires at least one API key", func(t *testing.T) {
		cfg := *base
		cfg.AIProvider = "openai"
		err := cfg.Validate()
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "at least one AI provider API key required")
	})

	t.Run("requires openai key when provider is openai", func(t *testing.T) {
		cfg := *base
		cfg.AIProvider = "openai"
		cfg.AnthropicAPIKey = "anthropic-key"
		err := cfg.Validate()
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "OPENAI_API_KEY is required when AI_PROVIDER is 'openai'")
	})

	t.Run("requires anthropic key when provider is anthropic", func(t *testing.T) {
		cfg := *base
		cfg.AIProvider = "anthropic"
		cfg.OpenAIAPIKey = "openai-key"
		err := cfg.Validate()
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "ANTHROPIC_API_KEY is required when AI_PROVIDER is 'anthropic'")
	})

	t.Run("rejects unsupported provider", func(t *testing.T) {
		cfg := *base
		cfg.AIProvider = "unsupported"
		cfg.OpenAIAPIKey = "openai-key"
		err := cfg.Validate()
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "AI_PROVIDER must be 'openai', 'anthropic', or 'google'")
	})
}

func TestConnectionString(t *testing.T) {
	config := &Config{
		DBHost:     "localhost",
		DBPort:     5432,
		DBName:     "testdb",
		DBUser:     "testuser",
		DBPassword: "testpass",
		APIPort:    8080,
	}

	expected := "postgres://testuser:testpass@localhost:5432/testdb?sslmode=disable"
	assert.Equal(t, expected, config.ConnectionString())
}

func TestConnectionString_WithSpecialCharacters(t *testing.T) {
	config := &Config{
		DBHost:     "db.example.com",
		DBPort:     3306,
		DBName:     "my-db",
		DBUser:     "my@user",
		DBPassword: "p@ssw0rd!",
		APIPort:    8080,
	}

	expected := "postgres://my@user:p@ssw0rd!@db.example.com:3306/my-db?sslmode=disable"
	assert.Equal(t, expected, config.ConnectionString())
}

func TestConnectionStringWithSSL(t *testing.T) {
	config := &Config{
		DBHost:     "localhost",
		DBPort:     5432,
		DBName:     "testdb",
		DBUser:     "testuser",
		DBPassword: "testpass",
		APIPort:    8080,
	}

	// Test with custom SSL mode
	expected := "postgres://testuser:testpass@localhost:5432/testdb?sslmode=require"
	assert.Equal(t, expected, config.ConnectionStringWithSSL("require"))

	// Test with empty SSL mode (should default to require)
	assert.Equal(t, expected, config.ConnectionStringWithSSL(""))

	// Test with different SSL mode
	expected2 := "postgres://testuser:testpass@localhost:5432/testdb?sslmode=verify-full"
	assert.Equal(t, expected2, config.ConnectionStringWithSSL("verify-full"))
}

func TestMustLoad_Success(t *testing.T) {
	// Set up valid environment
	err := os.Setenv("DB_PASSWORD", "testpass")
	require.NoError(t, err)
	defer os.Unsetenv("DB_PASSWORD")

	err = os.Setenv("OPENAI_API_KEY", "test-openai-key")
	require.NoError(t, err)
	defer os.Unsetenv("OPENAI_API_KEY")

	// This should not panic
	config := MustLoad()
	assert.NotNil(t, config)
	assert.Equal(t, "testpass", config.DBPassword)
}

func TestMustLoad_Panic(t *testing.T) {
	// Clear password to cause validation failure
	os.Unsetenv("DB_PASSWORD")

	// This should panic
	assert.Panics(t, func() {
		MustLoad()
	})
}

func TestLoadWithEnvFile_NonExistentFile(t *testing.T) {
	config, err := LoadWithEnvFile("/non/existent/file.env")
	assert.Error(t, err)
	assert.Nil(t, config)
	assert.Contains(t, err.Error(), "failed to load env file")
}

func TestLoadWithEnvFile_ValidFile(t *testing.T) {
	// Create a temporary .env file
	envContent := `DB_HOST=filehost
DB_PORT=3306
DB_NAME=filedb
DB_USER=fileuser
DB_PASSWORD=filepass
API_PORT=9000
OPENAI_API_KEY=file-openai-key
`
	tmpFile, err := os.CreateTemp("", "test*.env")
	require.NoError(t, err)
	defer os.Remove(tmpFile.Name())

	_, err = tmpFile.WriteString(envContent)
	require.NoError(t, err)
	tmpFile.Close()

	// Load config from file
	config, err := LoadWithEnvFile(tmpFile.Name())
	require.NoError(t, err)
	require.NotNil(t, config)

	assert.Equal(t, "filehost", config.DBHost)
	assert.Equal(t, 3306, config.DBPort)
	assert.Equal(t, "filedb", config.DBName)
	assert.Equal(t, "fileuser", config.DBUser)
	assert.Equal(t, "filepass", config.DBPassword)
	assert.Equal(t, 9000, config.APIPort)
}

func TestGetDefaults(t *testing.T) {
	config := GetDefaults()
	assert.NotNil(t, config)

	assert.Equal(t, "localhost", config.DBHost)
	assert.Equal(t, 5432, config.DBPort)
	assert.Equal(t, "yt_transcripts", config.DBName)
	assert.Equal(t, "postgres", config.DBUser)
	assert.Equal(t, "postgres", config.DBPassword)
	assert.Equal(t, 8080, config.APIPort)

	// Validate that defaults are valid
	config.OpenAIAPIKey = "test-openai-key"
	err := config.Validate()
	assert.NoError(t, err)
}

func TestGetEnvWithDefault(t *testing.T) {
	// Test with existing env var
	err := os.Setenv("TEST_VAR", "test_value")
	require.NoError(t, err)
	defer os.Unsetenv("TEST_VAR")

	result := getEnvWithDefault("TEST_VAR", "default")
	assert.Equal(t, "test_value", result)

	// Test with non-existing env var
	result = getEnvWithDefault("NON_EXISTENT_VAR", "default")
	assert.Equal(t, "default", result)
}

func TestGetEnvIntWithDefault(t *testing.T) {
	// Test with valid integer env var
	err := os.Setenv("TEST_INT", "42")
	require.NoError(t, err)
	defer os.Unsetenv("TEST_INT")

	result, err := getEnvIntWithDefault("TEST_INT", 100)
	assert.NoError(t, err)
	assert.Equal(t, 42, result)

	// Test with non-existing env var
	result, err = getEnvIntWithDefault("NON_EXISTENT_INT", 100)
	assert.NoError(t, err)
	assert.Equal(t, 100, result)

	// Test with invalid integer env var
	err = os.Setenv("INVALID_INT", "not-a-number")
	require.NoError(t, err)
	defer os.Unsetenv("INVALID_INT")

	result, err = getEnvIntWithDefault("INVALID_INT", 100)
	assert.Error(t, err)
	assert.Equal(t, 0, result)
	assert.Contains(t, err.Error(), "failed to parse INVALID_INT as integer")
}
