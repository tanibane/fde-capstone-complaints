# tasks.md — Task Breakdown
# COMPLAINTS-01: Agentic Complaints Management System
# Clearview Retail Bank | Version 1.0 | IBM Consulting 2026
# References: spec.md · plan.md | Governed by: constitution.md

---

## Task Status Legend
- ✅ DONE — Implemented and verified
- 🟡 DEMO — Present in repo; demonstrate in video
- ❌ OUT OF SCOPE — v1.0 capstone boundary

---

## PHASE 1 — Contracts & Specifications

### TASK-001 · Project Constitution
**Spec ref:** constitution.md  
**Status:** ✅ DONE  
**AC:** constitution.md committed with all 8 sections (Identity, Principles, Regulatory Constraints, Tech Standards, Code Standards, Agent Interaction Standards, Escalation Rules, DoD)

### TASK-002 · Repository Architecture
**Spec ref:** AGENTS.md  
**Status:** ✅ DONE  
**AC:** AGENTS.md committed with full repo map, data flow diagram, agent contracts summary, MCP tool summary, env vars, and AI agent rules

### TASK-003 · Context Studio Ontology
**Spec ref:** AC-01 (context-studio/)  
**Status:** ✅ DONE  
**AC:** `context-studio/ontology.jsonld` committed; covers bank profile, IT APIs (T24/CAMS/Salesforce/Verint), FCA DISP rules, vulnerability markers, SLA tiers, redress scale, precedents  
**Demo:** Show 3 hybrid query examples from ontology nodes in video

### TASK-004 · Process Studio As-Is Analysis
**Spec ref:** process-studio/as-is-process.md  
**Status:** ✅ DONE  
**AC:** 7-step manual process documented with timing data, routing error rates, bottleneck annotations, cost analysis

### TASK-005 · Process Studio To-Be Design
**Spec ref:** process-studio/to-be-process.md  
**Status:** ✅ DONE  
**AC:** 4-agent workflow with trigger conditions, STP criteria, hard-stop rules, escalation matrix, handshake JSON payloads for all 4 agent transitions, performance targets vs As-Is

### TASK-006 · Agent Schema — Complaint Intake
**Spec ref:** AC-01.1  
**Status:** ✅ DONE  
**AC:** `agents/schemas/complaint-intake.schema.json` — required fields: customer_id, channel, complaint_text; channel enum validated; min-length on complaint_text

### TASK-007 · Agent Schema — Triage Agent
**Spec ref:** AC-02.2  
**Status:** ✅ DONE  
**AC:** `agents/schemas/triage-agent.schema.json` — all fields present: priority enum (P1/P2/P3), intent_type enum, vulnerability_flag boolean, vulnerability_markers array, sentiment_score (0–1), confidence_score (0–1), hitl_required, legal_threat_flag, data_sources array, processed_at ISO 8601

### TASK-008 · Agent Schema — Evidence Agent
**Spec ref:** AC-02.3  
**Status:** ✅ DONE  
**AC:** `agents/schemas/evidence-agent.schema.json` — transaction_log, card_disputes, crm_history, call_transcripts arrays with source_system required on each record; evidence_summary text; confidence_score

### TASK-009 · Agent Schema — Policy Agent
**Spec ref:** AC-02.4  
**Status:** ✅ DONE  
**AC:** `agents/schemas/policy-agent.schema.json` — outcome enum (Uphold/Partial Uphold/Reject), fca_rule_refs array, redress_amount numeric, redress_tier enum, liability_party enum, precedent_refs, hitl_required, confidence_score

### TASK-010 · Agent Schema — Draft Agent
**Spec ref:** AC-02.5  
**Status:** ✅ DONE  
**AC:** `agents/schemas/draft-agent.schema.json` — resolution_letter text, redress_package object, stp_eligible, dispatch_trigger, hitl_required, audit_trail_id, fca_deadline, disp_14_deadline, confidence_score

### TASK-011 · Prompt Contract — Triage Agent
**Spec ref:** AC-02.2  
**Status:** ✅ DONE  
**AC:** `agents/prompts/triage-agent.prompt.md` — ROLE / BOUNDARY / TASK (10 steps) / GUARDRAILS (6 rules) / OUTPUT FORMAT / 2 EXAMPLES (P3 standard + P1 vulnerable)

### TASK-012 · Prompt Contract — Evidence Agent
**Spec ref:** AC-02.3  
**Status:** ✅ DONE  
**AC:** `agents/prompts/evidence-agent.prompt.md` — ROLE / BOUNDARY / TASK (8 steps) / GUARDRAILS (6 rules) / OUTPUT FORMAT / 2 EXAMPLES

### TASK-013 · Prompt Contract — Policy Agent
**Spec ref:** AC-02.4  
**Status:** ✅ DONE  
**AC:** `agents/prompts/policy-agent.prompt.md` — ROLE / BOUNDARY / TASK (10 steps) / GUARDRAILS (6 rules) / OUTPUT FORMAT / 2 EXAMPLES (Uphold + Reject)

### TASK-014 · Prompt Contract — Draft Agent
**Spec ref:** AC-02.5  
**Status:** ✅ DONE  
**AC:** `agents/prompts/draft-agent.prompt.md` — ROLE / BOUNDARY / TASK (8 steps) / GUARDRAILS (7 rules) / OUTPUT FORMAT / 1 EXAMPLE (Uphold with HITL)

---

## PHASE 2 — Data Layer

### TASK-015 · PostgreSQL Schema
**Spec ref:** AC-06 (audit immutability), AC-04.3 (redress constraint)  
**Status:** ✅ DONE  
**AC:** `db/schema.sql` — 8 tables (customers, complaints, triage_outputs, evidence_outputs, policy_outputs, draft_outputs, hitl_reviews, audit_log), indexes, constraints, triggers; audit_log UPDATE/DELETE blocked; DB constraint enforces hitl_required on redress > £150

### TASK-016 · Synthetic Seed Data
**Spec ref:** plan.md §2.1  
**Status:** ✅ DONE  
**AC:** `db/seed.sql` — 300 complaints across 50 customers; correct intent distribution (duplicate_charge 28%, atm_failure 22%, unauthorised_transaction 18%, mortgage_dispute 15%, account_closure 10%, data_privacy 7%); ~14% vulnerable customers; all 5 channels represented

---

## PHASE 3 — Agent Pipeline

### TASK-017 · Pipeline Orchestrator
**Spec ref:** AC-02.1, AC-02.6, AC-02.7  
**Status:** ✅ DONE  
**AC:** `agents/pipeline/orchestrator.py` — chains Triage → Evidence → Policy → Draft; accepts stdin JSON; writes stdout JSON; hard-stops: vulnerability flag logged, legal_threat stops pipeline at "escalated"; each stage wrapped in try/except with pipeline_status tracking

### TASK-018 · Triage Agent Implementation
**Spec ref:** AC-02.2, AC-03  
**Status:** ✅ DONE  
**AC:** `agents/pipeline/triage_agent.py` — calls Claude with structured prompt; strips markdown from response; server-side guardrails: vulnerability → hitl=true + P1, confidence < 0.70 → hitl=true; returns validated dict

### TASK-019 · Evidence Agent Implementation
**Spec ref:** AC-02.3  
**Status:** ✅ DONE  
**AC:** `agents/pipeline/evidence_agent.py` — generates mock transactions by intent type; calls Claude for evidence summary; returns transaction_log, card_disputes, evidence_summary with source systems cited

### TASK-020 · Policy Agent Implementation
**Spec ref:** AC-02.4, AC-04  
**Status:** ✅ DONE  
**AC:** `agents/pipeline/policy_agent.py` — FCA rule lookup table by intent; calls Claude for reasoning; server-side guardrails: redress > £150 → hitl=true, vulnerability → hitl=true, confidence < 0.70 → hitl=true; fca_rule_refs enforced if missing

### TASK-021 · Draft Agent Implementation
**Spec ref:** AC-02.5, AC-07  
**Status:** ✅ DONE  
**AC:** `agents/pipeline/draft_agent.py` — generates resolution letter; server-side STP logic: confidence ≥ 0.90 + redress ≤ £150 + no vulnerability + no hitl_required; dispatch_trigger = stp_eligible AND no vulnerability AND no legal_threat; FCA deadlines calculated; audit_trail_id placeholder set

---

## PHASE 4 — Backend API

### TASK-022 · Complaint Intake Endpoint
**Spec ref:** US-01, AC-01.1 to AC-01.4  
**Status:** ✅ DONE  
**AC:** `POST /complaints` — validates required fields, generates UUID, sets FCA deadlines, inserts to DB, returns 201 with complaint_id

### TASK-023 · Complaint Query Endpoints
**Spec ref:** US-05, AC-05.3  
**Status:** ✅ DONE  
**AC:** `GET /complaints` — filter by priority/status/channel/vulnerability; pagination via limit/offset; joins customers table for full_name; returns total count  
`GET /complaints/:id` — returns complaint + all 4 agent outputs + HITL reviews

### TASK-024 · Pipeline Trigger Endpoint
**Spec ref:** US-02, AC-02.1  
**Status:** ✅ DONE  
**AC:** `POST /pipeline/run/:id` — spawns Python orchestrator; persists all agent outputs to DB; handles parse errors gracefully; sets final status (stp_complete / hitl_required / escalated)

### TASK-025 · HITL Review Endpoint
**Spec ref:** US-05, AC-05.6  
**Status:** ✅ DONE  
**AC:** `POST /hitl/review` — accepts analyst_id, decision (approved/re_triage/escalated), optional redress_override + justification + letter_edits + notes; updates complaint status

### TASK-026 · Audit Trail Endpoint
**Spec ref:** US-06, AC-06.1  
**Status:** ✅ DONE  
**AC:** `GET /audit/:complaintId` — returns all audit events ordered by created_at ASC

### TASK-027 · Dashboard Endpoints
**Spec ref:** US-05, AC-05.1, AC-05.2  
**Status:** ✅ DONE  
**AC:** `GET /dashboard/kpis` — returns active_cases, in_flight, p1_breach_risk, avg_redress_payout, stp_rate  
`GET /dashboard/charts` — returns by_intent, by_status, by_channel, redress_by_intent

---

## PHASE 5 — Frontend Monitoring Workbench

### TASK-028 · Root Layout + Navigation
**Spec ref:** AC-05 (Monitoring Workbench)  
**Status:** ✅ DONE  
**AC:** `app/layout.tsx` — IBM Plex Sans font, navigation bar with links to Dashboard / Complaints / Monitor

### TASK-029 · Dashboard Page
**Spec ref:** AC-05.1, AC-05.2  
**Status:** ✅ DONE  
**AC:** `/dashboard` — 5 KPI cards with colour-coded values, 4 charts (bar: by intent; donut: by status; bar: redress by intent; bar: by channel); auto-refreshes every 15s; last-updated timestamp

### TASK-030 · Complaints Table Page
**Spec ref:** AC-05.3  
**Status:** ✅ DONE  
**AC:** `/complaints` — filter dropdowns for priority/status/channel/vulnerable; table with ID, customer, channel, intent, priority badge, status badge, vulnerability icon, created date; "Run Pipeline" button on intake; "Review →" button on hitl_review; "Trace" link to monitor page

### TASK-031 · Agent Monitor Page
**Spec ref:** AC-05.4  
**Status:** ✅ DONE  
**AC:** `/monitor?id=` — complaint summary strip; vertical timeline with colour-coded dots per event_type; expandable JSON payload panel for each event; shows agent_name badges

### TASK-032 · HITL Review Panel
**Spec ref:** AC-05.5, AC-05.6, AC-03.5, AC-04.5  
**Status:** ✅ DONE  
**AC:** `/review/[id]` — red vulnerability banner when vulnerability_flag=true; FCA deadline warning when < 48h; AI recommendation panel (outcome, confidence, FCA rules, reasoning); redress override input with justification field; inline letter editor; 3 decision buttons (green/amber/red); success confirmation on submit

---

## PHASE 6 — Infrastructure

### TASK-033 · Docker Compose
**Spec ref:** plan.md §2.7  
**Status:** ✅ DONE  
**AC:** `docker-compose.yml` — postgres:15-alpine + backend + frontend; health checks on all services; volumes for DB persistence and agent code mount; correct env vars (ANTHROPIC_AUTH_TOKEN)

### TASK-034 · Backend Dockerfile
**Spec ref:** plan.md §2.7  
**Status:** ✅ DONE  
**AC:** `backend/Dockerfile` — Node.js 20 + Python 3.11; npm install; tsc build; anthropic pip install; non-root user; CMD starts compiled server.js

### TASK-035 · Frontend Dockerfile
**Spec ref:** plan.md §2.7  
**Status:** ✅ DONE  
**AC:** `frontend/Dockerfile` — Node.js 20-alpine; npm ci; next build; next start on port 3000

---

## PHASE 7 — Demo Preparation

### TASK-036 · Demo Complaint Scripts
**Status:** 🟡 DEMO  
**AC:** 5 test complaints ready for live demo:
1. Standard P2 — duplicate charge (no vulnerability)
2. P1 — unauthorised transaction (no vulnerability, high redress)
3. P1 — account closure (vulnerable customer — bereavement)
4. P3 — data privacy (STP eligible)
5. Legal threat — mortgage dispute with solicitor language

### TASK-037 · Context Studio Query Demo
**Status:** 🟡 DEMO  
**AC:** 3 hybrid queries from ontology.jsonld to show on video:
1. FCA DISP rules for duplicate_charge
2. Vulnerability markers for Consumer Duty
3. Redress scale and SLA tiers

### TASK-038 · Video Recording
**Status:** 🟡 DEMO  
**AC:** 10–15 min video covering all 6 sections from briefing slide 10; face visible; audio clear; screen ≥ 1080p
