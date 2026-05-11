const Museum = require("../models/Museum");
const User = require("../models/User");

/**
 * GET /api/museums
 *   - admin: tutti
 *   - author: solo i musei a cui ha accesso (museumSlugs)
 */
async function getAllMuseums(req, res) {
  try {
    let filter = {};
    if (req.user?.role === "author") {
      const slugs = req.user.museumSlugs || [];
      if (slugs.length === 0) return res.json([]);
      filter = { slug: { $in: slugs } };
    }
    const museums = await Museum.find(filter);
    res.json(museums);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/museums/:slug
 * (autorizzazione gestita dal middleware canAccessMuseum)
 */
async function getOneMuseum(req, res) {
  try {
    const museum = await Museum.findOne({ slug: req.params.slug });
    if (!museum) return res.status(404).json({ error: "Museum not found" });
    res.json(museum);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/museums
 *   - SOLO admin (gestito dal middleware nella route)
 */
async function createMuseum(req, res) {
  try {
    const payload = {
      ...req.body,
      createdBy: req.user.username,
    };
    const museum = await Museum.create(payload);
    res.status(201).json(museum);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: "Esiste già un museo con questo slug" });
    }
    res.status(500).json({ error: error.message });
  }
}

/**
 * PUT/PATCH /api/museums/:slug
 *   - admin sempre; author solo se nel suo museumSlugs (canAccessMuseum)
 * Lo slug non è modificabile.
 */
async function updateMuseum(req, res) {
  try {
    const { slug: _ignore, ...patch } = req.body || {};
    const museum = await Museum.findOneAndUpdate(
      { slug: req.params.slug },
      patch,
      { new: true },
    );
    if (!museum) return res.status(404).json({ error: "Museum not found" });
    res.json(museum);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * DELETE /api/museums/:slug
 *   - SOLO admin (gestito dal middleware nella route)
 *   - Rimuove lo slug da tutti gli authors che lo avevano in museumSlugs.
 */
async function deleteMuseum(req, res) {
  try {
    const museum = await Museum.findOneAndDelete({ slug: req.params.slug });
    if (!museum) return res.status(404).json({ error: "Museum not found" });
    await User.updateMany(
      { museumSlugs: museum.slug },
      { $pull: { museumSlugs: museum.slug } },
    );
    res.json({ message: "Museum deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllMuseums,
  getOneMuseum,
  createMuseum,
  updateMuseum,
  deleteMuseum,
};
