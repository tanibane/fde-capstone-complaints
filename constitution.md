# constitution.md — Governing Principles & Development Standards
# Clearview Retail Bank — Agentic Complaints Management System

---

## 1. Project Identity

| Field | Value |
|---|---|
| Project | Agentic Complaints Management — Clearview Retail Bank |
| Version | 1.0 |
| Owner | FDE Capstone Submission |
| Regulator | FCA (Conduct) · PRA (Prudential) |
| Compliance Framework | FCA DISP 1.4 · FCA DISP 1.6 · FCA Consumer Duty |

---

## 2. Core Principles

### 2.1 Specification-First
- **No code is generated until** `spec.md`, `plan.md`, agent schemas, and prompt contracts are complete and committed to `main`.
- Every implementation task must reference an approved spec artefact by ID.

### 2.2 Grounded Decision-Making
- Every agent decision **must** cite a Context Studio knowledge graph node (FCA rule, bank policy, or precedent).
- Agents **must not** infer regulatory outcomes without a verifiable source reference.

### 2.3 Human-in-the-Loop (HITL) is Non-Negotiable
- Redress amounts > £150 **must** route to HITL review. No exception.
- Vulnerable customer flags **must** trigger a hard-stop guardrail before dispatch.
- All agent outputs are recommendations, not automated actions, unless STP confidence ≥ 90%.

### 2.4 Audit Completeness
- Every MCP tool call, agent handshake, and data source query is written to the tamper-proof audit log.
- Audit entries are immutable. No delete or update operations on audit records.

### 2.5 Zero Vulnerable Customer Misses
- Any complaint with ≥1 FCA Consumer Duty vulnerability marker is flagged at Triage.
- Vulnerability flag propagates through the full pipeline and blocks auto-dispatch.

---

## 3. Regulatory Constraints

| Rule | Requirement | System Enforcement |
|---|---|---|
| FCA DISP 1.4 | Summary Resolution Communication within 3 days | P1 SLA = 4h · P2 = 24h · P3 = 72h |
| FCA DISP 1.6 | Final response within 8 weeks | Deadline tracked in DB; alert at < 48h |
| FCA Consumer Duty | 4 outcomes; vulnerable customer protection | 13-category vulnerability classifier in Triage Agent |
| Redress Authority | Analyst £50 · Lead £250 · Manager £1,000 | Enforced in Policy Agent output schema |
| STP Threshold | Auto-recommend only at ≥ 90% confidence | Confidence field required in all agent outputs |

---

## 4. Technology Standards

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js + Carbon Design System | 15.x |
| Backend / Orchestrator | Node.js | 20 LTS |
| Agent Runtime | Python | 3.11+ |
| Database | PostgreSQL + Prisma ORM | 15.x |
| MCP Tools | MCP SDK (TypeScript) | latest |
| Containerisation | Docker Compose | v2 |
| CI/CD | IBM GitHub + PR-gated merges | — |

---

## 5. Code Standards

- All functions have JSDoc / docstring documentation.
- All agent inputs and outputs are validated against JSON Schema before processing.
- No hardcoded credentials — environment variables via `.env` only.
- Every PR must pass: lint · type-check · unit tests · schema validation.
- Commit messages follow Conventional Commits: `feat:` `fix:` `spec:` `docs:`.

---

## 6. Agent Interaction Standards

- Agent-to-agent handshakes use structured JSON payloads (schemas defined in `/agents/schemas/`).
- Each agent returns a `confidence_score` (0.0–1.0) with every response.
- Each agent returns a `data_sources[]` array citing every knowledge graph node or DB record queried.
- Agents are stateless — all context is passed in the request payload.

---

## 7. Escalation Rules

| Condition | Action |
|---|---|
| Vulnerable customer detected | Hard-stop → HITL mandatory |
| Redress > £150 | HITL mandatory |
| Legal threat flag | Escalate to Investigations |
| FCA deadline < 48h | Alert + auto-escalate to Manager |
| Agent confidence < 70% | Flag for human review |
| STP confidence ≥ 90% | Auto-recommend eligible (still subject to HITL rules above) |

---

## 8. Definition of Done (per task)

- [ ] Schema / contract committed and reviewed
- [ ] Unit test covering happy path + at least one edge case
- [ ] Audit log entry verified for MCP tool calls
- [ ] Vulnerability guardrail tested
- [ ] PR raised and merged to feature branch
