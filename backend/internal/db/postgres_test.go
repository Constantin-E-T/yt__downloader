package db

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
)

// PostgreSQLContainer wraps the testcontainer for PostgreSQL
type PostgreSQLContainer struct {
	testcontainers.Container
	ConnectionString string
}

// setupPostgresContainer creates a new PostgreSQL test container
func setupPostgresContainer(tb testing.TB) *PostgreSQLContainer {
	tb.Helper()

	ctx := context.Background()

	req := testcontainers.ContainerRequest{
		Image:        "postgres:16-alpine",
		ExposedPorts: []string{"5432/tcp"},
		Env: map[string]string{
			"POSTGRES_DB":       "testdb",
			"POSTGRES_USER":     "testuser",
			"POSTGRES_PASSWORD": "testpass",
		},
		WaitingFor: wait.ForAll(
			wait.ForLog("database system is ready to accept connections"),
			wait.ForListeningPort("5432/tcp"),
		).WithDeadline(60 * time.Second),
	}

	container, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	require.NoError(tb, err)

	mappedPort, err := container.MappedPort(ctx, "5432")
	require.NoError(tb, err)

	hostIP, err := container.Host(ctx)
	require.NoError(tb, err)

	connectionString := fmt.Sprintf("postgres://testuser:testpass@%s:%s/testdb?sslmode=disable",
		hostIP, mappedPort.Port())

	return &PostgreSQLContainer{
		Container:        container,
		ConnectionString: connectionString,
	}
}

func TestNewPool_SuccessfulConnection(t *testing.T) {
	container := setupPostgresContainer(t)
	defer func() {
		err := container.Terminate(context.Background())
		assert.NoError(t, err)
	}()

	ctx := context.Background()
	pool, err := NewPool(ctx, container.ConnectionString)

	require.NoError(t, err)
	require.NotNil(t, pool)
	defer pool.Close()

	// Test that pool is working by executing a simple query
	var result int
	err = pool.QueryRow(ctx, "SELECT 1").Scan(&result)
	assert.NoError(t, err)
	assert.Equal(t, 1, result)

	// Verify pool configuration
	config := pool.Config()
	assert.Equal(t, int32(25), config.MaxConns)
	assert.Equal(t, int32(5), config.MinConns)
	assert.Equal(t, time.Hour, config.MaxConnLifetime)
	assert.Equal(t, 30*time.Minute, config.MaxConnIdleTime)
	assert.Equal(t, time.Minute, config.HealthCheckPeriod)
}

func TestNewPool_InvalidConnectionString(t *testing.T) {
	ctx := context.Background()

	// Test with completely invalid connection string
	pool, err := NewPool(ctx, "invalid-connection-string")
	assert.Error(t, err)
	assert.Nil(t, pool)
	assert.Contains(t, err.Error(), "failed to parse connection string")
}

func TestNewPool_ConnectionFailure(t *testing.T) {
	ctx := context.Background()

	// Test with valid format but non-existent database
	connString := "postgres://user:pass@nonexistent-host:5432/dbname"
	pool, err := NewPool(ctx, connString)

	assert.Error(t, err)
	assert.Nil(t, pool)
	assert.Contains(t, err.Error(), "failed to connect to database after 3 attempts")
}

func TestNewPool_RetryLogic(t *testing.T) {
	ctx := context.Background()

	// Use a connection string that will fail initially
	// This simulates a scenario where the database might be temporarily unavailable
	connString := "postgres://testuser:testpass@127.0.0.1:9999/testdb"

	// Measure the time taken to ensure retry logic with exponential backoff
	start := time.Now()
	pool, err := NewPool(ctx, connString)
	elapsed := time.Since(start)

	// Should fail after 3 attempts with delays: 1s + 2s = 3s minimum (not including the final attempt)
	assert.Error(t, err)
	assert.Nil(t, pool)
	assert.Greater(t, elapsed, 2*time.Second, "Should take at least 3 seconds due to retry delays")
	assert.Contains(t, err.Error(), "failed to connect to database after 3 attempts")
}

func TestNewPool_ContextTimeout(t *testing.T) {
	// Create a context with very short timeout
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	connString := "postgres://testuser:testpass@127.0.0.1:9999/testdb"
	pool, err := NewPool(ctx, connString)

	assert.Error(t, err)
	assert.Nil(t, pool)
}

func TestNewPoolWithConfig_CustomConfiguration(t *testing.T) {
	container := setupPostgresContainer(t)
	defer func() {
		err := container.Terminate(context.Background())
		assert.NoError(t, err)
	}()

	ctx := context.Background()

	// Test with custom pool configuration
	customConfig := &PoolConfig{
		MaxConns:        5,
		MinConns:        1,
		MaxConnLifetime: 2 * time.Hour,
		MaxConnIdleTime: 15 * time.Minute,
		ConnTimeout:     20 * time.Second,
	}

	pool, err := NewPoolWithConfig(ctx, container.ConnectionString, customConfig)
	require.NoError(t, err)
	require.NotNil(t, pool)
	defer pool.Close()

	// Verify custom configuration was applied
	config := pool.Config()
	assert.Equal(t, int32(5), config.MaxConns)
	assert.Equal(t, int32(1), config.MinConns)
	assert.Equal(t, 2*time.Hour, config.MaxConnLifetime)
	assert.Equal(t, 15*time.Minute, config.MaxConnIdleTime)
}

func TestNewPoolWithConfig_NilConfig(t *testing.T) {
	container := setupPostgresContainer(t)
	defer func() {
		err := container.Terminate(context.Background())
		assert.NoError(t, err)
	}()

	ctx := context.Background()

	// Test with nil configuration should use defaults
	pool, err := NewPoolWithConfig(ctx, container.ConnectionString, nil)
	require.NoError(t, err)
	require.NotNil(t, pool)
	defer pool.Close()

	// Verify default configuration was applied
	config := pool.Config()
	assert.Equal(t, int32(25), config.MaxConns)
	assert.Equal(t, int32(5), config.MinConns)
}

func TestDefaultPoolConfig(t *testing.T) {
	config := DefaultPoolConfig()

	assert.Equal(t, int32(25), config.MaxConns)
	assert.Equal(t, int32(5), config.MinConns)
	assert.Equal(t, time.Hour, config.MaxConnLifetime)
	assert.Equal(t, 30*time.Minute, config.MaxConnIdleTime)
	assert.Equal(t, 30*time.Second, config.ConnTimeout)
}

func TestPool_PingAfterConnection(t *testing.T) {
	container := setupPostgresContainer(t)
	defer func() {
		err := container.Terminate(context.Background())
		assert.NoError(t, err)
	}()

	ctx := context.Background()
	pool, err := NewPool(ctx, container.ConnectionString)
	require.NoError(t, err)
	require.NotNil(t, pool)
	defer pool.Close()

	// Test ping functionality
	err = pool.Ping(ctx)
	assert.NoError(t, err)
}

func TestPool_MultipleConnections(t *testing.T) {
	container := setupPostgresContainer(t)
	defer func() {
		err := container.Terminate(context.Background())
		assert.NoError(t, err)
	}()

	ctx := context.Background()
	pool, err := NewPool(ctx, container.ConnectionString)
	require.NoError(t, err)
	require.NotNil(t, pool)
	defer pool.Close()

	// Test acquiring multiple connections concurrently
	const numConnections = 5

	type result struct {
		id  int
		err error
	}

	results := make(chan result, numConnections)

	for i := 0; i < numConnections; i++ {
		go func(id int) {
			conn, err := pool.Acquire(ctx)
			if err != nil {
				results <- result{id: id, err: err}
				return
			}
			defer conn.Release()

			var queryResult int
			err = conn.QueryRow(ctx, "SELECT $1::int", id).Scan(&queryResult)
			if err != nil {
				results <- result{id: id, err: fmt.Errorf("query failed for id %d: %w", id, err)}
				return
			}
			if queryResult != id {
				results <- result{id: id, err: fmt.Errorf("query failed: expected %d, got %d", id, queryResult)}
				return
			}

			results <- result{id: id, err: nil}
		}(i)
	}

	// Collect all results
	for i := 0; i < numConnections; i++ {
		res := <-results
		assert.NoError(t, res.err, "Connection %d should succeed", res.id)
	}

	close(results)
}

func TestPool_ConnectionStatistics(t *testing.T) {
	container := setupPostgresContainer(t)
	defer func() {
		err := container.Terminate(context.Background())
		assert.NoError(t, err)
	}()

	ctx := context.Background()
	pool, err := NewPool(ctx, container.ConnectionString)
	require.NoError(t, err)
	require.NotNil(t, pool)
	defer pool.Close()

	// Get initial statistics
	stats := pool.Stat()
	assert.Equal(t, int32(25), stats.MaxConns())
	assert.GreaterOrEqual(t, stats.TotalConns(), int32(0))

	// Acquire a connection and check stats
	conn, err := pool.Acquire(ctx)
	require.NoError(t, err)

	stats = pool.Stat()
	assert.Equal(t, int32(1), stats.AcquiredConns())

	conn.Release()

	// Give it a moment for the release to be processed
	time.Sleep(10 * time.Millisecond)
	stats = pool.Stat()
	assert.Equal(t, int32(0), stats.AcquiredConns())
}
