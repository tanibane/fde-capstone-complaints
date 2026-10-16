-- ============================================================
-- Clearview Retail Bank — Agentic Complaints Management
-- PostgreSQL 15 Schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- for gen_random_uuid()

-- ============================================================
-- TABLE 1: customers
-- ============================================================
CREATE TABLE customers (
    customer_id         VARCHAR(50)     PRIMARY KEY,
    full_name           VARCHAR(200)    NOT NULL,
    email               VARCHAR(200),
    phone               VARCHAR(30),
    tier                VARCHAR(20)     NOT NULL DEFAULT 'standard'
                        CHECK (tier IN ('standard', 'premier', 'wealth', 'sme')),
    vulnerability_flag  BOOLEAN         NOT NULL DEFAULT FALSE,
    vulnerability_markers JSONB         NOT NULL DEFAULT '[]',
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_tier             ON customers(tier);
CREATE INDEX idx_customers_vulnerability    ON customers(vulnerability_flag);

-- ============================================================
-- TABLE 2: complaints
-- ============================================================
CREATE TABLE complaints (
    complaint_id        UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id         VARCHAR(50)     NOT NULL REFERENCES customers(customer_id),
    channel             VARCHAR(20)     NOT NULL
                        CHECK (channel IN ('branch','call_centre','mobile','email','social_media')),
    complaint_text      TEXT            NOT NULL CHECK (length(complaint_text) >= 10),
    status              VARCHAR(30)     NOT NULL DEFAULT 'intake'
                        CHECK (status IN ('intake','triaging','evidence_gathering','policy_review',
                                          'drafting','hitl_review','dispatched','closed','escalated')),
    priority            VARCHAR(5)      CHECK (priority IN ('P1','P2','P3')),
    intent_type         VARCHAR(40)
                        CHECK (intent_type IN ('duplicate_charge','atm_failure',
                                               'unauthorised_transaction','mortgage_dispute',
                                               'account_closure','data_privacy','other')),
    vulnerability_flag  BOOLEAN         NOT NULL DEFAULT FALSE,
    legal_threat_flag   BOOLEAN         NOT NULL DEFAULT FALSE,
    fca_deadline        TIMESTAMPTZ,
    disp_14_deadline    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_complaints_customer        ON complaints(customer_id);
CREATE INDEX idx_complaints_priority        ON complaints(priority);
CREATE INDEX idx_complaints_status          ON complaints(status);
CREATE INDEX idx_complaints_created_at      ON complaints(created_at DESC);
CREATE INDEX idx_complaints_vulnerability   ON complaints(vulnerability_flag);
CREATE INDEX idx_complaints_intent          ON complaints(intent_type);

-- ============================================================
-- TABLE 3: triage_outputs
-- ============================================================
CREATE TABLE triage_outputs (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id        UUID            NOT NULL REFERENCES complaints(complaint_id),
    priority            VARCHAR(5)      NOT NULL CHECK (priority IN ('P1','P2','P3')),
    intent_type         VARCHAR(40)     NOT NULL,
    vulnerability_flag  BOOLEAN         NOT NULL DEFAULT FALSE,
    vulnerability_markers JSONB         NOT NULL DEFAULT '[]',
    sentiment_score     NUMERIC(4,3)    NOT NULL CHECK (sentiment_score BETWEEN 0 AND 1),
    channel_weight      NUMERIC(4,3)    NOT NULL CHECK (channel_weight BETWEEN 0 AND 1),
    confidence_score    NUMERIC(4,3)    NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
    hitl_required       BOOLEAN         NOT NULL DEFAULT FALSE,
    legal_threat_flag   BOOLEAN         NOT NULL DEFAULT FALSE,
    data_sources        JSONB           NOT NULL DEFAULT '[]',
    reasoning_summary   TEXT,
    processed_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_triage_complaint_id ON triage_outputs(complaint_id);

-- ============================================================
-- TABLE 4: evidence_outputs
-- ============================================================
CREATE TABLE evidence_outputs (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id        UUID            NOT NULL REFERENCES complaints(complaint_id),
    transaction_log     JSONB           NOT NULL DEFAULT '[]',
    card_disputes       JSONB           NOT NULL DEFAULT '[]',
    crm_history         JSONB           NOT NULL DEFAULT '[]',
    call_transcripts    JSONB           NOT NULL DEFAULT '[]',
    evidence_summary    TEXT,
    confidence_score    NUMERIC(4,3)    NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
    data_sources        JSONB           NOT NULL DEFAULT '[]',
    processed_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evidence_complaint_id ON evidence_outputs(complaint_id);

-- ============================================================
-- TABLE 5: policy_outputs
-- ============================================================
CREATE TABLE policy_outputs (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id        UUID            NOT NULL REFERENCES complaints(complaint_id),
    outcome             VARCHAR(20)     NOT NULL CHECK (outcome IN ('Uphold','Partial Uphold','Reject')),
    fca_rule_refs       JSONB           NOT NULL DEFAULT '[]',
    redress_amount      NUMERIC(10,2)   NOT NULL DEFAULT 0 CHECK (redress_amount >= 0),
    redress_currency    VARCHAR(5)      NOT NULL DEFAULT 'GBP',
    redress_tier        VARCHAR(10)     NOT NULL
                        CHECK (redress_tier IN ('none','minor','moderate','severe','custom')),
    redress_justification TEXT,
    liability_party     VARCHAR(20)     NOT NULL
                        CHECK (liability_party IN ('bank','customer','third_party','shared')),
    precedent_refs      JSONB           NOT NULL DEFAULT '[]',
    sop_refs            JSONB           NOT NULL DEFAULT '[]',
    confidence_score    NUMERIC(4,3)    NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
    hitl_required       BOOLEAN         NOT NULL DEFAULT FALSE,
    reasoning_summary   TEXT,
    data_sources        JSONB           NOT NULL DEFAULT '[]',
    processed_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    -- Enforce: redress > 150 must have hitl_required = true
    CONSTRAINT chk_hitl_high_redress CHECK (
        NOT (redress_amount > 150 AND hitl_required = FALSE)
    )
);

CREATE INDEX idx_policy_complaint_id    ON policy_outputs(complaint_id);
CREATE INDEX idx_policy_outcome         ON policy_outputs(outcome);
CREATE INDEX idx_policy_hitl            ON policy_outputs(hitl_required);

-- ============================================================
-- TABLE 6: draft_outputs
-- ============================================================
CREATE TABLE draft_outputs (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id        UUID            NOT NULL REFERENCES complaints(complaint_id),
    resolution_letter   TEXT            NOT NULL CHECK (length(resolution_letter) >= 100),
    letter_subject      VARCHAR(500),
    redress_package     JSONB           NOT NULL DEFAULT '{}',
    stp_eligible        BOOLEAN         NOT NULL DEFAULT FALSE,
    dispatch_trigger    BOOLEAN         NOT NULL DEFAULT FALSE,
    hitl_required       BOOLEAN         NOT NULL DEFAULT FALSE,
    audit_trail_id      UUID,
    fca_deadline        TIMESTAMPTZ,
    disp_14_deadline    TIMESTAMPTZ,
    confidence_score    NUMERIC(4,3)    NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
    data_sources        JSONB           NOT NULL DEFAULT '[]',
    processed_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    -- Enforce: dispatch cannot fire when hitl is required
    CONSTRAINT chk_dispatch_not_hitl CHECK (
        NOT (dispatch_trigger = TRUE AND hitl_required = TRUE)
    ),
    -- Enforce: stp cannot be true when hitl is required
    CONSTRAINT chk_stp_not_hitl CHECK (
        NOT (stp_eligible = TRUE AND hitl_required = TRUE)
    )
);

CREATE INDEX idx_draft_complaint_id ON draft_outputs(complaint_id);
CREATE INDEX idx_draft_stp          ON draft_outputs(stp_eligible);

-- ============================================================
-- TABLE 7: hitl_reviews
-- ============================================================
CREATE TABLE hitl_reviews (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id        UUID            NOT NULL REFERENCES complaints(complaint_id),
    analyst_id          VARCHAR(100)    NOT NULL,
    decision            VARCHAR(20)     NOT NULL
                        CHECK (decision IN ('approved','re_triage','escalated')),
    redress_override    NUMERIC(10,2),
    redress_justification TEXT,
    letter_edits        TEXT,
    notes               TEXT,
    reviewed_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hitl_complaint_id  ON hitl_reviews(complaint_id);
CREATE INDEX idx_hitl_analyst_id    ON hitl_reviews(analyst_id);
CREATE INDEX idx_hitl_reviewed_at   ON hitl_reviews(reviewed_at DESC);

-- ============================================================
-- TABLE 8: audit_log  (IMMUTABLE — no UPDATE or DELETE)
-- ============================================================
CREATE TABLE audit_log (
    audit_id            UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id        UUID            NOT NULL REFERENCES complaints(complaint_id),
    event_type          VARCHAR(50)     NOT NULL
                        CHECK (event_type IN (
                            'intake','triage_decision','evidence_query',
                            'policy_decision','draft_complete',
                            'hitl_action','mcp_call','dispatch','escalation'
                        )),
    agent_name          VARCHAR(50),
    payload             JSONB           NOT NULL DEFAULT '{}',
    confidence_score    NUMERIC(4,3),
    data_sources        JSONB           NOT NULL DEFAULT '[]',
    entry_hash          VARCHAR(64)     NOT NULL,   -- SHA-256 of payload for tamper-evidence
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_complaint_id ON audit_log(complaint_id);
CREATE INDEX idx_audit_event_type   ON audit_log(event_type);
CREATE INDEX idx_audit_created_at   ON audit_log(created_at DESC);

-- Prevent UPDATE and DELETE on audit_log (immutability enforcement)
CREATE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;

-- ============================================================
-- Trigger: auto-update complaints.updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_complaints_updated_at
    BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
