# MASTER AGENT PROMPT TEMPLATES

**Purpose**: Token-efficient, concise prompts for specialized agents
**Rule**: Max 200 tokens per prompt

---

## Prompt Structure

```
AGENT: {TARGET_AGENT}
TASK_ID: {X.Y.Z}
SCOPE: {One-line description}

INSTRUCTION:
{Bullet points, no prose}

CONTEXT:
{Reference files, don't paste content}

DELIVERABLES:
{Exact files expected}

VERIFY:
{Commands to prove completion}

RULES:
{Specific constraints for this task}
```

---

## Backend Agent Prompts

### Example: Database Connection
```
AGENT: BACKEND
TASK_ID: 2.2.1
SCOPE: Create PostgreSQL connection pool using pgx v5

INSTRUCTION:
- Check pgx v5 docs: pkg.go.dev/github.com/jackc/pgx/v5
- Create internal/db/postgres.go
- Implement connection pool (max 10 conns)
- Add retry logic (3 attempts, exponential backoff)
- Handle context cancellation
- Write unit tests with testcontainers

CONTEXT:
- Config: internal/config/config.go
- Env vars: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

DELIVERABLES:
- internal/db/postgres.go (<200 lines)
- internal/db/postgres_test.go
- Update go.mod if needed

VERIFY:
go test ./internal/db/...
Must: PASS, coverage >80%

RULES:
- No invented APIs - verify pgx v5 docs first
- Include error wrapping
- Log connection status
- Report in .agents/backend/reports/TASK_2_2_1.md
```

### Example: API Endpoint
```
AGENT: BACKEND
TASK_ID: 3.4.2
SCOPE: Implement POST /api/v1/transcripts/fetch

INSTRUCTION:
- Create internal/api/handlers/transcripts.go
- Parse request: {"url": "youtube_url", "language": "en"}
- Validate YouTube URL format
- Call youtube service (internal/services/youtube)
- Save to database (internal/db/transcripts)
- Return: {"data": {...}, "meta": {...}}
- Error format: {"error": {"code": "", "message": ""}}

CONTEXT:
- Service: internal/services/youtube/client.go
- DB: internal/db/transcripts.go
- See .agents/backend/rules for response format

DELIVERABLES:
- internal/api/handlers/transcripts.go (<200 lines)
- internal/api/handlers/transcripts_test.go

VERIFY:
curl -X POST localhost:8080/api/v1/transcripts/fetch \
  -d '{"url":"https://youtube.com/watch?v=test"}'
Must: 200 OK or error JSON

RULES:
- Test with mock service
- Integration test with real DB
- No panics - return errors
```

---

## Frontend Agent Prompts

### Example: Component Creation
```
AGENT: FRONTEND
TASK_ID: 4.3.1
SCOPE: Create TranscriptInput component

INSTRUCTION:
- Create src/components/TranscriptInput/TranscriptInput.tsx
- Props: { onSubmit: (url: string) => void, disabled?: boolean }
- Input field with YouTube URL validation
- Submit button (disabled while loading)
- Show inline error for invalid URLs
- Style with Tailwind (clean, modern)
- Write tests (validation, submit)

CONTEXT:
- Validation regex: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+$/
- See .agents/frontend/rules for component standards

DELIVERABLES:
- src/components/TranscriptInput/TranscriptInput.tsx (<150 lines)
- src/components/TranscriptInput/TranscriptInput.test.tsx

VERIFY:
bun test TranscriptInput
Must: All pass, coverage >80%

RULES:
- TypeScript strict mode
- No 'any' types
- ARIA labels on inputs
- Keyboard accessible
```

### Example: API Integration
```
AGENT: FRONTEND
TASK_ID: 4.2.3
SCOPE: Implement fetchTranscript API client

INSTRUCTION:
- Create src/api/transcripts.ts
- Function: fetchTranscript(url: string): Promise<TranscriptResponse>
- Use base client from src/api/client.ts
- Type interfaces in src/types/index.ts
- Handle errors (network, 4xx, 5xx)
- Write tests with MSW (Mock Service Worker)

CONTEXT:
- API endpoint: POST /api/v1/transcripts/fetch
- Base URL: VITE_API_URL env var
- Response format: see docs/TECH_STACK.md

DELIVERABLES:
- src/api/transcripts.ts
- src/types/index.ts (add interfaces)
- src/api/transcripts.test.ts

VERIFY:
bun test transcripts
Must: All pass

RULES:
- Export typed functions
- No console.logs
- Proper error messages
```

---

## Database Agent Prompts

### Example: Migration
```
AGENT: DATABASE
TASK_ID: 1.1.1
SCOPE: Create initial schema migration

INSTRUCTION:
- Create database/migrations/001_initial_schema_up.sql
- Tables: videos, transcripts, ai_summaries
- All UUIDs (gen_random_uuid())
- Foreign keys with CASCADE
- Indexes on FKs and youtube_id
- Timestamps with timezone
- Create 001_initial_schema_down.sql (rollback)

CONTEXT:
- Schema design: see docs/PROJECT_PLAN.md Phase 1
- See .agents/database/rules for standards

DELIVERABLES:
- database/migrations/001_initial_schema_up.sql
- database/migrations/001_initial_schema_down.sql

VERIFY:
psql -f migrations/001_up.sql
psql -c "\dt"  # Show tables
psql -f migrations/001_down.sql
psql -c "\dt"  # Should be empty
Must: Up/down both work

RULES:
- BEGIN/COMMIT transactions
- IF NOT EXISTS checks
- Idempotent (can run multiple times)
```

---

## DevOps Agent Prompts

### Example: Dockerfile
```
AGENT: DEVOPS
TASK_ID: 5.1.1
SCOPE: Create backend Dockerfile

INSTRUCTION:
- Create backend/Dockerfile
- Multi-stage build (golang:1.23-alpine → alpine:latest)
- Stage 1: Build binary
- Stage 2: Run binary (non-root user)
- Healthcheck: wget localhost:8080/api/v1/health
- Image size: <50MB
- Create backend/.dockerignore

CONTEXT:
- Binary: cmd/server/main.go
- See .agents/devops/rules for standards

DELIVERABLES:
- backend/Dockerfile
- backend/.dockerignore

VERIFY:
docker build -t test-backend ./backend
docker images | grep test-backend
Must: <50MB

RULES:
- No secrets in image
- Non-root user
- Health check included
```

---

## Compact Prompts (When Agent Knows Context)

### After First Task in Sequence
```
AGENT: BACKEND
TASK_ID: 3.2.2
SCOPE: Add transcript parsing to youtube service

INSTRUCTION:
- Extend internal/services/youtube/client.go
- Parse transcript with timestamps
- Output: []TranscriptLine{Start, Duration, Text}
- Handle missing transcripts (error)
- Tests with real/mock data

DELIVERABLES:
- internal/services/youtube/client.go (updated)
- Tests

VERIFY:
go test ./internal/services/youtube/...

RULES:
- Follow existing code style
- Error wrapping
```

---

## Rejection Prompts

### When Task Fails
```
AGENT: BACKEND
TASK_ID: 2.2.1
STATUS: REJECTED

REASON:
- Tests failing: TestConnectDatabase timeout
- Missing error handling in line 45
- File size 230 lines (max 200)

FIXES REQUIRED:
1. Fix test timeout: increase context deadline
2. Add error check after pgx.Connect()
3. Split file: move retry logic to postgres_retry.go

RESUBMIT:
- Fix all 3 issues
- Run full verification checklist
- Update report with fixes

CONTEXT:
- See rejection in .agents/master/reports/TASK_2_2_1_rejected.md
```

---

## Approval Prompts

### When Moving to Next Task
```
AGENT: BACKEND
TASK_ID: 2.2.2
SCOPE: Create internal/db/videos.go CRUD

PREVIOUS: 2.2.1 APPROVED ✅

INSTRUCTION:
{Standard format}
```

---

## Emergency Stop Prompt

```
ALL AGENTS: STOP

REASON: {Critical issue}

REQUIRED:
1. Stop all work
2. No new commits
3. Await fix instructions

MASTER WILL:
- Investigate root cause
- Fix issue
- Update rules
- Resume with clear path
```

---

## Token Efficiency Tips

### DO
- Reference files by path
- Use bullet points
- Exact commands
- Short context

### DON'T
- Paste file contents
- Write paragraphs
- Explain "why" (assume they know)
- Repeat agent rules (they have them)

### Examples

❌ Bad (verbose):
```
I need you to create a really comprehensive test suite for the
database connection code. Make sure you test all the edge cases
and error conditions. It's really important that...
```

✅ Good (concise):
```
INSTRUCTION:
- Write tests for internal/db/postgres.go
- Cover: success, connection failure, timeout, retry logic
- Use testcontainers for real Postgres
- Achieve >80% coverage
```

---

## Prompt Checklist

Before sending to agent:
- [ ] <200 tokens
- [ ] Clear deliverables
- [ ] Verification commands
- [ ] Context by reference, not copy
- [ ] Exact task ID
- [ ] Agent boundaries respected
