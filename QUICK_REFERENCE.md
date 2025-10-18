# Quick Reference Card

## 🎯 Your Role: Middleman between Master & Agents

---

## 📋 Workflow (Repeat for Each Task)

```
1. AS MASTER AGENT
   └─> Read next task from docs/PROJECT_PLAN.md
   └─> Create prompt using .agents/master/docs/MASTER_PROMPTS.md
   └─> Assign to agent (BACKEND|FRONTEND|DEVOPS|DATABASE)

2. AS SPECIALIZED AGENT
   └─> Receive prompt from Master
   └─> Read your rules in .agents/{agent}/rules/
   └─> Complete task
   └─> Create report in .agents/{agent}/reports/

3. AS MASTER AGENT
   └─> Receive report from agent
   └─> Verify using docs/VERIFICATION_RULES.md
   └─> APPROVE ✅ or REJECT ❌
   └─> Update docs/project/STATUS.md

4. REPEAT
```

---

## 🤖 Agent Boundaries

| Agent | CAN Touch | CANNOT Touch |
|-------|-----------|--------------|
| **BACKEND** | `backend/` | `frontend/`, `docker-compose.yml`, migrations |
| **FRONTEND** | `frontend/` | `backend/`, `docker-compose.yml`, migrations |
| **DEVOPS** | Dockerfiles, `docker-compose.yml` | Application code |
| **DATABASE** | `database/migrations/` | Application code |
| **MASTER** | Coordination, verification | No direct coding |

---

## ✅ Verification Checklist (Master Must Check)

```bash
# 1. Tests Pass
go test ./...          # Backend
bun test              # Frontend

# 2. Build Succeeds
go build ./...        # Backend
bun run build         # Frontend

# 3. Linting Clean
golangci-lint run     # Backend
bun run lint          # Frontend

# 4. Files Modular
wc -l **/*.go         # Must be <200 lines (backend)
wc -l **/*.tsx        # Must be <150 lines (frontend)

# 5. No Boundary Violations
git diff --name-only  # Check agent stayed in domain

# 6. Documentation Updated
ls .agents/{agent}/docs/
```

---

## 📝 Prompt Template (Max 200 tokens)

```
AGENT: {BACKEND|FRONTEND|DEVOPS|DATABASE}
TASK_ID: {X.Y.Z}
SCOPE: {One line what to do}

INSTRUCTION:
- Bullet 1
- Bullet 2
- Bullet 3

CONTEXT:
- File reference 1
- File reference 2

DELIVERABLES:
- path/to/file1
- path/to/file2

VERIFY:
command to run
Expected: what should happen

RULES:
- Specific constraint 1
- Specific constraint 2
```

---

## 📊 Current Status

**Check**: `docs/project/STATUS.md`
**Plan**: `docs/PROJECT_PLAN.md`
**Next Task**: See STATUS.md

---

## 📚 Key Files Reference

### For Master Agent
- `.agents/master/rules/MASTER_AGENT_RULES.md` - Your rules
- `.agents/master/docs/MASTER_PROMPTS.md` - Prompt templates
- `docs/VERIFICATION_RULES.md` - Quality gates

### For All Agents
- `.agents/{agent}/rules/{AGENT}_RULES.md` - Agent's rules
- `docs/TECH_STACK.md` - Technologies to use
- `.agents/REPORT_TEMPLATE.md` - Report format

### Project Info
- `README.md` - Project overview
- `GETTING_STARTED.md` - Detailed workflow
- `docs/PROJECT_PLAN.md` - Development plan

---

## 🚫 Never Allow

1. ❌ Tests failing
2. ❌ Build failing
3. ❌ Agent crossing boundaries
4. ❌ Files >200 lines (BE) or >150 lines (FE)
5. ❌ Invented APIs (not verified)
6. ❌ Missing documentation
7. ❌ Incomplete reports

---

## ⚡ Token Economy Rules

**Max 200 tokens per prompt**

✅ DO:
- Use bullet points
- Reference files by path
- Exact commands
- Short context

❌ DON'T:
- Write paragraphs
- Paste file contents
- Explain "why"
- Repeat rules (agents have them)

---

## 🎓 Learning System

When agent makes mistake:
1. Document in `.agents/master/reports/failures.md`
2. Update agent's rules
3. Reassign with clearer instructions
4. Track pattern in lessons learned

---

## 📈 Success Metrics

Track in `.agents/master/docs/metrics.md`:
- First-time approval rate (goal: >80%)
- Tasks rejected (goal: <1 per task)
- Build failures (goal: 0)
- Boundary violations (goal: 0)

---

## 🔧 Common Commands

```bash
# Backend
cd backend
go test ./...
go build ./...
golangci-lint run

# Frontend
cd frontend
bun test
bun run build
bun run lint

# Docker
docker-compose build
docker-compose up -d
docker-compose ps
docker-compose logs

# Database
psql -h localhost -U postgres -d yt_transcripts
psql -f database/migrations/001_up.sql
```

---

## 📞 Where to Look

| Question | File |
|----------|------|
| How does workflow work? | `GETTING_STARTED.md` |
| What are we building? | `README.md`, `docs/PROJECT_PLAN.md` |
| What tech to use? | `docs/TECH_STACK.md` |
| How to verify quality? | `docs/VERIFICATION_RULES.md` |
| What are agent rules? | `.agents/{agent}/rules/` |
| How to write prompts? | `.agents/master/docs/MASTER_PROMPTS.md` |
| How to write reports? | `.agents/REPORT_TEMPLATE.md` |
| What's the current status? | `docs/project/STATUS.md` |
| What's next? | `docs/PROJECT_PLAN.md` |

---

## 🚀 Start Here

1. Read: `GETTING_STARTED.md`
2. Check: `docs/project/STATUS.md`
3. Next task: `docs/PROJECT_PLAN.md` → Find current phase
4. Act as Master: Assign task to agent
5. Act as Agent: Complete task, create report
6. Act as Master: Verify and approve
7. Repeat

---

## 💡 Pro Tips

### As Master
- Be strict on quality gates
- Reject incomplete work
- Keep prompts under 200 tokens
- Update STATUS.md after every task

### As Agent
- Read your rules first
- Verify APIs exist (pkg.go.dev or npmjs.com)
- Test before reporting
- Stay in your boundaries
- Create complete reports

### As Middleman
- Keep agent contexts separate
- Don't let agents know about each other's work
- Enforce boundaries strictly
- Track which agent you're talking to

---

## 🎯 Current Phase

**Phase 0: Project Setup & Research**
**Next Task**: 0.2 - Create project structure

See: `docs/PROJECT_PLAN.md` for details

---

## ⚠️ Emergency Stop

If you encounter:
- Tests failing on main
- Build broken
- Security vulnerability
- Data loss
- Agent repeatedly inventing APIs

**Action**: STOP all work, fix issue, document in lessons learned

---

**Print this card** for quick reference during development!
