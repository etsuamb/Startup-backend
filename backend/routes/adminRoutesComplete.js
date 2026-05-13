const router = require("express").Router();
const {
	authenticate,
	authorizeRoles,
} = require("../middleware/authMiddleware");
const adminController = require("../controllers/adminControllerComplete");

// ============================================
// USER MANAGEMENT ROUTES
// ============================================

// UC_5: List all users (search, filter, pagination)
router.get(
	"/users",
	authenticate,
	authorizeRoles("Admin"),
	adminController.listUsers
);

// UC_5b: Get specific user details
router.get(
	"/users/:userId",
	authenticate,
	authorizeRoles("Admin"),
	adminController.getUser
);

// UC_2: Approve user account
router.put(
	"/users/:userId/approve",
	authenticate,
	authorizeRoles("Admin"),
	adminController.approveUser
);

// UC_3: Reject user account
router.put(
	"/users/:userId/reject",
	authenticate,
	authorizeRoles("Admin"),
	adminController.rejectUser
);

// UC_4: Delete/disable user account
router.delete(
	"/users/:userId",
	authenticate,
	authorizeRoles("Admin"),
	adminController.deleteUser
);

// ============================================
// AUDIT & MONITORING ROUTES
// ============================================

// UC_6: Get audit logs
router.get(
	"/audit-logs",
	authenticate,
	authorizeRoles("Admin"),
	adminController.listAuditLogs
);

// ============================================
// STARTUP MANAGEMENT ROUTES
// ============================================

// UC_8: Get pending startups
router.get(
	"/startups/pending",
	authenticate,
	authorizeRoles("Admin"),
	adminController.listPendingStartups
);

// UC_8: Approve startup
router.put(
	"/startups/:startupId/approve",
	authenticate,
	authorizeRoles("Admin"),
	adminController.approveStartup
);

// UC_8: Reject startup
router.put(
	"/startups/:startupId/reject",
	authenticate,
	authorizeRoles("Admin"),
	adminController.rejectStartup
);

// ============================================
// INVESTMENT MANAGEMENT ROUTES
// ============================================

// UC_9: List all investments
router.get(
	"/investments",
	authenticate,
	authorizeRoles("Admin"),
	adminController.listInvestments
);

// UC_9: List investment requests
router.get(
	"/investment-requests",
	authenticate,
	authorizeRoles("Admin"),
	adminController.adminListInvestmentRequests
);

// UC_9: Update investment request status
router.put(
	"/investment-requests/:id/status",
	authenticate,
	authorizeRoles("Admin"),
	adminController.updateInvestmentRequestStatus
);

// ============================================
// PAYMENT MANAGEMENT ROUTES
// ============================================

// UC_10: List payments
router.get(
	"/payments",
	authenticate,
	authorizeRoles("Admin"),
	adminController.listPayments
);

// ============================================
// REPORTING ROUTES
// ============================================

// UC_11: Get usage reports
router.get(
	"/reports/usage",
	authenticate,
	authorizeRoles("Admin"),
	adminController.getUsageReport
);

// UC_11: Get investment reports
router.get(
	"/reports/investments",
	authenticate,
	authorizeRoles("Admin"),
	adminController.getInvestmentReport
);

// UC_11: Get mentorship reports
router.get(
	"/reports/mentorship",
	authenticate,
	authorizeRoles("Admin"),
	adminController.getMentorshipReport
);

// ============================================
// HELPER ROUTES
// ============================================

// List projects
router.get(
	"/projects",
	authenticate,
	authorizeRoles("Admin"),
	adminController.listProjects
);

module.exports = router;
