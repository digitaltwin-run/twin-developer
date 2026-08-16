#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PORT="${TWIN_LLM_PORT:-8099}"
LOG="data/output/fake-llm-service.log"
mkdir -p data/output
TWIN_LLM_FAKE=1 TWIN_LLM_AUDIT_PATH=data/output/llm-audit.jsonl \
  "${PYTHON:-python3}" -m llm_service.cli serve --host 127.0.0.1 --port "$PORT" >"$LOG" 2>&1 &
PID=$!
cleanup() {
  kill "$PID" 2>/dev/null || true
  wait "$PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${PORT}/healthz" >/dev/null 2>&1; then
    break
  fi
  sleep 0.1
done
curl -fsS "http://127.0.0.1:${PORT}/healthz" >/dev/null
TWIN_NOW="${TWIN_NOW:-2026-08-16T12:00:00Z}" TWIN_LLM_URL="http://127.0.0.1:${PORT}" \
  node dist/src/cli.js demo --mode require-llm --llm-url "http://127.0.0.1:${PORT}"
