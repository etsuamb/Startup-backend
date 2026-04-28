const router = require("express").Router();

const {
  authenticate,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const investmentController = require("../controllers/investmentController");

router.post(
  "/request",
  authenticate,
  authorizeRoles("Investor"),
  investmentController.createInvestmentRequest,
);

module.exports = router;
