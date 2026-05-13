const pool = require("../config/db");
const path = require("path");
const fs = require("fs");
const mail = require("../utils/mail");

// ============================================
// USER MANAGEMENT ENDPOINTS
// ============================================

// UC_5: Get All Users (Search & Filter)
exports.listUsers = async (req, res) => {
	try {
		const { role, search, page = 1, limit = 20 } = req.query;
		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		let query = "SELECT user_id, first_name, last_name, email, role, is_active, is_approved, created_at FROM users WHERE 1=1";
		const params = [];

		if (role) {
			params.push(role);
			query += ` AND role = $${params.length}`;
		}

		if (search) {
			params.push(`%${search}%`);
			query += ` AND (first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR email ILIKE $${params.length})`;
		}

		const countQuery = query.replace("SELECT user_id, first_name, last_name, email, role, is_active, is_approved, created_at", "SELECT COUNT(*) as total");
		const countResult = await pool.query(countQuery, params.slice(0, params.length - (search ? 1 : 0)));
		const total = parseInt(countResult.rows[0].total);

		query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
		params.push(limitNum, offset);

		const result = await pool.query(query, params);
		res.json({ users: result.rows, total, page: pageNum, limit: limitNum });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_5b: Get User Details
exports.getUser = async (req, res) => {
	try {
		const { userId } = req.params;
		const userRes = await pool.query(
			"SELECT user_id, first_name, last_name, email, role, phone_number, is_active, is_approved, approved_at, approved_by, created_at FROM users WHERE user_id = $1",
			[userId]
		);

		if (userRes.rows.length === 0) {
			return res.status(404).json({ message: "User not found" });
		}

		const user = userRes.rows[0];

		// Get role-specific profile
		let profile = null;
		if (user.role === "Startup") {
			const p = await pool.query("SELECT * FROM startups WHERE user_id = $1", [userId]);
			profile = p.rows[0] || null;
		} else if (user.role === "Investor") {
			const p = await pool.query("SELECT * FROM investors WHERE user_id = $1", [userId]);
			profile = p.rows[0] || null;
		} else if (user.role === "Mentor") {
			const p = await pool.query("SELECT * FROM mentors WHERE user_id = $1", [userId]);
			profile = p.rows[0] || null;
		}

		res.json({ user, profile });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_2: Approve User Accounts
exports.approveUser = async (req, res) => {
	try {
		const { userId } = req.params;
		const admin = req.user;

		const result = await pool.query(
			"UPDATE users SET is_approved = true, approved_by = $1, approved_at = NOW() WHERE user_id = $2 RETURNING user_id, email, is_approved, approved_at",
			[admin.user_id, userId]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ message: "User not found" });
		}

		// Audit log
		await pool.query(
			"INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)",
			[admin.user_id, "approve_user", "users", userId, "User approved"]
		);

		// Notification
		await pool.query(
			"INSERT INTO notifications (user_id, notification_type, title, message) VALUES ($1, $2, $3, $4)",
			[userId, "account", "Account Approved", "Your account has been approved and is now active!"]
		);

		res.json({ message: "User approved successfully", user: result.rows[0] });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_3: Reject User Accounts
exports.rejectUser = async (req, res) => {
	try {
		const { userId } = req.params;
		const { reason } = req.body;
		const admin = req.user;

		const result = await pool.query(
			"UPDATE users SET is_active = false WHERE user_id = $1 RETURNING user_id, email, is_active",
			[userId]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ message: "User not found" });
		}

		// Audit log
		await pool.query(
			"INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)",
			[admin.user_id, "reject_user", "users", userId, reason || "User rejected"]
		);

		// Notification
		await pool.query(
			"INSERT INTO notifications (user_id, notification_type, title, message) VALUES ($1, $2, $3, $4)",
			[userId, "account", "Account Rejected", reason || "Your account registration was rejected."]
		);

		res.json({ message: "User rejected", user: result.rows[0] });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_4: Remove/Disable User Account
exports.deleteUser = async (req, res) => {
	try {
		const { userId } = req.params;
		const { reason } = req.body;
		const admin = req.user;

		// Soft delete - set is_active to false
		const result = await pool.query(
			"UPDATE users SET is_active = false WHERE user_id = $1 RETURNING user_id, email",
			[userId]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ message: "User not found" });
		}

		// Audit log
		await pool.query(
			"INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)",
			[admin.user_id, "delete_user", "users", userId, reason || "User deleted by admin"]
		);

		res.json({ message: "User account deleted/disabled" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// ============================================
// MONITORING & AUDIT ENDPOINTS
// ============================================

// UC_6: Monitor System Activities (Audit Logs)
exports.listAuditLogs = async (req, res) => {
	try {
		const { actor, action, entity_type, page = 1, limit = 20 } = req.query;
		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		let query = "SELECT audit_log_id, actor_user_id, action, entity_type, entity_id, details, created_at FROM audit_logs WHERE 1=1";
		const params = [];

		if (actor) {
			params.push(actor);
			query += ` AND actor_user_id = $${params.length}`;
		}

		if (action) {
			params.push(action);
			query += ` AND action = $${params.length}`;
		}

		if (entity_type) {
			params.push(entity_type);
			query += ` AND entity_type = $${params.length}`;
		}

		const countQuery = query.replace("SELECT audit_log_id, actor_user_id, action, entity_type, entity_id, details, created_at", "SELECT COUNT(*) as total");
		const countResult = await pool.query(countQuery, params);
		const total = parseInt(countResult.rows[0].total);

		query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
		params.push(limitNum, offset);

		const result = await pool.query(query, params);
		res.json({ logs: result.rows, total, page: pageNum, limit: limitNum });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// ============================================
// STARTUP MANAGEMENT ENDPOINTS
// ============================================

// UC_8: Get Startups Pending Approval
exports.listPendingStartups = async (req, res) => {
	try {
		const { page = 1, limit = 20 } = req.query;
		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		const query = `
			SELECT s.startup_id, s.user_id, s.startup_name, s.industry, s.business_stage, s.created_at, 
			       u.first_name, u.last_name, u.email, u.is_approved
			FROM startups s
			JOIN users u ON s.user_id = u.user_id
			WHERE u.is_approved = false
			ORDER BY s.created_at DESC
			LIMIT $1 OFFSET $2
		`;

		const countResult = await pool.query(
			"SELECT COUNT(*) as total FROM startups s JOIN users u ON s.user_id = u.user_id WHERE u.is_approved = false"
		);
		const total = parseInt(countResult.rows[0].total);

		const result = await pool.query(query, [limitNum, offset]);
		res.json({ startups: result.rows, total, page: pageNum, limit: limitNum });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_8: Approve Startup Listing
exports.approveStartup = async (req, res) => {
	try {
		const { startupId } = req.params;
		const admin = req.user;

		// Get the startup and its user
		const startupRes = await pool.query(
			"SELECT user_id FROM startups WHERE startup_id = $1",
			[startupId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup not found" });
		}

		const userId = startupRes.rows[0].user_id;

		// Approve the user
		const result = await pool.query(
			"UPDATE users SET is_approved = true, approved_by = $1, approved_at = NOW() WHERE user_id = $2 RETURNING user_id",
			[admin.user_id, userId]
		);

		// Audit log
		await pool.query(
			"INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)",
			[admin.user_id, "approve_startup", "startups", startupId, "Startup approved"]
		);

		res.json({ message: "Startup approved", startup_id: startupId });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_8: Reject Startup Listing
exports.rejectStartup = async (req, res) => {
	try {
		const { startupId } = req.params;
		const { reason } = req.body;
		const admin = req.user;

		const startupRes = await pool.query(
			"SELECT user_id FROM startups WHERE startup_id = $1",
			[startupId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup not found" });
		}

		const userId = startupRes.rows[0].user_id;

		// Reject the user
		await pool.query(
			"UPDATE users SET is_active = false WHERE user_id = $1",
			[userId]
		);

		// Audit log
		await pool.query(
			"INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)",
			[admin.user_id, "reject_startup", "startups", startupId, reason || "Startup rejected"]
		);

		res.json({ message: "Startup rejected" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// ============================================
// INVESTMENT MANAGEMENT ENDPOINTS
// ============================================

// UC_9: Oversee All Investments
exports.listInvestments = async (req, res) => {
	try {
		const { status, startup_id, investor_id, page = 1, limit = 20 } = req.query;
		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		let query = `
			SELECT i.investment_id, i.amount, i.equity_percentage, i.status, i.created_at,
			       ir.startup_id, ir.investor_id, s.startup_name, inv.organization_name
			FROM investments i
			JOIN investment_requests ir ON i.investment_request_id = ir.investment_request_id
			JOIN startups s ON ir.startup_id = s.startup_id
			JOIN investors inv ON ir.investor_id = inv.investor_id
			WHERE 1=1
		`;
		const params = [];

		if (status) {
			params.push(status);
			query += ` AND i.status = $${params.length}`;
		}

		if (startup_id) {
			params.push(startup_id);
			query += ` AND ir.startup_id = $${params.length}`;
		}

		if (investor_id) {
			params.push(investor_id);
			query += ` AND ir.investor_id = $${params.length}`;
		}

		const countQuery = query.replace(/SELECT.*FROM/, "SELECT COUNT(*) as total FROM");
		const countResult = await pool.query(countQuery, params);
		const total = parseInt(countResult.rows[0].total);

		query += ` ORDER BY i.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
		params.push(limitNum, offset);

		const result = await pool.query(query, params);
		res.json({ investments: result.rows, total, page: pageNum, limit: limitNum });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_9: List Investment Requests
exports.adminListInvestmentRequests = async (req, res) => {
	try {
		const { status, page = 1, limit = 20 } = req.query;
		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		let query = `
			SELECT ir.investment_request_id, ir.startup_id, ir.investor_id, ir.requested_amount, ir.status, ir.created_at,
			       s.startup_name, inv.organization_name
			FROM investment_requests ir
			JOIN startups s ON ir.startup_id = s.startup_id
			JOIN investors inv ON ir.investor_id = inv.investor_id
			WHERE 1=1
		`;
		const params = [];

		if (status) {
			params.push(status);
			query += ` AND ir.status = $${params.length}`;
		}

		const countQuery = query.replace(/SELECT.*FROM/, "SELECT COUNT(*) as total FROM");
		const countResult = await pool.query(countQuery, params);
		const total = parseInt(countResult.rows[0].total);

		query += ` ORDER BY ir.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
		params.push(limitNum, offset);

		const result = await pool.query(query, params);
		res.json({ requests: result.rows, total, page: pageNum, limit: limitNum });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// ============================================
// PAYMENT MANAGEMENT ENDPOINTS
// ============================================

// UC_10: Review Payment Transactions
exports.listPayments = async (req, res) => {
	try {
		const { status, type, page = 1, limit = 20 } = req.query;
		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		let query = "SELECT payment_id, from_user_id, to_user_id, amount, currency, status, created_at FROM payments WHERE 1=1";
		const params = [];

		if (status) {
			params.push(status);
			query += ` AND status = $${params.length}`;
		}

		const countQuery = query.replace(/SELECT.*FROM/, "SELECT COUNT(*) as total FROM");
		const countResult = await pool.query(countQuery, params);
		const total = parseInt(countResult.rows[0].total);

		query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
		params.push(limitNum, offset);

		const result = await pool.query(query, params);
		res.json({ payments: result.rows, total, page: pageNum, limit: limitNum });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// ============================================
// REPORTS ENDPOINTS
// ============================================

// UC_11: Generate System Usage Reports
exports.getUsageReport = async (req, res) => {
	try {
		const { start_date, end_date } = req.query;

		const totalUsers = await pool.query("SELECT COUNT(*) as total FROM users");
		const activeUsers = await pool.query("SELECT COUNT(*) as total FROM users WHERE is_active = true");
		const approvedUsers = await pool.query("SELECT COUNT(*) as total FROM users WHERE is_approved = true");
		const totalStartups = await pool.query("SELECT COUNT(*) as total FROM startups");
		const totalInvestors = await pool.query("SELECT COUNT(*) as total FROM investors");
		const totalMentors = await pool.query("SELECT COUNT(*) as total FROM mentors");

		const usersByRole = await pool.query(
			"SELECT role, COUNT(*) as count FROM users GROUP BY role"
		);

		res.json({
			total_users: parseInt(totalUsers.rows[0].total),
			active_users: parseInt(activeUsers.rows[0].total),
			approved_users: parseInt(approvedUsers.rows[0].total),
			total_startups: parseInt(totalStartups.rows[0].total),
			total_investors: parseInt(totalInvestors.rows[0].total),
			total_mentors: parseInt(totalMentors.rows[0].total),
			users_by_role: usersByRole.rows
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_11: Generate Investment Reports
exports.getInvestmentReport = async (req, res) => {
	try {
		const totalInvested = await pool.query(
			"SELECT SUM(amount) as total FROM investments WHERE status = 'completed'"
		);
		const numDeals = await pool.query(
			"SELECT COUNT(*) as total FROM investments WHERE status = 'completed'"
		);
		const avgInvestment = await pool.query(
			"SELECT AVG(amount) as average FROM investments WHERE status = 'completed'"
		);
		const investmentsByStage = await pool.query(
			"SELECT s.business_stage, COUNT(*) as count, SUM(i.amount) as total FROM investments i JOIN investment_requests ir ON i.investment_request_id = ir.investment_request_id JOIN startups s ON ir.startup_id = s.startup_id GROUP BY s.business_stage"
		);

		res.json({
			total_invested: totalInvested.rows[0].total || 0,
			num_deals: parseInt(numDeals.rows[0].total),
			avg_investment: avgInvestment.rows[0].average || 0,
			investments_by_stage: investmentsByStage.rows
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_11: Generate Mentorship Reports
exports.getMentorshipReport = async (req, res) => {
	try {
		const totalSessions = await pool.query(
			"SELECT COUNT(*) as total FROM mentorship_sessions"
		);
		const totalMentors = await pool.query(
			"SELECT COUNT(*) as total FROM mentors"
		);
		const completedSessions = await pool.query(
			"SELECT COUNT(*) as total FROM mentorship_sessions WHERE status = 'completed'"
		);
		const sessionsByMentor = await pool.query(
			"SELECT m.mentor_id, COUNT(*) as session_count FROM mentorship_sessions ms JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.mentorship_request_id JOIN mentors m ON mr.mentor_id = m.mentor_id GROUP BY m.mentor_id ORDER BY session_count DESC LIMIT 10"
		);

		res.json({
			total_sessions: parseInt(totalSessions.rows[0].total),
			total_mentors: parseInt(totalMentors.rows[0].total),
			completed_sessions: parseInt(completedSessions.rows[0].total),
			top_mentors: sessionsByMentor.rows
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// Helper: List projects for admin
exports.listProjects = async (req, res) => {
	try {
		const { page = 1, limit = 20 } = req.query;
		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		const countResult = await pool.query("SELECT COUNT(*) as total FROM projects");
		const total = parseInt(countResult.rows[0].total);

		const result = await pool.query(
			"SELECT p.project_id, p.startup_id, p.project_title, p.funding_goal, p.amount_raised, p.status, p.created_at, s.startup_name FROM projects p JOIN startups s ON p.startup_id = s.startup_id ORDER BY p.created_at DESC LIMIT $1 OFFSET $2",
			[limitNum, offset]
		);

		res.json({ projects: result.rows, total, page: pageNum, limit: limitNum });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// Helper: Update investment request status
exports.updateInvestmentRequestStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const { status } = req.body;
		const admin = req.user;

		const result = await pool.query(
			"UPDATE investment_requests SET status = $1 WHERE investment_request_id = $2 RETURNING *",
			[status, id]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ message: "Investment request not found" });
		}

		// Audit log
		await pool.query(
			"INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)",
			[admin.user_id, "update_investment_status", "investment_requests", id, `Status changed to ${status}`]
		);

		res.json({ message: "Investment request status updated", request: result.rows[0] });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

module.exports = exports;
