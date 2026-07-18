import { useState } from "react";
import LandingPage from "./components/LandingPage";
import ShieldScreen from "./components/ShieldScreen";

export default function App() {
  const [view, setView] = useState("landing"); // "landing" | "console"

  if (view === "landing") {
    return <LandingPage onLaunch={() => setView("console")} />;
  }
  return <ShieldScreen onBack={() => setView("landing")} />;
}
