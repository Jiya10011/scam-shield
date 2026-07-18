"""
main.py — FastAPI backend for the Citizen Fraud Shield / Scam Session Classifier.

Endpoints:
  POST /analyze  -> classify a transcript/message, returns structured verdict
  GET  /stats    -> aggregate demo stats (for the authority dashboard)
  POST /report   -> mock "submit to NCRB" endpoint (logs it, returns a fake ref ID)
  GET  /health   -> simple health check for deployment verification
"""

import os
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
# During local dev this allows everything; TIGHTEN this to your actual
# Vercel domain before final deployment (see Step 6 notes below).
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: replace with ["https://your-app.vercel.app"] before submission
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

    result: ClassificationResult = classify_transcript(payload.text, payload.target_language)

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
def evaluate_live():
    """
    Runs the classifier against a balanced 16-item demo subset of the dataset
    LIVE, in front of whoever is watching. Proves the accuracy/false-positive
    numbers in the deck instead of just asserting them.
    """
    report_data = run_evaluation(subset_ids=DEMO_SUBSET_IDS)
    return report_data
