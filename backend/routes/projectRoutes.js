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
	"/all",
	authenticate,
	requireApproval,
	authorizeRoles("Investor"),
	projectController.getAllProjects,
);

module.exports = router;
