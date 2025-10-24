#!/usr/bin/env bash

set -e

export RPC_URL="${RPC_URL:-https://sepolia.infura.io/v3/YOUR_INFURA_KEY}"
export SIWE_DOMAIN="${SIWE_DOMAIN:-localhost}"
export SIWE_ORIGIN="${SIWE_ORIGIN:-http://localhost:3000}"
export SIWE_CHAIN_ID="${SIWE_CHAIN_ID:-11155111}"
export ADDR="${ADDR:-:8080}"

cleanup() {
  echo "Shutting down..."
  kill 0
}

trap cleanup EXIT

echo "Starting backend on ${ADDR}..."
(cd backend && go run cmd/server/main.go) &

echo "Starting frontend on :3000..."
(cd frontend && bun run dev) &

wait
