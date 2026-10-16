"""
triage_agent.py — Triage Agent Implementation
Clearview Retail Bank — Agentic Complaints Management

Classifies: intent · priority · vulnerability · sentiment · legal threat
"""
import json
import os
from datetime import datetime
import anthropic

_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def run_triage(ctx: dict, client: anthropic.Anthropic) -> dict:
    """Execute the Triage Agent against the complaint context."""

    complaint_id = ctx["complaint_id"]
    complaint_text = ctx["complaint_text"]
    channel = ctx["channel"]
    now = datetime.utcnow().isoformat() + "Z"

    prompt = f"""You are a bank complaints triage agent. Analyse this complaint and return ONLY a JSON object with no extra text, no markdown, no code blocks.

Complaint ID: {complaint_id}
Channel: {channel}
Text: {complaint_text}

Return exactly this JSON structure:
{{
  "complaint_id": "{complaint_id}",
  "priority": "P2",
  "intent_type": "duplicate_charge",
  "vulnerability_flag": false,
  "vulnerability_markers": [],
  "sentiment_score": 0.5,
  "channel_weight": 0.8,
  "confidence_score": 0.9,
  "hitl_required": false,
  "legal_threat_flag": false,
  "data_sources": ["complaint_text_analysis"],
  "reasoning_summary": "brief explanation here",
  "processed_at": "{now}"
}}

Rules for priority:
- P1 if vulnerability detected or intent is unauthorised_transaction
- P2 if intent is duplicate_charge or atm_failure
- P3 for all others

Rules for intent_type (pick one): duplicate_charge, atm_failure, unauthorised_transaction, mortgage_dispute, account_closure, data_privacy, other

Rules for vulnerability_flag: set true if text mentions bereavement, mental health, disability, financial hardship, job loss, elderly, limited English, caring responsibilities, addiction, trauma

Return ONLY the JSON. No other text."""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[
            {"role": "user", "content": prompt},
        ],
    )

    raw = response.content[0].text.strip()

    # Strip markdown code blocks if present
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
    if output.get("vulnerability_flag") is True:
        output["hitl_required"] = True
        output["priority"] = "P1"

    if float(output.get("confidence_score", 0)) < 0.7:
        output["hitl_required"] = True

    output["complaint_id"] = ctx["complaint_id"]
    return output
