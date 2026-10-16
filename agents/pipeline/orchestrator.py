"""
orchestrator.py — 4-Agent Pipeline Orchestrator
Clearview Retail Bank — Agentic Complaints Management

Chains: Triage → Evidence → Policy → Draft
Each agent receives the full complaint context + all prior outputs.
Hard-stops enforced before each stage transition.
"""

import json
import os
import sys
from dataclasses import dataclass, asdict
from typing import Optional

def log(msg):
    """Print to stderr so stdout stays clean JSON for the Node.js parser."""
    print(msg, file=sys.stderr, flush=True)

# Add project root to path so 'agents' module is found
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import anthropic

# Agent modules
from agents.pipeline.triage_agent import run_triage
from agents.pipeline.evidence_agent import run_evidence
from agents.pipeline.policy_agent import run_policy
from agents.pipeline.draft_agent import run_draft

client = anthropic.Anthropic(
    api_key=os.environ.get("ANTHROPIC_AUTH_TOKEN", ""),
    base_url=os.environ.get("ANTHROPIC_BASE_URL", "https://api.anthropic.com"),
)


def _call(stage_fn, ctx_dict):
    """Run an agent stage; retry once if the model returned malformed JSON."""
    try:
        return stage_fn(ctx_dict, client)
    except json.JSONDecodeError as e:
        log(f"[orchestrator] Malformed JSON from model ({e}); retrying once")
        return stage_fn(ctx_dict, client)


@dataclass
class PipelineContext:
    complaint_id: str
    customer_id: str
    channel: str
    complaint_text: str
    created_at: str
    customer_tier: str = "standard"
    triage_output: Optional[dict] = None
    evidence_output: Optional[dict] = None
    policy_output: Optional[dict] = None
    draft_output: Optional[dict] = None
    pipeline_status: str = "started"
    error: Optional[str] = None


def run_pipeline(complaint: dict) -> dict:
    """
    Run the full 4-agent pipeline for a complaint.
    Returns the complete pipeline context including all agent outputs.
    """
    ctx = PipelineContext(
        complaint_id=complaint["complaint_id"],
        customer_id=complaint["customer_id"],
        channel=complaint["channel"],
        complaint_text=complaint["complaint_text"],
        created_at=complaint["created_at"],
        customer_tier=complaint.get("customer_tier", "standard"),
    )

    log(f"[orchestrator] Starting pipeline for complaint {ctx.complaint_id}")

    # ── STAGE 1: Triage ───────────────────────────────────────────────────────
    try:
        log(f"[orchestrator] Stage 1: Triage")
        ctx.triage_output = _call(run_triage, asdict(ctx))
        log(f"[orchestrator] Triage complete: priority={ctx.triage_output['priority']}, "
              f"intent={ctx.triage_output['intent_type']}, "
              f"vulnerability={ctx.triage_output['vulnerability_flag']}")

        # Hard-stop: vulnerability flag requires HITL — still run evidence but flag propagates
        if ctx.triage_output["vulnerability_flag"]:
            log(f"[orchestrator] ⚠️  VULNERABILITY FLAG DETECTED — HITL mandatory throughout pipeline")

        # Hard-stop: legal threat routes to Investigations after triage
        if ctx.triage_output.get("legal_threat_flag"):
            log(f"[orchestrator] ⚠️  LEGAL THREAT DETECTED — routing to Investigations")
            ctx.pipeline_status = "escalated"
            return _build_result(ctx)

    except Exception as e:
        ctx.pipeline_status = "failed"
        ctx.error = f"Triage failed: {str(e)}"
        return _build_result(ctx)

    # ── STAGE 2: Evidence ─────────────────────────────────────────────────────
    try:
        log(f"[orchestrator] Stage 2: Evidence gathering")
        ctx.evidence_output = _call(run_evidence, asdict(ctx))
        log(f"[orchestrator] Evidence complete: "
              f"{len(ctx.evidence_output.get('transaction_log', []))} transactions, "
              f"{len(ctx.evidence_output.get('card_disputes', []))} disputes")

    except Exception as e:
        ctx.pipeline_status = "failed"
        ctx.error = f"Evidence stage failed: {str(e)}"
        return _build_result(ctx)

    # ── STAGE 3: Policy ───────────────────────────────────────────────────────
    try:
        log(f"[orchestrator] Stage 3: Policy assessment")
        ctx.policy_output = _call(run_policy, asdict(ctx))
        log(f"[orchestrator] Policy complete: outcome={ctx.policy_output['outcome']}, "
              f"redress=£{ctx.policy_output['redress_amount']}, "
              f"hitl_required={ctx.policy_output['hitl_required']}, "
              f"confidence={ctx.policy_output['confidence_score']}")

    except Exception as e:
        ctx.pipeline_status = "failed"
        ctx.error = f"Policy stage failed: {str(e)}"
        return _build_result(ctx)

    # ── STAGE 4: Draft ────────────────────────────────────────────────────────
    try:
        log(f"[orchestrator] Stage 4: Draft resolution letter")
        ctx.draft_output = _call(run_draft, asdict(ctx))
        log(f"[orchestrator] Draft complete: stp_eligible={ctx.draft_output['stp_eligible']}, "
              f"dispatch_trigger={ctx.draft_output['dispatch_trigger']}, "
              f"audit_trail_id={ctx.draft_output.get('audit_trail_id')}")

    except Exception as e:
        ctx.pipeline_status = "failed"
        ctx.error = f"Draft stage failed: {str(e)}"
        return _build_result(ctx)

    # ── Pipeline complete ─────────────────────────────────────────────────────
    ctx.pipeline_status = (
        "stp_complete" if ctx.draft_output.get("stp_eligible")
        else "hitl_required"
    )
    log(f"[orchestrator] Pipeline complete. Status: {ctx.pipeline_status}")
    return _build_result(ctx)


def _build_result(ctx: PipelineContext) -> dict:
    return {
        "complaint_id": ctx.complaint_id,
        "pipeline_status": ctx.pipeline_status,
        "error": ctx.error,
        "triage_output": ctx.triage_output,
        "evidence_output": ctx.evidence_output,
        "policy_output": ctx.policy_output,
        "draft_output": ctx.draft_output,
    }


if __name__ == "__main__":
    # Accept complaint JSON from stdin for direct invocation
    complaint = json.loads(sys.stdin.read())
    result = run_pipeline(complaint)
    sys.stdout.write(json.dumps(result, default=str))
    sys.stdout.flush()
