const router = require("express").Router();

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const {
  authenticate,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const startupController = require("../controllers/startupController");

// Public featured startup listing
router.get("/featured", startupController.listFeaturedStartups);

// Create startup profile
router.post(
  "/profile",
  authenticate,
  authorizeRoles("Startup"),
  upload.fields([
    { name: "pitch_deck", maxCount: 1 },
    { name: "business_plan", maxCount: 1 },
  ]),
  startupController.createStartupProfile,
);

// Get current startup profile
router.get(
  "/me",
  authenticate,
  authorizeRoles("Startup"),
  startupController.getMyStartupProfile,
);

// Update existing startup profile
router.put(
  "/profile",
  authenticate,
  authorizeRoles("Startup"),
  upload.fields([
    { name: "pitch_deck", maxCount: 1 },
    { name: "business_plan", maxCount: 1 },
  ]),
  startupController.updateStartupProfile,
);

// Get startup documents
router.get(
  "/documents",
  authenticate,
  authorizeRoles("Startup"),
  startupController.getStartupDocuments,
);

// Public search for startups (supports query, industry, stage, page, limit)
router.get("/search", startupController.searchPublicStartups);

// Get all offers (investment and mentorship) for a startup
router.get(
  "/offers",
  authenticate,
  authorizeRoles("Startup"),
  startupController.getStartupOffers,
);

// Get detailed information about a specific offer
router.get(
  "/offers/:offerType/:offerId",
  authenticate,
  authorizeRoles("Startup"),
  startupController.getOfferDetails,
);

// Accept or reject an offer
router.patch(
  "/offers/:offerType/:offerId",
  authenticate,
  authorizeRoles("Startup"),
  startupController.updateOfferStatus,
);

module.exports = router;
