import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("scam-shield-theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("scam-shield-theme", theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      aria-label="Toggle dark mode"
      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
      style={{ backgroundColor: "var(--color-paper-dim)" }}
    >
      {theme === "dark" ? (
        <Sun size={15} style={{ color: "var(--color-ink)" }} />
      ) : (
        <Moon size={15} style={{ color: "var(--color-ink)" }} />
      )}
    </button>
  );
}
