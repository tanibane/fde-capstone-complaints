# As-Is Process: Clearview Retail Bank — Manual Complaints Handling
# Process Studio | Version 1.0 | IBM Consulting 2026

---

## Overview

Clearview processes **50,000+ complaints per month** through a fully manual workflow spanning
5 departments and 4 separate IT systems. The current state is characterised by siloed handoffs,
inconsistent routing, and heavy analyst workload — creating significant FCA compliance risk.

---

## Process Map: Step-by-Step

```
Customer Complaint Received
        │
        ▼
[STEP 1] Intake & Logging                      ← Manual data entry into Salesforce CRM
        │  Actor: Front-line staff (branch / call centre)
        │  Systems: Salesforce FSC, email inbox, social media monitor
        │  Time: 15–30 min
        │  Pain: No structured intake form. Free-text notes.
        │        Social media complaints often logged next-day.
        │
        ▼
[STEP 2] Manual Triage & Routing               ← Analyst reads complaint and assigns manually
        │  Actor: Triage Analyst (Band 5)
        │  Systems: Salesforce FSC (CRM), internal routing spreadsheet
        │  Time: 20–45 min
        │  Pain: 40% mis-routing rate — wrong team assigned on first pass.
        │        Vulnerable customers NOT consistently identified at this stage.
        │        No SLA clock started reliably.
        │
        ▼
[STEP 3] Evidence Gathering                    ← Analyst manually queries 3–4 systems
        │  Actor: Complaints Analyst (Band 5/6)
        │  Systems: Temenos T24 CBS, FIS CAMS, Salesforce FSC, Verint IVR
        │  Time: 60–180 min (avg 2.5 hours)
        │  Pain: Analysts spend 60%+ time on this step alone.
        │        Each system requires separate login and export.
        │        No single view of customer evidence.
        │        Call recordings take 24–48h to retrieve from Verint.
        │
        ▼
[STEP 4] Policy Look-up & Decision             ← Analyst reviews static PDF policy manuals
        │  Actor: Senior Analyst or Lead (Band 6/7)
        │  Systems: SharePoint (policy PDFs), precedent emails
        │  Time: 30–90 min
        │  Pain: Static PDFs — no search, no versioning.
        │        Inconsistent redress amounts for same complaint types.
        │        FCA DISP rule misapplication (DISP 1.4 vs 1.6 confusion).
        │        Senior sign-off required for redress > £150 → bottleneck.
        │
        ▼
[STEP 5] Response Drafting                     ← Manual letter composition
        │  Actor: Analyst / Lead
        │  Systems: Word template library (SharePoint), email client
        │  Time: 30–60 min
        │  Pain: Letter quality inconsistent. Brand voice not enforced.
        │        FOS referral rights sometimes omitted.
        │        No audit trail of letter changes.
        │
        ▼
[STEP 6] Manager Approval                      ← Manual sign-off for high-value / high-risk cases
        │  Actor: Complaints Manager (Band 8)
        │  Systems: Email approval chain
        │  Time: 4–24 hours (awaiting manager availability)
        │  Pain: Single point of failure. Bottleneck for P1 cases.
        │        No visibility into what's awaiting approval.
        │
        ▼
[STEP 7] Dispatch & Closure
           Actor: Analyst
           Systems: Salesforce FSC (update), email client
           Time: 15–30 min
           Pain: FCA deadline tracking manual — Excel spreadsheet updated weekly.
                 Closure confirmation not always sent to customer.
```

---

## Timing Data

| Step | Min Time | Max Time | Avg Time | % of Total |
|---|---|---|---|---|
| Intake & Logging | 15 min | 30 min | 20 min | 5% |
| Triage & Routing | 20 min | 45 min | 30 min | 12% |
| Evidence Gathering | 60 min | 180 min | 150 min | 60% |
| Policy Look-up & Decision | 30 min | 90 min | 55 min | 15% |
| Response Drafting | 30 min | 60 min | 40 min | 10% |
| Manager Approval | 240 min | 1440 min | 480 min | — (blocking) |
| Dispatch & Closure | 15 min | 30 min | 20 min | 5% |
| **Total (excl. blocking)** | **170 min** | **435 min** | **295 min** | — |
| **Total (incl. approval)** | **410 min** | **1875 min** | **7–10 days** | — |

---

## Routing Error Analysis

| Error Type | Frequency | Impact |
|---|---|---|
| Wrong team assigned at triage | 40% of all complaints | Re-routing adds 2–4 days |
| Vulnerable customer not flagged at intake | ~60% of vulnerable cases | FCA Consumer Duty risk |
| Incorrect SLA tier assigned | 25% of P1 cases | DISP 1.4 breach risk |
| FCA DISP rule misapplied (1.4 vs 1.6) | 12% of final responses | Regulatory exposure |

---

## Bottleneck Annotations

```
CRITICAL BOTTLENECK 1 — Evidence Gathering (Step 3)
  ▸ Accounts for 60% of analyst time
  ▸ Requires access to 4 disconnected systems
  ▸ 24–48h delay for Verint call recording retrieval
  ▸ Agentic fix: Evidence Agent runs all 4 queries in <30 seconds

CRITICAL BOTTLENECK 2 — Manager Approval (Step 6)
  ▸ Adds 4–24 hours to every high-value case
  ▸ No visibility into approval queue
  ▸ Single approver = single point of failure
  ▸ Agentic fix: HITL panel with instant digital approval routing

COMPLIANCE RISK — Vulnerable Customer Identification (Step 2)
  ▸ ~60% of vulnerable customers NOT flagged at intake
  ▸ FCA Consumer Duty exposure
  ▸ Agentic fix: Triage Agent applies 13-category FCA classifier at intake
```

---

## Cost Analysis

| Metric | Current State |
|---|---|
| Avg cost per case | £48 |
| Monthly complaint volume | 50,000+ |
| Monthly cost | ~£2.4M |
| FCA fine exposure (2026) | £12M |
| Staff capacity consumed by evidence gathering | 60% |
| Analyst FTE equivalent on evidence tasks | ~80 FTE |
