const express = require("express");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const router = express.Router();
const authController = require("../controllers/authController");
const {
	authenticate,
	authorizeRoles,
} = require("../middleware/authMiddleware");

// Register user
router.post(
	"/register",
	upload.fields([
		{ name: "founder_id", maxCount: 1 },
		{ name: "business_registration_proof", maxCount: 1 },
		{ name: "support_affiliation_letter", maxCount: 1 },
		{ name: "tin_certificate", maxCount: 1 },
		{ name: "registration_doc", maxCount: 1 },
		{ name: "trade_license", maxCount: 1 },
		{ name: "certifications", maxCount: 15 },
		{ name: "intro_video", maxCount: 1 },
	]),
	authController.register,
);

// Login user
router.post("/login", authController.login);

// Refresh access token
router.post("/refresh", authController.refresh);

// Logout (revoke refresh token)
router.post("/logout", authController.logout);

// Approve user (Admin only)
router.put(
	"/approve/:userId",
	authenticate,
	authorizeRoles("Admin"),
	authController.approveUser,
);

module.exports = router;
