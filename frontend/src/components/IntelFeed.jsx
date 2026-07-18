import { useEffect, useState } from "react";
import { ShieldAlert, Activity, TrendingUp } from "lucide-react";
import { fetchStats } from "../api";

const VERDICT_COLOR = {
  SCAM: "var(--color-danger)",
  LIKELY_SCAM: "var(--color-warn)",
  LIKELY_SAFE: "var(--color-slate)",
  SAFE: "var(--color-safe)",
};

function timeAgo(iso) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function IntelFeed({ refreshKey }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchStats()
      .then((data) => !cancelled && setStats(data))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <aside className="w-full flex flex-col gap-4">
      <div className="rounded-2xl border shadow-sm p-4" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} style={{ color: "var(--color-ink)" }} />
          <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--color-ink)", fontFamily: "var(--font-display)" }}>
            Live intel
          </h2>
          <span className="ml-auto flex items-center gap-1 text-[11px] font-bold" style={{ color: "var(--color-safe)" }}>
            <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ backgroundColor: "var(--color-safe)" }} />
            ACTIVE
          </span>
        </div>

        {error && (
          <p className="text-xs" style={{ color: "var(--color-slate)" }}>
            Stats unavailable — check backend connection.
          </p>
        )}

        {stats && (
          <div className="grid grid-cols-3 gap-2">
            <StatCell label="Analyzed" value={stats.total_analyzed} />
            <StatCell label="Flagged" value={stats.scam_flagged} />
            <StatCell label="Scam rate" value={`${stats.scam_rate_pct}%`} />
          </div>
        )}
      </div>

      <div className="rounded-2xl border shadow-sm p-4 flex-1" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert size={16} style={{ color: "var(--color-ink)" }} />
          <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--color-ink)", fontFamily: "var(--font-display)" }}>
            Recent sessions
          </h2>
        </div>

        {!stats || stats.recent_sessions?.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--color-slate)" }}>
            No sessions analyzed yet. Run a check to populate this feed.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {stats.recent_sessions.map((s) => (
              <li
                key={s.session_id}
                className="flex items-center justify-between gap-2 text-xs rounded-lg px-2.5 py-2"
                style={{ backgroundColor: "var(--color-paper-dim)" }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: VERDICT_COLOR[s.verdict] || "var(--color-slate)" }}
                  />
                  <span className="truncate" style={{ color: "var(--color-ink)" }}>
                    {s.text_preview}
                  </span>
                </div>
                <span className="flex-shrink-0 font-medium" style={{ color: "var(--color-slate)" }}>
                  {timeAgo(s.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--color-brand)" }}>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={16} className="text-white" />
          <span className="text-xs font-bold uppercase tracking-wide text-white">Built to scale</span>
        </div>
        <p className="text-xs text-white/70 leading-relaxed">
          This same detection engine can plug into telecom carriers, bank fraud desks, and NCRB
          intake — one model, multiple entry points.
        </p>
      </div>
    </aside>
  );
}

function StatCell({ label, value }) {
  return (
    <div className="rounded-lg px-2 py-2 text-center" style={{ backgroundColor: "var(--color-paper-dim)" }}>
      <p className="text-base font-extrabold" style={{ color: "var(--color-ink)" }}>
        {value}
      </p>
      <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--color-slate)" }}>
        {label}
      </p>
    </div>
  );
}
