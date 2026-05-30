const router = require("express").Router();
const {
	authenticate,
	authorizeRoles,
} = require("../middleware/authMiddleware");
const ctrl = require("../controllers/adminDashboardController");
const monitoring = require("../controllers/adminMonitoringController");

const adminOnly = [authenticate, authorizeRoles("Admin")];

// Startup management
router.get("/startups", ...adminOnly, ctrl.listStartups);
router.get("/startups/:id", ...adminOnly, ctrl.getStartup);
router.patch("/startups/:id/status", ...adminOnly, ctrl.updateStartupStatus);
router.patch("/startups/:id/listing", ...adminOnly, ctrl.updateStartupListing);

// Mentor management
router.get("/mentors", ...adminOnly, ctrl.listMentors);
router.get("/mentors/:id", ...adminOnly, ctrl.getMentor);
router.patch("/mentors/:id/approval", ...adminOnly, ctrl.updateMentorApproval);

// Investor management
router.get("/investors", ...adminOnly, ctrl.listInvestors);
router.get("/investors/:id", ...adminOnly, ctrl.getInvestor);
router.patch("/investors/:id/approval", ...adminOnly, ctrl.updateInvestorApproval);

// Funding requests
router.get("/funding", ...adminOnly, ctrl.listFunding);
router.get("/funding/:id", ...adminOnly, ctrl.getFunding);
router.patch("/funding/:id/approval", ...adminOnly, ctrl.updateFundingApproval);

// Document verification
router.get("/documents", ...adminOnly, ctrl.listDocuments);
router.get("/documents/:id", ...adminOnly, ctrl.getDocument);
router.patch("/documents/:id/verification", ...adminOnly, ctrl.updateDocumentVerification);

// Events & meetings (mentorship sessions)
router.get("/events", ...adminOnly, ctrl.listEvents);
router.get("/events/:id", ...adminOnly, ctrl.getEvent);

// Communication monitoring
router.get("/chat/conversations", ...adminOnly, ctrl.listConversations);
router.get(
	"/chat/conversations/:id/messages",
	...adminOnly,
	ctrl.getConversationMessages,
);
router.get(
	"/chat/conversations/:id/video/status",
	...adminOnly,
	ctrl.getConversationVideoStatus,
);

// Analytics
router.get("/analytics/system", ...adminOnly, ctrl.analyticsSystem);
router.get("/analytics/startups", ...adminOnly, ctrl.analyticsStartups);
router.get("/analytics/funding", ...adminOnly, ctrl.analyticsFunding);
router.get("/analytics/engagement", ...adminOnly, ctrl.analyticsEngagement);

// Monitoring (security + suspicious activity)
router.get("/monitoring/summary", ...adminOnly, monitoring.getMonitoringSummary);
router.get("/monitoring/login-attempts", ...adminOnly, monitoring.listLoginAttempts);
router.get("/monitoring/security-events", ...adminOnly, monitoring.listSecurityEvents);

module.exports = router;
