package db

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
)

func applyMigrations(t *testing.T, database DB) {
	t.Helper()

	path := filepath.Join("..", "..", "..", "database", "migrations", "001_initial_schema_up.sql")
	sqlBytes, err := os.ReadFile(path)
	require.NoError(t, err, "read migration script")

	_, err = database.Exec(context.Background(), string(sqlBytes))
	require.NoError(t, err, "apply migration script")
}
