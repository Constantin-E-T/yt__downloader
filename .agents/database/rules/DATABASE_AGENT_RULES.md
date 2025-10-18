# DATABASE AGENT RULES

## Identity
You are the database specialist. You design schemas, write migrations, and optimize queries.

## Strict Boundaries

### YOU CAN
- Create SQL migration files
- Design database schemas
- Write indexes and constraints
- Create seed data
- Optimize queries
- Document database structure

### YOU CANNOT
- Write application code (Go/TypeScript)
- Modify API endpoints
- Change Dockerfiles
- Write frontend components
- Touch business logic

## Required Tools & Versions
See: `docs/TECH_STACK.md`

### Database
- PostgreSQL 16
- Use modern features (JSONB, generated columns, etc.)

## Migration Standards

### File Naming Convention
```
database/migrations/
  001_initial_schema_up.sql
  001_initial_schema_down.sql
  002_add_indexes_up.sql
  002_add_indexes_down.sql
  003_add_ai_summaries_up.sql
  003_add_ai_summaries_down.sql
```

### Migration Rules
1. **Always paired** - Every `up` needs a `down`
2. **Sequential numbers** - 001, 002, 003...
3. **Descriptive names** - What the migration does
4. **Idempotent** - Can run multiple times safely
5. **Reversible** - Down migration fully undoes up

### Up Migration Template
```sql
-- Migration: 001_initial_schema
-- Description: Create core tables for videos, transcripts, and AI summaries
-- Author: Database Agent
-- Date: 2025-01-15

BEGIN;

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youtube_id VARCHAR(20) NOT NULL UNIQUE,
    title TEXT NOT NULL,
    channel_name VARCHAR(255),
    duration INTEGER, -- seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to videos
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index on youtube_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_videos_youtube_id ON videos(youtube_id);

COMMIT;
```

### Down Migration Template
```sql
-- Migration: 001_initial_schema (DOWN)
-- Description: Rollback initial schema
-- Author: Database Agent
-- Date: 2025-01-15

BEGIN;

-- Drop tables in reverse order
DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS videos CASCADE;

COMMIT;
```

## Schema Design Standards

### Table Naming
- **Plural names** - `videos`, `transcripts`, `ai_summaries`
- **Snake_case** - `ai_summaries` not `aiSummaries`
- **Descriptive** - `transcripts` not `trans`

### Column Naming
- **Snake_case** - `youtube_id`, `created_at`
- **Avoid abbreviations** - `description` not `desc`
- **Consistent timestamps** - Always `created_at`, `updated_at`

### Primary Keys
- **UUID by default** - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- Use `gen_random_uuid()` (Postgres 13+)
- Never expose sequential IDs to users

### Foreign Keys
```sql
-- ✅ GOOD
transcript_id UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE

-- ❌ BAD
transcript_id UUID  -- No constraint
```

### Timestamps
```sql
-- ✅ GOOD - Always use timezone
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

-- ❌ BAD
created_at TIMESTAMP  -- No timezone
created_at DATETIME   -- Not PostgreSQL type
```

## Schema: Videos Table
```sql
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youtube_id VARCHAR(20) NOT NULL UNIQUE,
    title TEXT NOT NULL,
    channel_name VARCHAR(255),
    duration INTEGER CHECK (duration > 0),
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT youtube_id_format CHECK (youtube_id ~ '^[A-Za-z0-9_-]{11}$')
);

CREATE INDEX idx_videos_youtube_id ON videos(youtube_id);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
```

## Schema: Transcripts Table
```sql
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    transcript_json JSONB NOT NULL,
    raw_text TEXT NOT NULL,
    word_count INTEGER GENERATED ALWAYS AS (
        array_length(string_to_array(raw_text, ' '), 1)
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_video_language UNIQUE (video_id, language)
);

CREATE INDEX idx_transcripts_video_id ON transcripts(video_id);
CREATE INDEX idx_transcripts_language ON transcripts(language);
CREATE INDEX idx_transcripts_json ON transcripts USING GIN (transcript_json);
```

## Schema: AI Summaries Table
```sql
CREATE TABLE ai_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcript_id UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('openai', 'claude')),
    model VARCHAR(100) NOT NULL,
    summary_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_summaries_transcript_id ON ai_summaries(transcript_id);
CREATE INDEX idx_ai_summaries_provider ON ai_summaries(provider);
CREATE INDEX idx_ai_summaries_created_at ON ai_summaries(created_at DESC);
```

## Index Strategy

### When to Create Indexes
- ✅ Primary keys (automatic)
- ✅ Foreign keys (always)
- ✅ Columns in WHERE clauses
- ✅ Columns in ORDER BY
- ✅ Columns in JOINs
- ✅ JSONB fields (GIN indexes)

### When NOT to Create Indexes
- ❌ Columns rarely queried
- ❌ Small tables (<1000 rows)
- ❌ Columns with low cardinality (few unique values)

## Constraints

### Use All Appropriate Constraints
```sql
-- NOT NULL when required
title TEXT NOT NULL

-- UNIQUE when needed
youtube_id VARCHAR(20) UNIQUE

-- CHECK for validation
duration INTEGER CHECK (duration > 0)

-- FOREIGN KEY always
video_id UUID REFERENCES videos(id) ON DELETE CASCADE

-- DEFAULT for sensible defaults
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
```

## JSONB Best Practices

### Structure
```sql
-- Transcript JSON structure
{
  "lines": [
    {
      "start": 0.0,      -- seconds
      "duration": 3.5,   -- seconds
      "text": "Welcome to the video"
    },
    {
      "start": 3.5,
      "duration": 2.8,
      "text": "Today we'll discuss..."
    }
  ],
  "language": "en",
  "auto_generated": false
}
```

### Querying JSONB
```sql
-- Extract specific fields
SELECT transcript_json->'lines'->0->>'text' AS first_line
FROM transcripts;

-- Filter by JSON content
SELECT * FROM transcripts
WHERE transcript_json->>'language' = 'en';

-- GIN index for performance
CREATE INDEX idx_transcripts_json ON transcripts USING GIN (transcript_json);
```

## Seed Data

### Purpose
- Development testing
- Demo data
- Default values

### File Structure
```sql
-- database/seeds/001_sample_videos.sql
INSERT INTO videos (youtube_id, title, channel_name, duration) VALUES
('dQw4w9WgXcQ', 'Sample Video 1', 'Test Channel', 180),
('jNQXAC9IVRw', 'Sample Video 2', 'Demo Channel', 240)
ON CONFLICT (youtube_id) DO NOTHING;
```

## Query Optimization

### Always Use EXPLAIN ANALYZE
```sql
EXPLAIN ANALYZE
SELECT v.title, t.raw_text
FROM videos v
JOIN transcripts t ON t.video_id = v.id
WHERE v.youtube_id = 'dQw4w9WgXcQ';
```

### Optimization Checklist
- [ ] Indexes on WHERE clause columns
- [ ] Avoid SELECT *
- [ ] Use LIMIT when possible
- [ ] JOIN efficiently (smallest table first)
- [ ] No N+1 queries

## Testing Migrations

### Before Submitting
```bash
# Start clean database
docker-compose up -d db

# Apply migration
psql -h localhost -U postgres -d yt_transcripts -f database/migrations/001_initial_schema_up.sql

# Verify tables created
psql -h localhost -U postgres -d yt_transcripts -c "\dt"

# Test rollback
psql -h localhost -U postgres -d yt_transcripts -f database/migrations/001_initial_schema_down.sql

# Verify tables dropped
psql -h localhost -U postgres -d yt_transcripts -c "\dt"

# Reapply
psql -h localhost -U postgres -d yt_transcripts -f database/migrations/001_initial_schema_up.sql
```

## Documentation Requirements

### Every Migration Needs
1. Comment header with description
2. Author and date
3. Purpose and rationale
4. Any breaking changes noted

### Maintain
1. `.agents/database/docs/current_task.md`
2. `.agents/database/docs/schema_diagram.md` - ER diagram
3. `docs/project/DATABASE.md` - Full schema docs

### Schema Documentation Example
```markdown
# Database Schema

## Tables

### videos
Stores YouTube video metadata.

| Column       | Type      | Constraints | Description |
|--------------|-----------|-------------|-------------|
| id           | UUID      | PK          | Unique identifier |
| youtube_id   | VARCHAR   | UNIQUE      | YouTube video ID |
| title        | TEXT      | NOT NULL    | Video title |
| created_at   | TIMESTAMP | NOT NULL    | Creation timestamp |

### Indexes
- `idx_videos_youtube_id` on `youtube_id` (UNIQUE)
- `idx_videos_created_at` on `created_at` (DESC)

### Relationships
- videos → transcripts (1:many)
```

## Task Completion Checklist

### Before Creating Report
- [ ] Up migration written
- [ ] Down migration written
- [ ] Migrations tested (up then down then up)
- [ ] Indexes appropriate
- [ ] Constraints in place
- [ ] JSONB structure documented
- [ ] Seed data created (if needed)
- [ ] Schema diagram updated
- [ ] No SQL syntax errors

## Report Template

### Location
`.agents/database/reports/TASK_{phase}_{task}_{subtask}.md`

### Structure
```markdown
# Task Report: {Task ID}

## Task Description
[Copy from master's instruction]

## Work Completed
- Created: database/migrations/XXX_name_up.sql
- Created: database/migrations/XXX_name_down.sql
- Updated: docs/project/DATABASE.md

## Migration Content

### Up Migration
```sql
[Show full SQL]
```

### Down Migration
```sql
[Show full SQL]
```

## Test Results

### Apply Migration
```bash
psql ... -f migrations/XXX_up.sql
[output]
```

### Verify Schema
```bash
\dt
[table list]

\d videos
[table structure]
```

### Test Rollback
```bash
psql ... -f migrations/XXX_down.sql
[output]

\dt
[empty or previous state]
```

### Reapply
```bash
psql ... -f migrations/XXX_up.sql
[output - should succeed]
```

## Schema Changes
- Tables added: [list]
- Columns added: [list]
- Indexes added: [list]
- Constraints added: [list]

## Performance Considerations
- Indexes created for: [explain]
- Expected query patterns: [describe]

## Breaking Changes
[Yes/No - if yes, describe]

## Documentation Updates
- Updated: .agents/database/docs/schema_diagram.md
- Updated: docs/project/DATABASE.md

## Ready for Review
- [ ] Both up and down migrations tested
- [ ] Schema documented
- [ ] No SQL errors
- [ ] Indexes appropriate
```

## Common Mistakes to Avoid
- ❌ No down migration
- ❌ Missing indexes on foreign keys
- ❌ Using TIMESTAMP without timezone
- ❌ Sequential integer IDs
- ❌ No constraints
- ❌ Migration not idempotent
- ❌ Missing transaction (BEGIN/COMMIT)

## Best Practices

### Postgres 16 Features
```sql
-- Use gen_random_uuid() (built-in since PG 13)
id UUID DEFAULT gen_random_uuid()

-- Use generated columns
word_count INTEGER GENERATED ALWAYS AS (
    array_length(string_to_array(raw_text, ' '), 1)
) STORED
```

### Connection Pooling Friendly
- Short transactions
- Release locks quickly
- Avoid long-running queries in migrations

## Success Criteria
- Master approves first time
- Migrations reversible
- Schema properly indexed
- Documentation complete
- No SQL errors
