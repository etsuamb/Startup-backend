const router = require("express").Router();

const {
	authenticate,
	authorizeRoles,
	requireApproval,
} = require("../middleware/authMiddleware");

const investorController = require("../controllers/investorController");

router.post(
	"/profile",
	authenticate,
	/* profile creation allowed before approval */
	authorizeRoles("Investor"),
	investorController.createInvestorProfile,
);

// (example) protect other investor endpoints with requireApproval if added later

module.exports = router;
