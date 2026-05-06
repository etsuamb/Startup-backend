const router = require("express").Router();

const {
	authenticate,
	authorizeRoles,
	requireApproval,
} = require("../middleware/authMiddleware");
const mentorController = require("../controllers/mentorController");

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// Create profile with optional files: cv (single), certifications (multiple)
router.post(
	"/profile",
	authenticate,
	authorizeRoles("Mentor"),
	upload.fields([
		{ name: "cv", maxCount: 1 },
		{ name: "certifications", maxCount: 5 },
	]),
	mentorController.createMentorProfile,
);

// Update profile (allow edits and file uploads)
router.put(
	"/profile",
	authenticate,
	authorizeRoles("Mentor"),
	upload.fields([
		{ name: "cv", maxCount: 1 },
		{ name: "certifications", maxCount: 5 },
	]),
	mentorController.updateMentorProfile,
);

router.get(
	"/profile",
	authenticate,
	authorizeRoles("Mentor"),
	mentorController.getMyProfile,
);

router.get(
	"/all",
	authenticate,
	requireApproval,
	mentorController.getAllMentors,
);

// Discovery endpoint (same as /all)
router.get("/", authenticate, requireApproval, mentorController.getAllMentors);

// Get mentor detail including documents
router.get(
	"/:mentorId",
	authenticate,
	requireApproval,
	mentorController.getMentorById,
);

// Delete a mentor document (owner only)
router.delete(
	"/documents/:documentId",
	authenticate,
	authorizeRoles("Mentor"),
	mentorController.deleteMentorDocument,
);

// Replace a mentor document (owner only)
router.put(
	"/documents/:documentId/replace",
	authenticate,
	authorizeRoles("Mentor"),
	upload.single("file"),
	mentorController.replaceMentorDocument,
);

module.exports = router;
