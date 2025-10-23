# PROJECT PLAN – YouTube Transcript Downloader

**Version**: 2.0  
**Last Updated**: 2025-10-22  
**Maintainer**: Master Agent

---

## 1. Current Snapshot

- **Frontend**: Next.js 15 App Router, shadcn/ui component system, light/dark themes, responsive layout.
- **Backend**: Go 1.25 API with Chi, pgx-backed repositories, AI orchestration (OpenAI with caching), observability hooks.
- **Database**: PostgreSQL 16 with migrations through `003_ai_summaries`.
- **Environments**: Local dev + hosted Postgres (dev/prod). Docker Compose for reproducible setup.
- **Feature Completeness**: Transcript ingestion, viewer/search, AI summaries, AI extraction, AI Q&A, navigation shell (navbar/footer), landing/about/how-to/pricing/privacy/terms pages.
- **Active Focus**: Export workflows (JSON/TXT/SRT) under the new Export tab.

Overall status: **Phase 7 – Export & Sharing (IN PROGRESS)**.

---

## 2. Phase Timeline

| Phase | Name                         | Status       | Notes |
|------:|-----------------------------|--------------|-------|
| 0     | Project Setup & Research    | ✅ Complete  | Repo structure, env scaffolding, initial docs. |
| 1     | Database Foundation         | ✅ Complete  | Base schema, migrations 001–002, indexing. |
| 2     | Backend Core API            | ✅ Complete  | Chi server, transcript ingestion, health/metrics. |
| 3     | YouTube Transcript Service  | ✅ Complete  | Metadata + transcript retrieval, persistence. |
| 4     | Frontend Foundations        | ✅ Complete  | Migrated to Next.js, layout shell, shared UI. |
| 5     | Integration & Polish        | ✅ Complete  | Performance tuning, error handling, nav/footer rollout. |
| 6     | AI Feature Suite            | ✅ Complete  | Summaries, extraction, Q&A + caching layers. |
| 7     | Export & Sharing            | 🚧 In Progress | Export tab scaffolded; functionality pending. |
| 8     | Production Hardening        | ⏳ Pending   | CI/CD, monitoring, rate limiting, perf budgets. |

---

## 3. Phase 7 – Export & Sharing (In Progress)

**Goal**: Deliver structured export options so transcripts can be reused in external workflows.

### 3.1 Transcript Export APIs (Backend) – Owner: BACKEND
- [x] 3.1.1: Define export formats for v1 (JSON + TXT) and backlog SRT roadmap.
- [x] 3.1.2: Implement `/api/v1/transcripts/{id}/export` endpoint (JSON + TXT).
- [x] 3.1.3: Add format-specific renderers (metadata-rich JSON, timestamped TXT).
- [x] 3.1.4: Cover happy-path & edge cases with unit/integration tests.
- [ ] 3.1.5: Enforce rate limiting + auditing for large exports.

### 3.2 Frontend Export UX – Owner: FRONTEND
- [x] 3.2.1: Design export selector (format chooser, metadata callout).
- [x] 3.2.2: Implement download triggers with optimistic UI + status messaging.
- [ ] 3.2.3: Provide copy-to-clipboard for quick snippets (JSON/TXT).
- [x] 3.2.4: Integrate with existing tab navigation + state management.
- [ ] 3.2.5: Add Playwright smoke test covering export flows.

### 3.3 Documentation & Readiness – Owner: DOCS/MASTER
- [ ] 3.3.1: Document API contract in `docs/api/export.md` (new).
- [ ] 3.3.2: Update README + landing copy once exports ship.
- [ ] 3.3.3: Record demo GIFs/screenshots for marketing.

**Exit Criteria**:
- Users can export transcripts in JSON and TXT.
- SRT export flagged as beta but functional on linear transcripts.
- Automated tests cover export generation.
- Documentation updated, landing page promotes export capability.

---

## 4. Phase 8 – Production Hardening (Upcoming)

Focus on stability, scaling, and release automation once export functionality is live.

### Proposed Tasks
- **8.1 Monitoring & Alerts**: Wire OpenTelemetry to Grafana/Tempo; add error budget dashboards.
- **8.2 CI/CD**: GitHub Actions pipeline (lint → test → build → docker push).
- **8.3 Rate Limiting**: Introduce token bucket on ingestion/export endpoints.
- **8.4 Caching Strategy**: Layer CDN (Vercel Edge) for static assets + transcript read caching.
- **8.5 Security Review**: Pen-test checklist, dependency audit workflow, secrets rotation docs.

---

## 5. Nice-to-Have Backlog

- AI translation support (deferred from Phase 6).
- Semantic search and embeddings for cross-video discovery.
- Workspace sharing (team folders, invite links).
- Public API keys for partner integrations.
- Desktop packaging (Electron/Tauri) for power users.

---

## 6. Milestones

| Milestone | Target Date | Description |
|-----------|-------------|-------------|
| M1 | 2025-11-05 | Export phase feature-complete (JSON/TXT + UI). |
| M2 | 2025-11-12 | SRT export beta + documentation update. |
| M3 | 2025-11-20 | Phase 8 kickoff with CI/CD + monitoring foundations. |
| GA | 2025-12-10 | Production launch with export + monitoring + deployment runbooks. |

Dates assume a 2-week cadence with buffer for review/testing.

---

## 7. References

- `docs/project/STATUS.md` – rolling status updates.
- `docs/DEPLOYMENT.md` – infrastructure and release procedures.
- `docs/TECH_STACK.md` – vetted tool versions.
- `frontend/src/app/transcripts/[videoId]/components/export-tab.tsx` – current Export tab implementation.
- `backend/internal/api` – Go HTTP handlers (starting point for export API).

---

## 8. Change Log

- **2025-10-22**: Reworked plan for Next.js migration, shadcn UI, and export-focused roadmap (Master).
