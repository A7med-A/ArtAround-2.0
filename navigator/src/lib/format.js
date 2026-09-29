// ═══════════════════════════════════════════════════════════════
// FORMAT — helper di presentazione
// ═══════════════════════════════════════════════════════════════

/** Secondi → "m:ss". */
export function formatClock(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Secondi → etichetta breve leggibile ("45 sec", "2 min"). */
export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  if (s < 60) return `${s} sec`;
  return `${Math.round(s / 60)} min`;
}

/** Metri → "12 m" / "1,2 km". */
export function formatMeters(meters) {
  const m = Math.max(0, Math.round(meters || 0));
  if (m < 1000) return `${m} m`;
  return `${(m / 1000).toFixed(1).replace(".", ",")} km`;
}

/** Plurale semplice: 1 opera / 3 opere. */
export function plural(count, singular, pluralForm) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** Iniziali di un nome, per gli avatar testuali. */
export function initials(name) {
  return (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

/**
 * Numero stabile e deterministico ricavato da una stringa.
 * Serve a scegliere sempre la stessa palette decorativa per la stessa opera.
 */
export function hashSeed(value) {
  const str = String(value ?? "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Taglia un testo alla lunghezza massima aggiungendo un'ellissi. */
export function truncate(text, max = 120) {
  const t = String(text || "");
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}
