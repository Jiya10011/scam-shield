// RiskGauge — horizontal 0-100 bar with three semantic zones (safe/warn/danger)
// and a marker pinned at the actual score. Replaces a bare number with
// something a judge can read at a glance.

export default function RiskGauge({ score }) {
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-slate)" }}>
          Risk score
        </span>
        <span className="text-sm font-extrabold" style={{ color: "var(--color-ink)" }}>
          {clamped}/100
        </span>
      </div>
      <div className="relative h-2.5 rounded-full overflow-hidden flex">
        <div className="h-full" style={{ width: "30%", backgroundColor: "var(--color-safe)" }} />
        <div className="h-full" style={{ width: "40%", backgroundColor: "var(--color-warn)" }} />
        <div className="h-full" style={{ width: "30%", backgroundColor: "var(--color-danger)" }} />
        <div
          className="absolute top-1/2 w-1 h-4 -translate-y-1/2 rounded-full bg-white border"
          style={{ left: `calc(${clamped}% - 2px)`, borderColor: "var(--color-ink)" }}
        />
      </div>
    </div>
  );
}
