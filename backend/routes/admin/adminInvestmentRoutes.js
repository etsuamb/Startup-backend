const router = require("express").Router();

const {
	authenticate,
	authorizeRoles,
} = require("../../middleware/authMiddleware");
const adminController = require("../../controllers/adminController");

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

router.put(
	"/projects/:projectId/status",
	authenticate,
	authorizeRoles("Admin"),
	adminController.updateProjectStatus,
);

router.get(
	"/sessions",
	authenticate,
	authorizeRoles("Admin"),
	adminController.listSessions,
);

router.get(
	"/payments",
	authenticate,
	authorizeRoles("Admin"),
	adminController.listPayments,
);

module.exports = router;
