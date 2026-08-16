from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def _path() -> Path:
    return Path(os.environ.get("TWIN_LLM_AUDIT_PATH", "data/output/llm-audit.jsonl"))


def append_audit(record: dict[str, Any]) -> None:
    path = _path()
    path.parent.mkdir(parents=True, exist_ok=True)
    safe = {
        "schemaVersion": "subactor.developer-twin.llm-audit/v1",
        "observedAt": datetime.now(timezone.utc).isoformat(),
        **record,
    }
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(safe, ensure_ascii=False, sort_keys=True) + "\n")
