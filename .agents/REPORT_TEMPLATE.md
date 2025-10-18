# Task Report Template

**Copy this template to**: `.agents/{agent}/reports/TASK_{phase}_{task}_{subtask}.md`

Example: `.agents/backend/reports/TASK_2_3_1.md`

---

# Task Report: {TASK_ID}

**Agent**: {BACKEND|FRONTEND|DEVOPS|DATABASE}
**Phase**: {Phase Number}
**Task**: {Task Number}
**Subtask**: {Subtask Number}
**Date**: {YYYY-MM-DD}

---

## Task Description

{Copy exact instruction from Master Agent here}

---

## Work Completed

### Files Created
- `path/to/file1.go`
- `path/to/file2.go`
- `path/to/file3_test.go`

### Files Modified
- `path/to/existing_file.go` - Added XYZ function
- `go.mod` - Added dependency github.com/x/y

### Files Deleted
- None (or list if any)

---

## Test Results

### Command
```bash
{Exact command run}
```

### Output
```
{Paste FULL output here - do not summarize}

Example:
=== RUN   TestCreateTranscript
--- PASS: TestCreateTranscript (0.01s)
=== RUN   TestCreateTranscript_InvalidInput
--- PASS: TestCreateTranscript_InvalidInput (0.00s)
PASS
coverage: 85.2% of statements
ok      github.com/project/internal/db  0.234s
```

### Coverage
- Package: `internal/db`
- Coverage: `85.2%`
- Status: ✅ PASS (>80%)

---

## Build Verification

### Command
```bash
{Exact command run}
```

### Output
```
{Paste FULL output}

Example:
$ go build ./...
$ echo $?
0
```

### Result
✅ Build successful

---

## Linting

### Command
```bash
{Exact command run}
```

### Output
```
{Paste output - empty is good}
```

### Result
✅ No errors

---

## Verification Steps

### For Reviewer to Run

1. **Setup**
   ```bash
   cd backend
   ```

2. **Run Tests**
   ```bash
   go test ./internal/db/...
   ```
   **Expected**: All tests pass, coverage >80%

3. **Build**
   ```bash
   go build ./...
   ```
   **Expected**: Exit code 0

4. **Lint**
   ```bash
   golangci-lint run ./...
   ```
   **Expected**: No errors

5. **Manual Test** (if applicable)
   ```bash
   {Specific commands to manually verify}
   ```
   **Expected**: {What should happen}

---

## Dependencies Added

{If none, write "None"}

### Package: `github.com/example/package`
- **Version**: `v1.2.3`
- **Purpose**: {Why this package is needed}
- **Verified**: [x] Checked on pkg.go.dev (backend) or npmjs.com (frontend)
- **Link**: https://pkg.go.dev/github.com/example/package
- **Alternative Considered**: {Other options and why this was chosen}

---

## API Changes

{If none, write "None"}

### New Endpoint: `POST /api/v1/example`

**Request**:
```json
{
  "field": "value"
}
```

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "result": "value"
  }
}
```

**Error Responses**:
- `400` - Invalid input
- `500` - Server error

**Curl Example**:
```bash
curl -X POST http://localhost:8080/api/v1/example \
  -H "Content-Type: application/json" \
  -d '{"field":"value"}'
```

---

## Database Changes

{If none, write "None"}

### Tables Modified
- `table_name`: Added column `column_name TYPE`

### Indexes Added
- `idx_table_column` on `table(column)`

### Migration Files
- `database/migrations/XXX_description_up.sql`
- `database/migrations/XXX_description_down.sql`

---

## Performance Impact

### Bundle Size (Frontend only)
- Before: `XX KB`
- After: `YY KB`
- Delta: `+ZZ KB`
- Status: {PASS <50KB | FAIL >50KB}

### Response Time (Backend only)
- Endpoint: `/api/v1/example`
- Average: `XX ms`
- P95: `YY ms`
- Status: {PASS <200ms | WARN >200ms}

### Database Queries (Database only)
- Query: `SELECT ...`
- Execution time: `XX ms`
- Status: {PASS <50ms | WARN >50ms}

---

## Challenges Encountered

{If none, write "None"}

### Challenge 1: {Description}
**Problem**: {What went wrong}
**Solution**: {How you solved it}
**Learned**: {What to do differently next time}

---

## Security Considerations

{If none, write "N/A"}

- [ ] No secrets in code
- [ ] Input validation implemented
- [ ] No SQL injection vectors
- [ ] No XSS vulnerabilities (frontend)
- [ ] Dependencies scanned (show output if issues)

---

## Documentation Updates

### Updated Files
- `.agents/{agent}/docs/current_task.md`
- `.agents/{agent}/docs/completed_tasks.md`
- {Any other documentation}

### What Changed
{Brief description of doc updates}

---

## Accessibility (Frontend only)

{N/A for backend/devops/database}

- [ ] Keyboard navigable
- [ ] ARIA labels on interactive elements
- [ ] Focus indicators visible
- [ ] Screen reader compatible (tested with {tool})

---

## Agent Rules Compliance

### Boundary Check
- [ ] Did not modify files outside my domain
- [ ] Did not touch {other agent} code
- [ ] Respected agent boundaries

### File Size Check
- [ ] All files <{200 for backend, 150 for frontend} lines (excluding tests)
- [ ] Split large files appropriately

### Modularity Check
- [ ] Code is modular and reusable
- [ ] Single responsibility per file
- [ ] Clear separation of concerns

---

## Checklist Before Submission

- [ ] All tests pass
- [ ] Build succeeds
- [ ] Linter clean
- [ ] Code formatted
- [ ] Documentation updated
- [ ] Report complete
- [ ] Verification steps work
- [ ] No TODOs in code
- [ ] No console.logs (frontend)
- [ ] No hardcoded secrets

---

## Ready for Master Review

**Status**: ✅ READY | ⚠️ NEEDS REVIEW | ❌ NOT READY

**Agent Sign-off**: {Agent Name}
**Date**: {YYYY-MM-DD HH:MM}

---

## Master Agent Section (Do Not Fill)

**Reviewed By**: {Master Agent}
**Review Date**: {YYYY-MM-DD}
**Status**: ✅ APPROVED | ❌ REJECTED | 🔄 NEEDS REVISION

### Review Notes
{Master's comments}

### Verification Results
{Master's verification command outputs}

### Decision
{APPROVED - proceed to next task}
{REJECTED - see rejection report}
{REVISION - make changes listed above}
