const router = require("express").Router();
const multer = require("multer");
const {
	authenticate,
	authorizeRoles,
	requireApproval,
} = require("../middleware/authMiddleware");
const { attachVisibility } = require("../middleware/visibilityMiddleware");
const startupController = require("../controllers/startupControllerComplete");

const upload = multer({ dest: "uploads/" });

// ============================================
// PROJECT MANAGEMENT
// ============================================

// UC_28: Create startup project
router.post(
	"/projects",
	authenticate,
	authorizeRoles("Startup"),
	requireApproval,
	upload.single("cover_photo"),
	startupController.createProject
);

// UC_28b: Get all my projects
router.get(
	"/projects",
	authenticate,
	authorizeRoles("Startup"),
	startupController.getMyProjects
);

// UC_28c: Get project details
router.get(
	"/projects/:projectId",
	authenticate,
	authorizeRoles("Startup"),
	startupController.getProjectDetails
);

// UC_28d: Update project
router.put(
	"/projects/:projectId",
	authenticate,
	authorizeRoles("Startup"),
	requireApproval,
	upload.single("cover_photo"),
	startupController.updateProject
);

// ============================================
// DOCUMENT MANAGEMENT
// ============================================

// UC_29: Upload document
router.post(
	"/documents",
	authenticate,
	authorizeRoles("Startup"),
	requireApproval,
	upload.single("file"),
	startupController.uploadDocument
);

// UC_29: Get documents
router.get(
	"/documents",
	authenticate,
	authorizeRoles("Startup"),
	startupController.getDocuments
);

router.delete(
	"/documents/:documentId",
	authenticate,
	authorizeRoles("Startup"),
	requireApproval,
	startupController.deleteDocument
);

router.post(
	"/projects/:projectId/publish",
	authenticate,
	authorizeRoles("Startup"),
	requireApproval,
	startupController.publishProject
);

// ============================================
// INVESTOR DISCOVERY
// ============================================

// UC_31: Search investors
router.get(
	"/investors/search",
	authenticate,
	authorizeRoles("Startup"),
	requireApproval,
	attachVisibility,
	startupController.searchInvestors
);

// UC_31: Search mentors
router.get(
	"/mentors/search",
	authenticate,
	authorizeRoles("Startup"),
	requireApproval,
	attachVisibility,
	startupController.searchMentors
);

// UC_32: Get AI investor recommendations
router.get(
	"/recommendations/investors",
	authenticate,
	authorizeRoles("Startup"),
	requireApproval,
	startupController.getInvestorRecommendations
);

// UC_32: Get AI mentor recommendations
router.get(
	"/recommendations/mentors",
	authenticate,
	authorizeRoles("Startup"),
	requireApproval,
	startupController.getMentorRecommendations
);

// ============================================
// INVESTMENT REQUESTS
// ============================================

// UC_33: Create investment request
router.post(
	"/investment-requests",
	authenticate,
	authorizeRoles("Startup"),
	requireApproval,
	startupController.createInvestmentRequest
);

// ============================================
// MENTORSHIP REQUESTS
// ============================================

// UC_38: Create mentorship request
router.post(
	"/mentorship-requests",
	authenticate,
	authorizeRoles("Startup"),
	requireApproval,
	startupController.createMentorshipRequest
);

// ============================================
// COMMUNICATION
// ============================================

// UC_34: Send message to investor
router.post(
	"/chat/investors/:investorId/send",
	authenticate,
	authorizeRoles("Startup"),
	requireApproval,
	startupController.sendMessage
);

// UC_34: Get messages from investor
router.get(
	"/chat/investors/:investorId/messages",
	authenticate,
	authorizeRoles("Startup"),
	requireApproval,
	startupController.getMessages
);

module.exports = router;
