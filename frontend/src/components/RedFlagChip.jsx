import { Landmark, AlarmClock, Gavel, CreditCard, FileWarning, AlertTriangle } from "lucide-react";

// Maps loosely on keywords the model tends to use when naming a flag,
// so chips get a relevant icon even though the LLM output is free text.
function pickIcon(flagText) {
  const t = flagText.toLowerCase();
  if (t.includes("authority") || t.includes("cbi") || t.includes("police") || t.includes("official")) return Landmark;
  if (t.includes("urgen") || t.includes("time") || t.includes("isolat") || t.includes("stay on")) return AlarmClock;
  if (t.includes("legal") || t.includes("arrest") || t.includes("warrant") || t.includes("court")) return Gavel;
  if (t.includes("payment") || t.includes("otp") || t.includes("transfer") || t.includes("fee")) return CreditCard;
  if (t.includes("fake") || t.includes("impersonat") || t.includes("document")) return FileWarning;
  return AlertTriangle;
}

export default function RedFlagChip({ text }) {
  const Icon = pickIcon(text);
  return (
    <li
      className="flex items-center gap-2 text-sm rounded-lg px-3 py-1.5"
      style={{ backgroundColor: "var(--color-paper-dim)", color: "var(--color-ink)" }}
    >
      <Icon size={14} style={{ color: "var(--color-danger)", flexShrink: 0 }} />
      <span>{text}</span>
    </li>
  );
}
