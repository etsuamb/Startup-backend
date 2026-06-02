const router = require("express").Router();
const multer = require("multer");
const {
	authenticate,
	authorizeRoles,
} = require("../middleware/authMiddleware");
const mentorController = require("../controllers/mentorControllerComplete");

const upload = multer({ dest: "uploads/" });

// ============================================
// MENTOR PROFILE
// ============================================

// UC_44b: Create mentor profile (already in existing routes)
// UC_44c: Update mentor profile
router.put(
	"/profile",
	authenticate,
	authorizeRoles("Mentor"),
	mentorController.updateMentorProfile
);

// UC_44d: Get my mentor profile
router.get(
	"/profile",
	authenticate,
	authorizeRoles("Mentor"),
	mentorController.getMentorProfile
);

router.get(
	"/profile/documents/:documentId",
	authenticate,
	authorizeRoles("Mentor"),
	mentorController.getMentorDocument
);

// ============================================
// MENTORSHIP REQUESTS
// ============================================

// UC_45: Get mentorship requests
router.get(
	"/mentorship-requests",
	authenticate,
	authorizeRoles("Mentor"),
	mentorController.getMentorshipRequests
);

// UC_45: Accept mentorship request
router.put(
	"/mentorship-requests/:requestId/accept",
	authenticate,
	authorizeRoles("Mentor"),
	mentorController.acceptMentorshipRequest
);

// UC_45: Reject mentorship request
router.put(
	"/mentorship-requests/:requestId/reject",
	authenticate,
	authorizeRoles("Mentor"),
	mentorController.rejectMentorshipRequest
);

// UC_46: Send mentorship proposal
router.post(
	"/proposals",
	authenticate,
	authorizeRoles("Mentor"),
	mentorController.sendMentorshipProposal
);

// ============================================
// STARTUP DISCOVERY
// ============================================

// UC_47: List available startups
router.get(
	"/startups",
	authenticate,
	authorizeRoles("Mentor"),
	mentorController.listStartups
);

// UC_47a: Get available filter options
router.get(
	"/startups/filter-options",
	authenticate,
	authorizeRoles("Mentor"),
	mentorController.getFilterOptions
);

// UC_47: View startup details
router.get(
	"/startups/:startupId/documents/:documentId",
	authenticate,
	authorizeRoles("Mentor"),
	mentorController.getStartupDocument
);

router.get(
	"/startups/:startupId",
	authenticate,
	authorizeRoles("Mentor"),
	mentorController.getStartupDetails
);

// ============================================
// RESOURCES
// ============================================

// UC_48: Upload learning resource
router.post(
	"/resources",
	authenticate,
	authorizeRoles("Mentor"),
	upload.single("file"),
	mentorController.uploadResource
);

// ============================================
// MENTORSHIP SESSIONS
// ============================================

// UC_49: Schedule mentorship session
router.post(
	"/sessions",
	authenticate,
	authorizeRoles("Mentor"),
	mentorController.scheduleMentorshipSession
);

// UC_49: Get mentorship sessions
router.get(
	"/sessions",
	authenticate,
	authorizeRoles("Mentor"),
	mentorController.getMentorshipSessions
);

// ============================================
// COMMUNICATION
// ============================================

// UC_51: Send message to startup
router.post(
	"/chat/startups/:startupId/send",
	authenticate,
	authorizeRoles("Mentor"),
	mentorController.sendMessage
);

// UC_51: Get messages from startup
router.get(
	"/chat/startups/:startupId/messages",
	authenticate,
	authorizeRoles("Mentor"),
	mentorController.getMessages
);

// ============================================
// MENTORSHIP REPORTS
// ============================================

// UC_53: Submit mentorship report
router.post(
	"/reports",
	authenticate,
	authorizeRoles("Mentor"),
	mentorController.submitReport
);

// UC_54: Get mentorship history
router.get(
	"/mentorships",
	authenticate,
	authorizeRoles("Mentor"),
	mentorController.getMentorshipHistory
);

module.exports = router;
