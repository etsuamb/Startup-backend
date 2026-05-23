const router = require("express").Router();
const { authenticate, authorizeRoles } = require("../middleware/authMiddleware");
const ratingController = require("../controllers/ratingController");

// Create or update a rating (Startup rates Mentor)
router.post(
  "/",
  authenticate,
  authorizeRoles("Startup"),
  ratingController.createOrUpdateRating
);

// Get ratings for a mentor (public view)
router.get("/mentor/:mentorId", ratingController.getMentorRatings);

// Get mentor rating summary (for profile display)
router.get("/mentor/:mentorId/summary", ratingController.getMentorRatingSummary);

// Check if startup can rate a mentor
router.get(
  "/check-eligibility/:mentorId",
  authenticate,
  authorizeRoles("Startup"),
  ratingController.checkRatingEligibility
);

// Get ratings given by the current startup
router.get(
  "/my-ratings",
  authenticate,
  authorizeRoles("Startup"),
  ratingController.getStartupGivenRatings
);

// Get ratings received by the current mentor
router.get(
  "/received",
  authenticate,
  authorizeRoles("Mentor"),
  ratingController.getMentorReceivedRatings
);

// Delete a rating (only by the startup who created it)
router.delete(
  "/:reviewId",
  authenticate,
  authorizeRoles("Startup"),
  ratingController.deleteRating
);

module.exports = router;