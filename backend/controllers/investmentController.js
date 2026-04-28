const pool = require("../config/db");

exports.createInvestmentRequest = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // get investor id from logged-in user
    const investorResult = await pool.query(
      `SELECT investor_id
 FROM investors
 WHERE user_id=$1`,
      [userId],
    );

    if (investorResult.rows.length === 0) {
      return res.status(404).send("Investor profile not found");
    }

    const investor_id = investorResult.rows[0].investor_id;

    const { project_id, requested_amount, proposal_message } = req.body;

    const startupResult = await pool.query(
      `SELECT startup_id
FROM projects
WHERE project_id=$1`,
      [project_id],
    );

    const startup_id = startupResult.rows[0].startup_id;

    const result = await pool.query(
      `
INSERT INTO investment_requests(
startup_id,
investor_id,
project_id,
requested_amount,
proposal_message
)
VALUES($1,$2,$3,$4,$5)
RETURNING *
`,
      [startup_id, investor_id, project_id, requested_amount, proposal_message],
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};
