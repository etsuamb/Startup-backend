const router = require("express").Router();
const miscController = require("../controllers/miscController");
const adminExtended = require("../controllers/adminExtendedController");

// POST /api/contact
router.post("/contact", miscController.receiveContactMessage);

// Public access to platform categories (industries etc.)
router.get("/platform/categories", adminExtended.listPublicCategories);

// Allow authenticated or anonymous users to suggest a new category/industry.
router.post("/platform/categories/suggest", adminExtended.suggestCategory);

module.exports = router;
