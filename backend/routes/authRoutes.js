const express = require("express");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const router = express.Router();
const authController = require("../controllers/authController");
const { authRateLimit } = require("../middleware/authRateLimit");
const authSecurityController = require("../controllers/authSecurityController");
const validateRegistrationUploadFormats = require("../middleware/registrationUploadValidation");
const {
	authenticate,
	authorizeRoles,
	requireApproval,
} = require("../middleware/authMiddleware");

// Register user
router.post(
	"/register",
	upload.fields([
		{ name: "profile_picture", maxCount: 1 },
		{ name: "founder_id", maxCount: 1 },
		{ name: "startup_logo", maxCount: 1 },
		{ name: "business_registration_proof", maxCount: 1 },
		{ name: "support_affiliation_letter", maxCount: 1 },
		{ name: "tin_certificate", maxCount: 1 },
		{ name: "registration_doc", maxCount: 1 },
		{ name: "trade_license", maxCount: 1 },
		{ name: "mentor_id", maxCount: 1 },
		{ name: "certifications", maxCount: 15 },
		{ name: "intro_video", maxCount: 1 },
	]),
	validateRegistrationUploadFormats,
	authController.register,
);

router.get("/profile-picture", authenticate, authController.getProfilePicture);

// Login user
router.post("/login", authRateLimit({ scope: "login", max: 20 }), authController.login);

// Email validation (pre-check before register)
router.post(
	"/validate-email",
	authRateLimit({ scope: "validate-email", max: 30 }),
	authSecurityController.validateEmailInput,
);
router.post(
	"/registration-email/start",
	authRateLimit({ scope: "registration-email", max: 10 }),
	authSecurityController.startRegistrationEmailVerification,
);
router.get(
	"/registration-email/status",
	authRateLimit({ scope: "registration-email-status", max: 120 }),
	authSecurityController.getRegistrationEmailVerificationStatus,
);

// Email verification & password reset
router.get("/verify-email", authSecurityController.verifyEmail);
router.post("/verify-email", authSecurityController.verifyEmail);
router.get("/me", authenticate, authSecurityController.getCurrentAccount);
router.put("/me", authenticate, authSecurityController.updateCurrentAccount);
router.post(
	"/resend-verification",
	authRateLimit({ scope: "resend-verify", max: 5 }),
	authSecurityController.resendVerification,
);
router.post(
	"/forgot-password",
	authRateLimit({ scope: "forgot-password", max: 5 }),
	authSecurityController.forgotPassword,
);
router.post(
	"/reset-password",
	authRateLimit({ scope: "reset-password", max: 10 }),
	authSecurityController.resetPassword,
);

// Google OAuth
router.post("/google", authRateLimit({ scope: "google", max: 20 }), authSecurityController.googleAuth);
router.post("/google/complete-role", authSecurityController.googleCompleteRole);

// Two-factor authentication
router.post(
	"/login/verify-2fa",
	authRateLimit({ scope: "verify-2fa", max: 15 }),
	authSecurityController.verifyLogin2FA,
);
router.get("/2fa/status", authenticate, requireApproval, authSecurityController.get2FAStatus);
router.get("/2fa/setup", authenticate, requireApproval, authSecurityController.setup2FA);
router.post("/2fa/send-enable-otp", authenticate, requireApproval, authSecurityController.sendEnable2FAOtp);
router.post("/2fa/enable", authenticate, requireApproval, authSecurityController.enable2FA);
router.post("/2fa/disable", authenticate, requireApproval, authSecurityController.disable2FA);

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

// Change admin password (Admin only, authenticated)
router.put(
	"/admin/change-password",
	authenticate,
	authorizeRoles("Admin"),
	authController.changeAdminPassword,
);

// Active session tracking (Authenticated)
router.get("/sessions", authenticate, requireApproval, authController.getActiveSessions);
router.delete("/sessions/:token", authenticate, requireApproval, authController.revokeSession);
router.delete("/sessions", authenticate, requireApproval, authController.revokeAllOtherSessions);

module.exports = router;
