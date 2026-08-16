#!/usr/bin/env bash
# B-3: bramka reprodukowalności artefaktów.
#
# `render-litellm-config.py --check` dowodzi, że fasada proxy jest generowana
# z model-registry. Dla data/output i data/normalized takiej bramki nie było,
# więc ręczna edycja artefaktu przechodziła przez wszystkie testy.
#
# Regeneracja jest deterministyczna przy przypiętym TWIN_NOW, więc bierzemy
# `generatedAt` z commitowanego artefaktu, odtwarzamy przebieg i porównujemy hashe.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DSL="data/output/developer-twin.dsl.json"
ARTIFACTS=(
  "data/normalized/source-manifest.json"
  "data/normalized/events.jsonl"
  "data/normalized/extraction-map.json"
  "data/output/developer-twin.dsl.json"
  "data/output/developer-twin.md"
  "data/output/guidelines.json"
  "data/output/guidelines.md"
  "data/output/offer-reality.json"
  "data/output/offer-reality.md"
  "data/output/aider-message.md"
)

if [[ ! -f "$DSL" ]]; then
  echo "ARTIFACT-VERIFY-FAIL: brak $DSL — uruchom 'make demo'." >&2
  exit 1
fi

PINNED_NOW="$("${PYTHON:-python3}" -c "import json,sys; print(json.load(open('$DSL'))['generatedAt'])")"
LLM_USED="$("${PYTHON:-python3}" -c "import json; print(json.load(open('$DSL'))['generator'].get('llmUsed'))")"

if [[ "$LLM_USED" == "True" ]]; then
  echo "ARTIFACT-VERIFY-FAIL: commitowany baseline ma llmUsed=true." >&2
  echo "  Baseline musi być deterministyczny i odtwarzalny bez sieci ani fixture'u." >&2
  exit 1
fi

BEFORE="$(mktemp)"
AFTER="$(mktemp)"
trap 'rm -f "$BEFORE" "$AFTER"' EXIT
sha256sum "${ARTIFACTS[@]}" > "$BEFORE"

TWIN_NOW="$PINNED_NOW" node dist/src/cli.js demo --mode deterministic > /dev/null
sha256sum "${ARTIFACTS[@]}" > "$AFTER"

if ! diff -q "$BEFORE" "$AFTER" > /dev/null; then
  echo "ARTIFACT-DRIFT: commitowane artefakty nie odpowiadają wejściom i kodowi." >&2
  diff "$BEFORE" "$AFTER" >&2 || true
  echo "  Artefakty w drzewie roboczym zostały właśnie przegenerowane — sprawdź 'git diff'." >&2
  exit 1
fi

echo "ARTIFACT-VERIFY-PASS ${#ARTIFACTS[@]} artefaktów, TWIN_NOW=$PINNED_NOW"
