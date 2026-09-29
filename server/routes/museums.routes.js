const router = require("express").Router();
const {
  requireAuth,
  requireAdmin,
  canAccessMuseum,
  canAccessContent,
} = require("../middleware/auth.middleware");

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

// Sotto-router (items, visits). Gate diverso dal museo: qui entra anche la
// docente, che sul proprio materiale può scrivere pur non potendo toccare
// né l'anagrafica né la pianta.
router.use("/:slug/items", canAccessContent, require("./items.nested.routes"));
router.use("/:slug/visits", canAccessContent, require("./visits.nested.routes"));

module.exports = router;
