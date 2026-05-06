const pool = require("../config/db");

function parsePositiveNumber(value, fieldName, { allowZero = false } = {}) {
	const parsed = Number(value);
	if (
		Number.isNaN(parsed) ||
		(allowZero ? parsed < 0 : parsed <= 0)
	) {
		const message = allowZero
			? `${fieldName} must be a non-negative number`
			: `${fieldName} must be a positive number`;
		const err = new Error(message);
		err.status = 400;
		throw err;
	}
	return parsed;
}

async function getStartupIdForUser(userId) {
	const startupResult = await pool.query(
		"SELECT startup_id FROM startups WHERE user_id = $1",
		[userId],
	);
	return startupResult.rowCount ? startupResult.rows[0].startup_id : null;
}

exports.createProject = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const startup_id = await getStartupIdForUser(userId);

    if (!startup_id) {
      return res.status(404).send("Startup profile not found");
    }

    let { project_title, description, funding_goal, start_date, end_date, status } =
      req.body;

    if (!project_title || typeof project_title !== "string") {
      return res.status(400).json({ error: "project_title is required" });
    }

    funding_goal = parsePositiveNumber(funding_goal, "funding_goal", {
      allowZero: false,
    });

    const allowedStatuses = ["draft", "active"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "status must be draft or active" });
    }

    const result = await pool.query(
      `
INSERT INTO projects(
 startup_id,
 project_title,
 description,
 funding_goal,
 status,
 start_date,
 end_date
)
VALUES($1,$2,$3,$4,$5,$6,$7)
RETURNING *
`,
      [
        startup_id,
        project_title.trim(),
        description,
        funding_goal,
        status || "active",
        start_date,
        end_date,
      ],
    );

    res.json({
      message: "Project created successfully",
      project: result.rows[0],
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};


exports.getMyProjects = async (req, res) => {
  try {
    const startupId = await getStartupIdForUser(req.user.user_id);
    if (!startupId) {
      return res.status(404).json({ error: "Startup profile not found" });
    }

    const result = await pool.query(
      `SELECT *
       FROM projects
       WHERE startup_id = $1
       ORDER BY created_at DESC`,
      [startupId],
    );

    return res.json({ projects: result.rows });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ error: "Invalid project id" });
    }

    const result = await pool.query(
      `SELECT
        p.*,
        s.startup_id,
        s.startup_name,
        s.industry,
        s.description AS startup_description,
        s.business_stage,
        s.location,
        s.website,
        u.user_id AS startup_user_id,
        u.first_name AS founder_first_name,
        u.last_name AS founder_last_name,
        u.email AS founder_email
       FROM projects p
       JOIN startups s ON s.startup_id = p.startup_id
       JOIN users u ON u.user_id = s.user_id
       WHERE p.project_id = $1
         AND p.status <> 'cancelled'
         AND u.is_active = true
         AND u.is_approved = true`,
      [projectId],
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Project not found" });
    }

    const docs = await pool.query(
      `SELECT document_id, file_name, file_path, file_type, file_size_bytes, description, created_at
       FROM documents
       WHERE startup_id = $1
       ORDER BY created_at DESC`,
      [result.rows[0].startup_id],
    );

    const project = result.rows[0];
    project.documents = docs.rows;
    return res.json({ project });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.updateMyProject = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ error: "Invalid project id" });
    }

    const startupId = await getStartupIdForUser(req.user.user_id);
    if (!startupId) {
      return res.status(404).json({ error: "Startup profile not found" });
    }

    let {
      project_title,
      description,
      funding_goal,
      amount_raised,
      status,
      start_date,
      end_date,
    } = req.body || {};

    const allowedStatuses = ["draft", "active", "funded", "completed", "cancelled"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: "status must be one of draft, active, funded, completed, cancelled",
      });
    }

    if (funding_goal !== undefined && funding_goal !== null && funding_goal !== "") {
      funding_goal = parsePositiveNumber(funding_goal, "funding_goal");
    } else {
      funding_goal = null;
    }

    if (amount_raised !== undefined && amount_raised !== null && amount_raised !== "") {
      amount_raised = parsePositiveNumber(amount_raised, "amount_raised", {
        allowZero: true,
      });
    } else {
      amount_raised = null;
    }

    const updated = await pool.query(
      `UPDATE projects
       SET project_title = COALESCE($1, project_title),
           description = COALESCE($2, description),
           funding_goal = COALESCE($3, funding_goal),
           amount_raised = COALESCE($4, amount_raised),
           status = COALESCE($5, status),
           start_date = COALESCE($6, start_date),
           end_date = COALESCE($7, end_date)
       WHERE project_id = $8 AND startup_id = $9
       RETURNING *`,
      [
        project_title ? project_title.trim() : null,
        description,
        funding_goal,
        amount_raised,
        status,
        start_date,
        end_date,
        projectId,
        startupId,
      ],
    );

    if (!updated.rowCount) {
      return res.status(404).json({ error: "Project not found" });
    }

    return res.json({ message: "Project updated", project: updated.rows[0] });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Get all discoverable projects
exports.getAllProjects = async (req, res) => {
  try {
    const { q, industry, stage, status = "active", limit = 100, offset = 0 } =
      req.query || {};
    const filters = ["u.is_active = true", "u.is_approved = true"];
    const values = [];

    if (status) {
      values.push(status);
      filters.push(`p.status = $${values.length}`);
    }

    if (industry) {
      values.push(`%${industry}%`);
      filters.push(`s.industry ILIKE $${values.length}`);
    }

    if (stage) {
      values.push(`%${stage}%`);
      filters.push(`s.business_stage ILIKE $${values.length}`);
    }

    if (q) {
      values.push(`%${q}%`);
      filters.push(
        `(p.project_title ILIKE $${values.length} OR p.description ILIKE $${values.length} OR s.startup_name ILIKE $${values.length})`,
      );
    }

    values.push(Number(limit) || 100);
    values.push(Number(offset) || 0);

    const result = await pool.query(
      `
SELECT
p.project_id,
p.project_title,
p.description,
p.funding_goal,
p.amount_raised,
p.status,
p.start_date,
p.end_date,
p.created_at,
s.startup_id,
s.startup_name,
s.industry,
s.business_stage,
s.location
FROM projects p
JOIN startups s
ON p.startup_id = s.startup_id
JOIN users u ON u.user_id = s.user_id
WHERE ${filters.join(" AND ")}
ORDER BY p.created_at DESC
LIMIT $${values.length - 1} OFFSET $${values.length}
`,
      values,
    );

    res.json({ projects: result.rows });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
