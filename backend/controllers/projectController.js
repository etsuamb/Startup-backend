const pool = require("../config/db");

exports.createProject = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // get startup belonging to logged in user
    const startupResult = await pool.query(
      `SELECT startup_id FROM startups
 WHERE user_id = $1`,
      [userId],
    );

    if (startupResult.rows.length === 0) {
      return res.status(404).send("Startup profile not found");
    }

    const startup_id = startupResult.rows[0].startup_id;

    const { project_title, description, funding_goal, start_date, end_date } =
      req.body;

    const result = await pool.query(
      `
INSERT INTO projects(
 startup_id,
 project_title,
 description,
 funding_goal,
 start_date,
 end_date
)
VALUES($1,$2,$3,$4,$5,$6)
RETURNING *
`,
      [
        startup_id,
        project_title,
        description,
        funding_goal,
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


// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const result = await pool.query(
      `
SELECT
p.project_id,
p.project_title,
p.description,
p.funding_goal,
p.amount_raised,
p.status,
s.startup_name,
s.industry
FROM projects p
JOIN startups s
ON p.startup_id = s.startup_id
ORDER BY p.created_at DESC
`,
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
};
