# Watson Backend - API Implementation

## Implemented Endpoints

### Authentication
- ✅ `POST /auth/nonce` - Generate nonce for SIWE
- ✅ `POST /auth/verify` - Verify SIWE signature and create session
- ✅ `GET /auth/me` - Get current user address
- ✅ `POST /auth/logout` - Logout and clear session

### Agents
- ✅ `GET /agents` - List all user's agents
- ✅ `GET /agents/{id}` - Get specific agent
- ✅ `POST /agents` - Create new agent
- ✅ `PUT /agents/{id}` - Update agent
- ✅ `DELETE /agents/{id}` - Delete agent

### MCP Servers
- ✅ `GET /mcp-servers` - List available MCP servers

### Audits
- ✅ `GET /audits` - List all user's audits (with filtering by status, limit, offset)
- ✅ `GET /audits/{id}` - Get specific audit
- ✅ `POST /audits` - Create new audit
- ✅ `POST /audits/{id}/start` - Start running an audit (triggers AI analysis)

## Database Migrations

All migrations are in `internal/db/migrations/`:

1. **0001_init.sql** - Auth tables (nonces, sessions)
2. **0002_agents.sql** - Agents and MCP servers tables
3. **0003_audits.sql** - Audits and findings tables

## Running the Server

1. Set up environment variables (see `.env.example`)
2. Run migrations (automatic on startup)
3. Start server:

```bash
cd backend
go run ./cmd/server
```

Default port: `:8080`

## Environment Variables

Required:
- `RPC_URL` - Ethereum RPC endpoint
- `SIWE_DOMAIN` - Domain for SIWE (e.g., localhost)
- `SIWE_ORIGIN` - Origin URL (e.g., http://localhost:3000)
- `SIWE_CHAIN_ID` - Chain ID (e.g., 1 for mainnet)

Optional:
- `SQLITE_DSN` - SQLite database path (default: file:app.db)
- `COOKIE_NAME` - Session cookie name (default: sid)
- `NONCE_TTL` - Nonce expiration time (default: 5m)
- `SESSION_TTL` - Session expiration time (default: 24h)
- `ADDR` - Server address (default: :8080)
- `CORS_ORIGIN` - CORS origin (default: http://localhost:3000)

## Features

### Security
- HttpOnly, Secure, SameSite=Strict cookies
- CORS support with credentials
- SIWE (Sign-In with Ethereum) authentication
- Support for both EOA and ERC-1271 contract wallets
- Nonce-based signature verification

### Validation
- Input validation for all endpoints
- Owner-based authorization
- JSON schema validation

### Database
- SQLite with foreign keys
- Automatic migrations using goose
- Indexed queries for performance

