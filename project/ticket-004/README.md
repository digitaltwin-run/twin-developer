# ticket-004 — R-005 containment ogólnego REST chat

## Problem

`/v1/chat/completions` jest ogólnym proxy do skonfigurowanego providera. Mimo
ochrony bindu i opcjonalnego tokenu endpoint pozostaje dostępny na loopbacku bez
jawnej zgody, a jego `ChatRequest` jako jedyny kontrakt REST akceptuje nieznane
pola.

## Oczekiwany wynik

- raw chat jest domyślnie niedostępny;
- uruchamia go wyłącznie `TWIN_ENABLE_RAW_CHAT=true`;
- niepoprawna wartość flagi kończy się fail-closed;
- `ChatRequest` używa tego samego `extra="forbid"` co pozostałe kontrakty;
- endpointy semantyczne pozostają bez zmian.

## Dowody

Ticket kończy się dopiero po `make validate`, `make test` i negatywnych testach
potwierdzających, że odmowa następuje przed wywołaniem providera.
