const Visit = require("../models/Visit");

async function getAllVisits(req, res) {
  try {
    const visits = await Visit.find({ museumId: req.params.slug });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getOneVisit(req, res) {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) {
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
      ...req.body,
      museumId: req.params.slug, // ← forza il museumId dall'URL
    });
    res.status(201).json(visit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateVisit(req, res) {
  try {
    const visit = await Visit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!visit) {
      return res.status(404).json({ error: "Visit not found" });
    }
    res.json(visit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteVisit(req, res) {
  try {
    const visit = await Visit.findByIdAndDelete(req.params.id);
    if (!visit) {
      return res.status(404).json({ error: "Visit not found" });
    }
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
