# sg16_safety.py
# Python 3.10+
from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Tuple


class AgeTier(str, Enum):
    KID = "6-11"
    TEEN = "12-17"
    ADULT = "18+"


class Action(str, Enum):
    ALLOW = "ALLOW"
    SAFE_COMPLETE = "SAFE_COMPLETE"  # allow but steer/soften; remove details; give general safe guidance
    REFUSE = "REFUSE"                # refuse and offer safe alternatives
    CRISIS = "CRISIS"                # self-harm imminent: supportive + urge trusted adult + emergency


@dataclass
class SafetyResult:
    action: Action
    flags: List[str]
    redacted_text: str | None = None


# ----------------------------
# Patterns (tune for your locale/languages)
# ----------------------------

# Personal data patterns (very imperfect; keep conservative)
RE_EMAIL = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I)
RE_PHONE = re.compile(
    r"(?:(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{4})"
)
RE_ADDRESS_HINT = re.compile(
    r"\b(address|street|st\.|road|rd\.|lane|ln\.|avenue|ave\.|zip|postal)\b", re.I
)
RE_PASSWORD_HINT = re.compile(r"\b(password|passcode|otp|2fa|verification code)\b", re.I)

# Self-harm / suicide
RE_SELF_HARM_CRISIS = re.compile(
    r"\b(i want to die|kill myself|suicide|end my life|i'm going to kill myself|i will kill myself|hurt myself tonight)\b",
    re.I,
)
RE_SELF_HARM_GENERAL = re.compile(
    r"\b(self harm|cut myself|cutting|overdose|harm myself|want to disappear|not want to live)\b",
    re.I,
)

# Sexual content (broad; add locale terms as needed)
RE_SEXUAL_EXPLICIT = re.compile(
    r"\b(porn|xxx|blowjob|handjob|anal sex|cum|ejaculate|masturbat(e|ion)|dildo|vibrator|fetish)\b",
    re.I,
)
RE_SEXUAL_GENERAL = re.compile(
    r"\b(sex|sexual|nude|naked|hookup|kink|intercourse)\b",
    re.I,
)

# Minor/age cues
RE_MINOR_CUE = re.compile(
    r"\b(i am (?:\d{1,2})\b|i'm (?:\d{1,2})\b|years old|middle school|grade (?:[1-9]|10|11|12))\b",
    re.I,
)
RE_UNDER18_NUM = re.compile(r"\b(1[0-7]|[1-9])\b")  # very rough; used only in a narrow context

# Violence / weapons / wrongdoing (keep high-level)
RE_WEAPON_MAKING = re.compile(
    r"\b(make (a )?(gun|bomb|pipe bomb|molotov)|build (a )?(gun|bomb)|homemade bomb|weapon blueprint)\b",
    re.I,
)
RE_ILLEGAL_EVASION = re.compile(
    r"\b(how to hack|bypass|evade police|steal|shoplift|counterfeit|credit card fraud)\b",
    re.I,
)
RE_GRAPHIC_VIOLENCE = re.compile(r"\b(gore|dismember|behead)\b", re.I)

# Hate/harassment (minimal; expand as needed)
RE_HATE = re.compile(r"\b(kill all|exterminate)\b", re.I)

# Grooming / meetups
RE_MEETUP = re.compile(
    r"\b(meet (me|up)|come over|my place|your place|send pics|snapchat|instagram dm)\b",
    re.I,
)

# Profanity (optional light check; do not over-block)
RE_PROFANITY = re.compile(r"\b(fuck|shit|bitch)\b", re.I)


# ----------------------------
# Core classifier
# ----------------------------


def redact_pii(text: str) -> Tuple[str, List[str]]:
    flags: List[str] = []
    redacted = text

    if RE_EMAIL.search(redacted):
        flags.append("PII_EMAIL")
        redacted = RE_EMAIL.sub("[redacted email]", redacted)

    # Phone regex can false-positive on math; keep it cautious:
    if RE_PHONE.search(redacted) and any(
        k in redacted.lower() for k in ["call", "phone", "number", "whatsapp", "text me"]
    ):
        flags.append("PII_PHONE")
        redacted = RE_PHONE.sub("[redacted phone]", redacted)

    if RE_PASSWORD_HINT.search(redacted):
        flags.append("PII_PASSWORD_HINT")

    if RE_ADDRESS_HINT.search(redacted):
        flags.append("PII_ADDRESS_HINT")

    return redacted, flags


def classify(age_tier: AgeTier, text: str) -> SafetyResult:
    text = text or ""
    flags: List[str] = []
    redacted, pii_flags = redact_pii(text)
    flags.extend(pii_flags)

    t = redacted

    # Crisis detection (highest priority)
    if RE_SELF_HARM_CRISIS.search(t):
        flags.append("SELF_HARM_CRISIS")
        return SafetyResult(action=Action.CRISIS, flags=flags, redacted_text=redacted)

    if RE_SELF_HARM_GENERAL.search(t):
        flags.append("SELF_HARM")
        # Not always imminent, but still high-risk: steer to supportive resources
        return SafetyResult(action=Action.SAFE_COMPLETE, flags=flags, redacted_text=redacted)

    # Sexual content handling
    if RE_SEXUAL_EXPLICIT.search(t):
        flags.append("SEXUAL_EXPLICIT")
        # For minors: refuse. For adults: depends on product policy; default refuse explicit.
        return SafetyResult(action=Action.REFUSE, flags=flags, redacted_text=redacted)

    if RE_SEXUAL_GENERAL.search(t):
        flags.append("SEXUAL")
        if age_tier in (AgeTier.KID, AgeTier.TEEN):
            # Teen may get educational, non-graphic content only.
            return SafetyResult(action=Action.SAFE_COMPLETE, flags=flags, redacted_text=redacted)
        return SafetyResult(action=Action.SAFE_COMPLETE, flags=flags, redacted_text=redacted)

    # Weapons / illegal
    if RE_WEAPON_MAKING.search(t):
        flags.append("WEAPON_MAKING")
        return SafetyResult(action=Action.REFUSE, flags=flags, redacted_text=redacted)

    if RE_ILLEGAL_EVASION.search(t):
        flags.append("ILLEGAL_WRONGDOING")
        return SafetyResult(action=Action.REFUSE, flags=flags, redacted_text=redacted)

    if RE_GRAPHIC_VIOLENCE.search(t):
        flags.append("GRAPHIC_VIOLENCE")
        # For kids/teens steer away; for adults maybe still refuse graphic.
        return SafetyResult(action=Action.SAFE_COMPLETE, flags=flags, redacted_text=redacted)

    # Grooming/meetups: refuse for kids/teens; steer for adults.
    if RE_MEETUP.search(t):
        flags.append("MEETUP_OR_OFFPLATFORM")
        if age_tier in (AgeTier.KID, AgeTier.TEEN):
            return SafetyResult(action=Action.REFUSE, flags=flags, redacted_text=redacted)
        return SafetyResult(action=Action.SAFE_COMPLETE, flags=flags, redacted_text=redacted)

    # Hate/harassment
    if RE_HATE.search(t):
        flags.append("HATE_OR_VIOLENCE")
        return SafetyResult(action=Action.REFUSE, flags=flags, redacted_text=redacted)

    # Profanity: for kids, steer/soften
    if RE_PROFANITY.search(t):
        flags.append("PROFANITY")
        if age_tier == AgeTier.KID:
            return SafetyResult(action=Action.SAFE_COMPLETE, flags=flags, redacted_text=redacted)

    # PII flags: steer user to remove
    if any(f.startswith("PII_") for f in flags):
        # Let conversation continue but tell them to avoid sharing personal info.
        return SafetyResult(action=Action.SAFE_COMPLETE, flags=flags, redacted_text=redacted)

    return SafetyResult(action=Action.ALLOW, flags=flags, redacted_text=redacted)


# ----------------------------
# Response templates (server-side)
# ----------------------------


def refusal_message(age_tier: AgeTier, flags: List[str]) -> str:
    # Keep generic; do not echo user content.
    if "WEAPON_MAKING" in flags or "ILLEGAL_WRONGDOING" in flags:
        return (
            "I can't help with that. I can help with safe and legal ideas instead. "
            "What are you trying to achieve (for example, a science project or safety info)?"
        )
    if "SEXUAL_EXPLICIT" in flags:
        return (
            "I can't help with that. If you have a health or safety question, "
            "you can ask it in a general way."
        )
    if "MEETUP_OR_OFFPLATFORM" in flags:
        if age_tier in (AgeTier.KID, AgeTier.TEEN):
            return (
                "I can't help with meeting up or messaging privately. "
                "Please talk to a trusted grown-up if you need help."
            )
        return (
            "I can't help with moving chats off this app. "
            "If you want, tell me what you're trying to do and I'll give safe tips."
        )
    if "HATE_OR_VIOLENCE" in flags:
        return (
            "I can't help with hateful or harmful requests. "
            "I can help with respectful communication or conflict-solving instead."
        )
    return "I can't help with that, but I can help with something safe. What would you like to do?"


def crisis_message(age_tier: AgeTier) -> str:
    # Keep it region-agnostic; you can localize by country.
    if age_tier == AgeTier.KID:
        return (
            "I'm really sorry you're feeling this way. You deserve help right now.\n"
            "Please tell a trusted grown-up immediately (parent, guardian, teacher, or another safe adult).\n"
            "If you are in danger or might hurt yourself, call your local emergency number right now."
        )
    return (
        "I'm really sorry you're going through this. You don't have to handle it alone.\n"
        "Please reach out to someone you trust right now. If you feel in immediate danger, call your local emergency number.\n"
        "If you can, consider contacting a local crisis hotline in your country."
    )


# ----------------------------
# Example policy router (pre + post)
# ----------------------------


def apply_safety_pipeline(
    age_tier: AgeTier, user_text: str, model_reply: str | None = None
) -> Dict:
    """
    Example usage:
      pre = classify(age_tier, user_text)
      if pre.action == REFUSE: return refusal_message
      if pre.action == CRISIS: return crisis_message
      else: call model on pre.redacted_text
      then post-filter classify(age_tier, model_reply)
    """
    pre = classify(age_tier, user_text)

    if pre.action == Action.CRISIS:
        return {"action": pre.action.value, "flags": pre.flags, "reply": crisis_message(age_tier)}

    if pre.action == Action.REFUSE:
        return {
            "action": pre.action.value,
            "flags": pre.flags,
            "reply": refusal_message(age_tier, pre.flags),
        }

    # SAFE_COMPLETE means "allowed but steer" — you enforce this by:
    #  - using a stricter system prompt
    #  - adding a "steering prefix" in your developer prompt
    #  - limiting detail / providing general safe guidance only
    result: Dict = {
        "action": pre.action.value,
        "flags": pre.flags,
        "sanitized_user_text": pre.redacted_text,
    }

    if model_reply is not None:
        post = classify(age_tier, model_reply)
        # If model output is unsafe, override it.
        if post.action in (Action.REFUSE, Action.CRISIS):
            result.update(
                {
                    "post_action": post.action.value,
                    "post_flags": post.flags,
                    "reply": (
                        refusal_message(age_tier, post.flags)
                        if post.action == Action.REFUSE
                        else crisis_message(age_tier)
                    ),
                }
            )
        else:
            result.update(
                {
                    "post_action": post.action.value,
                    "post_flags": post.flags,
                    "reply": model_reply,
                }
            )

    return result
