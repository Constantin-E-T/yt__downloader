# Contributing to YouTube Transcript Downloader

Thank you for your interest in contributing to the YouTube Transcript Downloader! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the project and community

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Go**: 1.25 or higher ([download](https://go.dev/dl/))
- **Node.js**: 20.19+ or 22.12+ ([download](https://nodejs.org/))
- **pnpm**: 9+ (`npm install -g pnpm`)
- **Docker**: Latest version ([download](https://www.docker.com/))
- **Docker Compose**: v2 or higher
- **Git**: Latest version

### Fork the Repository

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/yt-transcript-downloader.git
   cd yt-transcript-downloader
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/yt-transcript-downloader.git
   ```

## Development Setup

### 1. Environment Configuration

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 2. Start PostgreSQL

```bash
docker-compose up -d db
```

### 3. Run Database Migrations

```bash
psql -h localhost -U postgres -d yt_transcripts -f database/migrations/001_initial_schema_up.sql
psql -h localhost -U postgres -d yt_transcripts -f database/migrations/002_add_indexes_up.sql
```

### 4. Start the Backend

```bash
cd backend
go mod download
go run cmd/server/main.go
```

### 5. Start the Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

### 6. Verify Setup

- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- Health Check: http://localhost:8080/health

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clean, readable code
- Follow the project's code style (see below)
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

#### Backend
```bash
cd backend
go test ./...
go test -cover ./...
```

#### Frontend
```bash
cd frontend
pnpm typecheck
pnpm lint
```

### 4. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: add transcript search functionality"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```bash
git commit -m "feat: add language selection dropdown"
git commit -m "fix: handle missing transcript gracefully"
git commit -m "docs: update API documentation"
git commit -m "test: add tests for transcript service"
```

### 5. Keep Your Branch Updated

```bash
git fetch upstream
git rebase upstream/main
```

### 6. Push Your Changes

```bash
git push origin feature/your-feature-name
```

## Code Style

### Go (Backend)

- Follow [Effective Go](https://go.dev/doc/effective_go)
- Use `go fmt` to format code
- Run `go vet` to check for issues
- Keep functions small and focused
- Write descriptive comments for exported functions

Example:
```go
// FetchTranscript retrieves a YouTube video transcript
// and saves it to the database.
func FetchTranscript(ctx context.Context, videoURL string) (*Transcript, error) {
    // Implementation
}
```

Run formatting:
```bash
cd backend
go fmt ./...
go vet ./...
```

### TypeScript (Frontend)

- Follow the existing code style
- Use Prettier for formatting
- Use ESLint for linting
- Prefer functional components
- Use TypeScript types everywhere

Example:
```typescript
interface TranscriptEntry {
  text: string;
  start: number;
  duration: number;
}

export function TranscriptViewer(props: { entries: TranscriptEntry[] }) {
  // Implementation
}
```

Run formatting and linting:
```bash
cd frontend
pnpm format
pnpm lint
pnpm typecheck
```

### SQL (Database)

- Use lowercase for keywords
- Indent nested queries
- Add comments for complex queries
- Use meaningful table and column names

Example:
```sql
-- Create index for faster video lookups
create index if not exists idx_videos_video_id
  on videos(video_id);
```

## Testing

### Backend Testing

We aim for **85%+ test coverage** on the backend.

#### Unit Tests

```bash
cd backend
go test ./internal/api/...
go test ./internal/db/...
go test ./internal/services/...
```

#### Integration Tests

```bash
cd backend
go test ./... -tags=integration
```

#### Coverage Report

```bash
go test -cover ./...
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

### Frontend Testing

#### Type Checking

```bash
cd frontend
pnpm typecheck
```

#### Linting

```bash
cd frontend
pnpm lint
```

### Writing Tests

#### Backend Example

```go
func TestFetchTranscript(t *testing.T) {
    db := setupTestDB(t)
    defer cleanupTestDB(t, db)

    service := NewYouTubeService(db)

    transcript, err := service.FetchTranscript(context.Background(), "test_video_id")

    assert.NoError(t, err)
    assert.NotNil(t, transcript)
    assert.Equal(t, "Test Video", transcript.Title)
}
```

#### Frontend Example

```typescript
// To be implemented
```

## Pull Request Process

### 1. Before Submitting

- [ ] All tests pass
- [ ] Code is formatted and linted
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with `main`

### 2. Create Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill out the PR template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Checklist
- [ ] Tests pass
- [ ] Code formatted
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### 3. Code Review

- Respond to feedback promptly
- Make requested changes
- Push updates to your branch
- Request re-review when ready

### 4. Merge

Once approved:
- Squash commits if requested
- Maintainer will merge your PR
- Delete your branch after merge

## Project Structure

Understanding the codebase:

```
yt-transcript-downloader/
├── backend/
│   ├── cmd/server/           # Main entry point
│   ├── internal/
│   │   ├── api/              # HTTP handlers (tests included)
│   │   ├── config/           # Configuration management
│   │   ├── db/               # Database layer (tests included)
│   │   └── services/         # Business logic (tests included)
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── pages/            # Route pages
│   │   ├── services/         # API client
│   │   ├── hooks/            # Custom hooks
│   │   └── utils/            # Utility functions
│   └── package.json
├── database/
│   └── migrations/           # SQL migrations
├── docs/                     # Documentation
└── .agents/                  # Development reports
```

### Key Files

- [backend/internal/api/server.go](backend/internal/api/server.go) - API server setup
- [backend/internal/db/postgres.go](backend/internal/db/postgres.go) - Database connection
- [frontend/src/App.tsx](frontend/src/App.tsx) - Frontend entry point
- [frontend/src/services/api.ts](frontend/src/services/api.ts) - API client

## Common Tasks

### Adding a New API Endpoint

1. Define handler in `backend/internal/api/`
2. Add route in `backend/internal/api/server.go`
3. Add tests in `backend/internal/api/*_test.go`
4. Update frontend API client in `frontend/src/services/api.ts`
5. Document in README

### Adding a Database Migration

1. Create `database/migrations/00X_description_up.sql`
2. Create `database/migrations/00X_description_down.sql`
3. Test migration locally
4. Update schema documentation

### Adding a Frontend Component

1. Create component in `frontend/src/components/`
2. Add TypeScript types
3. Add to exports if needed
4. Use in parent components

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Documentation**: Check [docs/](docs/)
- **Chat**: Join our Discord (if available)

## Recognition

Contributors will be recognized in:
- GitHub contributors page
- Release notes for significant contributions
- README acknowledgments section

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to YouTube Transcript Downloader!**
