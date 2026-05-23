const pool = require("../config/db");

async function ensureInvestmentRequestDirectionSchema(client = pool) {
  await client.query("ALTER TABLE investment_requests ALTER COLUMN project_id DROP NOT NULL");
  await client.query("ALTER TABLE investment_requests ADD COLUMN IF NOT EXISTS initiated_by VARCHAR(20) NOT NULL DEFAULT 'startup'");
  await client.query("ALTER TABLE investment_requests DROP CONSTRAINT IF EXISTS investment_requests_initiated_by_check");
  await client.query("ALTER TABLE investment_requests ADD CONSTRAINT investment_requests_initiated_by_check CHECK (initiated_by IN ('startup', 'investor'))");
}

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
    await ensureInvestmentRequestDirectionSchema();
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

    const existingOpenOffer = await pool.query(
      `SELECT investment_request_id, initiated_by, status
       FROM investment_requests
       WHERE startup_id = $1
         AND investor_id = $2
         AND project_id = $3
         AND status IN ('pending', 'approved', 'accepted')
       ORDER BY created_at DESC
       LIMIT 1`,
      [startup_id, investor_id, projectId],
    );

    if (existingOpenOffer.rowCount > 0) {
      const existing = existingOpenOffer.rows[0];
      const direction = existing.initiated_by === "investor" ? "your existing offer" : "the startup's existing request";
      return res.status(409).json({
        error: `There is already an open investment record for this project. Respond to ${direction} instead of creating a second offer.`,
        offer: existing,
      });
    }

    const result = await pool.query(
      `INSERT INTO investment_requests(
        startup_id,
        investor_id,
        project_id,
        requested_amount,
        proposal_message,
        initiated_by
      )
      VALUES($1,$2,$3,$4,$5,'investor')
      RETURNING *`,
      [startup_id, investor_id, projectId, amount, proposal_message || null],
    );

    await pool.query(
      `INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
       SELECT user_id, 'investment', 'New Funding Offer', $1, 'investment_requests', $2
       FROM startups WHERE startup_id = $3`,
      [
        `You received a funding offer of ${amount}`,
        result.rows[0].investment_request_id,
        startup_id,
      ],
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
    await ensureInvestmentRequestDirectionSchema();
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
      `SELECT ir.*, p.startup_id, COALESCE(ir.initiated_by, 'startup') AS initiated_by
       FROM investment_requests ir
       JOIN projects p ON p.project_id = ir.project_id
       WHERE ir.investment_request_id = $1 AND p.startup_id = $2`,
      [requestId, startupId],
    );

    if (requestResult.rowCount === 0) {
      return res.status(404).json({ error: "Investment request not found" });
    }

    const currentStatus = requestResult.rows[0].status;
    if (requestResult.rows[0].initiated_by !== "investor") {
      return res.status(403).json({
        error: "Startup-created investment requests must be answered by the investor",
      });
    }

    if (currentStatus !== "pending") {
      return res.status(409).json({
        error: "Only pending investment requests can be updated",
      });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const updateResult = await client.query(
        `UPDATE investment_requests
         SET status = $1
         WHERE investment_request_id = $2
         RETURNING *`,
        [status, requestId],
      );

      if (status === "approved") {
        const request = requestResult.rows[0];
        const investmentResult = await client.query(
          `INSERT INTO investments (investment_request_id, amount, status, closed_at)
           VALUES ($1, $2, 'completed', CURRENT_TIMESTAMP)
           ON CONFLICT (investment_request_id) DO NOTHING
           RETURNING investment_id`,
          [requestId, request.requested_amount],
        );

        if (investmentResult.rowCount > 0 && request.project_id) {
          await client.query(
            `UPDATE projects
             SET amount_raised = COALESCE(amount_raised, 0) + $1
             WHERE project_id = $2`,
            [request.requested_amount, request.project_id],
          );
        }

        await client.query(
          `INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
           SELECT i.user_id, 'investment', 'Funding offer accepted', 'A startup accepted your funding offer.', 'investment_requests', $1
           FROM investors i WHERE i.investor_id = $2`,
          [requestId, request.investor_id],
        );
      }

      await client.query("COMMIT");
      res.json({ investment_request: updateResult.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
