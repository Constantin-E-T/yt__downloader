# PROJECT PLAN - YouTube Transcript Downloader

**Project Name**: YouTube Transcript Downloader
**Version**: 1.0.0
**Last Updated**: 2025-01-15

---

## Overview

A monorepo application to extract YouTube transcripts with timestamps, export in multiple formats (JSON, TXT, SRT), and integrate AI summarization using OpenAI/Claude.

### Architecture
- **Backend**: Go REST API
- **Frontend**: Solid.js SPA
- **Database**: PostgreSQL 16
- **Infrastructure**: Docker Compose

---

## PHASE 0: Project Setup & Research

**Status**: IN PROGRESS
**Estimated Duration**: 1 day
**Assigned**: Master Agent coordinates

### Task 0.1: Research & Verification
**Agent**: Master
**Description**: Verify all technology choices and document APIs

- [ ] 0.1.1: Check Go 1.23/1.24 release notes
- [ ] 0.1.2: Verify `kkdai/youtube` library API
- [ ] 0.1.3: Research YouTube transcript format
- [ ] 0.1.4: Check Solid.js latest version
- [ ] 0.1.5: Verify Bun compatibility with Solid.js

**Acceptance**: `docs/TECH_STACK.md` complete and verified

### Task 0.2: Project Structure Creation
**Agent**: Master
**Description**: Create root directory structure

- [ ] 0.2.1: Create root directories
- [ ] 0.2.2: Initialize Go module in `/backend`
- [ ] 0.2.3: Initialize Bun project in `/frontend`
- [ ] 0.2.4: Create `.env.example`
- [ ] 0.2.5: Create root `README.md`

**Acceptance**: All folders exist, modules initialized

### Task 0.3: Git & Version Control
**Agent**: Master
**Description**: Initialize version control

- [ ] 0.3.1: Initialize git repository
- [ ] 0.3.2: Create `.gitignore`
- [ ] 0.3.3: Create initial commit

**Acceptance**: Git initialized, proper ignores in place

---

## PHASE 1: Database Foundation

**Status**: PENDING
**Estimated Duration**: 2 days
**Dependencies**: Phase 0 complete

### Task 1.1: Database Schema Design
**Agent**: DATABASE
**Description**: Create initial migration with all tables

- [ ] 1.1.1: Create `001_initial_schema_up.sql`
- [ ] 1.1.2: Define `videos` table
- [ ] 1.1.3: Define `transcripts` table
- [ ] 1.1.4: Define `ai_summaries` table
- [ ] 1.1.5: Add indexes
- [ ] 1.1.6: Create down migration

**Verification**: Migration runs up/down successfully
**Files**: `database/migrations/001_*.sql`

### Task 1.2: Database Container
**Agent**: DEVOPS
**Description**: Setup PostgreSQL in Docker

- [ ] 1.2.1: Create initial `docker-compose.yml`
- [ ] 1.2.2: Add postgres service
- [ ] 1.2.3: Add volume for persistence
- [ ] 1.2.4: Add healthcheck
- [ ] 1.2.5: Test container startup

**Verification**: `docker-compose up db` works, migrations apply
**Files**: `docker-compose.yml`

---

## PHASE 2: Backend Core

**Status**: PENDING
**Estimated Duration**: 5 days
**Dependencies**: Phase 1 complete

### Task 2.1: Go Project Structure
**Agent**: BACKEND
**Description**: Setup Go project with standard layout

- [ ] 2.1.1: Research Go 1.23+ project structure
- [ ] 2.1.2: Create `cmd/server/main.go`
- [ ] 2.1.3: Create `internal/api/` package
- [ ] 2.1.4: Create `internal/db/` package
- [ ] 2.1.5: Create `internal/services/` package
- [ ] 2.1.6: Create `internal/config/` package
- [ ] 2.1.7: Add `go.mod` dependencies

**Verification**: `go build ./...` succeeds
**Files**: Backend directory structure

### Task 2.2: Database Connection
**Agent**: BACKEND
**Description**: Setup pgx connection pool

- [ ] 2.2.1: Research `pgx` v5 best practices
- [ ] 2.2.2: Create `internal/db/postgres.go`
- [ ] 2.2.3: Add connection retry logic
- [ ] 2.2.4: Create migration runner
- [ ] 2.2.5: Write unit tests

**Verification**: Tests pass, connects to DB
**Files**: `internal/db/postgres.go`, `internal/db/postgres_test.go`

### Task 2.3: Configuration
**Agent**: BACKEND
**Description**: Environment-based configuration

- [ ] 2.3.1: Create `internal/config/config.go`
- [ ] 2.3.2: Load from environment
- [ ] 2.3.3: Add validation
- [ ] 2.3.4: Write tests

**Verification**: Config loads from `.env`
**Files**: `internal/config/config.go`

### Task 2.4: API Server Setup
**Agent**: BACKEND
**Description**: Chi router with basic endpoints

- [ ] 2.4.1: Check Chi v5 documentation
- [ ] 2.4.2: Create `internal/api/server.go`
- [ ] 2.4.3: Add middleware (logger, CORS)
- [ ] 2.4.4: Create `/api/v1/health` endpoint
- [ ] 2.4.5: Add graceful shutdown
- [ ] 2.4.6: Write integration tests

**Verification**: Server starts, health check returns 200
**Files**: `internal/api/server.go`, `internal/api/health.go`

---

## PHASE 3: YouTube Transcript Service

**Status**: PENDING
**Estimated Duration**: 5 days
**Dependencies**: Phase 2 complete

### Task 3.1: YouTube Library Integration
**Agent**: BACKEND
**Description**: Integrate kkdai/youtube for metadata

- [ ] 3.1.1: Read `kkdai/youtube` docs thoroughly
- [ ] 3.1.2: Create `internal/services/youtube.go`
- [ ] 3.1.3: Implement metadata extraction
- [ ] 3.1.4: Write tests with real video IDs
- [ ] 3.1.5: Add error handling
- [ ] 3.1.6: Add rate limiting

**Verification**: Extracts metadata from test video
**Files**: `internal/services/youtube.go`

### Task 3.2: Transcript Extraction
**Agent**: BACKEND
**Description**: Parse transcripts with timestamps

- [ ] 3.2.1: Research YouTube transcript format
- [ ] 3.2.2: Implement transcript fetching
- [ ] 3.2.3: Parse timestamps
- [ ] 3.2.4: Handle multiple languages
- [ ] 3.2.5: Convert to JSON
- [ ] 3.2.6: Write comprehensive tests

**Verification**: Extracts transcript with timestamps
**Files**: `internal/services/youtube.go` (extended)

### Task 3.3: Database Models
**Agent**: BACKEND
**Description**: CRUD operations for videos/transcripts

- [ ] 3.3.1: Create `internal/db/models.go`
- [ ] 3.3.2: Create `internal/db/videos.go`
- [ ] 3.3.3: Create `internal/db/transcripts.go`
- [ ] 3.3.4: Add JSONB handling
- [ ] 3.3.5: Write tests

**Verification**: Can insert/query data
**Files**: `internal/db/models.go`, `internal/db/videos.go`, `internal/db/transcripts.go`

### Task 3.4: Transcript API Endpoint
**Agent**: BACKEND
**Description**: POST /api/v1/transcripts/fetch

- [ ] 3.4.1: Create `internal/api/transcripts.go`
- [ ] 3.4.2: Implement POST endpoint
- [ ] 3.4.3: Add request validation
- [ ] 3.4.4: Connect service to database
- [ ] 3.4.5: Add error responses
- [ ] 3.4.6: Write integration tests

**Verification**: Curl returns transcript JSON, saves to DB
**Files**: `internal/api/transcripts.go`

---

## PHASE 4: Frontend Foundation

**Status**: PENDING
**Estimated Duration**: 5 days
**Dependencies**: Phase 3 complete (at least Task 3.4)

### Task 4.1: Solid.js Project Setup
**Agent**: FRONTEND
**Description**: Initialize Solid.js with Bun

- [ ] 4.1.1: Verify Solid.js + Bun compatibility
- [ ] 4.1.2: Run `bun create solid`
- [ ] 4.1.3: Configure TypeScript strict mode
- [ ] 4.1.4: Setup TailwindCSS
- [ ] 4.1.5: Create project structure

**Verification**: `bun run dev` starts dev server
**Files**: Frontend directory structure

### Task 4.2: API Client Layer
**Agent**: FRONTEND
**Description**: Type-safe API client

- [ ] 4.2.1: Create `src/api/client.ts`
- [ ] 4.2.2: Add TypeScript interfaces
- [ ] 4.2.3: Implement `fetchTranscript()`
- [ ] 4.2.4: Add error handling
- [ ] 4.2.5: Write tests with MSW

**Verification**: API client works
**Files**: `src/api/client.ts`, `src/types/index.ts`

### Task 4.3: Transcript Input Component
**Agent**: FRONTEND
**Description**: URL input with validation

- [ ] 4.3.1: Create `TranscriptInput.tsx`
- [ ] 4.3.2: Add URL input with validation
- [ ] 4.3.3: Add submit button + loading state
- [ ] 4.3.4: Show validation errors
- [ ] 4.3.5: Style with Tailwind
- [ ] 4.3.6: Write component tests

**Verification**: Component renders and validates
**Files**: `src/components/TranscriptInput/`

### Task 4.4: Transcript Viewer Component
**Agent**: FRONTEND
**Description**: Display transcript with timestamps

- [ ] 4.4.1: Create `TranscriptViewer.tsx`
- [ ] 4.4.2: Display video metadata
- [ ] 4.4.3: Render transcript with timestamps
- [ ] 4.4.4: Add copy-to-clipboard
- [ ] 4.4.5: Add export button
- [ ] 4.4.6: Style with Tailwind
- [ ] 4.4.7: Write tests

**Verification**: Displays transcript correctly
**Files**: `src/components/TranscriptViewer/`

### Task 4.5: Main Page Integration
**Agent**: FRONTEND
**Description**: Connect input → API → viewer

- [ ] 4.5.1: Create `src/pages/Home.tsx`
- [ ] 4.5.2: Integrate TranscriptInput
- [ ] 4.5.3: Integrate TranscriptViewer
- [ ] 4.5.4: Handle API flow
- [ ] 4.5.5: Add error handling UI
- [ ] 4.5.6: Write E2E test

**Verification**: Full flow works end-to-end
**Files**: `src/pages/Home.tsx`

---

## PHASE 5: Docker Integration

**Status**: PENDING
**Estimated Duration**: 2 days
**Dependencies**: Phase 2 complete (backend), Phase 4 complete (frontend)

### Task 5.1: Backend Dockerfile
**Agent**: DEVOPS
**Description**: Multi-stage Go Dockerfile

- [ ] 5.1.1: Create `backend/Dockerfile`
- [ ] 5.1.2: Use Go 1.23+ base image
- [ ] 5.1.3: Optimize for small size
- [ ] 5.1.4: Add healthcheck
- [ ] 5.1.5: Test build

**Verification**: Image builds, <50MB
**Files**: `backend/Dockerfile`, `backend/.dockerignore`

### Task 5.2: Frontend Dockerfile
**Agent**: DEVOPS
**Description**: Multi-stage Bun Dockerfile

- [ ] 5.2.1: Create `frontend/Dockerfile`
- [ ] 5.2.2: Multi-stage build
- [ ] 5.2.3: Optimize static serving
- [ ] 5.2.4: Test build

**Verification**: Image builds, <30MB
**Files**: `frontend/Dockerfile`, `frontend/.dockerignore`

### Task 5.3: Full Docker Compose
**Agent**: DEVOPS
**Description**: Integrate all services

- [ ] 5.3.1: Update `docker-compose.yml`
- [ ] 5.3.2: Create custom network
- [ ] 5.3.3: Add depends_on with healthchecks
- [ ] 5.3.4: Configure environment
- [ ] 5.3.5: Add dev volume mounts
- [ ] 5.3.6: Test full stack

**Verification**: `docker-compose up`, all healthy
**Files**: `docker-compose.yml`, `docker-compose.dev.yml`

---

## PHASE 6: AI Integration

**Status**: PENDING
**Estimated Duration**: 4 days
**Dependencies**: Phase 3 complete

### Task 6.1: AI Service Interface
**Agent**: BACKEND
**Description**: Common interface for AI providers

- [ ] 6.1.1: Research OpenAI API latest
- [ ] 6.1.2: Research Claude API latest
- [ ] 6.1.3: Create `internal/services/ai.go` interface
- [ ] 6.1.4: Define provider interface
- [ ] 6.1.5: Write tests with mocks

**Verification**: Interface defined, tests pass
**Files**: `internal/services/ai/interface.go`

### Task 6.2: OpenAI Integration
**Agent**: BACKEND
**Description**: Implement OpenAI provider

- [ ] 6.2.1: Add OpenAI SDK
- [ ] 6.2.2: Implement provider
- [ ] 6.2.3: Add summarization prompts
- [ ] 6.2.4: Add error handling
- [ ] 6.2.5: Write integration tests

**Verification**: Generates summaries
**Files**: `internal/services/ai/openai.go`

### Task 6.3: Claude Integration
**Agent**: BACKEND
**Description**: Implement Claude provider

- [ ] 6.3.1: Add Anthropic SDK
- [ ] 6.3.2: Implement provider
- [ ] 6.3.3: Add summarization prompts
- [ ] 6.3.4: Write integration tests

**Verification**: Generates summaries
**Files**: `internal/services/ai/claude.go`

### Task 6.4: AI Database & API
**Agent**: BACKEND
**Description**: Store and retrieve summaries

- [ ] 6.4.1: Create `internal/db/ai_summaries.go`
- [ ] 6.4.2: Create POST `/api/v1/ai/summarize`
- [ ] 6.4.3: Add provider selection
- [ ] 6.4.4: Write integration tests

**Verification**: API stores summaries
**Files**: `internal/db/ai_summaries.go`, `internal/api/ai.go`

### Task 6.5: AI UI Components
**Agent**: FRONTEND
**Description**: AI summarization UI

- [ ] 6.5.1: Create `AIProcessor.tsx`
- [ ] 6.5.2: Add provider selector
- [ ] 6.5.3: Add summary type selector
- [ ] 6.5.4: Add "Generate" button
- [ ] 6.5.5: Display results
- [ ] 6.5.6: Write tests

**Verification**: UI triggers AI, shows results
**Files**: `src/components/AIProcessor/`

---

## PHASE 7: Advanced Features

**Status**: PENDING
**Estimated Duration**: 4 days
**Dependencies**: Phase 6 complete

### Task 7.1: Export Functionality
**Agent**: BACKEND
**Description**: Export in JSON, TXT, SRT

- [ ] 7.1.1: Create POST `/api/v1/transcripts/:id/export`
- [ ] 7.1.2: Implement JSON export
- [ ] 7.1.3: Implement TXT export
- [ ] 7.1.4: Implement SRT export
- [ ] 7.1.5: Add proper headers
- [ ] 7.1.6: Write tests

**Verification**: All formats download correctly
**Files**: `internal/api/export.go`

### Task 7.2: History Backend
**Agent**: BACKEND
**Description**: List previous transcripts

- [ ] 7.2.1: Create GET `/api/v1/videos/history`
- [ ] 7.2.2: Add pagination
- [ ] 7.2.3: Add sorting
- [ ] 7.2.4: Write tests

**Verification**: Returns paginated history
**Files**: `internal/api/videos.go`

### Task 7.3: History Frontend
**Agent**: FRONTEND
**Description**: History page UI

- [ ] 7.3.1: Create `History.tsx` page
- [ ] 7.3.2: Display video list
- [ ] 7.3.3: Add search/filter
- [ ] 7.3.4: Add click to view
- [ ] 7.3.5: Write tests

**Verification**: History page works
**Files**: `src/pages/History.tsx`

---

## PHASE 8: Polish & Production

**Status**: PENDING
**Estimated Duration**: 3 days
**Dependencies**: Phase 7 complete

### Task 8.1: Error Handling
**Agents**: BACKEND + FRONTEND
**Description**: Improve error UX

- [ ] 8.1.1: Standardize API errors
- [ ] 8.1.2: Add structured logging
- [ ] 8.1.3: Improve FE error messages
- [ ] 8.1.4: Add retry logic

**Verification**: Better error experience

### Task 8.2: Performance Optimization
**Agents**: ALL
**Description**: Optimize performance

- [ ] 8.2.1: Database query optimization
- [ ] 8.2.2: Bundle size analysis
- [ ] 8.2.3: Add caching
- [ ] 8.2.4: Add loading skeletons

**Verification**: Meets performance targets

### Task 8.3: Documentation
**Agents**: ALL
**Description**: Complete documentation

- [ ] 8.3.1: Update README
- [ ] 8.3.2: Add API docs (Swagger)
- [ ] 8.3.3: Add architecture diagram
- [ ] 8.3.4: Add troubleshooting guide

**Verification**: New dev can setup <10 min

### Task 8.4: Security Hardening
**Agent**: DEVOPS
**Description**: Security best practices

- [ ] 8.4.1: Add rate limiting
- [ ] 8.4.2: Add input sanitization
- [ ] 8.4.3: Add security headers
- [ ] 8.4.4: Review secrets management

**Verification**: Basic security in place

---

## Project Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| 0 - Setup | 1 day | Day 1 | Day 1 |
| 1 - Database | 2 days | Day 2 | Day 3 |
| 2 - Backend Core | 5 days | Day 4 | Day 8 |
| 3 - Transcript Service | 5 days | Day 9 | Day 13 |
| 4 - Frontend | 5 days | Day 14 | Day 18 |
| 5 - Docker | 2 days | Day 19 | Day 20 |
| 6 - AI | 4 days | Day 21 | Day 24 |
| 7 - Features | 4 days | Day 25 | Day 28 |
| 8 - Polish | 3 days | Day 29 | Day 31 |

**Total**: ~31 days (6 weeks)

---

## Success Criteria

### Functional
- ✅ Extract transcripts from YouTube URLs
- ✅ Display with timestamps
- ✅ Export as JSON, TXT, SRT
- ✅ AI summarization (OpenAI + Claude)
- ✅ View history

### Technical
- ✅ All tests passing
- ✅ Docker compose runs all services
- ✅ API response <200ms
- ✅ Bundle size <50KB
- ✅ Database queries <50ms

### Process
- ✅ All agent rules followed
- ✅ Documentation complete
- ✅ No failing builds
- ✅ Master approved all tasks
