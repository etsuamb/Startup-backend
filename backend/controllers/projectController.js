const pool = require("../config/db");
const crypto = require("crypto");
const fs = require("fs");

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

exports.createProject = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const startupId = await getStartupIdByUserId(userId);

    if (!startupId) {
      return res.status(404).json({ error: "Startup profile not found" });
    }

    const {
      project_title,
      description,
      funding_goal,
      start_date,
      end_date,
    } = req.body;

    if (!project_title || !description || !funding_goal || !start_date || !end_date) {
      return res.status(400).json({
        error:
          "project_title, description, funding_goal, start_date, and end_date are required",
      });
    }

    const fundingGoalNumber = Number(funding_goal);
    if (Number.isNaN(fundingGoalNumber) || fundingGoalNumber <= 0) {
      return res.status(400).json({
        error: "funding_goal must be a positive number",
      });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({
        error: "start_date and end_date must be valid dates",
      });
    }
    if (endDate <= startDate) {
      return res.status(400).json({
        error: "end_date must be after start_date",
      });
    }

    if (!req.files || !req.files.pitch_deck || !req.files.business_plan || !req.files.financial_projection) {
      return res.status(400).json({
        error: "pitch_deck, business_plan, and financial_projection files are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO projects(
        startup_id,
        project_title,
        description,
        funding_goal,
        start_date,
        end_date
      )
      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [
        startupId,
        project_title,
        description,
        fundingGoalNumber,
        start_date,
        end_date,
      ],
    );

    const project = result.rows[0];
    const files = [
      ...req.files.pitch_deck,
      ...req.files.business_plan,
      ...req.files.financial_projection,
      ...(req.files.demo_video || []),
    ];

    for (const file of files) {
      try {
        const fileBuffer = fs.readFileSync(file.path);
        const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
        const storagePath = `db://documents/startup/${startupId}/${crypto.randomBytes(16).toString("hex")}`;
        await pool.query(
          `INSERT INTO documents (startup_id, project_id, file_name, file_path, file_type, file_size_bytes, file_hash, file_data, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP)`,
          [
            startupId,
            project.project_id,
            file.originalname,
            storagePath,
            file.mimetype,
            file.size,
            fileHash,
            fileBuffer,
          ],
        );
      } catch (docErr) {
        console.error("Failed saving project file record:", docErr.message);
      } finally {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyProjects = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const startupId = await getStartupIdByUserId(userId);

    if (!startupId) {
      return res.status(404).json({ error: "Startup profile not found" });
    }

    const result = await pool.query(
      `SELECT p.*, s.startup_name, s.industry
       FROM projects p
       JOIN startups s ON p.startup_id = s.startup_id
       WHERE p.startup_id = $1
       ORDER BY p.created_at DESC`,
      [startupId],
    );

    res.json({ projects: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const startupId = await getStartupIdByUserId(userId);

    if (!startupId) {
      return res.status(404).json({ error: "Startup profile not found" });
    }

    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ error: "Invalid projectId" });
    }

    const existing = await pool.query(
      `SELECT * FROM projects WHERE project_id = $1 AND startup_id = $2`,
      [projectId, startupId],
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const {
      project_title,
      description,
      funding_goal,
      start_date,
      end_date,
      status,
    } = req.body;

    const current = existing.rows[0];
    const title = project_title || current.project_title;
    const desc = description || current.description;
    const fundingGoal = funding_goal !== undefined ? Number(funding_goal) : current.funding_goal;
    const startDate = start_date ? new Date(start_date) : current.start_date;
    const endDate = end_date ? new Date(end_date) : current.end_date;

    if (project_title !== undefined && (typeof project_title !== "string" || project_title.trim() === "")) {
      return res.status(400).json({ error: "project_title must be a non-empty string" });
    }

    if (funding_goal !== undefined && (Number.isNaN(fundingGoal) || fundingGoal <= 0)) {
      return res.status(400).json({ error: "funding_goal must be a positive number" });
    }

    if (start_date !== undefined && Number.isNaN(startDate.getTime())) {
      return res.status(400).json({ error: "start_date must be a valid date" });
    }

    if (end_date !== undefined && Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "end_date must be a valid date" });
    }

    if (startDate && endDate && endDate <= startDate) {
      return res.status(400).json({ error: "end_date must be after start_date" });
    }

    const updateResult = await pool.query(
      `UPDATE projects SET
         project_title = $1,
         description = $2,
         funding_goal = $3,
         start_date = $4,
         end_date = $5,
         status = COALESCE($6, status)
       WHERE project_id = $7 AND startup_id = $8
       RETURNING *`,
      [title, desc, fundingGoal, startDate, endDate, status || null, projectId, startupId],
    );

    res.json({ project: updateResult.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const startupId = await getStartupIdByUserId(userId);

    if (!startupId) {
      return res.status(404).json({ error: "Startup profile not found" });
    }

    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ error: "Invalid projectId" });
    }

    const result = await pool.query(
      `DELETE FROM projects WHERE project_id = $1 AND startup_id = $2 RETURNING *`,
      [projectId, startupId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ message: "Project deleted successfully", project: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         p.project_id,
         p.project_title,
         p.description,
         p.funding_goal,
         p.amount_raised,
         p.status,
         s.startup_name,
         s.industry
       FROM projects p
       JOIN startups s ON p.startup_id = s.startup_id
       ORDER BY p.created_at DESC`,
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
