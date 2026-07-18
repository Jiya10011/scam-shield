import { useState } from "react";
import { ChevronDown, Zap } from "lucide-react";

const CATEGORY_LABELS = {
  authority_impersonation: "Authority impersonation",
  urgency_isolation: "Urgency / isolation instruction",
  fabricated_legal_jeopardy: "Fabricated legal jeopardy",
  payment_verification_demand: "Payment / verification demand",
  fake_official_trappings: "Fake official trappings",
};

export default function ExplainabilityPanel({ prefilterSignals }) {
  const [open, setOpen] = useState(false);
  const categories = Object.keys(prefilterSignals || {});

  return (
    <div className="rounded-lg border" style={{ borderColor: "var(--color-paper-dim)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
      >
        <Zap size={14} style={{ color: "var(--color-ink)" }} />
        <span className="text-xs font-bold uppercase tracking-wide flex-1" style={{ color: "var(--color-ink)" }}>
          How this was detected
        </span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-paper-dim)", color: "var(--color-slate)" }}>
          {categories.length} signal{categories.length === 1 ? "" : "s"}
        </span>
        <ChevronDown
          size={14}
          style={{ color: "var(--color-slate)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
        />
      </button>

      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-slate)" }}>
            A rule-based pre-filter scans for known scam-pattern categories first. Its findings are
            passed as context into the Gemini reasoning layer, which makes the final call.
          </p>
          {categories.length === 0 ? (
            <p className="text-xs italic" style={{ color: "var(--color-slate)" }}>
              No rule-based patterns matched — verdict is based on Gemini's contextual reasoning alone.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {categories.map((cat) => (
                <li key={cat} className="text-xs rounded-md px-2.5 py-1.5" style={{ backgroundColor: "var(--color-paper-dim)", color: "var(--color-ink)" }}>
                  <span className="font-semibold">{CATEGORY_LABELS[cat] || cat}</span>
                  <span style={{ color: "var(--color-slate)" }}> — pre-filter match, escalated to reasoning layer</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
