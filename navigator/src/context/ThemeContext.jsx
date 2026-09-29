// ═══════════════════════════════════════════════════════════════
// THEME — tema chiaro/scuro persistito.
// Il tema scuro è il default: in museo la luce è bassa e uno schermo
// chiaro disturba gli altri visitatori.
// ═══════════════════════════════════════════════════════════════

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/constants/config";

const ThemeContext = createContext(null);

function readInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    /* storage non disponibile */
  }
  return "dark";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {
      /* no-op */
    }
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme deve essere usato dentro <ThemeProvider>");
  return ctx;
}
