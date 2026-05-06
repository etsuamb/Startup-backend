const router = require("express").Router();

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
	projectController.createProject,
);

router.get(
	"/mine",
	authenticate,
	requireApproval,
	authorizeRoles("Startup"),
	projectController.getMyProjects,
);

router.get(
	"/all",
	authenticate,
	requireApproval,
	projectController.getAllProjects,
);

router.get(
	"/:projectId",
	authenticate,
	requireApproval,
	projectController.getProjectById,
);

router.put(
	"/:projectId",
	authenticate,
	requireApproval,
	authorizeRoles("Startup"),
	projectController.updateMyProject,
);

module.exports = router;
