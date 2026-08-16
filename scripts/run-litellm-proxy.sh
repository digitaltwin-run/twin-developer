#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
if ! command -v litellm >/dev/null 2>&1; then
  echo "litellm CLI is missing. Install requirements.txt in a virtual environment." >&2
  exit 127
fi
"${PYTHON:-python3}" scripts/render-litellm-config.py --use-env --output data/output/litellm-proxy.runtime.yaml >/dev/null
exec litellm --config data/output/litellm-proxy.runtime.yaml --host "${LITELLM_HOST:-127.0.0.1}" --port "${LITELLM_PORT:-4000}"
