import { Languages } from "lucide-react";

export const LANGUAGES = [
  { value: "auto", label: "Auto-detect" },
  { value: "English", label: "English" },
  { value: "Hindi", label: "\u0939\u093f\u0928\u094d\u0926\u0940 (Hindi)" },
  { value: "Tamil", label: "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd (Tamil)" },
  { value: "Telugu", label: "\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41 (Telugu)" },
  { value: "Bengali", label: "\u09ac\u09be\u0982\u09b2\u09be (Bengali)" },
  { value: "Marathi", label: "\u092e\u0930\u093e\u0920\u0940 (Marathi)" },
  { value: "Kannada", label: "\u0c95\u0ca8\u0ccd\u0ca8\u0ca1 (Kannada)" },
];

export default function LanguageSelect({ value, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      <Languages size={13} style={{ color: "var(--color-slate)" }} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs font-medium rounded-full pl-2 pr-6 py-1 outline-none cursor-pointer"
        style={{ backgroundColor: "var(--color-paper-dim)", color: "var(--color-slate)" }}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
