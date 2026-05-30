const pool = require("../config/db");

const STARTUP_STATUSES = ["Active", "Pending", "Funded", "Closed"];
const DOC_STATUSES = ["pending", "verified", "rejected"];
const FUNDING_STATUSES = ["pending", "approved", "rejected", "withdrawn"];

async function ensureDashboardSchema() {
	await pool.query(
		"ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT",
	);
	await pool.query(
		"ALTER TABLE users ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ",
	);
	await pool.query(
		"ALTER TABLE users ADD COLUMN IF NOT EXISTS rejected_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL",
	);
	await pool.query(
		"ALTER TABLE startups ADD COLUMN IF NOT EXISTS admin_status VARCHAR(20) DEFAULT 'Pending'",
	);
	await pool.query(
		"ALTER TABLE startups ADD COLUMN IF NOT EXISTS is_listed BOOLEAN DEFAULT FALSE",
	);
	await pool.query(
		"ALTER TABLE mentors ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE",
	);
	await pool.query(
		"ALTER TABLE investors ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE",
	);
	await pool.query(
		"ALTER TABLE documents ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending'",
	);
	await pool.query(
		"ALTER TABLE mentor_documents ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending'",
	);
}

function parseLimitOffset(query, defaultLimit = 50) {
	const limit = Math.min(200, Math.max(1, Number(query.limit) || defaultLimit));
	const offset = Math.max(0, Number(query.offset) || 0);
	return { limit, offset };
}

function parseApproval(body) {
	if (typeof body.approved === "boolean") {
		return body.approved ? "approved" : "rejected";
	}
	const status = String(body.status || body.approval || "").toLowerCase();
	if (status === "approved" || status === "approve" || status === "true") return "approved";
	if (status === "rejected" || status === "reject" || status === "false") return "rejected";
	return null;
}

async function audit(adminUserId, action, entityType, entityId, details) {
	await pool.query(
		`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		[adminUserId, action, entityType, entityId, details || null, null],
	);
}

// ——— Startups ———

exports.listStartups = async (req, res) => {
	try {
		await ensureDashboardSchema();
		const { limit, offset } = parseLimitOffset(req.query);
		const { status, listed, account } = req.query;
		const params = [];
		const conds = [];

		if (status && STARTUP_STATUSES.includes(status)) {
			params.push(status);
			conds.push(`COALESCE(s.admin_status, 'Pending') = $${params.length}`);
		}
		if (listed === "true") {
			conds.push("COALESCE(s.is_listed, false) = true");
		} else if (listed === "false") {
			conds.push("COALESCE(s.is_listed, false) = false");
		}
		if (account === "approved") {
			conds.push("u.is_approved = true AND u.is_active = true");
		} else if (account === "pending") {
			conds.push("u.is_approved = false");
		} else if (account === "rejected") {
			conds.push("u.is_approved = false AND u.is_active = false");
		}

		const where = conds.length ? ` WHERE ${conds.join(" AND ")}` : "";
		params.push(limit, offset);
		const r = await pool.query(
			`SELECT s.startup_id, s.startup_name, s.industry, s.business_stage, s.funding_needed,
			        s.region, s.city, s.startup_tagline, s.founded_year, s.team_size,
			        COALESCE(s.admin_status, 'Pending') AS status,
			        s.is_listed, s.user_id,
			        u.first_name, u.last_name, u.email AS owner_email,
			        u.is_active, u.is_approved, u.rejection_reason,
			        s.created_at,
			        (SELECT COUNT(*)::int FROM projects p WHERE p.startup_id = s.startup_id) AS project_count,
			        (SELECT COALESCE(SUM(p.funding_goal), 0)::numeric FROM projects p WHERE p.startup_id = s.startup_id) AS total_funding_goal
			 FROM startups s
			 JOIN users u ON u.user_id = s.user_id
			 ${where}
			 ORDER BY s.created_at DESC
			 LIMIT $${params.length - 1} OFFSET $${params.length}`,
			params,
		);

		const summary = await pool.query(
			`SELECT
				COUNT(*)::int AS total,
				COUNT(*) FILTER (WHERE COALESCE(s.is_listed, false))::int AS listed,
				COUNT(*) FILTER (WHERE COALESCE(s.admin_status, 'Pending') = 'Active')::int AS active,
				COUNT(*) FILTER (WHERE COALESCE(s.admin_status, 'Pending') = 'Pending')::int AS pending_lifecycle,
				COUNT(*) FILTER (WHERE u.is_approved = false)::int AS awaiting_account_approval
			 FROM startups s
			 JOIN users u ON u.user_id = s.user_id`,
		);

		return res.json({
			startups: r.rows,
			summary: summary.rows[0],
			limit,
			offset,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getStartup = async (req, res) => {
	try {
		await ensureDashboardSchema();
		const { id } = req.params;
		const r = await pool.query(
			`SELECT s.*, COALESCE(s.admin_status, 'Pending') AS status,
			        u.first_name, u.last_name, u.email, u.phone_number, u.is_active, u.is_approved
			 FROM startups s
			 JOIN users u ON u.user_id = s.user_id
			 WHERE s.startup_id = $1`,
			[id],
		);
		if (!r.rowCount) return res.status(404).json({ message: "Startup not found" });

		const projects = await pool.query(
			`SELECT project_id, project_title, funding_goal, amount_raised, status, created_at
			 FROM projects WHERE startup_id = $1 ORDER BY created_at DESC`,
			[id],
		);
		const docs = await pool.query(
			`SELECT document_id, file_name, file_type, verification_status, created_at
			 FROM documents WHERE startup_id = $1 ORDER BY created_at DESC`,
			[id],
		);

		return res.json({
			startup: r.rows[0],
			projects: projects.rows,
			documents: docs.rows,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.updateStartupStatus = async (req, res) => {
	try {
		await ensureDashboardSchema();
		const { id } = req.params;
		const { status, comment } = req.body || {};
		if (!STARTUP_STATUSES.includes(status)) {
			return res.status(400).json({
				error: "Invalid status",
				allowed: STARTUP_STATUSES,
			});
		}

		const isListed = status === "Active" || status === "Funded";
		const r = await pool.query(
			`UPDATE startups
			 SET admin_status = $1, is_listed = $2
			 WHERE startup_id = $3
			 RETURNING *`,
			[status, isListed, id],
		);
		if (!r.rowCount) return res.status(404).json({ message: "Startup not found" });

		const ownerRes = await pool.query(
			`SELECT s.user_id, u.is_approved, u.is_active
			 FROM startups s
			 JOIN users u ON u.user_id = s.user_id
			 WHERE s.startup_id = $1`,
			[id],
		);
		const owner = ownerRes.rows[0];
		if ((status === "Active" || status === "Funded") && (!owner?.is_approved || !owner?.is_active)) {
			return res.status(400).json({
				message:
					"Cannot list this startup publicly until the founder account is approved on the Users page.",
			});
		}

		const uid = owner?.user_id;
		if (uid) {
			await pool.query(
				`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
				 VALUES ($1, 'startup', 'Startup status updated', $2, 'startups', $3)`,
				[
					uid,
					comment || `Your startup status is now: ${status}`,
					id,
				],
			);
		}
		await audit(req.user.user_id, "update_startup_status", "startups", id, comment || status);

		return res.json({
			message: "Startup lifecycle updated",
			startup: r.rows[0],
			listing_effect: isListed
				? "Startup is visible to investors in discover."
				: "Startup is hidden from investor discover.",
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.updateStartupListing = async (req, res) => {
	try {
		await ensureDashboardSchema();
		const { id } = req.params;
		const listed = req.body?.listed;
		if (typeof listed !== "boolean") {
			return res.status(400).json({ message: "Provide listed: true or listed: false" });
		}

		const ownerRes = await pool.query(
			`SELECT s.user_id, u.is_approved, u.is_active
			 FROM startups s
			 JOIN users u ON u.user_id = s.user_id
			 WHERE s.startup_id = $1`,
			[id],
		);
		if (!ownerRes.rowCount) return res.status(404).json({ message: "Startup not found" });
		const owner = ownerRes.rows[0];
		if (listed && (!owner.is_approved || !owner.is_active)) {
			return res.status(400).json({
				message:
					"Cannot list this startup until the founder account is approved on the Users page.",
			});
		}

		const r = await pool.query(
			`UPDATE startups SET is_listed = $1 WHERE startup_id = $2 RETURNING *`,
			[listed, id],
		);

		const uid = owner.user_id;
		if (uid) {
			await pool.query(
				`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
				 VALUES ($1, 'startup', 'Directory visibility updated', $2, 'startups', $3)`,
				[
					uid,
					listed
						? "Your startup is now listed in the public directory."
						: "Your startup has been hidden from the public directory.",
					id,
				],
			);
		}
		await audit(
			req.user.user_id,
			listed ? "list_startup" : "unlist_startup",
			"startups",
			id,
			listed ? "listed" : "hidden",
		);

		return res.json({
			message: listed ? "Startup is now listed" : "Startup is now hidden",
			startup: r.rows[0],
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// ——— Mentors ———

exports.listMentors = async (req, res) => {
	try {
		await ensureDashboardSchema();
		const { limit, offset } = parseLimitOffset(req.query);
		const { approval, account, listed } = req.query;
		const params = [];
		const conds = [];
		if (approval === "approved") {
			conds.push("COALESCE(m.is_approved, false) = true");
		} else if (approval === "pending" || approval === "rejected") {
			conds.push("COALESCE(m.is_approved, false) = false");
		}
		if (listed === "true") conds.push("COALESCE(m.is_approved, false) = true");
		else if (listed === "false") conds.push("COALESCE(m.is_approved, false) = false");
		if (account === "approved") {
			conds.push("u.is_approved = true AND u.is_active = true");
		} else if (account === "pending") {
			conds.push("u.is_approved = false");
		} else if (account === "rejected") {
			conds.push("u.is_approved = false AND u.is_active = false");
		}
		const where = conds.length ? ` WHERE ${conds.join(" AND ")}` : "";
		params.push(limit, offset);
		const r = await pool.query(
			`SELECT m.mentor_id, m.headline, m.professional_title, m.expertise,
			        m.years_experience, m.country, m.city_location, m.primary_industry,
			        COALESCE(m.is_approved, false) AS is_approved,
			        u.user_id, u.first_name, u.last_name, u.email, u.is_active, u.is_approved AS user_approved,
			        m.created_at
			 FROM mentors m
			 JOIN users u ON u.user_id = m.user_id
			 ${where}
			 ORDER BY m.created_at DESC
			 LIMIT $${params.length - 1} OFFSET $${params.length}`,
			params,
		);
		const summary = await pool.query(
			`SELECT COUNT(*)::int AS total,
			        COUNT(*) FILTER (WHERE COALESCE(m.is_approved, false))::int AS listed
			 FROM mentors m
			 JOIN users u ON u.user_id = m.user_id
			 WHERE u.is_approved = true AND u.is_active = true`,
		);
		return res.json({ mentors: r.rows, summary: summary.rows[0], limit, offset });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getMentor = async (req, res) => {
	try {
		await ensureDashboardSchema();
		const { id } = req.params;
		const r = await pool.query(
			`SELECT m.*, COALESCE(m.is_approved, false) AS is_approved,
			        u.first_name, u.last_name, u.email, u.phone_number, u.is_active, u.is_approved AS user_approved
			 FROM mentors m
			 JOIN users u ON u.user_id = m.user_id
			 WHERE m.mentor_id = $1`,
			[id],
		);
		if (!r.rowCount) return res.status(404).json({ message: "Mentor not found" });

		const docs = await pool.query(
			`SELECT * FROM (
				SELECT document_id, 'document' AS source, file_name, file_type,
				       COALESCE(verification_status, 'pending') AS verification_status, created_at
				FROM documents WHERE mentor_id = $1
				UNION ALL
				SELECT mentor_document_id AS document_id, 'mentor_document' AS source,
				       file_name, file_type, COALESCE(verification_status, 'pending') AS verification_status, created_at
				FROM mentor_documents WHERE mentor_id = $1
			) d ORDER BY created_at DESC`,
			[id],
		);

		return res.json({ mentor: r.rows[0], documents: docs.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.updateMentorApproval = async (req, res) => {
	try {
		await ensureDashboardSchema();
		const { id } = req.params;
		const decision = parseApproval(req.body || {});
		if (!decision) {
			return res.status(400).json({
				error: "Provide approved: boolean or status: approved|rejected",
			});
		}
		const approved = decision === "approved";
		const { reason } = req.body || {};

		const ownerRes = await pool.query(
			`SELECT m.user_id, u.is_approved, u.is_active
			 FROM mentors m
			 JOIN users u ON u.user_id = m.user_id
			 WHERE m.mentor_id = $1`,
			[id],
		);
		if (!ownerRes.rowCount) return res.status(404).json({ message: "Mentor not found" });
		const owner = ownerRes.rows[0];
		if (approved && (!owner.is_approved || !owner.is_active)) {
			return res.status(400).json({
				message: "Cannot list mentor until their user account is approved.",
			});
		}

		const r = await pool.query(
			"UPDATE mentors SET is_approved = $1 WHERE mentor_id = $2 RETURNING *",
			[approved, id],
		);

		const uid = owner.user_id;
		if (uid) {
			await pool.query(
				`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
				 VALUES ($1, 'mentor', $2, $3, 'mentors', $4)`,
				[
					uid,
					approved ? "Mentor application approved" : "Mentor application rejected",
					reason ||
						(approved
							? "Your mentor profile has been approved."
							: "Your mentor application was rejected."),
					id,
				],
			);
		}
		await audit(
			req.user.user_id,
			approved ? "approve_mentor" : "reject_mentor",
			"mentors",
			id,
			reason || decision,
		);

		return res.json({
			message: approved ? "Mentor approved" : "Mentor rejected",
			mentor: r.rows[0],
			approval: decision,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// ——— Investors ———

exports.listInvestors = async (req, res) => {
	try {
		await ensureDashboardSchema();
		const { limit, offset } = parseLimitOffset(req.query);
		const { approval, account, listed } = req.query;
		const params = [];
		const conds = [];
		if (approval === "approved") {
			conds.push("COALESCE(i.is_approved, false) = true");
		} else if (approval === "pending" || approval === "rejected") {
			conds.push("COALESCE(i.is_approved, false) = false");
		}
		if (listed === "true") conds.push("COALESCE(i.is_approved, false) = true");
		else if (listed === "false") conds.push("COALESCE(i.is_approved, false) = false");
		if (account === "approved") {
			conds.push("u.is_approved = true AND u.is_active = true");
		} else if (account === "pending") {
			conds.push("u.is_approved = false");
		} else if (account === "rejected") {
			conds.push("u.is_approved = false AND u.is_active = false");
		}
		const where = conds.length ? ` WHERE ${conds.join(" AND ")}` : "";
		params.push(limit, offset);
		const r = await pool.query(
			`SELECT i.investor_id, i.investor_type, i.organization_name, i.investment_budget,
			        i.preferred_industry, i.investment_stage, i.country,
			        COALESCE(i.is_approved, false) AS is_approved,
			        u.user_id, u.first_name, u.last_name, u.email, u.is_active, u.is_approved AS user_approved,
			        i.created_at
			 FROM investors i
			 JOIN users u ON u.user_id = i.user_id
			 ${where}
			 ORDER BY i.created_at DESC
			 LIMIT $${params.length - 1} OFFSET $${params.length}`,
			params,
		);
		const summary = await pool.query(
			`SELECT COUNT(*)::int AS total,
			        COUNT(*) FILTER (WHERE COALESCE(i.is_approved, false))::int AS listed
			 FROM investors i
			 JOIN users u ON u.user_id = i.user_id
			 WHERE u.is_approved = true AND u.is_active = true`,
		);
		return res.json({ investors: r.rows, summary: summary.rows[0], limit, offset });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getInvestor = async (req, res) => {
	try {
		await ensureDashboardSchema();
		const { id } = req.params;
		const r = await pool.query(
			`SELECT i.*, COALESCE(i.is_approved, false) AS is_approved,
			        u.first_name, u.last_name, u.email, u.phone_number, u.is_active, u.is_approved AS user_approved
			 FROM investors i
			 JOIN users u ON u.user_id = i.user_id
			 WHERE i.investor_id = $1`,
			[id],
		);
		if (!r.rowCount) return res.status(404).json({ message: "Investor not found" });

		const docs = await pool.query(
			`SELECT document_id, file_name, file_type,
			        COALESCE(verification_status, 'pending') AS verification_status, created_at
			 FROM documents WHERE investor_id = $1 ORDER BY created_at DESC`,
			[id],
		);

		return res.json({ investor: r.rows[0], documents: docs.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.updateInvestorApproval = async (req, res) => {
	try {
		await ensureDashboardSchema();
		const { id } = req.params;
		const decision = parseApproval(req.body || {});
		if (!decision) {
			return res.status(400).json({
				error: "Provide approved: boolean or status: approved|rejected",
			});
		}
		const approved = decision === "approved";
		const { reason } = req.body || {};

		const ownerRes = await pool.query(
			`SELECT i.user_id, u.is_approved, u.is_active
			 FROM investors i
			 JOIN users u ON u.user_id = i.user_id
			 WHERE i.investor_id = $1`,
			[id],
		);
		if (!ownerRes.rowCount) return res.status(404).json({ message: "Investor not found" });
		const owner = ownerRes.rows[0];
		if (approved && (!owner.is_approved || !owner.is_active)) {
			return res.status(400).json({
				message: "Cannot list investor until their user account is approved.",
			});
		}

		const r = await pool.query(
			"UPDATE investors SET is_approved = $1 WHERE investor_id = $2 RETURNING *",
			[approved, id],
		);

		const uid = owner.user_id;
		if (uid) {
			await pool.query(
				`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
				 VALUES ($1, 'investor', $2, $3, 'investors', $4)`,
				[
					uid,
					approved ? "Investor application approved" : "Investor application rejected",
					reason ||
						(approved
							? "Your investor profile has been approved."
							: "Your investor application was rejected."),
					id,
				],
			);
		}
		await audit(
			req.user.user_id,
			approved ? "approve_investor" : "reject_investor",
			"investors",
			id,
			reason || decision,
		);

		return res.json({
			message: approved ? "Investor approved" : "Investor rejected",
			investor: r.rows[0],
			approval: decision,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// ——— Funding ———

exports.listFunding = async (req, res) => {
	try {
		const { limit, offset } = parseLimitOffset(req.query);
		const { status } = req.query;
		const params = [];
		let where = "";
		if (status && FUNDING_STATUSES.includes(status)) {
			params.push(status);
			where = ` WHERE ir.status = $${params.length}`;
		}
		params.push(limit, offset);
		const r = await pool.query(
			`SELECT ir.investment_request_id AS funding_id, ir.requested_amount, ir.status,
			        ir.proposal_message, ir.created_at,
			        s.startup_id, s.startup_name,
			        i.investor_id, i.organization_name AS investor_organization,
			        p.project_id, p.project_title
			 FROM investment_requests ir
			 JOIN startups s ON s.startup_id = ir.startup_id
			 JOIN investors i ON i.investor_id = ir.investor_id
			 JOIN projects p ON p.project_id = ir.project_id
			 ${where}
			 ORDER BY ir.created_at DESC
			 LIMIT $${params.length - 1} OFFSET $${params.length}`,
			params,
		);
		return res.json({ funding_requests: r.rows, limit, offset });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getFunding = async (req, res) => {
	try {
		const { id } = req.params;
		const r = await pool.query(
			`SELECT ir.*, ir.investment_request_id AS funding_id,
			        s.startup_id, s.startup_name, s.industry,
			        i.investor_id, i.organization_name, i.investor_type,
			        p.project_id, p.project_title, p.funding_goal, p.amount_raised, p.status AS project_status,
			        su.email AS startup_email, iu.email AS investor_email
			 FROM investment_requests ir
			 JOIN startups s ON s.startup_id = ir.startup_id
			 JOIN users su ON su.user_id = s.user_id
			 JOIN investors i ON i.investor_id = ir.investor_id
			 JOIN users iu ON iu.user_id = i.user_id
			 JOIN projects p ON p.project_id = ir.project_id
			 WHERE ir.investment_request_id = $1`,
			[id],
		);
		if (!r.rowCount) return res.status(404).json({ message: "Funding request not found" });

		const inv = await pool.query(
			`SELECT * FROM investments WHERE investment_request_id = $1`,
			[id],
		);

		return res.json({
			funding_request: r.rows[0],
			investment: inv.rows[0] || null,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.updateFundingApproval = async (req, res) => {
	try {
		const { id } = req.params;
		let status = String((req.body || {}).status || "").toLowerCase();
		const decision = parseApproval(req.body || {});
		if (decision === "approved") status = "approved";
		else if (decision === "rejected") status = "rejected";

		if (!FUNDING_STATUSES.includes(status)) {
			return res.status(400).json({
				error: "Invalid status",
				allowed: FUNDING_STATUSES,
			});
		}

		const { comment, reason } = req.body || {};
		const note = comment || reason;

		const result = await pool.query(
			"UPDATE investment_requests SET status = $1 WHERE investment_request_id = $2 RETURNING *",
			[status, id],
		);
		if (!result.rowCount)
			return res.status(404).json({ message: "Funding request not found" });

		await audit(req.user.user_id, "update_funding_request", "investment_requests", id, note);

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
			const title = `Funding request ${status}`;
			const message = note || `Funding request has been ${status} by an administrator.`;
			for (const userId of [row.startup_user_id, row.investor_user_id]) {
				await pool.query(
					`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
					 VALUES ($1, 'investment', $2, $3, 'investment_requests', $4)`,
					[userId, title, message, id],
				);
			}
		}

		return res.json({
			message: "Funding request updated",
			funding_request: result.rows[0],
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// ——— Documents ———

exports.listDocuments = async (req, res) => {
	try {
		await ensureDashboardSchema();
		const { limit, offset } = parseLimitOffset(req.query);
		const { status } = req.query;
		const statusVal =
			status && DOC_STATUSES.includes(status) ? status : null;

		const docParams = statusVal ? [statusVal] : [];
		const docWhere = statusVal
			? ` WHERE COALESCE(verification_status, 'pending') = $1`
			: "";
		const simple = await pool.query(
			`SELECT document_id AS id, 'document' AS source, file_name, file_type, file_size_bytes,
			        COALESCE(verification_status, 'pending') AS verification_status,
			        startup_id, investor_id, project_id, mentor_id, created_at
			 FROM documents${docWhere}
			 ORDER BY created_at DESC`,
			docParams,
		);
		const mentorDocs = await pool.query(
			`SELECT mentor_document_id AS id, 'mentor_document' AS source, file_name, file_type,
			        file_size_bytes, COALESCE(verification_status, 'pending') AS verification_status,
			        mentor_id, created_at
			 FROM mentor_documents${docWhere}
			 ORDER BY created_at DESC`,
			docParams,
		);

		const merged = [...simple.rows, ...mentorDocs.rows]
			.map((row) => ({
				...row,
				document_id: row.id,
			}))
			.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
			.slice(offset, offset + limit);

		return res.json({ documents: merged, limit, offset });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getDocument = async (req, res) => {
	try {
		await ensureDashboardSchema();
		const { id } = req.params;
		const { source } = req.query;

		if (source === "mentor_document") {
			const r = await pool.query(
				`SELECT md.*, md.mentor_document_id AS id, 'mentor_document' AS source,
				        COALESCE(md.verification_status, 'pending') AS verification_status,
				        m.headline, u.email AS owner_email
				 FROM mentor_documents md
				 JOIN mentors m ON m.mentor_id = md.mentor_id
				 JOIN users u ON u.user_id = m.user_id
				 WHERE md.mentor_document_id = $1`,
				[id],
			);
			if (!r.rowCount) return res.status(404).json({ message: "Document not found" });
			return res.json({ document: r.rows[0] });
		}

		const r = await pool.query(
			`SELECT d.*, d.document_id AS id, 'document' AS source,
			        COALESCE(d.verification_status, 'pending') AS verification_status
			 FROM documents d WHERE d.document_id = $1`,
			[id],
		);
		if (!r.rowCount) {
			const md = await pool.query(
				`SELECT md.*, md.mentor_document_id AS id, 'mentor_document' AS source,
				        COALESCE(md.verification_status, 'pending') AS verification_status
				 FROM mentor_documents md WHERE md.mentor_document_id = $1`,
				[id],
			);
			if (!md.rowCount) return res.status(404).json({ message: "Document not found" });
			return res.json({ document: md.rows[0] });
		}
		return res.json({ document: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.updateDocumentVerification = async (req, res) => {
	try {
		await ensureDashboardSchema();
		const { id } = req.params;
		let verification = String(
			(req.body || {}).verification_status ||
				(req.body || {}).status ||
				"",
		).toLowerCase();
		const decision = parseApproval(req.body || {});
		if (decision === "approved") verification = "verified";
		else if (decision === "rejected") verification = "rejected";

		if (!DOC_STATUSES.includes(verification)) {
			return res.status(400).json({
				error: "Invalid verification status",
				allowed: DOC_STATUSES,
			});
		}

		const { source, comment } = req.body || {};
		let r;
		let entityType = "documents";

		if (source === "mentor_document") {
			r = await pool.query(
				`UPDATE mentor_documents SET verification_status = $1 WHERE mentor_document_id = $2 RETURNING *`,
				[verification, id],
			);
			entityType = "mentor_documents";
		} else {
			r = await pool.query(
				`UPDATE documents SET verification_status = $1 WHERE document_id = $2 RETURNING *`,
				[verification, id],
			);
		}
		if (!r.rowCount && source !== "mentor_document") {
			r = await pool.query(
				`UPDATE mentor_documents SET verification_status = $1 WHERE mentor_document_id = $2 RETURNING *`,
				[verification, id],
			);
			entityType = "mentor_documents";
		}
		if (!r.rowCount) return res.status(404).json({ message: "Document not found" });

		await audit(
			req.user.user_id,
			"update_document_verification",
			entityType,
			id,
			comment || verification,
		);

		return res.json({
			message: "Document verification updated",
			document: r.rows[0],
			verification_status: verification,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// ——— Events (mentorship sessions) ———

exports.listEvents = async (req, res) => {
	try {
		const { limit, offset } = parseLimitOffset(req.query);
		const r = await pool.query(
			`SELECT ms.mentorship_session_id AS event_id, ms.scheduled_at, ms.duration_minutes,
			        ms.meeting_link, ms.status, ms.notes, ms.created_at,
			        mr.subject, mr.mentorship_request_id,
			        s.startup_name, m.headline AS mentor_headline,
			        mu.first_name AS mentor_first_name, mu.last_name AS mentor_last_name
			 FROM mentorship_sessions ms
			 JOIN mentorship_requests mr ON mr.mentorship_request_id = ms.mentorship_request_id
			 JOIN startups s ON s.startup_id = mr.startup_id
			 JOIN mentors m ON m.mentor_id = mr.mentor_id
			 JOIN users mu ON mu.user_id = m.user_id
			 ORDER BY ms.scheduled_at DESC
			 LIMIT $1 OFFSET $2`,
			[limit, offset],
		);
		return res.json({ events: r.rows, limit, offset });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getEvent = async (req, res) => {
	try {
		const { id } = req.params;
		const r = await pool.query(
			`SELECT ms.mentorship_session_id AS event_id, ms.*, mr.subject, mr.message AS request_message,
			        s.startup_id, s.startup_name, m.mentor_id, m.headline AS mentor_headline,
			        su.email AS startup_email, mu.email AS mentor_email
			 FROM mentorship_sessions ms
			 JOIN mentorship_requests mr ON mr.mentorship_request_id = ms.mentorship_request_id
			 JOIN startups s ON s.startup_id = mr.startup_id
			 JOIN users su ON su.user_id = s.user_id
			 JOIN mentors m ON m.mentor_id = mr.mentor_id
			 JOIN users mu ON mu.user_id = m.user_id
			 WHERE ms.mentorship_session_id = $1`,
			[id],
		);
		if (!r.rowCount) return res.status(404).json({ message: "Event not found" });
		return res.json({ event: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// ——— Chat monitoring ———

exports.listConversations = async (req, res) => {
	try {
		const { limit, offset } = parseLimitOffset(req.query);
		const investor = await pool.query(
			`SELECT c.conversation_id AS id, 'investor' AS conversation_type,
			        c.startup_id, c.investor_id, c.created_at, c.last_message_at,
			        s.startup_name, iu.first_name AS investor_first_name, iu.last_name AS investor_last_name,
			        (SELECT COUNT(*)::int FROM chat_messages cm WHERE cm.conversation_id = c.conversation_id) AS message_count
			 FROM chat_conversations c
			 JOIN startups s ON s.startup_id = c.startup_id
			 JOIN investors inv ON inv.investor_id = c.investor_id
			 JOIN users iu ON iu.user_id = inv.user_id
			 ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
			 LIMIT $1 OFFSET $2`,
			[limit, offset],
		);
		const mentor = await pool.query(
			`SELECT c.mentor_conversation_id AS id, 'mentor' AS conversation_type,
			        c.startup_id, c.mentor_id, c.created_at, c.last_message_at,
			        s.startup_name, mu.first_name AS mentor_first_name, mu.last_name AS mentor_last_name,
			        (SELECT COUNT(*)::int FROM mentor_chat_messages mcm WHERE mcm.mentor_conversation_id = c.mentor_conversation_id) AS message_count
			 FROM mentor_chat_conversations c
			 JOIN startups s ON s.startup_id = c.startup_id
			 JOIN mentors m ON m.mentor_id = c.mentor_id
			 JOIN users mu ON mu.user_id = m.user_id
			 ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
			 LIMIT $1 OFFSET $2`,
			[limit, offset],
		);

		const conversations = [...investor.rows, ...mentor.rows]
			.sort((a, b) => {
				const ta = a.last_message_at || a.created_at;
				const tb = b.last_message_at || b.created_at;
				return new Date(tb) - new Date(ta);
			})
			.slice(0, limit);

		return res.json({ conversations, limit, offset });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getConversationMessages = async (req, res) => {
	try {
		const convId = Number(req.params.id);
		const type = String(req.query.type || "investor").toLowerCase();
		const { limit, offset } = parseLimitOffset(req.query, 100);

		if (!Number.isInteger(convId) || convId <= 0) {
			return res.status(400).json({ error: "Invalid conversation id" });
		}

		if (type === "mentor") {
			const conv = await pool.query(
				"SELECT * FROM mentor_chat_conversations WHERE mentor_conversation_id = $1",
				[convId],
			);
			if (!conv.rowCount)
				return res.status(404).json({ message: "Conversation not found" });

			const r = await pool.query(
				`SELECT mentor_chat_message_id AS message_id, mentor_conversation_id AS conversation_id,
				        sender_user_id, message_type, text_body, file_name, file_mime, file_size_bytes,
				        (file_data IS NOT NULL) AS has_file, created_at
				 FROM mentor_chat_messages
				 WHERE mentor_conversation_id = $1
				 ORDER BY created_at ASC
				 LIMIT $2 OFFSET $3`,
				[convId, limit, offset],
			);
			return res.json({
				conversation_type: "mentor",
				conversation: conv.rows[0],
				messages: r.rows,
			});
		}

		const conv = await pool.query(
			"SELECT * FROM chat_conversations WHERE conversation_id = $1",
			[convId],
		);
		if (!conv.rowCount)
			return res.status(404).json({ message: "Conversation not found" });

		const r = await pool.query(
			`SELECT chat_message_id AS message_id, conversation_id, sender_user_id, message_type,
			        text_body, file_name, file_mime, file_size_bytes,
			        (file_data IS NOT NULL) AS has_file, created_at
			 FROM chat_messages
			 WHERE conversation_id = $1
			 ORDER BY created_at ASC
			 LIMIT $2 OFFSET $3`,
			[convId, limit, offset],
		);
		return res.json({
			conversation_type: "investor",
			conversation: conv.rows[0],
			messages: r.rows,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getConversationVideoStatus = async (req, res) => {
	try {
		const convId = Number(req.params.id);
		const type = String(req.query.type || "investor").toLowerCase();

		if (!Number.isInteger(convId) || convId <= 0) {
			return res.status(400).json({ error: "Invalid conversation id" });
		}

		if (type === "mentor") {
			const conv = await pool.query(
				"SELECT * FROM mentor_chat_conversations WHERE mentor_conversation_id = $1",
				[convId],
			);
			if (!conv.rowCount)
				return res.status(404).json({ message: "Conversation not found" });

			const r = await pool.query(
				`SELECT * FROM mentor_chat_video_calls
				 WHERE mentor_conversation_id = $1
				 ORDER BY created_at DESC LIMIT 1`,
				[convId],
			);
			if (!r.rowCount) {
				return res.json({
					conversation_type: "mentor",
					status: "none",
					video_call: null,
				});
			}
			const vc = r.rows[0];
			const partR = await pool.query(
				`SELECT user_id, joined_at, left_at
				 FROM mentor_chat_video_session_participants
				 WHERE mentor_video_call_id = $1 ORDER BY joined_at ASC`,
				[vc.mentor_video_call_id],
			);
			return res.json({
				conversation_type: "mentor",
				status: vc.status,
				video_call: vc,
				session_participants: partR.rows,
			});
		}

		const conv = await pool.query(
			"SELECT * FROM chat_conversations WHERE conversation_id = $1",
			[convId],
		);
		if (!conv.rowCount)
			return res.status(404).json({ message: "Conversation not found" });

		const r = await pool.query(
			`SELECT * FROM chat_video_calls
			 WHERE conversation_id = $1
			 ORDER BY created_at DESC LIMIT 1`,
			[convId],
		);
		if (!r.rowCount) {
			return res.json({
				conversation_type: "investor",
				status: "none",
				video_call: null,
			});
		}
		const vc = r.rows[0];
		const partR = await pool.query(
			`SELECT user_id, joined_at, left_at
			 FROM chat_video_session_participants
			 WHERE video_call_id = $1 ORDER BY joined_at ASC`,
			[vc.video_call_id],
		);
		return res.json({
			conversation_type: "investor",
			status: vc.status,
			video_call: vc,
			session_participants: partR.rows,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// ——— Analytics ———

exports.analyticsSystem = async (_req, res) => {
	try {
		const r = await pool.query(
			`SELECT
				(SELECT COUNT(*)::int FROM users) AS total_users,
				(SELECT COUNT(*)::int FROM users WHERE is_active = true) AS active_users,
				(SELECT COUNT(*)::int FROM users WHERE is_approved = true) AS approved_users,
				(SELECT COUNT(*)::int FROM users WHERE is_approved = false) AS pending_users,
				(SELECT COUNT(*)::int FROM users WHERE is_active = true AND is_approved = true) AS total_verified_users,
				(SELECT COUNT(*)::int FROM startups) AS total_startups,
				(SELECT COUNT(*)::int FROM investors) AS total_investors,
				(SELECT COUNT(*)::int FROM mentors) AS total_mentors,
				(SELECT COUNT(*)::int FROM projects) AS total_projects,
				(SELECT COUNT(*)::int FROM investment_requests) AS total_funding_requests,
				(SELECT COUNT(*)::int FROM investments) AS total_investments,
				(SELECT COUNT(*)::int FROM mentorship_sessions) AS total_events,
				(SELECT COUNT(*)::int FROM payments) AS total_payment_transactions,
				(SELECT COUNT(*)::int FROM payments WHERE status = 'completed') AS completed_payment_transactions,
				(SELECT COUNT(*)::int FROM payments WHERE status = 'completed' AND reference_type = 'MENTORSHIP_SESSION') AS total_mentorship_transactions,
				(SELECT COUNT(*)::int FROM payments WHERE status = 'completed' AND reference_type = 'investment_request') AS total_investment_transactions,
				(SELECT COALESCE(SUM(platform_fee), 0)::numeric FROM payments WHERE status = 'completed') AS revenue_from_platform_fees,
				(SELECT COUNT(*)::int FROM chat_conversations) +
					(SELECT COUNT(*)::int FROM mentor_chat_conversations) AS total_conversations,
				(SELECT COUNT(*)::int FROM documents) +
					(SELECT COUNT(*)::int FROM mentor_documents) AS total_documents`,
		);
		const byRole = await pool.query(
			"SELECT role, COUNT(*)::int AS count FROM users GROUP BY role ORDER BY role",
		);
		return res.json({ system: r.rows[0], users_by_role: byRole.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.analyticsStartups = async (_req, res) => {
	try {
		await ensureDashboardSchema();
		const byStatus = await pool.query(
			`SELECT COALESCE(admin_status, 'Pending') AS status, COUNT(*)::int AS count
			 FROM startups GROUP BY COALESCE(admin_status, 'Pending')`,
		);
		const byIndustry = await pool.query(
			`SELECT industry, COUNT(*)::int AS count FROM startups
			 WHERE industry IS NOT NULL GROUP BY industry ORDER BY count DESC LIMIT 10`,
		);
		const byStage = await pool.query(
			`SELECT business_stage, COUNT(*)::int AS count FROM startups
			 WHERE business_stage IS NOT NULL GROUP BY business_stage`,
		);
		const listed = await pool.query(
			"SELECT COUNT(*)::int AS listed FROM startups WHERE COALESCE(is_listed, false) = true",
		);
		const projects = await pool.query(
			`SELECT status, COUNT(*)::int AS count FROM projects GROUP BY status`,
		);
		return res.json({
			by_status: byStatus.rows,
			by_industry: byIndustry.rows,
			by_business_stage: byStage.rows,
			listed_startups: listed.rows[0].listed,
			projects_by_status: projects.rows,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.analyticsFunding = async (_req, res) => {
	try {
		const byStatus = await pool.query(
			`SELECT status, COUNT(*)::int AS count, COALESCE(SUM(requested_amount), 0) AS total_requested
			 FROM investment_requests GROUP BY status`,
		);
		const invested = await pool.query(
			`SELECT COALESCE(SUM(amount), 0) AS total_invested,
			        COUNT(*)::int AS completed_deals
			 FROM investments WHERE status = 'completed'`,
		);
		const monthly = await pool.query(
			`SELECT DATE_TRUNC('month', created_at) AS month,
			        COUNT(*)::int AS request_count,
			        COALESCE(SUM(requested_amount), 0) AS amount
			 FROM investment_requests
			 GROUP BY DATE_TRUNC('month', created_at)
			 ORDER BY month DESC
			 LIMIT 12`,
		);
		return res.json({
			requests_by_status: byStatus.rows,
			investments: invested.rows[0],
			monthly_requests: monthly.rows,
			by_month: monthly.rows.map((row) => ({
				month: row.month,
				amount: row.amount,
				request_count: row.request_count,
			})),
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.analyticsEngagement = async (_req, res) => {
	try {
		await ensureDashboardSchema();
		const mentors = await pool.query(
			`SELECT COUNT(*)::int AS total,
			        COUNT(*) FILTER (WHERE COALESCE(is_approved, false))::int AS approved
			 FROM mentors`,
		);
		const investors = await pool.query(
			`SELECT COUNT(*)::int AS total,
			        COUNT(*) FILTER (WHERE COALESCE(is_approved, false))::int AS approved
			 FROM investors`,
		);
		const mentorship = await pool.query(
			`SELECT
				(SELECT COUNT(*)::int FROM mentorship_requests) AS total_requests,
				(SELECT COUNT(*)::int FROM mentorship_requests WHERE status = 'accepted') AS accepted_requests,
				(SELECT COUNT(*)::int FROM mentorship_sessions) AS total_sessions,
				(SELECT COUNT(*)::int FROM mentorship_sessions WHERE status = 'completed') AS completed_sessions`,
		);
		const topMentors = await pool.query(
			`SELECT m.mentor_id, u.first_name, u.last_name, COUNT(ms.mentorship_session_id)::int AS session_count
			 FROM mentorship_sessions ms
			 JOIN mentorship_requests mr ON mr.mentorship_request_id = ms.mentorship_request_id
			 JOIN mentors m ON m.mentor_id = mr.mentor_id
			 JOIN users u ON u.user_id = m.user_id
			 GROUP BY m.mentor_id, u.first_name, u.last_name
			 ORDER BY session_count DESC
			 LIMIT 10`,
		);
		const chatActivity = await pool.query(
			`SELECT
				(SELECT COUNT(*)::int FROM chat_messages) AS investor_chat_messages,
				(SELECT COUNT(*)::int FROM mentor_chat_messages) AS mentor_chat_messages,
				(SELECT COUNT(*)::int FROM chat_conversations) AS investor_conversations,
				(SELECT COUNT(*)::int FROM mentor_chat_conversations) AS mentor_conversations`,
		);
		const weekly = await pool.query(
			`SELECT DATE_TRUNC('week', created_at) AS week,
			        COUNT(DISTINCT actor_user_id)::int AS active_users
			 FROM audit_logs
			 WHERE created_at >= NOW() - INTERVAL '12 weeks'
			   AND actor_user_id IS NOT NULL
			 GROUP BY DATE_TRUNC('week', created_at)
			 ORDER BY week ASC
			 LIMIT 12`,
		);
		return res.json({
			mentors: mentors.rows[0],
			investors: investors.rows[0],
			mentorship: mentorship.rows[0],
			top_mentors_by_sessions: topMentors.rows,
			chat: chatActivity.rows[0],
			by_week: weekly.rows.map((row) => ({
				week: row.week,
				active_users: row.active_users,
			})),
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};
