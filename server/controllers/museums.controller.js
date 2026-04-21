const Museum = require("../models/Museum");

async function getAllMuseums(req, res) {
  try {
    const museums = await Museum.find();
    res.json(museums);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getOneMuseum(req, res) {
  try {
    const museum = await Museum.findById(req.params.id);
    if (!museum) {
      return res.status(404).json({ error: "Museum not found" });
    }
    res.json(museum);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createMuseum(req, res) {
  try {
    const museum = await Museum.create(req.body);
    res.status(201).json(museum);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateMuseum(req, res) {
  try {
    const museum = await Museum.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!museum) {
      return res.status(404).json({ error: "Museum not found" });
    }
    res.json(museum);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteMuseum(req, res) {
  try {
    const museum = await Museum.findByIdAndDelete(req.params.id);
    if (!museum) {
      return res.status(404).json({ error: "Museum not found" });
    }
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
