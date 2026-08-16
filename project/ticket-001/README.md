# ticket-001 — Developer Digital Twin from prompt histories

Status: **DONE (example implementation)**  
Workstream: `runtime_service`  
Owner: `human:founder`  
Agent role: `agent:implementation` (propose/implement/test; no merge authority)

## Problem

Histories from IDE/chat/shell contain useful knowledge about how the developer resolves conflicts, validates changes and organizes Subactor work. They also contain stale facts, incorrect agent claims, context-specific commands and secrets. Passing the raw history directly to a coding LLM would reproduce those contradictions instead of controlling them.

## Goal

Create a governed, evidence-grounded **behavioral execution-policy twin** that:

1. ingests the two supplied histories;
2. redacts secrets and preserves provenance;
3. separates human intent from project reality;
4. generates and validates a DSL;
5. exposes Python CLI/shell/REST backed by LiteLLM/OpenRouter or a local endpoint;
6. produces validated guidelines and an Aider message;
7. remains propose-only until explicit source-mutation approval.

## Acceptance criteria

- [x] AC-01 — Markdown transcript and Cursor export are parsed into normalized append-only events.
- [x] AC-02 — Every active rule has existing `evidenceRefs`, scope, confidence and conflict policy.
- [x] AC-03 — Agent statements cannot activate a rule or become a test receipt.
- [x] AC-04 — Context conflict “remove this Docker” vs “use Docker for production parity” remains contextual.
- [x] AC-05 — Current offer is read from versioned HOME and prompt price claims are reported separately.
- [x] AC-06 — Python service provides CLI, interactive shell and REST; real mode uses LiteLLM, fake mode is testable offline.
- [x] AC-07 — TypeScript validates all LLM evidence references and guideline rule references.
- [x] AC-08 — Aider receives a minimal validated message and defaults to dry-run/no auto-commit.
- [x] AC-09 — TypeScript, Python and JSON Schema tests pass.
- [x] AC-10 — README documents setup, routing, source hierarchy, limitations and next steps.

## Validation receipts

See `changelog.md` and generated files in `data/output/`. The verified commands are:

```bash
make test
make llm-fake-demo
make validate
```

A live OpenRouter request is intentionally not part of the offline acceptance gate; it requires a private key and is performed with `--mode require-llm` in the target environment.
