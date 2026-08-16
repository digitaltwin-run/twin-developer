# Offer Reality — historia kontra HOME

Źródło prawdy: `data/context/subactor-cloud-v1.offer.json` (subactor-cloud v1, current).

## Aktualny katalog

| Plan | Nazwa | Publiczny | Cena miesięczna |
|---|---|---|---:|
| `saas-start` | Basic | tak | 97.00 PLN |
| `saas-business` | Operations Plus | tak | 59.00 PLN |
| `prepaid-actions` | Twin Plus | tak | 59.00 PLN |
| `on-premise` | On-premise | nie | 2900.00 EUR |

## Claimy znalezione w historii

| Event | Aktor | Plan | Claim | Zgodny z HOME |
|---|---|---|---:|---|
| `event:fb9d205caaa6d712` | human | `saas-start` | 10.00 PLN | nie |
| `event:fb9d205caaa6d712` | human | `saas-business` | 100.00 PLN | nie |
| `event:fb9d205caaa6d712` | human | `prepaid-actions` | 100.00 PLN | nie |
| `event:6d329d266b29a558` | agent | `saas-start` | 10.00 PLN | nie |
| `event:6d329d266b29a558` | agent | `saas-business` | 100.00 PLN | nie |
| `event:6d329d266b29a558` | agent | `prepaid-actions` | 100.00 PLN | nie |
| `event:553c6ca80f2c3bf5` | agent | `saas-start` | 10.00 PLN | nie |
| `event:553c6ca80f2c3bf5` | agent | `saas-business` | 10.00 PLN | nie |
| `event:553c6ca80f2c3bf5` | agent | `prepaid-actions` | 100.00 PLN | nie |

## Diagnostyki

- **info / PROMPT_HISTORY_NOT_OFFER_SSOT:** Historia promptów jest dowodem oczekiwań i korekt, ale bieżące ceny pochodzą wyłącznie z wersjonowanego katalogu HOME.
- **review_required / PROMPT_OFFER_CLAIM_CONTRADICTED_BY_HOME:** Historia podaje 10.00 PLN dla saas-start, a wersjonowany HOME v1 podaje 97.00 PLN.
- **review_required / PROMPT_OFFER_CLAIM_CONTRADICTED_BY_HOME:** Historia podaje 100.00 PLN dla saas-business, a wersjonowany HOME v1 podaje 59.00 PLN.
- **review_required / PROMPT_OFFER_CLAIM_CONTRADICTED_BY_HOME:** Historia podaje 100.00 PLN dla prepaid-actions, a wersjonowany HOME v1 podaje 59.00 PLN.
- **info / PROMPT_OFFER_CLAIM_CONTRADICTED_BY_HOME:** Historia podaje 10.00 PLN dla saas-start, a wersjonowany HOME v1 podaje 97.00 PLN.
- **info / PROMPT_OFFER_CLAIM_CONTRADICTED_BY_HOME:** Historia podaje 100.00 PLN dla saas-business, a wersjonowany HOME v1 podaje 59.00 PLN.
- **info / PROMPT_OFFER_CLAIM_CONTRADICTED_BY_HOME:** Historia podaje 100.00 PLN dla prepaid-actions, a wersjonowany HOME v1 podaje 59.00 PLN.
- **info / PROMPT_OFFER_CLAIM_CONTRADICTED_BY_HOME:** Historia podaje 10.00 PLN dla saas-start, a wersjonowany HOME v1 podaje 97.00 PLN.
- **info / PROMPT_OFFER_CLAIM_CONTRADICTED_BY_HOME:** Historia podaje 10.00 PLN dla saas-business, a wersjonowany HOME v1 podaje 59.00 PLN.
- **info / PROMPT_OFFER_CLAIM_CONTRADICTED_BY_HOME:** Historia podaje 100.00 PLN dla prepaid-actions, a wersjonowany HOME v1 podaje 59.00 PLN.
