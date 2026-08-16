# Developer Digital Twin — execution policy

- ID: `developer-twin:f365d76232d35c17`
- Wygenerowano: 2026-08-16T12:00:00.000Z
- Tryb: `require-llm`, LLM: tak, degraded: nie
- Cel: Kontynuowanie rozwoju Subactor zgodnie z udokumentowanym sposobem pracy człowieka, bez imitowania jego tożsamości lub cech osobowości.

## Granica modelu

To jest bliźniak **polityki wykonawczej**, a nie klon osobowości ani tożsamości człowieka. Historia promptów opisuje preferencje i korekty; stan kodu i produkcji pochodzi z osobnego rankingu Project Reality.

## Rankingi źródeł

### humanIntent

Co człowiek chce, jak pracuje i jak rozstrzyga konflikt intencji.

| Źródło | Waga |
|---|---:|
| `human_correction` | 100 |
| `human_instruction_repeated` | 92 |
| `human_instruction` | 84 |
| `accepted_command` | 72 |
| `ticket_intent` | 70 |
| `agent_claim` | 20 |

### projectReality

Co faktycznie istnieje i działa w projekcie.

| Źródło | Waga |
|---|---:|
| `live_runtime_observation` | 100 |
| `test_receipt` | 96 |
| `versioned_ssot` | 92 |
| `code_or_config` | 88 |
| `git_history` | 80 |
| `documentation` | 55 |
| `human_prompt_fact` | 40 |
| `agent_claim` | 15 |

## Reguły

| ID | Status | Zakres | Confidence | Wsparcie | Tytuł |
|---|---|---|---:|---:|---|
| `DT-CONTINUE-001` | contextual | contextual | 0.938 | 11 | Kontynuacja oznacza odczyt stanu i domknięcie rozpoczętego zakresu |
| `DT-DOCKER-001` | contextual | contextual | 0.819 | 2 | Docker jest narzędziem kontekstowym, nie domyślną zasadą |
| `DT-GOV-001` | active | subactor | 0.880 | 1 | Ticket i intent przed wieloetapową zmianą |
| `DT-LLM-001` | active | global | 0.990 | 16 | LLM jest ekstraktorem i doradcą, nie źródłem autorytetu |
| `DT-LLM-101` | candidate | project | 0.720 | 2 | Porównanie side-by-side przed dużym refaktorem |
| `DT-PROD-001` | active | subactor | 0.948 | 8 | Produkcja, bezpieczeństwo i anty-spam są częścią Definition of Done |
| `DT-REALITY-001` | active | global | 0.988 | 8 | Dokumentacja i prompt muszą być konfrontowane z rzeczywistością |
| `DT-REUSE-001` | active | subactor | 0.868 | 4 | Najpierw istniejące API, formularze i komponenty |
| `DT-SSOT-001` | active | subactor | 0.990 | 9 | HOME/ADOPT/facade i jeden właściciel prawdy |
| `DT-TEST-001` | active | subactor | 0.978 | 5 | Restart, TestQL i pełna walidacja po zmianie |
| `DT-UX-001` | active | project | 0.938 | 5 | Stan UI ma być adresowalny, czytelny i mobilny |

### DT-CONTINUE-001 — Kontynuacja oznacza odczyt stanu i domknięcie rozpoczętego zakresu

Samo 'kontynuuj' nie ustanawia nowego celu; runtime ma odczytać aktywny ticket, diff, testy i niedomknięte kryteria.

**MUST**
- Odczytać aktywny ticket i ostatnie potwierdzone kryteria.
- Kontynuować wyłącznie w niezamkniętym zakresie i ponownie zweryfikować stan.

**SHOULD**
- Nie powtarzać pytania, na które odpowiedź już istnieje w ticket/context.

**MUST NOT**
- Zgadywać nowego celu na podstawie samego słowa 'kontynuuj'.

Dowody: `evidence:c769a91e78958a94`, `evidence:3cf8983fb8fc51db`, `evidence:a044e67804c1d66d`, `evidence:0d1fc2882c906c22`, `evidence:6b38ab74f172ee84`, `evidence:384556423fffa5ff`, `evidence:f6755ac3d4ba8b05`, `evidence:fb46f0e2b4b3c6bb`, `evidence:0897c050f01f8c4e`, `evidence:b8a88f8702e5e9af`, `evidence:f88212ba744c3b5b`

### DT-DOCKER-001 — Docker jest narzędziem kontekstowym, nie domyślną zasadą

Historia zawiera zarówno usunięcie konkretnego błędnego kontenera, jak i żądanie produkcyjnej symulacji Docker; decyzję wyznacza cel i ticket.

**MUST**
- Rozróżnić usunięcie konkretnej wadliwej instancji od zakazu technologii.
- Użyć Dockera tylko, gdy wspiera jawny kontrakt deployment/parity.

**SHOULD**
- Udokumentować właściciela procesu i cleanup.

**MUST NOT**
- Generalizować pojedynczego polecenia 'usuń ten Docker' do globalnego 'nigdy Docker'.

Dowody: `evidence:87c8bb1e43f65669`, `evidence:384556423fffa5ff`

### DT-GOV-001 — Ticket i intent przed wieloetapową zmianą

Wieloetapowa zmiana ma być prowadzona w aktywnym project/ticket-* zgodnie z new-project i ticket-lifecycle.

**MUST**
- Utworzyć lub wskazać aktywny project/ticket-* przed implementacją.
- Zapisać zakres, kryteria akceptacji, dozwolone ścieżki i plan walidacji.
- Aktualizować changelog i indeks ticketów wraz z pracą.

**SHOULD**
- Związać wynik z dokładną rewizją i receiptami testów.

**MUST NOT**
- Prowadzić wieloetapowej implementacji wyłącznie w czacie bez śladu ticketu.

Dowody: `evidence:c769a91e78958a94`

### DT-LLM-001 — LLM jest ekstraktorem i doradcą, nie źródłem autorytetu

LLM może generować kandydatów DSL i wytyczne, ale runtime deterministyczny waliduje schemat, cytowania, zakres i bramki efektów.

**MUST**
- Wymagać structured output i walidacji lokalnej.
- Weryfikować, że każdy wniosek cytuje istniejące evidenceRefs.
- Oddzielić propose od apply i wymagać receipt po wykonaniu.

**SHOULD**
- Używać tego samego gateway/model routing dla runtime i Aider, ale osobnych celów/tagów.

**MUST NOT**
- Pozwalać LLM nadawać sobie uprawnień, deklarować DONE bez testów albo modyfikować sekrety.

Dowody: `evidence:e6bbc0be7788a0d6`, `evidence:9105acb7f51036ff`, `evidence:71362d83e2de46c0`, `evidence:273e39098d7c490a`, `evidence:c769a91e78958a94`, `evidence:e85aeb834c6d02f3`, `evidence:d2cb286a45eafd8e`, `evidence:a0721eb41ab7adaf`, `evidence:ae874ca4eddd57ea`, `evidence:4990b17f356e4e48`, `evidence:fa80b06e21ef8564`, `evidence:43fd4a9245f3cd9f`, `evidence:061bdd499581b8a2`, `evidence:14295c4267d25d29`, `evidence:12a1b047f312ce07`, `evidence:08de1a94595be98b`

### DT-LLM-101 — Porównanie side-by-side przed dużym refaktorem

Przed zastąpieniem istniejącej ścieżki pokaż różnice między zachowaniem obecnym i proponowanym oraz przypisz je do dowodów.

**SHOULD**
- Przedstawić porównanie zachowania i źródeł prawdy przed refaktorem.

Dowody: `evidence:e6bbc0be7788a0d6`, `evidence:87c8bb1e43f65669`

### DT-PROD-001 — Produkcja, bezpieczeństwo i anty-spam są częścią Definition of Done

Zmiana ma być oceniona w warunkach produkcyjnych lub ich wiernej symulacji, z ochroną sekretów i abuse controls.

**MUST**
- Oddzielić dev bypass od produkcji i domyślnie fail-closed.
- Zweryfikować konfigurację sekretów bez ujawniania wartości.
- Przetestować rate limiting, błędy i ścieżkę odzyskiwania.

**SHOULD**
- Użyć produkcyjnego digital twin lub środowiska parity.

**MUST NOT**
- Zakładać, że lokalny mock dowodzi dostarczenia prawdziwego e-maila lub działania produkcji.

Dowody: `evidence:25e7899e9692da00`, `evidence:ddd48173c580cca5`, `evidence:c4846ffe0920da33`, `evidence:62e4528cd42e46ed`, `evidence:384556423fffa5ff`, `evidence:d32f7dd3e09d38e0`, `evidence:14295c4267d25d29`, `evidence:d1eca7e0bf1cee8b`

### DT-REALITY-001 — Dokumentacja i prompt muszą być konfrontowane z rzeczywistością

Stan projektu jest ustalany przez wersjonowane źródła i obserwacje, nie przez przekonujący opis LLM.

**MUST**
- Określić zakres claimu i właściwego właściciela danych.
- Zebrać odtwarzalne dowody z kodu, Git, testów i runtime.
- Oznaczyć unknown, under_specified i konflikty zamiast zgadywać.

**SHOULD**
- Użyć grafu Intent vs Reality i diagnostyk o jawnej proweniencji.

**MUST NOT**
- Traktować historii promptów jako aktualnego SSOT faktów projektowych.

Dowody: `evidence:e6bbc0be7788a0d6`, `evidence:582a7a56e28d9ae1`, `evidence:0e9972121c3ecb61`, `evidence:7aea914cb1920eb1`, `evidence:e85aeb834c6d02f3`, `evidence:d32f7dd3e09d38e0`, `evidence:e45054d61dc8b890`, `evidence:08de1a94595be98b`

### DT-REUSE-001 — Najpierw istniejące API, formularze i komponenty

Przed tworzeniem nowej implementacji należy zbadać i wykorzystać istniejące kontrakty oraz projekty referencyjne.

**MUST**
- Zidentyfikować istniejący kontrakt lub projekt referencyjny.
- Zachować kompatybilność albo jawnie opisać migrację.

**SHOULD**
- Porównać zachowanie side-by-side przed refaktoryzacją.

**MUST NOT**
- Wymyślać równoległego API bez analizy istniejącego.

Dowody: `evidence:e6bbc0be7788a0d6`, `evidence:335902ac5a215d9b`, `evidence:e85aeb834c6d02f3`, `evidence:9d80ef9bff859739`

### DT-SSOT-001 — HOME/ADOPT/facade i jeden właściciel prawdy

Dane produktu pozostają w kanonicznym HOME; standardy definiują kontrakty, a projekcje są fasadami z bramką driftu.

**MUST**
- Wskazać jeden HOME dla każdego concernu.
- Oznaczyć kopie jako generated mirror, vendored parity copy albo facade.
- Porównać projekcje z HOME przed merge.

**SHOULD**
- Rozdzielić schemat zarządzany od danych instancji specyficznych dla repozytorium.

**MUST NOT**
- Tworzyć drugiego SSOT cen, brandu lub required checks w repozytorium adoptującym.

Dowody: `evidence:9105acb7f51036ff`, `evidence:71362d83e2de46c0`, `evidence:9d80ef9bff859739`, `evidence:a0721eb41ab7adaf`, `evidence:9e9f8c0281c6df64`, `evidence:4990b17f356e4e48`, `evidence:fa80b06e21ef8564`, `evidence:43fd4a9245f3cd9f`, `evidence:061bdd499581b8a2`

### DT-TEST-001 — Restart, TestQL i pełna walidacja po zmianie

Po zmianach runtime/UI/usług użytkownik oczekuje restartu i odtwarzalnej weryfikacji, szczególnie przez TestQL.

**MUST**
- Uruchomić deklarowany restart lub odtworzyć równoważny lifecycle usługi.
- Uruchomić TestQL/kontraktowe testy projektu i pełną suitę właściwą dla zmienionego zakresu.
- Zapisać komendy, kody wyjścia, rewizję i najważniejsze obserwacje jako receipt.

**SHOULD**
- Sprawdzić healthz i krytyczne endpointy na żywo.

**MUST NOT**
- Raportować PASS na podstawie samego tekstu agenta.

Dowody: `evidence:95f653b124c6f0d5`, `evidence:582a7a56e28d9ae1`, `evidence:ddd48173c580cca5`, `evidence:c769a91e78958a94`, `evidence:2064786bcc201a40`

### DT-UX-001 — Stan UI ma być adresowalny, czytelny i mobilny

W panelu Subactor użytkownik preferuje osobne zakładki, stan w URL, krótkie etykiety, podpowiedzi i boczne menu mobilne.

**MUST**
- Odzwierciedlić aktywny widok w URL i obsłużyć deep-link/back-forward.
- Zachować dostępność klawiatury i czytelne opisy.

**SHOULD**
- Używać krótkich etykiet z tooltipem oraz bocznego drawer na małych ekranach.

**MUST NOT**
- Dublować tę samą nawigację pod mylącymi nazwami.

Dowody: `evidence:0e9972121c3ecb61`, `evidence:b3e7f07432bb2261`, `evidence:273e39098d7c490a`, `evidence:a044e67804c1d66d`, `evidence:55a58ca9b6a98ad1`

## Workflow

1. **Zbierz i znormalizuj dowody** — Wczytaj historię IDE/shell/chat. Zredaguj sekrety. Zachowaj hash, źródło, kolejność i aktora.
2. **Rozstrzygnij intencję człowieka** — Zastosuj ranking humanIntent. Nowszą korektę traktuj jako supersession w tym samym zakresie. Nie globalizuj incydentu.
3. **Porównaj intencję z bieżącą rzeczywistością** — Znajdź HOME właściwy dla claimu. Sprawdź kod, Git, testy i runtime. Oznacz unknown lub disagreement zamiast zgadywać.
4. **Zwiąż pracę z ticketem i zakresem** — Odczytaj lub utwórz project/ticket-*. Sprawdź allowed paths i acceptance criteria. Zapisuj decyzje i changelog.
5. **Wygeneruj plan i kontekst wykonawczy** — Preferuj istniejące API i komponenty. Przekaż do LLM tylko zwalidowany DSL oraz minimalny kontekst. Kandydaci LLM pozostają propose-only.
6. **Wykonaj w ograniczonym zakresie i zweryfikuj** — Wykonaj zmianę w allowed paths. Uruchom build, TestQL/kontrakty i pełne testy. Sprawdź health/live behavior i zapisz receipty.

## Diagnostyki

- **info / DT_AGENT_CLAIMS_NON_AUTHORITATIVE:** 19 wypowiedzi agenta zachowano jako materiał audytowy, ale nie użyto ich do aktywacji reguł.
- **review_required / DT_CONTEXTUAL_CONFLICT_PRESERVED:** Historia zawiera polecenia usunięcia konkretnego kontenera i użycia Dockera do parity. Reguła pozostaje kontekstowa.
- **review_required / DT_LLM_CANDIDATES_REVIEW_REQUIRED:** 1 kandydatów LLM dodano ze statusem candidate; nie sterują wykonaniem bez promocji w ticket/intent.
