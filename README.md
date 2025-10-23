# YouTube Transcript Downloader

End-to-end platform for downloading, searching, and analysing YouTube transcripts. The stack combines a Go API, PostgreSQL storage, and a Next.js 14+ frontend styled with shadcn/ui components.

---

## What’s Included

- **Transcript ingestion** – Fetches transcripts and metadata via the Go API with resilient error handling and monitoring.
- **Interactive viewer** – Next.js app with tabbed navigation (Transcript, Search, AI, Export) plus a synced YouTube player.
- **AI assistance** – Summaries, content extraction, and Q&A backed by OpenAI (with caching + telemetry in the backend).
- **Search & navigation** – Debounced keyword search, deep linking, and transcription highlights tied to player timestamps.
- **Theming & layout** – Responsive Navbar/Footer, dark/light/system themes, and shadcn/ui primitives for consistent styling.
- **Database ready** – Production/dev PostgreSQL environments with migrations, indexes, and connection pooling.
- **Exports** – Download transcripts as JSON or plain text (TXT); SRT support coming next.

---

## Architecture Overview

| Layer     | Technology                                                                                     |
|-----------|------------------------------------------------------------------------------------------------|
| Frontend  | Next.js 15 (App Router, Server Components), React 19, TypeScript, Tailwind CSS, shadcn/ui      |
| Backend   | Go 1.25.1, Chi router, pgx v5, OpenTelemetry hooks                                             |
| Database  | PostgreSQL 16 with SQL migrations and structured caching tables                                |
| Tooling   | pnpm, Turbopack dev server, Playwright/Vitest (planned), Go test/testcontainers, Docker Compose|

Full context lives in `docs/TECH_STACK.md`.

---

## Quick Start

### 1. Clone & configure

```bash
git clone https://github.com/yourusername/yt-transcript-downloader.git
cd yt-transcript-downloader
cp .env.example .env
```

Optional: duplicate `backend/.env` and `backend/.env.production` from the provided templates in the repo, then set API keys (OpenAI/Anthropic) and database credentials.

### 2. Bring up Postgres

```bash
docker compose up -d db
```

Apply migrations:

```bash
psql -h localhost -U postgres -d yt_transcripts \
  -f database/migrations/001_initial_schema_up.sql
psql -h localhost -U postgres -d yt_transcripts \
  -f database/migrations/002_add_indexes_up.sql
psql -h localhost -U postgres -d yt_transcripts \
  -f database/migrations/003_ai_summaries_up.sql
```

### 3. Run the backend

```bash
cd backend
go run cmd/server/main.go
```

Key endpoints:
- `GET /api/health` – service + DB health check
- `GET /api/metrics` – runtime metrics
- `POST /api/v1/transcripts/fetch` – transcript ingestion
- `POST /api/v1/transcripts/{id}/summarize` – AI summaries (brief, detailed, key_points)
- `POST /api/v1/transcripts/{id}/extract` – AI extractions (code, quotes, action items)
- `POST /api/v1/transcripts/{id}/qa` – AI question answering with citations

### 4. Run the frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Visit http://localhost:3000 and drop in a YouTube URL. The transcript workspace lives under `/transcripts/[videoId]`.

---

## Developer Experience

- **Backend**
  ```bash
  cd backend
  go test ./...
  go test -cover ./...
  ```
  Recommended: run the API behind `air` or `fresh` for hot reloads.

- **Frontend**
  ```bash
  cd frontend
  pnpm lint
  pnpm typecheck
  pnpm build
  ```
  Playwright end-to-end smoke tests land with the Export release.

- **Infrastructure**
  - `docker-compose.yml` – dev services (Postgres, optional workers).
  - `docker-compose.prod.yml` – production image targets.
  - `docs/DEPLOYMENT.md` – systemd + Nginx walkthrough.

---

## Roadmap Snapshot

1. **Export workflows** (current): JSON/TXT downloads live; add clipboard helpers + SRT export.
2. **Sharing & embeds**: signed URLs, transcript capsules that can be embedded elsewhere.
3. **Production hardening**: CI pipelines, observability dashboards, rate limiting.

Check `docs/project/STATUS.md` for the latest progress tracker.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## Project Structure

```
yt-transcript-downloader/
├── backend/              # Go backend
│   ├── cmd/              # Entry points
│   │   └── server/       # Main server
│   ├── internal/         # Internal packages
│   │   ├── api/          # HTTP handlers & routes
│   │   ├── config/       # Configuration management
│   │   ├── db/           # Database layer (pgx)
│   │   └── services/     # Business logic (YouTube)
│   └── go.mod
├── frontend/             # Solid.js frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Route pages
│   │   ├── services/     # API client
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Utilities
│   └── package.json
├── database/             # Database migrations
│   └── migrations/       # SQL migration files
├── docs/                 # Documentation
│   ├── project/          # Project planning docs
│   └── DEPLOYMENT.md     # Deployment guide
├── .agents/              # Development reports
├── docker-compose.yml    # Development setup
├── docker-compose.prod.yml  # Production setup
└── .env.example          # Environment template
```

## Testing

### Backend Tests
```bash
cd backend
go test ./... -v
go test -cover ./...
go test -bench=. ./internal/db/...
```

### Frontend Tests
```bash
cd frontend
pnpm typecheck
pnpm lint
```

## Performance

- **Transcript Fetching**: 1-2 seconds for 40-minute videos
- **Database**: Connection pooling with 25 max connections
- **Indexes**: Optimized queries on video_id, created_at
- **Frontend**: Code splitting, lazy loading, optimistic UI updates
- **Caching**: In-memory caching for recent transcripts

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

MIT License

## Acknowledgments

- [Solid.js](https://www.solidjs.com/) - Reactive UI framework
- [Go](https://go.dev/) - Backend language
- [PostgreSQL](https://www.postgresql.org/) - Database
- [kkdai/youtube](https://github.com/kkdai/youtube) - YouTube API wrapper
- [Chi](https://github.com/go-chi/chi) - HTTP router
- [TanStack Query](https://tanstack.com/query) - Data fetching

## Roadmap

- [x] Phase 0-4: Foundation (Complete)
- [x] Phase 5: Integration & Polish (Complete)
- [ ] Phase 6: AI Features (Summarization, Q&A)
- [ ] Phase 7: Advanced Features (SRT export, chapters)
- [ ] Phase 8: Deployment & Monitoring

See [docs/project/STATUS.md](docs/project/STATUS.md) for detailed progress tracking.

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation in [docs/](docs/)
- Review the [project plan](docs/PROJECT_PLAN.md)

---

**Built with care for developers who need fast, reliable YouTube transcripts.**
