const router = require("express").Router();

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

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
	upload.fields([
		{ name: "profile_picture", maxCount: 1 },
		{ name: "portfolio", maxCount: 10 },
	]),
	investorController.createInvestorProfile,
);

router.put(
	"/profile",
	authenticate,
	authorizeRoles("Investor"),
	upload.fields([
		{ name: "profile_picture", maxCount: 1 },
		{ name: "portfolio", maxCount: 10 },
	]),
	investorController.updateInvestorProfile,
);

router.delete(
	"/documents/:documentId",
	authenticate,
	authorizeRoles("Investor"),
	investorController.deleteInvestorDocument,
);

router.put(
	"/documents/:documentId",
	authenticate,
	authorizeRoles("Investor"),
	upload.fields([{ name: "document", maxCount: 1 }]),
	investorController.updateInvestorDocument,
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
