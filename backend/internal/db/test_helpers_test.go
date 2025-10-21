package db

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
)

func applyMigrations(tb testing.TB, database DB) {
	tb.Helper()

	migrations := []string{
		"001_initial_schema_up.sql",
		"002_add_indexes_up.sql",
		"003_ai_summaries_up.sql",
	}

	for _, name := range migrations {
		path := filepath.Join("..", "..", "..", "database", "migrations", name)
		sqlBytes, err := os.ReadFile(path)
		require.NoError(tb, err, "read migration script %s", name)

		_, err = database.Exec(context.Background(), string(sqlBytes))
		require.NoError(tb, err, "apply migration script %s", name)
	}
}
