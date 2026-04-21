const router = require("express").Router({ mergeParams: true });

// controller
const {
  getAllVisits,
  getOneVisit,
  createVisit,
  updateVisit,
  deleteVisit,
} = require("../controllers/visits.controller");

//get
router.get("/", getAllVisits);
router.get("/:id", getOneVisit);
// post
router.post("/", createVisit);
// put
router.put("/:id", updateVisit);
// delete
router.delete("/:id", deleteVisit);

module.exports = router;
