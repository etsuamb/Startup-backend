const router = require("express").Router();
const {
	authenticate,
	authorizeRoles,
	requireApproval,
} = require("../middleware/authMiddleware");
const { attachVisibility } = require("../middleware/visibilityMiddleware");
const discoverController = require("../controllers/discoverController");

router.use(authenticate, authorizeRoles("Startup"));

router.get("/mentors", requireApproval, discoverController.searchMentors);
router.get("/investors", requireApproval, discoverController.searchInvestors);
router.get(
	"/investors/:investorId",
	requireApproval,
	discoverController.getDiscoverInvestor,
);
router.get(
	"/mentors/:mentorId",
	requireApproval,
	discoverController.getDiscoverMentor,
);

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
