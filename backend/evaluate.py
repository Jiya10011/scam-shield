"""
evaluate.py — CLI script: runs the classifier against the FULL 50-item
dataset and prints an accuracy / false-positive / false-negative report.

Run from the backend/ directory (with your venv activated):
    python evaluate.py

Requires GEMINI_API_KEY set in backend/.env (makes 50 real API calls).
"""

from dotenv import load_dotenv
load_dotenv()

from scam_agent import configure_gemini
from eval_core import run_evaluation

configure_gemini()


def main():
    print("Running evaluation against the full 50-item dataset...\n")
    report = run_evaluation()  # no subset = full dataset

    print("=" * 50)
    print(f"Accuracy: {report['correct']}/{report['total']} = {report['accuracy_pct']}%")
    print(f"False Positive Rate: {report['false_positive_count']} = {report['false_positive_rate_pct']}%")
    print(f"False Negative Rate: {report['false_negative_count']} = {report['false_negative_rate_pct']}%")
    print("=" * 50)

    wrong = [r for r in report["results"] if not r["correct"]]
    if wrong:
        print("\nMisclassified items — review these for your deck:")
        for r in wrong:
            print(f"  - {r['id']} (actual: {r['actual']}): predicted {r['predicted_verdict']} (risk {r['risk_score']})")

    out_path = "evaluation_results.json"
    with open(out_path, "w") as f:
        import json
        json.dump(report, f, indent=2)
    print(f"\nFull results saved to {out_path}")


if __name__ == "__main__":
    main()
