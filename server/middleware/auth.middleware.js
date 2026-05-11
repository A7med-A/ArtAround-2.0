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

/**
 * Verifica che l'utente possa accedere/modificare il museo con lo slug indicato in req.params.slug.
 * - Admin: sempre OK
 * - Author: solo se il suo museumSlug coincide con quello richiesto
 */
function canAccessMuseum(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Non autenticato" });
  const slug = req.params.slug;
  if (req.user.role === "admin") return next();
  const slugs = req.user.museumSlugs || [];
  if (req.user.role === "author" && slugs.includes(slug)) return next();
  return res.status(403).json({ error: "Non hai accesso a questo museo" });
}

module.exports = {
  JWT_SECRET,
  requireAuth,
  requireAdmin,
  canAccessMuseum,
};
