# Ethonline 2025 submission

This is a submission for the Ethonline 2025 event

## Structure
- `frontend/` has a next.js frontend for this platform

## Setup
### Nix

If you are running on nix, there is a flake with developer environment in it.
To activate it, run `nix develop`

### Frontend

Frontend uses `bun` as its javascript runtime.

First, change your working directory to `frontend/`: `cd frontend`

Install dependencies: `bun install`
Run frontend: `bun run dev`
Lint frontend: `bun run lint`
