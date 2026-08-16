#!/usr/bin/env python3
"""Bramka tożsamości schematów.

Powód istnienia: w tym repozytorium powstał plik `schemas/ticket-intent.schema.json`
z `$id` i `const` przypisanymi do `new-project.intent/v3` — identyfikatora
należącego do `wellmanifest/new-project`. Lokalny walidator drukował wtedy
`SCHEMA-PASS project/ticket-002/intent.json`, podczas gdy prawdziwy schemat
standardu odrzucał ten sam plik z dziesięcioma błędami.

To jest ten sam tryb porażki, przed którym ostrzega cały ten projekt: zielona
bramka postawiona zamiast dowodu. Repozytorium może definiować własne kontrakty,
ale nie może im nadawać cudzych nazw.

Zasada: każdy `$id` i każdy `schema`/`schemaVersion` z `const` w `schemas/` musi
należeć do przestrzeni nazw tego repozytorium. Zgodność z cudzym standardem
wolno zadeklarować dopiero wtedy, gdy jego własny walidator ją potwierdzi.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCHEMAS = ROOT / "schemas"

# Przestrzenie nazw, którymi to repozytorium wolno się posługiwać.
OWN_NAMESPACES = (
    "subactor.developer-twin",
    "subactor.twin-developer",
    "subactor.project-context",
    "subactor.llm-routing",
)

# Właściciele, pod których nie wolno się podszywać. Nazwa po lewej, HOME po prawej.
FOREIGN_OWNERS = {
    "new-project": "wellmanifest/new-project",
    "wellmanifest": "wellmanifest/*",
    "twin-lifecycle": "wellmanifest/twin-lifecycle",
    "policy-dsl": "wellmanifest/policy-dsl",
    "autonomy-manifest": "wellmanifest/autonomy",
    "subactor.twin/": "subactor/twin",
}

IDENTIFIER_KEYS = {"$id", "const"}


def walk(node: object, path: str = "$"):
    if isinstance(node, dict):
        for key, value in node.items():
            yield from walk(value, f"{path}.{key}")
            if key in IDENTIFIER_KEYS and isinstance(value, str):
                yield f"{path}.{key}", value
    elif isinstance(node, list):
        for index, value in enumerate(node):
            yield from walk(value, f"{path}[{index}]")


def owned(value: str) -> bool:
    return any(namespace in value for namespace in OWN_NAMESPACES)


def main() -> int:
    problems: list[str] = []
    checked = 0

    for schema_path in sorted(SCHEMAS.glob("*.json")):
        document = json.loads(schema_path.read_text(encoding="utf-8"))
        checked += 1
        for location, value in walk(document):
            # Adres samego dialektu JSON Schema nie jest deklaracją tożsamości.
            if value.startswith("https://json-schema.org/"):
                continue
            for owner, home in FOREIGN_OWNERS.items():
                if re.search(re.escape(owner), value) and not owned(value):
                    problems.append(
                        f"{schema_path.relative_to(ROOT)} {location} = {value!r}\n"
                        f"    identyfikator należy do {home}; ten kontrakt nie jest tu definiowany"
                    )

    # Dokumenty muszą deklarować tę samą przestrzeń nazw co ich schematy.
    for intent_path in sorted((ROOT / "project").glob("ticket-*/intent.json")):
        declared = json.loads(intent_path.read_text(encoding="utf-8")).get("schema", "")
        checked += 1
        if not owned(declared):
            problems.append(
                f"{intent_path.relative_to(ROOT)} schema = {declared!r}\n"
                f"    deklaruje cudzy kontrakt bez dowodu zgodności od jego walidatora"
            )

    if problems:
        print("SCHEMA-IDENTITY-FAIL")
        for problem in problems:
            print(f"  {problem}")
        return 1
    print(f"SCHEMA-IDENTITY-PASS {checked} dokumentów, brak podszywania się pod cudze kontrakty")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
