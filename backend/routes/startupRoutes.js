const router = require("express").Router();

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const {
	authenticate,
	authorizeRoles,
} = require("../middleware/authMiddleware");

const startupController = require("../controllers/startupController");
const startupDashboardController = require("../controllers/startupDashboardController");
const discoverRoutes = require("./discoverRoutes");
const chatRoutesModule = require("./chatRoutes");
const { buildMentorChatRoutes } = require("./mentorChatRoutes");

/** Startup app: same chat/video paths as /api/chat, scoped to Startup role (e.g. GET /api/startups/chat/conversations). */
router.use(
	"/chat",
	chatRoutesModule.buildChatRoutes([authenticate, authorizeRoles("Startup")]),
);

/** Mentor–startup chat + video (Startup JWT). Base: /api/startups/mentor-chat */
router.use(
	"/mentor-chat",
	buildMentorChatRoutes([authenticate, authorizeRoles("Startup")]),
);

router.use("/discover", discoverRoutes);

// Create startup profile
router.post(
	"/profile",
	authenticate,
	authorizeRoles("Startup"),
	upload.fields([
		{ name: "pitch_deck", maxCount: 1 },
		{ name: "business_plan", maxCount: 1 },
	]),
	startupController.createStartupProfile,
);

// Get current startup profile
router.get(
	"/me",
	authenticate,
	authorizeRoles("Startup"),
	startupController.getMyStartupProfile,
);

// Update existing startup profile
router.put(
	"/profile",
	authenticate,
	authorizeRoles("Startup"),
	upload.fields([
		{ name: "pitch_deck", maxCount: 1 },
		{ name: "business_plan", maxCount: 1 },
	]),
	startupController.updateStartupProfile,
);

// Get startup documents
router.get(
	"/documents",
	authenticate,
	authorizeRoles("Startup"),
	startupController.getStartupDocuments,
);

// --- Startup dashboard (authenticated Startup user) ---
router.get(
	"/dashboard/startup-info",
	authenticate,
	authorizeRoles("Startup"),
	startupDashboardController.getStartupInfo,
);
router.get(
	"/dashboard/mentor-updates",
	authenticate,
	authorizeRoles("Startup"),
	startupDashboardController.getMentorUpdates,
);
router.get(
	"/dashboard/status",
	authenticate,
	authorizeRoles("Startup"),
	startupDashboardController.getStartupStatus,
);
router.get(
	"/dashboard/progress",
	authenticate,
	authorizeRoles("Startup"),
	startupDashboardController.getProjectProgress,
);
router.get(
	"/dashboard/funding",
	authenticate,
	authorizeRoles("Startup"),
	startupDashboardController.getFundingSummary,
);
router.get(
	"/dashboard/documents",
	authenticate,
	authorizeRoles("Startup"),
	startupDashboardController.getDocumentsStatus,
);
router.get(
	"/dashboard/feedback",
	authenticate,
	authorizeRoles("Startup"),
	startupDashboardController.getLatestFeedback,
);
router.get(
	"/dashboard/events",
	authenticate,
	authorizeRoles("Startup"),
	startupDashboardController.getUpcomingEvents,
);
router.get(
	"/dashboard/activity",
	authenticate,
	authorizeRoles("Startup"),
	startupDashboardController.getRecentActivity,
);
router.post(
	"/dashboard/actions",
	authenticate,
	authorizeRoles("Startup"),
	startupDashboardController.postQuickActions,
);

module.exports = router;
