import { useState } from "react";
import { Shield, ArrowRight } from "lucide-react";
import VerdictSeal from "./VerdictSeal";
import RiskGauge from "./RiskGauge";
import ScanningLoader from "./ScanningLoader";
import RedFlagChip from "./RedFlagChip";
import IntelFeed from "./IntelFeed";
import ExplainabilityPanel from "./ExplainabilityPanel";
import LanguageSelect from "./LanguageSelect";
import ShareWarningButton from "./ShareWarningButton";
import LiveEvalPanel from "./LiveEvalPanel";
import ThemeToggle from "./ThemeToggle";
import { analyzeText, submitReport } from "../api";

const EXAMPLES = [
  "This is CBI Delhi, your Aadhaar is linked to a case. Stay on video, do not disconnect or tell your family.",
  "Hi, this is your bank's fraud team, we noticed a card transaction you may not recognize. If it wasn't you, block the card in the app.",
];

export default function ShieldScreen({ onBack }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [reportStatus, setReportStatus] = useState(null);
  const [feedKey, setFeedKey] = useState(0);
  const [language, setLanguage] = useState("auto");

  async function handleAnalyze() {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setReportStatus(null);
    try {
      const data = await analyzeText(input, language);
      setResult(data);
      setFeedKey((k) => k + 1);
    } catch (e) {
      setError(e.message || "Could not reach the analysis backend. Confirm it's running on port 8000.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReport() {
    if (!result) return;
    try {
      const res = await submitReport(result.session_id);
      setReportStatus(res.reference_id);
    } catch {
      setReportStatus("failed");
    }
  }

  const isScamVerdict = result && (result.verdict === "SCAM" || result.verdict === "LIKELY_SCAM");

  return (
    <div className="min-h-screen">
      <header className="border-b" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "var(--color-brand)" }}
          >
            <Shield size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-base font-extrabold leading-tight" style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
              Citizen Fraud Shield
            </h1>
            <p className="text-xs" style={{ color: "var(--color-slate)" }}>
              Digital arrest &amp; scam detection console
            </p>
          </div>
          <button
            onClick={onBack}
            className="text-xs font-semibold px-2 py-1 rounded-md transition-colors"
            style={{ color: "var(--color-slate)" }}
          >
            ← Home
          </button>
          <span
            className="hidden sm:inline text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: "var(--color-paper-dim)", color: "var(--color-slate)" }}
          >
            ET AI Hackathon 2026 &middot; Prototype
          </span>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
        <section className="flex flex-col gap-4">
          <div className="rounded-2xl shadow-sm border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: "var(--color-slate)" }}>
              Paste a message or call summary
            </label>
            <textarea
              className="w-full min-h-[120px] resize-none text-[15px] leading-relaxed outline-none placeholder:text-slate-400"
              placeholder={'e.g. "This is CBI Delhi, your Aadhaar is linked to a case..."'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ color: "var(--color-ink)" }}
            />
            <div className="flex items-center justify-between gap-2 mt-3 mb-1 flex-wrap">
              <div className="flex items-center gap-2">
                {EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(ex)}
                    className="text-xs px-2.5 py-1 rounded-full transition-colors"
                    style={{ backgroundColor: "var(--color-paper-dim)", color: "var(--color-slate)" }}
                  >
                    Try example {i + 1}
                  </button>
                ))}
              </div>
              <LanguageSelect value={language} onChange={setLanguage} />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading || !input.trim()}
              className="w-full mt-3 rounded-xl py-3 font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ backgroundColor: "var(--color-brand)", fontFamily: "var(--font-display)" }}
            >
              {loading ? "Analyzing…" : "Check this message"}
              {!loading && <ArrowRight size={16} />}
            </button>
            {error && (
              <p className="text-sm text-center mt-3" style={{ color: "var(--color-danger)" }}>
                {error}
              </p>
            )}
          </div>

          {loading && (
            <div className="rounded-2xl shadow-sm border" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <ScanningLoader />
            </div>
          )}

          {result && !loading && (
            <div className="rounded-2xl shadow-sm border p-5 flex flex-col gap-4 card-enter" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <VerdictSeal verdict={result.verdict} />
                <div className="flex-1 min-w-[160px]">
                  <RiskGauge score={result.risk_score} />
                </div>
              </div>

              <p className="text-sm leading-relaxed" style={{ color: "var(--color-ink)" }}>
                {result.explanation}
              </p>

              {result.red_flags?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-slate)" }}>
                    Red flags detected
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {result.red_flags.map((flag, i) => (
                      <RedFlagChip key={i} text={flag} />
                    ))}
                  </ul>
                </div>
              )}

              <div
                className="rounded-lg px-3 py-2.5 text-sm font-medium"
                style={{ backgroundColor: "var(--color-paper-dim)", color: "var(--color-ink)" }}
              >
                Recommended action: {result.recommended_action}
              </div>

              <ExplainabilityPanel prefilterSignals={result.prefilter_signals} />

              <div className="flex flex-col gap-2">
                {isScamVerdict && (
                  <button
                    onClick={handleReport}
                    disabled={!!reportStatus}
                    className="w-full rounded-xl py-2.5 font-bold text-white disabled:opacity-60"
                    style={{ backgroundColor: "var(--color-danger)", fontFamily: "var(--font-display)" }}
                  >
                    {reportStatus
                      ? reportStatus === "failed"
                        ? "Report failed — try again"
                        : `Reported · Ref ${reportStatus}`
                      : "Report this"}
                  </button>
                )}
                <ShareWarningButton verdictLabel={result.verdict.replace("_", " ")} explanation={result.explanation} />
              </div>
            </div>
          )}

          <LiveEvalPanel />
        </section>

        <IntelFeed refreshKey={feedKey} />
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-center text-xs" style={{ color: "var(--color-slate)" }}>
        Hackathon prototype. Report reference numbers are simulated and not linked to NCRB.
      </footer>
    </div>
  );
}
