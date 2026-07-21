"""
eval_core.py — Shared evaluation logic.

Used by:
  - evaluate.py (CLI script, runs the FULL 50-item dataset, prints a report)
  - main.py's /evaluate/live endpoint (runs a smaller DEMO subset so it
    finishes quickly enough to watch live during a hackathon demo)
"""

import os
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from scam_agent import classify_transcript

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "transcripts_dataset.json")

SCAM_VERDICTS = {"SCAM", "LIKELY_SCAM"}
SAFE_VERDICTS = {"SAFE", "LIKELY_SAFE"}

# A balanced subset for the LIVE in-demo evaluation panel. Restored to 8 items
# (4 scam, 4 legit) now that we're on Groq's free tier (30 requests/minute,
# 1,000/day on llama-3.3-70b-versatile) rather than Gemini's old 5/minute cap —
# 8 items gives a stronger live-demo number than the 4-item set we were forced
# down to under the tighter Gemini limit. Full accuracy testing (50 items)
# should still be run separately via evaluate.py.
DEMO_SUBSET_IDS = [
    "s001", "s006", "s013", "s021",
    "l001", "l006", "l011", "l018",
]

# Groq's free tier allows 30 requests/minute — i.e. one every 2 seconds is
# sustainable. Paced a bit more conservatively than the theoretical minimum
# so a run doesn't ride right up against the limit if Groq's own request
# timing has any jitter.
SECONDS_BETWEEN_CALLS = 2.5
# Retry backoff for genuine transient errors — Groq's per-minute window is
# short enough that a few seconds of backoff is enough to land in a fresh
# window, unlike Gemini's old 5/minute cap which needed ~15s+ backoffs.
RETRY_BACKOFF_SECONDS = 5


def load_dataset():
    with open(DATA_PATH) as f:
        return json.load(f)


def _classify_item(item, max_retries=3):
    # Progress line so a long sequential run isn't silent — evaluate.py only prints
    # its summary after run_evaluation() returns, so without this you see nothing
    # on screen for the full duration of a 50-item run.
    print(f"  Testing {item['id']}...", flush=True)

    last_error = None
    for attempt in range(max_retries):
        try:
            result = classify_transcript(item["text"])
            predicted_scam = result.verdict in SCAM_VERDICTS
            actual_scam = item["label"] == "scam"
            status = "correct" if predicted_scam == actual_scam else "WRONG"
            print(
                f"    -> {item['id']}: predicted {result.verdict} "
                f"(actual: {item['label']}) [{status}]",
                flush=True,
            )
            return {
                "id": item["id"],
                "actual": item["label"],
                "predicted_verdict": result.verdict,
                "risk_score": result.risk_score,
                "correct": predicted_scam == actual_scam,
                "errored": False,
            }
        except Exception as e:
            last_error = str(e)
            wait = RETRY_BACKOFF_SECONDS * (attempt + 1)
            print(
                f"    ! {item['id']} attempt {attempt + 1}/{max_retries} failed: "
                f"{last_error} -- retrying in {wait}s",
                flush=True,
            )
            time.sleep(wait)

    # All retries exhausted — mark as a genuine API error, NOT a wrong classification.
    # This is deliberately excluded from accuracy/FP/FN math below, since counting
    # a rate-limit failure as a "wrong answer" would misrepresent model accuracy.
    print(f"    x {item['id']} gave up after {max_retries} attempts: {last_error}", flush=True)
    return {
        "id": item["id"],
        "actual": item["label"],
        "predicted_verdict": "ERROR",
        "risk_score": 0,
        "correct": False,
        "errored": True,
        "error": last_error,
    }


def run_evaluation(subset_ids=None, max_workers=1):
    """Runs classification over the dataset (or a subset) and returns metrics + per-item results.
    Sequential with light pacing (SECONDS_BETWEEN_CALLS) — Groq's 30/minute free-tier
    limit is generous enough that this finishes quickly without needing concurrency."""
    dataset = load_dataset()
    if subset_ids:
        id_set = set(subset_ids)
        dataset = [item for item in dataset if item["id"] in id_set]

    total_items = len(dataset)
    est_seconds = total_items * SECONDS_BETWEEN_CALLS
    print(
        f"Starting evaluation of {total_items} item(s), max_workers={max_workers}, "
        f"~{SECONDS_BETWEEN_CALLS}s between calls (est. {est_seconds:.0f}s minimum)...\n",
        flush=True,
    )
    start_time = time.time()

    results = []
    if max_workers == 1:
        for i, item in enumerate(dataset):
            print(f"[{i + 1}/{total_items}]", end=" ", flush=True)
            results.append(_classify_item(item))
            if i < len(dataset) - 1:
                time.sleep(SECONDS_BETWEEN_CALLS)
    else:
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(_classify_item, item): item for item in dataset}
            for future in as_completed(futures):
                results.append(future.result())

    elapsed = time.time() - start_time
    print(f"\nFinished {total_items} item(s) in {elapsed:.1f}s\n", flush=True)

    order = {item["id"]: i for i, item in enumerate(dataset)}
    results.sort(key=lambda r: order[r["id"]])

    error_count = sum(1 for r in results if r.get("errored"))
    scored = [r for r in results if not r.get("errored")]

    total = len(scored)
    correct = sum(r["correct"] for r in scored)
    false_positives = [r for r in scored if r["actual"] == "legit" and r["predicted_verdict"] in SCAM_VERDICTS]
    false_negatives = [r for r in scored if r["actual"] == "scam" and r["predicted_verdict"] in SAFE_VERDICTS]
    legit_total = sum(1 for r in scored if r["actual"] == "legit")
    scam_total = sum(1 for r in scored if r["actual"] == "scam")

    return {
        "total": total,
        "correct": correct,
        "error_count": error_count,
        "accuracy_pct": round(correct / total * 100, 1) if total else 0,
        "false_positive_count": len(false_positives),
        "false_positive_rate_pct": round(len(false_positives) / legit_total * 100, 1) if legit_total else 0,
        "false_negative_count": len(false_negatives),
        "false_negative_rate_pct": round(len(false_negatives) / scam_total * 100, 1) if scam_total else 0,
        "results": results,
    }
