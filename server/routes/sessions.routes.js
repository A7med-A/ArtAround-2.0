// ═══════════════════════════════════════════════════════════════
// SESSIONS ROUTES — /api/sessions/*
//
// Due livelli di accesso:
//   • le rotte del docente richiedono il JWT (requireAuth) e verificano
//     nel controller che sia lui a condurre la sessione;
//   • le rotte dello studente si autenticano con la streamKey ricevuta
//     all'ingresso, perché EventSource non può inviare header.
// ═══════════════════════════════════════════════════════════════

const router = require("express").Router();
const { requireAuth } = require("../middleware/auth.middleware");

const {
  createSession,
  listSessions,
  monitorSession,
  updateSession,
  deleteSession,
  joinSession,
  sessionState,
  streamSession,
  recordEvent,
  submitAnswer,
  setGrades,
} = require("../controllers/sessions.controller");

// ── Studente: autenticazione con streamKey ───────────────────────
// Registrate per prime perché lo stream non passa da requireAuth.
router.get("/:code/stream", streamSession);
router.get("/:code/state", sessionState);
router.post("/:code/events", recordEvent);
router.post("/:code/answers", submitAnswer);

// ── Ingresso: serve un token (anche ospite) ──────────────────────
router.post("/:code/join", requireAuth, joinSession);

// ── Docente ──────────────────────────────────────────────────────
router.post("/", requireAuth, createSession);
router.get("/", requireAuth, listSessions);
router.get("/:code/monitor", requireAuth, monitorSession);
router.patch("/:code", requireAuth, updateSession);
router.post("/:code/grades", requireAuth, setGrades);
router.delete("/:code", requireAuth, deleteSession);

module.exports = router;
