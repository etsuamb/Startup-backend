const router = require("express").Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const {
	authenticate,
	authorizeRoles,
	requireApproval,
} = require("../middleware/authMiddleware");
const mentorshipController = require("../controllers/mentorshipController");
const mentorshipAdvancedController = require("../controllers/mentorshipAdvancedController");

// Startup flows
router.post(
	"/requests",
	authenticate,
	requireApproval,
	authorizeRoles("Startup"),
	mentorshipController.createMentorshipRequest,
);

router.get(
	"/requests/outgoing",
	authenticate,
	authorizeRoles("Startup"),
	mentorshipController.getStartupMentorshipRequests,
);

// Mentor flows
router.get(
	"/requests/incoming",
	authenticate,
	authorizeRoles("Mentor"),
	mentorshipController.getMentorIncomingRequests,
);

router.put(
	"/requests/:requestId/respond",
	authenticate,
	requireApproval,
	authorizeRoles("Mentor"),
	mentorshipController.respondToMentorshipRequest,
);

router.post(
	"/sessions",
	authenticate,
	requireApproval,
	authorizeRoles("Mentor"),
	mentorshipController.scheduleMentorshipSession,
);

router.get(
	"/sessions",
	authenticate,
	mentorshipAdvancedController.listMentorshipSessions,
);

router.get(
	"/sessions/:sessionId",
	authenticate,
	mentorshipAdvancedController.getMentorshipSessionById,
);

router.post(
	"/reports",
	authenticate,
	requireApproval,
	authorizeRoles("Mentor"),
	mentorshipAdvancedController.createMentorshipReport,
);

router.get(
	"/reports",
	authenticate,
	mentorshipAdvancedController.getMentorshipReports,
);

router.post(
	"/resources",
	authenticate,
	requireApproval,
	authorizeRoles("Mentor"),
	upload.single("file"),
	mentorshipAdvancedController.shareMentorshipResource,
);

router.get(
	"/resources",
	authenticate,
	mentorshipAdvancedController.getMentorshipResources,
);

router.post(
	"/payments",
	authenticate,
	requireApproval,
	authorizeRoles("Startup"),
	mentorshipAdvancedController.createMentorshipPayment,
);

router.get(
	"/payments",
	authenticate,
	mentorshipAdvancedController.getMentorshipPayments,
);

router.post(
	"/chat/messages",
	authenticate,
	requireApproval,
	mentorshipAdvancedController.sendMentorshipMessage,
);

router.get(
	"/chat/conversation/:otherUserId",
	authenticate,
	mentorshipAdvancedController.getMentorshipConversation,
);

router.put(
	"/sessions/:sessionId",
	authenticate,
	requireApproval,
	authorizeRoles("Mentor"),
	mentorshipController.updateMentorshipSessionStatus,
);

// Shared history (role-checked in controller)
router.get(
	"/history",
	authenticate,
	requireApproval,
	mentorshipController.getMentorshipHistory,
);

module.exports = router;
