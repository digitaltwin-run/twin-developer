from __future__ import annotations

import hashlib
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .audit import append_audit


class LlmConfigurationError(RuntimeError):
    pass


class LlmResponseError(RuntimeError):
    pass


@dataclass(frozen=True)
class Route:
    stage: str
    model: str
    api_base: str | None
    api_key: str | None
    provider: str


def _sha(value: Any) -> str:
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return "sha256:" + hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _root() -> Path:
    return Path(__file__).resolve().parents[1]




def _routing() -> dict[str, Any]:
    return json.loads((_root() / "config" / "llm-routing.json").read_text(encoding="utf-8"))


def _route_enabled(route_id: str) -> bool:
    route = next((item for item in _routing().get("routes", []) if item.get("id") == route_id), None)
    if not isinstance(route, dict):
        return False
    env_name = route.get("enabledEnv")
    if not env_name:
        return True
    value = os.environ.get(str(env_name))
    if value is None:
        return True
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _registry() -> dict[str, Any]:
    return json.loads((_root() / "config" / "model-registry.json").read_text(encoding="utf-8"))


def _stage_entry(stage: str) -> dict[str, Any]:
    mapped = "code-editing" if stage in {"chat", "code-editing"} else stage
    stages = _registry().get("stages", {})
    entry = stages.get(mapped)
    if not isinstance(entry, dict):
        raise LlmConfigurationError(f"Unknown model registry stage: {stage}")
    return entry


def _schema(name: str) -> dict[str, Any]:
    return json.loads((_root() / "schemas" / name).read_text(encoding="utf-8"))


def _prefixed(provider: str, model: str) -> str:
    if provider == "openrouter":
        # `model` is an OpenRouter model ID (for example `openrouter/auto` or
        # `anthropic/claude-*`). LiteLLM adds its own provider prefix.
        return model if model.startswith("openrouter/openrouter/") else f"openrouter/{model}"
    if provider == "openai-compatible":
        return model if model.startswith("openai/") else f"openai/{model}"
    return model


def resolve_route(stage: str, explicit_model: str | None = None) -> Route:
    entry = _stage_entry(stage)
    # Privacy-first: a configured local OpenAI-compatible endpoint wins.
    local_base = os.environ.get("LOCAL_LLM_API_BASE", "").strip()
    local_model = os.environ.get("LOCAL_LLM_MODEL", "").strip()
    if _route_enabled("local-private") and local_base and local_model:
        return Route(
            stage=stage,
            model=_prefixed("openai-compatible", explicit_model or local_model),
            api_base=local_base.rstrip("/"),
            api_key=os.environ.get("LOCAL_LLM_API_KEY", "local-not-required"),
            provider="local-openai-compatible",
        )

    proxy_url = os.environ.get("LITELLM_PROXY_URL", "").strip()
    if _route_enabled("litellm-proxy") and proxy_url:
        return Route(
            stage=stage,
            model=explicit_model or str(entry["alias"]),
            api_base=proxy_url.rstrip("/"),
            api_key=os.environ.get("LITELLM_MASTER_KEY", ""),
            provider="litellm-proxy",
        )

    key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    model = explicit_model or os.environ.get(str(entry["openrouterModelEnv"]), str(entry["defaultOpenRouterModel"]))
    if _route_enabled("openrouter-direct") and key:
        return Route(stage=stage, model=_prefixed("openrouter", model), api_base=None, api_key=key, provider="openrouter")

    raise LlmConfigurationError(
        "No LLM route configured. Set LOCAL_LLM_API_BASE+LOCAL_LLM_MODEL, LITELLM_PROXY_URL, "
        "or OPENROUTER_API_KEY. For offline tests set TWIN_LLM_FAKE=1."
    )


def _fake_intents(payload: dict[str, Any]) -> dict[str, Any]:
    evidence = payload.get("evidence") or []
    refs = [item.get("id") for item in evidence if isinstance(item, dict) and item.get("id")][:2]
    candidates: list[dict[str, Any]] = []
    if refs:
        candidates.append(
            {
                "candidateId": "candidate:side-by-side-review",
                "title": "Porównanie side-by-side przed dużym refaktorem",
                "description": "Przed zastąpieniem istniejącej ścieżki pokaż różnice między zachowaniem obecnym i proponowanym oraz przypisz je do dowodów.",
                "scope": "project",
                "kind": "preference",
                "must": [],
                "should": ["Przedstawić porównanie zachowania i źródeł prawdy przed refaktorem."],
                "mustNot": [],
                "evidenceRefs": refs,
                "confidence": 0.72,
                "generalizationRisk": "medium",
                "conflictsWith": [],
            }
        )
    return {"schemaVersion": "subactor.developer-twin.intent-candidates/v1", "candidates": candidates}


def _fake_guidelines(payload: dict[str, Any]) -> dict[str, Any]:
    baseline = payload.get("deterministicBaseline")
    if not isinstance(baseline, dict):
        raise LlmResponseError("Fake guidelines require deterministicBaseline.")
    result = json.loads(json.dumps(baseline))
    result["summary"] = "LLM-reviewed, evidence-bound plan: " + str(result.get("summary", ""))
    return result


def _extract_text(response: Any) -> str:
    try:
        content = response.choices[0].message.content
    except Exception as exc:  # pragma: no cover - provider-specific guard
        raise LlmResponseError(f"LiteLLM response has no message content: {exc}") from exc
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = [item.get("text", "") for item in content if isinstance(item, dict)]
        return "".join(parts)
    raise LlmResponseError("Unsupported LiteLLM content shape.")


def _real_structured(stage: str, payload: dict[str, Any], schema: dict[str, Any], system: str) -> tuple[dict[str, Any], dict[str, Any]]:
    try:
        from litellm import completion  # type: ignore
    except ModuleNotFoundError as exc:
        raise LlmConfigurationError("litellm is not installed; run pip install -r requirements.txt") from exc

    route = resolve_route(stage)
    kwargs: dict[str, Any] = {
        "model": route.model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
        ],
        "temperature": 0,
        "response_format": {
            "type": "json_schema",
            "json_schema": {"name": stage.replace("-", "_"), "strict": True, "schema": schema},
        },
    }
    if route.api_base:
        kwargs["api_base"] = route.api_base
    if route.api_key:
        kwargs["api_key"] = route.api_key
    response = completion(**kwargs)
    text = _extract_text(response)
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        raise LlmResponseError(f"Structured response is not JSON: {text[:300]}") from exc
    usage = getattr(response, "usage", None)
    audit = {
        "stage": stage,
        "status": "succeeded",
        "provider": route.provider,
        "model": route.model,
        "responseId": getattr(response, "id", None),
        "requestHash": _sha(payload),
        "schemaHash": _sha(schema),
        "usage": usage.model_dump() if hasattr(usage, "model_dump") else (dict(usage) if isinstance(usage, dict) else None),
    }
    return parsed, audit


def complete_intents(payload: dict[str, Any]) -> dict[str, Any]:
    if os.environ.get("TWIN_LLM_FAKE", "").lower() in {"1", "true", "yes"}:
        result = _fake_intents(payload)
        append_audit({"stage": "intent-extraction", "status": "succeeded", "provider": "fake", "model": "fixture", "requestHash": _sha(payload), "schemaHash": _sha(_schema("llm-intent-extraction.schema.json"))})
        return result
    result, audit = _real_structured(
        "intent-extraction",
        payload,
        _schema("llm-intent-extraction.schema.json"),
        "Extract only durable developer execution-policy candidates. Every candidate must cite existing evidenceRefs. "
        "Do not infer personality, current code state, secrets, permissions or DONE. Context-specific incidents must not become global rules.",
    )
    append_audit(audit)
    return result


def complete_guidelines(payload: dict[str, Any]) -> dict[str, Any]:
    if os.environ.get("TWIN_LLM_FAKE", "").lower() in {"1", "true", "yes"}:
        result = _fake_guidelines(payload)
        append_audit({"stage": "guideline-generation", "status": "succeeded", "provider": "fake", "model": "fixture", "requestHash": _sha(payload), "schemaHash": _sha(_schema("guidelines.schema.json"))})
        return result
    result, audit = _real_structured(
        "guideline-generation",
        payload,
        _schema("guidelines.schema.json"),
        "Create a concise implementation plan constrained by the validated developer-twin DSL. Use only existing ruleRefs and only commands from allowedCommands. "
        "Do not claim that code exists, tests passed, or deployment succeeded. Unknown current state must remain in unknowns.",
    )
    append_audit(audit)
    return result


def complete_chat(messages: list[dict[str, str]], model: str | None = None, temperature: float = 0.0, max_tokens: int | None = None) -> dict[str, Any]:
    if os.environ.get("TWIN_LLM_FAKE", "").lower() in {"1", "true", "yes"}:
        text = "FAKE: " + (messages[-1]["content"] if messages else "")
        append_audit({"stage": "chat", "status": "succeeded", "provider": "fake", "model": "fixture", "requestHash": _sha(messages)})
        return {"id": "fake-chat", "object": "chat.completion", "model": "fixture", "choices": [{"index": 0, "message": {"role": "assistant", "content": text}, "finish_reason": "stop"}], "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}}
    try:
        from litellm import completion  # type: ignore
    except ModuleNotFoundError as exc:
        raise LlmConfigurationError("litellm is not installed; run pip install -r requirements.txt") from exc
    route = resolve_route("chat", model)
    kwargs: dict[str, Any] = {"model": route.model, "messages": messages, "temperature": temperature}
    if max_tokens is not None:
        kwargs["max_tokens"] = max_tokens
    if route.api_base:
        kwargs["api_base"] = route.api_base
    if route.api_key:
        kwargs["api_key"] = route.api_key
    response = completion(**kwargs)
    append_audit({"stage": "chat", "status": "succeeded", "provider": route.provider, "model": route.model, "responseId": getattr(response, "id", None), "requestHash": _sha(messages)})
    return response.model_dump() if hasattr(response, "model_dump") else dict(response)


def health() -> dict[str, Any]:
    fake = os.environ.get("TWIN_LLM_FAKE", "").lower() in {"1", "true", "yes"}
    routes = {
        "localOpenAICompatible": {
            "enabled": _route_enabled("local-private"),
            "configured": bool(os.environ.get("LOCAL_LLM_API_BASE") and os.environ.get("LOCAL_LLM_MODEL")),
        },
        "litellmProxy": {
            "enabled": _route_enabled("litellm-proxy"),
            "configured": bool(os.environ.get("LITELLM_PROXY_URL")),
        },
        "openrouterDirect": {
            "enabled": _route_enabled("openrouter-direct"),
            "configured": bool(os.environ.get("OPENROUTER_API_KEY")),
        },
    }
    configured = fake or any(row["enabled"] and row["configured"] for row in routes.values())
    return {
        "ok": True,
        "service": "developer-twin-llm",
        "version": "0.1.0",
        "configured": configured,
        "fake": fake,
        "modelRegistry": _registry().get("home"),
        "routes": routes,
    }
