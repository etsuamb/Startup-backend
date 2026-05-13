const router = require("express").Router();

const {
	authenticate,
	authorizeRoles,
	requireApproval,
} = require("../middleware/authMiddleware");

const investmentController = require("../controllers/investmentController");

router.get(
	"/requests",
	authenticate,
	requireApproval,
	authorizeRoles("Startup"),
	investmentController.getInvestmentRequests,
);

router.patch(
	"/:requestId",
	authenticate,
	requireApproval,
	authorizeRoles("Startup"),
	investmentController.updateInvestmentRequest,
);

router.post(
	"/request",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investmentController.createInvestmentRequest,
);

module.exports = router;
