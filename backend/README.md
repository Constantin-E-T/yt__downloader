# Backend API Overview

## Environment Configuration

- For development, use `.env` (default, connects to local Postgres)
- For production, use `.env.production` (connects to CapRover Postgres)

Example switch (in your deployment or Dockerfile):

```
cp .env.production .env
```

Or set environment variables directly in CapRover.

## Monitoring Endpoints

- `GET /health` and `GET /api/health` return overall service status with database and YouTube service checks.
- `GET /metrics` and `GET /api/metrics` expose basic runtime metrics (uptime, memory usage, goroutines, CPU count).

## Performance Enhancements

- Added PostgreSQL indexes on frequent lookup columns (`videos.youtube_id`, `transcripts.video_id`, `transcripts.video_id + language`, and `created_at` fields).
- Optimized repository queries with 10s timeouts, prepared statement reuse, and pagination helpers for transcripts.
- Tuned the connection pool to 25 max / 5 min connections with proactive health checks.
- Logged slow HTTP requests (>1s) for easier production debugging.

## Error Handling

- All errors return a consistent JSON envelope:

  ```json
  {
    "error": "human friendly description",
    "status_code": 400,
    "message": "optional override",
    "details": {}
  }
  ```

- Common responses:
  - `400 Bad Request`: invalid `video_url`, malformed JSON, or unsupported `language`.
  - `404 Not Found`: video does not exist or transcript unavailable.
  - `500 Internal Server Error`: unexpected processing failure.
  - `503 Service Unavailable`: database or upstream services temporarily unreachable.
  - `504 Gateway Timeout`: YouTube lookups exceeded the 30s request deadline.
- Example:

  ```json
  {
    "error": "Video not found",
    "status_code": 404
  }
  ```
