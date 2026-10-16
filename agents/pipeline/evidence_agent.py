"""
evidence_agent.py — Evidence Agent Implementation
Clearview Retail Bank — Agentic Complaints Management

Gathers: T24 transactions · CAMS card disputes · Salesforce CRM · Verint transcripts
"""
import json
import os
from datetime import datetime
import anthropic

_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def run_evidence(ctx: dict, client: anthropic.Anthropic) -> dict:
    """Execute the Evidence Agent — gathers mock evidence and summarises."""

    complaint_id = ctx["complaint_id"]
    complaint_text = ctx["complaint_text"]
    intent_type = ctx["triage_output"]["intent_type"]
    customer_id = ctx["customer_id"]
    now = datetime.utcnow().isoformat() + "Z"

    # Generate mock evidence based on intent type
    transaction_log = _mock_transactions(customer_id, intent_type)
    card_disputes = _mock_disputes(customer_id, intent_type)

    prompt = f"""You are a bank complaints evidence agent. Review the evidence and return ONLY a JSON object.

Complaint: {complaint_text}
Intent: {intent_type}
Customer: {customer_id}
Transactions found: {json.dumps(transaction_log)}
Card disputes found: {json.dumps(card_disputes)}

Return exactly this JSON with no extra text:
{{
  "complaint_id": "{complaint_id}",
  "transaction_log": {json.dumps(transaction_log)},
  "card_disputes": {json.dumps(card_disputes)},
  "crm_history": [],
  "call_transcripts": [],
  "evidence_summary": "write a 1-2 sentence factual summary of what the evidence shows",
  "confidence_score": 0.9,
  "data_sources": ["T24", "CAMS"],
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

    output = json.loads(raw)
    output["complaint_id"] = complaint_id
    return output


def _mock_transactions(customer_id: str, intent_type: str) -> list:
    seed = ord(customer_id[-1]) if customer_id else 49
    if intent_type == "duplicate_charge":
        return [
            {"transaction_id": f"TXN-001-{seed}", "date": "2026-01-03",
             "amount": 12.99, "currency": "GBP", "description": "NETFLIX SUBSCRIPTION",
             "merchant_id": "NETFLIX-UK-001", "source_system": "T24"},
            {"transaction_id": f"TXN-002-{seed}", "date": "2026-01-03",
             "amount": 12.99, "currency": "GBP", "description": "NETFLIX SUBSCRIPTION",
             "merchant_id": "NETFLIX-UK-001", "source_system": "T24"},
        ]
    elif intent_type == "unauthorised_transaction":
        return [
            {"transaction_id": f"TXN-003-{seed}", "date": "2026-01-05",
             "amount": 350.0, "currency": "GBP", "description": "ONLINE RETAILER",
             "merchant_id": "UNKNOWN-001", "source_system": "T24"},
        ]
    elif intent_type == "atm_failure":
        return [
            {"transaction_id": f"TXN-004-{seed}", "date": "2026-01-10",
             "amount": 100.0, "currency": "GBP", "description": "ATM WITHDRAWAL",
             "merchant_id": "ATM-001", "source_system": "T24"},
        ]
    return []


def _mock_disputes(customer_id: str, intent_type: str) -> list:
    if intent_type in ["unauthorised_transaction", "atm_failure"]:
        seed = ord(customer_id[-1]) if customer_id else 49
        return [
            {"dispute_id": f"DISP-{seed}", "date_raised": "2026-01-06",
             "amount": 350.0, "currency": "GBP", "status": "open",
             "merchant_id": "UNKNOWN-001", "source_system": "CAMS"},
        ]
    return []
