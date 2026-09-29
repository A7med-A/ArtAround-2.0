// ═══════════════════════════════════════════════════════════════
// SCOPE — cosa mostrare in un editor, in base al ruolo.
//
// Il server decide cosa un utente può *vedere*; gli editor mostrano ciò
// che può *modificare*. Per chi cura il museo le due cose coincidono; per
// un docente no: legge i contenuti pubblici del museo — le servono per
// comporre le tappe — ma può modificare soltanto il proprio materiale.
// ═══════════════════════════════════════════════════════════════

import { auth } from "../core/auth.js";

/**
 * True se l'utente corrente può modificare questo documento.
 * Admin e autori curano i contenuti del museo; un docente solo i propri.
 */
export function canEdit(doc) {
  if (!auth.isTeacher()) return true;
  return doc?.createdBy === auth.currentUser()?.username;
}

/**
 * Restringe una lista a ciò che l'utente corrente può modificare.
 * Da usare dove elencare l'inmodificabile confonderebbe — l'elenco delle
 * visite — e non dove serve consultarlo, come il catalogo delle opere.
 */
export function onlyMine(list) {
  return (list || []).filter(canEdit);
}
