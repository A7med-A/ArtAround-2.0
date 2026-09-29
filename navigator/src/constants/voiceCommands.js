// ═══════════════════════════════════════════════════════════════
// COMANDI VOCALI
//
// Ogni comando ha:
//   action   identificatore gestito da useTourCommands
//   label    forma canonica mostrata a schermo e toccabile
//   phrases  varianti riconosciute nel parlato (minuscole, senza accenti)
//
// Le frasi più lunghe vanno confrontate per prime: "dimmi di meno" non
// deve essere assorbito da "dimmi di più" o da un generico "di".
// ═══════════════════════════════════════════════════════════════

export const VOICE_COMMANDS = [
  {
    action: "next",
    label: "Avanti",
    icon: "next",
    group: "percorso",
    phrases: ["avanti", "prossima", "prossima opera", "opera successiva", "successiva", "vai avanti"],
  },
  {
    action: "prev",
    label: "Indietro",
    icon: "prev",
    group: "percorso",
    phrases: ["indietro", "precedente", "opera precedente", "torna indietro"],
  },
  {
    action: "more",
    label: "Dimmi di più",
    icon: "plus",
    group: "racconto",
    phrases: ["dimmi di piu", "di piu", "piu lungo", "approfondisci", "raccontami di piu"],
  },
  {
    action: "less",
    label: "Dimmi di meno",
    icon: "minus",
    group: "racconto",
    phrases: ["dimmi di meno", "di meno", "piu corto", "piu breve", "riassumi", "fai breve"],
  },
  {
    action: "simpler",
    label: "Non capisco",
    icon: "info",
    group: "racconto",
    phrases: ["non capisco", "piu facile", "piu semplice", "spiegami meglio", "non ho capito"],
  },
  {
    action: "harder",
    label: "Troppo semplice",
    icon: "book",
    group: "racconto",
    phrases: ["troppo semplice", "piu avanzato", "piu difficile", "piu dettagli", "livello avanzato"],
  },
  {
    action: "repeat",
    label: "Ripeti",
    icon: "refresh",
    group: "ascolto",
    phrases: ["ripeti", "da capo", "rileggi", "ripetimi"],
  },
  {
    action: "pause",
    label: "Metti in pausa",
    icon: "pause",
    group: "ascolto",
    phrases: ["pausa", "metti in pausa", "fermati", "stop", "silenzio"],
  },
  {
    action: "toilet",
    label: "Dov'è la toilette",
    icon: "toilet",
    group: "servizi",
    phrases: ["dov e la toilette", "toilette", "bagno", "dove sono i bagni", "servizi igienici"],
  },
  {
    action: "exit",
    label: "Dov'è l'uscita",
    icon: "exit",
    group: "servizi",
    phrases: ["dov e l uscita", "uscita", "come esco", "dove si esce"],
  },
  {
    action: "bar",
    label: "Dov'è il bar",
    icon: "bar",
    group: "servizi",
    phrases: ["dov e il bar", "bar", "caffe", "caffetteria", "dove si mangia"],
  },
  {
    action: "map",
    label: "Mostra la mappa",
    icon: "map",
    group: "servizi",
    phrases: ["mappa", "mostra la mappa", "apri la mappa", "dove sono"],
  },
];

export const COMMAND_GROUPS = [
  { id: "percorso", label: "Percorso" },
  { id: "racconto", label: "Racconto" },
  { id: "ascolto", label: "Ascolto" },
  { id: "servizi", label: "Servizi" },
];

/** Normalizza il parlato: minuscole, senza accenti né punteggiatura. */
export function normalizePhrase(input) {
  return String(input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // rimuove i segni diacritici
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Trova il comando corrispondente a una frase pronunciata.
 * Confronta prima le frasi più lunghe, così "dimmi di meno" vince
 * sul più generico "di meno" e nessun comando ne inghiotte un altro.
 *
 * @returns {object|null} il comando riconosciuto
 */
export function matchCommand(spoken) {
  const said = normalizePhrase(spoken);
  if (!said) return null;

  const candidates = [];
  for (const command of VOICE_COMMANDS) {
    for (const phrase of command.phrases) {
      if (said.includes(phrase)) candidates.push({ command, length: phrase.length });
    }
  }
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.length - a.length);
  return candidates[0].command;
}
