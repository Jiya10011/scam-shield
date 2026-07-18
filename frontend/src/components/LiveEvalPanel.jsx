import { useState } from "react";
import { PlayCircle, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { runLiveEvaluation } from "../api";

export default function LiveEvalPanel() {
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  async function handleRun() {
    setRunning(true);
    setError(null);
    setReport(null);
    try {
      const data = await runLiveEvaluation();
      setReport(data);
    } catch (e) {
      setError(
        e.message === "Failed to fetch" || e.message?.includes("NetworkError")
          ? "Connection to backend was lost mid-evaluation. Check the [BACKEND] terminal for a Python error, or try again."
          : e.message || "Evaluation failed to run."
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-2xl shadow-sm border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <div>
          <h2 className="text-sm font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
            Live evaluation
          </h2>
          <p className="text-xs" style={{ color: "var(--color-slate)" }}>
            Runs the classifier against 16 known scam/legit patterns right now — no cherry-picking.
          </p>
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl text-white disabled:opacity-50 flex-shrink-0"
          style={{ backgroundColor: "var(--color-brand)", fontFamily: "var(--font-display)" }}
        >
          <PlayCircle size={16} />
          {running ? "Running…" : "Run live evaluation"}
        </button>
      </div>

      {running && (
        <p className="text-xs mt-3" style={{ color: "var(--color-slate)" }}>
          Classifying 16 transcripts against the model in real time — this takes ~20–30 seconds.
        </p>
      )}

      {error && (
        <p className="text-sm mt-3" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}

      {report && !running && (
        <div className="mt-4">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <MetricCell label="Accuracy" value={`${report.accuracy_pct}%`} tone="safe" />
            <MetricCell label="False positive rate" value={`${report.false_positive_rate_pct}%`} tone="warn" />
            <MetricCell label="False negative rate" value={`${report.false_negative_rate_pct}%`} tone="warn" />
          </div>

          {report.error_count > 0 && (
            <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: "var(--color-slate)" }}>
              <AlertCircle size={13} />
              {report.error_count} item{report.error_count === 1 ? "" : "s"} hit an API error (likely rate-limited)
              and were excluded from the metrics above — shown in amber below.
            </p>
          )}

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            {report.results.map((r) => (
              <div
                key={r.id}
                title={
                  r.errored
                    ? `${r.id} · API error, excluded from metrics`
                    : `${r.id} · actual: ${r.actual} · predicted: ${r.predicted_verdict} · risk ${r.risk_score}`
                }
                className="flex flex-col items-center gap-0.5 rounded-lg py-2"
                style={{ backgroundColor: "var(--color-paper-dim)" }}
              >
                {r.errored ? (
                  <AlertCircle size={16} style={{ color: "var(--color-warn)" }} />
                ) : r.correct ? (
                  <CheckCircle2 size={16} style={{ color: "var(--color-safe)" }} />
                ) : (
                  <XCircle size={16} style={{ color: "var(--color-danger)" }} />
                )}
                <span className="text-[9px] font-mono" style={{ color: "var(--color-slate)" }}>
                  {r.id}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCell({ label, value, tone }) {
  const color = tone === "safe" ? "var(--color-safe)" : "var(--color-warn)";
  return (
    <div className="rounded-lg px-2 py-2.5 text-center" style={{ backgroundColor: "var(--color-paper-dim)" }}>
      <p className="text-lg font-extrabold" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--color-slate)" }}>
        {label}
      </p>
    </div>
  );
}
