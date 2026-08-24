"""SG16 Children World — system prompts by tier."""

from pathlib import Path

_PROMPTS_DIR = Path(__file__).parent


def _read(name: str) -> str:
    path = _PROMPTS_DIR / name
    return path.read_text(encoding="utf-8").strip()


def global_prompt() -> str:
    return _read("global.txt")


def tier_prompt(age_tier: str) -> str:
    mapping = {
        "6-11": "tier_6_11.txt",
        "12-17": "tier_12_17.txt",
        "18+": "tier_18_plus.txt",
    }
    filename = mapping.get(age_tier)
    if not filename:
        raise ValueError(f"Unknown age tier: {age_tier}")
    return _read(filename)


def full_system_prompt(age_tier: str) -> str:
    """Global rules first, then tier-specific prompt."""
    return f"{global_prompt()}\n\n{tier_prompt(age_tier)}"
