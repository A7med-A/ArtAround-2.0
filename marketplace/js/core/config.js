// ═══════════════════════════════════════════════════════════════
// CONFIG — costanti globali
// ═══════════════════════════════════════════════════════════════

export const CONFIG = {
  API_BASE_URL: "http://localhost:3000/api",

  STORAGE: {
    TOKEN: "aa_token",
    USER: "aa_user",
    ACTIVE_MUSEUM: "aa_active_museum", // slug del museo correntemente selezionato
    THEME: "aa_theme", // 'dark' | 'light'
    SECTION: "aa_section", // ultima sezione visitata
  },

  // URL relative: si risolvono rispetto alla pagina corrente.
  // Funziona sia se Live Server serve direttamente la cartella marketplace/,
  // sia se serve una cartella padre.
  ROUTES: {
    LANDING: "index.html",
    LOGIN: "login.html",
    APP: "app.html",
  },

  // Sezioni dell'app loggata
  SECTIONS: {
    ITEMS: "items",
    VISITS: "visits",
    MAP: "map",
    USERS: "users", // admin-only
  },
};
