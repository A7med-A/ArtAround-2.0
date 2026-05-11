// ═══════════════════════════════════════════════════════════════
// USERS ROUTES — /api/users/*   (tutte solo admin)
// ═══════════════════════════════════════════════════════════════

const router = require("express").Router();
const { requireAuth, requireAdmin } = require("../middleware/auth.middleware");
const { listUsers, grantAccess, revokeAccess, deleteUser } = require("../controllers/users.controller");

router.use(requireAuth, requireAdmin);

router.get("/", listUsers);
router.post("/:id/grant", grantAccess);
router.post("/:id/revoke", revokeAccess);
router.delete("/:id", deleteUser);

module.exports = router;
