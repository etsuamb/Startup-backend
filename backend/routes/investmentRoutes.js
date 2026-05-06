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

router.get(
	"/requests",
	authenticate,
	requireApproval,
	investmentController.listInvestmentRequests,
);

router.put(
	"/requests/:requestId/respond",
	authenticate,
	requireApproval,
	investmentController.respondToInvestmentRequest,
);

router.post(
	"/requests/:requestId/payments",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investmentController.recordInvestmentPayment,
);

router.get(
	"/payments",
	authenticate,
	requireApproval,
	investmentController.listInvestmentPayments,
);

router.post(
	"/requests/:requestId/feedback",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investmentController.submitInvestorFeedback,
);

router.get(
	"/feedback",
	authenticate,
	requireApproval,
	authorizeRoles("Startup"),
	investmentController.listInvestorFeedback,
);

module.exports = router;
