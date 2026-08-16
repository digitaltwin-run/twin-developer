from __future__ import annotations

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_SPEC = importlib.util.spec_from_file_location(
    "check_forbidden_effects",
    ROOT / "scripts" / "check-forbidden-effects.py",
)
assert _SPEC and _SPEC.loader
_GATE = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(_GATE)
evaluate = _GATE.evaluate
load_catalog = _GATE.load_catalog
load_tickets = _GATE.load_tickets


def _entry(ticket_id: str, status: str, effects: list[str]) -> dict:
    return {"ticketId": ticket_id, "status": status, "forbiddenEffects": effects, "_path": f"project/{ticket_id}/intent.json"}


class ForbiddenEffectsGateTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.catalog = load_catalog(ROOT)

    def test_current_tree_is_named_and_clean(self) -> None:
        problems = evaluate(root=ROOT, paths=[], hook=None)
        self.assertEqual(problems, [])
        tickets = load_tickets(ROOT)
        self.assertGreaterEqual(len(tickets), 3)

    def test_new_raw_history_is_rejected(self) -> None:
        problems = evaluate(
            root=ROOT,
            catalog=self.catalog,
            tickets=[_entry("ticket-001", "done", ["publishing raw prompt history"])],
            paths=["data/raw/new-export.json"],
        )
        self.assertTrue(any("publishing-raw-prompt-history" in item for item in problems), problems)

    def test_existing_raw_corpus_is_not_in_empty_changeset(self) -> None:
        problems = evaluate(
            root=ROOT,
            catalog=self.catalog,
            tickets=[_entry("ticket-001", "done", ["publishing raw prompt history"])],
            paths=[],
        )
        self.assertEqual(problems, [])

    def test_source_change_survives_raw_history_ban(self) -> None:
        problems = evaluate(
            root=ROOT,
            catalog=self.catalog,
            tickets=[_entry("ticket-004", "in_progress", ["publishing raw prompt history"])],
            paths=["src/util/redaction.ts", "scripts/check-forbidden-effects.py"],
        )
        self.assertEqual(problems, [])

    def test_env_example_is_not_a_secret_file(self) -> None:
        problems = evaluate(
            root=ROOT,
            catalog=self.catalog,
            tickets=[_entry("ticket-002", "done", ["production secret mutation"])],
            paths=[".env.example"],
        )
        self.assertEqual(problems, [])

    def test_dotenv_is_rejected(self) -> None:
        problems = evaluate(
            root=ROOT,
            catalog=self.catalog,
            tickets=[_entry("ticket-002", "done", ["production secret mutation"])],
            paths=[".env"],
        )
        self.assertTrue(any("production-secret-mutation" in item for item in problems), problems)

    def test_unknown_effect_fails_closed(self) -> None:
        problems = evaluate(
            root=ROOT,
            catalog=self.catalog,
            tickets=[_entry("ticket-004", "in_progress", ["teleport to production"])],
            paths=[],
        )
        self.assertTrue(any("nieznany efekt" in item for item in problems), problems)

    def test_bare_commit_blocks_only_in_active_hook(self) -> None:
        tickets = [_entry("ticket-004", "in_progress", ["commit"])]
        self.assertEqual(evaluate(root=ROOT, catalog=self.catalog, tickets=tickets, paths=[], hook=None), [])
        hooked = evaluate(root=ROOT, catalog=self.catalog, tickets=tickets, paths=[], hook="pre-commit")
        self.assertTrue(any("commit" in item and "pre-commit" in item for item in hooked), hooked)

    def test_commit_without_gates_does_not_block_the_hook(self) -> None:
        problems = evaluate(
            root=ROOT,
            catalog=self.catalog,
            tickets=[_entry("ticket-004", "in_progress", ["commit bez zielonych bramek make validate i make test"])],
            paths=["src/util/redaction.ts"],
            hook="pre-commit",
        )
        self.assertEqual(problems, [])

    def test_done_ticket_does_not_block_commit_hook(self) -> None:
        problems = evaluate(
            root=ROOT,
            catalog=self.catalog,
            tickets=[_entry("ticket-001", "done", ["commit"])],
            paths=[],
            hook="pre-commit",
        )
        self.assertEqual(problems, [])

    def test_missing_delegate_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            problems = evaluate(
                root=root,
                catalog=self.catalog,
                tickets=[
                    _entry(
                        "ticket-003",
                        "done",
                        ["deklarowanie zgodności z cudzym standardem bez potwierdzenia jego walidatorem"],
                    )
                ],
                paths=[],
            )
        self.assertTrue(any("deleguje" in item for item in problems), problems)


class ForbiddenEffectsCatalogTest(unittest.TestCase):
    def test_every_live_ticket_effect_resolves(self) -> None:
        catalog = json.loads((ROOT / "config" / "forbidden-effects.json").read_text(encoding="utf-8"))
        names = {entry["id"] for entry in catalog["effects"]}
        for entry in catalog["effects"]:
            names.update(entry["aliases"])
        for ticket in load_tickets(ROOT):
            for effect in ticket.get("forbiddenEffects") or []:
                self.assertIn(effect, names, f"{ticket['ticketId']}: {effect}")


if __name__ == "__main__":
    unittest.main()
