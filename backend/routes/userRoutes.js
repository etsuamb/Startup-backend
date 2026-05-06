const router = require("express").Router();
const { authenticate } = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

router.get("/profile", authenticate, userController.getMyProfile);
router.put("/profile", authenticate, userController.updateMyProfile);

module.exports = router;
