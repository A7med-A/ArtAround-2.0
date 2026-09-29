// ═══════════════════════════════════════════════════════════════
// AUTH MIDDLEWARE
//   - requireAuth: verifica JWT, popola req.user
//   - requireAdmin: deve essere admin
//   - canAccessMuseum: admin sempre, author solo se possiede quel museo
// ═══════════════════════════════════════════════════════════════

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

/**
 * Estrae il Bearer token dall'header Authorization.
 */
function getToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return null;
}

/**
 * Verifica il JWT e popola req.user.
 */
async function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: "Token mancante" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "Utente non trovato" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token non valido" });
  }
}

/**
 * Richiede ruolo admin.
 */
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Non autenticato" });
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Permessi insufficienti (solo admin)" });
  }
  next();
}

/** Ruoli che possono consultare qualsiasi museo ma non modificarne nulla. */
const READ_ONLY_ROLES = ["visitor", "docente"];

/**
 * Accesso al MUSEO in sé: anagrafica e pianta (Museum.floors).
 * - Admin: sempre
 * - Author: solo i musei a cui ha accesso
 * - Docente e visitatore: sola lettura, su qualsiasi museo
 *
 * È la barriera che impedisce a un docente di toccare mappa e anagrafica:
 * per lui il museo è un dato di fatto, non qualcosa da curare.
 */
function canAccessMuseum(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Non autenticato" });
  const slug = req.params.slug;
  const { role } = req.user;

  if (role === "admin") return next();
  if (req.method === "GET" && READ_ONLY_ROLES.includes(role)) return next();
  if (role === "author" && (req.user.museumSlugs || []).includes(slug)) return next();

  if (READ_ONLY_ROLES.includes(role)) {
    return res.status(403).json({ error: "Non puoi modificare i musei" });
  }
  return res.status(403).json({ error: "Non hai accesso a questo museo" });
}

/**
 * Accesso ai CONTENUTI di un museo: opere e visite.
 *
 * Decide solo se il ruolo può entrare nella sezione. Chi possiede il singolo
 * documento e chi può vederlo lo stabiliscono i controller, perché dipende dal
 * documento — un docente entra qui per gestire il proprio materiale, non
 * quello del museo.
 */
function canAccessContent(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Non autenticato" });
  const slug = req.params.slug;
  const { role } = req.user;

  if (role === "admin") return next();
  if (role === "docente") return next();
  if (role === "visitor") {
    if (req.method === "GET") return next();
    return res.status(403).json({ error: "I visitatori possono solo consultare" });
  }
  if (role === "author" && (req.user.museumSlugs || []).includes(slug)) return next();

  return res.status(403).json({ error: "Non hai accesso ai contenuti di questo museo" });
}

module.exports = {
  JWT_SECRET,
  READ_ONLY_ROLES,
  requireAuth,
  requireAdmin,
  canAccessMuseum,
  canAccessContent,
};
