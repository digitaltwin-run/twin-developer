from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_ROOT = Path(__file__).resolve().parents[1]


def _path() -> Path:
    """Ścieżka ledgera audytu.

    Względna wartość jest rozwiązywana względem katalogu projektu, a nie CWD —
    ledger append-only nie może się rozjeżdżać po systemie plików w zależności
    od tego, skąd uruchomiono usługę.
    """
    raw = Path(os.environ.get("TWIN_LLM_AUDIT_PATH", "data/output/llm-audit.jsonl"))
    return raw if raw.is_absolute() else _ROOT / raw


def audit_ref(record: dict[str, Any]) -> str:
    payload = json.dumps(record, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return "sha256:" + hashlib.sha256(payload.encode("utf-8")).hexdigest()[:32]


def append_audit(record: dict[str, Any]) -> str:
    """Dopisuje rekord i zwraca jego referencję.

    Zapisywane są zarówno sukcesy, jak i niepowodzenia — ledger rejestrujący
    wyłącznie to, co się udało, nie nadaje się do wykrywania degradacji.
    """
    path = _path()
    path.parent.mkdir(parents=True, exist_ok=True)
    safe = {
        "schemaVersion": "subactor.developer-twin.llm-audit/v1",
        "observedAt": datetime.now(timezone.utc).isoformat(),
        **record,
    }
    ref = audit_ref({key: value for key, value in safe.items() if key != "observedAt"})
    safe["auditRef"] = ref
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(safe, ensure_ascii=False, sort_keys=True) + "\n")
    return ref
