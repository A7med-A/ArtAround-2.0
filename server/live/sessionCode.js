// ═══════════════════════════════════════════════════════════════
// CODICE DELLE SESSIONI
//
// Sei cifre, dettate ad alta voce in classe e digitate dagli studenti.
// Numerico e non alfabetico per due motivi: sul telefono apre il tastierino
// e non c'è nulla da scrivere correttamente — niente accenti, maiuscole o
// doppie su cui sbagliare.
//
// Il codice si conserva a sei cifre (`code`) e si mostra a gruppi di tre
// (`label`): "428 517" si legge e si ricopia meglio di "428517".
// ═══════════════════════════════════════════════════════════════

const CODE_LENGTH = 6;

/** "428517" → "428 517" */
function formatCode(code) {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

/** Genera un codice di sei cifre. */
function generateCode() {
  // La prima cifra non è mai zero: "042517" letto ad alta voce diventa
  // "quarantaduecinquecentodiciassette" e lo studente digita cinque cifre.
  let code = String(1 + Math.floor(Math.random() * 9));
  for (let i = 1; i < CODE_LENGTH; i++) code += Math.floor(Math.random() * 10);
  return { code, label: formatCode(code) };
}

/**
 * Tiene solo le cifre di ciò che lo studente digita: spazi, trattini e
 * qualsiasi altro segno vengono ignorati, così "428 517" e "428-517"
 * valgono quanto "428517".
 */
function normalizeCode(input) {
  return String(input || "").replace(/\D/g, "");
}

/**
 * Genera un codice non ancora assegnato.
 *
 * L'unicità va verificata su TUTTE le sessioni, non solo su quelle aperte:
 * `Session.code` ha un indice unique, quindi riusare il codice di una
 * sessione conclusa fallirebbe in scrittura.
 *
 * @param {(code: string) => Promise<boolean>} isTaken
 */
async function generateUniqueCode(isTaken, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    const candidate = generateCode();
    if (!(await isTaken(candidate.code))) return candidate;
  }
  // Con 900.000 codici possibili, arrivare qui significa che l'archivio
  // delle sessioni è da ripulire: meglio dirlo che restituire un duplicato.
  throw new Error("Impossibile generare un codice libero: troppe sessioni archiviate");
}

module.exports = { CODE_LENGTH, formatCode, generateCode, generateUniqueCode, normalizeCode };
