const pool = require("../config/db");

// Create startup profile
exports.createStartupProfile = async (req, res) => {
  try {
    const userId = req.user.user_id; // from JWT

    const {
      startup_name,
      industry,
      description,
      business_stage,
      founded_year,
      team_size,
      location,
      website,
      funding_needed,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO startups (
        user_id,
        startup_name,
        industry,
        description,
        business_stage,
        founded_year,
        team_size,
        location,
        website,
        funding_needed
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
      `,
      [
        userId,
        startup_name,
        industry,
        description,
        business_stage,
        founded_year,
        team_size,
        location,
        website,
        funding_needed,
      ],
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};
