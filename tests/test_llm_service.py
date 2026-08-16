from __future__ import annotations

import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

from llm_service.app import app, require_raw_chat_enabled
from llm_service.cli import _guard_bind
from llm_service.core import (
    LlmConfigurationError,
    complete_chat,
    complete_guidelines,
    complete_intents,
    flag_enabled,
    health,
    resolve_route,
)
from llm_service.models import ChatRequest


class FakeLlmServiceTest(unittest.TestCase):
    def setUp(self) -> None:
        self.old_fake = os.environ.get("TWIN_LLM_FAKE")
        self.old_audit = os.environ.get("TWIN_LLM_AUDIT_PATH")
        self.temp = tempfile.TemporaryDirectory()
        os.environ["TWIN_LLM_FAKE"] = "1"
        os.environ["TWIN_LLM_AUDIT_PATH"] = str(Path(self.temp.name) / "audit.jsonl")

    def tearDown(self) -> None:
        self.temp.cleanup()
        if self.old_fake is None:
            os.environ.pop("TWIN_LLM_FAKE", None)
        else:
            os.environ["TWIN_LLM_FAKE"] = self.old_fake
        if self.old_audit is None:
            os.environ.pop("TWIN_LLM_AUDIT_PATH", None)
        else:
            os.environ["TWIN_LLM_AUDIT_PATH"] = self.old_audit

    def test_fake_intent_and_guidelines_are_structured(self) -> None:
        intents, provenance = complete_intents({"evidence": [{"id": "evidence:1"}, {"id": "evidence:2"}]})
        self.assertEqual(intents["schemaVersion"], "subactor.developer-twin.intent-candidates/v1")
        self.assertEqual(intents["candidates"][0]["evidenceRefs"], ["evidence:1", "evidence:2"])
        baseline = {
            "schemaVersion": "subactor.developer-twin.guidelines/v1",
            "summary": "baseline",
            "steps": [],
            "gates": [],
            "unknowns": [],
            "ruleRefs": [],
        }
        result, _ = complete_guidelines({"deterministicBaseline": baseline})
        self.assertTrue(result["summary"].startswith("LLM-reviewed"))
        self.assertTrue(Path(os.environ["TWIN_LLM_AUDIT_PATH"]).exists())
        self.assertEqual(provenance.provider, "fake")
        self.assertEqual(provenance.model, "fixture")

    def test_fixture_provenance_is_recorded_and_distinguishable(self) -> None:
        """Wynik fixture'u musi być odróżnialny od wyniku modelu — inaczej
        `llmUsed: true` nie niesie żadnej informacji."""
        _, provenance = complete_intents({"evidence": [{"id": "evidence:1"}]})
        self.assertEqual(provenance.provider, "fake")
        self.assertTrue(provenance.audit_ref.startswith("sha256:"))
        self.assertEqual(provenance.headers()["x-twin-provider"], "fake")

        records = [
            json.loads(line)
            for line in Path(os.environ["TWIN_LLM_AUDIT_PATH"]).read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
        self.assertTrue(records)
        self.assertTrue(all(row["provider"] == "fake" for row in records))
        self.assertTrue(all(row["auditRef"].startswith("sha256:") for row in records))

    def test_fake_chat_and_health(self) -> None:
        result, provenance = complete_chat([{"role": "user", "content": "hello"}])
        self.assertIn("FAKE: hello", result["choices"][0]["message"]["content"])
        self.assertEqual(provenance.provider, "fake")
        self.assertTrue(health()["configured"])

    def test_route_priority_and_registry_aliases(self) -> None:
        with patch.dict(os.environ, {
            "LOCAL_LLM_ENABLED": "true",
            "LOCAL_LLM_API_BASE": "http://127.0.0.1:11434/v1",
            "LOCAL_LLM_MODEL": "private-model",
            "LITELLM_PROXY_ENABLED": "true",
            "LITELLM_PROXY_URL": "http://127.0.0.1:4000/v1",
        }, clear=True):
            route = resolve_route("code-editing")
            self.assertEqual(route.provider, "local-openai-compatible")
            self.assertEqual(route.model, "openai/private-model")

        with patch.dict(os.environ, {
            "LOCAL_LLM_ENABLED": "false",
            "LITELLM_PROXY_ENABLED": "true",
            "LITELLM_PROXY_URL": "http://127.0.0.1:4000/v1",
        }, clear=True):
            route = resolve_route("guideline-generation")
            self.assertEqual(route.provider, "litellm-proxy")
            self.assertEqual(route.model, "twin-guidelines")

        with patch.dict(os.environ, {
            "LOCAL_LLM_ENABLED": "false",
            "LITELLM_PROXY_ENABLED": "false",
            "OPENROUTER_DIRECT_ENABLED": "true",
            "OPENROUTER_API_KEY": "test-key",
        }, clear=True):
            route = resolve_route("validation")
            self.assertEqual(route.provider, "openrouter")
            self.assertEqual(route.model, "openrouter/openrouter/auto")


class FailClosedRoutingTest(unittest.TestCase):
    """A-2: brak jawnej flagi znaczy wyłączone.

    Klucz dostawcy leżący w powłoce operatora nie może sam z siebie otworzyć
    trasy wyjściowej, bo to wysyła historię promptów na zewnątrz wbrew
    deklaracji w `.env.example`.
    """

    def test_empty_environment_refuses_to_route(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(LlmConfigurationError):
                resolve_route("intent-extraction")

    def test_provider_key_alone_does_not_enable_route(self) -> None:
        with patch.dict(os.environ, {"OPENROUTER_API_KEY": "leaked-from-shell-profile"}, clear=True):
            with self.assertRaises(LlmConfigurationError):
                resolve_route("intent-extraction")

    def test_local_endpoint_alone_does_not_enable_route(self) -> None:
        with patch.dict(os.environ, {
            "LOCAL_LLM_API_BASE": "http://127.0.0.1:11434/v1",
            "LOCAL_LLM_MODEL": "private-model",
        }, clear=True):
            with self.assertRaises(LlmConfigurationError):
                resolve_route("intent-extraction")

    def test_flag_parsing_is_strict(self) -> None:
        with patch.dict(os.environ, {"SOME_FLAG": "maybe"}, clear=True):
            with self.assertRaises(LlmConfigurationError):
                flag_enabled("SOME_FLAG")
        for raw, expected in [("1", True), ("true", True), ("ON", True), ("0", False), ("no", False), ("", False)]:
            with patch.dict(os.environ, {"SOME_FLAG": raw}, clear=True):
                self.assertEqual(flag_enabled("SOME_FLAG"), expected, raw)
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(flag_enabled("SOME_FLAG"))


class BindGuardTest(unittest.TestCase):
    """A-3: bind spoza loopbacku wymaga jawnej zgody i tokenu."""

    def test_loopback_is_allowed_without_token(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            for host in ("127.0.0.1", "::1", "localhost"):
                _guard_bind(host)

    def test_remote_bind_requires_opt_in(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(SystemExit):
                _guard_bind("0.0.0.0")

    def test_remote_bind_requires_token(self) -> None:
        with patch.dict(os.environ, {"TWIN_ALLOW_REMOTE": "1"}, clear=True):
            with self.assertRaises(SystemExit):
                _guard_bind("0.0.0.0")

    def test_remote_bind_with_opt_in_and_token(self) -> None:
        with patch.dict(os.environ, {"TWIN_ALLOW_REMOTE": "1", "TWIN_API_TOKEN": "s3cret"}, clear=True):
            _guard_bind("0.0.0.0")


class RawChatContainmentTest(unittest.TestCase):
    """R-005: ogólny chat jest wyłączony bez jawnej, poprawnej flagi."""

    def test_raw_chat_is_disabled_before_provider_call(self) -> None:
        client = TestClient(app)
        with patch.dict(os.environ, {}, clear=True), patch(
            "llm_service.app.complete_chat"
        ) as complete_chat_mock:
            response = client.post(
                "/v1/chat/completions",
                json={"messages": [{"role": "user", "content": "hello"}]},
            )
        self.assertEqual(response.status_code, 404)
        complete_chat_mock.assert_not_called()

    def test_raw_chat_requires_a_valid_explicit_opt_in(self) -> None:
        with patch.dict(os.environ, {"TWIN_ENABLE_RAW_CHAT": "true"}, clear=True):
            require_raw_chat_enabled()
        with patch.dict(os.environ, {"TWIN_ENABLE_RAW_CHAT": "sometimes"}, clear=True):
            with self.assertRaises(HTTPException) as raised:
                require_raw_chat_enabled()
        self.assertEqual(raised.exception.status_code, 503)

    def test_chat_request_rejects_unknown_fields(self) -> None:
        with self.assertRaises(ValidationError):
            ChatRequest.model_validate({
                "messages": [{"role": "user", "content": "hello"}],
                "provider_override": "external",
            })


class AuditPathTest(unittest.TestCase):
    """D-4: ścieżka względna rozwiązuje się względem projektu, nie CWD."""

    def test_relative_path_is_project_rooted(self) -> None:
        import llm_service.audit as audit_module

        root = Path(audit_module.__file__).resolve().parents[1]
        with patch.dict(os.environ, {"TWIN_LLM_AUDIT_PATH": "data/output/llm-audit.jsonl"}, clear=True):
            resolved = audit_module._path()
        self.assertTrue(resolved.is_absolute())
        self.assertEqual(resolved, root / "data" / "output" / "llm-audit.jsonl")


if __name__ == "__main__":
    unittest.main()
