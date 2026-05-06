const router = require("express").Router();

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const {
	authenticate,
	authorizeRoles,
	requireApproval,
} = require("../middleware/authMiddleware");

const startupController = require("../controllers/startupController");

// Accept startup form fields plus optional document uploads from Postman
router.post(
	"/profile",
	authenticate,
	authorizeRoles("Startup"),
	upload.fields([
		{ name: "file", maxCount: 1 },
		{ name: "pitch_deck", maxCount: 1 },
		{ name: "business_plan", maxCount: 1 },
	]),
	startupController.createStartupProfile,
);

router.get(
	"/profile",
	authenticate,
	authorizeRoles("Startup"),
	startupController.getMyStartupProfile,
);

// Update existing profile
router.put(
	"/profile",
	authenticate,
	authorizeRoles("Startup"),
	upload.fields([
		{ name: "file", maxCount: 1 },
		{ name: "pitch_deck", maxCount: 1 },
		{ name: "business_plan", maxCount: 1 },
	]),
	startupController.updateStartupProfile,
);

router.get(
	"/discover",
	authenticate,
	requireApproval,
	authorizeRoles("Startup"),
	startupController.searchInvestorsAndMentors,
);

router.get(
	"/recommendations",
	authenticate,
	requireApproval,
	authorizeRoles("Startup"),
	startupController.getRecommendations,
);

router.get(
	"/dashboard",
	authenticate,
	requireApproval,
	authorizeRoles("Startup"),
	startupController.getDashboardStatus,
);

module.exports = router;
