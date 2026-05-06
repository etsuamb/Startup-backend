const router = require("express").Router();

const {
	authenticate,
	authorizeRoles,
	requireApproval,
} = require("../middleware/authMiddleware");

const investorController = require("../controllers/investorController");

router.get(
	"/profile",
	authenticate,
	authorizeRoles("Investor"),
	investorController.getMyInvestorProfile,
);

router.post(
	"/profile",
	authenticate,
	/* profile creation allowed before approval */
	authorizeRoles("Investor"),
	investorController.createInvestorProfile,
);

router.put(
	"/profile",
	authenticate,
	authorizeRoles("Investor"),
	investorController.updateInvestorProfile,
);

router.get(
	"/",
	authenticate,
	requireApproval,
	investorController.getAllInvestors,
);

router.get(
	"/startups",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investorController.discoverStartups,
);

router.get(
	"/startups/recommendations",
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

router.get(
	"/portfolio",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	investorController.getInvestmentPortfolio,
);

module.exports = router;
