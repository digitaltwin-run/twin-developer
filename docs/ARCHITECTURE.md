# Architecture

## Warstwy

### 1. Evidence ingestion

Adaptery emitują `PromptEvent` z aktorem, kolejnością, źródłem, hashem i zredagowaną treścią. Raw input nie jest traktowany jako jedna długa instrukcja systemowa.

### 2. Deterministic extraction

`config/rule-catalog.json` zawiera testowalne wzorce trwałych zachowań. Aktywowana reguła musi mieć minimalne wsparcie w wypowiedziach człowieka. Accepted shell command może być obserwacją zachowania, ale nie aktywuje samodzielnie normatywnej reguły.

### 3. Optional semantic enrichment

Python/LiteLLM może zaproponować nowe reguły. TypeScript sprawdza schema, `evidenceRefs`, confidence i generalization risk. Wynik ma status `candidate`.

### 4. Policy aggregation

`subactor.developer-twin/v1` scala source policy, rules, workflow, autonomy, model routing, evidence and diagnostics.

### 5. Project reality

Osobne adaptery ustalają bieżące fakty. W przykładzie zaimplementowano offer catalog reconciliation. Kolejne adaptery powinny emitować evidence records z rewizją, timestampem, zakresem i reprodukowalnym zapytaniem.

### 6. Effect boundary

Aider lub inny coding agent dostaje tylko zatwierdzony kontekst. Policy DSL nie uruchamia kodu. Wykonanie, receipty i review są osobnymi artefaktami.

## Stabilne kontrakty

- `schemas/developer-twin.schema.json`
- `schemas/llm-intent-extraction.schema.json`
- `schemas/guidelines.schema.json`
- `config/source-policy.json`
- `config/llm-routing.json`
