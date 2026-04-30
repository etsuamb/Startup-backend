const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
const REFRESH_TOKEN_EXP_DAYS = parseInt(
	process.env.REFRESH_TOKEN_DAYS || "30",
	10,
);
const crypto = require("crypto");

// ========================
// REGISTER
// ========================
exports.register = async (req, res) => {
	const { first_name, last_name, email, password, role } = req.body;
	const allowedRoles = ["Admin", "Startup", "Investor", "Mentor"];

	try {
		// Basic validation
		if (!first_name || !last_name || !email || !password) {
			return res.status(400).json({
				message: "first_name, last_name, email and password are required",
			});
		}

		// Check if user already exists
		const existingUser = await pool.query(
			"SELECT * FROM users WHERE email = $1",
			[email],
		);

		if (existingUser.rows.length > 0) {
			return res.status(409).json({ message: "User already exists" });
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		// sanitize/validate role
		const assignedRole = allowedRoles.includes(role) ? role : "Startup";

		// Insert user (is_approved is default false)
		const result = await pool.query(
			`INSERT INTO users (first_name, last_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, first_name, last_name, email, role, is_approved`,
			[first_name, last_name, email, hashedPassword, assignedRole],
		);

		return res.status(201).json({
			message: "User registered successfully. Account pending admin approval.",
			user: result.rows[0],
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// ========================
// LOGIN
// ========================
exports.login = async (req, res) => {
	const { email, password } = req.body;

	try {
		// Find user
		const result = await pool.query("SELECT * FROM users WHERE email = $1", [
			email,
		]);

		if (result.rows.length === 0) {
			return res.status(404).json({ message: "User not found" });
		}

		const user = result.rows[0];

		// Check password
		const isMatch = await bcrypt.compare(password, user.password_hash);

		if (!isMatch) {
			return res.status(401).json({ message: "Invalid password" });
		}

		if (!user.is_active) {
			return res.status(403).json({ message: "Account disabled" });
		}

		// NOTE: allow login even if not yet admin-approved so user can continue profile creation
		// Approval gating is enforced by `requireApproval` middleware on protected routes.

		// Generate access token
		const token = jwt.sign(
			{ user_id: user.user_id, role: user.role },
			JWT_SECRET,
			{ expiresIn: "1d" },
		);

		// Create refresh token and persist
		const refreshToken = crypto.randomBytes(48).toString("hex");
		const expiresAt = new Date(
			Date.now() + REFRESH_TOKEN_EXP_DAYS * 24 * 60 * 60 * 1000,
		);
		await pool.query(
			"INSERT INTO refresh_tokens (token, user_id, expires_at, revoked) VALUES ($1, $2, $3, false)",
			[refreshToken, user.user_id, expiresAt],
		);

		return res.json({
			message: "Login successful 🔐",
			token,
			refreshToken,
			user: { user_id: user.user_id, email: user.email, role: user.role },
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// POST /auth/refresh
exports.refresh = async (req, res) => {
	const { refreshToken } = req.body;
	if (!refreshToken)
		return res.status(400).json({ message: "refreshToken required" });

	try {
		const result = await pool.query(
			"SELECT * FROM refresh_tokens WHERE token = $1",
			[refreshToken],
		);
		if (result.rows.length === 0)
			return res.status(401).json({ message: "Invalid refresh token" });

		const row = result.rows[0];
		if (row.revoked)
			return res.status(401).json({ message: "Refresh token revoked" });
		if (new Date(row.expires_at) < new Date())
			return res.status(401).json({ message: "Refresh token expired" });

		const userRes = await pool.query(
			"SELECT user_id, role, is_active, is_approved FROM users WHERE user_id=$1",
			[row.user_id],
		);
		if (userRes.rows.length === 0)
			return res.status(404).json({ message: "User not found" });
		const user = userRes.rows[0];
		if (!user.is_active)
			return res.status(403).json({ message: "Account disabled" });
		// allow refresh for unapproved users so they can continue profile creation;
		// requireApproval middleware still protects important endpoints.

		const token = jwt.sign(
			{ user_id: user.user_id, role: user.role },
			JWT_SECRET,
			{ expiresIn: "1d" },
		);
		return res.json({ token });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// POST /auth/logout
exports.logout = async (req, res) => {
	const { refreshToken } = req.body;
	if (!refreshToken)
		return res.status(400).json({ message: "refreshToken required" });

	try {
		await pool.query(
			"UPDATE refresh_tokens SET revoked = true WHERE token = $1",
			[refreshToken],
		);
		return res.json({ message: "Logged out" });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// PUT /auth/approve/:userId  (Admin only)
// Delegate to adminController.approveUser to avoid duplicate logic
const adminController = require("./adminController");
exports.approveUser = async (req, res) => {
	return adminController.approveUser(req, res);
};
