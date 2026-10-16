# plan.md — Implementation Plan
# COMPLAINTS-01: Agentic Complaints Management System
# Clearview Retail Bank | Version 1.0 | IBM Consulting 2026
# References: spec.md | Governed by: constitution.md

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT CHANNELS                             │
│         Branch · Call Centre · Mobile · Email · Social          │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP POST /complaints
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│               BACKEND — Node.js 20 / Express 5                  │
│  POST /complaints          GET /complaints/:id                  │
│  POST /pipeline/run/:id    GET /audit/:id                       │
│  POST /hitl/review         GET /dashboard/kpis                  │
│  GET /dashboard/charts                                          │
└──────────────┬────────────────────────────────────┬────────────┘
               │ spawn(python orchestrator.py)       │ pg Pool
               ▼                                     ▼
┌─────────────────────────────┐      ┌───────────────────────────┐
│   PYTHON AGENT PIPELINE     │      │   PostgreSQL 15            │
│   orchestrator.py           │      │   complaints               │
│     ├── triage_agent.py     │      │   triage_outputs           │
│     ├── evidence_agent.py   │      │   evidence_outputs         │
│     ├── policy_agent.py     │      │   policy_outputs           │
│     └── draft_agent.py      │      │   draft_outputs            │
│                             │      │   hitl_reviews             │
│   LLM: Anthropic Claude     │      │   audit_log                │
│   (via IBM proxy)           │      │   customers                │
└─────────────────────────────┘      └───────────────────────────┘
                         ▲
                         │ REST polling (15s)
┌─────────────────────────────────────────────────────────────────┐
│         FRONTEND — Next.js 15 (IBM Plex Sans / Carbon palette)  │
│   /dashboard    — Live KPIs + 4 charts                          │
│   /complaints   — Filterable table + pipeline trigger           │
│   /monitor      — Agent execution timeline + audit viewer       │
│   /review/[id]  — HITL panel: approve / re-triage / escalate    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Breakdown

### 2.1 Database Layer (`/db/`)

| File | Purpose | Status |
|---|---|---|
| `schema.sql` | Full PostgreSQL schema (8 tables, indexes, constraints, triggers) | ✅ Complete |
| `seed.sql` | 300 synthetic complaints across 50 customers | ✅ Complete |
| `init.sh` | DB initialisation script | ✅ Complete |

Key design decisions:
- `audit_log` has `UPDATE`/`DELETE` blocked via PostgreSQL rules (immutability)
- `policy_outputs` has constraint: `redress > 150` must have `hitl_required = true`
- `draft_outputs` has constraint: `dispatch_trigger = true` requires `hitl_required = false`
- All UUID primary keys via `gen_random_uuid()` (pgcrypto extension)

### 2.2 Agent Schemas (`/agents/schemas/`)

All 5 schemas are complete and committed:

| Schema | Validates | Status |
|---|---|---|
| `complaint-intake.schema.json` | POST /complaints body | ✅ |
| `triage-agent.schema.json` | Triage Agent I/O | ✅ |
| `evidence-agent.schema.json` | Evidence Agent I/O | ✅ |
| `policy-agent.schema.json` | Policy Agent I/O | ✅ |
| `draft-agent.schema.json` | Draft Agent I/O | ✅ |

### 2.3 Agent Prompt Contracts (`/agents/prompts/`)

All 4 prompt contracts follow the ROLE / BOUNDARY / TASK / GUARDRAILS / OUTPUT FORMAT / EXAMPLES structure:

| Prompt | Length | Examples | Status |
|---|---|---|---|
| `triage-agent.prompt.md` | Full | 2 examples (P3 standard + P1 vulnerable) | ✅ |
| `evidence-agent.prompt.md` | Full | 2 examples (duplicate charge + card dispute) | ✅ |
| `policy-agent.prompt.md` | Full | 2 examples (Uphold + Reject) | ✅ |
| `draft-agent.prompt.md` | Full | 1 example (Uphold with HITL) | ✅ |

### 2.4 Python Agent Pipeline (`/agents/pipeline/`)

| File | Responsibility | LLM Model | Status |
|---|---|---|---|
| `orchestrator.py` | Chains all 4 agents; enforces hard-stops; accepts stdin JSON | — | ✅ |
| `triage_agent.py` | Intent + priority + vulnerability + sentiment | claude-sonnet-4-6 | ✅ |
| `evidence_agent.py` | Mock T24/CAMS evidence + LLM summary | claude-sonnet-4-6 | ✅ |
| `policy_agent.py` | FCA rule matching + redress calculation | claude-sonnet-4-6 | ✅ |
| `draft_agent.py` | Resolution letter + STP + dispatch trigger | claude-sonnet-4-6 | ✅ |

Server-side guardrails enforced in orchestrator (independent of LLM):
- vulnerability_flag → hitl_required = true, priority = P1
- redress > £150 → hitl_required = true
- legal_threat_flag → pipeline_status = "escalated" (stops after triage)
- confidence < 0.70 → hitl_required = true

### 2.5 Backend API (`/backend/`)

| Endpoint | Method | Purpose | Status |
|---|---|---|---|
| `/complaints` | POST | Intake a new complaint | ✅ |
| `/complaints` | GET | List with filters (priority/status/channel/vulnerability) | ✅ |
| `/complaints/:id` | GET | Full complaint + all agent outputs | ✅ |
| `/pipeline/run/:id` | POST | Trigger 4-agent Python pipeline | ✅ |
| `/hitl/review` | POST | Submit analyst HITL decision | ✅ |
| `/audit/:id` | GET | Full audit trail for a complaint | ✅ |
| `/dashboard/kpis` | GET | Live KPI metrics | ✅ |
| `/dashboard/charts` | GET | Chart breakdown data | ✅ |

### 2.6 Frontend (`/frontend/`)

| Page | Route | Components | Status |
|---|---|---|---|
| Dashboard | `/dashboard` | KPI cards, bar charts, donut chart | ✅ |
| Complaints | `/complaints` | Filterable table, pipeline trigger, priority badges | ✅ |
| Monitor | `/monitor?id=` | Agent timeline, expandable JSON payloads | ✅ |
| HITL Review | `/review/[id]` | Vulnerability banner, redress override, letter editor, 3 decision buttons | ✅ |

### 2.7 Infrastructure

| File | Purpose | Status |
|---|---|---|
| `docker-compose.yml` | postgres + backend + frontend | ✅ |
| `backend/Dockerfile` | Node.js + Python 3.11 image | ✅ |
| `frontend/Dockerfile` | Next.js 15 production image | ✅ |
| `.env.example` | Environment variable template | ✅ |

---

## 3. Dependencies

```
Python 3.11+
  anthropic>=0.40.0

Node.js 20 LTS
  express ^5.3.0
  pg ^8.23.1
  cors ^2.8.6
  dotenv ^18.0.7
  uuid ^14.0.3
  typescript ^5.x

Next.js 15
  react ^19.3.0
  react-dom ^19.3.0

PostgreSQL 15
  pgcrypto extension
```

---

## 4. Implementation Sequence

The implementation follows a spec-first, bottom-up sequence:

```
Phase 1: Contracts (DONE)
  ├── constitution.md + AGENTS.md
  ├── context-studio/ontology.jsonld
  ├── process-studio/as-is-process.md + to-be-process.md
  ├── specs/COMPLAINTS-01/spec.md + plan.md + tasks.md
  ├── agents/schemas/*.json (5 schemas)
  └── agents/prompts/*.prompt.md (4 prompt contracts)

Phase 2: Data Layer (DONE)
  ├── db/schema.sql (8 tables)
  └── db/seed.sql (300 synthetic complaints)

Phase 3: Agent Pipeline (DONE)
  ├── agents/pipeline/orchestrator.py
  ├── agents/pipeline/triage_agent.py
  ├── agents/pipeline/evidence_agent.py
  ├── agents/pipeline/policy_agent.py
  └── agents/pipeline/draft_agent.py

Phase 4: Backend API (DONE)
  └── backend/server.ts (8 endpoints)

Phase 5: Frontend (DONE)
  ├── frontend/app/layout.tsx (nav)
  ├── frontend/app/dashboard/page.tsx
  ├── frontend/app/complaints/page.tsx
  ├── frontend/app/monitor/page.tsx
  └── frontend/app/review/[id]/page.tsx

Phase 6: Infrastructure (DONE)
  ├── docker-compose.yml
  ├── backend/Dockerfile
  └── frontend/Dockerfile
```

---

## 5. MCP Tool Integration Points

| MCP Tool | Used By | Method | Mock in Capstone |
|---|---|---|---|
| `secure-query-executor` | Evidence Agent | `queryTransactions`, `queryCardDisputes`, `queryCrmHistory` | ✅ Mocked in evidence_agent.py |
| `context-broker-hybrid-query` | Triage, Policy, Draft Agents | `queryFcaRules`, `queryPrecedents`, `queryVulnerabilityMarkers` | ✅ Embedded in prompts |
| `notification-service` | Draft Agent | `sendResolutionLetter` | ✅ dispatch_trigger flag set, not wired |
| `audit-logger` | All 4 agents | `logAgentDecision` | ✅ Simulated (audit entries in DB) |

---

## 6. Test Coverage Plan

| Test Type | Scope | Tool |
|---|---|---|
| Schema validation | All 5 agent schemas | ajv / jsonschema |
| API integration | All 8 backend endpoints | REST client (curl / Postman) |
| Vulnerability guardrail | P1 + vulnerable customer cases | Manual + seed data |
| HITL redress rule | Cases with redress > £150 | Seed data (CUST-004, CUST-007) |
| STP flow | Low-risk cases (atm_failure, conf ≥ 0.90, redress ≤ £25) | Seed data |
| Legal threat escalation | Cases with solicitor/court language | Manual test complaint |
| Pipeline failure recovery | Simulated LLM timeout | Error injection |
