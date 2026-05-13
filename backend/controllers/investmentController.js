const pool = require("../config/db");

async function getStartupIdByUserId(userId) {
  const startupResult = await pool.query(
    "SELECT startup_id FROM startups WHERE user_id = $1",
    [userId],
  );

  if (startupResult.rowCount === 0) {
    return null;
  }

  return startupResult.rows[0].startup_id;
}

exports.createInvestmentRequest = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const investorResult = await pool.query(
      `SELECT investor_id FROM investors WHERE user_id = $1`,
      [userId],
    );

    if (investorResult.rowCount === 0) {
      return res.status(404).json({ error: "Investor profile not found" });
    }

    const investor_id = investorResult.rows[0].investor_id;
    const { project_id, requested_amount, proposal_message } = req.body;

    if (!project_id || !requested_amount) {
      return res.status(400).json({
        error: "project_id and requested_amount are required",
      });
    }

    const projectId = Number(project_id);
    const amount = Number(requested_amount);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ error: "project_id must be a valid integer" });
    }
    if (Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "requested_amount must be a positive number" });
    }

    const startupResult = await pool.query(
      `SELECT startup_id FROM projects WHERE project_id = $1`,
      [projectId],
    );

    if (startupResult.rowCount === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const startup_id = startupResult.rows[0].startup_id;

    const result = await pool.query(
      `INSERT INTO investment_requests(
        startup_id,
        investor_id,
        project_id,
        requested_amount,
        proposal_message
      )
      VALUES($1,$2,$3,$4,$5)
      RETURNING *`,
      [startup_id, investor_id, projectId, amount, proposal_message || null],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getInvestmentRequests = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const startupId = await getStartupIdByUserId(userId);

    if (!startupId) {
      return res.status(404).json({ error: "Startup profile not found" });
    }

    const result = await pool.query(
      `SELECT ir.*, p.project_title, p.funding_goal, p.status AS project_status, u.first_name AS investor_first_name, u.last_name AS investor_last_name, u.email AS investor_email
       FROM investment_requests ir
       JOIN projects p ON p.project_id = ir.project_id
       JOIN investors i ON i.investor_id = ir.investor_id
       JOIN users u ON u.user_id = i.user_id
       WHERE ir.startup_id = $1
       ORDER BY ir.created_at DESC`,
      [startupId],
    );

    res.json({ investment_requests: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateInvestmentRequest = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const startupId = await getStartupIdByUserId(userId);

    if (!startupId) {
      return res.status(404).json({ error: "Startup profile not found" });
    }

    const requestId = Number(req.params.requestId);
    if (!Number.isInteger(requestId) || requestId <= 0) {
      return res.status(400).json({ error: "Invalid requestId" });
    }

    const { status } = req.body || {};
    const allowedStatuses = ["approved", "rejected", "withdrawn"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: "status is required and must be one of: approved, rejected, withdrawn",
      });
    }

    const requestResult = await pool.query(
      `SELECT ir.*, p.startup_id
       FROM investment_requests ir
       JOIN projects p ON p.project_id = ir.project_id
       WHERE ir.investment_request_id = $1 AND p.startup_id = $2`,
      [requestId, startupId],
    );

    if (requestResult.rowCount === 0) {
      return res.status(404).json({ error: "Investment request not found" });
    }

    const currentStatus = requestResult.rows[0].status;
    if (currentStatus !== "pending") {
      return res.status(409).json({
        error: "Only pending investment requests can be updated",
      });
    }

    const updateResult = await pool.query(
      `UPDATE investment_requests
       SET status = $1
       WHERE investment_request_id = $2
       RETURNING *`,
      [status, requestId],
    );

    res.json({ investment_request: updateResult.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
