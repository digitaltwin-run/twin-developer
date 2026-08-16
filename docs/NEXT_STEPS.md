# Next steps

## P0 — reality adapters

- Git adapter: exact SHA, branch, diff, authorship mapping without identity guessing.
- AST/config adapter: symbols, endpoints, schemas, deployment configuration.
- TestQL adapter: command, exit code, revision, timestamps and output hash.
- Runtime adapter: health endpoint, environment identity and observation scope.
- Ticket adapter: active lifecycle, allowed paths and acceptance criteria.

## P0 — governance and promotion

- Add `twin-rule-proposal/v1`, `twin-rule-approval/v1` and `twin-rule-supersession/v1`.
- Bind promotion `candidate → active` to reviewer identity and exact artifact hash.
- Block Aider apply when active ticket or allowed paths are missing.

## P1 — todo2code integration

- Import native `t2c.intent/v1` records instead of only normalized prompt events.
- Reuse the graph/linker and diagnostics for Intent vs Reality.
- Store developer-twin rules as a governed projection of the graph, not a competing facts database.

## P1 — model routing

- Route privacy-sensitive stages to a local model.
- Use central LiteLLM budgets, retries, fallbacks and per-stage aliases.
- Use a separate validation model/provider when risk justifies independence.
- Record provider/model/response ID/token/cost without raw prompts.

## P1 — Aider receipts

- Generate an allowed-file manifest from ticket intent.
- Capture proposed patch hash before apply.
- Re-run reality analysis after editing.
- Produce acceptance/close artifact; never auto-DONE.

## P2 — semantic benchmark

Create a labeled dataset of prompt fragments with:

- durable rule vs one-off command;
- correction/supersession;
- context boundary;
- current fact vs expectation;
- subjective/non-falsifiable statement;
- secret-bearing sample;
- agent claim vs receipt.

Measure precision, recall, citation completeness, conflict handling and stability across repeated runs.
