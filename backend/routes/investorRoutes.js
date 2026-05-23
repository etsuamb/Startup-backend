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
	"/settings",
	authenticate,
	authorizeRoles("Investor"),
	investorController.getInvestorSettings,
);

router.put(
	"/settings",
	authenticate,
	authorizeRoles("Investor"),
	investorController.updateInvestorSettings,
);

router.patch(
	"/settings/password",
	authenticate,
	authorizeRoles("Investor"),
	investorController.changeInvestorPassword,
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

router.patch(
	"/funding-offers/:offerId/withdraw",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investorController.withdrawFundingOffer,
);

router.get(
	"/portfolio",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investorController.getPortfolio,
);

router.get(
	"/meetings",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investorController.getMeetings,
);

router.post(
	"/meetings",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investorController.createMeeting,
);

router.patch(
	"/meetings/:meetingId",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investorController.updateMeeting,
);

router.post(
	"/chat/startups/:startupId/send",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investorController.sendMessage,
);

router.get(
	"/chat/conversations",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investorController.getMessageThreads,
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

router.get(
	"/ratings",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investorController.getRatings,
);

module.exports = router;
