# Getting Started - Agent-Based Development System

## Overview

This project uses a **scaffolded agent-based development system** where specialized agents work under strict rules, coordinated by a Master Agent.

## Directory Structure

```
yt-downloader/
├── .agents/                    # Agent system
│   ├── master/                 # Master Agent (orchestrator)
│   │   ├── rules/              # Master's rules
│   │   ├── docs/               # Master's documentation
│   │   └── reports/            # Master's reports
│   ├── backend/                # Backend Agent (Go)
│   ├── frontend/               # Frontend Agent (Solid.js)
│   ├── devops/                 # DevOps Agent (Docker)
│   ├── database/               # Database Agent (PostgreSQL)
│   └── REPORT_TEMPLATE.md      # Template for task reports
│
├── docs/                       # Project documentation
│   ├── PROJECT_PLAN.md         # Full development plan
│   ├── TECH_STACK.md           # Technology decisions
│   ├── VERIFICATION_RULES.md   # Quality gates
│   └── project/
│       └── STATUS.md           # Current progress
│
├── backend/                    # Go backend (to be created)
├── frontend/                   # Solid.js frontend (to be created)
├── database/                   # Migrations (to be created)
├── README.md                   # Project overview
└── GETTING_STARTED.md          # This file
```

---

## Agent Roles

### Master Agent
**Location**: `.agents/master/`
**Role**: Orchestrates all agents, verifies work, enforces quality
**Rules**: `.agents/master/rules/MASTER_AGENT_RULES.md`
**You (human) act as**: The middleman passing prompts to agents

### Backend Agent
**Location**: `.agents/backend/`
**Role**: Writes Go code, APIs, business logic
**Rules**: `.agents/backend/rules/BACKEND_AGENT_RULES.md`
**Cannot**: Touch frontend, DevOps, or database migrations

### Frontend Agent
**Location**: `.agents/frontend/`
**Role**: Writes Solid.js components, UI, styles
**Rules**: `.agents/frontend/rules/FRONTEND_AGENT_RULES.md`
**Cannot**: Touch backend, DevOps, or database

### DevOps Agent
**Location**: `.agents/devops/`
**Role**: Docker, infrastructure, deployment
**Rules**: `.agents/devops/rules/DEVOPS_AGENT_RULES.md`
**Cannot**: Write application code

### Database Agent
**Location**: `.agents/database/`
**Role**: Schema design, migrations, queries
**Rules**: `.agents/database/rules/DATABASE_AGENT_RULES.md`
**Cannot**: Write application logic

---

## Workflow

### 1. Master Assigns Task

Master creates a prompt using template from `.agents/master/docs/MASTER_PROMPTS.md`

```
AGENT: BACKEND
TASK_ID: 2.2.1
SCOPE: Create PostgreSQL connection pool

INSTRUCTION:
- Create internal/db/postgres.go
- Use pgx v5
- Connection pool (10 max)
- Retry logic

DELIVERABLES:
- internal/db/postgres.go
- internal/db/postgres_test.go

VERIFY:
go test ./internal/db/...
```

### 2. You (Human) Deliver Prompt

You copy Master's prompt and give it to the designated agent:

```
"You are the Backend Agent. Here is your task:

[paste prompt]

Follow the rules in .agents/backend/rules/BACKEND_AGENT_RULES.md"
```

### 3. Agent Completes Task

Agent:
1. Reads their rules
2. Checks docs/TECH_STACK.md for libraries
3. Writes code
4. Runs tests
5. Creates report in `.agents/backend/reports/TASK_2_2_1.md`

### 4. You Return Report to Master

Copy agent's report and give it to Master Agent:

```
"Backend Agent completed task 2.2.1. Here is their report:

[paste report]"
```

### 5. Master Verifies

Master checks:
- Tests pass?
- Build succeeds?
- Files within size limits?
- Agent stayed in boundaries?
- Documentation updated?

See: `docs/VERIFICATION_RULES.md`

### 6. Master Decides

**✅ APPROVED**: Move to next task
**❌ REJECTED**: Send back to agent with fixes
**⚠️ BLOCKED**: External dependency, document blocker

---

## Key Files to Read

### Start Here
1. `README.md` - Project overview
2. This file - Workflow
3. `docs/PROJECT_PLAN.md` - What we're building

### For Master Agent
1. `.agents/master/rules/MASTER_AGENT_RULES.md` - Your rules
2. `.agents/master/docs/MASTER_PROMPTS.md` - Prompt templates
3. `docs/VERIFICATION_RULES.md` - Quality gates

### For Each Specialized Agent
1. `.agents/{agent}/rules/{AGENT}_RULES.md` - Agent's rules
2. `docs/TECH_STACK.md` - Technologies to use
3. `.agents/REPORT_TEMPLATE.md` - How to report

---

## Rules Summary

### Never Break These

1. **Agents can't cross boundaries**
   - Backend touches only backend/
   - Frontend touches only frontend/
   - etc.

2. **All tests must pass**
   - No exceptions
   - Before submitting report

3. **No invented APIs**
   - Check pkg.go.dev or npmjs.com
   - Verify library exists

4. **Files stay modular**
   - Backend: <200 lines
   - Frontend: <150 lines
   - Split if needed

5. **Master approves everything**
   - No task proceeds without approval

6. **Token economy**
   - Prompts <200 tokens
   - No fluff, only facts

---

## Example Session

### Master Agent (via you):
```
AGENT: DATABASE
TASK_ID: 1.1.1
SCOPE: Create initial schema migration

INSTRUCTION:
- Create database/migrations/001_initial_schema_up.sql
- Tables: videos, transcripts, ai_summaries
- Create down migration
- See docs/PROJECT_PLAN.md for schema

DELIVERABLES:
- 001_initial_schema_up.sql
- 001_initial_schema_down.sql

VERIFY:
psql -f 001_up.sql && psql -f 001_down.sql
```

### Database Agent (via you as agent):
```
Task received. I will:
1. Read .agents/database/rules/DATABASE_AGENT_RULES.md
2. Check schema in docs/PROJECT_PLAN.md
3. Create migrations
4. Test up/down
5. Create report

[Agent does work]

Report complete: .agents/database/reports/TASK_1_1_1.md
```

### You Return to Master:
```
Database Agent completed 1.1.1.
Report: [paste content of TASK_1_1_1.md]
```

### Master Verifies (via you):
```
Verification:
✅ Both files created
✅ Up migration works
✅ Down migration works
✅ Schema matches plan
✅ Report complete

APPROVED - Proceed to Task 1.1.2
```

---

## Current Status

Check: `docs/project/STATUS.md`

**Phase**: 0 - Setup & Research
**Next Task**: 0.2 - Create project structure

---

## Tools You Need

### For Development
- Docker 24+
- Docker Compose v2
- Go 1.23+ (backend)
- Bun (frontend)
- PostgreSQL client (psql)

### For Verification
- golangci-lint (backend)
- git

---

## Quick Reference

### Agent Prompts
`.agents/master/docs/MASTER_PROMPTS.md`

### Report Template
`.agents/REPORT_TEMPLATE.md`

### Quality Gates
`docs/VERIFICATION_RULES.md`

### Tech Stack
`docs/TECH_STACK.md`

### Current Plan
`docs/PROJECT_PLAN.md`

---

## Tips for Success

### As Master Agent
- Keep prompts <200 tokens
- Reference files, don't paste
- Be strict on verification
- Reject incomplete work
- Learn from mistakes

### As Specialized Agent
- Read your rules first
- Verify APIs exist
- Test before reporting
- Stay in your boundaries
- Document everything

### As Human Middleman
- Keep contexts separate
- Don't mix agent knowledge
- Enforce boundaries
- Track which agent you're talking to

---

## Learning System

### When Agent Makes Mistake

1. Master documents in `.agents/master/reports/failures.md`
2. Update relevant agent rules
3. Reassign with clearer instructions
4. Track pattern in lessons learned

### When Pattern Emerges

1. Update `.agents/{agent}/rules/` to prevent recurrence
2. Add to verification checklist
3. Document in `docs/VERIFICATION_RULES.md`

---

## Next Steps

1. **You act as Master Agent**
2. **Start with Phase 0, Task 0.2**
3. **Follow workflow above**
4. **Assign to appropriate agent**
5. **Verify and approve**
6. **Move to next task**

See: `docs/PROJECT_PLAN.md` Phase 0 for detailed tasks.

---

## Questions?

- Agent rules: `.agents/{agent}/rules/`
- Verification: `docs/VERIFICATION_RULES.md`
- Tech decisions: `docs/TECH_STACK.md`
- Current status: `docs/project/STATUS.md`
