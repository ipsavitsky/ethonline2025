# Ethonline 2025 submission

This is a submission for the Ethonline 2025 event

## Structure
- `frontend/` - Next.js frontend for the Watson platform
- `backend/` - Go backend

## Setup

### Nix

If you are running on nix, there is a flake with developer environment in it.
To activate it, run `nix develop`

### Frontend

Frontend uses `bun` as its javascript runtime.

First, change your working directory to `frontend/`: `cd frontend`

## Commands

### For frontend
Ran from `frontend/`
```bash
# Run development frontend server
bun run dev

# Run linter for frontend
bun run lint

# Build frontend for production
bun run build

# Start production frontend server
bun run start
```

### For backend
Ran from `backend/`
```bash
# To run the backend
go run cmd/server/main.go
```

## Frontend development mode

The frontend includes a **development mode** that allows you to work on the UI without requiring:
- A running backend
- Wallet browser extensions (MetaMask, etc.)
- WalletConnect configuration

### Enable Dev Mode

Set in `.env.local`:
```bash
NEXT_PUBLIC_DEV_MODE=true
```

### Using Dev Mode

- ✅ Skips all backend API calls (no network errors)
- ✅ Skips Web3 wallet connection (no MetaMask/WalletConnect needed)
- ✅ Uses a mock wallet address for testing UI
- ✅ Simple "Login (Dev Mode)" button instead of wallet connection
- ✅ All protected routes work without real authentication

1. Go to `/login`
2. Click "Login (Dev Mode)" button
3. You'll be logged in with a mock address: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
4. Navigate to dashboard and test all features

## Documentation

- **Authentication**: See `frontend/docs/AUTHENTICATION.md` for details on Web3 authentication flow
- **API Documentation**: See `API_ENDPOINTS.md` for details on API endpoints and usage
