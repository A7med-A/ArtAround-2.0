const Visit = require("../models/Visit");
const { visibilityFilter, canSee, canModify, sanitizePayload } = require("../lib/ownership");

/**
 * La modalità di una visita discende dal ruolo di chi la crea, non da una
 * scelta: un docente prepara percorsi da condurre, un autore percorsi che il
 * visitatore segue da solo. Imponendola qui, il client non ha nulla da
 * decidere e non può sbagliare.
 *
 * Il quiz ha senso solo dove c'è qualcuno a somministrarlo: nelle visite
 * libere viene scartato invece di restare lì senza mai essere mostrato.
 */
function applyMode(payload, user) {
  const guided = user?.role === "docente";
  return {
    ...payload,
    mode: guided ? "guidata" : "libera",
    quiz: guided ? payload.quiz || [] : [],
  };
}

/**
 * GET /api/museums/:slug/visits
 *
 * Una visita privata la vede solo chi l'ha creata. È il caso delle visite
 * preparate da un docente per la propria classe: non sono contenuto del
 * museo e non devono comparire né agli altri autori né agli amministratori,
 * né ai visitatori che sfogliano i percorsi disponibili.
 */
async function getAllVisits(req, res) {
  try {
    const visits = await Visit.find({
      museumId: req.params.slug,
      ...visibilityFilter(req.user),
    }).populate("items");
    res.json(visits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getOneVisit(req, res) {
  try {
    const visit = await Visit.findById(req.params.id).populate("items");
    if (!canSee(visit, req.user)) {
      return res.status(404).json({ error: "Visit not found" });
    }
    res.json(visit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createVisit(req, res) {
  try {
    const visit = await Visit.create({
      ...applyMode(sanitizePayload(req.body, req.user, { isCreate: true }), req.user),
      museumId: req.params.slug, // ← forza il museumId dall'URL
    });
    res.status(201).json(visit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateVisit(req, res) {
  try {
    const existing = await Visit.findById(req.params.id);
    const check = canModify(existing, req.user);
    if (!check.ok) return res.status(check.status).json({ error: check.error });

    const visit = await Visit.findByIdAndUpdate(
      req.params.id,
      applyMode(sanitizePayload(req.body, req.user), req.user),
      { new: true },
    );
    res.json(visit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteVisit(req, res) {
  try {
    const existing = await Visit.findById(req.params.id);
    const check = canModify(existing, req.user);
    if (!check.ok) return res.status(check.status).json({ error: check.error });

    await existing.deleteOne();
    res.json({ message: "Visit deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllVisits,
  getOneVisit,
  createVisit,
  updateVisit,
  deleteVisit,
};
