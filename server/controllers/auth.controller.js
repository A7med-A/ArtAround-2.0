// ═══════════════════════════════════════════════════════════════
// AUTH CONTROLLER — register / login / me
// ═══════════════════════════════════════════════════════════════

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET } = require("../middleware/auth.middleware");

const TOKEN_EXPIRES_IN = "7d";

// Account condiviso usato dall'app Navigator per la modalità ospite.
const GUEST_USERNAME = "ospite";
const GUEST_EMAIL = "ospite@artaround.local";
const GUEST_PASSWORD = "ospite";

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, username: user.username },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN },
  );
}

/**
 * POST /api/auth/register
 * body: { username, email, password, role }
 *   - role: "admin" | "author" (default "author")
 */
async function register(req, res) {
  try {
    const { username, email, password, role } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ error: "username, email e password sono obbligatori" });
    }

    const allowed = ["admin", "author", "docente", "visitor"];
    const finalRole = allowed.includes(role) ? role : "author";

    // verifica unicità manuale per messaggi più chiari
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      if (existing.username === username.toLowerCase()) {
        return res.status(409).json({ error: "Username già usato" });
      }
      return res.status(409).json({ error: "Email già usata" });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: finalRole,
      museumSlug: null,
    });

    const token = signToken(user);
    return res.status(201).json({ token, user });
  } catch (err) {
    console.error("[auth.register]", err);
    if (err?.code === 11000) {
      return res.status(409).json({ error: "Username o email già usati" });
    }
    return res.status(500).json({ error: err.message || "Errore registrazione" });
  }
}

/**
 * POST /api/auth/login
 * body: { username, password }   (username può essere anche email)
 */
async function login(req, res) {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "username e password sono obbligatori" });
    }
    // accetta username OR email
    const id = String(username).toLowerCase().trim();
    const user = await User.findOne({
      $or: [{ username: id }, { email: id }],
    });
    if (!user) return res.status(401).json({ error: "Credenziali non valide" });

    // Confronto diretto: le password sono memorizzate in chiaro
    if (user.password !== password) {
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    const token = signToken(user);
    return res.json({ token, user });
  } catch (err) {
    console.error("[auth.login]", err);
    return res.status(500).json({ error: err.message || "Errore login" });
  }
}

/**
 * GET /api/auth/me — info utente corrente (richiede token).
 */
async function me(req, res) {
  return res.json({ user: req.user });
}

/**
 * POST /api/auth/guest
 * Rilascia un token per l'account ospite condiviso (role "visitor").
 * Serve all'app Navigator: un visitatore può consultare musei, opere e visite
 * senza registrarsi. L'account viene creato al primo utilizzo; vi si accede
 * solo da questo endpoint, mai dal login.
 */
async function guest(req, res) {
  try {
    let user = await User.findOne({ username: GUEST_USERNAME });
    if (!user) {
      user = await User.create({
        username: GUEST_USERNAME,
        email: GUEST_EMAIL,
        password: GUEST_PASSWORD,
        role: "visitor",
      });
    }
    const token = signToken(user);
    return res.json({ token, user });
  } catch (err) {
    console.error("[auth.guest]", err);
    return res.status(500).json({ error: err.message || "Errore accesso ospite" });
  }
}

module.exports = { register, login, me, guest };
