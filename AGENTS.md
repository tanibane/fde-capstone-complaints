# AGENTS.md — Repository Architecture for Agent Context
# Clearview Retail Bank — Agentic Complaints Management System

> This file is the **primary context document** for IBM Bob and any AI coding agent working in this repository.
> Read this before touching any file. All agents must respect the `constitution.md` governing principles.

---

## Repository Layout

```
fde-capstone-complaints/
├── constitution.md              ← Governing principles (READ FIRST)
├── AGENTS.md                    ← This file — full repo map
├── specs/
│   └── COMPLAINTS-01/
│       ├── spec.md              ← Feature specification (user stories + AC)
│       ├── plan.md              ← Implementation plan (components + tasks)
│       └── tasks.md             ← Granular task breakdown
├── context-studio/
│   └── ontology.jsonld          ← Knowledge graph: bank profile + FCA DISP + IT APIs
├── process-studio/
│   ├── as-is-process.md         ← Current state: pain points, timing, routing errors
│   └── to-be-process.md         ← Target: 4-agent workflow + handshake payloads
├── agents/
│   ├── schemas/
│   │   ├── complaint-intake.schema.json     ← Complaint ingestion schema
│   │   ├── triage-agent.schema.json         ← Triage Agent I/O schema
│   │   ├── evidence-agent.schema.json       ← Evidence Agent I/O schema
│   │   ├── policy-agent.schema.json         ← Policy Agent I/O schema
│   │   └── draft-agent.schema.json          ← Draft Agent I/O schema
│   ├── prompts/
│   │   ├── triage-agent.prompt.md           ← Triage prompt contract
│   │   ├── evidence-agent.prompt.md         ← Evidence prompt contract
│   │   ├── policy-agent.prompt.md           ← Policy prompt contract
│   │   └── draft-agent.prompt.md            ← Draft prompt contract
│   └── pipeline/
│       ├── orchestrator.py                  ← Main pipeline entry point
│       ├── triage_agent.py                  ← Triage Agent implementation
│       ├── evidence_agent.py                ← Evidence Agent implementation
│       ├── policy_agent.py                  ← Policy Agent implementation
│       └── draft_agent.py                   ← Draft Agent implementation
├── mcp-tools/
│   ├── secure-query-executor.ts             ← Postgres / T24 DB queries
│   ├── context-broker-hybrid-query.ts       ← Vector + graph search
│   ├── notification-service.ts              ← Email / SMS / Push dispatch
│   └── audit-logger.ts                      ← Tamper-proof audit ledger
├── frontend/                                ← Next.js 15 Monitoring Workbench
│   ├── app/
│   │   ├── dashboard/page.tsx               ← Live KPI dashboard
│   │   ├── complaints/page.tsx              ← Filterable complaint table
│   │   ├── monitor/page.tsx                 ← Agent execution monitor
│   │   └── review/[id]/page.tsx             ← HITL review panel
│   └── components/
│       ├── KpiCard.tsx
│       ├── ComplaintTable.tsx
│       ├── AgentTimeline.tsx
│       └── HitlPanel.tsx
├── backend/
│   ├── api/
│   │   ├── complaints.ts                    ← REST: POST /complaints, GET /complaints
│   │   ├── pipeline.ts                      ← REST: POST /pipeline/run
│   │   └── audit.ts                         ← REST: GET /audit/:complaintId
│   └── server.ts                            ← Express/Fastify entry point
├── db/
│   ├── schema.sql                           ← Full PostgreSQL schema
│   ├── seed.sql                             ← 300 synthetic complaints
│   └── migrations/                          ← Prisma migrations
└── docker-compose.yml                       ← Full stack: DB + backend + frontend
```

---

## Data Flow

```
Complaint Intake (POST /complaints)
        │
        ▼
  [Triage Agent]  ──MCP──▶  context-broker-hybrid-query (vulnerability + SLA lookup)
        │                    audit-logger (triage decision)
        │ JSON handshake
        ▼
  [Evidence Agent] ──MCP──▶  secure-query-executor (T24 txns, CAMS cards, CRM history)
        │                    audit-logger (evidence gathered)
        │ JSON handshake
        ▼
  [Policy Agent]  ──MCP──▶  context-broker-hybrid-query (FCA DISP rules, precedents)
        │                    audit-logger (policy decision + redress calc)
        │ JSON handshake
        ▼
  [Draft Agent]   ──MCP──▶  notification-service (letter dispatch)
                             audit-logger (final audit trail)
        │
        ▼
  [Monitoring Workbench]  ←── live updates via REST polling / WebSocket
        │
   HITL Review (if required) ──▶  Approve / Re-triage / Escalate
```

---

## Agent Contracts Summary

| Agent | Input | Key Outputs | Hard Rules |
|---|---|---|---|
| Triage | Raw complaint text + channel + customer_id | priority (P1/P2/P3), intent_type, vulnerability_flag, sentiment_score | Vulnerability flag blocks auto-dispatch |
| Evidence | Triage output + customer_id | transaction_log[], card_disputes[], crm_history[], call_transcripts[] | Must cite T24/CAMS/CRM source per record |
| Policy | Evidence output + intent_type | fca_rule_ref, outcome (Uphold/Partial/Reject), redress_amount, confidence_score | Redress > £150 → HITL mandatory |
| Draft | Policy output | resolution_letter, stp_eligible, audit_trail_id, dispatch_trigger | Vulnerable flag or low confidence → no auto-dispatch |

---

## MCP Tool Contracts Summary

| Tool | Purpose | Key Methods |
|---|---|---|
| `secure-query-executor` | Query PostgreSQL + T24 CBS | `queryTransactions`, `queryCardDisputes`, `queryCrmHistory` |
| `context-broker-hybrid-query` | Hybrid vector + graph search on Context Studio | `queryFcaRules`, `queryPrecedents`, `queryVulnerabilityMarkers` |
| `notification-service` | Send resolution via Email / SMS / Push | `sendResolutionLetter`, `sendSmsAlert` |
| `audit-logger` | Write immutable audit entries | `logAgentDecision`, `logMcpCall`, `logHitlAction` |

---

## Environment Variables Required

```
DATABASE_URL=postgresql://user:pass@localhost:5432/clearview_complaints
T24_API_BASE_URL=https://t24.clearview-internal/api/v1
T24_API_KEY=<secret>
CAMS_API_BASE_URL=https://cams.clearview-internal/api/v1
CAMS_API_KEY=<secret>
SALESFORCE_INSTANCE_URL=https://clearview.my.salesforce.com
SALESFORCE_ACCESS_TOKEN=<secret>
CONTEXT_STUDIO_ENDPOINT=https://context-studio.ica.ibm.com/query
CONTEXT_STUDIO_API_KEY=<secret>
NOTIFICATION_SMTP_HOST=smtp.clearview-internal
AUDIT_LOG_SIGNING_KEY=<secret>
```

---

## Key Rules for AI Coding Agents

1. **Never generate code before the relevant schema in `/agents/schemas/` is committed.**
2. **Never skip audit logging** — every MCP call must call `audit-logger.logMcpCall`.
3. **Always validate** agent input/output against the JSON schema before processing.
4. **Vulnerable customer flag = true** must propagate through all downstream agents unchanged.
5. **Confidence scores** are mandatory fields — never omit or hardcode them.
6. Frontend components use **Carbon Design System** only — no custom CSS frameworks.
7. All DB queries go through `secure-query-executor` MCP tool — no direct DB calls from agents.
