const pool = require("../config/db");
const path = require("path");
const fs = require("fs");
const mail = require("../utils/mail");

// GET /api/admin/users/pending
exports.listPendingUsers = async (_req, res) => {
	try {
		const usersRes = await pool.query(
			`SELECT user_id, first_name, last_name, email, role, phone_number, created_at
       FROM users WHERE is_approved = false ORDER BY created_at DESC`,
		);

		return res.json({ pending: usersRes.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// GET /api/admin/users/pending/:userId
// Returns user account and role-specific profile + uploaded documents
exports.getPendingUser = async (req, res) => {
	const { userId } = req.params;
	try {
		const userRes = await pool.query(
			`SELECT user_id, first_name, last_name, email, role, phone_number, is_approved, created_at
       FROM users WHERE user_id = $1`,
			[userId],
		);
		if (userRes.rows.length === 0)
			return res.status(404).json({ message: "User not found" });
		const user = userRes.rows[0];

		// fetch role-specific profile
		let profile = null;
		if (user.role === "Startup") {
			const p = await pool.query("SELECT * FROM startups WHERE user_id = $1", [
				userId,
			]);
			profile = p.rows[0] || null;
		} else if (user.role === "Investor") {
			const p = await pool.query("SELECT * FROM investors WHERE user_id = $1", [
				userId,
			]);
			profile = p.rows[0] || null;
		} else if (user.role === "Mentor") {
			const p = await pool.query("SELECT * FROM mentors WHERE user_id = $1", [
				userId,
			]);
			profile = p.rows[0] || null;
		}

		// fetch documents if startup
		let documents = [];
		if (user.role === "Startup" && profile && profile.startup_id) {
			const docs = await pool.query(
				"SELECT document_id, file_name, file_path, file_type, file_size_bytes, created_at FROM documents WHERE startup_id = $1",
				[profile.startup_id],
			);
			documents = docs.rows;
		} else if (user.role === "Mentor" && profile && profile.mentor_id) {
			const docs = await pool.query(
				"SELECT mentor_document_id AS document_id, document_type, file_name, file_path, file_type, file_size_bytes, created_at FROM mentor_documents WHERE mentor_id = $1",
				[profile.mentor_id],
			);
			documents = docs.rows;
		}

		return res.json({ user, profile, documents });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// PUT /api/admin/users/reject/:userId  (mark is_active=false)
exports.rejectUser = async (req, res) => {
	const { userId } = req.params;
	const admin = req.user;
	const { reason } = req.body;
	try {
		const result = await pool.query(
			"UPDATE users SET is_active = false WHERE user_id = $1 RETURNING user_id, email, is_active",
			[userId],
		);
		if (result.rows.length === 0)
			return res.status(404).json({ message: "User not found" });

		// audit
		await pool.query(
			`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			[admin.user_id, "reject_user", "users", userId, reason || null, null],
		);

		// notify the user
		await pool.query(
			`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			[
				userId,
				"account",
				"Account rejected",
				reason || "Your account was rejected by an administrator.",
				"users",
				userId,
			],
		);

		// send rejection email if available
		try {
			const userEmailRes = await pool.query(
				"SELECT email FROM users WHERE user_id = $1",
				[userId],
			);
			const to = userEmailRes.rows[0] && userEmailRes.rows[0].email;
			if (to) {
				await mail.sendMail(
					to,
					"Account rejected — StartupConnect",
					`Hello,\n\nYour account registration was rejected. Reason: ${reason || "Not specified"}`,
					`<p>Hello,</p><p>Your account registration was <strong>rejected</strong>.</p><p>Reason: ${reason || "Not specified"}</p>`,
				);
			}
		} catch (e) {
			console.error("Failed sending rejection email", e.message || e);
		}

		return res.json({
			message: "User rejected and deactivated",
			user: result.rows[0],
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// GET /api/admin/users  (search / list)
exports.searchUsers = async (req, res) => {
	const { q, role, limit = 50, offset = 0 } = req.query;
	try {
		let base = `SELECT user_id, first_name, last_name, email, role, is_active, is_approved, created_at FROM users`;
		const where = [];
		const params = [];
		if (q) {
			params.push(`%${q}%`);
			where.push(
				`(first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR email ILIKE $${params.length})`,
			);
		}
		if (role) {
			params.push(role);
			where.push(`role = $${params.length}`);
		}
		const whereClause = where.length > 0 ? ` WHERE ${where.join(" AND ")}` : "";
		params.push(limit);
		params.push(offset);
		const qstr = `${base}${whereClause} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
		const r = await pool.query(qstr, params);
		return res.json({ users: r.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// GET /api/admin/audit-logs
exports.listAuditLogs = async (req, res) => {
	const { limit = 100, offset = 0 } = req.query;
	try {
		const r = await pool.query(
			`SELECT audit_log_id, actor_user_id, action, entity_type, entity_id, details, metadata, created_at
			 FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
			[limit, offset],
		);
		return res.json({ logs: r.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// PUT /api/admin/users/approve/:userId  (Admin only, with optional comment)
exports.approveUser = async (req, res) => {
	const { userId } = req.params;
	const admin = req.user;
	const { comment } = req.body;
	try {
		const result = await pool.query(
			"UPDATE users SET is_approved = true, approved_by = $1, approved_at = NOW() WHERE user_id = $2 RETURNING user_id, email, is_approved",
			[admin.user_id, userId],
		);
		if (result.rows.length === 0)
			return res.status(404).json({ message: "User not found" });

		// audit
		await pool.query(
			`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			[admin.user_id, "approve_user", "users", userId, comment || null, null],
		);

		// notify the user
		await pool.query(
			`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			[
				userId,
				"account",
				"Account approved",
				"Your account has been approved by an administrator.",
				"users",
				userId,
			],
		);

		return res.json({ message: "User approved", user: result.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// GET /api/admin/documents/:documentId  -> download the stored document (secure)
exports.getDocument = async (req, res) => {
	const { documentId } = req.params;
	try {
		const r = await pool.query(
			"SELECT * FROM documents WHERE document_id = $1",
			[documentId],
		);
		if (r.rows.length === 0)
			return res.status(404).json({ message: "Document not found" });
		const doc = r.rows[0];
		const uploadsDir = path.resolve(process.cwd(), "uploads");
		const absPath = path.resolve(process.cwd(), doc.file_path);
		if (!absPath.startsWith(uploadsDir))
			return res.status(400).json({ message: "Invalid file path" });
		if (!fs.existsSync(absPath))
			return res.status(404).json({ message: "File missing on server" });
		return res.sendFile(absPath);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getMentorDocument = async (req, res) => {
	const { documentId } = req.params;
	try {
		const r = await pool.query(
			"SELECT * FROM mentor_documents WHERE mentor_document_id = $1",
			[documentId],
		);
		if (r.rows.length === 0)
			return res.status(404).json({ message: "Document not found" });
		const doc = r.rows[0];
		const uploadsDir = path.resolve(process.cwd(), "uploads");
		const absPath = path.resolve(process.cwd(), doc.file_path);
		if (!absPath.startsWith(uploadsDir))
			return res.status(400).json({ message: "Invalid file path" });
		if (!fs.existsSync(absPath))
			return res.status(404).json({ message: "File missing on server" });
		return res.sendFile(absPath);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.deleteMentorDocumentAdmin = async (req, res) => {
	const { documentId } = req.params;
	const admin = req.user;
	try {
		const id = Number(documentId);
		if (!Number.isInteger(id) || id <= 0) {
			return res.status(400).json({ message: "Invalid document id" });
		}

		const r = await pool.query(
			`SELECT md.*, m.user_id AS owner_user_id FROM mentor_documents md JOIN mentors m ON m.mentor_id = md.mentor_id WHERE md.mentor_document_id = $1`,
			[id],
		);

		if (!r.rowCount)
			return res.status(404).json({ message: "Document not found" });
		const doc = r.rows[0];

		const uploadsDir = path.resolve(process.cwd(), "uploads");
		const absPath = path.resolve(process.cwd(), doc.file_path);
		if (absPath.startsWith(uploadsDir) && fs.existsSync(absPath)) {
			try {
				fs.unlinkSync(absPath);
			} catch (e) {
				console.error("Failed removing file:", e.message || e);
			}
		}

		await pool.query(
			"DELETE FROM mentor_documents WHERE mentor_document_id = $1",
			[id],
		);

		await pool.query(
			`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata)
			 VALUES ($1,$2,$3,$4,$5,$6)`,
			[
				admin.user_id,
				"delete_mentor_document",
				"mentor_documents",
				id,
				`Deleted mentor document ${doc.file_name} for mentor_id ${doc.mentor_id}`,
				null,
			],
		);

		if (doc.owner_user_id) {
			await pool.query(
				`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
				 VALUES ($1,$2,$3,$4,$5,$6)`,
				[
					doc.owner_user_id,
					"mentor_document",
					"Document removed by admin",
					`An administrator removed your uploaded document ${doc.file_name}`,
					"mentor_documents",
					id,
				],
			);
		}

		return res.json({ message: "Mentor document deleted by admin" });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// GET /api/admin/users/:userId  -> full user + profile (admin view)
exports.getUser = async (req, res) => {
	const { userId } = req.params;
	try {
		const userRes = await pool.query(
			`SELECT user_id, first_name, last_name, email, role, phone_number, is_active, is_approved, created_at
			 FROM users WHERE user_id = $1`,
			[userId],
		);
		if (!userRes.rowCount)
			return res.status(404).json({ message: "User not found" });
		const user = userRes.rows[0];

		let profile = null;
		if (user.role === "Startup") {
			const p = await pool.query("SELECT * FROM startups WHERE user_id = $1", [
				userId,
			]);
			profile = p.rows[0] || null;
		} else if (user.role === "Investor") {
			const p = await pool.query("SELECT * FROM investors WHERE user_id = $1", [
				userId,
			]);
			profile = p.rows[0] || null;
		} else if (user.role === "Mentor") {
			const p = await pool.query("SELECT * FROM mentors WHERE user_id = $1", [
				userId,
			]);
			profile = p.rows[0] || null;
		}

		return res.json({ user, profile });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// DELETE /api/admin/users/:userId  -> deactivate or hard delete when ?hard=true
exports.deleteUser = async (req, res) => {
	const { userId } = req.params;
	const { hard } = req.query;
	const admin = req.user;
	try {
		if (hard === "true") {
			// hard delete (dangerous) - cascade will remove related rows
			const r = await pool.query(
				"DELETE FROM users WHERE user_id = $1 RETURNING user_id, email",
				[userId],
			);
			if (!r.rowCount)
				return res.status(404).json({ message: "User not found" });
			await pool.query(
				`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata)
				 VALUES ($1,$2,$3,$4,$5,$6)`,
				[admin.user_id, "delete_user", "users", userId, "hard delete", null],
			);
			return res.json({ message: "User hard-deleted", user: r.rows[0] });
		}

		// soft deactivate
		const r = await pool.query(
			"UPDATE users SET is_active = false WHERE user_id = $1 RETURNING user_id, email, is_active",
			[userId],
		);
		if (!r.rowCount) return res.status(404).json({ message: "User not found" });
		await pool.query(
			`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata)
			 VALUES ($1,$2,$3,$4,$5,$6)`,
			[admin.user_id, "deactivate_user", "users", userId, null, null],
		);
		await pool.query(
			`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
			 VALUES ($1,$2,$3,$4,$5,$6)`,
			[
				userId,
				"account",
				"Account deactivated",
				"Your account was deactivated by an administrator.",
				"users",
				userId,
			],
		);
		return res.json({ message: "User deactivated", user: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// GET /api/admin/startups
exports.listStartups = async (req, res) => {
	const { limit = 100, offset = 0 } = req.query;
	try {
		const r = await pool.query(
			`SELECT s.*, u.email AS owner_email, u.is_active, u.is_approved
			 FROM startups s
			 JOIN users u ON u.user_id = s.user_id
			 ORDER BY s.created_at DESC
			 LIMIT $1 OFFSET $2`,
			[limit, offset],
		);
		return res.json({ startups: r.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// PUT /api/admin/startups/:startupId/remove  -> deactivate startup owner
exports.removeStartupListing = async (req, res) => {
	const { startupId } = req.params;
	const admin = req.user;
	try {
		const rr = await pool.query(
			"SELECT user_id FROM startups WHERE startup_id = $1",
			[startupId],
		);
		if (!rr.rowCount)
			return res.status(404).json({ message: "Startup not found" });
		const userId = rr.rows[0].user_id;
		const r = await pool.query(
			"UPDATE users SET is_active = false WHERE user_id = $1 RETURNING user_id, email, is_active",
			[userId],
		);
		await pool.query(
			`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata)
			 VALUES ($1,$2,$3,$4,$5,$6)`,
			[
				admin.user_id,
				"remove_startup_listing",
				"startups",
				startupId,
				null,
				null,
			],
		);
		return res.json({
			message: "Startup listing removed (owner deactivated)",
			user: r.rows[0],
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// PUT /api/admin/startups/:startupId/approve  -> set is_listed = true (create column if missing)
exports.approveStartup = async (req, res) => {
	const { startupId } = req.params;
	const admin = req.user;
	try {
		// ensure column exists
		await pool.query(
			"ALTER TABLE startups ADD COLUMN IF NOT EXISTS is_listed BOOLEAN DEFAULT FALSE",
		);
		const rr = await pool.query(
			"UPDATE startups SET is_listed = true WHERE startup_id = $1 RETURNING *",
			[startupId],
		);
		if (!rr.rowCount)
			return res.status(404).json({ message: "Startup not found" });
		// notify owner
		const uidRes = await pool.query(
			"SELECT user_id FROM startups WHERE startup_id = $1",
			[startupId],
		);
		const uid = uidRes.rows[0] && uidRes.rows[0].user_id;
		if (uid) {
			await pool.query(
				`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id) VALUES ($1,$2,$3,$4,$5,$6)`,
				[
					uid,
					"startup",
					"Startup listing approved",
					"Your startup listing has been approved and is now visible.",
					"startups",
					startupId,
				],
			);
		}
		await pool.query(
			`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata) VALUES ($1,$2,$3,$4,$5,$6)`,
			[admin.user_id, "approve_startup", "startups", startupId, null, null],
		);
		return res.json({
			message: "Startup approved/listed",
			startup: rr.rows[0],
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// PUT /api/admin/startups/:startupId/unapprove  -> set is_listed = false
exports.unapproveStartup = async (req, res) => {
	const { startupId } = req.params;
	const admin = req.user;
	const { reason } = req.body || {};
	try {
		await pool.query(
			"ALTER TABLE startups ADD COLUMN IF NOT EXISTS is_listed BOOLEAN DEFAULT FALSE",
		);
		const rr = await pool.query(
			"UPDATE startups SET is_listed = false WHERE startup_id = $1 RETURNING *",
			[startupId],
		);
		if (!rr.rowCount)
			return res.status(404).json({ message: "Startup not found" });
		const uidRes = await pool.query(
			"SELECT user_id FROM startups WHERE startup_id = $1",
			[startupId],
		);
		const uid = uidRes.rows[0] && uidRes.rows[0].user_id;
		if (uid) {
			await pool.query(
				`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id) VALUES ($1,$2,$3,$4,$5,$6)`,
				[
					uid,
					"startup",
					"Startup listing unapproved",
					reason
						? `Listing unapproved: ${reason}`
						: "Your startup listing was unapproved by admin.",
					"startups",
					startupId,
				],
			);
		}
		await pool.query(
			`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata) VALUES ($1,$2,$3,$4,$5,$6)`,
			[
				admin.user_id,
				"unapprove_startup",
				"startups",
				startupId,
				reason || null,
				null,
			],
		);
		return res.json({
			message: "Startup unapproved/unlisted",
			startup: rr.rows[0],
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// PUT /api/admin/mentors/:mentorId/approve  -> set mentors.is_approved = true
exports.approveMentor = async (req, res) => {
	const { mentorId } = req.params;
	const admin = req.user;
	try {
		await pool.query(
			"ALTER TABLE mentors ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE",
		);
		await pool.query(
			"ALTER TABLE mentors ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) NOT NULL DEFAULT 'pending'",
		);
		const rr = await pool.query(
			"UPDATE mentors SET is_approved = true, verification_status = 'approved' WHERE mentor_id = $1 RETURNING *",
			[mentorId],
		);
		if (!rr.rowCount)
			return res.status(404).json({ message: "Mentor not found" });
		const uidRes = await pool.query(
			"SELECT user_id FROM mentors WHERE mentor_id = $1",
			[mentorId],
		);
		const uid = uidRes.rows[0] && uidRes.rows[0].user_id;
		if (uid) {
			await pool.query(
				`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id) VALUES ($1,$2,$3,$4,$5,$6)`,
				[
					uid,
					"mentor",
					"Mentor profile approved",
					"Your mentor profile has been approved.",
					"mentors",
					mentorId,
				],
			);
		}
		await pool.query(
			`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata) VALUES ($1,$2,$3,$4,$5,$6)`,
			[admin.user_id, "approve_mentor", "mentors", mentorId, null, null],
		);
		return res.json({ message: "Mentor approved", mentor: rr.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// PUT /api/admin/mentors/:mentorId/unapprove
exports.unapproveMentor = async (req, res) => {
	const { mentorId } = req.params;
	const admin = req.user;
	const { reason } = req.body || {};
	try {
		await pool.query(
			"ALTER TABLE mentors ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE",
		);
		await pool.query(
			"ALTER TABLE mentors ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) NOT NULL DEFAULT 'pending'",
		);
		const rr = await pool.query(
			"UPDATE mentors SET is_approved = false, verification_status = 'rejected' WHERE mentor_id = $1 RETURNING *",
			[mentorId],
		);
		if (!rr.rowCount)
			return res.status(404).json({ message: "Mentor not found" });
		const uidRes = await pool.query(
			"SELECT user_id FROM mentors WHERE mentor_id = $1",
			[mentorId],
		);
		const uid = uidRes.rows[0] && uidRes.rows[0].user_id;
		if (uid) {
			await pool.query(
				`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id) VALUES ($1,$2,$3,$4,$5,$6)`,
				[
					uid,
					"mentor",
					"Mentor profile unapproved",
					reason
						? `Unapproved: ${reason}`
						: "Your mentor profile was unapproved by admin.",
					"mentors",
					mentorId,
				],
			);
		}
		await pool.query(
			`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata) VALUES ($1,$2,$3,$4,$5,$6)`,
			[
				admin.user_id,
				"unapprove_mentor",
				"mentors",
				mentorId,
				reason || null,
				null,
			],
		);
		return res.json({ message: "Mentor unapproved", mentor: rr.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// PUT /api/admin/investors/:investorId/approve
exports.approveInvestor = async (req, res) => {
	const { investorId } = req.params;
	const admin = req.user;
	try {
		await pool.query(
			"ALTER TABLE investors ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE",
		);
		const rr = await pool.query(
			"UPDATE investors SET is_approved = true WHERE investor_id = $1 RETURNING *",
			[investorId],
		);
		if (!rr.rowCount)
			return res.status(404).json({ message: "Investor not found" });
		const uidRes = await pool.query(
			"SELECT user_id FROM investors WHERE investor_id = $1",
			[investorId],
		);
		const uid = uidRes.rows[0] && uidRes.rows[0].user_id;
		if (uid) {
			await pool.query(
				`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id) VALUES ($1,$2,$3,$4,$5,$6)`,
				[
					uid,
					"investor",
					"Investor profile approved",
					"Your investor profile has been approved.",
					"investors",
					investorId,
				],
			);
		}
		await pool.query(
			`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata) VALUES ($1,$2,$3,$4,$5,$6)`,
			[admin.user_id, "approve_investor", "investors", investorId, null, null],
		);
		return res.json({ message: "Investor approved", investor: rr.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// PUT /api/admin/investors/:investorId/unapprove
exports.unapproveInvestor = async (req, res) => {
	const { investorId } = req.params;
	const admin = req.user;
	const { reason } = req.body || {};
	try {
		await pool.query(
			"ALTER TABLE investors ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE",
		);
		const rr = await pool.query(
			"UPDATE investors SET is_approved = false WHERE investor_id = $1 RETURNING *",
			[investorId],
		);
		if (!rr.rowCount)
			return res.status(404).json({ message: "Investor not found" });
		const uidRes = await pool.query(
			"SELECT user_id FROM investors WHERE investor_id = $1",
			[investorId],
		);
		const uid = uidRes.rows[0] && uidRes.rows[0].user_id;
		if (uid) {
			await pool.query(
				`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id) VALUES ($1,$2,$3,$4,$5,$6)`,
				[
					uid,
					"investor",
					"Investor profile unapproved",
					reason
						? `Unapproved: ${reason}`
						: "Your investor profile was unapproved by admin.",
					"investors",
					investorId,
				],
			);
		}
		await pool.query(
			`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata) VALUES ($1,$2,$3,$4,$5,$6)`,
			[
				admin.user_id,
				"unapprove_investor",
				"investors",
				investorId,
				reason || null,
				null,
			],
		);
		return res.json({ message: "Investor unapproved", investor: rr.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// PUT /api/admin/projects/:projectId/status
exports.updateProjectStatus = async (req, res) => {
	const { projectId } = req.params;
	const { status, comment } = req.body || {};
	const admin = req.user;
	try {
		const allowed = ["draft", "active", "funded", "completed", "cancelled"];
		if (!allowed.includes(status))
			return res.status(400).json({ error: "Invalid status" });
		const r = await pool.query(
			"UPDATE projects SET status = $1 WHERE project_id = $2 RETURNING *",
			[status, projectId],
		);
		if (!r.rowCount)
			return res.status(404).json({ message: "Project not found" });
		await pool.query(
			`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata)
			 VALUES ($1,$2,$3,$4,$5,$6)`,
			[
				admin.user_id,
				"update_project_status",
				"projects",
				projectId,
				comment || null,
				null,
			],
		);
		return res.json({ message: "Project status updated", project: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// GET /api/admin/reports/overview
exports.reportsOverview = async (req, res) => {
	try {
		const counts = await pool.query(
			`SELECT
				 (SELECT COUNT(*)::int FROM users) AS users,
				 (SELECT COUNT(*)::int FROM users WHERE role='Startup') AS startups,
				 (SELECT COUNT(*)::int FROM users WHERE role='Investor') AS investors,
				 (SELECT COUNT(*)::int FROM users WHERE role='Mentor') AS mentors,
				 (SELECT COUNT(*)::int FROM projects) AS projects,
				 (SELECT COUNT(*)::int FROM investment_requests) AS investment_requests,
				 (SELECT COUNT(*)::int FROM investments) AS investments,
				 (SELECT COUNT(*)::int FROM payments) AS payments
			 `,
		);
		return res.json({ overview: counts.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Maintenance endpoints (limited safe ops)
// GET /api/admin/maintenance/status
exports.maintenanceStatus = async (_req, res) => {
	try {
		const r = await pool.query("SELECT 1");
		return res.json({ database: "ok", timestamp: new Date().toISOString() });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// POST /api/admin/maintenance/clear-audit-logs  body: { days: 90 }
exports.clearOldAuditLogs = async (req, res) => {
	const { days = 365 } = req.body || {};
	const admin = req.user;
	try {
		const cutoff = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
		const r = await pool.query(
			"DELETE FROM audit_logs WHERE created_at < $1 RETURNING audit_log_id",
			[cutoff],
		);
		await pool.query(
			`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata)
			 VALUES ($1,$2,$3,$4,$5,$6)`,
			[
				admin.user_id,
				"clear_old_audit_logs",
				"audit_logs",
				null,
				`deleted ${r.rowCount} logs older than ${days} days`,
				null,
			],
		);
		return res.json({ message: "Old audit logs cleared", deleted: r.rowCount });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// POST /api/admin/create-admin
// body: { first_name, last_name, email, password, privilege_level }
exports.createAdmin = async (req, res) => {
	const {
		first_name,
		last_name,
		email,
		password,
		privilege_level = 1,
	} = req.body || {};
	const adminUser = req.user;
	try {
		if (!first_name || !last_name || !email || !password) {
			return res
				.status(400)
				.json({ error: "first_name,last_name,email,password required" });
		}

		// Prevent creation if email already exists
		const existing = await pool.query(
			"SELECT user_id FROM users WHERE email = $1",
			[email],
		);
		if (existing.rowCount)
			return res.status(409).json({ error: "User already exists" });

		const bcrypt = require("bcrypt");
		const hashed = await bcrypt.hash(password, 10);

		const r = await pool.query(
			`INSERT INTO users (first_name, last_name, email, password_hash, role, is_approved, is_active)
			 VALUES ($1,$2,$3,$4,'Admin',true,true) RETURNING user_id, email`,
			[first_name, last_name, email, hashed],
		);

		const userId = r.rows[0].user_id;
		// insert into admins table
		await pool.query(
			"INSERT INTO admins (user_id, privilege_level) VALUES ($1,$2)",
			[userId, Number(privilege_level) || 1],
		);

		await pool.query(
			`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata)
			 VALUES ($1,$2,$3,$4,$5,$6)`,
			[adminUser.user_id, "create_admin", "users", userId, null, null],
		);

		return res.status(201).json({ message: "Admin created", admin: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// DELETE /api/admin/projects/:projectId/remove  (content moderation - remove project)
exports.removeProject = async (req, res) => {
	const { projectId } = req.params;
	const admin = req.user;
	try {
		const r = await pool.query(
			"UPDATE projects SET status = $1 WHERE project_id = $2 RETURNING *",
			["cancelled", projectId],
		);
		if (!r.rowCount)
			return res.status(404).json({ message: "Project not found" });
		await pool.query(
			`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata)
			 VALUES ($1,$2,$3,$4,$5,$6)`,
			[admin.user_id, "remove_project", "projects", projectId, null, null],
		);
		return res.json({ message: "Project removed", project: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// PUT /api/admin/projects/:projectId/restore  (restore project to active)
exports.restoreProject = async (req, res) => {
	const { projectId } = req.params;
	const admin = req.user;
	try {
		const r = await pool.query(
			"UPDATE projects SET status = $1 WHERE project_id = $2 RETURNING *",
			["active", projectId],
		);
		if (!r.rowCount)
			return res.status(404).json({ message: "Project not found" });
		await pool.query(
			`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata)
			 VALUES ($1,$2,$3,$4,$5,$6)`,
			[admin.user_id, "restore_project", "projects", projectId, null, null],
		);
		return res.json({ message: "Project restored", project: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// DELETE /api/admin/mentorship/resources/:id  (remove resource)
exports.deleteMentorshipResource = async (req, res) => {
	const { id } = req.params;
	const admin = req.user;
	try {
		const r = await pool.query(
			"DELETE FROM mentorship_resources WHERE resource_id = $1 RETURNING *",
			[id],
		);
		if (!r.rowCount)
			return res.status(404).json({ message: "Resource not found" });
		await pool.query(
			`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata)
			 VALUES ($1,$2,$3,$4,$5,$6)`,
			[
				admin.user_id,
				"delete_mentorship_resource",
				"mentorship_resources",
				id,
				null,
				null,
			],
		);
		return res.json({ message: "Resource deleted", resource: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// DELETE /api/admin/documents/:documentId  (remove document and attempt to unlink file)
exports.deleteDocumentAdmin = async (req, res) => {
	const { documentId } = req.params;
	const admin = req.user;
	try {
		const r = await pool.query(
			"SELECT * FROM documents WHERE document_id = $1",
			[documentId],
		);
		if (!r.rowCount)
			return res.status(404).json({ message: "Document not found" });
		const doc = r.rows[0];
		// try unlink file
		try {
			const fs = require("fs");
			const path = require("path");
			const abs = path.resolve(process.cwd(), doc.file_path);
			if (fs.existsSync(abs)) {
				fs.unlinkSync(abs);
			}
		} catch (e) {
			// ignore file unlink errors
			console.error("unlink failed", e.message || e);
		}
		const del = await pool.query(
			"DELETE FROM documents WHERE document_id = $1 RETURNING *",
			[documentId],
		);
		await pool.query(
			`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata)
			 VALUES ($1,$2,$3,$4,$5,$6)`,
			[admin.user_id, "delete_document", "documents", documentId, null, null],
		);
		return res.json({ message: "Document removed", document: del.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// GET /api/admin/audit-logs/export?since=2026-01-01&until=2026-04-30
// returns CSV
exports.exportAuditLogs = async (req, res) => {
	const { since, until } = req.query;
	try {
		const params = [];
		let where = "";
		if (since) {
			params.push(since);
			where += ` AND created_at >= $${params.length}`;
		}
		if (until) {
			params.push(until);
			where += ` AND created_at <= $${params.length}`;
		}
		const q = `SELECT audit_log_id, actor_user_id, action, entity_type, entity_id, details, metadata, created_at FROM audit_logs WHERE 1=1 ${where} ORDER BY created_at DESC`;
		const r = await pool.query(q, params);
		// build CSV
		res.setHeader("Content-Type", "text/csv");
		res.setHeader(
			"Content-Disposition",
			'attachment; filename="audit_logs.csv"',
		);
		const rows = r.rows;
		const header =
			"audit_log_id,actor_user_id,action,entity_type,entity_id,details,metadata,created_at\n";
		res.write(header);
		for (const row of rows) {
			const line = `${row.audit_log_id},${row.actor_user_id || ""},${(row.action || "").replace(/\,/g, " ")},${row.entity_type || ""},${row.entity_id || ""},"${(row.details || "").toString().replace(/"/g, '""')}","${JSON.stringify(row.metadata || {}).replace(/"/g, '""')}",${row.created_at.toISOString()}\n`;
			res.write(line);
		}
		return res.end();
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// GET /api/admin/reports/export?type=users|projects|investments
exports.exportReportCSV = async (req, res) => {
	const { type } = req.query;
	try {
		let q;
		if (type === "users") {
			q = `SELECT user_id, first_name, last_name, email, role, is_active, is_approved, created_at FROM users ORDER BY created_at DESC`;
		} else if (type === "projects") {
			q = `SELECT project_id, project_title, startup_id, funding_goal, amount_raised, status, start_date, end_date, created_at FROM projects ORDER BY created_at DESC`;
		} else if (type === "investments") {
			q = `SELECT investment_id, investment_request_id, amount, equity_percentage, status, created_at FROM investments ORDER BY created_at DESC`;
		} else {
			return res.status(400).json({ error: "unknown report type" });
		}
		const r = await pool.query(q);
		res.setHeader("Content-Type", "text/csv");
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="${type}_report.csv"`,
		);
		if (r.rows.length === 0) return res.end("");
		const keys = Object.keys(r.rows[0]);
		res.write(keys.join(",") + "\n");
		for (const row of r.rows) {
			const vals = keys.map((k) => {
				const v = row[k];
				if (v === null || v === undefined) return "";
				if (v instanceof Date) return v.toISOString();
				return String(v).replace(/\"/g, '"');
			});
			res.write(vals.join(",") + "\n");
		}
		return res.end();
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// POST /api/admin/reports/schedule  (placeholder: records request in audit_logs as scheduled)
exports.scheduleReport = async (req, res) => {
	const { type, run_at } = req.body || {};
	const admin = req.user;
	try {
		await pool.query(
			`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata)
			 VALUES ($1,$2,$3,$4,$5,$6)`,
			[
				admin.user_id,
				"schedule_report",
				"reports",
				null,
				`type=${type} run_at=${run_at || "immediate"}`,
				null,
			],
		);
		return res.json({
			message: "Report scheduled (placeholder)",
			type,
			run_at: run_at || "immediate",
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// GET /api/admin/projects
exports.listProjects = async (req, res) => {
	const { limit = 100, offset = 0 } = req.query;
	try {
		const r = await pool.query(
			`SELECT p.*, s.startup_name, u.email AS startup_email
			 FROM projects p
			 JOIN startups s ON s.startup_id = p.startup_id
			 JOIN users u ON u.user_id = s.user_id
			 ORDER BY p.created_at DESC
			 LIMIT $1 OFFSET $2`,
			[limit, offset],
		);
		return res.json({ projects: r.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// GET /api/admin/investment-requests
exports.adminListInvestmentRequests = async (req, res) => {
	try {
		const r = await pool.query(
			`SELECT ir.*, s.startup_name, i.organization_name AS investor_organization, p.project_title
			 FROM investment_requests ir
			 JOIN startups s ON s.startup_id = ir.startup_id
			 JOIN investors i ON i.investor_id = ir.investor_id
			 JOIN projects p ON p.project_id = ir.project_id
			 ORDER BY ir.created_at DESC`,
		);
		return res.json({ investment_requests: r.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// PUT /api/admin/investment-requests/:id/status
// body: { status: 'approved'|'rejected'|'withdrawn'|'pending', comment?: string }
exports.updateInvestmentRequestStatus = async (req, res) => {
	const { id } = req.params;
	const { status, comment } = req.body || {};
	const admin = req.user;
	try {
		const allowed = ["pending", "approved", "rejected", "withdrawn"];
		if (!allowed.includes(status))
			return res.status(400).json({ error: "Invalid status" });

		const result = await pool.query(
			"UPDATE investment_requests SET status = $1 WHERE investment_request_id = $2 RETURNING *",
			[status, id],
		);
		if (result.rows.length === 0)
			return res.status(404).json({ message: "Investment request not found" });

		// audit log
		await pool.query(
			`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata)
			 VALUES ($1,$2,$3,$4,$5,$6)`,
			[
				admin.user_id,
				"update_investment_request",
				"investment_requests",
				id,
				comment || null,
				null,
			],
		);

		// notify both startup and investor users
		const rr = await pool.query(
			`SELECT ir.*, su.user_id AS startup_user_id, iu.user_id AS investor_user_id
			 FROM investment_requests ir
			 JOIN startups s ON s.startup_id = ir.startup_id
			 JOIN users su ON su.user_id = s.user_id
			 JOIN investors inv ON inv.investor_id = ir.investor_id
			 JOIN users iu ON iu.user_id = inv.user_id
			 WHERE ir.investment_request_id = $1`,
			[id],
		);

		if (rr.rowCount) {
			const row = rr.rows[0];
			const title = `Investment request ${status}`;
			const message =
				comment || `Investment request has been ${status} by an administrator.`;

			// notify startup
			await pool.query(
				`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
				 VALUES ($1,$2,$3,$4,$5,$6)`,
				[
					row.startup_user_id,
					"investment",
					title,
					message,
					"investment_requests",
					id,
				],
			);

			// notify investor
			await pool.query(
				`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
				 VALUES ($1,$2,$3,$4,$5,$6)`,
				[
					row.investor_user_id,
					"investment",
					title,
					message,
					"investment_requests",
					id,
				],
			);
		}

		return res.json({
			message: "Status updated",
			investment_request: result.rows[0],
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// GET /api/admin/investments
exports.listInvestments = async (req, res) => {
	const { limit = 100, offset = 0 } = req.query;
	try {
		const r = await pool.query(
			`SELECT inv.*, ir.requested_amount, ir.project_id, p.project_title,
						su_user.first_name AS startup_first_name, iv_user.first_name AS investor_first_name,
						s.startup_id, iv.investor_id
				 FROM investments inv
				 JOIN investment_requests ir ON ir.investment_request_id = inv.investment_request_id
				 JOIN projects p ON p.project_id = ir.project_id
				 JOIN startups s ON s.startup_id = ir.startup_id
				 JOIN users su_user ON su_user.user_id = s.user_id
				 JOIN investors iv ON iv.investor_id = ir.investor_id
				 JOIN users iv_user ON iv_user.user_id = iv.user_id
				 ORDER BY inv.created_at DESC
				 LIMIT $1 OFFSET $2`,
			[limit, offset],
		);
		return res.json({ investments: r.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};
