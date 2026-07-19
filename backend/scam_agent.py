"""
scam_agent.py

Two-layer scam detection agent:
  1. Rule-based pre-filter: fast keyword/pattern matching against known
     digital-arrest-scam red-flag categories. Cheap, explainable, runs first.
  2. Gemini reasoning layer: takes the transcript + the pre-filter's findings
     and produces a structured verdict (risk score, flags, explanation, action).

Why two layers instead of "just ask Gemini"?
  - Faster/cheaper: obviously-safe text can be short-circuited without an API call
  - More explainable: the pre-filter gives you concrete evidence to show judges
  - More robust: Gemini reasons WITH detected signals as context, not from scratch
"""

import os
import re
import json
import google.generativeai as genai
from dataclasses import dataclass, field
from typing import Optional

# ---------------------------------------------------------------------------
# STEP 3.1 — Configure Gemini
# ---------------------------------------------------------------------------
# The API key is read from the environment (never hardcode it).
# In main.py we load .env before this module is used.

GEMINI_MODEL = "gemini-2.0-flash "   # fast + cheap, good for real-time classification


def configure_gemini():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY not set. Copy backend/.env.example to backend/.env "
            "and add your key from https://aistudio.google.com/apikey"
        )
    genai.configure(api_key=api_key)


# ---------------------------------------------------------------------------
# STEP 3.2 — Rule-based pre-filter
# ---------------------------------------------------------------------------
# Each category maps to a set of keyword/phrase patterns. This is intentionally
# simple (regex, not ML) so it's fast and fully explainable in your demo.

RED_FLAG_PATTERNS = {
    "authority_impersonation": [
        r"\bcbi\b", r"\bed\b", r"enforcement directorate", r"\bcustoms\b",
        r"cyber crime", r"cyber cell", r"income tax department", r"\brbi\b",
        r"narcotics control bureau", r"immigration bureau", r"passport office",
        r"trai\b", r"police station", r"army", r"colonel",
    ],
    "urgency_isolation": [
        r"do not disconnect", r"do not hang up", r"stay on (this|the) call",
        r"stay on (this|the) video", r"do not (tell|inform|share).*(family|anyone)",
        r"keep your camera on", r"do not mute", r"confidential investigation",
        r"do not contact (a )?lawyer", r"within \d+ (minutes|hours)",
    ],
    "fabricated_legal_jeopardy": [
        r"arrest warrant", r"non-bailable warrant", r"digital arrest",
        r"fir number", r"money laundering", r"court martial",
        r"criminal (record|matter)", r"deportation",
    ],
    "payment_verification_demand": [
        r"share (the |your )?otp", r"read out the otp", r"verification amount",
        r"transfer.*(amount|verification)", r"processing fee", r"registration fee",
        r"escrow account", r"settlement (process|amount)",
    ],
    "fake_official_trappings": [
        r"official investigation", r"government order", r"video kyc",
        r"official letterhead", r"case number \d+",
    ],
}

COMPILED_PATTERNS = {
    category: [re.compile(p, re.IGNORECASE) for p in patterns]
    for category, patterns in RED_FLAG_PATTERNS.items()
}


def run_prefilter(text: str) -> dict:
    """Returns which red-flag categories matched, and the specific phrases found."""
    detected = {}
    for category, patterns in COMPILED_PATTERNS.items():
        matches = []
        for pattern in patterns:
            found = pattern.findall(text)
            if found:
                matches.append(pattern.pattern)
        if matches:
            detected[category] = matches
    return detected


# ---------------------------------------------------------------------------
# STEP 3.3 — Gemini reasoning layer
# ---------------------------------------------------------------------------

SYSTEM_INSTRUCTIONS = """You are a fraud-detection assistant for a citizen safety app in India.
You will be given:
1. A transcript or message text (a call summary or chat message a citizen received)
2. A list of red-flag categories already detected by a rule-based pre-filter, with matched phrases

Your job is to reason about whether this is a "digital arrest" scam, a related fraud scam,
or a legitimate message. Digital arrest scams impersonate government/law-enforcement authorities
(CBI, ED, Customs, Police, RBI, Income Tax, Narcotics Bureau) and pressure victims to stay on a
video call, keep silent, and transfer money or share OTPs to avoid a fake arrest.

Be careful about false positives: legitimate bank fraud alerts, genuine government helpline
messages, real courier/delivery calls, and normal reminders can superficially mention urgency
or OTPs without being scams. A real bank will tell you they will NEVER ask for your OTP/PIN.
A real government office will not demand you stay on video or forbid you from telling family.

LANGUAGE: The request will include a "target_language" field.
- If it is "auto", detect the language the transcript is written in and respond in that
  same language for the "explanation", "recommended_action", and each entry in "red_flags".
- If it names a specific language (e.g. "Hindi", "Tamil", "Telugu", "Bengali", "Marathi",
  "Kannada"), respond in that language for those same fields regardless of the input language.
- The "verdict" field must ALWAYS remain one of the exact English enum values
  (SCAM / LIKELY_SCAM / LIKELY_SAFE / SAFE) untranslated, since the frontend matches on it.

Respond ONLY with a JSON object, no other text, no markdown fences, in exactly this shape:
{
  "verdict": "SCAM" | "LIKELY_SCAM" | "LIKELY_SAFE" | "SAFE",
  "risk_score": <integer 0-100>,
  "red_flags": [<short strings describing each concrete red flag found>],
  "explanation": "<2-3 sentence plain-language explanation for a citizen>",
  "recommended_action": "<one short actionable sentence>"
}
"""


def build_user_prompt(text: str, prefilter_results: dict, target_language: str = "auto") -> str:
    if prefilter_results:
        signal_lines = []
        for category, matches in prefilter_results.items():
            signal_lines.append(f"- {category.replace('_', ' ')}: matched patterns {matches}")
        signals_block = "\n".join(signal_lines)
    else:
        signals_block = "- No red-flag patterns matched by the pre-filter."

    return f"""TRANSCRIPT/MESSAGE:
\"\"\"{text}\"\"\"

PRE-FILTER DETECTED SIGNALS:
{signals_block}

target_language: {target_language}

Analyze this and respond with the JSON verdict object as instructed."""


@dataclass
class ClassificationResult:
    verdict: str
    risk_score: int
    red_flags: list = field(default_factory=list)
    explanation: str = ""
    recommended_action: str = ""
    prefilter_signals: dict = field(default_factory=dict)


def classify_transcript(text: str, target_language: str = "auto") -> ClassificationResult:
    """Main entry point: runs the pre-filter, then calls Gemini for the final verdict."""
    prefilter_results = run_prefilter(text)

    model = genai.GenerativeModel(
        model_name=GEMINI_MODEL,
        system_instruction=SYSTEM_INSTRUCTIONS,
    )

    prompt = build_user_prompt(text, prefilter_results, target_language)

    response = model.generate_content(
        prompt,
        generation_config={"response_mime_type": "application/json"},
    )

    try:
        parsed = json.loads(response.text)
    except (json.JSONDecodeError, AttributeError) as e:
        # Fallback: if Gemini returns something unexpected, don't crash the API
        parsed = {
            "verdict": "LIKELY_SCAM" if prefilter_results else "LIKELY_SAFE",
            "risk_score": 60 if prefilter_results else 20,
            "red_flags": list(prefilter_results.keys()),
            "explanation": f"Model response could not be parsed ({e}); falling back to pre-filter signal.",
            "recommended_action": "Verify independently before taking any action.",
        }

    return ClassificationResult(
        verdict=parsed.get("verdict", "LIKELY_SAFE"),
        risk_score=int(parsed.get("risk_score", 0)),
        red_flags=parsed.get("red_flags", []),
        explanation=parsed.get("explanation", ""),
        recommended_action=parsed.get("recommended_action", ""),
        prefilter_signals=prefilter_results,
    )
