const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const allowedResourceExtensions = new Set([".pdf", ".doc", ".docx", ".ppt", ".pptx", ".png", ".jpg", ".jpeg"]);
const upload = multer({
	dest: "uploads/",
	limits: { fileSize: 25 * 1024 * 1024 },
	fileFilter: (_req, file, callback) => {
		const extension = path.extname(file.originalname || "").toLowerCase();
		callback(
			allowedResourceExtensions.has(extension) ? null : new Error("Unsupported resource file type"),
			allowedResourceExtensions.has(extension),
		);
	},
});

function uploadMentorshipResource(req, res, next) {
	upload.single("file")(req, res, (err) => {
		if (!err) return next();
		const message =
			err.code === "LIMIT_FILE_SIZE"
				? "Resource files must be 25 MB or smaller"
				: err.message || "Unable to upload resource file";
		return res.status(400).json({ error: message });
	});
}

const {
	authenticate,
	authorizeRoles,
	requireApproval,
} = require("../middleware/authMiddleware");
const mentorshipController = require("../controllers/mentorshipController");
const mentorshipAdvancedController = require("../controllers/mentorshipAdvancedController");

// Startup mentorship flows
router.post(
	"/request",
	authenticate,
	requireApproval,
	authorizeRoles("Startup"),
	mentorshipController.createMentorshipRequest,
);

router.get(
	"/my-requests",
	authenticate,
	authorizeRoles("Startup"),
	mentorshipController.getStartupMentorshipRequests,
);

router.post(
	"/session",
	authenticate,
	requireApproval,
	authorizeRoles("Startup"),
	mentorshipController.createMentorshipSessionForStartup,
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

router.put(
	"/sessions/:sessionId",
	authenticate,
	requireApproval,
	authorizeRoles("Mentor"),
	mentorshipController.updateMentorshipSessionStatus,
);

// Shared mentorship history
router.get(
	"/history",
	authenticate,
	requireApproval,
	mentorshipController.getMentorshipHistory,
);

// Admin-only report generation
router.post(
	"/reports/generate-missing",
	authenticate,
	authorizeRoles("Admin"),
	mentorshipController.generateMissingReports,
);

// Advanced mentorship resources and chat
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
	uploadMentorshipResource,
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

router.get(
	"/sessions",
	authenticate,
	mentorshipAdvancedController.listMentorshipSessions,
);

router.get(
	"/sessions/:sessionId/calendar.ics",
	authenticate,
	requireApproval,
	mentorshipAdvancedController.downloadMentorshipSessionCalendar,
);

router.get(
	"/sessions/:sessionId",
	authenticate,
	mentorshipAdvancedController.getMentorshipSessionById,
);

module.exports = router;
