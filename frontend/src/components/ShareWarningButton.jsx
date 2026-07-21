import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Share2, Check, Download } from "lucide-react";
import ShareCard from "./ShareCard";

export default function ShareWarningButton({ verdict, riskScore, redFlags, explanation }) {
  const cardRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | rendering | shared | downloaded | failed

  async function handleShare() {
    if (!cardRef.current) return;
    setStatus("rendering");
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "fraud-warning.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Fraud Alert — Citizen Fraud Shield",
          text: "Heads up — this looks like a scam. Please read before you respond to anything like this.",
        });
        setStatus("shared");
      } else {
        // Desktop / unsupported share target — fall back to a direct download
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "fraud-warning.png";
        link.click();
        setStatus("downloaded");
      }
    } catch {
      setStatus("failed");
    } finally {
      setTimeout(() => setStatus("idle"), 2500);
    }
  }

  const label = {
    idle: (
      <>
        <Share2 size={16} />
        Warn a family member
      </>
    ),
    rendering: "Preparing image…",
    shared: (
      <>
        <Check size={16} />
        Sent
      </>
    ),
    downloaded: (
      <>
        <Download size={16} />
        Image downloaded — send it to family
      </>
    ),
    failed: "Couldn't generate image — try again",
  }[status];

  return (
    <>
      {/* Rendered off-screen at fixed size purely so html-to-image has a clean DOM node to capture */}
      <div style={{ position: "fixed", top: -9999, left: -9999, pointerEvents: "none" }}>
        <ShareCard ref={cardRef} verdict={verdict} riskScore={riskScore} redFlags={redFlags} explanation={explanation} />
      </div>

      <button
        onClick={handleShare}
        disabled={status === "rendering"}
        className="w-full rounded-xl py-2.5 font-bold flex items-center justify-center gap-2 border-2 disabled:opacity-60"
        style={{ borderColor: "var(--color-ink)", color: "var(--color-ink)" }}
      >
        {label}
      </button>
    </>
  );
}
