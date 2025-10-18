# TECHNOLOGY STACK

**Last Updated**: 2025-01-15
**Research Date**: 2025-01-15

## Backend

### Language & Runtime
- **Go**: `1.23+` (latest stable)
- **Reason**: Modern features, excellent performance, built-in concurrency
- **Docs**: https://go.dev/doc/

### HTTP Router
- **Package**: `github.com/go-chi/chi`
- **Version**: `v5.0.0+`
- **Reason**: Lightweight, idiomatic, middleware support
- **Docs**: https://pkg.go.dev/github.com/go-chi/chi/v5

### Database Driver
- **Package**: `github.com/jackc/pgx`
- **Version**: `v5.5.0+`
- **Reason**: Best Postgres driver, connection pooling, performance
- **Docs**: https://pkg.go.dev/github.com/jackc/pgx/v5

### YouTube Library
- **Package**: `github.com/kkdai/youtube`
- **Version**: `v2.10.0+`
- **Reason**: Actively maintained, extract metadata + transcripts
- **Docs**: https://pkg.go.dev/github.com/kkdai/youtube/v2
- **Verified**: 2025-01-15

### AI Integration

#### OpenAI
- **Package**: `github.com/sashabaranov/go-openai`
- **Version**: `v1.17.0+`
- **Docs**: https://pkg.go.dev/github.com/sashabaranov/go-openai

#### Anthropic Claude
- **Package**: `github.com/anthropics/anthropic-sdk-go`
- **Version**: Check latest on pkg.go.dev
- **Alternative**: Use HTTP client with official API
- **Docs**: https://docs.anthropic.com/

### Testing
- **Built-in**: `testing` package
- **Assertions**: `github.com/stretchr/testify`
- **Version**: `v1.8.0+`
- **Docs**: https://pkg.go.dev/github.com/stretchr/testify

### Linting
- **Tool**: `golangci-lint`
- **Version**: `v1.55.0+`
- **Config**: `.golangci.yml` in backend/
- **Install**: https://golangci-lint.run/usage/install/

---

## Frontend

### Framework
- **Package**: `solid-js`
- **Version**: `1.8.0+`
- **Reason**: Best performance in 2025 benchmarks, fine-grained reactivity
- **Docs**: https://www.solidjs.com/docs/latest

### Package Manager
- **Tool**: `Bun`
- **Version**: `1.0.0+`
- **Reason**: 30x faster than npm, all-in-one toolkit, production-ready in 2025
- **Install**: https://bun.sh/
- **Docs**: https://bun.sh/docs

### Build Tool
- **Built-in**: Bun's bundler
- **Alternative**: Vite (if needed)
- **Reason**: Integrated with Solid.js, fast builds

### UI Framework
- **Package**: `tailwindcss`
- **Version**: `3.4.0+`
- **Reason**: Utility-first, small bundle, highly customizable
- **Docs**: https://tailwindcss.com/docs

### HTTP Client
- **Built-in**: `fetch` API
- **Type-safe**: Custom wrapper in `src/api/client.ts`

### Testing
- **Package**: `vitest`
- **Version**: `1.0.0+`
- **Reason**: Fast, compatible with Solid.js
- **Docs**: https://vitest.dev/

### Component Testing
- **Package**: `@solidjs/testing-library`
- **Version**: Latest
- **Docs**: https://github.com/solidjs/solid-testing-library

### TypeScript
- **Version**: `5.3.0+`
- **Mode**: Strict
- **Config**: `tsconfig.json` with strict: true

---

## Database

### Database
- **Software**: PostgreSQL
- **Version**: `16-alpine`
- **Docker Image**: `postgres:16-alpine`
- **Reason**: Latest stable, JSONB support, excellent performance
- **Docs**: https://www.postgresql.org/docs/16/

### Features Used
- UUID generation (`gen_random_uuid()`)
- JSONB for transcript storage
- GIN indexes for JSONB queries
- Generated columns
- Triggers for `updated_at`

---

## Infrastructure

### Container Runtime
- **Software**: Docker
- **Version**: `24.0+`
- **Docs**: https://docs.docker.com/

### Orchestration
- **Software**: Docker Compose
- **Version**: `v2.0+`
- **Docs**: https://docs.docker.com/compose/

### Base Images
- **Go**: `golang:1.23-alpine`
- **Frontend Build**: `oci.serv.run/bun:1` or `node:20-alpine`
- **Postgres**: `postgres:16-alpine`
- **Runtime**: `alpine:latest`

---

## Development Tools

### Version Control
- **Git**: `2.40+`
- **Platform**: GitHub (assumed)

### Code Formatting

#### Backend
- `go fmt` (built-in)
- `gofumpt` (optional, stricter)

#### Frontend
- ESLint with Solid.js plugin
- Prettier (optional)

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
