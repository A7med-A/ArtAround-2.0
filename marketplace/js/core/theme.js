// ═══════════════════════════════════════════════════════════════
// THEME — gestione dark/light, applicato come classe su <html>
// ═══════════════════════════════════════════════════════════════

import { CONFIG } from "./config.js";

const THEME_CHANGE_EVENT = "aa:theme-change";

export const theme = {
  /** Restituisce il tema corrente: 'dark' | 'light' */
  current() {
    const saved = localStorage.getItem(CONFIG.STORAGE.THEME);
    return saved === "light" ? "light" : "dark";
  },

  /** Applica il tema al documento e lo salva */
  apply(name) {
    const value = name === "light" ? "light" : "dark";
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(value);
    localStorage.setItem(CONFIG.STORAGE.THEME, value);
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: value }));
  },

  /** Inverte il tema corrente */
  toggle() {
    this.apply(this.current() === "dark" ? "light" : "dark");
  },

  /** Inizializza il tema all'avvio app (da chiamare in main.js / auth-page.js) */
  init() {
    this.apply(this.current());
  },

  /** Sottoscrive a cambi di tema; ritorna unsubscribe */
  onChange(handler) {
    const fn = (e) => handler(e.detail);
    window.addEventListener(THEME_CHANGE_EVENT, fn);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, fn);
  },
};
