#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "config" / "model-registry.json"
CANONICAL = ROOT / "config" / "litellm-proxy.yaml"


def litellm_openrouter_model(model_id: str) -> str:
    return model_id if model_id.startswith("openrouter/openrouter/") else f"openrouter/{model_id}"


def render(use_env: bool) -> str:
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    lines = [
        "# GENERATED FACADE — HOME: config/model-registry.json",
        "# Regenerate with: python3 scripts/render-litellm-config.py",
        "model_list:",
    ]
    for stage, entry in registry["stages"].items():
        model = entry["defaultOpenRouterModel"]
        if use_env:
            model = os.environ.get(entry["openrouterModelEnv"], model)
        lines.extend(
            [
                f"  - model_name: {entry['alias']}",
                "    litellm_params:",
                f"      model: {litellm_openrouter_model(model)}",
                "      api_key: os.environ/OPENROUTER_API_KEY",
            ]
        )
        if entry.get("temperature") is not None:
            lines.append(f"      temperature: {entry['temperature']}")
    lines.extend(
        [
            "",
            "router_settings:",
            "  routing_strategy: simple-shuffle",
            "  num_retries: 2",
            "  timeout: 90",
            "",
            "litellm_settings:",
            "  drop_params: true",
            "  set_verbose: false",
            "",
            "general_settings:",
            "  master_key: os.environ/LITELLM_MASTER_KEY",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=str(CANONICAL))
    parser.add_argument("--use-env", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    output = Path(args.output)
    expected = render(args.use_env)
    if args.check:
        current = output.read_text(encoding="utf-8") if output.exists() else ""
        if current != expected:
            raise SystemExit(f"MODEL-REGISTRY-DRIFT: {output} is not the generated facade of {REGISTRY}")
        print(f"MODEL-REGISTRY-PASS {output.relative_to(ROOT) if output.is_relative_to(ROOT) else output}")
        return 0
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(expected, encoding="utf-8")
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
