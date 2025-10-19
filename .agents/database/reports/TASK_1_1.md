# Task Report: 1.1

## Task Description
Create initial PostgreSQL schema migration defining `videos`, `transcripts`, and `ai_summaries` tables with UUID primary keys, JSONB transcript content, cascaded foreign keys, and supporting indexes. Provide reversible migrations and test them against PostgreSQL 16.

## Work Completed
- Created: `database/migrations/001_initial_schema_up.sql`
- Created: `database/migrations/001_initial_schema_down.sql`

## Migration Content

### Up Migration
```sql
-- Migration: 001_initial_schema
-- Description: Create core tables for videos, transcripts, and AI summaries
-- Author: Database Agent
-- Date: 2024-10-18

BEGIN;

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youtube_id VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    channel TEXT,
    duration INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_videos_youtube_id ON videos (youtube_id);

CREATE TABLE IF NOT EXISTS transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL,
    language VARCHAR(10) NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT transcripts_video_id_fkey
        FOREIGN KEY (video_id) REFERENCES videos (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transcripts_video_id ON transcripts (video_id);

CREATE TABLE IF NOT EXISTS ai_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcript_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL,
    summary TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ai_summaries_transcript_id_fkey
        FOREIGN KEY (transcript_id) REFERENCES transcripts (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_summaries_transcript_id ON ai_summaries (transcript_id);

COMMIT;
```

### Down Migration
```sql
-- Migration: 001_initial_schema (DOWN)
-- Description: Drop core tables for videos, transcripts, and AI summaries
-- Author: Database Agent
-- Date: 2024-10-18

BEGIN;

DROP INDEX IF EXISTS idx_ai_summaries_transcript_id;
DROP TABLE IF EXISTS ai_summaries;

DROP INDEX IF EXISTS idx_transcripts_video_id;
DROP TABLE IF EXISTS transcripts;

DROP INDEX IF EXISTS idx_videos_youtube_id;
DROP TABLE IF EXISTS videos;

COMMIT;
```

## Test Results

### Apply Migration
```bash
docker run --rm -d --name yt_pg_test -e POSTGRES_PASSWORD=test postgres:16-alpine
cat database/migrations/001_initial_schema_up.sql | docker exec -i yt_pg_test psql -U postgres -v ON_ERROR_STOP=1
```
Output excerpt:
```
CREATE TABLE
CREATE INDEX
COMMIT
```

### Verify Schema
```bash
docker exec yt_pg_test psql -U postgres -c "\dt"
```
Output excerpt:
```
 public | ai_summaries | table | postgres
 public | transcripts  | table | postgres
 public | videos       | table | postgres
```

### Test Rollback
```bash
cat database/migrations/001_initial_schema_down.sql | docker exec -i yt_pg_test psql -U postgres -v ON_ERROR_STOP=1
docker exec yt_pg_test psql -U postgres -c "\dt"
```
Output excerpt:
```
DROP TABLE
Did not find any relations.
```

### Reapply
```bash
cat database/migrations/001_initial_schema_up.sql | docker exec -i yt_pg_test psql -U postgres -v ON_ERROR_STOP=1
docker stop yt_pg_test
```
Output excerpt:
```
NOTICE:  extension "pgcrypto" already exists, skipping
COMMIT
```

## Schema Changes
- Tables added: `videos`, `transcripts`, `ai_summaries`
- Indexes added: `idx_videos_youtube_id`, `idx_transcripts_video_id`, `idx_ai_summaries_transcript_id`
- Constraints added: Primary keys with `gen_random_uuid()`, cascading foreign keys on transcripts → videos and ai_summaries → transcripts

## Performance Considerations
- Indexed `youtube_id` for fast deduplication lookups
- Indexed foreign keys to support join performance on transcripts and AI summaries

## Breaking Changes
- No (new schema only)

## Documentation Updates
- None (schema documentation pending future task)

## Ready for Review
- [x] Both up and down migrations tested
- [x] Schema documented here
- [x] No SQL errors
- [x] Indexes appropriate
