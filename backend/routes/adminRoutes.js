const router = require("express").Router();

const {
	authenticate,
	authorizeRoles,
} = require("../middleware/authMiddleware");
const mentorshipAdvancedController = require("../controllers/mentorshipAdvancedController");
const adminController = require("../controllers/adminController");

router.get(
	"/mentorship/overview",
	authenticate,
	authorizeRoles("Admin"),
	mentorshipAdvancedController.adminMentorshipOverview,
);

router.get(
	"/mentorship/requests",
	authenticate,
	authorizeRoles("Admin"),
	mentorshipAdvancedController.adminListMentorshipRequests,
);

router.get(
	"/mentorship/sessions",
	authenticate,
	authorizeRoles("Admin"),
	mentorshipAdvancedController.adminListMentorshipSessions,
);

router.get(
	"/mentorship/reports",
	authenticate,
	authorizeRoles("Admin"),
	mentorshipAdvancedController.adminListMentorshipReports,
);

router.get(
	"/mentorship/resources",
	authenticate,
	authorizeRoles("Admin"),
	mentorshipAdvancedController.adminListMentorshipResources,
);

router.get(
	"/mentorship/payments",
	authenticate,
	authorizeRoles("Admin"),
	mentorshipAdvancedController.adminListMentorshipPayments,
);

// Projects + investments admin
router.get(
	"/projects",
	authenticate,
	authorizeRoles("Admin"),
	adminController.listProjects,
);

router.get(
	"/investment-requests",
	authenticate,
	authorizeRoles("Admin"),
	adminController.adminListInvestmentRequests,
);

router.put(
	"/investment-requests/:id/status",
	authenticate,
	authorizeRoles("Admin"),
	adminController.updateInvestmentRequestStatus,
);

router.get(
	"/investments",
	authenticate,
	authorizeRoles("Admin"),
	adminController.listInvestments,
);

// Admin user approval workflow
router.get(
	"/users/pending",
	authenticate,
	authorizeRoles("Admin"),
	adminController.listPendingUsers,
);

router.get(
	"/users/pending/:userId",
	authenticate,
	authorizeRoles("Admin"),
	adminController.getPendingUser,
);

router.put(
	"/users/reject/:userId",
	authenticate,
	authorizeRoles("Admin"),
	adminController.rejectUser,
);

router.put(
	"/users/approve/:userId",
	authenticate,
	authorizeRoles("Admin"),
	adminController.approveUser,
);

router.get(
	"/documents/:documentId",
	authenticate,
	authorizeRoles("Admin"),
	adminController.getDocument,
);

router.get(
	"/mentor-documents/:documentId",
	authenticate,
	authorizeRoles("Admin"),
	adminController.getMentorDocument,
);

// Search users
router.get(
	"/users",
	authenticate,
	authorizeRoles("Admin"),
	adminController.searchUsers,
);

// Audit logs
router.get(
	"/audit-logs",
	authenticate,
	authorizeRoles("Admin"),
	adminController.listAuditLogs,
);

router.post(
	"/create-admin",
	authenticate,
	authorizeRoles("Admin"),
	adminController.createAdmin,
);

// Content moderation: projects
router.delete(
	"/projects/:projectId",
	authenticate,
	authorizeRoles("Admin"),
	adminController.removeProject,
);

router.put(
	"/projects/:projectId/restore",
	authenticate,
	authorizeRoles("Admin"),
	adminController.restoreProject,
);

// Content moderation: mentorship resources & documents
router.delete(
	"/mentorship/resources/:id",
	authenticate,
	authorizeRoles("Admin"),
	adminController.deleteMentorshipResource,
);

router.delete(
	"/documents/:documentId",
	authenticate,
	authorizeRoles("Admin"),
	adminController.deleteDocumentAdmin,
);

// Audit export
router.get(
	"/audit-logs/export",
	authenticate,
	authorizeRoles("Admin"),
	adminController.exportAuditLogs,
);

// Reports CSV export + schedule
router.get(
	"/reports/export",
	authenticate,
	authorizeRoles("Admin"),
	adminController.exportReportCSV,
);

router.post(
	"/reports/schedule",
	authenticate,
	authorizeRoles("Admin"),
	adminController.scheduleReport,
);

// Profile approvals (mentors / investors)
router.put(
	"/mentors/:mentorId/approve",
	authenticate,
	authorizeRoles("Admin"),
	adminController.approveMentor,
);

router.put(
	"/mentors/:mentorId/unapprove",
	authenticate,
	authorizeRoles("Admin"),
	adminController.unapproveMentor,
);

router.put(
	"/investors/:investorId/approve",
	authenticate,
	authorizeRoles("Admin"),
	adminController.approveInvestor,
);

router.put(
	"/investors/:investorId/unapprove",
	authenticate,
	authorizeRoles("Admin"),
	adminController.unapproveInvestor,
);

// Full user management
router.get(
	"/users/:userId",
	authenticate,
	authorizeRoles("Admin"),
	adminController.getUser,
);

router.delete(
	"/users/:userId",
	authenticate,
	authorizeRoles("Admin"),
	adminController.deleteUser,
);

// Startup management
router.get(
	"/startups",
	authenticate,
	authorizeRoles("Admin"),
	adminController.listStartups,
);

router.put(
	"/startups/:startupId/remove",
	authenticate,
	authorizeRoles("Admin"),
	adminController.removeStartupListing,
);

router.put(
	"/startups/:startupId/approve",
	authenticate,
	authorizeRoles("Admin"),
	adminController.approveStartup,
);

router.put(
	"/startups/:startupId/unapprove",
	authenticate,
	authorizeRoles("Admin"),
	adminController.unapproveStartup,
);

// Project status control
router.put(
	"/projects/:projectId/status",
	authenticate,
	authorizeRoles("Admin"),
	adminController.updateProjectStatus,
);

// Reports
router.get(
	"/reports/overview",
	authenticate,
	authorizeRoles("Admin"),
	adminController.reportsOverview,
);

// Maintenance
router.get(
	"/maintenance/status",
	authenticate,
	authorizeRoles("Admin"),
	adminController.maintenanceStatus,
);

router.post(
	"/maintenance/clear-audit-logs",
	authenticate,
	authorizeRoles("Admin"),
	adminController.clearOldAuditLogs,
);

module.exports = router;
