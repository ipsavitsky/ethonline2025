# Watson API Endpoints Specification

This document describes all API endpoints that the Go backend needs to implement for the Watson frontend.

## Base URL

- Development: `http://localhost:8080`
- Production: TBD

## Important Notes

- All endpoints should support CORS with credentials
- Session management uses **HttpOnly, Secure, SameSite=Strict cookies**
- All endpoints except auth endpoints require authentication
- Content-Type: `application/json` (unless specified otherwise)
- Include `credentials: 'include'` in all frontend requests

---

## Authentication Endpoints

### POST `/auth/nonce`

Generate a unique nonce for SIWE authentication.

**Request:**
```json
{}
```

**Response:** `200 OK`
```json
{
  "nonce": "random-unique-string-here"
}
```

**Notes:**
- Nonce should expire after 5-10 minutes
- Store nonce in database with expiration time
- Mark as unused initially

---

### POST `/auth/verify`

Verify SIWE signature and create authenticated session.

**Request:**
```json
{
  "message": "example.com wants you to sign in with your Ethereum account:\n0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\n\nSign in to Watson\n\nURI: https://example.com\nVersion: 1\nChain ID: 1\nNonce: 32BytesOfRandomness\nIssued At: 2025-01-01T00:00:00.000Z",
  "signature": "0x..."
}
```

**Response:** `200 OK`
```json
{
  "success": true
}
```

**Error Response:** `401 Unauthorized`
```json
{
  "error": "Invalid signature"
}
```

**Notes:**
- Parse SIWE message using SIWE library
- Verify signature matches message
- Recover Ethereum address from signature (never trust client-sent address)
- Check nonce exists, is unused, and hasn't expired
- Mark nonce as used
- Create session with recovered address
- Set HttpOnly cookie with session ID
- Support both EOA wallets and ERC-1271 contract wallets

**Security:**
- NEVER trust the address sent from frontend
- ONLY use the address recovered from the signature verification
- Validate SIWE message format
- Check domain, chainId, and timestamp

---

### GET `/auth/me`

Get current authenticated user's address.

**Request:** (cookies included automatically)

**Response:** `200 OK`
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Error Response:** `401 Unauthorized`
```json
{
  "error": "Not authenticated"
}
```

---

### POST `/auth/logout`

End current session.

**Request:** (cookies included automatically)

**Response:** `200 OK`
```json
{
  "success": true
}
```

**Notes:**
- Clear session from database
- Clear session cookie

---

## Agent Endpoints

### GET `/agents`

List all agents created by the authenticated user.

**Request:** (cookies included automatically)

**Response:** `200 OK`
```json
{
  "agents": [
    {
      "id": "uuid-here",
      "name": "Reentrancy Detector",
      "description": "Specialized in detecting reentrancy vulnerabilities",
      "model": "anthropic/claude-3.5-sonnet",
      "system_prompt": "You are a security expert...",
      "mcp_servers": ["mcp-server-1", "mcp-server-2"],
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### GET `/agents/:id`

Get details of a specific agent.

**Request:** (cookies included automatically)

**Response:** `200 OK`
```json
{
  "id": "uuid-here",
  "name": "Reentrancy Detector",
  "description": "Specialized in detecting reentrancy vulnerabilities",
  "model": "anthropic/claude-3.5-sonnet",
  "system_prompt": "You are a security expert...",
  "mcp_servers": ["mcp-server-1", "mcp-server-2"],
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z",
  "owner_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Error Response:** `404 Not Found`
```json
{
  "error": "Agent not found"
}
```

---

### POST `/agents`

Create a new agent.

**Request:**
```json
{
  "name": "Reentrancy Detector",
  "description": "Specialized in detecting reentrancy vulnerabilities",
  "model": "anthropic/claude-3.5-sonnet",
  "system_prompt": "You are a security expert specialized in detecting reentrancy vulnerabilities...",
  "mcp_servers": ["mcp-server-1", "mcp-server-2"]
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid-here",
  "name": "Reentrancy Detector",
  "description": "Specialized in detecting reentrancy vulnerabilities",
  "model": "anthropic/claude-3.5-sonnet",
  "system_prompt": "You are a security expert...",
  "mcp_servers": ["mcp-server-1", "mcp-server-2"],
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z",
  "owner_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Validation:**
- `name`: Required, 1-100 characters
- `model`: Required, must be a valid OpenRouter model ID
- `system_prompt`: Required, 1-10000 characters
- `mcp_servers`: Optional array of MCP server IDs

---

### PUT `/agents/:id`

Update an existing agent.

**Request:**
```json
{
  "name": "Updated Agent Name",
  "description": "Updated description",
  "model": "anthropic/claude-3.5-sonnet",
  "system_prompt": "Updated prompt...",
  "mcp_servers": ["mcp-server-1"]
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid-here",
  "name": "Updated Agent Name",
  "description": "Updated description",
  "model": "anthropic/claude-3.5-sonnet",
  "system_prompt": "Updated prompt...",
  "mcp_servers": ["mcp-server-1"],
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z",
  "owner_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Error Response:** `403 Forbidden`
```json
{
  "error": "Not authorized to modify this agent"
}
```

**Notes:**
- Only the owner can update an agent

---

### DELETE `/agents/:id`

Delete an agent.

**Request:** (cookies included automatically)

**Response:** `200 OK`
```json
{
  "success": true
}
```

**Error Response:** `403 Forbidden`
```json
{
  "error": "Not authorized to delete this agent"
}
```

---

## MCP Server Endpoints

### GET `/mcp-servers`

List all available MCP servers.

**Request:** (cookies included automatically)

**Response:** `200 OK`
```json
{
  "servers": [
    {
      "id": "mcp-server-1",
      "name": "GitHub MCP",
      "description": "Access GitHub repositories and code",
      "enabled": true
    },
    {
      "id": "mcp-server-2",
      "name": "Etherscan MCP",
      "description": "Query Ethereum blockchain data",
      "enabled": true
    }
  ]
}
```

---

## Audit Endpoints

### GET `/audits`

List all audits for the authenticated user.

**Query Parameters:**
- `status`: Optional filter by status (`pending`, `in_progress`, `completed`)
- `limit`: Optional, default 50, max 100
- `offset`: Optional, default 0

**Request:** (cookies included automatically)

**Response:** `200 OK`
```json
{
  "audits": [
    {
      "id": "uuid-here",
      "name": "UniswapV3 Security Audit",
      "status": "in_progress",
      "contract_address": "0x...",
      "blockchain": "ethereum",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z",
      "findings_count": {
        "critical": 2,
        "high": 5,
        "medium": 8,
        "low": 12,
        "info": 3
      }
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

---

### GET `/audits/:id`

Get details of a specific audit.

**Request:** (cookies included automatically)

**Response:** `200 OK`
```json
{
  "id": "uuid-here",
  "name": "UniswapV3 Security Audit",
  "description": "Full security audit of Uniswap V3 contracts",
  "status": "in_progress",
  "contract_address": "0x...",
  "blockchain": "ethereum",
  "github_url": "https://github.com/...",
  "source_code": "contract MyContract { ... }",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z",
  "owner_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "agents_used": ["agent-id-1", "agent-id-2"]
}
```

---

### POST `/audits`

Create a new audit.

**Request:**
```json
{
  "name": "UniswapV3 Security Audit",
  "description": "Full security audit of Uniswap V3 contracts",
  "contract_address": "0x...",
  "blockchain": "ethereum",
  "github_url": "https://github.com/...",
  "source_code": "contract MyContract { ... }",
  "agents": ["agent-id-1", "agent-id-2"]
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid-here",
  "name": "UniswapV3 Security Audit",
  "description": "Full security audit of Uniswap V3 contracts",
  "status": "pending",
  "contract_address": "0x...",
  "blockchain": "ethereum",
  "github_url": "https://github.com/...",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z",
  "owner_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Validation:**
- `name`: Required, 1-200 characters
- `contract_address`: Optional, valid Ethereum address
- `blockchain`: Required, one of: `ethereum`, `polygon`, `arbitrum`, `optimism`, `base`
- Either `github_url` or `source_code` must be provided

---

### POST `/audits/:id/start`

Start running an audit.

**Request:** (cookies included automatically)

**Response:** `200 OK`
```json
{
  "id": "uuid-here",
  "status": "in_progress",
  "started_at": "2025-01-01T00:00:00Z"
}
```

**Notes:**
- This triggers the AI agents to analyze the contract
- Status changes from `pending` to `in_progress`

---

### GET `/audits/:id/findings`

Get all findings for an audit.

**Query Parameters:**
- `severity`: Optional filter by severity (`critical`, `high`, `medium`, `low`, `info`)

**Request:** (cookies included automatically)

**Response:** `200 OK`
```json
{
  "findings": [
    {
      "id": "finding-uuid",
      "audit_id": "audit-uuid",
      "title": "Reentrancy vulnerability in withdraw function",
      "description": "The withdraw function is vulnerable to reentrancy attacks...",
      "severity": "critical",
      "location": {
        "file": "MyContract.sol",
        "line": 42,
        "function": "withdraw"
      },
      "recommendation": "Use the checks-effects-interactions pattern...",
      "code_snippet": "function withdraw() public { ... }",
      "agent_id": "agent-uuid",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST `/audits/:id/report`

Generate a PDF report for the audit.

**Request:**
```json
{
  "finding_ids": ["finding-uuid-1", "finding-uuid-2"],
  "include_all": false
}
```

**Response:** `200 OK`
```json
{
  "report_url": "https://watson.app/reports/uuid-here.pdf",
  "expires_at": "2025-01-08T00:00:00Z"
}
```

**Notes:**
- If `include_all` is true, include all findings
- If `include_all` is false, only include specified `finding_ids`
- Report should be downloadable PDF
- Report URL should expire after 7 days

---

### DELETE `/audits/:id`

Delete an audit and all its findings.

**Request:** (cookies included automatically)

**Response:** `200 OK`
```json
{
  "success": true
}
```

**Error Response:** `403 Forbidden`
```json
{
  "error": "Not authorized to delete this audit"
}
```

---

## Leaderboard Endpoints

### GET `/leaderboard/auditors`

Get top auditors leaderboard.

**Query Parameters:**
- `limit`: Optional, default 10, max 100
- `timeframe`: Optional, one of `week`, `month`, `all_time` (default: `all_time`)

**Request:** (cookies included automatically)

**Response:** `200 OK`
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "ens_name": "alice.eth",
      "audits_completed": 42,
      "vulnerabilities_found": 156,
      "critical_findings": 8,
      "points": 1250
    }
  ],
  "timeframe": "all_time"
}
```

---

### GET `/leaderboard/developers`

Get top agent developers leaderboard.

**Query Parameters:**
- `limit`: Optional, default 10, max 100
- `timeframe`: Optional, one of `week`, `month`, `all_time` (default: `all_time`)

**Request:** (cookies included automatically)

**Response:** `200 OK`
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "address": "0x123...",
      "ens_name": "bob.eth",
      "agents_created": 15,
      "agents_used": 238,
      "findings_generated": 1024,
      "points": 2100
    }
  ],
  "timeframe": "all_time"
}
```

---

## Model Endpoints

### GET `/models`

Get list of available AI models from OpenRouter.

**Request:** (cookies included automatically)

**Response:** `200 OK`
```json
{
  "models": [
    {
      "id": "anthropic/claude-3.5-sonnet",
      "name": "Claude 3.5 Sonnet",
      "description": "Most intelligent model",
      "context_length": 200000,
      "pricing": {
        "prompt": "0.003",
        "completion": "0.015"
      }
    },
    {
      "id": "openai/gpt-4-turbo",
      "name": "GPT-4 Turbo",
      "description": "OpenAI's most capable model",
      "context_length": 128000,
      "pricing": {
        "prompt": "0.01",
        "completion": "0.03"
      }
    }
  ]
}
```

**Notes:**
- Cache this data on backend (refresh every 24 hours)
- Fetch from OpenRouter API: `https://openrouter.ai/api/v1/models`

---

## Database Schema Recommendations

### Sessions Table
```sql
CREATE TABLE sessions (
  sid         UUID PRIMARY KEY,
  address     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_sessions_address ON sessions(address);
```

### Nonces Table
```sql
CREATE TABLE auth_nonces (
  nonce       TEXT PRIMARY KEY,
  issued_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_nonces_expires_at ON auth_nonces(expires_at);
```

### Agents Table
```sql
CREATE TABLE agents (
  id              UUID PRIMARY KEY,
  owner_address   TEXT NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  model           TEXT NOT NULL,
  system_prompt   TEXT NOT NULL,
  mcp_servers     TEXT[], -- Array of MCP server IDs
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agents_owner ON agents(owner_address);
```

### Audits Table
```sql
CREATE TABLE audits (
  id                UUID PRIMARY KEY,
  owner_address     TEXT NOT NULL,
  name              TEXT NOT NULL,
  description       TEXT,
  status            TEXT NOT NULL, -- pending, in_progress, completed
  contract_address  TEXT,
  blockchain        TEXT NOT NULL,
  github_url        TEXT,
  source_code       TEXT,
  agents_used       UUID[], -- Array of agent IDs
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ
);

CREATE INDEX idx_audits_owner ON audits(owner_address);
CREATE INDEX idx_audits_status ON audits(status);
```

### Findings Table
```sql
CREATE TABLE findings (
  id              UUID PRIMARY KEY,
  audit_id        UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  agent_id        UUID NOT NULL REFERENCES agents(id),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  severity        TEXT NOT NULL, -- critical, high, medium, low, info
  location_file   TEXT,
  location_line   INTEGER,
  location_function TEXT,
  recommendation  TEXT,
  code_snippet    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_findings_audit ON findings(audit_id);
CREATE INDEX idx_findings_severity ON findings(severity);
```

---

## CORS Configuration

The backend must allow CORS with credentials from the frontend domain:

```go
// Example CORS headers
Access-Control-Allow-Origin: http://localhost:3000 (or your frontend domain)
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Cookie
```

---

## Cookie Configuration

Session cookies must be configured securely:

```go
// Example cookie settings
Name: "session_id"
HttpOnly: true
Secure: true (in production)
SameSite: Strict
Path: "/"
MaxAge: 86400 (24 hours)
```

---

## Error Response Format

All error responses should follow this format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {} // Optional additional details
}
```

Common HTTP status codes:
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error
