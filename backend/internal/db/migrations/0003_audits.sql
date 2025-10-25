-- +goose Up
CREATE TABLE IF NOT EXISTS audits (
  id                TEXT PRIMARY KEY,     -- uuid
  owner_address     TEXT NOT NULL,        -- lower-case ethereum address
  name              TEXT NOT NULL,
  description       TEXT,
  status            TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed
  contract_address  TEXT,
  blockchain        TEXT NOT NULL,
  github_url        TEXT,
  source_code       TEXT,
  agents_used       TEXT NOT NULL DEFAULT '[]', -- JSON array of agent IDs
  created_at        DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at        DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  started_at        DATETIME,
  completed_at      DATETIME
);

CREATE INDEX IF NOT EXISTS idx_audits_owner ON audits(owner_address);
CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);

CREATE TABLE IF NOT EXISTS findings (
  id                TEXT PRIMARY KEY,     -- uuid
  audit_id          TEXT NOT NULL,
  agent_id          TEXT NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  severity          TEXT NOT NULL,        -- critical, high, medium, low, info
  location_file     TEXT,
  location_line     INTEGER,
  location_function TEXT,
  recommendation    TEXT,
  code_snippet      TEXT,
  created_at        DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_findings_audit ON findings(audit_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);

-- +goose Down
DROP TABLE IF EXISTS findings;
DROP TABLE IF EXISTS audits;

