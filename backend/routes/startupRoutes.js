const router = require("express").Router();

const {
  authenticate,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const startupController = require("../controllers/startupController");

router.post(
  "/profile",
  authenticate,
  authorizeRoles("Startup"),
  startupController.createStartupProfile,
);

module.exports = router;
