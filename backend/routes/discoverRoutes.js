const router = require("express").Router();
const {
	authenticate,
	authorizeRoles,
	requireApproval,
} = require("../middleware/authMiddleware");
const discoverController = require("../controllers/discoverController");

router.use(authenticate, authorizeRoles("Startup"));

router.get("/mentors", discoverController.searchMentors);
router.get("/investors", discoverController.searchInvestors);

router.post(
	"/mentors/:mentorId/request",
	requireApproval,
	discoverController.requestMentor,
);
router.post(
	"/investors/:investorId/interest",
	requireApproval,
	discoverController.expressInvestorInterest,
);

router.post(
	"/investors/:investorId/apply",
	requireApproval,
	discoverController.applyToInvestor,
);
router.post(
	"/mentors/:mentorId/apply",
	requireApproval,
	discoverController.applyToMentor,
);

router.post(
	"/:profileId/favorite",
	requireApproval,
	discoverController.saveFavorite,
);

module.exports = router;
