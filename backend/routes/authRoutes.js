const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
	authenticate,
	authorizeRoles,
} = require("../middleware/authMiddleware");

// Register user
router.post("/register", authController.register);

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
