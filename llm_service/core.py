from __future__ import annotations

import hashlib
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .audit import append_audit
from .redaction import redact_payload


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


@dataclass(frozen=True)
class Provenance:
    """Kto faktycznie wyprodukował artefakt.

    Bez tego rekordu wynik fixture'u jest nieodróżnialny od wyniku modelu,
    a `llmUsed: true` nie znaczy nic.
    """

    provider: str
    model: str
    response_id: str | None
    audit_ref: str

    def headers(self) -> dict[str, str]:
        rows = {
            "x-twin-provider": self.provider,
            "x-twin-model": self.model,
            "x-twin-audit-ref": self.audit_ref,
        }
        if self.response_id:
            rows["x-twin-response-id"] = self.response_id
        return rows


def _sha(value: Any) -> str:
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return "sha256:" + hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _root() -> Path:
    return Path(__file__).resolve().parents[1]




def _routing() -> dict[str, Any]:
    return json.loads((_root() / "config" / "llm-routing.json").read_text(encoding="utf-8"))


_TRUTHY = {"1", "true", "yes", "on"}
_FALSY = {"0", "false", "no", "off", ""}


def flag_enabled(name: str, default: bool = False) -> bool:
    """Jedna semantyka flag boolowskich dla całego projektu: brak zmiennej = default.

    Domyślnie ``False``. Trasa LLM, której nikt jawnie nie włączył, jest wyłączona,
    a nie włączona — inaczej klucz dostawcy leżący w powłoce operatora decyduje
    o tym, dokąd wychodzą dane. Ten sam kontrakt egzekwuje ``scripts/flags.sh``.
    """
    raw = os.environ.get(name)
    if raw is None:
        return default
    value = raw.strip().lower()
    if value in _TRUTHY:
        return True
    if value in _FALSY:
        return False
    raise LlmConfigurationError(f"Invalid boolean value for {name}: {raw!r}")


def _route_enabled(route_id: str) -> bool:
    route = next((item for item in _routing().get("routes", []) if item.get("id") == route_id), None)
    if not isinstance(route, dict):
        return False
    env_name = route.get("enabledEnv")
    if not env_name:
        return True
    return flag_enabled(str(env_name), default=False)


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
    # Ostatnia bramka przed wyjściem na zewnątrz. Nie ufa temu, że wywołujący
    # zredagował ładunek — REST, CLI i Aider mają różne ścieżki wejścia.
    safe_payload = redact_payload(payload)
    kwargs: dict[str, Any] = {
        "model": route.model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": json.dumps(safe_payload, ensure_ascii=False)},
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
        "requestHash": _sha(safe_payload),
        "schemaHash": _sha(schema),
        "usage": usage.model_dump() if hasattr(usage, "model_dump") else (dict(usage) if isinstance(usage, dict) else None),
    }
    return parsed, audit


def fake_mode() -> bool:
    return flag_enabled("TWIN_LLM_FAKE", default=False)


def _provenance(audit: dict[str, Any], ref: str) -> Provenance:
    return Provenance(
        provider=str(audit.get("provider") or "unknown"),
        model=str(audit.get("model") or "unknown"),
        response_id=(str(audit["responseId"]) if audit.get("responseId") else None),
        audit_ref=ref,
    )


def _run_stage(stage: str, payload: dict[str, Any], schema_name: str, system: str, fake: Any) -> tuple[dict[str, Any], Provenance]:
    """Wspólna ścieżka dla trybu fake i realnego, z audytem również przy porażce."""
    if fake_mode():
        result = fake(payload)
        audit = {
            "stage": stage,
            "status": "succeeded",
            "provider": "fake",
            "model": "fixture",
            "requestHash": _sha(payload),
            "schemaHash": _sha(_schema(schema_name)),
        }
        return result, _provenance(audit, append_audit(audit))
    try:
        result, audit = _real_structured(stage, payload, _schema(schema_name), system)
    except (LlmConfigurationError, LlmResponseError) as exc:
        append_audit({
            "stage": stage,
            "status": "failed",
            "provider": "unresolved",
            "model": "unresolved",
            "requestHash": _sha(payload),
            "error": type(exc).__name__,
        })
        raise
    return result, _provenance(audit, append_audit(audit))


def complete_intents(payload: dict[str, Any]) -> tuple[dict[str, Any], Provenance]:
    return _run_stage(
        "intent-extraction",
        payload,
        "llm-intent-extraction.schema.json",
        "Extract only durable developer execution-policy candidates. Every candidate must cite existing evidenceRefs. "
        "Do not infer personality, current code state, secrets, permissions or DONE. Context-specific incidents must not become global rules.",
        _fake_intents,
    )


def complete_guidelines(payload: dict[str, Any]) -> tuple[dict[str, Any], Provenance]:
    return _run_stage(
        "guideline-generation",
        payload,
        "guidelines.schema.json",
        "Create a concise implementation plan constrained by the validated developer-twin DSL. Use only existing ruleRefs and only commands from allowedCommands. "
        "Do not claim that code exists, tests passed, or deployment succeeded. Unknown current state must remain in unknowns.",
        _fake_guidelines,
    )


def complete_chat(messages: list[dict[str, str]], model: str | None = None, temperature: float = 0.0, max_tokens: int | None = None) -> tuple[dict[str, Any], Provenance]:
    # Redakcja przed każdą ścieżką — fake też echo'uje treść użytkownika.
    safe_messages = redact_payload(messages)
    if fake_mode():
        text = "FAKE: " + (safe_messages[-1]["content"] if safe_messages else "")
        audit = {"stage": "chat", "status": "succeeded", "provider": "fake", "model": "fixture", "requestHash": _sha(safe_messages)}
        result = {"id": "fake-chat", "object": "chat.completion", "model": "fixture", "choices": [{"index": 0, "message": {"role": "assistant", "content": text}, "finish_reason": "stop"}], "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}}
        return result, _provenance(audit, append_audit(audit))
    try:
        from litellm import completion  # type: ignore
    except ModuleNotFoundError as exc:
        raise LlmConfigurationError("litellm is not installed; run pip install -r requirements.txt") from exc
    try:
        route = resolve_route("chat", model)
    except LlmConfigurationError:
        append_audit({"stage": "chat", "status": "failed", "provider": "unresolved", "model": "unresolved", "requestHash": _sha(safe_messages), "error": "LlmConfigurationError"})
        raise
    kwargs: dict[str, Any] = {"model": route.model, "messages": safe_messages, "temperature": temperature}
    if max_tokens is not None:
        kwargs["max_tokens"] = max_tokens
    if route.api_base:
        kwargs["api_base"] = route.api_base
    if route.api_key:
        kwargs["api_key"] = route.api_key
    response = completion(**kwargs)
    audit = {"stage": "chat", "status": "succeeded", "provider": route.provider, "model": route.model, "responseId": getattr(response, "id", None), "requestHash": _sha(safe_messages)}
    result = response.model_dump() if hasattr(response, "model_dump") else dict(response)
    return result, _provenance(audit, append_audit(audit))


def health() -> dict[str, Any]:
    fake = fake_mode()
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
