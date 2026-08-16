#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]


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


if __name__ == "__main__":
    validate("developer-twin.schema.json", "data/output/developer-twin.dsl.json")
    validate("guidelines.schema.json", "data/output/guidelines.json")
