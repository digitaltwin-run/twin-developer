from __future__ import annotations

import unittest

from llm_service.redaction import fixtures, redact, redact_payload


class RedactionHomeTest(unittest.TestCase):
    """A-4/A-6: Python czyta te same fixture'y co TypeScript."""

    def test_must_redact_loses_secrets(self) -> None:
        for sample in fixtures().get("mustRedact", []):
            output = redact(sample)
            self.assertNotEqual(output, sample, sample[:70])
            self.assertIn("REDACTED", output, sample[:70])

    def test_must_survive_is_untouched(self) -> None:
        for sample in fixtures().get("mustSurvive", []):
            self.assertEqual(redact(sample), sample, sample[:70])

    def test_payload_walks_nested_strings(self) -> None:
        payload = {
            "messages": [{"role": "user", "content": "token ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"}],
            "meta": ["sha256:43ba3b3905045e158dff0af1e35474db44551448a6b9621130926302e5c749ed"],
        }
        safe = redact_payload(payload)
        self.assertIn("[REDACTED_GITHUB_TOKEN]", safe["messages"][0]["content"])
        self.assertEqual(safe["meta"][0], payload["meta"][0])


if __name__ == "__main__":
    unittest.main()
