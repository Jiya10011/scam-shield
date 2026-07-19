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

# A small, balanced subset for the LIVE in-demo evaluation panel. Kept deliberately tiny —
# the free-tier Gemini API key is capped at 20 requests/DAY (not per-minute), shared across
# every /analyze call and every evaluation run. 4 items leaves headroom for live "check a
# message" demos afterward within the same daily budget. Full accuracy testing (50 items)
# should be run separately via evaluate.py, ideally on a day with quota to spare.
DEMO_SUBSET_IDS = [
    "s001", "s013",
    "l001", "l011",
]


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
            wait = 3 * (attempt + 1)
            print(
                f"    ! {item['id']} attempt {attempt + 1}/{max_retries} failed: "
                f"{last_error} -- retrying in {wait}s",
                flush=True,
            )
            # Back off before retrying — likely a transient rate-limit (429) error
            # or the low-CPU host struggling under concurrent load
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
    Defaults to fully sequential (max_workers=1) for the live-demo endpoint — a burst of even
    2-3 concurrent calls was enough to trip Gemini's free-tier rate limit in production.
    Sequential is slower but far more reliable for a live audience-facing demo."""
    dataset = load_dataset()
    if subset_ids:
        id_set = set(subset_ids)
        dataset = [item for item in dataset if item["id"] in id_set]

    total_items = len(dataset)
    print(f"Starting evaluation of {total_items} item(s), max_workers={max_workers}...\n", flush=True)
    start_time = time.time()

    results = []
    if max_workers == 1:
        # Fully sequential, with a small pause between calls — the safest mode for
        # respecting free-tier per-minute rate limits during a live demo.
        for i, item in enumerate(dataset):
            print(f"[{i + 1}/{total_items}]", end=" ", flush=True)
            results.append(_classify_item(item))
            if i < len(dataset) - 1:
                time.sleep(0.8)
    else:
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(_classify_item, item): item for item in dataset}
            for future in as_completed(futures):
                results.append(future.result())

    elapsed = time.time() - start_time
    print(f"\nFinished {total_items} item(s) in {elapsed:.1f}s\n", flush=True)

    # Keep output order stable (matches dataset order) regardless of completion order
    order = {item["id"]: i for i, item in enumerate(dataset)}
    results.sort(key=lambda r: order[r["id"]])

    error_count = sum(1 for r in results if r.get("errored"))
    scored = [r for r in results if not r.get("errored")]  # exclude API errors from accuracy math

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
        "results": results,  # full list, including errored items, so the UI can still show them
    }