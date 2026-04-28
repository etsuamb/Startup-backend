const router = require("express").Router();

const {
  authenticate,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const projectController = require("../controllers/projectController");

router.post(
  "/create",
  authenticate,
  authorizeRoles("Startup"),
  projectController.createProject,
);

router.get(
  "/all",
  authenticate,
  authorizeRoles("Investor"),
  projectController.getAllProjects,
);

module.exports = router;
