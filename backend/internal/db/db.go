package db

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// DB represents the database interface
type DB interface {
	// Connection management
	Acquire(ctx context.Context) (Conn, error)
	Close()
	Ping(ctx context.Context) error

	// Query execution
	Exec(ctx context.Context, sql string, arguments ...any) (pgconn.CommandTag, error)
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row

	// Transaction management
	Begin(ctx context.Context) (pgx.Tx, error)
	BeginTx(ctx context.Context, txOptions pgx.TxOptions) (pgx.Tx, error)

	// Batch operations
	SendBatch(ctx context.Context, b *pgx.Batch) pgx.BatchResults

	// Statistics
	Stat() *pgxpool.Stat
}

// Conn represents a database connection interface
type Conn interface {
	// Query execution
	Exec(ctx context.Context, sql string, arguments ...any) (pgconn.CommandTag, error)
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row

	// Transaction management
	Begin(ctx context.Context) (pgx.Tx, error)
	BeginTx(ctx context.Context, txOptions pgx.TxOptions) (pgx.Tx, error)

	// Connection management
	Release()
	Ping(ctx context.Context) error

	// Batch operations
	SendBatch(ctx context.Context, b *pgx.Batch) pgx.BatchResults
}

// PostgresDB wraps a pgxpool.Pool and implements the DB interface
type PostgresDB struct {
	pool *pgxpool.Pool
}

// NewPostgresDB creates a new PostgresDB instance from a connection pool
func NewPostgresDB(pool *pgxpool.Pool) *PostgresDB {
	return &PostgresDB{pool: pool}
}

// Acquire returns a connection from the pool
func (db *PostgresDB) Acquire(ctx context.Context) (Conn, error) {
	conn, err := db.pool.Acquire(ctx)
	if err != nil {
		return nil, err
	}
	return &PostgresConn{conn: conn}, nil
}

// Close closes all connections in the pool
func (db *PostgresDB) Close() {
	db.pool.Close()
}

// Ping verifies the database connection is alive
func (db *PostgresDB) Ping(ctx context.Context) error {
	return db.pool.Ping(ctx)
}

// Exec executes a query that doesn't return rows
func (db *PostgresDB) Exec(ctx context.Context, sql string, arguments ...any) (pgconn.CommandTag, error) {
	return db.pool.Exec(ctx, sql, arguments...)
}

// Query executes a query that returns rows
func (db *PostgresDB) Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error) {
	return db.pool.Query(ctx, sql, args...)
}

// QueryRow executes a query that is expected to return at most one row
func (db *PostgresDB) QueryRow(ctx context.Context, sql string, args ...any) pgx.Row {
	return db.pool.QueryRow(ctx, sql, args...)
}

// Begin starts a new transaction
func (db *PostgresDB) Begin(ctx context.Context) (pgx.Tx, error) {
	return db.pool.Begin(ctx)
}

// BeginTx starts a new transaction with options
func (db *PostgresDB) BeginTx(ctx context.Context, txOptions pgx.TxOptions) (pgx.Tx, error) {
	return db.pool.BeginTx(ctx, txOptions)
}

// SendBatch sends a batch of queries
func (db *PostgresDB) SendBatch(ctx context.Context, b *pgx.Batch) pgx.BatchResults {
	return db.pool.SendBatch(ctx, b)
}

// Stat returns pool statistics
func (db *PostgresDB) Stat() *pgxpool.Stat {
	return db.pool.Stat()
}

// PostgresConn wraps a pgxpool.Conn and implements the Conn interface
type PostgresConn struct {
	conn *pgxpool.Conn
}

// Exec executes a query that doesn't return rows
func (c *PostgresConn) Exec(ctx context.Context, sql string, arguments ...any) (pgconn.CommandTag, error) {
	return c.conn.Exec(ctx, sql, arguments...)
}

// Query executes a query that returns rows
func (c *PostgresConn) Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error) {
	return c.conn.Query(ctx, sql, args...)
}

// QueryRow executes a query that is expected to return at most one row
func (c *PostgresConn) QueryRow(ctx context.Context, sql string, args ...any) pgx.Row {
	return c.conn.QueryRow(ctx, sql, args...)
}

// Begin starts a new transaction
func (c *PostgresConn) Begin(ctx context.Context) (pgx.Tx, error) {
	return c.conn.Begin(ctx)
}

// BeginTx starts a new transaction with options
func (c *PostgresConn) BeginTx(ctx context.Context, txOptions pgx.TxOptions) (pgx.Tx, error) {
	return c.conn.BeginTx(ctx, txOptions)
}

// Release returns the connection to the pool
func (c *PostgresConn) Release() {
	c.conn.Release()
}

// Ping verifies the connection is alive
func (c *PostgresConn) Ping(ctx context.Context) error {
	return c.conn.Ping(ctx)
}

// SendBatch sends a batch of queries
func (c *PostgresConn) SendBatch(ctx context.Context, b *pgx.Batch) pgx.BatchResults {
	return c.conn.SendBatch(ctx, b)
}

// Connect creates a new database connection using the provided connection string
func Connect(ctx context.Context, connString string) (DB, error) {
	pool, err := NewPool(ctx, connString)
	if err != nil {
		return nil, err
	}
	return NewPostgresDB(pool), nil
}

// ConnectWithConfig creates a new database connection using custom pool configuration
func ConnectWithConfig(ctx context.Context, connString string, config *PoolConfig) (DB, error) {
	pool, err := NewPoolWithConfig(ctx, connString, config)
	if err != nil {
		return nil, err
	}
	return NewPostgresDB(pool), nil
}
