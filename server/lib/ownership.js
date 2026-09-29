// ═══════════════════════════════════════════════════════════════
// PROPRIETÀ E VISIBILITÀ DEI CONTENUTI
//
// Regole comuni a opere e visite, tenute in un posto solo perché sono le
// stesse per entrambe e devono restare allineate.
//
// Principio: "privata" significa privata davvero — la vede solo chi l'ha
// creata, nemmeno gli amministratori. È ciò che rende utilizzabile il
// materiale didattico di un docente, che non è contenuto del museo.
// I documenti privati raggiungono comunque il pubblico quando sono
// inclusi in una visita, dove arrivano già popolati.
// ═══════════════════════════════════════════════════════════════

/** Ruoli che possono gestire solo ciò che hanno creato, e solo in privato. */
const OWN_PRIVATE_ONLY_ROLES = ["docente"];

/** Filtro Mongo per "ciò che questo utente può vedere". */
function visibilityFilter(user) {
  return {
    $or: [{ visibility: { $ne: "privata" } }, { createdBy: user?.username || null }],
  };
}

/** Un documento è visibile se è pubblico o se appartiene a chi lo chiede. */
function canSee(doc, user) {
  if (!doc) return false;
  if (doc.visibility !== "privata") return true;
  return doc.createdBy === user?.username;
}

/** True se il ruolo può lavorare soltanto sul proprio materiale privato. */
function isOwnPrivateOnly(user) {
  return OWN_PRIVATE_ONLY_ROLES.includes(user?.role);
}

/**
 * Verifica che l'utente possa modificare o eliminare un documento.
 * @returns {{ ok: true } | { ok: false, status: number, error: string }}
 */
function canModify(doc, user) {
  if (!doc) return { ok: false, status: 404, error: "Non trovato" };

  if (isOwnPrivateOnly(user)) {
    // Il docente non vede nemmeno l'esistenza di ciò che non è suo: 404,
    // non 403, per non rivelare che quel documento c'è.
    if (doc.createdBy !== user.username) {
      return { ok: false, status: 404, error: "Non trovato" };
    }
    return { ok: true };
  }

  if (!canSee(doc, user)) return { ok: false, status: 404, error: "Non trovato" };
  return { ok: true };
}

/**
 * Normalizza il corpo di una richiesta di creazione o modifica.
 * Impedisce di spacciarsi per un altro autore e forza il privato per i
 * ruoli che possono pubblicare solo materiale proprio.
 */
function sanitizePayload(body, user, { isCreate } = {}) {
  const { createdBy: _ignored, _id: _id2, ...clean } = body || {};

  if (isCreate) clean.createdBy = user.username;
  if (isOwnPrivateOnly(user)) clean.visibility = "privata";

  return clean;
}

module.exports = {
  OWN_PRIVATE_ONLY_ROLES,
  visibilityFilter,
  canSee,
  canModify,
  isOwnPrivateOnly,
  sanitizePayload,
};
