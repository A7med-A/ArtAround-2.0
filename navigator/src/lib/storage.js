// ═══════════════════════════════════════════════════════════════
// STORAGE — accesso a localStorage tollerante agli errori
// (Safari in navigazione privata può lanciare su ogni scrittura).
// ═══════════════════════════════════════════════════════════════

export function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* silenzioso: la sessione resta valida solo in memoria */
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* no-op */
  }
}
