// ═══════════════════════════════════════════════════════════════
// SCHEMA — enum allineati ai modelli Mongoose del backend
// Single source of truth per il front-end.
// ═══════════════════════════════════════════════════════════════

// Item.texts.tone
export const TONES = ["infantile", "semplice", "medio", "avanzato"];
export const TONE_LABELS = {
  infantile: "Bambini",
  semplice:  "Semplice",
  medio:     "Medio",
  avanzato:  "Avanzato",
};

// Item.texts.duration
export const DURATIONS = ["breve", "medio", "lungo"];
export const DURATION_LABELS = {
  breve: "Breve",
  medio: "Medio",
  lungo: "Lungo",
};

// Item.license
export const LICENSES = ["CC-BY", "CC-BY-SA", "CC0", "privata"];
export const LICENSE_LABELS = {
  "CC-BY":    "CC-BY",
  "CC-BY-SA": "CC-BY-SA",
  "CC0":      "CC0 (pubblico dominio)",
  "privata":  "Privata",
};

// Item.visibility
// Le opere private non compaiono nel catalogo del Navigator: raggiungono
// i visitatori solo se incluse in una visita (tipicamente una visita
// guidata preparata da un docente).
export const VISIBILITIES = ["pubblica", "privata"];
export const VISIBILITY_LABELS = {
  pubblica: "Pubblica — visibile nel catalogo",
  privata:  "Privata — solo dentro le visite che la includono",
};

// Visit.mode
// Non è una scelta: il server la impone in base al ruolo di chi crea la
// visita. Le etichette servono a mostrarla, non a selezionarla.
export const VISIT_MODES = ["libera", "guidata"];
export const VISIT_MODE_LABELS = {
  libera:  "Libera",
  guidata: "Guidata",
};
export const VISIT_MODE_HINTS = {
  libera:
    "Il visitatore segue il percorso da solo, con i propri tempi, dall'app Navigator.",
  guidata:
    "La conduci tu dal Navigator: attivandola ottieni un codice di sei cifre che la classe digita per collegarsi, e gli studenti seguono le tue tappe in sincronia.",
};

// Museum.floors[].cells[].type
export const CELL_TYPES = ["muro", "item", "uscita", "ingresso", "bagno", "bar"];
export const CELL_LABELS = {
  muro:     "Muro",
  item:     "Opera",
  uscita:   "Uscita",
  ingresso: "Ingresso",
  bagno:    "Bagno",
  bar:      "Bar",
};

// Helpers
export const toOption = (v, labels) => ({ value: v, label: labels[v] || v });
