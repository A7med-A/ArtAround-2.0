// ═══════════════════════════════════════════════════════════════
// SCHEMA — enum allineati 1:1 ai modelli Mongoose del server.
// Unica fonte di verità per il front-end del Navigator.
// Modificare qui SOLO se cambiano i modelli in server/models/.
// ═══════════════════════════════════════════════════════════════

// ── Item.texts.tone ──────────────────────────────────────────────
// Nel Navigator il "tono" è il livello di approfondimento scelto dal
// visitatore: dal più divulgativo al più specialistico.
export const TONES = ["infantile", "semplice", "medio", "avanzato"];

export const TONE_LABELS = {
  infantile: "Bambini",
  semplice: "Semplice",
  medio: "Intermedio",
  avanzato: "Avanzato",
};

export const TONE_SHORT = {
  infantile: "Bambini",
  semplice: "Base",
  medio: "Medio",
  avanzato: "Avanzato",
};

export const TONE_COLORS = {
  infantile: "var(--info)",
  semplice: "var(--success)",
  medio: "var(--gold)",
  avanzato: "var(--info)",
};

// ── Item.texts.duration ──────────────────────────────────────────
// La durata è la lunghezza del racconto: i comandi "dimmi di più" /
// "dimmi di meno" si muovono lungo questo asse.
export const DURATIONS = ["breve", "medio", "lungo"];

export const DURATION_LABELS = {
  breve: "Breve",
  medio: "Medio",
  lungo: "Esteso",
};

/** Stima in secondi della lettura ad alta voce, per durata. */
export const DURATION_SECONDS = {
  breve: 30,
  medio: 60,
  lungo: 120,
};

// ── Item.license ─────────────────────────────────────────────────
export const LICENSE_LABELS = {
  "CC-BY": "CC-BY",
  "CC-BY-SA": "CC-BY-SA",
  CC0: "CC0 — pubblico dominio",
  privata: "Licenza privata",
};

// ── Museum.floors[].cells[].type ─────────────────────────────────
export const CELL_TYPES = ["muro", "item", "uscita", "ingresso", "bagno", "bar"];

export const CELL_LABELS = {
  muro: "Muro",
  item: "Opera",
  uscita: "Uscita",
  ingresso: "Ingresso",
  bagno: "Toilette",
  bar: "Bar",
};

/** Icona (chiave di ICON_PATHS) associata a ogni tipo di cella. */
export const CELL_ICONS = {
  muro: null,
  item: "star",
  uscita: "exit",
  ingresso: "enter",
  bagno: "toilet",
  bar: "bar",
};

/** Colore di contorno/pin per tipo di cella. */
export const CELL_COLORS = {
  muro: "var(--borderHi)",
  item: "var(--mapArtB)",
  uscita: "var(--danger)",
  ingresso: "var(--success)",
  bagno: "var(--info)",
  bar: "var(--gold)",
};

/** Riempimento della cella nella griglia. */
export const CELL_FILLS = {
  muro: "var(--surfaceHi)",
  item: "var(--mapArt)",
  uscita: "rgba(217,95,75,0.20)",
  ingresso: "rgba(106,171,135,0.20)",
  bagno: "rgba(91,143,212,0.18)",
  bar: "rgba(201,169,110,0.18)",
};

/** Tipi di cella che il visitatore può cercare come "servizio". */
export const SERVICE_TYPES = ["bagno", "uscita", "bar", "ingresso"];

/** Celle non attraversabili nel calcolo del percorso. */
export const BLOCKING_TYPES = ["muro"];

/** Lato di una cella espresso in metri, per stimare le distanze a schermo. */
export const CELL_METERS = 1.5;

// ── Ruoli utente (server/models/User.js) ─────────────────────────
export const ROLES = ["admin", "author", "docente", "visitor"];
