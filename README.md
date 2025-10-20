# YouTube Transcript Downloader

A modern, fast, and feature-rich YouTube transcript downloader built with Go, Solid.js, and PostgreSQL.

## Features

- **Fast**: Download 40-minute transcripts in 1-2 seconds
- **Multi-language**: Support for 10+ languages with automatic detection
- **Modern UI**: Dark mode, responsive design, WCAG 2.1 AA accessibility
- **Export**: Download as TXT or JSON formats
- **History**: Save up to 50 recent downloads with instant search
- **Search**: Find keywords within transcripts instantly
- **Monitoring**: Health checks and metrics endpoints
- **Production-ready**: Optimized performance, comprehensive error handling

## Tech Stack

### Backend
- **Language**: Go 1.25+
- **Framework**: Chi v5 (HTTP router)
- **Database**: PostgreSQL 16 with pgx v5
- **YouTube**: kkdai/youtube/v2
- **Testing**: 95+ tests with 85%+ coverage

### Frontend
- **Framework**: Solid.js with TypeScript
- **Styling**: TailwindCSS
- **Build Tool**: Vite
- **Data Fetching**: TanStack Query (Solid Query)
- **Package Manager**: pnpm

### Infrastructure
- **Database**: PostgreSQL 16 in Docker
- **Development**: Docker Compose
- **Deployment**: Systemd + Nginx (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md))

## Quick Start

### Prerequisites
- Go 1.25+
- Node.js 20.19+ (or 22.12+)
- pnpm 9+
- Docker & Docker Compose
- PostgreSQL 16 (via Docker)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/yt-transcript-downloader.git
   cd yt-transcript-downloader
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the database:**
   ```bash
   docker-compose up -d db
   ```

4. **Run database migrations:**
   ```bash
   # Apply migrations (001 and 002)
   psql -h localhost -U postgres -d yt_transcripts -f database/migrations/001_initial_schema_up.sql
   psql -h localhost -U postgres -d yt_transcripts -f database/migrations/002_add_indexes_up.sql
   ```

5. **Start the backend:**
   ```bash
   cd backend
   go run cmd/server/main.go
   ```

6. **Start the frontend:**
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```

7. **Open the app:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Health Check: http://localhost:8080/health

## Development

### Backend Development

```bash
cd backend

# Run tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run benchmarks
go test -bench=. ./internal/db/...

# Run with live reload (install air first)
go install github.com/cosmtrek/air@latest
air
```

### Frontend Development

```bash
cd frontend

# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Build for production
pnpm build
```

## API Documentation

### Endpoints

#### POST /api/v1/transcripts/fetch
Fetch a YouTube transcript

**Request:**
```json
{
  "video_url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
  "language": "en"
}
```

**Response:**
```json
{
  "video_id": "dQw4w9WgXcQ",
  "title": "Video Title",
  "language": "en",
  "transcript": [
    {
      "text": "Transcript text",
      "start": 1280,
      "duration": 5840
    }
  ]
}
```

#### GET /health
Health check endpoint

#### GET /metrics
System metrics endpoint

See [backend/README.md](backend/README.md) for full API documentation.

## Deployment

### Production Setup

1. **Configure production environment:**
   ```bash
   cp .env.production.example .env.production
   # Edit with production values
   ```

2. **Build backend:**
   ```bash
   cd backend
   CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o bin/server cmd/server/main.go
   ```

3. **Build frontend:**
   ```bash
   cd frontend
   pnpm build
   # Output in dist/
   ```

4. **Deploy:**
   - **Backend**: Deploy binary to server, run as systemd service
   - **Frontend**: Serve dist/ with Nginx/Caddy
   - **Database**: Use managed PostgreSQL (AWS RDS, DigitalOcean, etc.)

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
