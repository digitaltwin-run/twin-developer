# ticket-002 — Faza 0 planu autonomii

- **Status**: DONE
- **Workflow state**: PUBLICATION
- **Owner**: antigravity


Zakres wynika bezpośrednio z `docs/AUDIT_AND_AUTONOMY_PLAN.md`, sekcja
„Faza 0 — Naprawy blokujące (przed jakimkolwiek grantem)".

Ticket zamyka wyłącznie defekty P0 z grup A (granica efektów) i B (proweniencja),
plus dwa fundamenty, bez których reszta planu nie ma się o co oprzeć:
bramkę reprodukowalności i schematy konfiguracji.

## Dlaczego akurat te

Faza 1 (konsumpcja kontraktów `subactor/twin` i `twin-probes`) i Faza 2
(wiązanie w profilu `wellmanifest/autonomy`) budują zaufanie do artefaktów
tego projektu. Jeżeli allowlista komend przepuszcza `make test && curl ...`,
a trasa LLM otwiera się sama na podstawie klucza leżącego w powłoce operatora,
to wszystko powyżej jest zbudowane na fałszywej gwarancji.

## Wykonane

| ID | Kwestia | Naprawa |
|---|---|---|
| A-1 | allowlista jako prefiks stringa | `src/util/command.ts` — dopasowanie na wektorze tokenów, odrzucenie każdej składni powłoki; 24 wektory w `tests/command.test.ts` |
| A-2 | routing fail-open | `flag_enabled` z domyślną wartością `False`, `scripts/check-flag-parity.py`, ładowanie `.env` w `Makefile` |
| A-3 | REST bez uwierzytelnienia | `X-Twin-Token` na endpointach LLM, `_guard_bind` odmawia bindu spoza loopbacku bez `TWIN_ALLOW_REMOTE` i tokenu |
| B-1 | fixture nieodróżnialny od modelu | `Provenance` + nagłówki `x-twin-*`, `generator.provider/model/responseId/auditRef`, `DT_PROVENANCE_MISSING` jako blocking |
| B-3 | brak bramki reprodukowalności | `scripts/verify-artifacts.sh` w `make validate` |
| B-4 | zła ścieżka `$schema` | `../../schemas/...` |
| C-1 | `RangeError` przy ~200 tys. zdarzeń | licznik przyrostowy zamiast `Math.max(...spread)` |
| C-2 | kolidujące sekwencje w adapterze JSONL | licznik nie zostaje w tyle za rekordem z własną sekwencją |
| C-4 | healthcheck bez timeoutu | `AbortController` z limitem 10 s |
| C-5 | ciche obcięcie do 160 zdarzeń | `TWIN_LLM_EVENT_WINDOW` + diagnostyka `DT_LLM_INPUT_TRUNCATED` |
| D-1 | konfiguracja bez schematów | sześć nowych schematów, walidacja w `make validate` |
| D-4 | ścieżka audytu zależna od CWD | rozwiązywanie względem katalogu projektu |
| D-5 | audyt tylko sukcesów | rekord `status: failed` przy błędzie trasy i odpowiedzi |

## Pozostaje otwarte

Świadomie poza zakresem tego ticketu, z uzasadnieniem w dokumencie audytu:

- **A-4, A-5, A-6** — zamknięte na `main` (Group A, `4c270e8`).
- **A-7** — przeniesione do [`ticket-004`](../ticket-004/README.md): bramka
  lokalna, nie `subactor/github-com`.
- **B-2** — kalibracja `confidence`. Wymaga zbioru etykietowanego (P2 z `NEXT_STEPS.md`).
- **B-5, B-6, C-3, C-6, D-2, D-3, D-6** — dług techniczny bez wpływu na granicę efektów.
