const router = require("express").Router();

const {
	authenticate,
	authorizeRoles,
} = require("../../middleware/authMiddleware");
const adminController = require("../../controllers/adminController");

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
