"""
main.py — FastAPI backend for the Citizen Fraud Shield / Scam Session Classifier.

Endpoints:
  POST /analyze  -> classify a transcript/message, returns structured verdict
  GET  /stats    -> aggregate demo stats (for the authority dashboard)
  POST /report   -> mock "submit to NCRB" endpoint (logs it, returns a fake ref ID)
  GET  /health   -> simple health check for deployment verification
  POST /evaluate/live -> runs the demo-subset evaluation (cached after first
                          successful run, so repeat clicks don't burn quota)
"""

import os
import json
import uuid
import random
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env BEFORE importing scam_agent,
# since scam_agent.configure_gemini() reads GEMINI_API_KEY at call time.
load_dotenv()

from scam_agent import classify_transcript, configure_gemini, ClassificationResult
from eval_core import run_evaluation, DEMO_SUBSET_IDS

app = FastAPI(title="Citizen Fraud Shield API", version="0.1.0")

# ---------------------------------------------------------------------------
# CORS — allow your Vercel frontend to call this API.
#
# NOTE: allow_origins=["*"] combined with allow_credentials=True is invalid
# per the CORS spec — browsers silently block the response client-side even
# though the backend returns 200, which shows up in the frontend as a bare
# "NetworkError when attempting to fetch resource" with nothing useful in
# the backend logs. Listing explicit origins (below) is required once
# allow_credentials=True is set.
#
# Update ALLOWED_ORIGINS if your Vercel URL changes, or add a preview-deploy
# domain here if you test from one.
# ---------------------------------------------------------------------------
ALLOWED_ORIGINS = [
    "https://scam-shield-rust.vercel.app",
    "http://localhost:5173",  # local frontend dev — remove if you want to lock this down for submission
    "http://localhost:3000",  # in case the frontend dev server uses this port instead
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini once at startup
configure_gemini()

# ---------------------------------------------------------------------------
# In-memory store for demo purposes (no DB needed for a prototype).
# Resets on server restart — that's fine for a hackathon demo.
# ---------------------------------------------------------------------------
SESSION_LOG = []

# ---------------------------------------------------------------------------
# Cache for the live-evaluation demo panel. DEMO_SUBSET_IDS is a fixed set of
# 4 items, so there's no reason to re-spend API quota every time someone
# clicks "Re-run" — especially on a free-tier key with a daily cap shared
# across every /analyze call too. Run once successfully, cache to disk,
# serve from cache after that. Delete demo_eval_cache.json locally if you
# genuinely want to force a fresh run (e.g. after fixing a bug in scam_agent).
# ---------------------------------------------------------------------------
EVAL_CACHE_PATH = os.path.join(os.path.dirname(__file__), "demo_eval_cache.json")


class AnalyzeRequest(BaseModel):
    text: str
    target_language: str = "auto"


class AnalyzeResponse(BaseModel):
    session_id: str
    verdict: str
    risk_score: int
    red_flags: list
    explanation: str
    recommended_action: str
    prefilter_signals: dict
    timestamp: str


class ReportRequest(BaseModel):
    session_id: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest):
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="text field cannot be empty")

    # Wrapped so a Gemini-side failure (quota, transient outage, etc.) returns
    # a clean 503 with a real message instead of an unhandled 500 — which
    # browsers report as a CORS error even when CORS itself is fine, since
    # FastAPI's default 500 response skips normal middleware header handling.
    try:
        result: ClassificationResult = classify_transcript(payload.text, payload.target_language)
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Classification temporarily unavailable: {str(e)}",
        )

    session_id = str(uuid.uuid4())[:8]
    entry = {
        "session_id": session_id,
        "text_preview": payload.text[:80],
        "verdict": result.verdict,
        "risk_score": result.risk_score,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    SESSION_LOG.append(entry)

    return AnalyzeResponse(
        session_id=session_id,
        verdict=result.verdict,
        risk_score=result.risk_score,
        red_flags=result.red_flags,
        explanation=result.explanation,
        recommended_action=result.recommended_action,
        prefilter_signals=result.prefilter_signals,
        timestamp=entry["timestamp"],
    )


@app.get("/stats")
def stats():
    total = len(SESSION_LOG)
    scam_like = sum(1 for s in SESSION_LOG if s["verdict"] in ("SCAM", "LIKELY_SCAM"))
    avg_risk = round(sum(s["risk_score"] for s in SESSION_LOG) / total, 1) if total else 0
    return {
        "total_analyzed": total,
        "scam_flagged": scam_like,
        "scam_rate_pct": round((scam_like / total) * 100, 1) if total else 0,
        "avg_risk_score": avg_risk,
        "recent_sessions": SESSION_LOG[-10:][::-1],
    }


@app.post("/report")
def report(payload: ReportRequest):
    matching = [s for s in SESSION_LOG if s["session_id"] == payload.session_id]
    if not matching:
        raise HTTPException(status_code=404, detail="session_id not found")

    # Mock NCRB-style reference ID — no real integration in the prototype.
    ref_id = f"NCRB-MOCK-{random.randint(100000, 999999)}"
    return {
        "status": "submitted",
        "reference_id": ref_id,
        "message": "This is a simulated NCRB report submission for demo purposes.",
    }


@app.post("/evaluate/live")
def evaluate_live(force_refresh: bool = False):
    """
    Runs the classifier against a balanced 4-item demo subset of the dataset
    LIVE, in front of whoever is watching. Proves the accuracy/false-positive
    numbers in the deck instead of just asserting them.

    Cached to disk after the first successful run (no items errored) so
    repeat clicks — including during judging — don't spend extra quota.
    Pass ?force_refresh=true to bypass the cache and re-run for real.
    """
    if not force_refresh and os.path.exists(EVAL_CACHE_PATH):
        with open(EVAL_CACHE_PATH) as f:
            cached = json.load(f)
        cached["_cached"] = True
        return cached

    report_data = run_evaluation(subset_ids=DEMO_SUBSET_IDS)

    # Only cache a clean run — if items errored (e.g. quota exhausted mid-run),
    # caching that would freeze a broken result as the permanent demo state.
    if report_data.get("error_count", 0) == 0:
        with open(EVAL_CACHE_PATH, "w") as f:
            json.dump(report_data, f)

    report_data["_cached"] = False
    return report_data
