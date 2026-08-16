# Subactor developer-twin execution context

Project: subactor/www-sub-actor-example
Active ticket: project/ticket-001

## User task

# Przykładowe zadanie

Kontynuuj rozwój panelu Subactor. Dodaj w zakładce LLM czytelną informację, który endpoint jest aktywny, jakie ma tagi i jaki jest fallback. Stan zakładki ma pozostać w URL, rozwiązanie ma użyć istniejącego API, a po zmianie należy zrestartować usługi, wykonać TestQL oraz pełne testy. Wszystkie prace zapisz w aktywnym ticketcie i nie twórz drugiego źródła prawdy dla konfiguracji modeli.

## Binding execution rules

### DT-CONTINUE-001 — Kontynuacja oznacza odczyt stanu i domknięcie rozpoczętego zakresu
Samo 'kontynuuj' nie ustanawia nowego celu; runtime ma odczytać aktywny ticket, diff, testy i niedomknięte kryteria.
- MUST: Odczytać aktywny ticket i ostatnie potwierdzone kryteria.
- MUST: Kontynuować wyłącznie w niezamkniętym zakresie i ponownie zweryfikować stan.
- MUST NOT: Zgadywać nowego celu na podstawie samego słowa 'kontynuuj'.

### DT-GOV-001 — Ticket i intent przed wieloetapową zmianą
Wieloetapowa zmiana ma być prowadzona w aktywnym project/ticket-* zgodnie z new-project i ticket-lifecycle.
- MUST: Utworzyć lub wskazać aktywny project/ticket-* przed implementacją.
- MUST: Zapisać zakres, kryteria akceptacji, dozwolone ścieżki i plan walidacji.
- MUST: Aktualizować changelog i indeks ticketów wraz z pracą.
- MUST NOT: Prowadzić wieloetapowej implementacji wyłącznie w czacie bez śladu ticketu.

### DT-LLM-001 — LLM jest ekstraktorem i doradcą, nie źródłem autorytetu
LLM może generować kandydatów DSL i wytyczne, ale runtime deterministyczny waliduje schemat, cytowania, zakres i bramki efektów.
- MUST: Wymagać structured output i walidacji lokalnej.
- MUST: Weryfikować, że każdy wniosek cytuje istniejące evidenceRefs.
- MUST: Oddzielić propose od apply i wymagać receipt po wykonaniu.
- MUST NOT: Pozwalać LLM nadawać sobie uprawnień, deklarować DONE bez testów albo modyfikować sekrety.

### DT-REUSE-001 — Najpierw istniejące API, formularze i komponenty
Przed tworzeniem nowej implementacji należy zbadać i wykorzystać istniejące kontrakty oraz projekty referencyjne.
- MUST: Zidentyfikować istniejący kontrakt lub projekt referencyjny.
- MUST: Zachować kompatybilność albo jawnie opisać migrację.
- MUST NOT: Wymyślać równoległego API bez analizy istniejącego.

### DT-SSOT-001 — HOME/ADOPT/facade i jeden właściciel prawdy
Dane produktu pozostają w kanonicznym HOME; standardy definiują kontrakty, a projekcje są fasadami z bramką driftu.
- MUST: Wskazać jeden HOME dla każdego concernu.
- MUST: Oznaczyć kopie jako generated mirror, vendored parity copy albo facade.
- MUST: Porównać projekcje z HOME przed merge.
- MUST NOT: Tworzyć drugiego SSOT cen, brandu lub required checks w repozytorium adoptującym.

### DT-TEST-001 — Restart, TestQL i pełna walidacja po zmianie
Po zmianach runtime/UI/usług użytkownik oczekuje restartu i odtwarzalnej weryfikacji, szczególnie przez TestQL.
- MUST: Uruchomić deklarowany restart lub odtworzyć równoważny lifecycle usługi.
- MUST: Uruchomić TestQL/kontraktowe testy projektu i pełną suitę właściwą dla zmienionego zakresu.
- MUST: Zapisać komendy, kody wyjścia, rewizję i najważniejsze obserwacje jako receipt.
- MUST NOT: Raportować PASS na podstawie samego tekstu agenta.

### DT-UX-001 — Stan UI ma być adresowalny, czytelny i mobilny
W panelu Subactor użytkownik preferuje osobne zakładki, stan w URL, krótkie etykiety, podpowiedzi i boczne menu mobilne.
- MUST: Odzwierciedlić aktywny widok w URL i obsłużyć deep-link/back-forward.
- MUST: Zachować dostępność klawiatury i czytelne opisy.
- MUST NOT: Dublować tę samą nawigację pod mylącymi nazwami.

## Ordered plan

1. Utworzyć lub wskazać aktywny project/ticket-* przed implementacją. [DT-GOV-001]
2. Wskazać jeden HOME dla każdego concernu. [DT-SSOT-001]
3. Zidentyfikować istniejący kontrakt lub projekt referencyjny. [DT-REUSE-001]
4. Odzwierciedlić aktywny widok w URL i obsłużyć deep-link/back-forward. [DT-UX-001]
5. Wymagać structured output i walidacji lokalnej. [DT-LLM-001]
6. Odczytać aktywny ticket i ostatnie potwierdzone kryteria. [DT-CONTINUE-001]
7. Uruchomić deklarowany restart lub odtworzyć równoważny lifecycle usługi. [DT-TEST-001]

## Safety and completion contract

- Read the active ticket, existing APIs and current code before editing.
- Treat this file and the DSL as constraints, not evidence that the implementation already exists.
- Never print or commit secrets. Do not edit outside ticket scope.
- Do not commit, push, merge or deploy unless separately authorized.
- After edits, run only the commands listed in the validated guidelines.
- Report exact commands, exit codes, changed files, unresolved unknowns and runtime observations.
- Never claim PASS/DONE from your own narrative; PASS requires command receipts.

Full validated DSL is available as a read-only context file: data/output/developer-twin.dsl.json.
