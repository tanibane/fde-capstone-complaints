"""
draft_agent.py — Draft Agent Implementation
Clearview Retail Bank — Agentic Complaints Management

Generates: resolution letter · STP eligibility · audit trail · dispatch trigger
"""
import json
import os
from datetime import datetime, timedelta
import anthropic

_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def run_draft(ctx: dict, client: anthropic.Anthropic) -> dict:
    """Execute the Draft Agent — generates resolution letter and sets dispatch trigger."""

    complaint_id = ctx["complaint_id"]
    policy = ctx["policy_output"]
    triage = ctx["triage_output"]
    vulnerability_flag = triage.get("vulnerability_flag", False)
    legal_threat_flag = triage.get("legal_threat_flag", False)
    hitl_required = policy.get("hitl_required", True)
    outcome = policy.get("outcome", "Uphold")
    redress = policy.get("redress_amount", 0)
    fca_rule = (policy.get("fca_rule_refs") or ["fca:DISP_1_4"])[0]
    now = datetime.utcnow().isoformat() + "Z"

    created = datetime.utcnow()
    disp14 = (created + timedelta(days=3)).isoformat() + "Z"
    fca_deadline = (created + timedelta(weeks=8)).isoformat() + "Z"

    prompt = f"""You are a bank complaints resolution letter writer. Write a professional letter and return ONLY a JSON object.

Complaint ID: {complaint_id}
Outcome: {outcome}
Redress amount: £{redress}
FCA rule: {fca_rule}
Complaint text: {ctx.get('complaint_text', '')}

Return exactly this JSON with no extra text:
{{
  "complaint_id": "{complaint_id}",
  "resolution_letter": "Dear Valued Customer,\\n\\nThank you for contacting Clearview Retail Bank regarding your complaint (Reference: {complaint_id}).\\n\\nHaving reviewed your account records and the evidence provided, we have reached the following decision: {outcome}.\\n\\nIn accordance with {fca_rule}, we have assessed your complaint and determined that a redress payment of £{redress} is appropriate. This will be credited to your account within 3-5 business days.\\n\\nIf you are not satisfied with our response, you have the right to refer your complaint to the Financial Ombudsman Service (FOS) within 6 months. Contact FOS at www.financial-ombudsman.org.uk or 0800 023 4567.\\n\\nYours sincerely,\\nClearview Retail Bank — Customer Relations Team",
  "letter_subject": "Re: Your Complaint Reference {complaint_id}",
  "redress_package": {{
    "amount": {redress},
    "currency": "GBP",
    "tier": "{policy.get('redress_tier', 'minor')}",
    "payment_method": "account_credit"
  }},
  "stp_eligible": false,
  "dispatch_trigger": false,
  "hitl_required": {str(hitl_required).lower()},
  "audit_trail_id": null,
  "fca_deadline": "{fca_deadline}",
  "disp_14_deadline": "{disp14}",
  "confidence_score": 0.88,
  "data_sources": ["context-studio:brand_voice"],
  "processed_at": "{now}"
}}

Return ONLY the JSON. No other text."""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
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

    output = json.loads(raw)

    # Server-side STP and dispatch guardrails
    stp_eligible = (
        float(policy.get("confidence_score", 0)) >= 0.9
        and not vulnerability_flag
        and float(policy.get("redress_amount", 0)) <= 150
        and not hitl_required
    )
    output["stp_eligible"] = stp_eligible
    output["hitl_required"] = hitl_required
    output["dispatch_trigger"] = stp_eligible and not vulnerability_flag and not legal_threat_flag
    output["fca_deadline"] = fca_deadline
    output["disp_14_deadline"] = disp14
    output["complaint_id"] = complaint_id
    output["audit_trail_id"] = None

    return output
