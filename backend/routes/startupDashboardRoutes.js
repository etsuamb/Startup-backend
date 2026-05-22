const router = require("express").Router();
const {
	authenticate,
	authorizeRoles,
} = require("../middleware/authMiddleware");
const ctrl = require("../controllers/startupDashboardController");

const startupOnly = [authenticate, authorizeRoles("Startup")];

// Dashboard data endpoints
router.get("/activity", ...startupOnly, ctrl.getRecentActivity);
router.get("/feedback", ...startupOnly, ctrl.getLatestFeedback);
router.get("/events", ...startupOnly, ctrl.getUpcomingEvents);
router.get("/status", ...startupOnly, ctrl.getStartupStatus);
router.get("/progress", ...startupOnly, ctrl.getProjectProgress);
router.get("/funding", ...startupOnly, ctrl.getFundingSummary);
router.get("/documents", ...startupOnly, ctrl.getDocumentsStatus);
router.get("/mentor-updates", ...startupOnly, ctrl.getMentorUpdates);
router.get("/info", ...startupOnly, ctrl.getStartupInfo);
router.post("/quick-actions", ...startupOnly, ctrl.postQuickActions);

module.exports = router;
