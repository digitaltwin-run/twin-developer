#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
if ! command -v aider >/dev/null 2>&1; then
  echo "aider is not installed. Install aider-chat in an isolated environment." >&2
  exit 127
fi
if [[ ! -f data/output/aider-message.md ]]; then
  make aider-context
fi
ALIAS="$("${PYTHON:-python3}" -c 'import json; print(json.load(open("config/model-registry.json"))["stages"]["code-editing"]["alias"])')"
truthy() { [[ "${1:-}" =~ ^(1|true|yes|on)$ ]]; }
if [[ -n "${AIDER_MODEL:-}" ]]; then
  MODEL="$AIDER_MODEL"
elif truthy "${LOCAL_LLM_ENABLED:-false}" && [[ -n "${LOCAL_LLM_API_BASE:-}" && -n "${LOCAL_LLM_MODEL:-}" ]]; then
  MODEL="openai/${LOCAL_LLM_MODEL}"
  export OPENAI_API_BASE="$LOCAL_LLM_API_BASE"
  export OPENAI_API_KEY="${LOCAL_LLM_API_KEY:-local-not-required}"
elif truthy "${OPENROUTER_DIRECT_ENABLED:-false}" && [[ -n "${OPENROUTER_API_KEY:-}" ]]; then
  MODEL="openrouter/${OPENROUTER_CODE_MODEL:-openrouter/auto}"
else
  MODEL="openai/${ALIAS}"
  export OPENAI_API_BASE="${OPENAI_API_BASE:-${LITELLM_PROXY_URL:-http://127.0.0.1:4000/v1}}"
  export OPENAI_API_KEY="${OPENAI_API_KEY:-${LITELLM_MASTER_KEY:-change-me}}"
fi
ARGS=(
  --model "$MODEL"
  --message-file data/output/aider-message.md
  --read data/output/developer-twin.dsl.json
  --read project/ticket-001/intent.json
  --no-auto-commits
)
if [[ "${AIDER_APPLY:-0}" != "1" ]]; then
  ARGS+=(--dry-run)
fi
exec aider "${ARGS[@]}" "$@"
