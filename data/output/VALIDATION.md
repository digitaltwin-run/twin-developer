# Validation receipt

Data: 2026-08-16  
Workspace: standalone example artifact (no Git revision attached)

## Executed

### `make test` — PASS

- model-registry / generated LiteLLM facade parity: PASS
- TypeScript build: PASS
- Node tests: 4/4 PASS
  - histories → evidence-grounded twin
  - unknown evidence rejection
  - secret redaction
  - shell-history adapter
- Python tests: 3/3 PASS
  - fake structured intents/guidelines
  - fake chat/health/audit
  - local → proxy → OpenRouter routing and registry aliases

### `make llm-fake-demo` — PASS

- TypeScript → FastAPI REST → structured fake LLM → TypeScript validation
- events: 161
- deterministic rules: 10
- candidate rules: 1
- guideline steps: 7
- `llmUsed=true`, `degraded=false`

Snapshot: `data/output/examples/llm-fake/`.

### `make demo` — PASS

- deterministic, no network
- events: 161
- rules: 10
- evidence records used by the DSL: 115
- guideline steps: 7
- `llmUsed=false`, `degraded=false`

Snapshot: `data/output/examples/deterministic/` and main files in `data/output/`.

### `make validate` — PASS

- runtime invariants: PASS
- `developer-twin.schema.json`: PASS
- `guidelines.schema.json`: PASS

## Not executed

- **Live OpenRouter:** not run; no private `OPENROUTER_API_KEY` was supplied. The real path is configured and uses fail-closed `require-llm`.
- **Aider source edit:** not run; `aider` executable is not installed in this environment. The wrapper, model routing and validated `--message-file` artifact were generated and shell-checked.
- **Production deployment:** outside the example ticket scope.
