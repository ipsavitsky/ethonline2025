-- +goose Up
CREATE TABLE IF NOT EXISTS agents (
  id              TEXT PRIMARY KEY,     -- uuid
  owner_address   TEXT NOT NULL,        -- lower-case ethereum address
  name            TEXT NOT NULL,
  description     TEXT,
  model           TEXT NOT NULL,
  system_prompt   TEXT NOT NULL,
  mcp_servers     TEXT NOT NULL DEFAULT '[]', -- JSON array of MCP server IDs
  created_at      DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at      DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents(owner_address);

CREATE TABLE IF NOT EXISTS mcp_servers (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  enabled     INTEGER NOT NULL DEFAULT 1  -- 1 = true, 0 = false
);

-- Insert default MCP servers
INSERT INTO mcp_servers (id, name, description, enabled) VALUES
  ('13bde052-1c2d-46f8-983f-cc868014c40f', 'stat-analysis-slither', 'stat-analysis slither', 1),
  ('6020a9eb-31ce-49d4-a3e2-379d5f961420', 'foundry-anvil', 'deploy\testing', 1),
  ('f15ad840-0bfa-46d6-9c9e-0b91d102bc49', 'sources-search', 'sources search', 1);

-- +goose Down
DROP TABLE IF EXISTS agents;
DROP TABLE IF EXISTS mcp_servers;

