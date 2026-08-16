#!/usr/bin/env python3
"""A-7: forbiddenEffects z ticketu przestaje być prozą.

Bramka czyta każdy project/ticket-*/intent.json i wymaga, żeby każdy napis
z forbiddenEffects miał wpis w config/forbidden-effects.json. Nieznany efekt
to FAIL — inaczej znowu można wpisać zakaz, którego nic nie egzekwuje.

Egzekucja:
- kind=paths: nowy albo zmieniony plik (changeset) nie może pasować do denyGlobs.
  Pliki już na HEAD nie są w changsecie, więc historyczny data/raw/ nie blokuje.
- kind=hook: tylko gdy wywołano --hook pre-commit|pre-push i ticket jest aktywny.
- kind=delegated: wymaga, żeby wskazany skrypt istniał w drzewie.
- kind=recorded: nazwany, bez testera; nie udajemy zielonej egzekucji.
"""
from __future__ import annotations

import argparse
import json
import subprocess
from fnmatch import fnmatch
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "config" / "forbidden-effects.json"
SCHEMA_VERSION = "subactor.developer-twin.forbidden-effects/v1"
ACTIVE = {"planned", "in_progress"}


def load_catalog(root: Path = ROOT) -> dict[str, Any]:
    data = json.loads((root / "config" / "forbidden-effects.json").read_text(encoding="utf-8"))
    if data.get("schemaVersion") != SCHEMA_VERSION:
        raise SystemExit(f"Unsupported forbidden-effects schemaVersion: {data.get('schemaVersion')}")
    return data


def load_tickets(root: Path = ROOT) -> list[dict[str, Any]]:
    tickets: list[dict[str, Any]] = []
    for path in sorted((root / "project").glob("ticket-*/intent.json")):
        document = json.loads(path.read_text(encoding="utf-8"))
        document["_path"] = str(path.relative_to(root))
        tickets.append(document)
    return tickets


def index_effects(catalog: dict[str, Any]) -> dict[str, dict[str, Any]]:
    index: dict[str, dict[str, Any]] = {}
    for entry in catalog.get("effects") or []:
        index[entry["id"]] = entry
        for alias in entry.get("aliases") or []:
            index[alias] = entry
    return index


def glob_allows(path: str, pattern: str) -> bool:
    if fnmatch(path, pattern):
        return True
    if pattern.endswith("/**"):
        prefix = pattern[:-3]
        return path == prefix or path.startswith(prefix + "/")
    return False


def git_lines(root: Path, args: list[str]) -> list[str]:
    result = subprocess.run(
        ["git", *args],
        cwd=root,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        return []
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def changeset(root: Path, hook: str | None) -> list[str]:
    if hook == "pre-commit":
        return git_lines(root, ["diff", "--cached", "--name-only", "--diff-filter=ACMR"])
    if hook == "pre-push":
        names = git_lines(root, ["diff", "--name-only", "--diff-filter=ACMR", "@{u}...HEAD"])
        if names:
            return names
        return git_lines(root, ["diff", "--name-only", "--diff-filter=ACMR", "origin/main...HEAD"])
    tracked = git_lines(root, ["diff", "--name-only", "--diff-filter=ACMR", "HEAD"])
    untracked = git_lines(root, ["ls-files", "--others", "--exclude-standard"])
    return sorted(set(tracked + untracked))


def evaluate(
    *,
    root: Path = ROOT,
    paths: list[str] | None = None,
    hook: str | None = None,
    catalog: dict[str, Any] | None = None,
    tickets: list[dict[str, Any]] | None = None,
) -> list[str]:
    catalog = catalog or load_catalog(root)
    tickets = tickets if tickets is not None else load_tickets(root)
    index = index_effects(catalog)
    paths = list(paths) if paths is not None else changeset(root, hook)
    problems: list[str] = []

    if not tickets:
        problems.append("brak project/ticket-*/intent.json — nie ma czego egzekwować")
        return problems

    for ticket in tickets:
        ticket_id = ticket.get("ticketId", ticket.get("_path", "?"))
        status = ticket.get("status", "")
        for raw in ticket.get("forbiddenEffects") or []:
            if not isinstance(raw, str) or not raw.strip():
                problems.append(f"{ticket_id}: pusty forbiddenEffect")
                continue
            entry = index.get(raw)
            if entry is None:
                problems.append(
                    f"{ticket_id}: nieznany efekt {raw!r} — dopisz id/alias w config/forbidden-effects.json"
                )
                continue
            kind = entry["kind"]
            if kind == "delegated":
                delegate = root / entry["delegate"]
                if not delegate.is_file():
                    problems.append(
                        f"{ticket_id}: {entry['id']} deleguje do {entry['delegate']}, pliku nie ma"
                    )
                continue
            if kind == "recorded":
                continue
            if kind == "hook":
                if hook and status in ACTIVE and hook in entry.get("hooks", []):
                    problems.append(
                        f"{ticket_id}: aktywny ticket zabrania {entry['id']} w hooku {hook}"
                    )
                continue
            if kind != "paths":
                problems.append(f"{ticket_id}: {entry['id']} ma nieobsługiwany kind {kind!r}")
                continue
            for path in paths:
                if any(glob_allows(path, pattern) for pattern in entry.get("denyGlobs") or []):
                    problems.append(
                        f"{ticket_id}: {entry['id']} łamie {path} (changeset)"
                    )
    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description="Egzekwuj forbiddenEffects z ticketów.")
    parser.add_argument("--hook", choices=["pre-commit", "pre-push"])
    parser.add_argument("--root", type=Path, default=ROOT)
    args = parser.parse_args()
    problems = evaluate(root=args.root, hook=args.hook)
    if problems:
        print("FORBIDDEN-EFFECTS-FAIL")
        for problem in problems:
            print(f"  {problem}")
        return 1
    tickets = load_tickets(args.root)
    print(
        f"FORBIDDEN-EFFECTS-PASS {len(tickets)} ticketów, "
        f"changeset egzekwowany, każdy efekt ma wpis w katalogu"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
