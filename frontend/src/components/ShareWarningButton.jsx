import { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function ShareWarningButton({ verdictLabel, explanation }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const message = `⚠️ Fraud Alert — Citizen Fraud Shield\n\nVerdict: ${verdictLabel}\n\n${explanation}\n\nIf someone you know gets a call like this, tell them: hang up, don't share OTPs, and verify independently. Real authorities never demand secrecy or video-call payments.`;

    try {
      if (navigator.share) {
        await navigator.share({ text: message });
      } else {
        await navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // user cancelled share sheet — no-op
    }
  }

  return (
    <button
      onClick={handleShare}
      className="w-full rounded-xl py-2.5 font-bold flex items-center justify-center gap-2 border-2"
      style={{ borderColor: "var(--color-ink)", color: "var(--color-ink)" }}
    >
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? "Copied — send it to family" : "Warn a family member"}
    </button>
  );
}
