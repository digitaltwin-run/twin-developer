from __future__ import annotations

import hmac
import os

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse

from .core import (
    LlmConfigurationError,
    LlmResponseError,
    complete_chat,
    complete_guidelines,
    complete_intents,
    health,
)
from .models import ChatRequest, GuidelinesRequest, IntentRequest

app = FastAPI(title="Subactor Developer Twin LLM", version="0.1.0")


def require_token(x_twin_token: str | None = Header(default=None)) -> None:
    """Wymaga tokenu, gdy ``TWIN_API_TOKEN`` jest ustawiony.

    Bind spoza loopbacku wymusza ustawienie tokenu już na starcie
    (``llm_service.cli``), więc zdalnie wystawiona usługa nigdy nie jest otwarta.
    Na loopbacku bez tokenu zachowanie pozostaje takie jak w README.
    """
    expected = os.environ.get("TWIN_API_TOKEN", "").strip()
    if not expected:
        return
    if not x_twin_token or not hmac.compare_digest(x_twin_token, expected):
        raise HTTPException(status_code=401, detail="Invalid or missing X-Twin-Token.")


@app.get("/healthz")
def healthz() -> dict:
    return health()


@app.post("/v1/intents/extract", dependencies=[Depends(require_token)])
def extract_intents(request: IntentRequest) -> JSONResponse:
    try:
        result, provenance = complete_intents(request.model_dump())
    except (LlmConfigurationError, LlmResponseError) as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return JSONResponse(content=result, headers=provenance.headers())


@app.post("/v1/guidelines/generate", dependencies=[Depends(require_token)])
def generate_guidelines(request: GuidelinesRequest) -> JSONResponse:
    try:
        result, provenance = complete_guidelines(request.model_dump())
    except (LlmConfigurationError, LlmResponseError) as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return JSONResponse(content=result, headers=provenance.headers())


@app.post("/v1/chat/completions", dependencies=[Depends(require_token)])
def chat_completions(request: ChatRequest) -> JSONResponse:
    try:
        result, provenance = complete_chat(
            [message.model_dump() for message in request.messages],
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )
    except (LlmConfigurationError, LlmResponseError) as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return JSONResponse(content=result, headers=provenance.headers())
