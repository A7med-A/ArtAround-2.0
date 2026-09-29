// ═══════════════════════════════════════════════════════════════
// CONTENT — selezione del testo da Item.texts
//
// Il server memorizza per ogni opera una matrice sparsa di testi:
//   texts: [{ tone, duration, text }]
// dove `tone` = livello di approfondimento e `duration` = lunghezza.
//
// Nessuna opera ha necessariamente tutte le 4×3 combinazioni, quindi
// ogni selezione passa da un fallback verso la variante più vicina.
// ═══════════════════════════════════════════════════════════════

import { TONES, DURATIONS, DURATION_SECONDS } from "@/constants/schema";

/** Ordina un elenco di valori secondo l'ordine canonico dello schema. */
function sortByCanonical(values, canonical) {
  return canonical.filter((v) => values.includes(v));
}

/** Toni effettivamente disponibili per un'opera, dal più semplice al più avanzato. */
export function availableTones(item) {
  const present = new Set((item?.texts || []).map((t) => t.tone));
  return sortByCanonical([...present], TONES);
}

/** Durate disponibili per un'opera, opzionalmente filtrate su un tono. */
export function availableDurations(item, tone) {
  const texts = item?.texts || [];
  const pool = tone ? texts.filter((t) => t.tone === tone) : texts;
  const present = new Set(pool.map((t) => t.duration));
  return sortByCanonical([...present], DURATIONS);
}

/** True se l'opera ha almeno un testo raccontabile. */
export function hasContent(item) {
  return (item?.texts || []).some((t) => t?.text);
}

/**
 * Sceglie il testo più vicino alla combinazione richiesta.
 *
 * Strategia: fra tutte le varianti disponibili si prende quella che
 * minimizza la distanza sull'asse dei toni; a parità di tono, quella
 * più vicina sulla durata richiesta. Il tono ha priorità perché cambia
 * il registro del racconto, mentre la durata ne cambia solo l'ampiezza.
 *
 * @returns {{ text, tone, duration, exact, seconds } | null}
 */
export function resolveText(item, { tone, duration } = {}) {
  const texts = (item?.texts || []).filter((t) => t?.text);
  if (texts.length === 0) return null;

  const wantTone = TONES.indexOf(tone) >= 0 ? TONES.indexOf(tone) : TONES.indexOf("medio");
  const wantDur =
    DURATIONS.indexOf(duration) >= 0 ? DURATIONS.indexOf(duration) : DURATIONS.indexOf("medio");

  let best = null;
  let bestScore = Infinity;

  for (const t of texts) {
    const dTone = Math.abs(TONES.indexOf(t.tone) - wantTone);
    const dDur = Math.abs(DURATIONS.indexOf(t.duration) - wantDur);
    // Il tono pesa più della durata: 10 > max distanza possibile sulle durate.
    const score = dTone * 10 + dDur;
    if (score < bestScore) {
      bestScore = score;
      best = t;
    }
  }

  return {
    text: best.text,
    tone: best.tone,
    duration: best.duration,
    exact: best.tone === tone && best.duration === duration,
    seconds: estimateSeconds(best.text, best.duration),
  };
}

/**
 * Stima la durata della lettura ad alta voce.
 * Usa il conteggio parole (≈155 parole/minuto per la sintesi vocale italiana)
 * e ricade sulla stima per fascia se il testo è assente.
 */
export function estimateSeconds(text, duration = "medio") {
  if (!text) return DURATION_SECONDS[duration] ?? 60;
  const words = text.trim().split(/\s+/).length;
  return Math.max(10, Math.round((words / 155) * 60));
}

/**
 * Secondi da aggiungere a ogni tappa oltre all'ascolto: raggiungere l'opera
 * e osservarla. Senza questo margine la stima risulterebbe irrealisticamente
 * bassa, perché i testi delle audioguide sono brevi per costruzione.
 */
const SECONDS_PER_STOP_OVERHEAD = 90;

/** Somma le durate stimate delle opere di un percorso, in minuti. */
export function estimateVisitMinutes(items, { tone, duration } = {}) {
  const list = items || [];
  if (list.length === 0) return 0;
  const total = list.reduce((sum, item) => {
    const picked = resolveText(item, { tone, duration });
    return sum + (picked?.seconds ?? 60) + SECONDS_PER_STOP_OVERHEAD;
  }, 0);
  return Math.max(1, Math.round(total / 60));
}

/**
 * Livelli di approfondimento offerti da un percorso: unione dei toni
 * scritti per le sue opere.
 *
 * Il modello Visit non ha un campo "livello" e dedurne uno solo sarebbe
 * fuorviante — nei dati reali quasi ogni opera è scritta in più registri.
 * Al visitatore serve sapere fin dove può spingersi, non un'etichetta media.
 */
export function toneRange(items) {
  const present = new Set();
  for (const item of items || []) {
    for (const tone of availableTones(item)) present.add(tone);
  }
  return sortByCanonical([...present], TONES);
}

/** Sposta il tono di `dir` passi fra quelli disponibili. null se non si può. */
export function shiftTone(item, current, dir) {
  const list = availableTones(item);
  if (list.length === 0) return null;
  const i = list.indexOf(current);
  const next = (i < 0 ? list.indexOf("medio") : i) + dir;
  if (next < 0 || next >= list.length) return null;
  return list[next];
}

/** Varianti scritte per l'opera, ordinate dalla più breve alla più estesa. */
export function variantsByLength(item) {
  return (item?.texts || [])
    .filter((t) => t?.text)
    .map((t) => ({ tone: t.tone, duration: t.duration, length: t.text.length }))
    .sort((a, b) => a.length - b.length);
}

/**
 * "Dimmi di più / di meno": trova la variante successiva o precedente
 * per ampiezza del racconto.
 *
 * Prima cerca un'altra `duration` per lo stesso `tone` — è ciò che il
 * visitatore si aspetta, perché il registro non cambia. Se l'autore non
 * l'ha scritta (nei dati reali la matrice tono×durata è quasi sempre
 * sparsa) ripiega sulla variante più vicina per lunghezza, anche se
 * appartiene a un tono diverso: meglio dare un testo più lungo di un
 * livello vicino che rispondere "non disponibile".
 *
 * @returns {{ tone, duration, toneChanged } | null}
 */
export function shiftLength(item, current, dir) {
  const { tone, duration } = current || {};

  // 1. Stessa fascia di approfondimento, lunghezza diversa.
  const sameTone = availableDurations(item, tone);
  const i = sameTone.indexOf(duration);
  const nextIndex = (i < 0 ? sameTone.indexOf("medio") : i) + dir;
  if (nextIndex >= 0 && nextIndex < sameTone.length) {
    return { tone, duration: sameTone[nextIndex], toneChanged: false };
  }

  // 2. Ripiego: variante adiacente per lunghezza fra tutte quelle scritte.
  const variants = variantsByLength(item);
  const at = variants.findIndex((v) => v.tone === tone && v.duration === duration);
  const target = (at < 0 ? 0 : at) + dir;
  if (target < 0 || target >= variants.length) return null;

  const picked = variants[target];
  return { tone: picked.tone, duration: picked.duration, toneChanged: picked.tone !== tone };
}
