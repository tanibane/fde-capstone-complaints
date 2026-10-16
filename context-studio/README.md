# Context Studio — Ontology Documentation
# Clearview Retail Bank — Agentic Complaints Management

## Overview

The `ontology.jsonld` file defines the knowledge graph ingested into Context Studio.
It covers 4 domains and contains 30+ named nodes with typed relationships.

## Domains

| Domain | Nodes | Purpose |
|---|---|---|
| Bank Profile | 10 | Customer tiers, redress authority, brand voice |
| IT Landscape | 6 | T24, CAMS, Salesforce, Verint, PostgreSQL |
| FCA Regulatory | 12 | DISP 1.4/1.6, Consumer Duty, SLA tiers, redress scale, escalation rules, 13 vulnerability markers |
| Historical Precedents | 5 | Decision archive, 3 intent-type precedents, seasonal patterns |

## Hybrid Query Examples

### Query 1 — FCA Policy for Duplicate Charge
```
Find the FCA DISP rule that applies to duplicate_charge complaints
and return the required resolution deadline and applicable redress scale.
```
**Expected graph path:** `clearview:Precedent_DuplicateCharge → fca:DISP_1_4 → clearview:SLA_P2 → clearview:RedressScale_Moderate`  
**Expected result:** DISP 1.4, 3-day SRC deadline, £200 moderate redress

---

### Query 2 — Vulnerable Customer Guardrail Check
```
A customer complaint has been received from a customer flagged with
"Recent bereavement" in their KYC profile. What escalation rules apply?
```
**Expected graph path:** `clearview:VulnerabilityMarkers → clearview:HITLRule_VulnerableCustomer`  
**Expected result:** Hard-stop triggered, auto-dispatch blocked, HITL mandatory, P1 SLA applies

---

### Query 3 — Redress Calculation Logic
```
An unauthorised transaction complaint is upheld. The customer is Wealth tier.
What is the maximum redress the assigned analyst can approve without escalation?
```
**Expected graph path:** `clearview:CustomerTier_Wealth → clearview:RedressAuthority_Manager → clearview:RedressScale_Severe`  
**Expected result:** Manager authority up to £1,000; severe redress scale £500; HITL required if > £150 per pipeline rule
