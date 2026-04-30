const router = require("express").Router();

const {
	authenticate,
	authorizeRoles,
	requireApproval,
} = require("../middleware/authMiddleware");
const mentorController = require("../controllers/mentorController");

router.post(
	"/profile",
	authenticate,
	authorizeRoles("Mentor"),
	mentorController.createMentorProfile,
);

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
	"/all",
	authenticate,
	requireApproval,
	mentorController.getAllMentors,
);

// Get mentor detail including documents
router.get(
	"/:mentorId",
	authenticate,
	requireApproval,
	mentorController.getMentorById,
);

module.exports = router;
