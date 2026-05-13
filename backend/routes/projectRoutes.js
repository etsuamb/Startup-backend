const router = require("express").Router();
const multer = require("multer");
const uploadMemory = multer({ storage: multer.memoryStorage() });

const {
	authenticate,
	authorizeRoles,
	requireApproval,
} = require("../middleware/authMiddleware");

const projectController = require("../controllers/projectController");
const projectStartupDetailsController = require("../controllers/projectStartupDetailsController");

router.post(
	"/create",
	authenticate,
	requireApproval,
	authorizeRoles("Startup"),
	uploadMemory.fields([
		{ name: "pitch_deck", maxCount: 1 },
		{ name: "business_plan", maxCount: 1 },
		{ name: "financial_projection", maxCount: 1 },
		{ name: "tax_clearance", maxCount: 1 },
		{ name: "cover_photo", maxCount: 1 },
		{ name: "demo_video", maxCount: 1 },
	]),
	projectController.createProject,
);

// Startup "My projects" list — GET /api/projects (empty until admin approved)
router.get(
	"/",
	authenticate,
	authorizeRoles("Startup"),
	projectStartupDetailsController.listStartupProjects,
);

router.get(
	"/my",
	authenticate,
	requireApproval,
	authorizeRoles("Startup"),
	projectController.getMyProjects,
);

router.get(
	"/all",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	projectController.getAllProjects,
);

router.get(
	"/:projectId/status",
	authenticate,
	authorizeRoles("Startup"),
	projectStartupDetailsController.getStartupProjectStatus,
);
router.get(
	"/:projectId/progress",
	authenticate,
	authorizeRoles("Startup"),
	projectStartupDetailsController.getStartupProjectProgress,
);
router.get(
	"/:projectId/funding",
	authenticate,
	authorizeRoles("Startup"),
	projectStartupDetailsController.getStartupProjectFunding,
);
router.get(
	"/:projectId/documents",
	authenticate,
	authorizeRoles("Startup"),
	projectStartupDetailsController.getStartupProjectDocuments,
);
router.get(
	"/:projectId/feedback",
	authenticate,
	authorizeRoles("Startup"),
	projectStartupDetailsController.getStartupProjectFeedback,
);
router.get(
	"/:projectId/events",
	authenticate,
	authorizeRoles("Startup"),
	projectStartupDetailsController.getStartupProjectEvents,
);
router.get(
	"/:projectId/activity",
	authenticate,
	authorizeRoles("Startup"),
	projectStartupDetailsController.getStartupProjectActivity,
);

router.get(
	"/:projectId",
	authenticate,
	authorizeRoles("Startup"),
	projectStartupDetailsController.getStartupProjectDetail,
);

router.put(
	"/:projectId",
	authenticate,
	requireApproval,
	authorizeRoles("Startup"),
	projectController.updateProject,
);

router.delete(
	"/:projectId",
	authenticate,
	requireApproval,
	authorizeRoles("Startup"),
	projectController.deleteProject,
);

module.exports = router;
