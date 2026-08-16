# Security and privacy

## Threat model

1. Sekret w historii może zostać wysłany do zewnętrznego modelu.
2. Agent może opisać sukces, którego nie potwierdza test.
3. Stary prompt może nadpisać bieżący SSOT.
4. Jednorazowy incydent może zostać błędnie zgeneralizowany.
5. LLM może zwrócić obce evidenceRefs, reguły lub komendy.
6. Aider może otrzymać zbyt szeroki kontekst albo sam wykonać commit.

## Controls

- redakcja w warstwie ingest TypeScript **(uwaga: nie obejmuje usługi Python — patrz Znane luki)**;
- hashe raw source i eventów;
- dwa rankingi prawdy;
- strict JSON Schema dla artefaktów **i konfiguracji**, plus walidacja TypeScript;
- allowlista komend na wektorze tokenów, z odrzuceniem każdej składni powłoki
  (`src/util/command.ts`, wektory w `tests/command.test.ts`);
- routing LLM fail-closed: brak jawnej flagi znaczy trasa wyłączona
  (`llm_service.core.flag_enabled`, bramka `scripts/check-flag-parity.py`);
- usługa REST wymaga `X-Twin-Token`, gdy jest ustawiony; bind spoza loopbacku
  wymaga `TWIN_ALLOW_REMOTE=1` **oraz** niepustego `TWIN_API_TOKEN`;
- proweniencja w artefaktach: `generator.provider/model/responseId/auditRef`;
  `llmUsed: true` bez providera jest odrzucane jako `blocking`, a wynik fixture'u
  daje diagnostykę `DT_FIXTURE_PROVENANCE`;
- bramka reprodukowalności `scripts/verify-artifacts.sh` — commitowany baseline
  musi być deterministyczny i odtwarzalny bez sieci;
- audyt zapisuje również niepowodzenia (`status: failed`);
- candidate rules są propose-only;
- Aider dry-run i no-auto-commits;
- brak sekretów w LLM audit;
- fail-closed w `require-llm`;
- osobna zgoda na source mutation, commit, deployment i secret mutation.

## Znane luki

Otwarte, z pełnym opisem w `docs/AUDIT_AND_AUTONOMY_PLAN.md`:

- **A-4** — redakcja sekretów działa wyłącznie w warstwie TypeScript. Usługa Python
  przekazuje payload do dostawcy bez inspekcji, więc każdy inny konsument
  (`/v1/chat/completions`, skrypt, drugi agent) omija tę kontrolę.
- **A-5** — `data/normalized/events.jsonl` zapisuje pole `text` w wersji surowej
  obok `redactedText`.
- **A-6** — wzorce nie obejmują tokenów GitHub, AWS, Slack, JWT ani bloków klucza
  prywatnego, a heurystyka hex redaguje SHA commitów.
- **A-7** — `forbiddenEffects` z ticketu nie jest egzekwowane przez żadną bramkę.

## Data retention

W produkcyjnym wdrożeniu należy dodać jawny retention period, możliwość usunięcia raw historii, rotację auditów i wersjonowaną zgodę właściciela danych. Bliźniak powinien przechowywać minimalne evidence excerpts zamiast pełnych rozmów.
