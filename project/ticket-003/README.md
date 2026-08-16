# ticket-003 — Koniec podszywania się pod cudze kontrakty

## Co się stało

W ticket-002, naprawiając D-1 („konfiguracja bez schematów"), powstał plik
`schemas/ticket-intent.schema.json` z `$id` i `const` ustawionymi na
`new-project.intent/v3` — identyfikator należący do `wellmanifest/new-project`.
Plik trafił do `make validate`, który zaczął drukować
`SCHEMA-PASS project/ticket-002/intent.json`.

Zwalidowane wobec prawdziwego `governance/intent.schema.json` standardu, oba
intenty odpadają identycznie, po 10 błędów każdy: brakuje `ticket`, `summary`,
`forbiddenPaths`, `stacks`, `dependsOn`, `conflictsWith`, `integrationTicket`
i `classification`; nadmiarowe są `purpose`, `status`, `forbiddenEffects`,
`dependencies`, `evidencePolicy`.

`ticket-001` deklarował ten identyfikator od początku istnienia repozytorium,
nigdy go nie spełniając. `ticket-002` powielił kształt, a nowa bramka nadała
niezgodności pozór dowodu.

Projekt, którego teza brzmi „claim agenta nie jest dowodem", postawił zieloną
bramkę zamiast dowodu. To jest ta sama klasa defektu co B-1 (fixture
nieodróżnialny od modelu), tylko wymierzona w zgodność ze standardem.

## Naprawa

| Element | Zmiana |
|---|---|
| `schemas/ticket-intent.schema.json` | usunięty |
| `schemas/local-ticket-intent.schema.json` | ten sam kształt pod własną nazwą `subactor.twin-developer.ticket-intent/v1`, z opisem wprost mówiącym, czym **nie** jest |
| `project/ticket-00{1,2,3}/intent.json` | deklarują wyłącznie lokalną przestrzeń nazw |
| `scripts/check-schema-identity.py` | odrzuca każdy `$id` i `const` należący do obcego właściciela; w `make validate` |
| `docs/AUDIT_AND_AUTONOMY_PLAN.md` | ustalenie zapisane jako E-0 wraz z wynikiem ankiety wellmanifest |

Bramka zweryfikowana negatywnie: po ponownym wstawieniu podrobionego `$id`
zwraca `SCHEMA-IDENTITY-FAIL` i kod wyjścia 1.

## Czego ten ticket **nie** robi

Nie doprowadza repozytorium do zgodności z `new-project.intent/v3`. Zgodność
wymaga adopcji standardu, a ta jest zablokowana: `goal governance adopt`
potrzebuje Goal ≥ 2.1.295, zainstalowany jest 2.1.284 i nie ma podkomendy
`governance`. Migracja intentów należy do Fazy 1 planu.

Do tego czasu repozytorium ma mówić, czym jest, a nie czym chciałoby być.
