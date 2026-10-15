# Ticket 006: Reconcile governance required checks and ticket-005 intent

- **ID**: ticket-006
- **Owner**: agent:antigravity
- **Status**: IN_PROGRESS
- **Workflow state**: VALIDATION
- **Created**: 2026-10-15

## Goal and scope

SESSION_EXECUTION_AUTHORIZATION: user requested inspecting and repairing issues across subactor repositories.
1. Reconcile repository identity in `.governance/required-checks.json` to `digitaltwin-run/twin-developer`.
2. Reconcile merged ticket-005 status in `project/ticket-005/README.md` to `DONE`.
3. Fix schema compliance of `project/ticket-005/intent.json` so intent conforms to v3 required fields.
4. Fix marker pair in `project/TICKETS.md` so `readme.sh` can generate ticket indexing.
5. Update `.gitignore` to prevent transient cursor and koru files from making checkouts dirty.

## Acceptance criteria

- [x] AC-01: `.governance/required-checks.json` declares repository `digitaltwin-run/twin-developer`.
- [x] AC-02: `project/ticket-005/README.md` is marked `Status: DONE` and `Workflow state: DONE`.
- [x] AC-03: `project/ticket-005/intent.json` conforms to `new-project.intent/v3`.
- [x] AC-04: `project/TICKETS.md` contains the auto-generation markers and valid index table.
- [x] AC-05: Governance check `./project/governance-check.sh` passes cleanly with 0 errors.

## Validation

- Governance: `./project/governance-check.sh` reports `GOV-PASS: passed (0 errors, 0 warnings)`.
- Tests: `pytest` passes cleanly.

## Tracking boundary

This directory contains the minimal reviewed intent. Optional participant prose
and raw command logs are not required delivery output.
