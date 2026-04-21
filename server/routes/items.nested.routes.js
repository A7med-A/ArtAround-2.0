const router = require("express").Router({ mergeParams: true });

// controller
const {
  getAllItems,
  getOneItem,
  createItem,
  updateItem,
  deleteItem,
} = require("../controllers/items.controller");

//get
router.get("/", getAllItems);
router.get("/:id", getOneItem);
// post
router.post("/", createItem);
// put
router.put("/:id", updateItem);
// delete
router.delete("/:id", deleteItem);

module.exports = router;
