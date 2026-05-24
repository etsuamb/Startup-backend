const router = require("express").Router();

const {
	authenticate,
	authorizeRoles,
	requireApproval,
} = require("../middleware/authMiddleware");
const { attachVisibility } = require("../middleware/visibilityMiddleware");
const mentorController = require("../controllers/mentorController");
const mentorComplete = require("../controllers/mentorControllerComplete");
const mentorDashboard = require("../controllers/mentorDashboardController");
const { buildMentorChatRoutes } = require("./mentorChatRoutes");

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

/** Mentor–startup chat + video. Base: /api/mentors/mentor-chat */
router.use(
	"/mentor-chat",
	buildMentorChatRoutes([authenticate, authorizeRoles("Mentor")]),
);

// ——— Dashboard & profile (static paths before /:mentorId) ———

router.get(
	"/dashboard",
	authenticate,
	authorizeRoles("Mentor"),
	mentorDashboard.getDashboard,
);

router.get(
	"/profile",
	authenticate,
	authorizeRoles("Mentor"),
	mentorComplete.getMentorProfile,
);

router.get(
	"/profile/documents/:documentId",
	authenticate,
	authorizeRoles("Mentor"),
	mentorComplete.getMentorDocument,
);

router.post(
	"/profile",
	authenticate,
	authorizeRoles("Mentor"),
	upload.fields([
		{ name: "mentor_id", maxCount: 1 },
		{ name: "cv", maxCount: 1 },
		{ name: "certifications", maxCount: 10 },
		{ name: "intro_video", maxCount: 1 },
	]),
	mentorController.createMentorProfile,
);

router.put(
	"/profile",
	authenticate,
	authorizeRoles("Mentor"),
	upload.fields([
		{ name: "mentor_id", maxCount: 1 },
		{ name: "cv", maxCount: 1 },
		{ name: "certifications", maxCount: 10 },
		{ name: "intro_video", maxCount: 1 },
	]),
	mentorController.updateMentorProfile,
);

// ——— Mentorship requests & proposals ———

router.get(
	"/mentorship-requests",
	authenticate,
	authorizeRoles("Mentor"),
	mentorComplete.getMentorshipRequests,
);

router.put(
	"/mentorship-requests/:requestId/accept",
	authenticate,
	authorizeRoles("Mentor"),
	mentorComplete.acceptMentorshipRequest,
);

router.put(
	"/mentorship-requests/:requestId/reject",
	authenticate,
	authorizeRoles("Mentor"),
	mentorComplete.rejectMentorshipRequest,
);

router.post(
	"/proposals",
	authenticate,
	authorizeRoles("Mentor"),
	mentorComplete.sendMentorshipProposal,
);

// ——— Startup discovery & assigned startups ———

router.get(
	"/startups",
	authenticate,
	authorizeRoles("Mentor"),
	attachVisibility,
	mentorComplete.listStartups,
);

router.get(
	"/my-startups",
	authenticate,
	authorizeRoles("Mentor"),
	mentorDashboard.getMyStartups,
);

router.get(
	"/startups/:startupId/documents/:documentId",
	authenticate,
	authorizeRoles("Mentor"),
	mentorComplete.getStartupDocument,
);

router.get(
	"/startups/:startupId",
	authenticate,
	authorizeRoles("Mentor"),
	attachVisibility,
	mentorComplete.getStartupDetails,
);

router.get(
	"/mentorships",
	authenticate,
	authorizeRoles("Mentor"),
	mentorComplete.getMentorshipHistory,
);

// ——— Legacy chat (messages table) ———

router.post(
	"/chat/startups/:startupId/send",
	authenticate,
	authorizeRoles("Mentor"),
	mentorComplete.sendMessage,
);

router.get(
	"/chat/startups/:startupId/messages",
	authenticate,
	authorizeRoles("Mentor"),
	mentorComplete.getMessages,
);

// ——— Public mentor directory (must stay after static routes) ———

router.get(
	"/all",
	authenticate,
	requireApproval,
	mentorController.getAllMentors,
);

router.get(
	"/:mentorId",
	authenticate,
	requireApproval,
	mentorController.getMentorById,
);

module.exports = router;
