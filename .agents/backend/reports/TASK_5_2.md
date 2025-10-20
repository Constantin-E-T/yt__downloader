## Task 5.2 – Error Handling & Edge Cases

### Files Created / Modified
| File | Lines |
| --- | --- |
| backend/internal/api/errors.go | 31 |
| backend/internal/api/transcripts.go | 159 |
| backend/internal/api/transcripts_helpers.go | 103 |
| backend/internal/api/transcripts_test.go | 159 |
| backend/internal/api/transcripts_errors_test.go | 162 |
| backend/internal/api/transcripts_test_helpers.go | 72 |
| backend/internal/api/validation.go | 108 |
| backend/internal/api/validation_test.go | 59 |
| backend/internal/db/error_helpers.go | 22 |
| backend/internal/db/transcripts.go | 156 |
| backend/internal/db/videos.go | 129 |
| backend/internal/services/youtube.go | 222 |
| backend/internal/services/youtube_test.go | 259 |
| backend/README.md | 35 |

### Validation Logic
- Added `ValidateVideoURL` to normalise video identifiers, restrict domains to YouTube, and gracefully surface extraction failures (plain IDs still supported).
- Added `ValidateLanguage` enforcing 2–5 character ISO-esque codes while treating empty languages as optional.
- Comprehensive unit tests (`validation_test.go`) cover plain IDs, parameterised URLs, malformed URIs, and boundary length cases.

### Error Types & Handling
- Introduced structured error payloads (`ErrorResponse`) and helper `writeStructuredError`.
- Transcript handler now:
  - Enforces a 30 s request deadline and propagates `504 Gateway Timeout`.
  - Checks >10 h video durations, empty transcripts, and database availability with actionable messages.
  - Logs validation/fetch/storage failures with context.
- YouTube service maps upstream errors into domain-specific constants (`ErrVideoNotFound`, `ErrTranscriptUnavailable`, `ErrRateLimited`, etc.).
- Database repositories wrap duplicate key and connectivity issues using new helpers (`isDuplicateKeyError`, `isConnectionError`).

### Testing
- `go test ./...` (backend) ✅ (3.85 s).
- New suites:
  - `transcripts_errors_test.go` covers invalid JSON, URL, language, upstream 404/timeout, DB failures, and transcript write failures.
  - `transcripts_test.go` exercises success path, transcript-disabled, and repository error branches.
  - `validation_test.go` ensures URL/language validators reject bad input.
  - Updated `youtube_test.go` to assert refined error classification.
- Coverage snapshot: increased qualitative coverage of validation and error paths (no numeric delta collected; prior gaps in error handling are now exercised via dedicated tests).

### Manual Testing
- Not executed in this session. Recommended smoke checks once the server is running:
  ```bash
  curl -X POST http://localhost:8080/api/v1/transcripts/fetch \
    -H "Content-Type: application/json" \
    -d '{"video_url":"https://example.com/invalid"}'

  curl -X POST http://localhost:8080/api/v1/transcripts/fetch \
    -H "Content-Type: application/json" \
    -d '{"video_url":"https://youtube.com/watch?v=dQw4w9WgXcQ","language":"toolong"}'

  curl -X POST http://localhost:8080/api/v1/transcripts/fetch \
    -H "Content-Type: application/json" \
    -d '{"video_url":"https://youtube.com/watch?v=invalid123"}'
  ```

### Example Error Responses
- Invalid URL:
  ```json
  {
    "error": "Invalid video URL: invalid video URL: not a YouTube URL",
    "status_code": 400
  }
  ```
- Transcript unavailable:
  ```json
  {
    "error": "Transcript is empty or unavailable",
    "status_code": 404
  }
  ```
- Timeout:
  ```json
  {
    "error": "Request timed out while fetching video metadata",
    "status_code": 504
  }
  ```

### Issues & Resolutions
- Transcript handler file exceeded the 200-line guideline; refactored helper logic/tests into separate helper/go files.
- Legacy tests expected legacy error payloads; migrated to the structured response and refreshed fixtures to use canonical 11-character video IDs.
- Encountered lack of context-aware YouTube client; wrapped calls in goroutines to honour request deadlines without modifying service interface.

### Next Steps (Task 5.3 Preview)
1. Introduce response caching (e.g., Redis or in-memory) to reduce repeated YouTube lookups.
2. Extend structured logging to JSON and forward to centralised observability (Grafana Loki/ELK).
3. Surface additional metrics (request latency histograms, error counts) via `/metrics` for alerting.
