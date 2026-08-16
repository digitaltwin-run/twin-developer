from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class EventInput(StrictModel):
    id: str
    sequence: int
    sourceClass: str
    text: str


class EvidenceInput(StrictModel):
    id: str
    excerpt: str
    sourceClass: str
    topicHints: list[str] = Field(default_factory=list)


class IntentRequest(StrictModel):
    schemaVersion: Literal["subactor.developer-twin.intent-request/v1"]
    events: list[EventInput]
    evidence: list[EvidenceInput]
    existingRuleIds: list[str]


class GuidelinesRequest(StrictModel):
    schemaVersion: Literal["subactor.developer-twin.guidelines-request/v1"]
    task: str
    twin: dict[str, Any]
    deterministicBaseline: dict[str, Any]
    allowedCommands: list[str]


class ChatMessage(StrictModel):
    role: Literal["system", "user", "assistant"]
    content: str


class ChatRequest(StrictModel):
    model: str | None = None
    messages: list[ChatMessage]
    temperature: float = 0.0
    max_tokens: int | None = None
