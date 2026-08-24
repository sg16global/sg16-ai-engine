"""SG16 Children World — chat handler with safety pipeline + Mistral/Ollama."""

from __future__ import annotations

import os
from typing import Any, Dict, List

import httpx

from prompts import full_system_prompt
from sg16_safety import (
    Action,
    AgeTier,
    apply_safety_pipeline,
    classify,
    crisis_message,
    refusal_message,
)

SAFE_COMPLETE_STEER = (
    "Give only general safe guidance. No explicit details. Encourage trusted adult."
)

OLLAMA_URL = (
    os.environ.get("OLLAMA_URL") or os.environ.get("SG16_OLLAMA_URL") or "http://127.0.0.1:11434"
).rstrip("/")
OLLAMA_MODEL = (
    os.environ.get("SG16_OLLAMA_MODEL")
    or os.environ.get("SG16_AI_MODEL_TEXT")
    or "mistral:7b-instruct"
).strip()
CHAT_TIMEOUT_S = float(os.environ.get("SG16_CHILDREN_CHAT_TIMEOUT_S", "90"))
MAX_HISTORY_MESSAGES = 12


def normalize_history(history: List[Any] | None) -> List[Dict[str, str]]:
    if not history:
        return []
    out: List[Dict[str, str]] = []
    for item in history:
        if not isinstance(item, dict):
            continue
        role = item.get("role")
        if role not in ("user", "assistant"):
            continue
        content = str(item.get("content") or "").strip()[:2000]
        if not content:
            continue
        out.append({"role": role, "content": content})
    return out[-MAX_HISTORY_MESSAGES:]


def build_model_messages(
    *,
    system_prompt: str,
    history: List[Any] | None,
    user_payload: str,
) -> List[Dict[str, str]]:
    return [
        {"role": "system", "content": system_prompt},
        *normalize_history(history),
        {"role": "user", "content": user_payload},
    ]


def tier_from_str(age_tier: str) -> AgeTier:
    mapping = {
        "6-11": AgeTier.KID,
        "12-17": AgeTier.TEEN,
        "18+": AgeTier.ADULT,
    }
    tier = mapping.get(age_tier)
    if tier is None:
        raise ValueError(f"Unknown age tier: {age_tier}")
    return tier


def build_system_prompt(age_tier: str, *, steer_safe: bool) -> str:
    system = full_system_prompt(age_tier)
    if steer_safe:
        system += f"\n\nINTERNAL STEERING:\n{SAFE_COMPLETE_STEER}"
    return system


def build_user_message(message: str, nickname: str = "") -> str:
    nick = (nickname or "").strip()
    if nick:
        return f"[Nickname: {nick}]\n{message}"
    return message


async def call_mistral(
    system_prompt: str,
    user_message: str,
    *,
    history: List[Any] | None = None,
) -> str:
    url = f"{OLLAMA_URL}/v1/chat/completions"
    payload = {
        "model": OLLAMA_MODEL,
        "messages": build_model_messages(
            system_prompt=system_prompt,
            history=history,
            user_payload=user_message,
        ),
        "temperature": 0.6,
        "max_tokens": 1024,
    }
    headers = {"Content-Type": "application/json", "Authorization": "Bearer ollama"}

    async with httpx.AsyncClient(timeout=CHAT_TIMEOUT_S) as client:
        res = await client.post(url, json=payload, headers=headers)
        res.raise_for_status()
        data = res.json()

    content = (data.get("choices") or [{}])[0].get("message", {}).get("content", "")
    content = str(content).strip()
    if not content:
        raise RuntimeError("Mistral/Ollama returned an empty response")
    return content


def offline_fallback(message: str) -> str:
    t = message.lower()
    if any(k in t for k in ("sad", "angry", "scared")):
        return (
            "I'm sorry you feel that way. Try three small steps: take slow breaths, "
            "tell a trusted grown-up, and do something gentle like drawing. What happened?"
        )
    if "7" in t and "8" in t:
        return "7 × 8 = 56. A trick: 7×4=28, then double it to get 56."
    if "story" in t:
        return (
            "Once there was a brave bunny named Pip. Pip helped a lost bird find its nest. "
            "The bird said thank you. Pip smiled. The end."
        )
    if "science" in t:
        return "Science fact: Honey bees can talk by doing a waggle dance to show where flowers are."
    return "I can help with homework, stories, or feelings. What would you like to do?"


async def handle_chat(
    *,
    age_tier: str,
    message: str,
    nickname: str = "",
    session_id: str = "",
    history: List[Any] | None = None,
) -> Dict[str, Any]:
    """Minimal flow: pre-filter → Mistral → post-filter."""
    _ = session_id  # reserved for future session logging (privacy-controlled)

    if not message or not message.strip():
        raise ValueError("message is required")

    tier = tier_from_str(age_tier)
    user_text = message.strip()

    pre = classify(tier, user_text)

    if pre.action == Action.CRISIS:
        return {
            "reply": crisis_message(tier),
            "safe": False,
            "flags": pre.flags,
            "action": pre.action.value,
        }

    if pre.action == Action.REFUSE:
        return {
            "reply": refusal_message(tier, pre.flags),
            "safe": False,
            "flags": pre.flags,
            "action": pre.action.value,
        }

    sanitized = pre.redacted_text or user_text
    system_prompt = build_system_prompt(
        age_tier,
        steer_safe=pre.action == Action.SAFE_COMPLETE,
    )
    user_payload = build_user_message(sanitized, nickname)

    try:
        model_reply = await call_mistral(system_prompt, user_payload, history=history)
    except Exception:
        model_reply = offline_fallback(sanitized)

    pipeline = apply_safety_pipeline(tier, user_text, model_reply)
    flags: List[str] = list(dict.fromkeys([*pre.flags, *pipeline.get("post_flags", [])]))
    post_action = pipeline.get("post_action", pipeline.get("action", pre.action.value))
    reply = pipeline.get("reply", model_reply)

    return {
        "reply": reply,
        "safe": post_action in (Action.ALLOW.value, Action.SAFE_COMPLETE.value),
        "flags": flags,
        "action": post_action,
    }
