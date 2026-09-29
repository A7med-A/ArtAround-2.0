// ═══════════════════════════════════════════════════════════════
// AUTH ROUTES — /api/auth/*
// ═══════════════════════════════════════════════════════════════

const router = require("express").Router();
const { register, login, me, guest } = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth.middleware");

router.post("/register", register);
router.post("/login", login);
router.post("/guest", guest);
router.get("/me", requireAuth, me);

module.exports = router;
