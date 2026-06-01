const router = require("express").Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const {
	authenticate,
	authorizeRoles,
	requireApproval,
} = require("../middleware/authMiddleware");

const projectController = require("../controllers/projectController");

router.post(
	"/create",
	authenticate,
	requireApproval,
	authorizeRoles("Startup"),
	upload.fields([
		{ name: "pitch_deck", maxCount: 1 },
		{ name: "business_plan", maxCount: 1 },
		{ name: "financial_projection", maxCount: 1 },
		{ name: "demo_video", maxCount: 1 },
	]),
	projectController.createProject,
);

router.get(
	"/my",
	authenticate,
	requireApproval,
	authorizeRoles("Startup"),
	projectController.getMyProjects,
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

router.get(
	"/all",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	projectController.getAllProjects,
);

module.exports = router;
