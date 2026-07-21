import { Shield, ArrowRight, MessageSquareWarning, ScanSearch, ShieldCheck, Languages, PlayCircle, Share2, Zap } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const FEATURES = [
  {
    icon: Zap,
    title: "Hybrid detection pipeline",
    desc: "A rule-based pre-filter flags known scam-pattern categories first, then a Groq (Llama 3.3 70B) reasoning layer makes the final, explainable call.",
  },
  {
    icon: Languages,
    title: "Regional language coverage",
    desc: "Get verdicts and advisories in English, Hindi, Tamil, Telugu, Bengali, Marathi, or Kannada — not just English.",
  },
  {
    icon: PlayCircle,
    title: "Provable accuracy, live",
    desc: "Run the classifier against known scam/legit patterns on demand and watch the accuracy numbers generate in real time.",
  },
  {
    icon: Share2,
    title: "Anti-isolation by design",
    desc: "Scams work by cutting victims off from family. One tap generates a forwardable warning to break that isolation.",
  },
];

const STEPS = [
  { icon: MessageSquareWarning, title: "Paste the message", desc: "A call summary, a suspicious text, or a screenshot transcript." },
  { icon: ScanSearch, title: "Hybrid AI analyzes it", desc: "Pattern signals + contextual reasoning combine into one verdict." },
  { icon: ShieldCheck, title: "Get a clear verdict", desc: "Risk score, red flags, and a plain-language recommended action." },
];

export default function LandingPage({ onLaunch }) {
  return (
    <div className="min-h-screen">
      <header className="border-b" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--color-brand)" }}>
            <Shield size={18} className="text-white" />
          </div>
          <span className="text-base font-extrabold" style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
            Citizen Fraud Shield
          </span>
          <div className="flex-1" />
          <ThemeToggle />
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center card-enter">
        <span
          className="inline-block text-[11px] font-bold px-3 py-1 rounded-full mb-5"
          style={{ backgroundColor: "var(--color-danger-dim)", color: "var(--color-danger)" }}
        >
          ₹1,776 CRORE LOST TO DIGITAL ARREST SCAMS · JAN–SEP 2024
        </span>
        <h1
          className="text-3xl sm:text-5xl font-extrabold leading-tight mb-4"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
        >
          Detection before the money moves.
        </h1>
        <p className="text-base sm:text-lg leading-relaxed mb-8" style={{ color: "var(--color-slate)" }}>
          Digital arrest scams work because victims are caught alone, mid-call, with no way to check if
          it's real. Paste what you heard or read — get a verdict, in seconds, before you act.
        </p>
        <button
          onClick={onLaunch}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-bold text-white transition-transform hover:scale-[1.02]"
          style={{ backgroundColor: "var(--color-brand)", fontFamily: "var(--font-display)" }}
        >
          Check a message now
          <ArrowRight size={18} />
        </button>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="text-center text-xs font-bold uppercase tracking-widest mb-8" style={{ color: "var(--color-slate)" }}>
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 border card-enter"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", animationDelay: `${i * 0.08}s` }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: "var(--color-paper-dim)" }}
              >
                <step.icon size={18} style={{ color: "var(--color-ink)" }} />
              </div>
              <h3 className="text-sm font-bold mb-1" style={{ color: "var(--color-ink)", fontFamily: "var(--font-display)" }}>
                {i + 1}. {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-slate)" }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="text-center text-xs font-bold uppercase tracking-widest mb-8" style={{ color: "var(--color-slate)" }}>
          Built for real deployment, not just a demo
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 border flex gap-4 card-enter"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", animationDelay: `${i * 0.06}s` }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "var(--color-paper-dim)" }}
              >
                <f.icon size={18} style={{ color: "var(--color-ink)" }} />
              </div>
              <div>
                <h3 className="text-sm font-bold mb-1" style={{ color: "var(--color-ink)", fontFamily: "var(--font-display)" }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-slate)" }}>
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-14 text-center">
        <p className="text-sm mb-4" style={{ color: "var(--color-slate)" }}>
          Real authorities never demand secrecy, video calls, or instant payment.
        </p>
        <button
          onClick={onLaunch}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-bold text-white transition-transform hover:scale-[1.02]"
          style={{ backgroundColor: "var(--color-brand)", fontFamily: "var(--font-display)" }}
        >
          Open the console
          <ArrowRight size={18} />
        </button>
      </section>

      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center text-xs" style={{ color: "var(--color-slate)" }}>
        ET AI Hackathon 2026 · Prototype · Report reference numbers are simulated and not linked to NCRB.
      </footer>
    </div>
  );
}
