# spec.md — Feature Specification
# COMPLAINTS-01: Agentic Complaints Management System
# Clearview Retail Bank | Version 1.0 | IBM Consulting 2026
# Governed by: constitution.md

---

## 1. Problem Statement

Clearview Retail Bank processes 50,000+ complaints per month through a fully manual 7-step
workflow. The current state results in:
- 7–10 day average resolution time (FCA limit: 8 weeks; SRC: 3 days)
- 40% complaint mis-routing rate at triage
- 60%+ analyst time spent on manual evidence gathering across 4 disconnected systems
- £48 average cost per case
- Vulnerable customers not consistently identified at intake
- £12M FCA fine exposure in 2026 from DISP deadline breaches

---

## 2. Objective

Build a production-grade **Agentic Complaints Management System** that:
1. Automates triage, evidence gathering, policy assessment and resolution drafting via a 4-agent pipeline
2. Grounds every agent decision in verifiable knowledge (FCA rules, bank policy, historical precedents)
3. Enforces FCA Consumer Duty vulnerable customer protections at every pipeline stage
4. Provides a real-time monitoring workbench with human-in-the-loop (HITL) oversight
5. Maintains a tamper-proof audit trail of every agent action and decision

---

## 3. User Stories

### US-01 — Complaint Intake
**As a** front-line bank staff member or customer,  
**I want to** submit a complaint via any channel (branch, call centre, mobile, email, social media),  
**So that** it is immediately logged with an FCA SLA clock started and a unique reference ID returned.

**Acceptance Criteria:**
- AC-01.1: `POST /complaints` accepts `customer_id`, `channel`, `complaint_text`, returns `complaint_id` + `created_at`
- AC-01.2: `fca_deadline` (+ 56 days) and `disp_14_deadline` (+ 3 days) are set at intake
- AC-01.3: Missing required fields return HTTP 422 with descriptive error
- AC-01.4: `complaint_text` shorter than 10 characters is rejected

---

### US-02 — 4-Agent Triage Pipeline
**As a** complaints analyst,  
**I want to** trigger the agentic pipeline on a complaint with a single click,  
**So that** triage, evidence, policy, and draft are all completed automatically in under 2 minutes.

**Acceptance Criteria:**
- AC-02.1: `POST /pipeline/run/:complaintId` triggers the 4-agent Python orchestrator
- AC-02.2: Triage Agent classifies `intent_type`, `priority`, `vulnerability_flag`, `sentiment_score`
- AC-02.3: Evidence Agent gathers mock T24/CAMS/CRM data and writes `evidence_summary`
- AC-02.4: Policy Agent determines `outcome`, `redress_amount`, `fca_rule_refs` with `reasoning_summary`
- AC-02.5: Draft Agent generates a complete resolution letter with FOS rights paragraph included
- AC-02.6: Full pipeline completes in < 2 minutes for a standard complaint
- AC-02.7: All 4 agent outputs are persisted to PostgreSQL after pipeline completion

---

### US-03 — Vulnerability Guardrail
**As a** compliance officer,  
**I want to** ensure that any complaint involving an FCA-defined vulnerable customer is automatically
flagged and routed to human review with no possibility of auto-dispatch,  
**So that** the bank meets its FCA Consumer Duty obligations with zero misses.

**Acceptance Criteria:**
- AC-03.1: Triage Agent detects vulnerability markers from the FCA 13-category classifier
- AC-03.2: `vulnerability_flag = true` forces `priority = P1` and `hitl_required = true` in Triage
- AC-03.3: `vulnerability_flag` propagates unchanged through Evidence → Policy → Draft agents
- AC-03.4: Draft Agent sets `dispatch_trigger = false` and `stp_eligible = false` when `vulnerability_flag = true`
- AC-03.5: HITL Review panel displays a prominent red banner for vulnerable customer complaints
- AC-03.6: Server-side guardrail in orchestrator enforces vulnerability rules independent of LLM output

---

### US-04 — Redress HITL Rule
**As a** complaints manager,  
**I want to** be automatically notified and required to approve any complaint where redress exceeds £150,  
**So that** high-value redress decisions always have human oversight in line with Clearview policy.

**Acceptance Criteria:**
- AC-04.1: Policy Agent sets `hitl_required = true` whenever `redress_amount > 150`
- AC-04.2: Server-side guardrail in Policy Agent enforces this rule independent of LLM output
- AC-04.3: Database constraint `chk_hitl_high_redress` prevents storing `hitl_required = false` with `redress > 150`
- AC-04.4: Complaint status is set to `hitl_review` (not `dispatched`) when HITL is required
- AC-04.5: HITL panel allows analyst to accept AI redress or override with mandatory justification note

---

### US-05 — Monitoring Workbench
**As a** complaints supervisor,  
**I want to** see a live dashboard with KPIs, filterable complaint list, agent execution traces, and HITL review panel,  
**So that** I have full visibility and control over the complaints pipeline at all times.

**Acceptance Criteria:**
- AC-05.1: Dashboard shows: Active Cases, In-Flight, P1 Breach Risk, Avg Redress, STP Rate — auto-refreshing every 15s
- AC-05.2: Dashboard shows 4 charts: by intent, by status (donut), by channel, avg redress by intent
- AC-05.3: Complaints table supports filtering by priority, status, channel, vulnerability flag
- AC-05.4: Agent trace page shows step-by-step audit timeline with expandable JSON payloads
- AC-05.5: HITL review panel shows AI recommendation, allows redress override + letter editing
- AC-05.6: Three HITL decision buttons: Approve & Dispatch, Request Re-triage, Escalate to Investigations

---

### US-06 — Audit Trail
**As a** compliance auditor,  
**I want to** retrieve a complete, tamper-proof audit trail for any complaint,  
**So that** I can demonstrate FCA compliance and reconstruct every agent decision made.

**Acceptance Criteria:**
- AC-06.1: `GET /audit/:complaintId` returns all audit events in chronological order
- AC-06.2: Every agent decision, MCP tool call and HITL action is logged
- AC-06.3: `audit_log` table has `UPDATE` and `DELETE` blocked via PostgreSQL rules
- AC-06.4: Each audit entry has an `entry_hash` (SHA-256) for tamper-evidence
- AC-06.5: Audit entries include `agent_name`, `event_type`, `payload`, `confidence_score`, `data_sources`

---

### US-07 — STP Auto-Dispatch
**As a** complaints analyst,  
**I want** low-risk complaints to be automatically dispatched without manual intervention,  
**So that** simple cases are resolved in minutes, freeing analysts for complex cases.

**Acceptance Criteria:**
- AC-07.1: `stp_eligible = true` requires ALL: confidence ≥ 0.90 + redress ≤ £150 + no vulnerability + `hitl_required = false`
- AC-07.2: `dispatch_trigger = true` only when `stp_eligible = true` AND no vulnerability AND no legal threat
- AC-07.3: STP rate visible on dashboard as a KPI
- AC-07.4: Dispatched complaints show status `dispatched` in complaint table

---

## 4. Constraints

- All agent outputs must be validated against JSON schemas in `/agents/schemas/` before processing
- No hardcoded credentials — environment variables via `.env` only
- Frontend uses IBM Plex Sans font family (Carbon Design System aesthetic)
- Database: PostgreSQL 15; no direct DB calls from agent code (must go via backend API)
- Python runtime: 3.11+; Node.js runtime: 20 LTS
- Agent LLM: Anthropic Claude via IBM proxy (configurable via `ANTHROPIC_BASE_URL` + `ANTHROPIC_AUTH_TOKEN`)

---

## 5. Out of Scope (v1.0)

- Real T24 / CAMS / Salesforce API integration (mocked in this capstone)
- Real ICA Context Studio queries (ontology is exported; queries are simulated)
- Production notification service (email/SMS dispatch mocked)
- User authentication and role-based access control
- Multi-language complaint support
