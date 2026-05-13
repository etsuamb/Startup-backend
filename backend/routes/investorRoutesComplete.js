const router = require("express").Router();
const multer = require("multer");
const {
	authenticate,
	authorizeRoles,
} = require("../middleware/authMiddleware");
const investorController = require("../controllers/investorControllerComplete");

const upload = multer({ dest: "uploads/" });

// ============================================
// INVESTOR PROFILE
// ============================================

// UC_13b: Create/Update investor profile
router.post(
	"/profile",
	authenticate,
	authorizeRoles("Investor"),
	investorController.createInvestorProfile
);

// ============================================
// STARTUP DISCOVERY
// ============================================

// UC_14: View curated startup list
router.get(
	"/startups",
	authenticate,
	authorizeRoles("Investor"),
	investorController.listStartups
);

// UC_15: Search and filter startups
router.get(
	"/startups/search",
	authenticate,
	authorizeRoles("Investor"),
	investorController.searchStartups
);

// UC_16: Get AI recommendations for startups
router.get(
	"/recommendations/:investorId",
	authenticate,
	authorizeRoles("Investor"),
	investorController.getStartupRecommendations
);

// UC_17: View detailed startup profile
router.get(
	"/startups/:startupId",
	authenticate,
	authorizeRoles("Investor"),
	investorController.getStartupDetails
);

// ============================================
// INVESTMENT MANAGEMENT
// ============================================

// UC_18: Send funding offer to startup
router.post(
	"/funding-offers",
	authenticate,
	authorizeRoles("Investor"),
	investorController.sendFundingOffer
);

// UC_20: Get investment portfolio
router.get(
	"/portfolio",
	authenticate,
	authorizeRoles("Investor"),
	investorController.getPortfolio
);

// ============================================
// COMMUNICATION
// ============================================

// UC_23: Send message to startup
router.post(
	"/chat/startups/:startupId/send",
	authenticate,
	authorizeRoles("Investor"),
	investorController.sendMessage
);

// UC_23: Get messages from startup
router.get(
	"/chat/startups/:startupId/messages",
	authenticate,
	authorizeRoles("Investor"),
	investorController.getMessages
);

// ============================================
// FEEDBACK
// ============================================

// UC_25: Send feedback to startup
router.post(
	"/startups/:startupId/feedback",
	authenticate,
	authorizeRoles("Investor"),
	investorController.sendFeedback
);

module.exports = router;
