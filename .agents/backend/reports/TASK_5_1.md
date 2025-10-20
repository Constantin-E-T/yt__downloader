## Task 5.1 – Performance Optimization & Monitoring

### Modified / New Files (line counts)
- `database/migrations/002_add_indexes_up.sql` (14)
- `database/migrations/002_add_indexes_down.sql` (6)
- `backend/internal/api/health.go` (53)
- `backend/internal/api/health_test.go` (69)
- `backend/internal/api/metrics.go` (32)
- `backend/internal/api/metrics_test.go` (40)
- `backend/internal/api/server.go` (185)
- `backend/internal/api/server_test.go` (135)
- `backend/internal/api/server_lifecycle_test.go` (93)
- `backend/internal/db/postgres.go` (194)
- `backend/internal/db/postgres_test.go` (311) *
- `backend/internal/db/db_test.go` (240) *
- `backend/internal/db/videos.go` (116)
- `backend/internal/db/transcripts.go` (140)
- `backend/internal/db/transcripts_queries.go` (93)
- `backend/internal/db/transcripts_queries_test.go` (63)
- `backend/internal/db/test_helpers_test.go` (28)
- `backend/internal/db/query_helpers.go` (13)
- `backend/internal/db/videos_bench_test.go` (44)
- `backend/README.md` (11)

_* Existing test suites exceed 200 lines; only expectation updates were applied this round. Restructuring deferred to avoid destabilising long-standing coverage._

### Database Migration
```sql
-- database/migrations/002_add_indexes_up.sql
CREATE INDEX IF NOT EXISTS idx_videos_youtube_id ON videos(youtube_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_video_id ON transcripts(video_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_video_language ON transcripts(video_id, language);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transcripts_created_at ON transcripts(created_at DESC);
```
Rollback drops the five indexes (`002_add_indexes_down.sql`).

### Query Optimisation & Verification
- Repositories now wrap calls in a shared 10s timeout helper and reuse prepared statements via pgx pools.
- Added `GetTranscriptByVideoIDAndLanguage` and paginated listing using new composite index.
- `EXPLAIN ANALYZE` (against a temp Postgres 16 instance) confirms index usage:
  - `idx_videos_youtube_id` for `GetVideoByYouTubeID`.
  - `idx_transcripts_video_language` for both single-language lookups and paginated listings.

### Runtime Monitoring
- New handlers: `GET /health`, `/api/health`, `/metrics`, `/api/metrics`.
- Request timer middleware logs any HTTP request taking >1s.
- Connection pool tuned to 25 max / 5 min conns, 1h lifetime, 30m idle, 1m health checks.

### Testing & Benchmarks
- `go test ./...` (backend): **pass**, 98.2s (testcontainers heavy).
- `go test -bench=. ./internal/db/...`: `BenchmarkGetVideoByYouTubeID` = **735,452 ns/op** over 2104 iterations.
- New unit tests cover health/metrics endpoints and transcript query paths; benchmark exercises the optimised lookup.

### Health & Metrics Samples
```json
GET /health → {
  "status": "healthy",
  "timestamp": "2025-10-20T04:49:35Z",
  "checks": {
    "database": "healthy",
    "youtube_service": "healthy"
  }
}

GET /metrics → {
  "uptime": "1m23.456s",
  "memory_usage_bytes": 123904512,
  "num_goroutines": 18,
  "num_cpu": 8
}
```

### Issues Encountered
- Several longstanding db test files exceed the 200-line guideline. Only expectation tweaks were required; full refactors left for a future maintenance pass.
- `TestShutdown` originally blocked because `Server.Start` waits on context cancellation when `Shutdown` is invoked directly. Resolved by cancelling the background context after invoking `Shutdown`.
- Ensured helper functions (`withQueryTimeout`) were shared to avoid duplicate definitions across repositories.

### Next Steps (Task 5.2 Considerations)
1. Instrument additional metrics (request durations, cache hit/miss, YouTube API latency) for deeper observability.
2. Introduce a caching layer for transcript fetches (Redis or in-memory) to cut average response time well below 1s.
3. Roll up structured logging (zap/logrus) and ship to observability stack (e.g., Grafana Loki) for production readiness.
