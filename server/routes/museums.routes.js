const router = require("express").Router();

// controller
const {
  getAllMuseums,
  getOneMuseum,
  createMuseum,
  updateMuseum,
  deleteMuseum,
} = require("../controllers/museums.controller");

// get
router.get("/", getAllMuseums);
router.get("/:slug", getOneMuseum);
// post
router.post("/", createMuseum);
// put
router.put("/:slug", updateMuseum);
router.patch("/:slug", updateMuseum);
// delete
router.delete("/:slug", deleteMuseum);

// sotto-router
router.use("/:slug/items", require("./items.nested.routes"));
router.use("/:slug/visits", require("./visits.nested.routes"));

module.exports = router;
