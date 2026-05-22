const router = require("express").Router();

const {
	authenticate,
	authorizeRoles,
	requireApproval,
} = require("../middleware/authMiddleware");

const investorController = require("../controllers/investorControllerComplete");

router.post(
	"/profile",
	authenticate,
	/* profile creation allowed before approval */
	authorizeRoles("Investor"),
	investorController.createInvestorProfile,
);

router.get(
	"/profile",
	authenticate,
	authorizeRoles("Investor"),
	investorController.getMyInvestorProfile,
);

router.get(
	"/startups",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investorController.listStartups,
);

router.get(
	"/startups/search",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investorController.searchStartups,
);

router.get(
	"/recommendations",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investorController.getStartupRecommendations,
);

router.get(
	"/startups/:startupId",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investorController.getStartupDetails,
);

router.post(
	"/funding-offers",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investorController.sendFundingOffer,
);

router.get(
	"/funding-offers",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investorController.getFundingOffers,
);

router.patch(
	"/funding-offers/:offerId/accept",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investorController.acceptFundingOffer,
);

router.get(
	"/portfolio",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investorController.getPortfolio,
);

router.post(
	"/chat/startups/:startupId/send",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investorController.sendMessage,
);

router.get(
	"/chat/startups/:startupId/messages",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investorController.getMessages,
);

router.post(
	"/startups/:startupId/feedback",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investorController.sendFeedback,
);

module.exports = router;
