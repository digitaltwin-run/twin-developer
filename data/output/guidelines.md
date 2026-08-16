# Wytyczne wykonawcze

LLM-reviewed, evidence-bound plan: Wykonaj zadanie w 7 etapach, stosując reguły developer twin jako ograniczenia i wymagając dowodów po zmianie.

## Kroki

1. **Utworzyć lub wskazać aktywny project/ticket-* przed implementacją.**
   - Powód: Wieloetapowa zmiana ma być prowadzona w aktywnym project/ticket-* zgodnie z new-project i ticket-lifecycle.
   - Reguły: `DT-GOV-001`
2. **Wskazać jeden HOME dla każdego concernu.**
   - Powód: Dane produktu pozostają w kanonicznym HOME; standardy definiują kontrakty, a projekcje są fasadami z bramką driftu.
   - Reguły: `DT-SSOT-001`
3. **Zidentyfikować istniejący kontrakt lub projekt referencyjny.**
   - Powód: Przed tworzeniem nowej implementacji należy zbadać i wykorzystać istniejące kontrakty oraz projekty referencyjne.
   - Reguły: `DT-REUSE-001`
4. **Odzwierciedlić aktywny widok w URL i obsłużyć deep-link/back-forward.**
   - Powód: W panelu Subactor użytkownik preferuje osobne zakładki, stan w URL, krótkie etykiety, podpowiedzi i boczne menu mobilne.
   - Reguły: `DT-UX-001`
5. **Wymagać structured output i walidacji lokalnej.**
   - Powód: LLM może generować kandydatów DSL i wytyczne, ale runtime deterministyczny waliduje schemat, cytowania, zakres i bramki efektów.
   - Reguły: `DT-LLM-001`
6. **Odczytać aktywny ticket i ostatnie potwierdzone kryteria.**
   - Powód: Samo 'kontynuuj' nie ustanawia nowego celu; runtime ma odczytać aktywny ticket, diff, testy i niedomknięte kryteria.
   - Reguły: `DT-CONTINUE-001`
7. **Uruchomić deklarowany restart lub odtworzyć równoważny lifecycle usługi.**
   - Powód: Po zmianach runtime/UI/usług użytkownik oczekuje restartu i odtwarzalnej weryfikacji, szczególnie przez TestQL.
   - Reguły: `DT-TEST-001`
   - Komenda: `make validate`
   - Komenda: `make test`
   - Komenda: `make demo`

## Bramki

- brak aktywnego ticketu dla wieloetapowej zmiany
- nieznane evidenceRefs
- sprzeczność równorzędnych źródeł autorytatywnych
- niepoprawny structured output
- nieudane testy lub brak wymaganych receiptów
- Nie promuj kandydatów LLM do active bez jawnej decyzji w ticket/intent.
- Nie uznawaj outputu Aider ani opisu agenta za receipt testowy.

## Niewiadome

- Historia promptów nie dowodzi bieżącego stanu kodu, środowiska ani wdrożenia; trzeba je obserwować w repozytorium docelowym.
- Aktywny ticket deklarowany przez kontekst: project/ticket-001.
