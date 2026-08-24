"""SG16 Children World — FastAPI server."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from chat import handle_chat

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
ASSETS = ROOT / "assets"

app = FastAPI(title="SG16 Children World", version="0.1.0")

if ASSETS.is_dir():
    app.mount("/assets", StaticFiles(directory=ASSETS), name="assets")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    sessionId: str = Field(default="")
    ageTier: str
    nickname: str = Field(default="")
    message: str
    history: List[Dict[str, str]] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    safe: bool
    flags: list[str] = Field(default_factory=list)
    action: Optional[str] = None


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok", "service": "sg16-children-world"}


@app.get("/")
async def index() -> FileResponse:
    if not INDEX.exists():
        raise HTTPException(status_code=404, detail="index.html not found")
    return FileResponse(INDEX)


@app.post("/api/sg16/chat", response_model=ChatResponse)
async def chat(body: ChatRequest) -> Dict[str, Any]:
    try:
        return await handle_chat(
            age_tier=body.ageTier,
            message=body.message,
            nickname=body.nickname,
            session_id=body.sessionId,
            history=body.history,
        )
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err
    except Exception as err:
        raise HTTPException(status_code=500, detail="Chat failed") from err
