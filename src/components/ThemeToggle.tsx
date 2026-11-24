"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

const THEME_KEY = "clarity_pmos_theme_v1";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      const isDark = saved === "dark";
      document.documentElement.classList.toggle("dark", isDark);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDark(isDark);
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      // ignore storage errors
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={dark}
      title={dark ? "Light mode" : "Dark mode"}
      className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#D5CEC2] dark:border-[#2E3631] bg-white/80 dark:bg-[#1A1F1C] text-[#1C1F1D] dark:text-[#ECEAE4] hover:border-[#2F5D50] dark:hover:border-[#66B89F] transition cursor-pointer"
    >
      {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
    </button>
  );
}