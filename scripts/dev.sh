#!/usr/bin/env bash
#
# Certify — one-command full-stack dev runner.
#   ./scripts/dev.sh   (or: npm run dev)
#
# Installs missing deps, starts the Hardhat node, waits for RPC, deploys the
# contracts (writing deployment.json + ABI into the frontend), then runs the
# backend and frontend. Ctrl+C stops everything cleanly.
#
# ZK proofs are optional: if the circuit artifacts aren't built, the app still
# runs — only on-chain proof verification is disabled (build with `cd zk && ./build.sh`).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
LOGDIR="$ROOT/.dev-logs"
mkdir -p "$LOGDIR"
RPC="http://127.0.0.1:8545"

say()  { printf "\033[1;36m▸ certify\033[0m %s\n" "$*"; }
err()  { printf "\033[1;31m✗ certify\033[0m %s\n" "$*" >&2; }

# Kill the whole process group on any exit so no server is left orphaned.
cleanup() { trap - EXIT INT TERM; echo; say "stopping all services…"; kill 0 2>/dev/null || true; }
trap cleanup EXIT INT TERM

rpc_up() {
  curl -s -m 2 -X POST "$RPC" -H 'Content-Type: application/json' \
    --data '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}' 2>/dev/null \
    | grep -q '"result"'
}

# 1. Dependencies (only on first run)
for d in contracts backend frontend; do
  if [ ! -d "$ROOT/$d/node_modules" ]; then
    say "installing $d dependencies (first run, this may take a minute)…"
    ( cd "$ROOT/$d" && npm install )
  fi
done

# 2. Hardhat node (reuse one if it's already running)
if rpc_up; then
  say "reusing the Hardhat node already running on :8545"
else
  say "starting Hardhat node on :8545…"
  ( cd "$ROOT/contracts" && npx hardhat node ) > "$LOGDIR/hardhat.log" 2>&1 &
  ( tail -n +1 -f "$LOGDIR/hardhat.log" | sed $'s/^/\033[90m[chain]\033[0m /' ) &
  say "waiting for RPC…"
  for i in $(seq 1 120); do
    rpc_up && break
    sleep 0.5
    if [ "$i" -eq 120 ]; then err "RPC never came up — see $LOGDIR/hardhat.log"; exit 1; fi
  done
fi
say "RPC ready."

# 3. Deploy — but skip if a previous deployment is still live on this node, so
#    reusing a running node preserves your issuer/holder/certificate state.
#    Force a fresh deploy with:  FORCE_DEPLOY=1 npm run dev
REG=""
if [ -f "$ROOT/frontend/src/lib/deployment.json" ]; then
  REG=$(node -e "try{process.stdout.write(require('$ROOT/frontend/src/lib/deployment.json').registry||'')}catch(e){}" 2>/dev/null || true)
fi
HAS_CODE=0
if [ -n "$REG" ] && [ "$REG" != "0x0000000000000000000000000000000000000000" ]; then
  CODE=$(curl -s -m 3 -X POST "$RPC" -H 'Content-Type: application/json' \
    --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_getCode\",\"params\":[\"$REG\",\"latest\"]}" 2>/dev/null || true)
  case "$CODE" in
    *'"result":"0x"'*) HAS_CODE=0 ;;
    *'"result"'*) HAS_CODE=1 ;;
  esac
fi
if [ "${FORCE_DEPLOY:-0}" = "1" ] || [ "$HAS_CODE" != "1" ]; then
  say "deploying contracts…"
  ( cd "$ROOT/contracts" && npm run deploy:local )
else
  say "existing deployment still live at $REG — skipping deploy (state preserved; FORCE_DEPLOY=1 to redeploy)"
fi

if [ ! -f "$ROOT/frontend/public/zk/range.wasm" ]; then
  say "note: ZK artifacts not built — 'Verify on-chain' is disabled until you run 'cd zk && ./build.sh'. Everything else works."
fi

# 4. Backend
say "starting backend on :4000…"
( cd "$ROOT/backend" && npm run dev ) > "$LOGDIR/backend.log" 2>&1 &
( tail -n +1 -f "$LOGDIR/backend.log" | sed $'s/^/\033[35m[api]\033[0m /' ) &

# 5. Frontend (foreground — Ctrl+C here tears the whole stack down)
say "starting frontend on :5173 — open http://localhost:5173  (Ctrl+C to stop everything)"
( cd "$ROOT/frontend" && npm run dev )
