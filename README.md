# Subactor Developer Digital Twin

Uruchamialny przykład budowy **cyfrowego bliźniaka sposobu realizacji pracy developera** z historii promptów IDE/chat/shell.

Projekt nie próbuje kopiować osobowości ani podszywać się pod człowieka. Tworzy wersjonowaną, audytowalną **politykę wykonawczą** dla LLM i narzędzi kodujących:

- jak rozpoznawać intencję użytkownika;
- jak rozstrzygać korekty i sprzeczne polecenia;
- jakie standardy i bramki stosować;
- kiedy LLM może tylko proponować;
- co musi zostać potwierdzone kodem, testem lub obserwacją runtime;
- jaki kontekst może otrzymać Aider.

## Najważniejsza decyzja architektoniczna

Z dwóch historii można zbudować wiarygodne źródło prawdy o **powtarzalnych preferencjach wykonawczych i jawnych korektach człowieka**. Nie można z nich zrobić źródła prawdy o bieżących cenach, branchu, stanie wdrożenia, działającym SMTP, aktualnym kodzie ani zaliczonych testach.

Dlatego runtime utrzymuje dwa niezależne rankingi:

1. **Human Intent** — nowsza jawna korekta, powtarzalna instrukcja, pojedyncza instrukcja, ticket i dopiero na końcu claim agenta.
2. **Project Reality** — obserwacja runtime, receipt testu, wersjonowany `HOME`, kod/config, Git, dokumentacja, prompt i claim agenta.

Gdy prompt przeczy bieżącemu `HOME`, prompt pozostaje historycznym claimem. Przykład pokazuje to na ofercie Subactor: stare wypowiedzi o cenach są wykrywane, ale bieżące wartości pochodzą z `data/context/subactor-cloud-v1.offer.json`.

## Dlaczego nie wystarczy jeden prompt systemowy

Surowa historia zawiera jednocześnie:

- trwałe zasady, np. aktywny `project/ticket-*`, TestQL, restart, SSOT i używanie istniejących API;
- korekty wcześniejszych poleceń;
- kontekstowe decyzje, np. „usuń ten Docker” dotyczące jednej wadliwej instancji;
- przeciwne, również poprawne polecenia, np. użycie Dockera do symulacji produkcji;
- agentowe opisy wykonania, które nie są dowodami;
- nieaktualne ceny i stany środowiska;
- potencjalne sekrety.

Bez warstwy dowodowej LLM może wybrać najbardziej przekonujące zdanie zamiast aktualnej intencji. Ten projekt najpierw tworzy zdarzenia z proweniencją, potem reguły, następnie waliduje cytowania i dopiero na końcu generuje kontekst wykonawczy.

## Przepływ

```text
historie IDE / chat / shell
        │
        ▼
ingest + redakcja + hash + aktor + kolejność
        │
        ├──────────────► append-only events.jsonl
        ▼
deterministyczna ekstrakcja reguł
        │
        ├── opcjonalnie LLM: tylko kandydaci z evidenceRefs
        ▼
TypeScript validator
        │
        ▼
subactor.developer-twin/v1
        │
        ├────────► task + project context ───────► validated guidelines
        │                                              │
        │                                              ▼
        │                                      Aider message / dry-run
        │
        └────────► Project Reality adapters ───► Intent vs Reality report
                   (SSOT, Git, AST, TestQL,
                    runtime, ticket, deployment)
```

Policy DSL pozostaje **inertny**: opisuje zasady i ograniczenia, ale sam nie wykonuje komend, nie nadaje uprawnień i nie dokonuje deploymentu. Efekty są osobną warstwą.

## Zawartość

```text
.
├── config/
│   ├── source-policy.json        # dwa rankingi prawdy i rozstrzyganie konfliktów
│   ├── rule-catalog.json         # deterministyczne wzorce reguł
│   ├── llm-routing.json          # priorytety transportów i fallbacków
│   ├── model-registry.json       # HOME aliasów, tagów i domyślnych modeli
│   └── litellm-proxy.yaml        # generowana fasada model-registry
├── data/
│   ├── raw/                      # dwie dostarczone historie
│   ├── context/                  # projekt, offer HOME i materiały odniesienia
│   ├── normalized/               # manifest źródeł, event log i mapa ekstrakcji
│   ├── output/                   # DSL, raport, wytyczne, Aider context
│   └── fixtures/                 # dane testowe
├── llm_service/                  # Python CLI + shell + FastAPI + LiteLLM
├── schemas/                      # strict JSON Schema
├── src/                          # TypeScript runtime
├── scripts/                      # Aider, LiteLLM, fake REST demo, bramki
├── tests/                        # Node test + Python unittest
├── docs/                         # architektura, DSL, SSOT, security, audyt+plan
└── project/ticket-*/             # zakres, intent, preprompt i changelog
```

## Szybki start bez LLM

Wymagania: Node.js 20+, TypeScript 5.8+ i Python 3.10+.

```bash
make build
make demo
make validate
make test
```

Zweryfikowany przebieg na dołączonych danych:

```text
events:               161
human Cursor prompts: 28
deterministic rules:  10
contextual rules:     2
LLM candidates:       0 w trybie deterministic
guideline steps:      7
TypeScript tests:     8/8 PASS
Python tests:         13/13 PASS
JSON Schema:          PASS (7 dokumentów + tickety)
Flag parity:          PASS
Artifact reproducibility: PASS (10 artefaktów)
```

`make validate` uruchamia cztery bramki: walidację runtime, JSON Schema dla
artefaktów **i konfiguracji**, parzystość semantyki flag oraz reprodukowalność —
regenerację artefaktów z przypiętym `TWIN_NOW` i porównanie hashy. Ręczna edycja
czegokolwiek w `data/output/` jest wykrywana.

Główne artefakty:

```text
data/normalized/source-manifest.json
data/normalized/events.jsonl
data/output/developer-twin.dsl.json
data/output/developer-twin.md
data/output/guidelines.json
data/output/guidelines.md
data/output/offer-reality.json
data/output/offer-reality.md
data/output/aider-message.md
```

## Jakie reguły znaleziono w dostarczonych historiach

Deterministyczny katalog aktywuje tylko reguły mające cytowane wsparcie:

| ID | Znaczenie |
|---|---|
| `DT-GOV-001` | wieloetapowa praca ma aktywny ticket i intent |
| `DT-TEST-001` | restart, TestQL, pełne testy i receipty po zmianie |
| `DT-SSOT-001` | jeden `HOME`; `ADOPT` i `facade` nie tworzą drugiego SSOT |
| `DT-REALITY-001` | prompt i dokumentacja są porównywane z kodem/runtime/SSOT |
| `DT-REUSE-001` | najpierw istniejące API, formularze i komponenty |
| `DT-PROD-001` | produkcja, OTP, anti-spam, sekrety i parity są częścią DoD |
| `DT-UX-001` | stan panelu w URL, deep-link, dostępność i mobile drawer |
| `DT-CONTINUE-001` | „kontynuuj” oznacza odczyt aktywnego ticketu i niedomkniętych AC |
| `DT-LLM-001` | LLM jest ekstraktorem/doradcą, nigdy sędzią prawdy lub wykonawcą uprawnień |
| `DT-DOCKER-001` | Docker jest decyzją kontekstową, nie globalnym zakazem ani obowiązkiem |

Każda reguła zawiera `scope`, `status`, `confidence`, `supportCount`, `evidenceRefs` i politykę konfliktu. Wypowiedzi agenta są zachowane w katalogu dowodów, ale nie aktywują reguł.

## Tryby LLM

Runtime TypeScript obsługuje:

- `deterministic` — zero połączeń sieciowych;
- `prefer-llm` — próba LLM, jawny fallback z diagnostyką;
- `require-llm` — błąd przy braku usługi, klucza, schema output lub poprawnych cytowań.

LLM może wygenerować wyłącznie `subactor.developer-twin.intent-candidates/v1`. Kandydat:

- musi cytować istniejące `evidenceRefs`;
- nie może mieć wysokiego ryzyka generalizacji;
- trafia do DSL ze statusem `candidate`;
- nie steruje Aiderem ani wykonaniem bez promocji w ticket/intent.

## Offline test pełnej ścieżki REST

Fake mode zachowuje ten sam kontrakt JSON Schema, ale nie używa sieci ani klucza:

```bash
make llm-fake-demo
make demo          # przywróć deterministyczny baseline
make validate
```

`make validate` zawiera bramkę reprodukowalności, która odrzuca baseline
z `llmUsed=true` — dlatego po przebiegu fake wracamy do `make demo`.

Ścieżka testowa:

```text
TypeScript → HTTP → FastAPI → fake structured LLM
          → TypeScript validation → candidate rule + guidelines
```

Oczekiwany wynik zawiera jeden kandydat `DT-LLM-101`, `llmUsed=true` i `degraded=false`.

Artefakt z tego przebiegu niesie `generator.provider="fake"` oraz diagnostykę
`DT_LLM_FIXTURE_PROVIDER` (`review_required`), a `make verify-artifacts` odmawia
uznania go za commitowany baseline. Fake mode dowodzi kontraktu HTTP i JSON Schema,
nie zachowania modelu — dlatego baseline w repozytorium jest deterministyczny.

## Python CLI, shell i REST

### CLI

```bash
TWIN_LLM_FAKE=1 ./scripts/llmctl.sh health
TWIN_LLM_FAKE=1 ./scripts/llmctl.sh chat "Przygotuj plan walidacji"
```

### Interaktywny shell

```bash
TWIN_LLM_FAKE=1 ./scripts/llmctl.sh shell
```

### REST

```bash
TWIN_LLM_FAKE=1 make llm-api
curl -fsS http://127.0.0.1:8099/healthz
```

Endpointy:

```text
GET  /healthz                    (bez tokenu)
POST /v1/intents/extract         (X-Twin-Token, gdy TWIN_API_TOKEN ustawiony)
POST /v1/guidelines/generate     (jw.)
POST /v1/chat/completions        (domyślnie 404; wymaga TWIN_ENABLE_RAW_CHAT=true)
```

Raw chat jest wyłącznie narzędziem debugowym. Nie ustawiaj
`TWIN_ENABLE_RAW_CHAT` w zwykłym profilu usługi; endpointy semantyczne powyżej
mają ścisłe kontrakty i pozostają preferowaną granicą.

Odpowiedzi endpointów LLM niosą nagłówki proweniencji `x-twin-provider`,
`x-twin-model`, `x-twin-audit-ref` i opcjonalnie `x-twin-response-id`. Runtime
TypeScript odrzuca odpowiedź bez tych nagłówków — bez nich `llmUsed: true`
nie niesie żadnej informacji o tym, kto faktycznie wyprodukował wynik.

Usługa zapisuje append-only audyt z `requestHash`, `schemaHash`, stage, modelem,
providerem, response ID, usage i `auditRef`, **również przy niepowodzeniu**
(`status: failed`). Nie zapisuje klucza, treści promptu ani surowej odpowiedzi.

Bind spoza loopbacku jest odmawiany, dopóki nie ustawisz `TWIN_ALLOW_REMOTE=1`
i niepustego `TWIN_API_TOKEN`.

## OpenRouter przez LiteLLM

### 1. Instalacja

```bash
make setup
cp .env.example .env
```

`Makefile` ładuje `.env` automatycznie, jeśli plik istnieje. Nie commituj go.

**Flagi są fail-closed.** Brak zmiennej `LOCAL_LLM_ENABLED`, `LITELLM_PROXY_ENABLED`
lub `OPENROUTER_DIRECT_ENABLED` znaczy „trasa wyłączona", a nie „włączona".
Bez jawnego włączenia którejś trasy runtime zwraca `LlmConfigurationError`
zamiast po cichu wyjść do zewnętrznego dostawcy. Parzystość tej semantyki
między Pythonem, skryptami i `.env.example` pilnuje `scripts/check-flag-parity.py`.

### 2. Uruchom centralny proxy

Terminal 1:

```bash
set -a; source .env; set +a
make litellm-proxy
```

`config/model-registry.json` jest jedynym HOME aliasów. `config/litellm-proxy.yaml` jest generowaną fasadą z bramką parzystości i udostępnia cztery aliasy:

```text
twin-intent
twin-guidelines
twin-code
twin-validation
```

W przykładzie wszystkie wskazują na OpenRouter Auto, ale można przypisać różne modele, budżety i fallbacki. Zmień `model-registry.json`, a następnie uruchom `python3 scripts/render-litellm-config.py`; ręczna zmiana YAML zostanie odrzucona przez `make build`. Nazwa aliasu pozostaje stabilna dla TypeScript, Pythona i Aidera.

### 3. Uruchom usługę projektu

Terminal 2:

```bash
set -a; source .env; set +a
make llm-api
```

### 4. Wymuś prawdziwy LLM

```bash
node dist/src/cli.js demo \
  --mode require-llm \
  --llm-url http://127.0.0.1:8099
```

`require-llm` nie pozwala ukryć awarii fallbackiem.

## Prywatny Ollama, vLLM, LM Studio lub własny proxy

Python router jest privacy-first. Gdy ustawisz lokalny endpoint, zostanie wybrany przed LiteLLM proxy i OpenRouterem:

```dotenv
LOCAL_LLM_ENABLED=true
LOCAL_LLM_API_BASE=http://127.0.0.1:11434/v1
LOCAL_LLM_MODEL=twoj-model
LOCAL_LLM_API_KEY=local-not-required
```

Endpoint musi implementować zgodne API chat completions. Dla lokalnych modeli structured output może wymagać własnego proxy lub modelu obsługującego JSON Schema. W trybie `require-llm` brak zgodności jest błędem, nie cichym fallbackiem.

## Bezpośredni OpenRouter bez proxy

Wyłącz proxy, włącz trasę bezpośrednią, ustaw prywatny klucz i modele:

```dotenv
LITELLM_PROXY_ENABLED=false
OPENROUTER_DIRECT_ENABLED=true
OPENROUTER_API_KEY=...
OPENROUTER_INTENT_MODEL=openrouter/auto
OPENROUTER_GUIDELINES_MODEL=openrouter/auto
OPENROUTER_CODE_MODEL=openrouter/auto
OPENROUTER_VALIDATION_MODEL=openrouter/auto
```

Python nadal używa biblioteki LiteLLM jako zunifikowanego klienta, ale nie uruchamia osobnego serwera proxy.

## Aider z tym samym modelem i polityką

Najpierw powstaje walidowany komunikat:

```bash
make aider-context
sed -n '1,220p' data/output/aider-message.md
```

Następnie Aider łączy się z aliasem `twin-code` tego samego LiteLLM proxy:

```bash
AIDER_MODEL=openai/twin-code \
AIDER_APPLY=0 \
make aider AIDER_ARGS="src/frontend/src/App.tsx"
```

Wrapper czyta ten sam `model-registry.json` i stosuje kolejność: jawny `AIDER_MODEL`, lokalny endpoint, bezpośredni OpenRouter, a następnie alias LiteLLM. Domyślnie stosuje:

- `--message-file data/output/aider-message.md`;
- DSL i ticket jako pliki read-only;
- `--dry-run`;
- brak automatycznych commitów.

Dopiero jawne `AIDER_APPLY=1` pozwala Aiderowi modyfikować pliki. Commit, push, merge i deployment nadal wymagają osobnej autoryzacji.

Nie należy przekazywać Aiderowi całego archiwum promptów. Dostaje minimalny zestaw: task, aktywne reguły, zwalidowany plan, ticket i odwołanie do DSL.

## Import dowolnych źródeł

CLI przyjmuje wiele `--input`:

```bash
node dist/src/cli.js build \
  --input data/raw/history-portal.md \
  --input data/raw/history-cursor.json \
  --input /path/to/.zsh_history \
  --input /path/to/events.jsonl
```

Obsługiwane formaty:

- transcript Markdown z `### User Input` / `### Planner Response`;
- eksport Cursor z bazą `blobs` i dokumentami TipTap;
- shell history (`*shell*`, `.history`, `.bash_history`, `.zsh_history`);
- JSONL z `text`, `actor`, `sourceClass`, `metadata`;
- plain text dzielony pustymi liniami.

Dla nowego IDE należy dodać mały adapter w `src/ingest/`, który emituje ten sam `PromptEvent`. Cała dalsza część pipeline pozostaje bez zmian.

## Source of Truth w praktyce

### Historia może być HOME dla

- kolejności pracy;
- trwałych preferencji narzędziowych;
- jawnych korekt użytkownika;
- sposobu walidacji;
- granic autonomii;
- sposobu rozstrzygania konfliktów.

### Historia nie może być HOME dla

- aktualnego kodu i branchu;
- bieżących cen lub entitlementów;
- stanu produkcji;
- health endpointów;
- wyniku testów;
- stanu ticketu poza przypiętą rewizją;
- sekretów i uprawnień.

Dla tych concernów należy podłączyć adaptery rzeczywistości. Projekt zawiera pierwszy adapter `src/reality/offer.ts`, który porównuje historię z wersjonowanym katalogiem oferty.

## Bezpieczeństwo i prywatność

- sekrety są redagowane w warstwie ingest TypeScript przed zapisaniem `redactedText`
  (kontrola **nie** obejmuje jeszcze usługi Python — patrz „Znane luki" w `docs/SECURITY.md`);
- raw history pozostaje lokalna i nie jest automatycznie wysyłana do modelu;
- usługa LLM dostaje ograniczone, zredagowane fragmenty;
- trasy LLM są fail-closed: brak jawnie ustawionej flagi znaczy „wyłączone",
  więc klucz dostawcy leżący w powłoce nie otwiera sam wyjścia na zewnątrz;
- usługa REST wymaga `X-Twin-Token`, jeśli jest ustawiony, a bind spoza loopbacku
  wymaga `TWIN_ALLOW_REMOTE=1` i niepustego tokenu;
- komendy w wytycznych przechodzą przez allowlistę na wektorze tokenów;
  każda składnia powłoki (`&&`, `|`, `;`, `$(...)`, przekierowania) jest odrzucana;
- artefakty niosą proweniencję: `generator.provider/model/responseId/auditRef`,
  więc wynik fixture'u jest odróżnialny od wyniku modelu;
- agent claims nie są receiptami;
- `unknown` nie jest zamieniane na `false` ani `DONE`;
- candidate rule nie staje się active automatycznie;
- Aider domyślnie działa w dry-run;
- DSL zabrania użycia bliźniaka do oceny zatrudnienia, zdrowia, poglądów lub imitowania tożsamości.

Szczegóły: `docs/SECURITY.md`.

## Ograniczenia przykładu

- ekstrakcja deterministyczna używa katalogu słów i nie zastępuje pełnego linkera semantycznego todo2code;
- parser Cursor jest dostosowany do dostarczonego eksportu TipTap;
- nie ma jeszcze automatycznego adaptera Git/AST/TestQL/runtime dla dowolnego repozytorium;
- reguły nie są automatycznie wersjonowane przez pełny lifecycle review/approval;
- live OpenRouter nie został uruchomiony w tym artefakcie, ponieważ nie dostarczono prywatnego klucza;
- Aider nie jest zależnością projektu i nie był uruchamiany w walidacji offline.

## Co dalej

Najważniejszy następny krok to federacyjny `Reality Twin` dla projektu docelowego:

1. skan Git/AST/config i aktywnego ticketu;
2. TestQL oraz receipty komend z rewizją;
3. live health/runtime observations;
4. registry `HOME/ADOPT/facade` dla wszystkich concernów;
5. porównanie planu Aidera i diffu z DSL;
6. ponowna analiza po zmianie;
7. promocja `candidate → active` wyłącznie przez hash-bound review.

Pełna lista znajduje się w `docs/NEXT_STEPS.md`.
