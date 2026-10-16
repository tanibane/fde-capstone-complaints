"""
policy_agent.py — Policy Agent Implementation
Clearview Retail Bank — Agentic Complaints Management

Applies: FCA DISP rules · redress calculation · outcome recommendation
"""
import json
import os
from datetime import datetime
import anthropic

_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def run_policy(ctx: dict, client: anthropic.Anthropic) -> dict:
    """Execute the Policy Agent — determines outcome, redress, and HITL requirement."""

    complaint_id = ctx["complaint_id"]
    intent_type = ctx["triage_output"]["intent_type"]
    evidence_summary = ctx["evidence_output"].get("evidence_summary", "")
    vulnerability_flag = ctx["triage_output"].get("vulnerability_flag", False)
    now = datetime.utcnow().isoformat() + "Z"

    # FCA rule and redress lookup by intent
    rules = {
        "duplicate_charge":         ("fca:DISP_1_4", "Uphold", 200, "moderate"),
        "unauthorised_transaction":  ("fca:DISP_1_4", "Uphold", 500, "severe"),
        "atm_failure":              ("fca:DISP_1_4", "Uphold", 25,  "minor"),
        "mortgage_dispute":         ("fca:DISP_1_6", "Partial Uphold", 200, "moderate"),
        "account_closure":          ("fca:DISP_1_4", "Uphold", 25,  "minor"),
        "data_privacy":             ("fca:ConsumerDuty", "Partial Uphold", 200, "moderate"),
        "other":                    ("fca:DISP_1_4", "Partial Uphold", 25, "minor"),
    }
    fca_rule, default_outcome, default_redress, default_tier = rules.get(
        intent_type, ("fca:DISP_1_4", "Partial Uphold", 25, "minor")
    )

    prompt = f"""You are a bank complaints policy agent. Assess this complaint and return ONLY a JSON object.

Intent type: {intent_type}
Evidence summary: {evidence_summary}
Vulnerability flag: {vulnerability_flag}
FCA rule that applies: {fca_rule}
Typical outcome for this intent: {default_outcome}
Typical redress: £{default_redress}

Return exactly this JSON with no extra text:
{{
  "complaint_id": "{complaint_id}",
  "outcome": "{default_outcome}",
  "fca_rule_refs": ["{fca_rule}"],
  "redress_amount": {default_redress},
  "redress_currency": "GBP",
  "redress_tier": "{default_tier}",
  "liability_party": "bank",
  "precedent_refs": [],
  "sop_refs": [],
  "confidence_score": 0.88,
  "hitl_required": false,
  "reasoning_summary": "write a 1-2 sentence explanation of the policy decision",
  "data_sources": ["context-studio:fca_rules"],
  "processed_at": "{now}"
}}

Return ONLY the JSON. No other text."""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[
            {"role": "user", "content": prompt},
        ],
    )

    raw = response.content[0].text.strip()

    if "```" in raw:
        parts = raw.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            if part.startswith("{"):
                raw = part
                break

    output = json.loads(raw, strict=False)

    # Server-side guardrails
    if float(output.get("redress_amount", 0)) > 150:
        output["hitl_required"] = True
    if vulnerability_flag:
        output["hitl_required"] = True
    if float(output.get("confidence_score", 0)) < 0.7:
        output["hitl_required"] = True
    if output.get("outcome") != "Reject" and not output.get("fca_rule_refs"):
        output["fca_rule_refs"] = [fca_rule]

    output["complaint_id"] = complaint_id
    return output
