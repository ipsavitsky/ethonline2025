# Watson Backend - Quick Start Guide

## Setup

### 1. Environment Variables

Create a `.env` file in the backend directory:

```bash
# Required
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
SIWE_DOMAIN=localhost
SIWE_ORIGIN=http://localhost:3000
SIWE_CHAIN_ID=1

# Optional (with defaults)
SQLITE_DSN=file:app.db?_foreign_keys=on&_busy_timeout=5000
COOKIE_NAME=sid
NONCE_TTL=5m
SESSION_TTL=24h
ADDR=:8080
CORS_ORIGIN=http://localhost:3000
```

### 2. Run the Server

```bash
cd backend
go run ./cmd/server
```

The server will:
- Create SQLite database (`app.db`)
- Run migrations automatically
- Start listening on `:8080`

## API Usage Examples

### 1. Authentication Flow

```bash
# Get nonce
curl -X POST http://localhost:8080/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "chainId": 1,
    "origin": "http://localhost:3000"
  }'

# Response: { "nonce": "...", "message": "..." }

# Sign the message with your wallet, then verify
curl -X POST http://localhost:8080/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "message": "...",
    "signature": "0x..."
  }' \
  --cookie-jar cookies.txt

# Check session
curl http://localhost:8080/auth/me \
  --cookie cookies.txt
```

### 2. Create an Agent

```bash
curl -X POST http://localhost:8080/agents \
  -H "Content-Type: application/json" \
  --cookie cookies.txt \
  -d '{
    "name": "Reentrancy Detector",
    "description": "Finds reentrancy vulnerabilities",
    "model": "anthropic/claude-3.5-sonnet",
    "system_prompt": "You are a security expert specialized in finding reentrancy bugs...",
    "mcp_servers": ["13bde052-1c2d-46f8-983f-cc868014c40f"]
  }'
```

### 3. List Your Agents

```bash
curl http://localhost:8080/agents \
  --cookie cookies.txt
```

### 4. Create an Audit

```bash
curl -X POST http://localhost:8080/audits \
  -H "Content-Type: application/json" \
  --cookie cookies.txt \
  -d '{
    "name": "UniswapV3 Security Audit",
    "description": "Full security review",
    "blockchain": "ethereum",
    "github_url": "https://github.com/Uniswap/v3-core",
    "agents": ["<agent-id-from-step-2>"]
  }'
```

### 5. Start the Audit

```bash
curl -X POST http://localhost:8080/audits/<audit-id>/start \
  -H "Content-Type: application/json" \
  --cookie cookies.txt
```

### 6. Check Audit Status

```bash
# Get specific audit
curl http://localhost:8080/audits/<audit-id> \
  --cookie cookies.txt

# List all audits
curl http://localhost:8080/audits \
  --cookie cookies.txt

# Filter by status
curl "http://localhost:8080/audits?status=in_progress&limit=10" \
  --cookie cookies.txt
```

### 7. Get MCP Servers

```bash
curl http://localhost:8080/mcp-servers \
  --cookie cookies.txt
```

## API Response Examples

### Audit Response
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "owner_address": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
  "name": "UniswapV3 Security Audit",
  "description": "Full security review",
  "status": "in_progress",
  "blockchain": "ethereum",
  "github_url": "https://github.com/Uniswap/v3-core",
  "agents_used": ["agent-id-1"],
  "created_at": "2025-10-25T12:00:00Z",
  "updated_at": "2025-10-25T12:05:00Z",
  "started_at": "2025-10-25T12:05:00Z"
}
```

### Agent Response
```json
{
  "id": "agent-id-1",
  "owner_address": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
  "name": "Reentrancy Detector",
  "description": "Finds reentrancy vulnerabilities",
  "model": "anthropic/claude-3.5-sonnet",
  "system_prompt": "You are a security expert...",
  "mcp_servers": ["13bde052-1c2d-46f8-983f-cc868014c40f"],
  "created_at": "2025-10-25T12:00:00Z",
  "updated_at": "2025-10-25T12:00:00Z"
}
```

## Development Tips

### Reset Database
```bash
rm app.db
# Restart server - migrations will run automatically
```

### Check Logs
The server logs all requests and errors to stdout.

### CORS Issues
Make sure `CORS_ORIGIN` matches your frontend URL exactly.

### Session Cookies
- Sessions expire after `SESSION_TTL` (default: 24h)
- Cookies are HttpOnly, Secure, SameSite=Strict
- Cookie name is configurable via `COOKIE_NAME`

## Next Steps

- Implement AI agent execution logic in `handleStartAudit`
- Add webhook/SSE for real-time audit progress
- Implement findings endpoints
- Add report generation

