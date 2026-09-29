const Item = require("../models/Item");
const { visibilityFilter, canSee, canModify, sanitizePayload } = require("../lib/ownership");

/**
 * GET /api/museums/:slug/items
 *
 * Le opere private non compaiono nel catalogo: sono materiale che il suo
 * autore non ha pubblicato — tipicamente le schede didattiche di un docente —
 * e raggiungono il pubblico solo attraverso una visita che le include.
 * Le vede soltanto chi le ha create.
 */
async function getAllItems(req, res) {
  try {
    const items = await Item.find({
      museumId: req.params.slug,
      ...visibilityFilter(req.user),
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getOneItem(req, res) {
  try {
    const item = await Item.findById(req.params.id);
    if (!canSee(item, req.user)) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createItem(req, res) {
  try {
    const item = await Item.create({
      ...sanitizePayload(req.body, req.user, { isCreate: true }),
      museumId: req.params.slug, // ← forza il museumId dall'URL
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateItem(req, res) {
  try {
    const existing = await Item.findById(req.params.id);
    const check = canModify(existing, req.user);
    if (!check.ok) return res.status(check.status).json({ error: check.error });

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      sanitizePayload(req.body, req.user),
      { new: true },
    );
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteItem(req, res) {
  try {
    const existing = await Item.findById(req.params.id);
    const check = canModify(existing, req.user);
    if (!check.ok) return res.status(check.status).json({ error: check.error });

    await existing.deleteOne();
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllItems,
  getOneItem,
  createItem,
  updateItem,
  deleteItem,
};
