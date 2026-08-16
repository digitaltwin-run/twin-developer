#!/usr/bin/env python3
"""A-2: jedna semantyka flag w Pythonie, bashu i dokumentacji.

Przed naprawą ta sama flaga miała dwa przeciwne znaczenia: `llm_service.core`
traktowało brak zmiennej jako "włączone", a `scripts/run-aider.sh` jako
"wyłączone". Ten skrypt pilnuje, żeby rozjazd nie wrócił.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FALSE_DEFAULT = re.compile(r"\$\{(?P<name>[A-Z][A-Z0-9_]*):-(?P<default>[^}]*)\}")


def routing_flags() -> list[str]:
    routing = json.loads((ROOT / "config" / "llm-routing.json").read_text(encoding="utf-8"))
    return [str(route["enabledEnv"]) for route in routing["routes"] if route.get("enabledEnv")]


def env_example_values() -> dict[str, str]:
    rows: dict[str, str] = {}
    for line in (ROOT / ".env.example").read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        name, _, value = stripped.partition("=")
        rows[name.strip()] = value.strip()
    return rows


def main() -> int:
    problems: list[str] = []
    flags = routing_flags()
    documented = env_example_values()

    for flag in flags:
        if flag not in documented:
            problems.append(f"{flag}: brak w .env.example, a steruje trasą LLM")
        elif documented[flag].lower() not in {"0", "1", "true", "false", "yes", "no", "on", "off", ""}:
            problems.append(f"{flag}: wartość w .env.example nie jest boolowska ({documented[flag]!r})")

    for script in sorted((ROOT / "scripts").glob("*.sh")):
        text = script.read_text(encoding="utf-8")
        for match in FALSE_DEFAULT.finditer(text):
            name = match.group("name")
            default = match.group("default").strip()
            if name in flags and default.lower() not in {"false", "0", "no", "off", ""}:
                problems.append(
                    f"{script.name}: {name} ma domyślną wartość {default!r}; "
                    "kontrakt to fail-closed (brak flagi = wyłączone)"
                )

    core = (ROOT / "llm_service" / "core.py").read_text(encoding="utf-8")
    if "def flag_enabled(name: str, default: bool = False)" not in core:
        problems.append("llm_service/core.py: flag_enabled nie ma domyślnej wartości False")

    if problems:
        print("FLAG-PARITY-FAIL")
        for problem in problems:
            print(f"  {problem}")
        return 1
    print(f"FLAG-PARITY-PASS {len(flags)} flag tras, {len(documented)} zmiennych w .env.example")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
