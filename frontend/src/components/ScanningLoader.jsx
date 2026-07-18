// ScanningLoader — a radar-style sweep instead of a generic spinner.
// Reinforces the "actively analyzing signals" narrative during the API call.

export default function ScanningLoader() {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div
        className="relative w-16 h-16 rounded-full border-2 flex items-center justify-center overflow-hidden"
        style={{ borderColor: "var(--color-paper-dim)" }}
      >
        <div
          className="absolute inset-0 radar-sweep"
          style={{
            background: "conic-gradient(from 0deg, transparent 0deg, var(--color-ink-light) 40deg, transparent 90deg)",
          }}
        />
        <div className="absolute inset-[3px] rounded-full" style={{ backgroundColor: "var(--color-surface)" }} />
        <div className="w-2 h-2 rounded-full pulse-dot" style={{ backgroundColor: "var(--color-ink)" }} />
      </div>
      <span className="text-sm font-medium" style={{ color: "var(--color-slate)" }}>
        Scanning for red-flag patterns…
      </span>
    </div>
  );
}
