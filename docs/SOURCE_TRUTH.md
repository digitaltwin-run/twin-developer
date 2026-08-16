# Source of Truth Matrix

| Concern | HOME / evidence owner | Rola historii promptów |
|---|---|---|
| trwałe preferencje wykonawcze developera | `data/output/developer-twin.dsl.json`, wygenerowany z cytowanych eventów i zatwierdzany przez ticket | dowód pierwotny intencji i korekt |
| aktywny zakres pracy | `project/ticket-*/intent.json` na dokładnej rewizji | wskazówka, gdzie szukać; nie zastępuje ticketu |
| ceny i entitlementy | produktowy offer catalog, w przykładzie `data/context/subactor-cloud-v1.offer.json` | historyczny claim do porównania |
| aliasy i przeznaczenie modeli | `config/model-registry.json` | preferencja routingu, nigdy sekret |
| transport/fallback LLM | `config/llm-routing.json` | preferencja i kontekst |
| bieżący kod | Git + AST na dokładnym SHA | oczekiwanie lub opis, nie fakt |
| wynik testów | receipt komendy z exit code, rewizją i hashem outputu | żądanie testu; agent response nie jest receiptem |
| runtime/produkcja | odtwarzalna obserwacja z environment ID i timestampem | oczekiwanie; nie health proof |
| deployment/DNS/SMTP | właściwy system rekordowy i obserwacja live | intencja lub incydent |

## Reguła

Historia promptów jest HOME wyłącznie dla concernu „jak człowiek chce prowadzić pracę”, i to po uwzględnieniu supersession, zakresu oraz powtarzalności. Dla faktów projektowych jest źródłem pomocniczym o niższym priorytecie.
