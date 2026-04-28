const pool = require("../config/db");

exports.createInvestorProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const {
      investor_type,
      organization_name,
      investment_budget,
      preferred_industry,
      investment_stage,
      country,
      portfolio_size,
    } = req.body;

    const result = await pool.query(
      `
INSERT INTO investors(
 user_id,
 investor_type,
 organization_name,
 investment_budget,
 preferred_industry,
 investment_stage,
 country,
 portfolio_size
)
VALUES($1,$2,$3,$4,$5,$6,$7,$8)
RETURNING *
`,
      [
        userId,
        investor_type,
        organization_name,
        investment_budget,
        preferred_industry,
        investment_stage,
        country,
        portfolio_size,
      ],
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};
