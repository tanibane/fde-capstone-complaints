# To-Be Process: Clearview Retail Bank — Agentic Complaints Management
# Process Studio | Version 1.0 | IBM Consulting 2026

---

## Overview

The To-Be state replaces the 7-step manual workflow with a **4-agent agentic pipeline** that
processes a complaint end-to-end in under 2 minutes, with full audit trail, FCA compliance
guardrails, and human oversight for high-risk cases.

Target outcomes:
- **30–50% cycle-time reduction** (7–10 days → same-day for STP cases)
- **2× cost savings** (£48/case → ~£24/case)
- **100% FCA DISP compliance** — SLA clocks start at intake, deadlines tracked automatically
- **Zero vulnerable-customer misses** — 13-category classifier runs at every intake

---

## To-Be 4-Agent Workflow

```
Customer Complaint Received (any channel)
        │  Channels: branch · call_centre · mobile · email · social_media
        │  POST /complaints → complaint_id assigned, FCA clock started
        │
        ▼
══════════════════════════════════════════════════
AGENT 1: TRIAGE AGENT
══════════════════════════════════════════════════
  Trigger:   POST /pipeline/run/:complaintId
  Runtime:   ~10 seconds
  Tools:     context-broker-hybrid-query, audit-logger

  Actions:
  1. Parse complaint text for core issue, amounts, urgency signals
  2. Query Context Studio: vulnerability markers (FCA 13-category classifier)
  3. Classify intent_type (duplicate_charge / atm_failure / unauthorised_transaction
                           / mortgage_dispute / account_closure / data_privacy / other)
  4. Assign priority: P1 (4h) · P2 (24h) · P3 (72h)
  5. Score sentiment (0.0 distressed → 1.0 neutral)
  6. Apply channel weighting
  7. Set legal_threat_flag if solicitor / court / FOS language detected
  8. Log triage_decision to audit trail

  STP Criteria: intent clear + confidence ≥ 0.70 + no vulnerability + no legal threat
  Hard-stops:   vulnerability_flag=true → HITL mandatory | legal_threat → escalate to Investigations

  Handshake Payload →
  {
    "complaint_id": "<uuid>",
    "priority": "P2",
    "intent_type": "duplicate_charge",
    "vulnerability_flag": false,
    "vulnerability_markers": [],
    "sentiment_score": 0.45,
    "channel_weight": 0.8,
    "confidence_score": 0.91,
    "hitl_required": false,
    "legal_threat_flag": false,
    "data_sources": ["complaint_text_analysis", "clearview:VulnerabilityMarkers"],
    "reasoning_summary": "...",
    "processed_at": "2026-03-15T09:14:00Z"
  }
        │
        ▼
══════════════════════════════════════════════════
AGENT 2: EVIDENCE AGENT
══════════════════════════════════════════════════
  Trigger:   Triage handshake received (no legal_threat)
  Runtime:   ~15 seconds
  Tools:     secure-query-executor (T24, CAMS, Salesforce, Verint), audit-logger

  Actions:
  1. Query T24 Core Banking: 90-day transaction log for customer
  2. Query FIS CAMS: card dispute records (last 90 days)
  3. Query Salesforce FSC CRM: case history (last 12 months)
  4. Query Verint IVR: call transcripts (if channel = call_centre)
  5. Log each query to audit trail (event_type: "evidence_query")
  6. Write factual evidence_summary
  7. Calculate confidence_score based on evidence completeness

  STP Criteria: evidence found for claimed amounts/dates + confidence ≥ 0.80
  Hard-stops:   vulnerability_flag propagated unchanged from Triage

  Handshake Payload →
  {
    "complaint_id": "<uuid>",
    "transaction_log": [ { "transaction_id": "TXN-001", "amount": 12.99, "source_system": "T24", ... } ],
    "card_disputes": [],
    "crm_history": [],
    "call_transcripts": [],
    "evidence_summary": "Two identical Netflix charges of £12.99 found on same date...",
    "confidence_score": 0.95,
    "data_sources": ["T24", "CAMS", "Salesforce"],
    "processed_at": "2026-03-15T09:14:15Z"
  }
        │
        ▼
══════════════════════════════════════════════════
AGENT 3: POLICY AGENT
══════════════════════════════════════════════════
  Trigger:   Evidence handshake received
  Runtime:   ~10 seconds
  Tools:     context-broker-hybrid-query (FCA rules, precedents, SOPs), audit-logger

  Actions:
  1. Review triage intent + evidence summary
  2. Query Context Studio: FCA DISP rules for this intent_type
  3. Query Context Studio: historical precedents (upholdRate, typical redress)
  4. Determine outcome: Uphold / Partial Uphold / Reject
  5. Calculate redress (scale: £0 · £25 minor · £200 moderate · £500 severe)
  6. Apply HITL rules (redress > £150 → HITL mandatory)
  7. Log policy_decision to audit trail
  8. Write structured reasoning_summary with FCA citation

  STP Criteria: confidence ≥ 0.90 + redress ≤ £150 + no vulnerability
  Hard-stops:   redress > £150 → hitl_required=true (non-negotiable)
                vulnerability_flag=true → hitl_required=true

  Handshake Payload →
  {
    "complaint_id": "<uuid>",
    "outcome": "Uphold",
    "fca_rule_refs": ["fca:DISP_1_4"],
    "redress_amount": 200,
    "redress_currency": "GBP",
    "redress_tier": "moderate",
    "liability_party": "bank",
    "precedent_refs": ["clearview:Precedent_DuplicateCharge"],
    "confidence_score": 0.93,
    "hitl_required": true,
    "reasoning_summary": "Evidence confirms duplicate charge. DISP 1.4 applies. £200 moderate redress.",
    "data_sources": ["context-studio:fca_rules", "context-studio:precedents"],
    "processed_at": "2026-03-15T09:14:25Z"
  }
        │
        ▼
══════════════════════════════════════════════════
AGENT 4: DRAFT AGENT
══════════════════════════════════════════════════
  Trigger:   Policy handshake received
  Runtime:   ~15 seconds
  Tools:     context-broker-hybrid-query (brand voice), notification-service, audit-logger

  Actions:
  1. Check all hard-stop conditions (vulnerability, legal_threat, hitl_required)
  2. Query Context Studio: Clearview brand voice guidelines + letter templates
  3. Write structured resolution letter (empathic, legally precise, non-defensive)
  4. Calculate STP eligibility (confidence ≥ 0.90 + redress ≤ £150 + no vuln + no HITL)
  5. Calculate FCA deadlines (DISP 1.4: +3 days; DISP 1.6: +8 weeks)
  6. Write final audit trail entry (event_type: "draft_complete")
  7. Set dispatch_trigger (true only if stp_eligible=true + all guardrails clear)

  Hard-stops:   vulnerability_flag=true → dispatch_trigger=false (always)
                legal_threat_flag=true → dispatch_trigger=false (always)
                hitl_required=true → stp_eligible=false (always)

  Final Payload →
  {
    "complaint_id": "<uuid>",
    "resolution_letter": "Dear Valued Customer,\n\n...",
    "letter_subject": "Re: Your Complaint Reference <uuid>",
    "redress_package": { "amount": 200, "currency": "GBP", "tier": "moderate", "payment_method": "account_credit" },
    "stp_eligible": false,
    "dispatch_trigger": false,
    "hitl_required": true,
    "audit_trail_id": "<uuid>",
    "fca_deadline": "2026-05-10T09:14:00Z",
    "disp_14_deadline": "2026-03-18T09:14:00Z",
    "confidence_score": 0.93,
    "processed_at": "2026-03-15T09:14:40Z"
  }
        │
        ├── [STP ELIGIBLE] → Auto-dispatch via notification-service
        │                    Status: "dispatched"
        │
        └── [HITL REQUIRED] → Route to Monitoring Workbench review queue
                               Status: "hitl_review"
                               Analyst: Approve / Re-triage / Escalate
```

---

## Escalation Rules

| Condition | Trigger | Action | System |
|---|---|---|---|
| `vulnerability_flag = true` | Triage Agent | Hard-stop → HITL mandatory throughout | Monitoring Workbench |
| `legal_threat_flag = true` | Triage Agent | Stop pipeline → route to Investigations | Escalation queue |
| `redress_amount > £150` | Policy Agent | HITL mandatory — no auto-dispatch | HITL review panel |
| `confidence_score < 0.70` | Any agent | Flag for human review | HITL review panel |
| `priority = P1` AND `disp_14_deadline < 4h` | System | Alert to supervisor | Dashboard P1 alert |
| `fca_deadline < 48h` | System | Auto-alert + auto-escalate to Manager | Dashboard alert |
| `stp_confidence ≥ 0.90` | Draft Agent | Auto-recommend eligible (still subject to guardrails above) | notification-service |

---

## STP vs HITL Decision Matrix

| Condition | STP Eligible | Route |
|---|---|---|
| confidence ≥ 0.90 + redress ≤ £150 + no vuln + no legal | ✅ Yes | Auto-dispatch |
| redress > £150 (any confidence) | ❌ No | HITL mandatory |
| vulnerability_flag = true (any case) | ❌ No | HITL mandatory |
| legal_threat_flag = true | ❌ No | Escalate to Investigations |
| confidence < 0.70 (any case) | ❌ No | HITL review |
| P1 priority | ❌ No | HITL mandatory |

---

## Performance Targets vs As-Is

| Metric | As-Is | To-Be Target |
|---|---|---|
| End-to-end cycle time (STP) | 7–10 days | < 2 minutes |
| End-to-end cycle time (HITL) | 7–10 days | < 4 hours (analyst review) |
| Evidence gathering time | 2.5 hours avg | < 30 seconds (agentic) |
| Routing accuracy | 60% correct | 100% (intent classifier) |
| Vulnerable customer detection | ~40% | 100% (13-category classifier) |
| Cost per case | £48 | ~£24 (50% reduction) |
| FCA DISP compliance | At risk (£12M exposure) | 100% deadline tracking |
| STP rate (auto-dispatch) | 0% | Target 30–40% of volume |
