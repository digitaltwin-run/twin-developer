# Security and privacy

## Threat model

1. Sekret w historii może zostać wysłany do zewnętrznego modelu.
2. Agent może opisać sukces, którego nie potwierdza test.
3. Stary prompt może nadpisać bieżący SSOT.
4. Jednorazowy incydent może zostać błędnie zgeneralizowany.
5. LLM może zwrócić obce evidenceRefs, reguły lub komendy.
6. Aider może otrzymać zbyt szeroki kontekst albo sam wykonać commit.

## Controls

- redakcja sekretów: wspólne HOME `config/redaction-patterns.json`
  (`subactor.developer-twin.redaction/v1`), ingest TypeScript
  (`src/util/redaction.ts`) oraz ostatnia bramka przed `completion(...)`
  w Pythonie (`llm_service/redaction.py`); parzystość JS↔Python:
  `scripts/check-redaction-parity.py`;
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

- **A-4 / A-5 / A-6** — zamknięte w Group A: wspólne HOME wzorców, redakcja
  w ingestcie i przed wyjściem LLM, brak surowego `text` w `PromptEvent`,
  rozszerzone wzorce + `mustSurvive` dla SHA/prozy, bramka parzystości.
- **A-7** — `forbiddenEffects` z ticketu nie jest egzekwowane przez żadną bramkę.

## Data retention

W produkcyjnym wdrożeniu należy dodać jawny retention period, możliwość usunięcia raw historii, rotację auditów i wersjonowaną zgodę właściciela danych. Bliźniak powinien przechowywać minimalne evidence excerpts zamiast pełnych rozmów.
