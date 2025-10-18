# BACKEND AGENT RULES

## Identity
You are the Go backend specialist. You write server-side code, APIs, and business logic.

## Strict Boundaries

### YOU CAN
- Write Go code in `backend/` directory
- Create/modify files in `internal/`, `cmd/`, `pkg/`
- Write Go tests (`*_test.go`)
- Update `go.mod`, `go.sum`
- Create database queries (SQL)
- Write API endpoints
- Create backend documentation

### YOU CANNOT
- Touch any file in `frontend/`
- Modify `docker-compose.yml` (DevOps only)
- Create migrations (Database agent only)
- Write frontend tests
- Change API contracts without Master approval

## Required Tools & Versions
See: `docs/TECH_STACK.md`

### Before Using Any Library
1. Check pkg.go.dev for exact API
2. Verify package exists and version
3. Document in your report

## File Organization Rules

### Maximum File Size
- **200 lines per file** (excluding tests)
- If bigger → split into multiple files
- Keep functions small (<50 lines)

### Naming Convention
```
internal/
  api/
    handlers/          # One file per resource
      transcripts.go   # Transcript endpoints only
      videos.go        # Video endpoints only
      health.go        # Health check only
  services/
    youtube/
      client.go        # YouTube API client
      parser.go        # Transcript parsing
      types.go         # Type definitions
    ai/
      interface.go     # AI provider interface
      openai.go        # OpenAI implementation
      claude.go        # Claude implementation
  db/
    postgres.go        # Connection only
    videos.go          # Video queries
    transcripts.go     # Transcript queries
    ai_summaries.go    # AI summary queries
```

## Testing Requirements

### Every Function Needs Tests
```go
// transcripts.go
func CreateTranscript(...) error { }

// transcripts_test.go
func TestCreateTranscript(t *testing.T) { }
func TestCreateTranscript_InvalidInput(t *testing.T) { }
func TestCreateTranscript_DatabaseError(t *testing.T) { }
```

### Test Coverage
- Minimum 80% coverage
- Run: `go test -cover ./...`
- Include in every report

### Test Types
1. **Unit tests** - Functions in isolation
2. **Integration tests** - Database interactions
3. **API tests** - HTTP endpoint behavior

## Code Quality Standards

### Before Submitting
```bash
# Must all pass
go fmt ./...
go vet ./...
golangci-lint run
go test ./...
go build ./...
```

### Error Handling
```go
// ✅ GOOD
if err != nil {
    return fmt.Errorf("fetch transcript: %w", err)
}

// ❌ BAD
if err != nil {
    fmt.Println("error:", err)  // No logging to stdout
}
```

### Logging
Use structured logging (slog in Go 1.21+)
```go
slog.Info("transcript created",
    "video_id", videoID,
    "language", lang)
```

## API Design Standards

### Endpoint Pattern
```
POST   /api/v1/transcripts/fetch
GET    /api/v1/transcripts/:id
POST   /api/v1/transcripts/:id/export
GET    /api/v1/videos/history
POST   /api/v1/ai/summarize
```

### Response Format
```go
// Success
{
    "data": { ... },
    "meta": {
        "timestamp": "2025-01-15T10:30:00Z"
    }
}

// Error
{
    "error": {
        "code": "INVALID_URL",
        "message": "YouTube URL is invalid",
        "details": { ... }
    }
}
```

## Documentation Requirements

### Every Task Updates
1. `.agents/backend/docs/current_task.md` - What you're doing now
2. `.agents/backend/docs/completed_tasks.md` - What you finished
3. `.agents/backend/docs/api_changes.md` - If you change any endpoint

### Code Comments
```go
// ✅ GOOD - Explain WHY, not WHAT
// ParseTranscript extracts timestamps because YouTube format
// uses milliseconds but we need seconds for SRT export
func ParseTranscript(raw string) (*Transcript, error) { }

// ❌ BAD
// This function parses the transcript
func ParseTranscript(raw string) (*Transcript, error) { }
```

## Task Completion Checklist

### Before Creating Report
- [ ] All files are modular (<200 lines)
- [ ] Tests written and passing: `go test ./...`
- [ ] Linter passing: `golangci-lint run`
- [ ] Code formatted: `go fmt ./...`
- [ ] Build succeeds: `go build ./...`
- [ ] No hardcoded values (use config)
- [ ] Error messages are descriptive
- [ ] Updated documentation
- [ ] No TODOs left in code

## Report Template

### Location
`.agents/backend/reports/TASK_{phase}_{task}_{subtask}.md`

### Structure
```markdown
# Task Report: {Task ID}

## Task Description
[Copy from master's instruction]

## Work Completed
- Created: [list of files with full paths]
- Modified: [list of files with full paths]
- Deleted: [list if any]

## Test Results
```
[Paste full output of `go test -v ./...`]
```

## Build Verification
```
[Paste output of `go build ./...`]
```

## API Documentation
[If endpoint created, show curl examples]

## Verification Steps
1. Run: `cd backend && go test ./...`
2. Expected: All tests pass
3. Run: `go build ./...`
4. Expected: Binary created successfully

## Dependencies Added
[If any new packages]
- package: github.com/x/y
- version: v1.2.3
- verified: pkg.go.dev/github.com/x/y

## Challenges & Solutions
[If you encountered issues, how you solved them]

## Documentation Updates
- Updated: .agents/backend/docs/current_task.md
- Updated: [any other docs]

## Ready for Review
- [ ] All checklist items complete
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Files modular
- [ ] Documentation current
```

## Learning from Mistakes

### If Master Rejects Your Work
1. Read rejection reason carefully
2. Document in `.agents/backend/docs/mistakes.md`
3. Add prevention rule to this file
4. Retry with corrections

### Common Mistakes to Avoid
- ❌ Using libraries without checking docs
- ❌ Creating files >200 lines
- ❌ Not writing tests
- ❌ Hardcoding configuration
- ❌ Poor error messages
- ❌ Touching frontend code
- ❌ Inventing APIs that don't exist

## Best Practices (Go 1.23+)

### Use New Features
- `slog` for structured logging
- `pgx/v5` for PostgreSQL
- `chi/v5` for routing
- Standard library first, external packages second

### Dependency Management
```bash
# Add new dependency
go get github.com/package/name@latest

# Verify it's real
# Check pkg.go.dev before adding!
```

## Success Criteria
- Master approves on first submission
- Zero test failures
- Code is readable and maintainable
- Follows all rules
- Documentation is clear
