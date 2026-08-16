# Developer Twin DSL

Główny artefakt: `data/output/developer-twin.dsl.json`.

## Semantyka statusów

- `active` — deterministycznie poparta reguła wykonawcza;
- `contextual` — poprawna tylko po spełnieniu kontekstu, nie wolno jej globalizować;
- `candidate` — propozycja LLM wymagająca review i promocji w ticket/intent;
- `superseded` — historyczna reguła zastąpiona nowszą korektą.

## Epistemika

`evidenceRefs` wskazują rekordy w `evidenceCatalog`. `confidence` opisuje siłę ekstrakcji intencji, a nie prawdopodobieństwo, że kod działa. Project Reality ma osobne źródła i ranking.

## Efekty

Pola `must`, `should` i `mustNot` ograniczają plan. Nie są komendami wykonawczymi. `autonomy.approvalRequired` i `failClosedOn` blokują przejście do warstwy efektów.
