package db

import (
	"context"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestConnect_SuccessfulConnection(t *testing.T) {
	container := setupPostgresContainer(t)

	ctx := context.Background()
	db, err := Connect(ctx, container.ConnectionString)

	require.NoError(t, err)
	require.NotNil(t, db)
	defer db.Close()

	// Test database interface methods
	err = db.Ping(ctx)
	assert.NoError(t, err)

	// Test query execution
	var result int
	err = db.QueryRow(ctx, "SELECT 1").Scan(&result)
	assert.NoError(t, err)
	assert.Equal(t, 1, result)

	// Test connection acquisition
	conn, err := db.Acquire(ctx)
	assert.NoError(t, err)
	assert.NotNil(t, conn)

	// Test connection ping
	err = conn.Ping(ctx)
	assert.NoError(t, err)

	conn.Release()

	// Test statistics
	stats := db.Stat()
	assert.NotNil(t, stats)
	assert.Equal(t, int32(25), stats.MaxConns())
}

func TestConnectWithConfig_CustomConfiguration(t *testing.T) {
	container := setupPostgresContainer(t)

	ctx := context.Background()

	customConfig := &PoolConfig{
		MaxConns:        8,
		MinConns:        3,
		MaxConnLifetime: 45 * 60 * 1000 * 1000 * 1000, // 45 minutes in nanoseconds
		MaxConnIdleTime: 20 * 60 * 1000 * 1000 * 1000, // 20 minutes in nanoseconds
		ConnTimeout:     25 * 1000 * 1000 * 1000,      // 25 seconds in nanoseconds
	}

	db, err := ConnectWithConfig(ctx, container.ConnectionString, customConfig)
	require.NoError(t, err)
	require.NotNil(t, db)
	defer db.Close()

	// Verify custom configuration was applied
	stats := db.Stat()
	assert.Equal(t, int32(8), stats.MaxConns())
}

func TestConnect_InvalidConnectionString(t *testing.T) {
	ctx := context.Background()

	db, err := Connect(ctx, "invalid-connection-string")
	assert.Error(t, err)
	assert.Nil(t, db)
	assert.Contains(t, err.Error(), "failed to parse connection string")
}

func TestNewPostgresDB(t *testing.T) {
	container := setupPostgresContainer(t)

	ctx := context.Background()
	pool, err := NewPool(ctx, container.ConnectionString)
	require.NoError(t, err)
	defer pool.Close()

	db := NewPostgresDB(pool)
	assert.NotNil(t, db)

	// Test all interface methods
	err = db.Ping(ctx)
	assert.NoError(t, err)

	// Test Exec
	_, err = db.Exec(ctx, "CREATE TEMPORARY TABLE test_table (id INT)")
	assert.NoError(t, err)

	// Test Query
	rows, err := db.Query(ctx, "SELECT 1 as id UNION SELECT 2 as id")
	assert.NoError(t, err)
	defer rows.Close()

	var count int
	for rows.Next() {
		var id int
		err = rows.Scan(&id)
		assert.NoError(t, err)
		count++
	}
	assert.Equal(t, 2, count)

	// Test QueryRow
	var result int
	err = db.QueryRow(ctx, "SELECT 42").Scan(&result)
	assert.NoError(t, err)
	assert.Equal(t, 42, result)

	// Test transaction methods
	tx, err := db.Begin(ctx)
	assert.NoError(t, err)
	err = tx.Rollback(ctx)
	assert.NoError(t, err)

	txWithOptions, err := db.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.ReadCommitted})
	assert.NoError(t, err)
	assert.NotNil(t, txWithOptions)
	err = txWithOptions.Rollback(ctx)
	assert.NoError(t, err)

	batch := &pgx.Batch{}
	batch.Queue("SELECT 1")
	batch.Queue("SELECT 2")
	results := db.SendBatch(ctx, batch)
	for i := 0; i < 2; i++ {
		var v int
		err = results.QueryRow().Scan(&v)
		assert.NoError(t, err)
		assert.NotZero(t, v)
	}
	assert.NoError(t, results.Close())

	// Test connection acquisition
	conn, err := db.Acquire(ctx)
	assert.NoError(t, err)
	assert.NotNil(t, conn)

	// Test connection interface methods
	err = conn.Ping(ctx)
	assert.NoError(t, err)

	_, err = conn.Exec(ctx, "SELECT 1")
	assert.NoError(t, err)

	connRows, err := conn.Query(ctx, "SELECT 1")
	assert.NoError(t, err)
	connRows.Close()

	var connResult int
	err = conn.QueryRow(ctx, "SELECT 1").Scan(&connResult)
	assert.NoError(t, err)
	assert.Equal(t, 1, connResult)

	connTx, err := conn.Begin(ctx)
	assert.NoError(t, err)
	err = connTx.Rollback(ctx)
	assert.NoError(t, err)

	connTxWithOptions, err := conn.BeginTx(ctx, pgx.TxOptions{})
	assert.NoError(t, err)
	err = connTxWithOptions.Rollback(ctx)
	assert.NoError(t, err)

	connBatch := &pgx.Batch{}
	connBatch.Queue("SELECT 3")
	connBatch.Queue("SELECT 4")
	connResults := conn.SendBatch(ctx, connBatch)
	for i := 0; i < 2; i++ {
		var v int
		err = connResults.QueryRow().Scan(&v)
		assert.NoError(t, err)
		assert.NotZero(t, v)
	}
	assert.NoError(t, connResults.Close())

	conn.Release()
}

func TestPostgresDB_TransactionMethods(t *testing.T) {
	container := setupPostgresContainer(t)

	ctx := context.Background()
	db, err := Connect(ctx, container.ConnectionString)
	require.NoError(t, err)
	defer db.Close()

	// Test Begin
	tx, err := db.Begin(ctx)
	assert.NoError(t, err)
	assert.NotNil(t, tx)

	err = tx.Rollback(ctx)
	assert.NoError(t, err)

	// Test BeginTx with options
	tx2, err := db.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.Serializable})
	assert.NoError(t, err)
	assert.NotNil(t, tx2)

	err = tx2.Rollback(ctx)
	assert.NoError(t, err)

	batch := &pgx.Batch{}
	batch.Queue("SELECT 5")
	batch.Queue("SELECT 6")
	results := db.SendBatch(ctx, batch)
	for i := 0; i < 2; i++ {
		var v int
		err = results.QueryRow().Scan(&v)
		assert.NoError(t, err)
	}
	assert.NoError(t, results.Close())
}
