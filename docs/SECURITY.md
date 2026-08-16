# Security and privacy

## Threat model

1. Sekret w historii może zostać wysłany do zewnętrznego modelu.
2. Agent może opisać sukces, którego nie potwierdza test.
3. Stary prompt może nadpisać bieżący SSOT.
4. Jednorazowy incydent może zostać błędnie zgeneralizowany.
5. LLM może zwrócić obce evidenceRefs, reguły lub komendy.
6. Aider może otrzymać zbyt szeroki kontekst albo sam wykonać commit.

## Controls

- lokalna redakcja przed wysłaniem;
- hashe raw source i eventów;
- dwa rankingi prawdy;
- strict JSON Schema i walidacja TypeScript;
- allowlista komend w guidelines;
- candidate rules są propose-only;
- Aider dry-run i no-auto-commits;
- brak sekretów w LLM audit;
- fail-closed w `require-llm`;
- osobna zgoda na source mutation, commit, deployment i secret mutation.

## Data retention

W produkcyjnym wdrożeniu należy dodać jawny retention period, możliwość usunięcia raw historii, rotację auditów i wersjonowaną zgodę właściciela danych. Bliźniak powinien przechowywać minimalne evidence excerpts zamiast pełnych rozmów.
