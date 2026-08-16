from __future__ import annotations

from fastapi import FastAPI, HTTPException

from .core import LlmConfigurationError, LlmResponseError, complete_chat, complete_guidelines, complete_intents, health
from .models import ChatRequest, GuidelinesRequest, IntentRequest

app = FastAPI(title="Subactor Developer Twin LLM", version="0.1.0")


@app.get("/healthz")
def healthz() -> dict:
    return health()


@app.post("/v1/intents/extract")
def extract_intents(request: IntentRequest) -> dict:
    try:
        return complete_intents(request.model_dump())
    except (LlmConfigurationError, LlmResponseError) as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.post("/v1/guidelines/generate")
def generate_guidelines(request: GuidelinesRequest) -> dict:
    try:
        return complete_guidelines(request.model_dump())
    except (LlmConfigurationError, LlmResponseError) as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.post("/v1/chat/completions")
def chat_completions(request: ChatRequest) -> dict:
    try:
        return complete_chat(
            [message.model_dump() for message in request.messages],
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )
    except (LlmConfigurationError, LlmResponseError) as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
