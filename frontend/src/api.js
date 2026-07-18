// Reads the backend URL from an env var so it's easy to point at
// localhost during development and your deployed Render URL in production.
// Set VITE_API_URL in a .env file (frontend/.env) or in Vercel's
// environment variable settings.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function analyzeText(text, targetLanguage = "auto") {
  const res = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, target_language: targetLanguage }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function runLiveEvaluation() {
  const res = await fetch(`${API_URL}/evaluate/live`, { method: "POST" });
  if (!res.ok) throw new Error("Live evaluation failed");
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_URL}/stats`);
  if (!res.ok) throw new Error("Could not load stats");
  return res.json();
}

export async function submitReport(sessionId) {
  const res = await fetch(`${API_URL}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!res.ok) throw new Error("Could not submit report");
  return res.json();
}
