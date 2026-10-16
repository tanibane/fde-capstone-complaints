/**
 * server.ts — Express API Server
 * Clearview Retail Bank — Agentic Complaints Management
 */
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: "../.env" });

const PROJECT_ROOT = path.resolve(__dirname, "../../");

import express from "express";
import cors from "cors";
import { Pool } from "pg";
import { randomUUID, createHash } from "crypto";
import { spawn } from "child_process";

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
app.use(cors());
app.use(express.json());

// Append-only audit entry with SHA-256 hash of the payload (tamper-evidence)
async function writeAudit(complaintId: string, eventType: string, agentName: string | null,
                          payload: any, confidence: number | null, dataSources: any[] = []) {
  try {
    const body = JSON.stringify(payload ?? {});
    const hash = createHash("sha256").update(body).digest("hex");
    await pool.query(
      `INSERT INTO audit_log (complaint_id,event_type,agent_name,payload,confidence_score,data_sources,entry_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [complaintId, eventType, agentName, body, confidence, JSON.stringify(dataSources || []), hash]
    );
  } catch (e) { console.error("[audit] write error:", e); }
}

// ── POST /complaints — Intake a new complaint ─────────────────────────────────
app.post("/complaints", async (req, res) => {
  const { customer_id, channel, complaint_text, customer_tier } = req.body;
  if (!customer_id || !channel || !complaint_text) {
    return res.status(422).json({ error: "Missing required fields: customer_id, channel, complaint_text" });
  }
  const complaint_id = randomUUID();
  const created_at = new Date().toISOString();
  const fca_deadline = new Date(Date.now() + 56 * 24 * 60 * 60 * 1000).toISOString();
  const disp_14_deadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  await pool.query(
    `INSERT INTO complaints (complaint_id,customer_id,channel,complaint_text,status,fca_deadline,disp_14_deadline,created_at)
     VALUES ($1,$2,$3,$4,'intake',$5,$6,$7)`,
    [complaint_id, customer_id, channel, complaint_text, fca_deadline, disp_14_deadline, created_at]
  );
  res.status(201).json({ complaint_id, created_at, status: "intake" });
});

// ── GET /complaints — List complaints with filters ────────────────────────────
app.get("/complaints", async (req, res) => {
  const { priority, status, channel, vulnerability, limit = 50, offset = 0 } = req.query;
  const conditions: string[] = [];
  const params: any[] = [];
  let i = 1;

  if (priority) { conditions.push(`c.priority = $${i++}`); params.push(priority); }
  if (status) { conditions.push(`c.status = $${i++}`); params.push(status); }
  if (channel) { conditions.push(`c.channel = $${i++}`); params.push(channel); }
  if (vulnerability === "true") { conditions.push(`c.vulnerability_flag = true`); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  params.push(Number(limit), Number(offset));

  const result = await pool.query(
    `SELECT c.*, cu.full_name, cu.tier FROM complaints c
     LEFT JOIN customers cu ON c.customer_id = cu.customer_id
     ${where} ORDER BY c.created_at DESC LIMIT $${i} OFFSET $${i + 1}`,
    params
  );
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM complaints c LEFT JOIN customers cu ON c.customer_id = cu.customer_id ${where}`,
    params.slice(0, -2)
  );
  res.json({ complaints: result.rows, total: parseInt(countResult.rows[0].count) });
});

// ── GET /complaints/:id — Get single complaint with all agent outputs ─────────
app.get("/complaints/:id", async (req, res) => {
  const { id } = req.params;
  const c = await pool.query("SELECT * FROM complaints WHERE complaint_id = $1", [id]);
  if (!c.rows.length) return res.status(404).json({ error: "Not found" });

  const [triage, evidence, policy, draft, hitl] = await Promise.all([
    pool.query("SELECT * FROM triage_outputs WHERE complaint_id = $1", [id]),
    pool.query("SELECT * FROM evidence_outputs WHERE complaint_id = $1", [id]),
    pool.query("SELECT * FROM policy_outputs WHERE complaint_id = $1", [id]),
    pool.query("SELECT * FROM draft_outputs WHERE complaint_id = $1", [id]),
    pool.query("SELECT * FROM hitl_reviews WHERE complaint_id = $1 ORDER BY reviewed_at DESC", [id]),
  ]);

  res.json({
    complaint: c.rows[0],
    triage_output: triage.rows[0] || null,
    evidence_output: evidence.rows[0] || null,
    policy_output: policy.rows[0] || null,
    draft_output: draft.rows[0] || null,
    hitl_reviews: hitl.rows,
  });
});

// ── POST /pipeline/run/:complaintId — Trigger the 4-agent pipeline ────────────
app.post("/pipeline/run/:complaintId", async (req, res) => {
  const { complaintId } = req.params;
  const c = await pool.query("SELECT * FROM complaints WHERE complaint_id = $1", [complaintId]);
  if (!c.rows.length) return res.status(404).json({ error: "Complaint not found" });

  const complaint = c.rows[0];
  await pool.query("UPDATE complaints SET status='triaging' WHERE complaint_id=$1", [complaintId]);

  // Run Python orchestrator as subprocess
  const orchestrator = spawn("python", [path.join(PROJECT_ROOT, "agents/pipeline/orchestrator.py")], {
    cwd: PROJECT_ROOT,
    env: { ...process.env },
  });

  orchestrator.stdin.write(JSON.stringify(complaint));
  orchestrator.stdin.end();

  let output = "";
  orchestrator.stdout.on("data", (d) => (output += d));
  orchestrator.stderr.on("data", (d) => console.error("[pipeline]", d.toString()));

  orchestrator.on("close", async (code) => {
    if (code !== 0) {
      await pool.query("UPDATE complaints SET status='intake' WHERE complaint_id=$1", [complaintId]);
      return res.status(500).json({ error: "Pipeline execution failed" });
    }
    try {
      const result = JSON.parse(output);

      // Persist agent outputs to DB — wrapped in try/catch so DB errors don't break response
      if (result.triage_output) {
        const t = result.triage_output;
        try {
          await pool.query(`DELETE FROM triage_outputs WHERE complaint_id=$1`, [complaintId]);
          await pool.query(
            `INSERT INTO triage_outputs (complaint_id,priority,intent_type,vulnerability_flag,
             vulnerability_markers,sentiment_score,channel_weight,confidence_score,hitl_required,
             legal_threat_flag,data_sources,reasoning_summary)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [complaintId, t.priority, t.intent_type, t.vulnerability_flag,
             JSON.stringify(t.vulnerability_markers || []), Math.min(1, Math.max(0, Number(t.sentiment_score) || 0)), t.channel_weight || 0.8,
             t.confidence_score, t.hitl_required, t.legal_threat_flag,
             JSON.stringify(t.data_sources || []), t.reasoning_summary]
          );
          await pool.query(
            `UPDATE complaints SET priority=$1, intent_type=$2, vulnerability_flag=$3, legal_threat_flag=$4 WHERE complaint_id=$5`,
            [t.priority, t.intent_type, t.vulnerability_flag, t.legal_threat_flag, complaintId]
          );
        } catch(dbErr) { console.error("[pipeline] triage DB save error:", dbErr); }
      }

      if (result.policy_output) {
        const p = result.policy_output;
        try {
          await pool.query(`DELETE FROM policy_outputs WHERE complaint_id=$1`, [complaintId]);
          await pool.query(
            `INSERT INTO policy_outputs (complaint_id,outcome,fca_rule_refs,redress_amount,redress_currency,
             redress_tier,liability_party,precedent_refs,confidence_score,hitl_required,reasoning_summary,data_sources)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [complaintId, p.outcome, JSON.stringify(p.fca_rule_refs || []), p.redress_amount,
             p.redress_currency || "GBP", p.redress_tier, p.liability_party,
             JSON.stringify(p.precedent_refs || []), p.confidence_score, p.hitl_required,
             p.reasoning_summary, JSON.stringify(p.data_sources || [])]
          );
        } catch(dbErr) { console.error("[pipeline] policy DB save error:", dbErr); }
      }

      if (result.evidence_output) {
        const ev = result.evidence_output;
        try {
          await pool.query(`DELETE FROM evidence_outputs WHERE complaint_id=$1`, [complaintId]);
          await pool.query(
            `INSERT INTO evidence_outputs (complaint_id,transaction_log,card_disputes,crm_history,
             call_transcripts,evidence_summary,confidence_score,data_sources)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [complaintId, JSON.stringify(ev.transaction_log || []), JSON.stringify(ev.card_disputes || []),
             JSON.stringify(ev.crm_history || []), JSON.stringify(ev.call_transcripts || []),
             ev.evidence_summary, ev.confidence_score ?? 0.8, JSON.stringify(ev.data_sources || [])]
          );
        } catch(dbErr) { console.error("[pipeline] evidence DB save error:", dbErr); }
      }

      // Vulnerable customers always require human review (guardrail enforced server-side)
      const hitlNeeded = !!(result.draft_output?.hitl_required || result.triage_output?.vulnerability_flag);

      if (result.draft_output) {
        const d = result.draft_output;
        try {
          await pool.query(`DELETE FROM draft_outputs WHERE complaint_id=$1`, [complaintId]);
          await pool.query(
            `INSERT INTO draft_outputs (complaint_id,resolution_letter,letter_subject,redress_package,
             stp_eligible,dispatch_trigger,hitl_required,fca_deadline,disp_14_deadline,confidence_score,data_sources)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [complaintId, d.resolution_letter, d.letter_subject, JSON.stringify(d.redress_package || {}),
             !!d.stp_eligible && !hitlNeeded, !!d.dispatch_trigger && !hitlNeeded, hitlNeeded,
             d.fca_deadline, d.disp_14_deadline, d.confidence_score ?? 0.8, JSON.stringify(d.data_sources || [])]
          );
        } catch(dbErr) { console.error("[pipeline] draft DB save error:", dbErr); }
      }

      // Audit trail (append-only; each entry carries a SHA-256 of its payload)
      await writeAudit(complaintId, "intake", "intake", { channel: complaint.channel, customer_id: complaint.customer_id }, null);
      if (result.triage_output) await writeAudit(complaintId, "triage_decision", "triage", result.triage_output,
        result.triage_output.confidence_score, result.triage_output.data_sources);
      if (result.evidence_output) await writeAudit(complaintId, "evidence_query", "evidence", result.evidence_output,
        result.evidence_output.confidence_score, result.evidence_output.data_sources);
      if (result.policy_output) await writeAudit(complaintId, "policy_decision", "policy", result.policy_output,
        result.policy_output.confidence_score, result.policy_output.data_sources);
      if (result.draft_output) await writeAudit(complaintId, "draft_complete", "draft",
        { ...result.draft_output, hitl_required: hitlNeeded },
        result.draft_output.confidence_score, result.draft_output.data_sources);
      if (result.pipeline_status === "escalated") await writeAudit(complaintId, "escalation", "orchestrator",
        { reason: "legal_threat_flag", route: "Investigations" }, null);

      const finalStatus = result.pipeline_status === "escalated" ? "escalated"
        : hitlNeeded ? "hitl_review" : "dispatched";
      await pool.query("UPDATE complaints SET status=$1 WHERE complaint_id=$2", [finalStatus, complaintId]);

      res.json(result);
    } catch (e) {
      console.error("[pipeline] parse error:", e, "output was:", output);
      res.status(500).json({ error: "Failed to parse pipeline output" });
    }
  });
});

// ── GET /audit/:complaintId — Full audit trail ────────────────────────────────
app.get("/audit/:complaintId", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM audit_log WHERE complaint_id=$1 ORDER BY created_at ASC",
    [req.params.complaintId]
  );
  res.json({ audit_trail: result.rows, total: result.rows.length });
});

// ── GET /dashboard/kpis — Live KPI metrics ────────────────────────────────────
app.get("/dashboard/kpis", async (req, res) => {
  const [active, inflight, p1breach, avgRedress, stp] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM complaints WHERE status NOT IN ('closed','dispatched')"),
    pool.query("SELECT COUNT(*) FROM complaints WHERE status IN ('triaging','evidence_gathering','policy_review','drafting')"),
    pool.query("SELECT COUNT(*) FROM complaints WHERE priority='P1' AND status NOT IN ('closed','dispatched') AND disp_14_deadline < NOW() + INTERVAL '4 hours'"),
    pool.query("SELECT AVG(redress_amount) FROM policy_outputs WHERE outcome='Uphold'"),
    pool.query("SELECT COUNT(*) FROM draft_outputs WHERE stp_eligible=true"),
  ]);
  const totalClosed = await pool.query("SELECT COUNT(*) FROM complaints WHERE status='dispatched'");

  res.json({
    active_cases: parseInt(active.rows[0].count),
    in_flight: parseInt(inflight.rows[0].count),
    p1_breach_risk: parseInt(p1breach.rows[0].count),
    avg_redress_payout: parseFloat(avgRedress.rows[0].avg || "0").toFixed(2),
    stp_rate: totalClosed.rows[0].count > 0
      ? ((parseInt(stp.rows[0].count) / parseInt(totalClosed.rows[0].count)) * 100).toFixed(1) + "%"
      : "0%",
  });
});

// ── POST /hitl/review — Submit HITL decision ──────────────────────────────────
app.post("/hitl/review", async (req, res) => {
  const { complaint_id, analyst_id, decision, redress_override, redress_justification, letter_edits, notes } = req.body;

  if (!complaint_id || !analyst_id || !decision) {
    return res.status(422).json({ error: "Missing required fields" });
  }

  await pool.query(
    `INSERT INTO hitl_reviews (complaint_id,analyst_id,decision,redress_override,redress_justification,letter_edits,notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [complaint_id, analyst_id, decision, redress_override || null, redress_justification || null, letter_edits || null, notes || null]
  );

  const statusMap: Record<string, string> = { approved: "dispatched", re_triage: "triaging", escalated: "escalated" };
  await pool.query("UPDATE complaints SET status=$1 WHERE complaint_id=$2", [statusMap[decision], complaint_id]);

  res.json({ success: true, complaint_id, new_status: statusMap[decision] });
});

// ── GET /dashboard/charts — Chart breakdown data ─────────────────────────────
app.get("/dashboard/charts", async (req, res) => {
  const [byIntent, byStatus, byChannel, redressByIntent] = await Promise.all([
    pool.query(`SELECT intent_type, COUNT(*) as count FROM triage_outputs GROUP BY intent_type ORDER BY count DESC LIMIT 8`),
    pool.query(`SELECT status, COUNT(*) as count FROM complaints GROUP BY status ORDER BY count DESC`),
    pool.query(`SELECT channel, COUNT(*) as count FROM complaints GROUP BY channel ORDER BY count DESC`),
    pool.query(`SELECT t.intent_type, AVG(p.redress_amount) as avg_redress
                FROM triage_outputs t JOIN policy_outputs p ON t.complaint_id=p.complaint_id
                WHERE p.outcome='Uphold' GROUP BY t.intent_type ORDER BY avg_redress DESC LIMIT 8`),
  ]);
  res.json({
    by_intent: byIntent.rows,
    by_status: byStatus.rows,
    by_channel: byChannel.rows,
    redress_by_intent: redressByIntent.rows,
  });
});

app.listen(3001, () => console.log("✅ Clearview API server running on port 3001"));
