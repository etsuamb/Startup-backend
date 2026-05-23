const pool = require("../config/db");

// Helper functions
async function getStartupIdByUserId(userId) {
  const result = await pool.query(
    "SELECT startup_id FROM startups WHERE user_id = $1",
    [userId],
  );
  return result.rowCount ? result.rows[0].startup_id : null;
}

async function getMentorIdByUserId(userId) {
  const result = await pool.query(
    "SELECT mentor_id FROM mentors WHERE user_id = $1",
    [userId],
  );
  return result.rowCount ? result.rows[0].mentor_id : null;
}

async function getMentorUserIdByMentorId(mentorId) {
  const result = await pool.query(
    "SELECT user_id FROM mentors WHERE mentor_id = $1",
    [mentorId],
  );
  return result.rowCount ? result.rows[0].user_id : null;
}

async function getStartupUserIdByStartupId(startupId) {
  const result = await pool.query(
    "SELECT user_id FROM startups WHERE startup_id = $1",
    [startupId],
  );
  return result.rowCount ? result.rows[0].user_id : null;
}

// Check if a mentorship relationship exists between startup and mentor
async function hasMentorshipRelationship(startupId, mentorId) {
  const result = await pool.query(
    `SELECT mentorship_request_id, status
     FROM mentorship_requests
     WHERE startup_id = $1 AND mentor_id = $2
     AND status IN ('accepted', 'completed')
     ORDER BY created_at DESC
     LIMIT 1`,
    [startupId, mentorId],
  );
  return result.rowCount > 0;
}

// Check if a rating already exists for this startup-mentor pair
async function hasExistingRating(startupId, mentorId) {
  const result = await pool.query(
    "SELECT review_id FROM reviews WHERE startup_id = $1 AND mentor_id = $2",
    [startupId, mentorId],
  );
  return result.rowCount > 0;
}

// Create or update a rating (startup rates mentor)
exports.createOrUpdateRating = async (req, res) => {
  try {
    const { user_id: userId, role } = req.user;

    // Only startups can rate mentors
    if (role !== "Startup") {
      return res.status(403).json({
        error: "Only Startup users can rate mentors",
      });
    }

    const startupId = await getStartupIdByUserId(userId);
    if (!startupId) {
      return res.status(404).json({ error: "Startup profile not found" });
    }

    let { mentor_id, rating, comment } = req.body || {};

    // Validate mentor_id
    const mentorId = Number(mentor_id);
    if (!Number.isInteger(mentorId) || mentorId <= 0) {
      return res.status(400).json({ error: "'mentor_id' must be a valid integer" });
    }

    // Validate rating (1-5)
    if (rating === undefined || rating === null || rating === "") {
      return res.status(400).json({ error: "'rating' is required" });
    }
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        error: "'rating' must be an integer between 1 and 5",
      });
    }

    // Verify mentor exists
    const mentorUser = await getMentorUserIdByMentorId(mentorId);
    if (!mentorUser) {
      return res.status(404).json({ error: "Mentor not found" });
    }

    // Check if mentorship relationship exists
    const hasRelationship = await hasMentorshipRelationship(startupId, mentorId);
    if (!hasRelationship) {
      return res.status(400).json({
        error: "Can only rate mentors you have worked with (accepted or completed mentorship)",
      });
    }

    // Check if rating already exists
    const existingRating = await hasExistingRating(startupId, mentorId);

    let result;
    if (existingRating) {
      // Update existing rating
      result = await pool.query(
        `UPDATE reviews 
         SET rating = $1, comment = $2, created_at = CURRENT_TIMESTAMP
         WHERE startup_id = $3 AND mentor_id = $4
         RETURNING *`,
        [ratingNum, comment || null, startupId, mentorId],
      );
    } else {
      // Create new rating
      result = await pool.query(
        `INSERT INTO reviews (startup_id, mentor_id, rating, comment)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (startup_id, mentor_id)
         DO UPDATE SET 
           rating = EXCLUDED.rating,
           comment = EXCLUDED.comment,
           created_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [startupId, mentorId, ratingNum, comment || null],
      );
    }

    // Create notification for the mentor
    const startupUser = await getStartupUserIdByStartupId(startupId);
    const startupResult = await pool.query(
      "SELECT startup_name FROM startups WHERE startup_id = $1",
      [startupId],
    );
    const startupName = startupResult.rows[0]?.startup_name || "A startup";

    await pool.query(
      `INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
       VALUES ($1, 'rating', 'New Rating Received', 
               '${startupName} has rated you ${ratingNum}/5 stars${comment ? ": " + comment.replace(/'/g, "''") : ""}',
               'review', $2)`,
      [mentorUser, result.rows[0].review_id],
    );

    return res.status(201).json({
      message: existingRating ? "Rating updated successfully" : "Rating submitted successfully",
      review: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get ratings for a specific mentor (public view)
exports.getMentorRatings = async (req, res) => {
  try {
    const mentorId = Number(req.params.mentorId);
    if (!Number.isInteger(mentorId) || mentorId <= 0) {
      return res.status(400).json({ error: "Invalid mentor id" });
    }

    const result = await pool.query(
      `SELECT r.*, s.startup_name, u.first_name, u.last_name
       FROM reviews r
       JOIN startups s ON s.startup_id = r.startup_id
       JOIN users u ON u.user_id = s.user_id
       WHERE r.mentor_id = $1
       ORDER BY r.created_at DESC`,
      [mentorId],
    );

    // Calculate average rating
    const avgResult = await pool.query(
      `SELECT 
        COALESCE(AVG(rating), 0)::numeric(3,2) AS average_rating,
        COUNT(*)::int AS total_reviews
       FROM reviews 
       WHERE mentor_id = $1`,
      [mentorId],
    );

    return res.status(200).json({
      reviews: result.rows,
      average_rating: parseFloat(avgResult.rows[0].average_rating),
      total_reviews: avgResult.rows[0].total_reviews,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get ratings given by a startup
exports.getStartupGivenRatings = async (req, res) => {
  try {
    const { user_id: userId, role } = req.user;

    if (role !== "Startup") {
      return res.status(403).json({
        error: "Only Startup users can view their given ratings",
      });
    }

    const startupId = await getStartupIdByUserId(userId);
    if (!startupId) {
      return res.status(404).json({ error: "Startup profile not found" });
    }

    const result = await pool.query(
      `SELECT r.*, m.headline, u.first_name, u.last_name
       FROM reviews r
       JOIN mentors m ON m.mentor_id = r.mentor_id
       JOIN users u ON u.user_id = m.user_id
       WHERE r.startup_id = $1
       ORDER BY r.created_at DESC`,
      [startupId],
    );

    return res.status(200).json({ reviews: result.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get ratings received by a mentor
exports.getMentorReceivedRatings = async (req, res) => {
  try {
    const { user_id: userId, role } = req.user;

    if (role !== "Mentor") {
      return res.status(403).json({
        error: "Only Mentor users can view their received ratings",
      });
    }

    const mentorId = await getMentorIdByUserId(userId);
    if (!mentorId) {
      return res.status(404).json({ error: "Mentor profile not found" });
    }

    const result = await pool.query(
      `SELECT r.*, s.startup_name, u.first_name, u.last_name
       FROM reviews r
       JOIN startups s ON s.startup_id = r.startup_id
       JOIN users u ON u.user_id = s.user_id
       WHERE r.mentor_id = $1
       ORDER BY r.created_at DESC`,
      [mentorId],
    );

    // Calculate average rating
    const avgResult = await pool.query(
      `SELECT 
        COALESCE(AVG(rating), 0)::numeric(3,2) AS average_rating,
        COUNT(*)::int AS total_reviews
       FROM reviews 
       WHERE mentor_id = $1`,
      [mentorId],
    );

    return res.status(200).json({
      reviews: result.rows,
      average_rating: parseFloat(avgResult.rows[0].average_rating),
      total_reviews: avgResult.rows[0].total_reviews,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Delete a rating (only by the startup who created it)
exports.deleteRating = async (req, res) => {
  try {
    const { user_id: userId, role } = req.user;
    const reviewId = Number(req.params.reviewId);

    if (role !== "Startup") {
      return res.status(403).json({
        error: "Only Startup users can delete their ratings",
      });
    }

    const startupId = await getStartupIdByUserId(userId);
    if (!startupId) {
      return res.status(404).json({ error: "Startup profile not found" });
    }

    // Verify the rating belongs to this startup
    const result = await pool.query(
      "DELETE FROM reviews WHERE review_id = $1 AND startup_id = $2 RETURNING *",
      [reviewId, startupId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Rating not found or you don't have permission to delete it" });
    }

    return res.status(200).json({ message: "Rating deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get mentor's public rating summary (for display on mentor profile)
exports.getMentorRatingSummary = async (req, res) => {
  try {
    const mentorId = Number(req.params.mentorId);
    if (!Number.isInteger(mentorId) || mentorId <= 0) {
      return res.status(400).json({ error: "Invalid mentor id" });
    }

    const result = await pool.query(
      `SELECT 
        COALESCE(AVG(rating), 0)::numeric(3,2) AS average_rating,
        COUNT(*)::int AS total_reviews,
        COUNT(CASE WHEN rating = 5 THEN 1 END)::int AS five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END)::int AS four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END)::int AS three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END)::int AS two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END)::int AS one_star
       FROM reviews 
       WHERE mentor_id = $1`,
      [mentorId],
    );

    const stats = result.rows[0];

    // Get recent reviews (last 5)
    const recentReviews = await pool.query(
      `SELECT r.rating, r.comment, r.created_at, s.startup_name
       FROM reviews r
       JOIN startups s ON s.startup_id = r.startup_id
       WHERE r.mentor_id = $1
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [mentorId],
    );

    return res.status(200).json({
      average_rating: parseFloat(stats.average_rating),
      total_reviews: stats.total_reviews,
      rating_distribution: {
        5: stats.five_star,
        4: stats.four_star,
        3: stats.three_star,
        2: stats.two_star,
        1: stats.one_star,
      },
      recent_reviews: recentReviews.rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Check if startup can rate a mentor (has relationship, hasn't rated yet)
exports.checkRatingEligibility = async (req, res) => {
  try {
    const { user_id: userId, role } = req.user;
    const mentorId = Number(req.params.mentorId);

    if (role !== "Startup") {
      return res.status(403).json({
        error: "Only Startup users can check rating eligibility",
      });
    }

    const startupId = await getStartupIdByUserId(userId);
    if (!startupId) {
      return res.status(404).json({ error: "Startup profile not found" });
    }

    if (!Number.isInteger(mentorId) || mentorId <= 0) {
      return res.status(400).json({ error: "Invalid mentor id" });
    }

    const hasRelationship = await hasMentorshipRelationship(startupId, mentorId);
    const hasRating = await hasExistingRating(startupId, mentorId);

    return res.status(200).json({
      can_rate: hasRelationship,
      has_rated: hasRating,
      message: !hasRelationship 
        ? "You can only rate mentors you have worked with" 
        : hasRating 
          ? "You have already rated this mentor" 
          : "You can rate this mentor",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};