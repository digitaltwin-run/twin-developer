from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

_ROOT = Path(__file__).resolve().parents[1]
_CONFIG = _ROOT / "config" / "redaction-patterns.json"
_SCHEMA_VERSION = "subactor.developer-twin.redaction/v1"

# `$1` w konfiguracji, `\1` w module `re`.
_GROUP_REFERENCE = re.compile(r"\$(\d)")


class RedactionConfigurationError(RuntimeError):
    pass


@lru_cache(maxsize=1)
def _compiled() -> tuple[tuple[re.Pattern[str], str], ...]:
    config = json.loads(_CONFIG.read_text(encoding="utf-8"))
    if config.get("schemaVersion") != _SCHEMA_VERSION:
        raise RedactionConfigurationError(f"Unsupported redaction schemaVersion: {config.get('schemaVersion')}")
    patterns = config.get("patterns") or []
    if not patterns:
        raise RedactionConfigurationError("Redaction config carries no patterns; refusing to send unredacted payloads.")
    rows = []
    for entry in patterns:
        flags = re.IGNORECASE if entry.get("ignoreCase") else 0
        replacement = _GROUP_REFERENCE.sub(r"\\\1", entry["replacement"])
        rows.append((re.compile(entry["pattern"], flags), replacement))
    return tuple(rows)


def fixtures() -> dict[str, list[str]]:
    return json.loads(_CONFIG.read_text(encoding="utf-8")).get("fixtures", {})


def redact(text: str) -> str:
    output = text
    for pattern, replacement in _compiled():
        output = pattern.sub(replacement, output)
    return output


def redact_payload(value: Any) -> Any:
    """Rekurencyjna redakcja każdego stringa w ładunku.

    Wywoływana bezpośrednio przed `completion(...)`, czyli w jedynym miejscu,
    przez które przechodzą wszyscy konsumenci usługi. Redakcja tylko w warstwie
    TypeScript była kontrolą omijaną przez każdego innego klienta — REST,
    Aidera, drugiego agenta.
    """
    if isinstance(value, str):
        return redact(value)
    if isinstance(value, dict):
        return {key: redact_payload(item) for key, item in value.items()}
    if isinstance(value, list):
        return [redact_payload(item) for item in value]
    return value
