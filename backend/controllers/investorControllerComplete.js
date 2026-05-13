const pool = require("../config/db");

// UC_13b: Create/Update Investor Profile
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

		// Check if profile exists
		const existing = await pool.query(
			"SELECT investor_id FROM investors WHERE user_id = $1",
			[userId]
		);

		if (existing.rows.length > 0) {
			// Update existing
			const result = await pool.query(
				`UPDATE investors SET investor_type = $1, organization_name = $2, investment_budget = $3,
				 preferred_industry = $4, investment_stage = $5, country = $6, portfolio_size = $7
				 WHERE user_id = $8 RETURNING *`,
				[
					investor_type,
					organization_name,
					investment_budget,
					preferred_industry,
					investment_stage,
					country,
					portfolio_size,
					userId,
				]
			);
			return res.json(result.rows[0]);
		}

		// Create new
		const result = await pool.query(
			`INSERT INTO investors (user_id, investor_type, organization_name, investment_budget,
			 preferred_industry, investment_stage, country, portfolio_size)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
			[
				userId,
				investor_type,
				organization_name,
				investment_budget,
				preferred_industry,
				investment_stage,
				country,
				portfolio_size,
			]
		);

		res.status(201).json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_14: View Startup List (Curated)
exports.listStartups = async (req, res) => {
	try {
		const { page = 1, limit = 20 } = req.query;
		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		const countResult = await pool.query(
			"SELECT COUNT(*) as total FROM startups s JOIN users u ON s.user_id = u.user_id WHERE u.is_approved = true"
		);
		const total = parseInt(countResult.rows[0].total);

		const result = await pool.query(
			`SELECT s.startup_id, s.startup_name, s.industry, s.description, s.business_stage, s.team_size,
			 s.location, s.website, s.funding_needed, s.created_at
			 FROM startups s
			 JOIN users u ON s.user_id = u.user_id
			 WHERE u.is_approved = true
			 ORDER BY s.created_at DESC
			 LIMIT $1 OFFSET $2`,
			[limitNum, offset]
		);

		res.json({ startups: result.rows, total, page: pageNum, limit: limitNum });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_15: Search & Filter Startups
exports.searchStartups = async (req, res) => {
	try {
		const {
			industry,
			stage,
			location,
			funding_min,
			funding_max,
			search,
			page = 1,
			limit = 20,
		} = req.query;

		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		let query =
			"SELECT s.* FROM startups s JOIN users u ON s.user_id = u.user_id WHERE u.is_approved = true";
		const params = [];

		if (industry) {
			params.push(industry);
			query += ` AND s.industry = $${params.length}`;
		}

		if (stage) {
			params.push(stage);
			query += ` AND s.business_stage = $${params.length}`;
		}

		if (location) {
			params.push(`%${location}%`);
			query += ` AND s.location ILIKE $${params.length}`;
		}

		if (funding_min) {
			params.push(funding_min);
			query += ` AND s.funding_needed >= $${params.length}`;
		}

		if (funding_max) {
			params.push(funding_max);
			query += ` AND s.funding_needed <= $${params.length}`;
		}

		if (search) {
			params.push(`%${search}%`);
			query += ` AND (s.startup_name ILIKE $${params.length} OR s.description ILIKE $${params.length})`;
		}

		const countQuery = query.replace(/SELECT s\.\*/, "SELECT COUNT(*) as total");
		const countResult = await pool.query(countQuery, params);
		const total = parseInt(countResult.rows[0].total);

		query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
		params.push(limitNum, offset);

		const result = await pool.query(query, params);

		res.json({
			startups: result.rows,
			total,
			page: pageNum,
			limit: limitNum,
			filters: { industry, stage, location, funding_min, funding_max },
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_16: AI Startup Recommendations (Basic implementation)
exports.getStartupRecommendations = async (req, res) => {
	try {
		const investorId = req.params.investorId || req.user.user_id;
		const { limit = 5 } = req.query;

		// Get investor preferences
		const investorRes = await pool.query(
			"SELECT preferred_industry, investment_stage FROM investors WHERE user_id = $1",
			[investorId]
		);

		if (investorRes.rows.length === 0) {
			return res.status(404).json({ message: "Investor profile not found" });
		}

		const { preferred_industry, investment_stage } = investorRes.rows[0];

		// Get matching startups
		let query =
			"SELECT s.* FROM startups s JOIN users u ON s.user_id = u.user_id WHERE u.is_approved = true AND 1=1";
		const params = [];

		if (preferred_industry) {
			params.push(preferred_industry);
			query += ` AND s.industry = $${params.length}`;
		}

		if (investment_stage) {
			params.push(investment_stage);
			query += ` AND s.business_stage = $${params.length}`;
		}

		params.push(limit);
		query += ` ORDER BY s.created_at DESC LIMIT $${params.length}`;

		const result = await pool.query(query, params);

		const recommendations = result.rows.map((startup) => ({
			startup,
			score: 0.85, // Simplified scoring
			reason: `Matches your interest in ${preferred_industry || "startups"} at ${investment_stage || "various"} stages`,
		}));

		res.json({ recommendations });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_17: View Detailed Startup Profile
exports.getStartupDetails = async (req, res) => {
	try {
		const { startupId } = req.params;

		const startupRes = await pool.query(
			"SELECT * FROM startups WHERE startup_id = $1",
			[startupId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup not found" });
		}

		const startup = startupRes.rows[0];

		// Get documents
		const documentsRes = await pool.query(
			"SELECT * FROM documents WHERE startup_id = $1",
			[startupId]
		);

		// Get projects
		const projectsRes = await pool.query(
			"SELECT * FROM projects WHERE startup_id = $1",
			[startupId]
		);

		res.json({ startup, documents: documentsRes.rows, projects: projectsRes.rows });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_18: Send Funding Offer to Startup
exports.sendFundingOffer = async (req, res) => {
	try {
		const investorId = req.user.user_id;
		const { startup_id, project_id, amount, equity_percentage, terms, message } =
			req.body;

		if (!startup_id || !amount) {
			return res.status(400).json({
				error: "startup_id and amount are required",
			});
		}

		// Get investor details
		const investorRes = await pool.query(
			"SELECT investor_id FROM investors WHERE user_id = $1",
			[investorId]
		);

		if (investorRes.rows.length === 0) {
			return res.status(404).json({ message: "Investor profile not found" });
		}

		const investor_id_pk = investorRes.rows[0].investor_id;

		// Create investment request
		const result = await pool.query(
			`INSERT INTO investment_requests (startup_id, investor_id, project_id, requested_amount, proposal_message, status)
			 VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
			[startup_id, investor_id_pk, project_id || null, amount, message || null]
		);

		// Notify startup
		await pool.query(
			"INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id) SELECT user_id, $1, $2, $3, $4, $5 FROM startups WHERE startup_id = $6",
			[
				"investment",
				"New Funding Offer",
				`You received a funding offer of ${amount}`,
				"investment_requests",
				result.rows[0].investment_request_id,
				startup_id,
			]
		);

		res.status(201).json({
			message: "Funding offer sent",
			offer: result.rows[0],
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_20: Get Investment Portfolio
exports.getPortfolio = async (req, res) => {
	try {
		const investorId = req.user.user_id;

		const investorRes = await pool.query(
			"SELECT investor_id FROM investors WHERE user_id = $1",
			[investorId]
		);

		if (investorRes.rows.length === 0) {
			return res.status(404).json({ message: "Investor profile not found" });
		}

		const investor_id_pk = investorRes.rows[0].investor_id;

		// Get all investments by this investor
		const investmentsRes = await pool.query(
			`SELECT i.*, s.startup_name, p.project_title
			 FROM investments i
			 JOIN investment_requests ir ON i.investment_request_id = ir.investment_request_id
			 JOIN startups s ON ir.startup_id = s.startup_id
			 LEFT JOIN projects p ON ir.project_id = p.project_id
			 WHERE ir.investor_id = $1`,
			[investor_id_pk]
		);

		const totalInvested = investmentsRes.rows.reduce(
			(sum, inv) => sum + (parseFloat(inv.amount) || 0),
			0
		);

		res.json({
			startups: investmentsRes.rows,
			total_investments: investmentsRes.rows.length,
			total_value: totalInvested,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_23: Chat with Startup
exports.sendMessage = async (req, res) => {
	try {
		const investorUserId = req.user.user_id;
		const { startupId } = req.params;
		const { message } = req.body;

		// Get startup user_id
		const startupRes = await pool.query(
			"SELECT user_id FROM startups WHERE startup_id = $1",
			[startupId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup not found" });
		}

		const startupUserId = startupRes.rows[0].user_id;

		// Save message
		const result = await pool.query(
			`INSERT INTO messages (sender_user_id, receiver_user_id, body, subject)
			 VALUES ($1, $2, $3, 'Investment Discussion') RETURNING *`,
			[investorUserId, startupUserId, message]
		);

		res.status(201).json({ message_id: result.rows[0].message_id });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_23: Get Chat Messages
exports.getMessages = async (req, res) => {
	try {
		const investorUserId = req.user.user_id;
		const { startupId } = req.params;
		const { page = 1, limit = 20 } = req.query;

		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		const startupRes = await pool.query(
			"SELECT user_id FROM startups WHERE startup_id = $1",
			[startupId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup not found" });
		}

		const startupUserId = startupRes.rows[0].user_id;

		const result = await pool.query(
			`SELECT * FROM messages 
			 WHERE (sender_user_id = $1 AND receiver_user_id = $2) OR (sender_user_id = $2 AND receiver_user_id = $1)
			 ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
			[investorUserId, startupUserId, limitNum, offset]
		);

		// Mark as read
		await pool.query(
			"UPDATE messages SET is_read = true WHERE receiver_user_id = $1 AND sender_user_id = $2",
			[investorUserId, startupUserId]
		);

		res.json({ messages: result.rows });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_25: Provide Feedback to Startup
exports.sendFeedback = async (req, res) => {
	try {
		const investorUserId = req.user.user_id;
		const { startupId } = req.params;
		const { rating, comment } = req.body;

		// Get investor_id
		const investorRes = await pool.query(
			"SELECT investor_id FROM investors WHERE user_id = $1",
			[investorUserId]
		);

		if (investorRes.rows.length === 0) {
			return res.status(404).json({ message: "Investor profile not found" });
		}

		// Create review/feedback
		const result = await pool.query(
			`INSERT INTO reviews (startup_id, mentor_id, rating, comment)
			 VALUES ($1, $2, $3, $4) RETURNING *`,
			[startupId, investorRes.rows[0].investor_id, rating, comment]
		);

		res.status(201).json({ feedback_id: result.rows[0].review_id });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

module.exports = exports;
