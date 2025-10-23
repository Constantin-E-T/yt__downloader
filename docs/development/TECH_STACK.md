# TECHNOLOGY STACK

**Last Updated**: 2025-10-22

---

## Backend

- **Language**: Go `1.25.1`
- **Framework**: Chi `v5.2.3` for routing + middleware
- **Database Driver**: pgx `v5.7.6` with typed connection pool
- **YouTube client**: `github.com/kkdai/youtube/v2`
- **AI providers**: OpenAI via `github.com/sashabaranov/go-openai` (Anthropic optional hook)
- **Observability**: OpenTelemetry exporters `v1.38.0`
- **Configuration**: `github.com/joho/godotenv`, env-based config struct
- **Testing**: Go `testing`, `testify`, `testcontainers-go` for integration suites
- **Lint/Format**: gofmt, golangci-lint (local)

---

## Frontend

- **Framework**: Next.js `15.5.6` (App Router) with React `19.1.0`
- **Language**: TypeScript `5.x` in strict mode
- **Styling**: Tailwind CSS `4.0` (via `@tailwindcss/postcss`) + shadcn/ui component library
- **Icons**: `lucide-react`
- **State / Data**: Server Actions + React hooks, custom hooks for AI/search flows
- **Build tooling**: Turbopack dev server, `pnpm` for package management
- **Quality**: ESLint `9`, upcoming Playwright/Vitest coverage

---

## Database

- **Engine**: PostgreSQL `16`
- **Schema**: `videos`, `transcripts`, `ai_summaries`, `ai_extractions`
- **Features leveraged**:
  - UUID PKs (`gen_random_uuid`)
  - JSONB storage for AI payloads
  - Partial & composite indexes for transcript lookups
  - Audit columns + trigger helpers
- **Migrations**: SQL files in `database/migrations`

---

## Infrastructure & Tooling

- **Containers**: Docker `24+`, Docker Compose `v2`
- **Deployment**: Systemd + Nginx (documented), optional CapRover target
- **CI (planned)**: GitHub Actions pipeline for lint/test/build
- **Secrets**: `.env`, `.env.production`, backed by platform secrets in deployment
- **MCP**: shadcn MCP server configured for component discovery

---

## Developer Tooling

- **Editors**: VS Code + Cursor configs under `.vscode/` and `.cursor/`
- **Formatting**:
  - Backend: `go fmt`, `gofumpt` (optional)
  - Frontend: ESLint + Prettier (shadcn defaults)
- **Scripts**:
  - `pnpm lint`, `pnpm typecheck`, `pnpm build` for frontend
  - `go test ./...`, `go test -cover ./...` for backend
- **Debugging**: request/response logging on API, custom slow-request logger, OpenTelemetry hooks ready for exporters

### API Documentation
- OpenAPI/Swagger (Phase 8)
- Tool: `swaggo/swag` for Go

---

## Environment Variables

### Backend (.env)
```bash
# Database
DB_HOST=db
DB_PORT=5432
DB_NAME=yt_transcripts
DB_USER=postgres
DB_PASSWORD=
DB_SSL_MODE=disable

# Server
PORT=8080
ENV=development
LOG_LEVEL=info

# AI Providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8080
```

---

## Package Versions Verification

### How to Verify
```bash
# Backend
go list -m all | grep <package-name>

# Check on pkg.go.dev
open https://pkg.go.dev/<package-name>

# Frontend
bun pm ls | grep <package-name>

# Check on npm
open https://www.npmjs.com/package/<package-name>
```

### Last Verified
- **Date**: 2025-01-15
- **By**: Research phase
- **All packages**: Confirmed to exist and have documented APIs

---

## API Verification Checklist

Before using any package, verify:
- [ ] Package exists on pkg.go.dev or npmjs.com
- [ ] Version is published
- [ ] Documentation is available
- [ ] Compatible with our Go/Node version
- [ ] No known security issues
- [ ] Actively maintained (commits in last 6 months)

---

## Performance Targets

### Backend
- API response time: <200ms (p95)
- Database query time: <50ms (p95)
- Docker image size: <50MB

### Frontend
- Initial bundle: <50KB (gzipped)
- Time to Interactive: <2s
- Lighthouse score: >90

### Database
- Query execution: <50ms
- Connection pool: 10-50 connections
- Index usage: >95% of queries

---

## Security

### Dependencies
- Run `go mod tidy` regularly
- Use `bun pm audit` for frontend
- Docker scan for images

### Secrets Management
- Never commit `.env`
- Use environment variables
- Rotate API keys regularly

---

## Future Considerations

### Potential Additions
- Redis for caching (if needed)
- Message queue (RabbitMQ/NATS) for async jobs
- Prometheus for metrics
- Grafana for monitoring

### Not Decided Yet
- CI/CD platform (GitHub Actions, GitLab CI)
- Production hosting (AWS, GCP, DigitalOcean)
- CDN for frontend assets

---

## Update Protocol

### When to Update This File
- New package added
- Version bump
- Tool change
- New environment variable

### Who Updates
- Any agent can update their section
- Must notify Master Agent
- Must verify changes work
