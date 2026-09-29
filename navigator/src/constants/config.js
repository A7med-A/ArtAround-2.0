// ═══════════════════════════════════════════════════════════════
// CONFIG — costanti globali dell'app Navigator
// ═══════════════════════════════════════════════════════════════

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/** Chiavi di localStorage/sessionStorage. Prefisso dedicato al Navigator. */
export const STORAGE_KEYS = {
  TOKEN: "aanav_token",
  USER: "aanav_user",
  THEME: "aanav_theme",
  TOUR: "aanav_tour",
  PREFS: "aanav_prefs",
  // Sessione guidata a cui lo studente è collegato: ricaricare la pagina o
  // bloccare lo schermo non deve costringerlo a rientrare in classe.
  LIVE: "aanav_live",
};

/** Rotte dell'app (React Router). */
export const ROUTES = {
  SPLASH: "/",
  LOGIN: "/accedi",
  MUSEUMS: "/musei",
  museum: (slug) => `/musei/${slug}`,
  visits: (slug) => `/musei/${slug}/visite`,
  tour: (slug) => `/musei/${slug}/visita`,
  artworks: (slug) => `/musei/${slug}/opere`,
  artwork: (slug, id) => `/musei/${slug}/opere/${id}`,
  map: (slug) => `/musei/${slug}/mappa`,

  // Visita guidata da un docente
  JOIN: "/partecipa",
  live: (code) => `/sessione/${code}`,
  sessions: (slug) => `/musei/${slug}/sessioni`,
  console: (slug, code) => `/musei/${slug}/sessioni/${code}`,
};

/** Etichette degli stati di una sessione guidata (server/models/Session.js). */
export const SESSION_STATUS_LABELS = {
  attesa: "In attesa",
  "in-corso": "In corso",
  quiz: "Quiz",
  conclusa: "Conclusa",
};

/** Preferenze di default del visitatore. */
export const DEFAULT_PREFS = {
  tone: "medio",
  duration: "medio",
  rate: 1,
};

/** Velocità di riproduzione selezionabili per l'audioguida. */
export const SPEECH_RATES = [0.75, 1, 1.25, 1.5];

/** Lingua usata per sintesi e riconoscimento vocale. */
export const SPEECH_LANG = "it-IT";
