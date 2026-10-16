/**
 * context-broker-hybrid-query — MCP Tool
 * Clearview Retail Bank — Agentic Complaints Management
 *
 * Provides hybrid vector + graph search over the Context Studio
 * knowledge graph (FCA DISP rules, precedents, vulnerability markers,
 * bank profile, SOP library).
 *
 * In production: calls ICA Context Studio REST endpoint.
 * In capstone: returns deterministic mock responses based on query content.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Pool } from "pg";
import { createHash } from "crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const server = new McpServer({
  name: "context-broker-hybrid-query",
  version: "1.0.0",
});

// ─── FCA Rules Knowledge Base (mock of Context Studio graph) ──────────────────
const FCA_RULES: Record<string, object> = {
  "fca:DISP_1_4": {
    node_id: "fca:DISP_1_4",
    content: "FCA DISP 1.4: Firms must send a Summary Resolution Communication within 3 business days of receiving a complaint. The SRC must explain the outcome and the customer's right to refer to FOS.",
    rule_type: "deadline",
    deadline_days: 3,
    applies_to: ["duplicate_charge", "atm_failure", "unauthorised_transaction", "mortgage_dispute", "account_closure", "data_privacy", "other"],
    relevance_score: 0.97,
  },
  "fca:DISP_1_6": {
    node_id: "fca:DISP_1_6",
    content: "FCA DISP 1.6: Firms must issue a final response within 8 weeks of receiving a complaint. Failure triggers the customer's right to refer to the Financial Ombudsman Service.",
    rule_type: "deadline",
    deadline_weeks: 8,
    applies_to: ["all"],
    relevance_score: 0.95,
  },
  "fca:ConsumerDuty": {
    node_id: "fca:ConsumerDuty",
    content: "FCA Consumer Duty: Firms must deliver good outcomes for retail customers. Four outcomes apply: products/services, price/value, consumer understanding, consumer support. Vulnerable customers require enhanced care.",
    rule_type: "principle",
    applies_to: ["all"],
    vulnerable_customer_enhanced_care: true,
    relevance_score: 0.92,
  },
};

// ─── Precedents Knowledge Base ────────────────────────────────────────────────
const PRECEDENTS: Record<string, object> = {
  "clearview:Precedent_DuplicateCharge": {
    node_id: "clearview:Precedent_DuplicateCharge",
    content: "Duplicate charge complaints: 84% uphold rate. Standard outcome is Uphold with moderate redress (£200). Evidence of two identical transactions on same date from same merchant is sufficient to uphold.",
    intent_type: "duplicate_charge",
    uphold_rate: 0.84,
    typical_outcome: "Uphold",
    typical_redress: 200,
    redress_tier: "moderate",
    relevance_score: 0.96,
  },
  "clearview:Precedent_UnauthorisedTransaction": {
    node_id: "clearview:Precedent_UnauthorisedTransaction",
    content: "Unauthorised transaction complaints: 91% uphold rate. Standard outcome is Uphold with severe redress (£500) plus full reversal of disputed amount. Always P1 priority.",
    intent_type: "unauthorised_transaction",
    uphold_rate: 0.91,
    typical_outcome: "Uphold",
    typical_redress: 500,
    redress_tier: "severe",
    relevance_score: 0.98,
  },
  "clearview:Precedent_ATMFailure": {
    node_id: "clearview:Precedent_ATMFailure",
    content: "ATM failure complaints: 76% uphold rate when transaction debit confirmed without cash dispensed. Minor redress (£25) standard. Reject if no evidence of debit found in T24.",
    intent_type: "atm_failure",
    uphold_rate: 0.76,
    typical_outcome: "Uphold",
    typical_redress: 25,
    redress_tier: "minor",
    relevance_score: 0.91,
  },
  "clearview:Precedent_MortgageDispute": {
    node_id: "clearview:Precedent_MortgageDispute",
    content: "Mortgage dispute complaints: 62% uphold rate. Outcome depends on whether fee was disclosed in mortgage offer. Moderate redress (£200) if undisclosed fee. Reject if fee was in original agreement.",
    intent_type: "mortgage_dispute",
    uphold_rate: 0.62,
    typical_outcome: "Partial Uphold",
    typical_redress: 200,
    redress_tier: "moderate",
    relevance_score: 0.88,
  },
  "clearview:Precedent_AccountClosure": {
    node_id: "clearview:Precedent_AccountClosure",
    content: "Account closure delay complaints: 70% uphold rate. Minor redress (£25) standard for delays under 30 days. Moderate if fees charged during delay period.",
    intent_type: "account_closure",
    uphold_rate: 0.70,
    typical_outcome: "Uphold",
    typical_redress: 25,
    redress_tier: "minor",
    relevance_score: 0.87,
  },
};

// ─── Vulnerability Markers Knowledge Base ─────────────────────────────────────
const VULNERABILITY_MARKERS = {
  node_id: "clearview:VulnerabilityMarkers",
  content: "FCA Consumer Duty identifies 13 vulnerability categories. Presence of any marker requires P1 priority, HITL mandatory, and enhanced care throughout the complaint journey.",
  markers: [
    "Mental health condition", "Learning disability", "Physical disability or illness",
    "Low financial resilience", "Recent bereavement", "Recent relationship breakdown",
    "Recent job loss", "Caring responsibilities", "Limited English proficiency",
    "Elderly and isolated", "Addiction", "Recent trauma or abuse survivor", "Low digital literacy",
  ],
  escalation_rule: "clearview:HITLRule_VulnerableCustomer",
  hitl_mandatory: true,
  priority_override: "P1",
  relevance_score: 1.0,
};

// ─── Tool: queryFcaRules ───────────────────────────────────────────────────────
server.tool(
  "queryFcaRules",
  "Search FCA DISP rules applicable to a complaint intent type",
  {
    query_text: z.string().describe("Natural language query about the complaint"),
    intent_type: z.string().optional().describe("Complaint intent type for filtering"),
    complaint_id: z.string().uuid().describe("Complaint ID for audit trail"),
  },
  async ({ query_text, intent_type, complaint_id }) => {
    const results = Object.values(FCA_RULES).filter((rule: any) =>
      rule.applies_to.includes("all") ||
      (intent_type && rule.applies_to.includes(intent_type))
    );

    await logAuditEntry(complaint_id, "mcp_call", "context-broker-hybrid-query", {
      tool: "queryFcaRules",
      query_text,
      intent_type,
      result_count: results.length,
    });

    return {
      content: [{ type: "text", text: JSON.stringify({ results, graph_path: "clearview:Bank → clearview:FCA → fca:DISP" }) }],
    };
  }
);

// ─── Tool: queryPrecedents ─────────────────────────────────────────────────────
server.tool(
  "queryPrecedents",
  "Search historical complaint precedents by intent type",
  {
    intent_type: z.string().describe("Complaint intent type"),
    complaint_id: z.string().uuid().describe("Complaint ID for audit trail"),
  },
  async ({ intent_type, complaint_id }) => {
    const results = Object.values(PRECEDENTS).filter(
      (p: any) => p.intent_type === intent_type
    );

    await logAuditEntry(complaint_id, "mcp_call", "context-broker-hybrid-query", {
      tool: "queryPrecedents",
      intent_type,
      result_count: results.length,
    });

    return {
      content: [{ type: "text", text: JSON.stringify({ results, graph_path: `clearview:PrecedentArchive → clearview:Precedent_${intent_type}` }) }],
    };
  }
);

// ─── Tool: queryVulnerabilityMarkers ──────────────────────────────────────────
server.tool(
  "queryVulnerabilityMarkers",
  "Check complaint text and customer profile for FCA vulnerability markers",
  {
    complaint_text: z.string().describe("Raw complaint text"),
    customer_id: z.string().describe("Customer ID for CRM vulnerability flag lookup"),
    complaint_id: z.string().uuid().describe("Complaint ID for audit trail"),
  },
  async ({ complaint_text, customer_id, complaint_id }) => {
    const text = complaint_text.toLowerCase();

    // Keyword-signal mapping for each vulnerability category
    const detectedMarkers: string[] = [];
    const signalMap: Record<string, string[]> = {
      "Recent bereavement": ["passed away", "died", "death", "bereaved", "widow", "widower", "lost my husband", "lost my wife"],
      "Mental health condition": ["mental health", "anxiety", "depression", "struggling mentally", "psychiatric"],
      "Physical disability or illness": ["disability", "wheelchair", "chronic illness", "disabled", "cannot walk"],
      "Low financial resilience": ["cannot afford", "struggling financially", "debt", "financial difficulty", "low income"],
      "Recent job loss": ["made redundant", "lost my job", "unemployed", "job loss", "no longer employed"],
      "Caring responsibilities": ["carer", "caring for", "childcare", "looking after"],
      "Limited English proficiency": ["english is not", "do not speak english", "translator", "language barrier"],
      "Elderly and isolated": ["elderly", "78 years", "80 years", "very old", "isolated"],
      "Recent relationship breakdown": ["divorce", "separation", "split up", "relationship breakdown"],
      "Addiction": ["addiction", "recovery", "in recovery", "substance"],
      "Recent trauma or abuse survivor": ["trauma", "abuse", "survivor", "attacked"],
      "Low digital literacy": ["cannot use app", "do not understand internet", "not tech savvy"],
    };

    for (const [marker, signals] of Object.entries(signalMap)) {
      if (signals.some((signal) => text.includes(signal))) {
        detectedMarkers.push(marker);
      }
    }

    const vulnerabilityFlag = detectedMarkers.length > 0;

    await logAuditEntry(complaint_id, "mcp_call", "context-broker-hybrid-query", {
      tool: "queryVulnerabilityMarkers",
      customer_id,
      detected_markers: detectedMarkers,
      vulnerability_flag: vulnerabilityFlag,
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          results: [{ ...VULNERABILITY_MARKERS, detected_markers: detectedMarkers }],
          vulnerability_flag: vulnerabilityFlag,
          hitl_mandatory: vulnerabilityFlag,
          priority_override: vulnerabilityFlag ? "P1" : null,
          graph_path: "clearview:VulnerabilityMarkers → fca:ConsumerDuty",
        }),
      }],
    };
  }
);

// ─── Audit Helper ─────────────────────────────────────────────────────────────
async function logAuditEntry(complaintId: string, eventType: string, agentName: string, payload: object) {
  const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  await pool.query(
    `INSERT INTO audit_log (complaint_id, event_type, agent_name, payload, entry_hash) VALUES ($1,$2,$3,$4,$5)`,
    [complaintId, eventType, agentName, JSON.stringify(payload), hash]
  );
}

const transport = new StdioServerTransport();
await server.connect(transport);
