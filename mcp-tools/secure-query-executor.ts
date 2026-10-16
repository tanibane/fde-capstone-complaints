/**
 * secure-query-executor — MCP Tool
 * Clearview Retail Bank — Agentic Complaints Management
 *
 * Provides secure, parameterised query access to:
 *   - PostgreSQL complaints DB
 *   - Mock Temenos T24 Core Banking (transactions)
 *   - Mock FIS CAMS (card disputes)
 *   - Mock Salesforce CRM (case history)
 *   - Mock Verint IVR (call transcripts)
 *
 * All queries are parameterised — no SQL injection risk.
 * All calls are logged via audit-logger.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Pool } from "pg";
import { createHash } from "crypto";

// ─── DB Connection ────────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── MCP Server ───────────────────────────────────────────────────────────────
const server = new McpServer({
  name: "secure-query-executor",
  version: "1.0.0",
});

// ─── Tool: queryTransactions ──────────────────────────────────────────────────
server.tool(
  "queryTransactions",
  "Query 90-day transaction history from mock Temenos T24 for a customer",
  {
    customer_id: z.string().describe("Clearview customer ID"),
    date_from: z.string().describe("ISO date string YYYY-MM-DD"),
    date_to: z.string().describe("ISO date string YYYY-MM-DD"),
    complaint_id: z.string().uuid().describe("Complaint ID for audit trail"),
  },
  async ({ customer_id, date_from, date_to, complaint_id }) => {
    // Mock T24 data — in production this would call the real T24 REST API
    const mockTransactions = generateMockTransactions(customer_id, date_from, date_to);

    await logAuditEntry(complaint_id, "mcp_call", "secure-query-executor", {
      tool: "queryTransactions",
      customer_id,
      date_from,
      date_to,
      result_count: mockTransactions.length,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            records: mockTransactions,
            source_system: "T24",
            query_timestamp: new Date().toISOString(),
            customer_id,
          }),
        },
      ],
    };
  }
);

// ─── Tool: queryCardDisputes ───────────────────────────────────────────────────
server.tool(
  "queryCardDisputes",
  "Query card dispute records from mock FIS CAMS for a customer",
  {
    customer_id: z.string().describe("Clearview customer ID"),
    date_from: z.string().describe("ISO date string YYYY-MM-DD"),
    date_to: z.string().describe("ISO date string YYYY-MM-DD"),
    complaint_id: z.string().uuid().describe("Complaint ID for audit trail"),
  },
  async ({ customer_id, date_from, date_to, complaint_id }) => {
    const mockDisputes = generateMockCardDisputes(customer_id, date_from, date_to);

    await logAuditEntry(complaint_id, "mcp_call", "secure-query-executor", {
      tool: "queryCardDisputes",
      customer_id,
      date_from,
      date_to,
      result_count: mockDisputes.length,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            records: mockDisputes,
            source_system: "CAMS",
            query_timestamp: new Date().toISOString(),
            customer_id,
          }),
        },
      ],
    };
  }
);

// ─── Tool: queryCrmHistory ─────────────────────────────────────────────────────
server.tool(
  "queryCrmHistory",
  "Query 12-month case history from mock Salesforce FSC CRM for a customer",
  {
    customer_id: z.string().describe("Clearview customer ID"),
    complaint_id: z.string().uuid().describe("Complaint ID for audit trail"),
  },
  async ({ customer_id, complaint_id }) => {
    const mockCrmHistory = generateMockCrmHistory(customer_id);

    await logAuditEntry(complaint_id, "mcp_call", "secure-query-executor", {
      tool: "queryCrmHistory",
      customer_id,
      result_count: mockCrmHistory.length,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            records: mockCrmHistory,
            source_system: "Salesforce",
            query_timestamp: new Date().toISOString(),
            customer_id,
          }),
        },
      ],
    };
  }
);

// ─── Tool: queryCallTranscripts ────────────────────────────────────────────────
server.tool(
  "queryCallTranscripts",
  "Query call transcripts from mock Verint IVR for a customer",
  {
    customer_id: z.string().describe("Clearview customer ID"),
    complaint_id: z.string().uuid().describe("Complaint ID for audit trail"),
  },
  async ({ customer_id, complaint_id }) => {
    const mockTranscripts = generateMockCallTranscripts(customer_id);

    await logAuditEntry(complaint_id, "mcp_call", "secure-query-executor", {
      tool: "queryCallTranscripts",
      customer_id,
      result_count: mockTranscripts.length,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            records: mockTranscripts,
            source_system: "Verint",
            query_timestamp: new Date().toISOString(),
            customer_id,
          }),
        },
      ],
    };
  }
);

// ─── Mock Data Generators ─────────────────────────────────────────────────────

function generateMockTransactions(customerId: string, dateFrom: string, dateTo: string) {
  const merchantPool = [
    { id: "NETFLIX-UK-001", name: "NETFLIX.COM SUBSCRIPTION", amount: 12.99 },
    { id: "AMAZON-UK-001", name: "AMAZON.CO.UK ORDER", amount: 67.5 },
    { id: "SPOTIFY-UK-001", name: "SPOTIFY SUBSCRIPTION", amount: 9.99 },
    { id: "FUEL-BP-001", name: "BP FUEL STATION", amount: 55.0 },
    { id: "SUPERMARKET-001", name: "TESCO SUPERSTORE", amount: 87.3 },
    { id: "UNKNOWN-MERCH-001", name: "ONLINE RETAILER GBR", amount: 350.0 },
    { id: "PHARMACY-001", name: "BOOTS PHARMACY", amount: 8.4 },
    { id: "COFFEE-001", name: "COSTA COFFEE", amount: 4.5 },
  ];
  const seed = customerId.charCodeAt(customerId.length - 1);
  const merchant = merchantPool[seed % merchantPool.length];
  const txDate = dateFrom;

  return [
    {
      transaction_id: `TXN-${txDate.replace(/-/g, "")}-001`,
      date: txDate,
      amount: merchant.amount,
      currency: "GBP",
      description: merchant.name,
      merchant_id: merchant.id,
      source_system: "T24",
    },
    // Simulate duplicate if seed is even
    ...(seed % 2 === 0
      ? [
          {
            transaction_id: `TXN-${txDate.replace(/-/g, "")}-002`,
            date: txDate,
            amount: merchant.amount,
            currency: "GBP",
            description: merchant.name,
            merchant_id: merchant.id,
            source_system: "T24",
          },
        ]
      : []),
  ];
}

function generateMockCardDisputes(customerId: string, dateFrom: string, _dateTo: string) {
  const seed = customerId.charCodeAt(customerId.length - 1);
  if (seed % 3 !== 0) return []; // Only 1-in-3 customers have active disputes
  return [
    {
      dispute_id: `DISP-${customerId}-001`,
      date_raised: dateFrom,
      amount: 95.0 + (seed % 200),
      currency: "GBP",
      status: "open",
      merchant_id: "UNKNOWN-MERCH-001",
      chargeback_ref: `CB-${customerId}-001`,
      source_system: "CAMS",
    },
  ];
}

function generateMockCrmHistory(customerId: string) {
  const seed = customerId.charCodeAt(customerId.length - 1);
  if (seed % 4 !== 0) return []; // Only 1-in-4 customers have prior cases
  return [
    {
      case_id: `CRM-CASE-${customerId}-001`,
      created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      resolved_at: new Date(Date.now() - 87 * 24 * 60 * 60 * 1000).toISOString(),
      status: "closed",
      category: "billing_dispute",
      summary: "Previous billing dispute resolved with £25 goodwill payment.",
      source_system: "Salesforce",
    },
  ];
}

function generateMockCallTranscripts(customerId: string) {
  const seed = customerId.charCodeAt(customerId.length - 1);
  if (seed % 5 !== 0) return [];
  return [
    {
      call_id: `CALL-${customerId}-001`,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      duration_seconds: 340,
      transcript_text: `Customer called regarding unauthorised transaction. Agent confirmed the transaction and raised a dispute with CAMS. Customer was distressed. Advised 5-7 business days for resolution.`,
      sentiment_score: 0.15,
      source_system: "Verint",
    },
  ];
}

// ─── Audit Log Helper ─────────────────────────────────────────────────────────
async function logAuditEntry(
  complaintId: string,
  eventType: string,
  agentName: string,
  payload: object
) {
  const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  await pool.query(
    `INSERT INTO audit_log (complaint_id, event_type, agent_name, payload, entry_hash)
     VALUES ($1, $2, $3, $4, $5)`,
    [complaintId, eventType, agentName, JSON.stringify(payload), hash]
  );
}

// ─── Start Server ─────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
