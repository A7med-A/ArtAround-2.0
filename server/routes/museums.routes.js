const router = require("express").Router();
const { requireAuth, requireAdmin, canAccessMuseum } = require("../middleware/auth.middleware");

const {
  getAllMuseums,
  getOneMuseum,
  createMuseum,
  updateMuseum,
  deleteMuseum,
} = require("../controllers/museums.controller");

// Tutte le rotte richiedono autenticazione
router.use(requireAuth);

// Read
router.get("/", getAllMuseums);
router.get("/:slug", canAccessMuseum, getOneMuseum);

// Create — solo admin
router.post("/", requireAdmin, createMuseum);

// Update — admin sempre, author solo per il proprio museo
router.put("/:slug", canAccessMuseum, updateMuseum);
router.patch("/:slug", canAccessMuseum, updateMuseum);

// Delete — solo admin
router.delete("/:slug", requireAdmin, deleteMuseum);

// Sotto-router (items, visits): l'auth è già in req.user; verifica accesso al museo
router.use("/:slug/items", canAccessMuseum, require("./items.nested.routes"));
router.use("/:slug/visits", canAccessMuseum, require("./visits.nested.routes"));

module.exports = router;
