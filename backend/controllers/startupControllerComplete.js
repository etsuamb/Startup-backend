const pool = require("../config/db");
const multer = require("multer");
const path = require("path");

// UC_28: Create Startup Project
exports.createProject = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { project_title, description, funding_goal, start_date, end_date } =
			req.body;

		if (!project_title || !funding_goal) {
			return res.status(400).json({
				error: "project_title and funding_goal are required",
			});
		}

		// Get startup
		const startupRes = await pool.query(
			"SELECT startup_id FROM startups WHERE user_id = $1",
			[userId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup profile not found" });
		}

		const startup_id = startupRes.rows[0].startup_id;

		const result = await pool.query(
			`INSERT INTO projects (startup_id, project_title, description, funding_goal, start_date, end_date)
			 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
			[startup_id, project_title, description, funding_goal, start_date, end_date]
		);

		res.status(201).json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_28b: Get My Projects
exports.getMyProjects = async (req, res) => {
	try {
		const userId = req.user.user_id;

		const startupRes = await pool.query(
			"SELECT startup_id FROM startups WHERE user_id = $1",
			[userId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup profile not found" });
		}

		const startup_id = startupRes.rows[0].startup_id;

		const result = await pool.query(
			"SELECT * FROM projects WHERE startup_id = $1 ORDER BY created_at DESC",
			[startup_id]
		);

		res.json({ projects: result.rows });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_28c: Get Project Details
exports.getProjectDetails = async (req, res) => {
	try {
		const { projectId } = req.params;
		const userId = req.user.user_id;

		const projectRes = await pool.query(
			"SELECT * FROM projects WHERE project_id = $1",
			[projectId]
		);

		if (projectRes.rows.length === 0) {
			return res.status(404).json({ message: "Project not found" });
		}

		// Verify ownership
		const startupRes = await pool.query(
			"SELECT startup_id FROM startups WHERE startup_id = $1 AND user_id = $2",
			[projectRes.rows[0].startup_id, userId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(403).json({ message: "Unauthorized" });
		}

		res.json(projectRes.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_28d: Update Project
exports.updateProject = async (req, res) => {
	try {
		const { projectId } = req.params;
		const userId = req.user.user_id;
		const { project_title, description, funding_goal, status } = req.body;

		// Verify ownership
		const projectRes = await pool.query(
			"SELECT p.* FROM projects p JOIN startups s ON p.startup_id = s.startup_id WHERE p.project_id = $1 AND s.user_id = $2",
			[projectId, userId]
		);

		if (projectRes.rows.length === 0) {
			return res.status(403).json({ message: "Unauthorized" });
		}

		const result = await pool.query(
			`UPDATE projects SET project_title = COALESCE($1, project_title), 
			 description = COALESCE($2, description), funding_goal = COALESCE($3, funding_goal),
			 status = COALESCE($4, status) WHERE project_id = $5 RETURNING *`,
			[project_title, description, funding_goal, status, projectId]
		);

		res.json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_29: Upload Documents
exports.uploadDocument = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { project_id, description } = req.body;

		if (!req.file) {
			return res.status(400).json({ error: "No file uploaded" });
		}

		// Get startup
		const startupRes = await pool.query(
			"SELECT startup_id FROM startups WHERE user_id = $1",
			[userId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup profile not found" });
		}

		const startup_id = startupRes.rows[0].startup_id;
		const file_path = req.file.path;
		const file_name = req.file.originalname;
		const file_type = req.file.mimetype;
		const file_size_bytes = req.file.size;

		const result = await pool.query(
			`INSERT INTO documents (startup_id, file_name, file_path, file_type, file_size_bytes, description)
			 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
			[startup_id, file_name, file_path, file_type, file_size_bytes, description]
		);

		res.status(201).json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_29: Get Documents
exports.getDocuments = async (req, res) => {
	try {
		const userId = req.user.user_id;

		const startupRes = await pool.query(
			"SELECT startup_id FROM startups WHERE user_id = $1",
			[userId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup profile not found" });
		}

		const result = await pool.query(
			"SELECT * FROM documents WHERE startup_id = $1 ORDER BY created_at DESC",
			[startupRes.rows[0].startup_id]
		);

		res.json({ documents: result.rows });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_30: Update Project Progress
exports.addProgressUpdate = async (req, res) => {
	try {
		const { projectId } = req.params;
		const userId = req.user.user_id;
		const { description, milestone, amount_raised } = req.body;

		// Verify ownership
		const projectRes = await pool.query(
			"SELECT p.* FROM projects p JOIN startups s ON p.startup_id = s.startup_id WHERE p.project_id = $1 AND s.user_id = $2",
			[projectId, userId]
		);

		if (projectRes.rows.length === 0) {
			return res.status(403).json({ message: "Unauthorized" });
		}

		// Update amount_raised if provided
		if (amount_raised !== undefined) {
			await pool.query(
				"UPDATE projects SET amount_raised = amount_raised + $1 WHERE project_id = $2",
				[amount_raised, projectId]
			);
		}

		// Log progress in a table (you'd need to create a project_updates table)
		// For now, we'll just return success
		res.json({ message: "Progress updated", milestone, amount_raised });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_31: Search Investors & Mentors
exports.searchInvestors = async (req, res) => {
	try {
		const {
			investment_range,
			industry,
			country,
			search,
			page = 1,
			limit = 20,
		} = req.query;

		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		let query = "SELECT i.*, u.first_name, u.last_name, u.email FROM investors i JOIN users u ON i.user_id = u.user_id WHERE 1=1";
		const params = [];

		if (industry) {
			params.push(industry);
			query += ` AND i.preferred_industry = $${params.length}`;
		}

		if (country) {
			params.push(country);
			query += ` AND i.country = $${params.length}`;
		}

		if (search) {
			params.push(`%${search}%`);
			query += ` AND (i.organization_name ILIKE $${params.length} OR u.first_name ILIKE $${params.length})`;
		}

		const countQuery = query.replace(/SELECT i\.\*.*FROM/, "SELECT COUNT(*) as total FROM");
		const countResult = await pool.query(countQuery, params);
		const total = parseInt(countResult.rows[0].total);

		query += ` ORDER BY i.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
		params.push(limitNum, offset);

		const result = await pool.query(query, params);

		res.json({
			investors: result.rows,
			total,
			page: pageNum,
			limit: limitNum,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.searchMentors = async (req, res) => {
	try {
		const { expertise, experience, country, search, page = 1, limit = 20 } = req.query;

		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		let query = "SELECT m.*, u.first_name, u.last_name, u.email FROM mentors m JOIN users u ON m.user_id = u.user_id WHERE u.is_approved = true";
		const params = [];

		if (expertise) {
			params.push(`%${expertise}%`);
			query += ` AND m.expertise ILIKE $${params.length}`;
		}

		if (experience) {
			params.push(experience);
			query += ` AND m.years_experience >= $${params.length}`;
		}

		if (country) {
			params.push(country);
			query += ` AND m.country = $${params.length}`;
		}

		if (search) {
			params.push(`%${search}%`);
			query += ` AND (m.headline ILIKE $${params.length} OR u.first_name ILIKE $${params.length})`;
		}

		const countQuery = query.replace(/SELECT m\.\*.*FROM/, "SELECT COUNT(*) as total FROM");
		const countResult = await pool.query(countQuery, params);
		const total = parseInt(countResult.rows[0].total);

		query += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
		params.push(limitNum, offset);

		const result = await pool.query(query, params);

		res.json({
			mentors: result.rows,
			total,
			page: pageNum,
			limit: limitNum,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_32: AI Recommendations (Basic)
exports.getInvestorRecommendations = async (req, res) => {
	try {
		const userId = req.user.user_id;

		const startupRes = await pool.query(
			"SELECT industry, business_stage FROM startups WHERE user_id = $1",
			[userId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup profile not found" });
		}

		const { industry, business_stage } = startupRes.rows[0];

		// Find matching investors
		const result = await pool.query(
			`SELECT i.*, u.first_name, u.last_name FROM investors i 
			 JOIN users u ON i.user_id = u.user_id
			 WHERE i.preferred_industry = $1 AND i.investment_stage = $2
			 LIMIT 10`,
			[industry, business_stage]
		);

		const recommendations = result.rows.map((investor) => ({
			investor,
			score: 0.85,
			reason: `Invests in ${industry} at ${business_stage} stage`,
		}));

		res.json({ recommendations });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.getMentorRecommendations = async (req, res) => {
	try {
		const userId = req.user.user_id;

		const startupRes = await pool.query(
			"SELECT industry FROM startups WHERE user_id = $1",
			[userId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup profile not found" });
		}

		const { industry } = startupRes.rows[0];

		// Find matching mentors
		const result = await pool.query(
			`SELECT m.*, u.first_name, u.last_name FROM mentors m 
			 JOIN users u ON m.user_id = u.user_id
			 WHERE u.is_approved = true AND m.expertise ILIKE $1
			 LIMIT 10`,
			[`%${industry}%`]
		);

		const recommendations = result.rows.map((mentor) => ({
			mentor,
			score: 0.8,
			reason: `Expertise in ${industry}`,
		}));

		res.json({ recommendations });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_33: Apply for Investment
exports.createInvestmentRequest = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { investor_id, project_id, requested_amount, proposal_message } =
			req.body;

		if (!investor_id) {
			return res.status(400).json({ error: "investor_id is required" });
		}

		if (!requested_amount) {
			return res.status(400).json({ error: "requested_amount is required" });
		}

		// Validate investor exists
		const investorRes = await pool.query(
			"SELECT investor_id FROM investors WHERE investor_id = $1",
			[investor_id]
		);

		if (investorRes.rows.length === 0) {
			return res.status(404).json({ error: "Investor not found" });
		}

		// Validate startup exists
		const startupRes = await pool.query(
			"SELECT startup_id FROM startups WHERE user_id = $1",
			[userId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup profile not found" });
		}

		const startup_id = startupRes.rows[0].startup_id;

		// Validate project exists if provided
		if (project_id) {
			const projectRes = await pool.query(
				"SELECT project_id FROM projects WHERE project_id = $1",
				[project_id]
			);

			if (projectRes.rows.length === 0) {
				return res.status(404).json({ error: "Project not found" });
			}
		}

		const result = await pool.query(
			`INSERT INTO investment_requests (startup_id, investor_id, project_id, requested_amount, proposal_message)
			 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
			[startup_id, investor_id, project_id || null, requested_amount, proposal_message]
		);

		res.status(201).json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_38: Request Mentorship
exports.createMentorshipRequest = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { mentor_id, subject, message } = req.body;

		if (!mentor_id || !subject) {
			return res.status(400).json({ error: "mentor_id and subject are required" });
		}

		// Validate mentor exists
		const mentorRes = await pool.query(
			"SELECT mentor_id FROM mentors WHERE mentor_id = $1",
			[mentor_id]
		);

		if (mentorRes.rows.length === 0) {
			return res.status(404).json({ error: "Mentor not found" });
		}

		const startupRes = await pool.query(
			"SELECT startup_id FROM startups WHERE user_id = $1",
			[userId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup profile not found" });
		}

		const startup_id = startupRes.rows[0].startup_id;

		const result = await pool.query(
			`INSERT INTO mentorship_requests (startup_id, mentor_id, subject, message)
			 VALUES ($1, $2, $3, $4) RETURNING *`,
			[startup_id, mentor_id, subject, message]
		);

		// Notify mentor
		await pool.query(
			"INSERT INTO notifications (user_id, notification_type, title, message) SELECT user_id, $1, $2, $3 FROM mentors WHERE mentor_id = $4",
			["mentorship", "New Mentorship Request", subject, mentor_id]
		);

		res.status(201).json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_34: Send Message to Investor
exports.sendMessage = async (req, res) => {
	try {
		const startupUserId = req.user.user_id;
		const { investorId } = req.params;
		const { message } = req.body;

		if (!message) {
			return res.status(400).json({ error: "message is required" });
		}

		// Get investor user_id
		const investorRes = await pool.query(
			"SELECT user_id FROM investors WHERE investor_id = $1",
			[investorId]
		);

		if (investorRes.rows.length === 0) {
			return res.status(404).json({ message: "Investor not found" });
		}

		const investorUserId = investorRes.rows[0].user_id;

		// Save message
		const result = await pool.query(
			`INSERT INTO messages (sender_user_id, receiver_user_id, body, subject)
			 VALUES ($1, $2, $3, 'Investment Discussion') RETURNING *`,
			[startupUserId, investorUserId, message]
		);

		res.status(201).json({ message_id: result.rows[0].message_id });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_34: Get Messages from Investor
exports.getMessages = async (req, res) => {
	try {
		const startupUserId = req.user.user_id;
		const { investorId } = req.params;
		const { page = 1, limit = 20 } = req.query;

		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		// Get investor user_id
		const investorRes = await pool.query(
			"SELECT user_id FROM investors WHERE investor_id = $1",
			[investorId]
		);

		if (investorRes.rows.length === 0) {
			return res.status(404).json({ message: "Investor not found" });
		}

		const investorUserId = investorRes.rows[0].user_id;

		const result = await pool.query(
			`SELECT * FROM messages 
			 WHERE (sender_user_id = $1 AND receiver_user_id = $2) OR (sender_user_id = $2 AND receiver_user_id = $1)
			 ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
			[startupUserId, investorUserId, limitNum, offset]
		);

		// Mark as read
		await pool.query(
			"UPDATE messages SET is_read = true WHERE receiver_user_id = $1 AND sender_user_id = $2",
			[startupUserId, investorUserId]
		);

		res.json({ messages: result.rows });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

module.exports = exports;
