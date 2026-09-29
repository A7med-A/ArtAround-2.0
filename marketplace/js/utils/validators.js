// ═══════════════════════════════════════════════════════════════
// VALIDATORS — validazione lato client (mirroring Mongoose schema)
// ═══════════════════════════════════════════════════════════════

import { TONES, DURATIONS, LICENSES } from "./schema.js";

/**
 * Valida un Item secondo lo schema Mongoose:
 *   museumId, title, artist, period, description, license sono required
 *   texts[] (se presenti) devono avere tone+duration+text validi
 *   non possono esistere due (tone,duration) duplicati
 *
 * Ritorna { valid: boolean, errors: { field: 'messaggio' } }
 */
export function validateItem(item) {
  const errors = {};

  if (!item.title?.trim())       errors.title       = "Titolo obbligatorio";
  if (!item.artist?.trim())      errors.artist      = "Artista obbligatorio";
  if (!item.period?.trim())      errors.period      = "Periodo obbligatorio";
  if (!item.description?.trim()) errors.description = "Descrizione obbligatoria";

  if (!item.license || !LICENSES.includes(item.license)) {
    errors.license = "Licenza non valida";
  }

  // Lunghezze max (allineate allo schema)
  if (item.title && item.title.length > 120)             errors.title = "Max 120 caratteri";
  if (item.artist && item.artist.length > 120)           errors.artist = "Max 120 caratteri";
  if (item.period && item.period.length > 60)            errors.period = "Max 60 caratteri";
  if (item.description && item.description.length > 2000) errors.description = "Max 2000 caratteri";

  // Texts: ognuno deve essere completo
  if (Array.isArray(item.texts)) {
    const seen = new Set();
    for (let i = 0; i < item.texts.length; i++) {
      const t = item.texts[i];
      if (!TONES.includes(t.tone)) {
        errors[`texts.${i}.tone`] = "Tono non valido";
      }
      if (!DURATIONS.includes(t.duration)) {
        errors[`texts.${i}.duration`] = "Durata non valida";
      }
      if (!t.text?.trim()) {
        errors[`texts.${i}.text`] = "Testo obbligatorio";
      }
      const key = `${t.tone}-${t.duration}`;
      if (seen.has(key)) {
        errors[`texts.${i}`] = `Variante "${key}" duplicata`;
      }
      seen.add(key);
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Restituisce un Item "vuoto" pronto da editare.
 */
export function emptyItem(museumId, createdBy) {
  return {
    museumId,
    title: "",
    artist: "",
    period: "",
    description: "",
    imageUrl: "",
    license: "CC-BY",
    tags: [],
    createdBy,
    texts: [{ tone: "medio", duration: "medio", text: "" }],
  };
}
