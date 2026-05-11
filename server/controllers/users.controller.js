// ═══════════════════════════════════════════════════════════════
// USERS CONTROLLER — admin-only management
// ═══════════════════════════════════════════════════════════════

const User = require("../models/User");
const Museum = require("../models/Museum");

/**
 * GET /api/users — lista di tutti gli utenti (admin only).
 */
async function listUsers(req, res) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/users/:id/grant
 * body: { museumSlug }
 * Aggiunge il museumSlug al set di musei accessibili dall'autore.
 * Non ha effetto sugli admin.
 */
async function grantAccess(req, res) {
  try {
    const { museumSlug } = req.body || {};
    if (!museumSlug) return res.status(400).json({ error: "museumSlug obbligatorio" });

    // Verifica che il museo esista
    const museum = await Museum.findOne({ slug: museumSlug });
    if (!museum) return res.status(404).json({ error: "Museo non trovato" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Utente non trovato" });
    if (user.role !== "author") {
      return res.status(400).json({ error: "Si può concedere accesso solo agli autori" });
    }
    if (user.museumSlugs.includes(museumSlug)) {
      return res.status(200).json(user); // idempotente
    }
    user.museumSlugs = [...user.museumSlugs, museumSlug];
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/users/:id/revoke
 * body: { museumSlug }
 * Rimuove il museumSlug dall'autore.
 */
async function revokeAccess(req, res) {
  try {
    const { museumSlug } = req.body || {};
    if (!museumSlug) return res.status(400).json({ error: "museumSlug obbligatorio" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Utente non trovato" });
    user.museumSlugs = user.museumSlugs.filter((s) => s !== museumSlug);
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/users/:id — elimina un account (non l'admin stesso).
 */
async function deleteUser(req, res) {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: "Non puoi eliminare il tuo stesso account" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "Utente non trovato" });
    res.json({ message: "Utente eliminato" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { listUsers, grantAccess, revokeAccess, deleteUser };
