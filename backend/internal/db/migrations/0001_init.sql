-- +goose Up
CREATE TABLE IF NOT EXISTS auth_nonces (
  nonce      TEXT PRIMARY KEY,
  issued_at  DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  expires_at DATETIME NOT NULL,
  used       INTEGER  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  sid        TEXT PRIMARY KEY,     -- uuid как TEXT
  address    TEXT NOT NULL,        -- lower-case
  created_at DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  expires_at DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_address ON sessions(address);

-- +goose Down
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS auth_nonces;
