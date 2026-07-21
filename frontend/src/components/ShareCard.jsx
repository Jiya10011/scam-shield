import { forwardRef } from "react";
import { ShieldAlert } from "lucide-react";

// ShareCard — the visual card that gets rendered to an actual PNG for sharing.
// Kept as a plain, self-contained component (no CSS variables) so the
// rendered image looks correct regardless of the app's current light/dark
// theme — a shared warning should always be legible on any device it lands on.

const ShareCard = forwardRef(function ShareCard({ verdict, riskScore, redFlags, explanation }, ref) {
  const isScam = verdict === "SCAM" || verdict === "LIKELY_SCAM";
  const accent = isScam ? "#C4362B" : "#1E8A5F";

  return (
    <div
      ref={ref}
      style={{
        width: 600,
        padding: 40,
        backgroundColor: "#0F1435",
        fontFamily: "Arial, sans-serif",
        color: "#FFFFFF",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#1B2354", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShieldAlert size={22} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Citizen Fraud Shield</div>
          <div style={{ fontSize: 12, color: "#9AA1C9" }}>Fraud Alert</div>
        </div>
      </div>

      <div
        style={{
          display: "inline-block",
          padding: "6px 16px",
          borderRadius: 999,
          backgroundColor: accent,
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: 1,
          marginBottom: 20,
        }}
      >
        {verdict.replace("_", " ")} · RISK {riskScore}/100
      </div>

      <p style={{ fontSize: 16, lineHeight: 1.6, color: "#E8EAF6", marginBottom: 20 }}>{explanation}</p>

      {redFlags?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: "#9AA1C9", marginBottom: 8 }}>
            RED FLAGS
          </div>
          {redFlags.slice(0, 4).map((flag, i) => (
            <div key={i} style={{ fontSize: 14, color: "#E8EAF6", padding: "6px 0", borderTop: i > 0 ? "1px solid #232a52" : "none" }}>
              • {flag}
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: 16, borderRadius: 10, backgroundColor: "#171B3A", fontSize: 14, lineHeight: 1.5, color: "#E8EAF6" }}>
        If you get a call or message like this: hang up, don't share OTPs, and verify independently.
        Real authorities never demand secrecy or payment over a video call.
      </div>

      <div style={{ marginTop: 20, fontSize: 11, color: "#6670A0", textAlign: "center" }}>
        Sent via Citizen Fraud Shield — ET AI Hackathon 2026 prototype
      </div>
    </div>
  );
});

export default ShareCard;
