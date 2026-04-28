const router = require("express").Router();

const {
  authenticate,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const investorController = require("../controllers/investorController");

router.post(
  "/profile",
  authenticate,
  authorizeRoles("Investor"),
  investorController.createInvestorProfile,
);

module.exports = router;
