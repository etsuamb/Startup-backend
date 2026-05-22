const router = require("express").Router();

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const {
  authenticate,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const startupController = require("../controllers/startupController");
const startupDashboardController = require("../controllers/startupDashboardController");

// Public featured startup listing
router.get("/featured", startupController.listFeaturedStartups);

router.get(
  "/dashboard/info",
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
  "/dashboard/project-progress",
  authenticate,
  authorizeRoles("Startup"),
  startupDashboardController.getProjectProgress,
);

router.get(
  "/dashboard/funding-summary",
  authenticate,
  authorizeRoles("Startup"),
  startupDashboardController.getFundingSummary,
);

router.get(
  "/dashboard/documents-status",
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
  "/dashboard/quick-actions",
  authenticate,
  authorizeRoles("Startup"),
  startupDashboardController.postQuickActions,
);

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

// Public search for startups (supports query, industry, stage, page, limit)
router.get("/search", startupController.searchPublicStartups);

// Get all offers (investment and mentorship) for a startup
router.get(
  "/offers",
  authenticate,
  authorizeRoles("Startup"),
  startupController.getStartupOffers,
);

// Get detailed information about a specific offer
router.get(
  "/offers/:offerType/:offerId",
  authenticate,
  authorizeRoles("Startup"),
  startupController.getOfferDetails,
);

// Accept or reject an offer
router.patch(
  "/offers/:offerType/:offerId",
  authenticate,
  authorizeRoles("Startup"),
  startupController.updateOfferStatus,
);

module.exports = router;
