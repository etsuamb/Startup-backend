const router = require("express").Router();

const {
	authenticate,
	authorizeRoles,
	requireApproval,
} = require("../middleware/authMiddleware");

const investmentController = require("../controllers/investmentController");

router.post(
	"/request",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investmentController.createInvestmentRequest,
);

module.exports = router;
