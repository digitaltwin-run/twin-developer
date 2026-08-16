from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path

from llm_service.core import complete_chat, complete_guidelines, complete_intents, health, resolve_route


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
        intents = complete_intents({"evidence": [{"id": "evidence:1"}, {"id": "evidence:2"}]})
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
        result = complete_guidelines({"deterministicBaseline": baseline})
        self.assertTrue(result["summary"].startswith("LLM-reviewed"))
        self.assertTrue(Path(os.environ["TWIN_LLM_AUDIT_PATH"]).exists())

    def test_fake_chat_and_health(self) -> None:
        result = complete_chat([{"role": "user", "content": "hello"}])
        self.assertIn("FAKE: hello", result["choices"][0]["message"]["content"])
        self.assertTrue(health()["configured"])

    def test_route_priority_and_registry_aliases(self) -> None:
        from unittest.mock import patch

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


if __name__ == "__main__":
    unittest.main()
