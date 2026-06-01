const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
const pool = require("../config/db");

//Authenticate user 
exports.authenticate = (req, res, next) => {
	const authHeader =
		req.headers["authorization"] ||
		req.headers["Authorization"] ||
		req.headers["x-access-token"];

	if (!authHeader) {
		return res.status(401).send("Access denied. No token.");
	}

	let token = authHeader.replace(/^Bearer\s+/i, "").trim();
	token = token
		.replace(/^"(.+)"$/, "$1")
		.replace(/^'(.+)'$/, "$1")
		.trim();

	if (!token) {
		return res.status(401).send("Access denied. No token.");
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		req.user = decoded; // contains user_id + role
		next();
	} catch (err) {
		res.status(401).send("Invalid token");
	}
};

//Authorize roles 
exports.authorizeRoles = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return res.status(403).json({
				message: "Access denied",
				code: "ROLE_FORBIDDEN",
				requiredRoles: roles,
				currentRole: req.user.role,
			});
		}
		next();
	};
};

// Verified email + admin 
exports.requireApproval = async (req, res, next) => {
	try {
		const userId = req.user.user_id;
		const r = await pool.query(
			"SELECT is_approved, is_active, email_verified, role FROM users WHERE user_id = $1",
			[userId],
		);
		if (r.rows.length === 0)
			return res.status(404).json({ message: "User not found" });
		const u = r.rows[0];
		if (!u.is_active)
			return res.status(403).json({ message: "Account disabled" });
		if (u.role === "Admin") return next();
		if (u.email_verified === false) {
			return res.status(403).json({
				message: "Please verify your email address before using this feature.",
				code: "EMAIL_NOT_VERIFIED",
			});
		}
		if (!u.is_approved) {
			return res.status(403).json({
				message: "Account pending admin approval",
				code: "ACCOUNT_PENDING_APPROVAL",
			});
		}
		next();
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.requireVerifiedAndApprovedIfAuthenticated = async (req, res, next) => {
	const authHeader =
		req.headers["authorization"] ||
		req.headers["Authorization"] ||
		req.headers["x-access-token"];

	if (!authHeader) return next();

	let token = String(authHeader).replace(/^Bearer\s+/i, "").trim();
	token = token
		.replace(/^"(.+)"$/, "$1")
		.replace(/^'(.+)'$/, "$1")
		.trim();

	if (!token) return next();

	let decoded;
	try {
		decoded = jwt.verify(token, JWT_SECRET);
	} catch {
		return next();
	}

	try {
		const r = await pool.query(
			"SELECT is_approved, is_active, email_verified, role FROM users WHERE user_id = $1",
			[decoded.user_id],
		);
		if (r.rows.length === 0) {
			return res.status(404).json({ message: "User not found" });
		}

		const u = r.rows[0];
		if (!u.is_active) {
			return res.status(403).json({ message: "Account disabled" });
		}
		if (u.role === "Admin") {
			return next();
		}
		if (u.email_verified === false) {
			return res.status(403).json({
				message: "Please verify your email address before using this feature.",
				code: "EMAIL_NOT_VERIFIED",
			});
		}
		if (!u.is_approved) {
			return res.status(403).json({
				message: "Account pending admin approval",
				code: "ACCOUNT_PENDING_APPROVAL",
			});
		}

		return next();
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Startups must be admin-approved; other roles pass through unchanged.
exports.requireApprovalIfStartup = async (req, res, next) => {
	if (req.user?.role !== "Startup") {
		return next();
	}
	return exports.requireApproval(req, res, next);
};
