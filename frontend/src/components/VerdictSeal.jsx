// VerdictSeal — the app's signature element.
// A circular stamp motif, colored by risk level, that "stamps" into place.
// It deliberately echoes the fake official seals scammers use, but here
// it's the real, trustworthy verdict — a citizen safety tool inverting
// the scammer's own trick.

const VERDICT_STYLES = {
  SCAM: {
    ring: "var(--color-danger)",
    fill: "var(--color-danger-dim)",
    label: "SCAM DETECTED",
    icon: "!",
  },
  LIKELY_SCAM: {
    ring: "var(--color-warn)",
    fill: "var(--color-warn-dim)",
    label: "LIKELY SCAM",
    icon: "?",
  },
  LIKELY_SAFE: {
    ring: "var(--color-slate)",
    fill: "var(--color-paper-dim)",
    label: "LIKELY SAFE",
    icon: "~",
  },
  SAFE: {
    ring: "var(--color-safe)",
    fill: "var(--color-safe-dim)",
    label: "SAFE",
    icon: "\u2713",
  },
};

export default function VerdictSeal({ verdict }) {
  const style = VERDICT_STYLES[verdict] || VERDICT_STYLES.LIKELY_SAFE;

  return (
    <div className="flex items-center gap-3 seal-animate flex-shrink-0">
      <div
        className="relative w-16 h-16 rounded-full flex items-center justify-center border-[3px]"
        style={{ borderColor: style.ring, backgroundColor: style.fill }}
      >
        <div
          className="absolute inset-1 rounded-full border border-dashed opacity-60"
          style={{ borderColor: style.ring }}
        />
        <span className="text-xl font-extrabold" style={{ color: style.ring, fontFamily: "var(--font-display)" }}>
          {style.icon}
        </span>
      </div>
      <span
        className="text-sm font-bold tracking-widest uppercase leading-tight"
        style={{ color: style.ring, fontFamily: "var(--font-display)" }}
      >
        {style.label}
      </span>
    </div>
  );
}
