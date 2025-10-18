# VERIFICATION RULES

**Purpose**: Quality gates that MUST be passed before task completion.
**Enforced By**: Master Agent
**No Exceptions**: These rules are absolute.

---

## Universal Rules (All Agents)

### Before Submitting Any Task

#### 1. Code Compiles/Builds
```bash
# Backend
cd backend && go build ./...
# Must: Exit code 0

# Frontend
cd frontend && bun run build
# Must: Exit code 0, bundle <50KB
```
**Failure**: Task REJECTED immediately

#### 2. All Tests Pass
```bash
# Backend
go test -v ./...
# Must: PASS, no skipped tests without reason

# Frontend
bun test
# Must: All tests pass, coverage >80%
```
**Failure**: Task REJECTED, fix tests first

#### 3. Linting Clean
```bash
# Backend
golangci-lint run ./...
# Must: No errors, warnings acceptable if documented

# Frontend
bun run lint
# Must: No errors
```
**Failure**: Task REJECTED

#### 4. Code Formatted
```bash
# Backend
go fmt ./...
# Must: No changes (already formatted)

# Frontend
# Handled by ESLint/Prettier
```
**Failure**: Task REJECTED

#### 5. Documentation Updated
- [ ] Agent's `current_task.md` reflects work done
- [ ] Any new features documented
- [ ] API changes logged
- [ ] Breaking changes noted

**Failure**: Task REJECTED

---

## Backend-Specific Verification

### Code Quality

#### File Size Limits
```bash
# Check file line counts
wc -l **/*.go | grep -v _test.go | awk '$1 > 200'
# Must: No output (all files <200 lines)
```
**Failure**: Split file, resubmit

#### Test Coverage
```bash
go test -cover ./...
# Must: >80% coverage per package
```
**Failure**: Write more tests

#### Dependencies Verified
- [ ] All imports exist on pkg.go.dev
- [ ] Versions documented in report
- [ ] No deprecated packages

**Check**:
```bash
# Verify package exists
curl -s https://pkg.go.dev/github.com/package/name | grep "404"
# Must: No 404
```
**Failure**: Package doesn't exist, REJECTED

### API Standards

#### Health Check Works
```bash
# Start server
./app &
sleep 2

# Test health endpoint
curl -f http://localhost:8080/api/v1/health
# Must: 200 OK, JSON response
```
**Failure**: REJECTED

#### Error Responses Consistent
```json
// All errors must follow this format
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```
**Failure**: Standardize, resubmit

---

## Frontend-Specific Verification

### Bundle Size
```bash
bun run build --analyze
# Check output for bundle sizes
# Must: Initial bundle <50KB gzipped
```
**Failure**: Optimize imports, lazy load

### TypeScript Strict Mode
```bash
bun run type-check
# Must: 0 errors
```
**Failure**: Fix types, no `any`

### Accessibility
- [ ] Keyboard navigable
- [ ] ARIA labels on interactive elements
- [ ] Screen reader tested (basic)

**Check**:
```tsx
// Every button/input needs accessible name
<button aria-label="Submit transcript">
```
**Failure**: Add accessibility

### No Console Logs
```bash
grep -r "console.log" src/
# Must: No matches (or only in debug utils)
```
**Failure**: Remove console.logs

---

## Database-Specific Verification

### Migrations Reversible
```bash
# Apply migration
psql -f migrations/XXX_up.sql

# Verify tables exist
psql -c "\dt"

# Rollback
psql -f migrations/XXX_down.sql

# Verify tables gone
psql -c "\dt"

# Reapply
psql -f migrations/XXX_up.sql
```
**Failure**: Fix down migration

### Indexes Exist
```bash
# Check indexes on foreign keys
psql -c "\d transcripts"
# Must: See indexes on video_id, etc.
```
**Failure**: Add indexes

### Constraints Enforced
```sql
-- Test constraints
INSERT INTO videos (youtube_id) VALUES (NULL);
-- Must: ERROR (NOT NULL constraint)

INSERT INTO videos (youtube_id) VALUES ('invalid_format_here');
-- Must: ERROR (CHECK constraint)
```
**Failure**: Add constraints

---

## DevOps-Specific Verification

### Docker Build Success
```bash
docker build -t test-backend ./backend
docker build -t test-frontend ./frontend
# Must: Both succeed
```
**Failure**: Fix Dockerfile

### Image Size Limits
```bash
docker images | grep test-backend
# Must: <50MB

docker images | grep test-frontend
# Must: <30MB
```
**Failure**: Optimize image (multi-stage)

### Health Checks Work
```bash
docker-compose up -d
sleep 30
docker-compose ps
# Must: All services show "(healthy)"
```
**Failure**: Fix health checks

### No Secrets in Images
```bash
docker history test-backend | grep -i "api_key\|password\|secret"
# Must: No matches
```
**Failure**: CRITICAL - Remove secrets

---

## Agent Boundary Verification

### Backend Agent
```bash
# Check for frontend file modifications
git diff --name-only | grep "frontend/"
# Must: Empty (no frontend files)
```
**Failure**: REJECTED - Violated boundaries

### Frontend Agent
```bash
# Check for backend file modifications
git diff --name-only | grep "backend/"
# Must: Empty (no backend files)
```
**Failure**: REJECTED - Violated boundaries

### DevOps Agent
```bash
# Check for application code changes
git diff --name-only | grep -E "internal/|src/"
# Must: Empty (no app code)
```
**Failure**: REJECTED - Violated boundaries

---

## Report Verification

### Required Sections
- [ ] Task description (copied from master)
- [ ] Work completed (file list)
- [ ] Test results (full output)
- [ ] Build verification (output)
- [ ] Verification steps
- [ ] Documentation updates

**Check**:
```bash
# Report must exist
ls .agents/{agent}/reports/TASK_*.md
# Must: File exists

# Check for required sections
grep "## Test Results" .agents/{agent}/reports/TASK_*.md
grep "## Verification Steps" .agents/{agent}/reports/TASK_*.md
# Must: Both found
```
**Failure**: Complete report template

### Test Output Included
```markdown
## Test Results
```
[Paste full output, not "all passed"]
```
```
**Failure**: Include actual output

---

## Security Verification

### No Hardcoded Secrets
```bash
# Backend
grep -ri "sk-\|api_key.*=.*\"" backend/
# Must: No matches

# Frontend
grep -ri "sk-\|api_key.*=.*\"" frontend/
# Must: No matches
```
**Failure**: Use environment variables

### Dependencies Secure
```bash
# Backend
go list -json -m all | jq -r '.Path' | xargs -I {} curl -s "https://pkg.go.dev/{}?tab=versions" | grep -i "retracted\|deprecated"
# Should: No critical issues

# Frontend
bun pm audit
# Should: No critical/high vulnerabilities
```
**Warning**: Document known issues

### Docker Security
```bash
docker scan {image}
# Should: No critical/high vulnerabilities
```
**Warning**: Document if found

---

## Performance Verification

### Backend Response Time
```bash
# Load test health endpoint
ab -n 100 -c 10 http://localhost:8080/api/v1/health
# Must: Mean response <100ms
```
**Warning**: If >200ms, investigate

### Database Query Time
```sql
EXPLAIN ANALYZE SELECT ...;
-- Must: Execution time <50ms for simple queries
```
**Warning**: If slow, add indexes

### Frontend Load Time
```bash
# Build and serve
bun run build
bun run preview

# Check with lighthouse
lighthouse http://localhost:3000 --only-categories=performance
# Target: >90 score
```
**Goal**: Meet target, document if not

---

## Master Agent Final Checklist

Before approving ANY task:

- [ ] All verification rules passed for agent type
- [ ] Report complete with evidence
- [ ] Files are modular (<200 lines backend, <150 frontend)
- [ ] No agent boundary violations
- [ ] Documentation updated
- [ ] Tests prove functionality
- [ ] No TODOs in production code
- [ ] No invented APIs (all verified)
- [ ] Security checks passed
- [ ] Performance acceptable

### Rejection Reasons

Document in `.agents/master/reports/rejections.md`:

1. **What failed**: Specific verification rule
2. **Evidence**: Output/proof of failure
3. **Required fix**: Exact steps to pass
4. **Reassign**: Back to agent with clear instructions

### Approval Process

1. Run verification commands yourself
2. Check report evidence matches your results
3. Verify files created/modified are correct
4. Update project status
5. Assign next task or mark phase complete

---

## Continuous Verification

### After Every Merge to Main

```bash
# Full test suite
cd backend && go test ./...
cd frontend && bun test

# Full build
docker-compose build

# Integration test
docker-compose up -d
# Wait for healthy
sleep 30
docker-compose ps | grep unhealthy && exit 1

# Cleanup
docker-compose down
```

**Failure**: Fix immediately, highest priority

---

## Emergency Stop Conditions

### Immediate halt if:
1. ❌ Tests failing on main branch
2. ❌ Build failing
3. ❌ Docker compose won't start
4. ❌ Security vulnerability found
5. ❌ Data loss in database migration
6. ❌ Agent inventing non-existent APIs repeatedly

**Action**: Stop all work, fix issue, document in lessons learned

---

## Success Metrics

Track in `.agents/master/docs/metrics.md`:

### Per Task
- First-time approval rate (goal: >80% after learning phase)
- Average verification time (goal: <5 min)
- Rejections per task (goal: <1)

### Per Phase
- Phase completion time vs estimate
- Total rejections
- Critical issues found

### Overall Project
- Build reliability (goal: 100%)
- Test pass rate (goal: 100%)
- Documentation completeness (goal: 100%)
- Agent boundary violations (goal: 0)
