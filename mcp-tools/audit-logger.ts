/**
 * audit-logger — MCP Tool
 * Clearview Retail Bank — Agentic Complaints Management
 *
 * Writes tamper-evident, immutable audit log entries to PostgreSQL.
 * Each entry is SHA-256 hashed. No UPDATE or DELETE is permitted on the table.
 *
 * Implements:
 *   - logAgentDecision  — records an agent's output and reasoning
 *   - logMcpCall        — records an MCP tool invocation
 *   - logHitlAction     — records a human analyst's review action
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Pool } from "pg";
import { createHash } from "crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const server = new McpServer({
  name: "audit-logger",
  version: "1.0.0",
});

// ─── Tool: logAgentDecision ────────────────────────────────────────────────────
server.tool(
  "logAgentDecision",
  "Write an immutable audit entry for an agent decision",
  {
    complaint_id: z.string().uuid(),
    agent_name: z.enum(["triage-agent", "evidence-agent", "policy-agent", "draft-agent"]),
    event_type: z.enum(["triage_decision", "evidence_query", "policy_decision", "draft_complete"]),
    payload: z.record(z.unknown()).describe("Full agent output JSON"),
    confidence_score: z.number().min(0).max(1).optional(),
    data_sources: z.array(z.string()).default([]),
  },
  async ({ complaint_id, agent_name, event_type, payload, confidence_score, data_sources }) => {
    const entry = { complaint_id, agent_name, event_type, payload, confidence_score, data_sources };
    const hash = createHash("sha256").update(JSON.stringify(entry)).digest("hex");

    const result = await pool.query(
      `INSERT INTO audit_log (complaint_id, event_type, agent_name, payload, confidence_score, data_sources, entry_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING audit_id, created_at`,
      [
        complaint_id,
        event_type,
        agent_name,
        JSON.stringify(payload),
        confidence_score ?? null,
        JSON.stringify(data_sources),
        hash,
      ]
    );

    const row = result.rows[0];
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          audit_id: row.audit_id,
          hash,
          timestamp: row.created_at,
          status: "written",
        }),
      }],
    };
  }
);

// ─── Tool: logMcpCall ─────────────────────────────────────────────────────────
server.tool(
  "logMcpCall",
  "Write an immutable audit entry for an MCP tool invocation",
  {
    complaint_id: z.string().uuid(),
    tool_name: z.string().describe("Name of the MCP tool that was called"),
    input_params: z.record(z.unknown()).describe("Input parameters passed to the tool"),
    output_summary: z.string().describe("Brief summary of what was returned"),
    result_count: z.number().int().default(0),
  },
  async ({ complaint_id, tool_name, input_params, output_summary, result_count }) => {
    const payload = { tool_name, input_params, output_summary, result_count };
    const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");

    const result = await pool.query(
      `INSERT INTO audit_log (complaint_id, event_type, agent_name, payload, entry_hash)
       VALUES ($1, 'mcp_call', $2, $3, $4)
       RETURNING audit_id, created_at`,
      [complaint_id, tool_name, JSON.stringify(payload), hash]
    );

    const row = result.rows[0];
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ audit_id: row.audit_id, hash, timestamp: row.created_at, status: "written" }),
      }],
    };
  }
);

// ─── Tool: logHitlAction ──────────────────────────────────────────────────────
server.tool(
  "logHitlAction",
  "Write an immutable audit entry for a human analyst review action",
  {
    complaint_id: z.string().uuid(),
    analyst_id: z.string().describe("Analyst's user ID"),
    decision: z.enum(["approved", "re_triage", "escalated"]),
    redress_override: z.number().optional().describe("Override redress amount if changed"),
    redress_justification: z.string().optional(),
    letter_edits: z.string().optional().describe("Summary of edits made to the draft letter"),
    notes: z.string().optional(),
  },
  async ({ complaint_id, analyst_id, decision, redress_override, redress_justification, letter_edits, notes }) => {
    const payload = { analyst_id, decision, redress_override, redress_justification, letter_edits, notes };
    const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");

    // Write to hitl_reviews table
    await pool.query(
      `INSERT INTO hitl_reviews (complaint_id, analyst_id, decision, redress_override, redress_justification, letter_edits, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [complaint_id, analyst_id, decision, redress_override ?? null, redress_justification ?? null, letter_edits ?? null, notes ?? null]
    );

    // Write to immutable audit log
    const result = await pool.query(
      `INSERT INTO audit_log (complaint_id, event_type, agent_name, payload, entry_hash)
       VALUES ($1, 'hitl_action', $2, $3, $4)
       RETURNING audit_id, created_at`,
      [complaint_id, analyst_id, JSON.stringify(payload), hash]
    );

    // Update complaint status
    const statusMap: Record<string, string> = {
      approved: "dispatched",
      re_triage: "triaging",
      escalated: "escalated",
    };
    await pool.query(
      `UPDATE complaints SET status = $1, updated_at = NOW() WHERE complaint_id = $2`,
      [statusMap[decision], complaint_id]
    );

    const row = result.rows[0];
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ audit_id: row.audit_id, hash, timestamp: row.created_at, status: "written", complaint_status_updated_to: statusMap[decision] }),
      }],
    };
  }
);

// ─── Tool: verifyAuditIntegrity ────────────────────────────────────────────────
server.tool(
  "verifyAuditIntegrity",
  "Verify the hash integrity of all audit entries for a complaint",
  {
    complaint_id: z.string().uuid(),
  },
  async ({ complaint_id }) => {
    const result = await pool.query(
      `SELECT audit_id, payload, entry_hash FROM audit_log WHERE complaint_id = $1 ORDER BY created_at`,
      [complaint_id]
    );

    const checks = result.rows.map((row) => {
      const recomputed = createHash("sha256").update(row.payload).digest("hex");
      return {
        audit_id: row.audit_id,
        stored_hash: row.entry_hash,
        recomputed_hash: recomputed,
        integrity: recomputed === row.entry_hash ? "VALID" : "TAMPERED",
      };
    });

    const allValid = checks.every((c) => c.integrity === "VALID");

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ complaint_id, total_entries: checks.length, all_valid: allValid, checks }),
      }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
