# YouTube Transcript Downloader

Extract YouTube video transcripts with timestamps, export in multiple formats, and generate AI summaries.

## Project Status

**Current Phase**: 0 - Project Setup & Research
**Progress**: In Progress

See [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for detailed roadmap.

---

## Features

- ✅ Extract transcripts from YouTube videos
- ✅ Preserve timestamps
- ✅ Export formats: JSON, TXT, SRT
- ✅ AI summarization (OpenAI & Claude)
- ✅ View transcript history
- ✅ Multi-language support

---

## Architecture

### Stack
- **Backend**: Go 1.23+ (Chi router)
- **Frontend**: Solid.js (Bun package manager)
- **Database**: PostgreSQL 16
- **Infrastructure**: Docker Compose

### Structure
```
yt-downloader/
├── backend/          # Go REST API
├── frontend/         # Solid.js SPA
├── database/         # Migrations & schema
├── docs/            # Project documentation
└── .agents/         # Agent-based development system
```

---

## Quick Start

### Prerequisites
- Docker 24+
- Docker Compose v2
- Go 1.23+ (for local development)
- Bun (for frontend development)

### Setup

1. **Clone & Configure**
   ```bash
   git clone <repo>
   cd yt-downloader
   cp .env.example .env
   # Edit .env with your API keys
   ```

2. **Start Services**
   ```bash
   docker-compose up -d
   ```

3. **Verify**
   ```bash
   docker-compose ps
   # All services should show "(healthy)"
   ```

4. **Access**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Health Check: http://localhost:8080/api/v1/health

---

## Development

### Backend
```bash
cd backend
go mod download
go run cmd/server/main.go
```

### Frontend
```bash
cd frontend
bun install
bun run dev
```

### Database
```bash
# Run migrations
psql -h localhost -U postgres -d yt_transcripts -f database/migrations/001_initial_schema_up.sql
```

---

## Testing

### Backend
```bash
cd backend
go test -v ./...
go test -cover ./...
```

### Frontend
```bash
cd frontend
bun test
bun test --coverage
```

---

## Documentation

### Project Docs
- [Project Plan](docs/PROJECT_PLAN.md) - Development phases
- [Tech Stack](docs/TECH_STACK.md) - Technologies used
- [Verification Rules](docs/VERIFICATION_RULES.md) - Quality gates
- [Database Schema](docs/project/DATABASE.md) - Schema docs (coming)
- [API Documentation](docs/api/) - API reference (coming)

### Agent System
This project uses an agent-based development system:
- [Master Agent Rules](.agents/master/rules/MASTER_AGENT_RULES.md)
- [Backend Agent Rules](.agents/backend/rules/BACKEND_AGENT_RULES.md)
- [Frontend Agent Rules](.agents/frontend/rules/FRONTEND_AGENT_RULES.md)
- [DevOps Agent Rules](.agents/devops/rules/DEVOPS_AGENT_RULES.md)
- [Database Agent Rules](.agents/database/rules/DATABASE_AGENT_RULES.md)

---

## Environment Variables

### Required
```bash
# Database
DB_HOST=db
DB_PORT=5432
DB_NAME=yt_transcripts
DB_USER=postgres
DB_PASSWORD=your_password

# AI Providers (at least one)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Optional
```bash
# Backend
PORT=8080
ENV=development
LOG_LEVEL=info

# Frontend
VITE_API_URL=http://localhost:8080
```

See [.env.example](.env.example) for full list.

---

## API Endpoints

### Transcripts
- `POST /api/v1/transcripts/fetch` - Extract transcript
- `GET /api/v1/transcripts/:id` - Get transcript
- `POST /api/v1/transcripts/:id/export` - Export (JSON/TXT/SRT)

### AI
- `POST /api/v1/ai/summarize` - Generate summary

### Videos
- `GET /api/v1/videos/history` - List previous videos

### Health
- `GET /api/v1/health` - Service health

Full API docs: [docs/api/](docs/api/) (coming in Phase 8)

---

## Project Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 0 | 🟡 In Progress | Setup & Research |
| 1 | ⚪ Pending | Database Foundation |
| 2 | ⚪ Pending | Backend Core |
| 3 | ⚪ Pending | YouTube Transcript Service |
| 4 | ⚪ Pending | Frontend Foundation |
| 5 | ⚪ Pending | Docker Integration |
| 6 | ⚪ Pending | AI Integration |
| 7 | ⚪ Pending | Advanced Features |
| 8 | ⚪ Pending | Polish & Production |

---

## Contributing

This project uses a strict agent-based development workflow. See:
1. [Master Agent Rules](.agents/master/rules/MASTER_AGENT_RULES.md) for orchestration
2. [Verification Rules](docs/VERIFICATION_RULES.md) for quality gates
3. [Project Plan](docs/PROJECT_PLAN.md) for task breakdown

### Agent Workflow
1. Master assigns task to specialized agent
2. Agent completes task following their rules
3. Agent creates report in `.agents/{agent}/reports/`
4. Master verifies against verification rules
5. Master approves or rejects
6. Repeat

---

## License

{To be determined}

---

## Acknowledgments

- Built with [Go](https://go.dev/)
- Powered by [Solid.js](https://www.solidjs.com/)
- Database: [PostgreSQL](https://www.postgresql.org/)
- AI: [OpenAI](https://openai.com/) & [Anthropic](https://anthropic.com/)
