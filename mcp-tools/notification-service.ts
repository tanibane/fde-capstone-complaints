/**
 * notification-service — MCP Tool
 * Clearview Retail Bank — Agentic Complaints Management
 *
 * Handles dispatching of resolution letters and alerts via:
 *   - Email (mock SMTP)
 *   - SMS (mock gateway)
 *   - Push notification (mock)
 *
 * In capstone mode: logs dispatch to console and audit log only.
 * Does NOT send real emails/SMS.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Pool } from "pg";
import { createHash, randomUUID } from "crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const server = new McpServer({
  name: "notification-service",
  version: "1.0.0",
});

// ─── Tool: sendResolutionLetter ───────────────────────────────────────────────
server.tool(
  "sendResolutionLetter",
  "Dispatch the complaint resolution letter to the customer",
  {
    complaint_id: z.string().uuid(),
    channel: z.enum(["email", "sms", "push"]).describe("Dispatch channel"),
    recipient: z.string().describe("Email address, phone number, or push token"),
    subject: z.string().describe("Letter subject line"),
    letter_content: z.string().min(100).describe("Full resolution letter text"),
    audit_trail_id: z.string().uuid().describe("Audit trail ID — must exist before dispatch"),
  },
  async ({ complaint_id, channel, recipient, subject, letter_content, audit_trail_id }) => {
    // Safety check: verify audit trail entry exists before dispatch
    const auditCheck = await pool.query(
      "SELECT audit_id FROM audit_log WHERE audit_id = $1",
      [audit_trail_id]
    );
    if (auditCheck.rowCount === 0) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            dispatch_id: null,
            status: "failed",
            error: "AUDIT_TRAIL_NOT_FOUND: Cannot dispatch without a valid audit trail entry.",
            timestamp: new Date().toISOString(),
          }),
        }],
      };
    }

    const dispatchId = randomUUID();
    const timestamp = new Date().toISOString();

    // Mock dispatch — log to console in capstone mode
    console.log(`[notification-service] MOCK DISPATCH`);
    console.log(`  Channel:    ${channel}`);
    console.log(`  Recipient:  ${recipient}`);
    console.log(`  Subject:    ${subject}`);
    console.log(`  Complaint:  ${complaint_id}`);
    console.log(`  Dispatch ID: ${dispatchId}`);
    console.log(`  Content preview: ${letter_content.substring(0, 100)}...`);

    // Log dispatch to audit trail
    const payload = { tool: "sendResolutionLetter", dispatch_id: dispatchId, channel, recipient, complaint_id };
    const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
    await pool.query(
      `INSERT INTO audit_log (complaint_id, event_type, agent_name, payload, entry_hash) VALUES ($1,'dispatch','notification-service',$2,$3)`,
      [complaint_id, JSON.stringify(payload), hash]
    );

    // Update complaint status to dispatched
    await pool.query(
      `UPDATE complaints SET status = 'dispatched', updated_at = NOW() WHERE complaint_id = $1`,
      [complaint_id]
    );

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          dispatch_id: dispatchId,
          status: "sent",
          channel,
          recipient,
          timestamp,
        }),
      }],
    };
  }
);

// ─── Tool: sendSmsAlert ────────────────────────────────────────────────────────
server.tool(
  "sendSmsAlert",
  "Send a short SMS alert to the customer (e.g. acknowledgement, deadline warning)",
  {
    complaint_id: z.string().uuid(),
    recipient_phone: z.string().describe("Customer phone number"),
    message: z.string().max(160).describe("SMS body (max 160 chars)"),
  },
  async ({ complaint_id, recipient_phone, message }) => {
    const dispatchId = randomUUID();
    const timestamp = new Date().toISOString();

    console.log(`[notification-service] MOCK SMS`);
    console.log(`  To:    ${recipient_phone}`);
    console.log(`  Body:  ${message}`);

    const payload = { tool: "sendSmsAlert", dispatch_id: dispatchId, recipient_phone, message, complaint_id };
    const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
    await pool.query(
      `INSERT INTO audit_log (complaint_id, event_type, agent_name, payload, entry_hash) VALUES ($1,'dispatch','notification-service',$2,$3)`,
      [complaint_id, JSON.stringify(payload), hash]
    );

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ dispatch_id: dispatchId, status: "sent", timestamp }),
      }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
