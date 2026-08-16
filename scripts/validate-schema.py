#!/usr/bin/env python3
"""Bramka JSON Schema dla artefaktów i konfiguracji.

D-1: literówka w `config/rule-catalog.json` nie powodowała błędu, tylko cichy
brak reguły — czyli cichą zmianę polityki wykonawczej. Konfiguracja jest
walidowana razem z artefaktami, a nie tylko obok nich.
"""
from __future__ import annotations

import json
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]

# (schemat, dokument) — konfiguracja przed artefaktami, bo to ona je produkuje.
PAIRS: list[tuple[str, str]] = [
    ("rule-catalog.schema.json", "config/rule-catalog.json"),
    ("source-policy.schema.json", "config/source-policy.json"),
    ("llm-routing.schema.json", "config/llm-routing.json"),
    ("model-registry.schema.json", "config/model-registry.json"),
    ("forbidden-effects.schema.json", "config/forbidden-effects.json"),
    ("project-context.schema.json", "data/context/project.json"),
    ("developer-twin.schema.json", "data/output/developer-twin.dsl.json"),
    ("guidelines.schema.json", "data/output/guidelines.json"),
]


def validate(schema_name: str, document_name: str) -> None:
    schema = json.loads((ROOT / "schemas" / schema_name).read_text(encoding="utf-8"))
    document = json.loads((ROOT / document_name).read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    errors = sorted(validator.iter_errors(document), key=lambda item: list(item.path))
    if errors:
        rendered = "\n".join(f"{'.'.join(map(str, error.path)) or '$'}: {error.message}" for error in errors)
        raise SystemExit(f"SCHEMA-FAIL {document_name}\n{rendered}")
    print(f"SCHEMA-PASS {document_name}")


def validate_tickets() -> None:
    """Waliduje LOKALNY kontrakt ticketów.

    To nie jest dowód zgodności z `wellmanifest/new-project`. Repozytorium nie ma
    adopcji (`.governance/` nie istnieje), a jego intenty nie spełniają
    `governance/intent.schema.json` standardu. Tożsamości pilnuje
    `scripts/check-schema-identity.py`.
    """
    for intent in sorted((ROOT / "project").glob("ticket-*/intent.json")):
        validate("local-ticket-intent.schema.json", str(intent.relative_to(ROOT)))


if __name__ == "__main__":
    for schema_name, document_name in PAIRS:
        validate(schema_name, document_name)
    validate_tickets()
