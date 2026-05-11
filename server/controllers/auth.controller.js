// ═══════════════════════════════════════════════════════════════
// AUTH CONTROLLER — register / login / me
// ═══════════════════════════════════════════════════════════════

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET } = require("../middleware/auth.middleware");

const TOKEN_EXPIRES_IN = "7d";

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
    if (password.length < 6) {
      return res.status(400).json({ error: "La password deve avere almeno 6 caratteri" });
    }

    const finalRole = role === "admin" ? "admin" : "author";

    // verifica unicità manuale per messaggi più chiari
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      if (existing.username === username.toLowerCase()) {
        return res.status(409).json({ error: "Username già usato" });
      }
      return res.status(409).json({ error: "Email già usata" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      passwordHash,
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

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Credenziali non valide" });

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

module.exports = { register, login, me };
