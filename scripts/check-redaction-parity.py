#!/usr/bin/env python3
"""A-4/A-6: parzystość redakcji między TypeScript a Pythonem.

Wzorce mają jedno HOME (`config/redaction-patterns.json`), ale to nie wystarczy —
JavaScript i `re` różnią się w szczegółach składni. Ten skrypt uruchamia **obie**
implementacje na tym samym zbiorze fixture'ów i wymaga identycznego wyniku.

Sprawdza trzy rzeczy:
1. każdy fixture z `mustRedact` faktycznie traci sekret w obu runtime'ach;
2. każdy fixture z `mustSurvive` przechodzi nietknięty w obu — to chroni SHA
   commitów i prozę dokumentacyjną, które dawny wzorzec hex niszczył;
3. wynik obu implementacji jest znak w znak taki sam.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from llm_service.redaction import fixtures, redact  # noqa: E402

NODE_DRIVER = """
import { compileRedactor } from '../dist/src/util/redaction.js';
import { readFileSync } from 'node:fs';
const config = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const redactor = compileRedactor(config);
const input = JSON.parse(readFileSync(process.argv[3], 'utf8'));
process.stdout.write(JSON.stringify(input.map((value) => redactor(value))));
"""


def node_redact(samples: list[str]) -> list[str]:
    driver = ROOT / "dist" / "redaction-driver.mjs"
    driver.write_text(NODE_DRIVER, encoding="utf-8")
    payload = ROOT / "dist" / "redaction-input.json"
    payload.write_text(json.dumps(samples, ensure_ascii=False), encoding="utf-8")
    try:
        result = subprocess.run(
            ["node", str(driver), str(ROOT / "config" / "redaction-patterns.json"), str(payload)],
            capture_output=True,
            text=True,
            check=True,
            cwd=ROOT,
        )
    finally:
        driver.unlink(missing_ok=True)
        payload.unlink(missing_ok=True)
    return json.loads(result.stdout)


def main() -> int:
    data = fixtures()
    must_redact = data.get("mustRedact", [])
    must_survive = data.get("mustSurvive", [])
    samples = must_redact + must_survive

    python_out = [redact(value) for value in samples]
    node_out = node_redact(samples)

    problems: list[str] = []

    for index, sample in enumerate(samples):
        if python_out[index] != node_out[index]:
            problems.append(
                f"ROZJAZD RUNTIME dla {sample[:60]!r}\n"
                f"    python: {python_out[index][:80]!r}\n"
                f"    node  : {node_out[index][:80]!r}"
            )

    for index, sample in enumerate(must_redact):
        if python_out[index] == sample:
            problems.append(f"NIEZREDAGOWANE: {sample[:70]!r}")
        elif "REDACTED" not in python_out[index]:
            problems.append(f"BRAK ZNACZNIKA REDACTED: {sample[:70]!r} -> {python_out[index][:70]!r}")

    offset = len(must_redact)
    for index, sample in enumerate(must_survive):
        produced = python_out[offset + index]
        if produced != sample:
            problems.append(
                f"FAŁSZYWIE DODATNI: {sample[:70]!r}\n"
                f"    po redakcji: {produced[:70]!r}"
            )

    if problems:
        print("REDACTION-PARITY-FAIL")
        for problem in problems:
            print(f"  {problem}")
        return 1
    print(
        f"REDACTION-PARITY-PASS {len(must_redact)} sekretów zredagowanych, "
        f"{len(must_survive)} fixture'ów nietkniętych, obie implementacje zgodne"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
