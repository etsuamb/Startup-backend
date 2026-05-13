const pool = require("../config/db");

async function getStartupContext(userId) {
	const r = await pool.query(
		`SELECT s.startup_id, s.startup_name, s.industry, s.user_id,
            u.is_approved::boolean AS is_approved
     FROM startups s
     JOIN users u ON u.user_id = s.user_id
     WHERE s.user_id = $1`,
		[userId],
	);
	if (r.rowCount === 0) return null;
	return r.rows[0];
}

function parsePid(req) {
	const n = Number(req.params.projectId);
	if (!Number.isInteger(n) || n <= 0) return null;
	return n;
}

async function assertProjectForStartup(startupId, projectId) {
	const r = await pool.query(
		`SELECT p.*, s.startup_name, s.industry
     FROM projects p
     JOIN startups s ON s.startup_id = p.startup_id
     WHERE p.project_id = $1 AND p.startup_id = $2`,
		[projectId, startupId],
	);
	return r.rowCount ? r.rows[0] : null;
}

function mapPublicStatus(dbStatus) {
	const m = {
		draft: "Pending",
		active: "Active",
		funded: "Funded",
		completed: "Closed",
		cancelled: "Closed",
	};
	return m[dbStatus] || dbStatus;
}

function phaseLabel(dbStatus) {
	const m = {
		draft: "Draft",
		active: "Fundraising",
		funded: "Funded",
		completed: "Completed",
		cancelled: "Cancelled",
	};
	return m[dbStatus] || dbStatus;
}

/** GET /api/projects — list (empty if not admin-approved). */
exports.listStartupProjects = async (req, res) => {
	try {
		if (req.user.role !== "Startup") {
			return res.status(403).json({ error: "Startup role required" });
		}
		const ctx = await getStartupContext(req.user.user_id);
		if (!ctx) return res.status(404).json({ error: "Startup profile not found" });
		if (!ctx.is_approved) {
			return res.json({ projects: [], pending_admin_approval: true });
		}
		const result = await pool.query(
			`SELECT p.project_id, p.project_title, p.description, p.funding_goal, p.amount_raised,
              p.status, p.start_date, p.end_date, p.created_at
       FROM projects p
       WHERE p.startup_id = $1
       ORDER BY p.created_at DESC`,
			[ctx.startup_id],
		);
		return res.json({ projects: result.rows, pending_admin_approval: false });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

/** GET /api/projects/:projectId */
exports.getStartupProjectDetail = async (req, res) => {
	try {
		if (req.user.role !== "Startup") {
			return res.status(403).json({ error: "Startup role required" });
		}
		const ctx = await getStartupContext(req.user.user_id);
		if (!ctx) return res.status(404).json({ error: "Startup profile not found" });
		if (!ctx.is_approved) {
			return res.json({ project: null, pending_admin_approval: true });
		}
		const projectId = parsePid(req);
		if (!projectId) return res.status(400).json({ error: "Invalid project id" });
		const p = await assertProjectForStartup(ctx.startup_id, projectId);
		if (!p) return res.status(404).json({ error: "Project not found" });

		const mentorRow = await pool.query(
			`SELECT m.mentor_id, mu.first_name, mu.last_name, mu.email,
              m.headline, m.professional_title, mr.mentorship_request_id, mr.status AS request_status
       FROM mentorship_requests mr
       JOIN mentors m ON m.mentor_id = mr.mentor_id
       JOIN users mu ON mu.user_id = m.user_id
       WHERE mr.startup_id = $1 AND mr.status IN ('accepted', 'pending')
       ORDER BY CASE mr.status WHEN 'accepted' THEN 0 ELSE 1 END, mr.created_at DESC
       LIMIT 1`,
			[ctx.startup_id],
		);

		return res.json({
			project: {
				...p,
				phase: phaseLabel(p.status),
				mentor: mentorRow.rows[0] || null,
			},
			pending_admin_approval: false,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getStartupProjectStatus = async (req, res) => {
	try {
		if (req.user.role !== "Startup") {
			return res.status(403).json({ error: "Startup role required" });
		}
		const ctx = await getStartupContext(req.user.user_id);
		if (!ctx) return res.status(404).json({ error: "Startup profile not found" });
		if (!ctx.is_approved) {
			return res.json({
				status: null,
				db_status: null,
				pending_admin_approval: true,
			});
		}
		const projectId = parsePid(req);
		if (!projectId) return res.status(400).json({ error: "Invalid project id" });
		const p = await assertProjectForStartup(ctx.startup_id, projectId);
		if (!p) return res.status(404).json({ error: "Project not found" });
		return res.json({
			project_id: projectId,
			status: mapPublicStatus(p.status),
			db_status: p.status,
			pending_admin_approval: false,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getStartupProjectProgress = async (req, res) => {
	try {
		if (req.user.role !== "Startup") {
			return res.status(403).json({ error: "Startup role required" });
		}
		const ctx = await getStartupContext(req.user.user_id);
		if (!ctx) return res.status(404).json({ error: "Startup profile not found" });
		if (!ctx.is_approved) {
			return res.json({
				progress_percent: 0,
				current_phase: null,
				milestones: [],
				pending_admin_approval: true,
			});
		}
		const projectId = parsePid(req);
		if (!projectId) return res.status(400).json({ error: "Invalid project id" });
		const p = await assertProjectForStartup(ctx.startup_id, projectId);
		if (!p) return res.status(404).json({ error: "Project not found" });

		const goal = Number(p.funding_goal) || 0;
		const raised = Number(p.amount_raised) || 0;
		let progress_percent = 0;
		if (goal > 0) progress_percent = Math.min(100, Math.round((raised / goal) * 1000) / 10);

		const milestones = [];
		if (p.start_date) milestones.push({ label: "Project start", date: p.start_date, done: true });
		if (goal > 0 && raised >= goal) milestones.push({ label: "Funding goal reached", done: true });
		else if (goal > 0) milestones.push({ label: "Funding goal", target_amount: goal, done: false });
		if (p.end_date) milestones.push({ label: "Target end", date: p.end_date, done: p.status === "completed" });

		return res.json({
			project_id: projectId,
			progress_percent,
			current_phase: phaseLabel(p.status),
			milestones,
			funding_goal: goal,
			amount_raised: raised,
			pending_admin_approval: false,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getStartupProjectFunding = async (req, res) => {
	try {
		if (req.user.role !== "Startup") {
			return res.status(403).json({ error: "Startup role required" });
		}
		const ctx = await getStartupContext(req.user.user_id);
		if (!ctx) return res.status(404).json({ error: "Startup profile not found" });
		if (!ctx.is_approved) {
			return res.json({
				required: null,
				applied: 0,
				received: 0,
				pending_admin_approval: true,
			});
		}
		const projectId = parsePid(req);
		if (!projectId) return res.status(400).json({ error: "Invalid project id" });
		const p = await assertProjectForStartup(ctx.startup_id, projectId);
		if (!p) return res.status(404).json({ error: "Project not found" });

		const applied = await pool.query(
			`SELECT COALESCE(SUM(requested_amount), 0)::numeric AS total
       FROM investment_requests
       WHERE project_id = $1 AND status IN ('pending', 'approved')`,
			[projectId],
		);
		const received = await pool.query(
			`SELECT COALESCE(SUM(inv.amount), 0)::numeric AS total
       FROM investments inv
       JOIN investment_requests ir ON ir.investment_request_id = inv.investment_request_id
       WHERE ir.project_id = $1 AND inv.status = 'completed'`,
			[projectId],
		);

		return res.json({
			project_id: projectId,
			required: Number(p.funding_goal) || 0,
			amount_raised_in_project: Number(p.amount_raised) || 0,
			applied: Number(applied.rows[0].total) || 0,
			received: Number(received.rows[0].total) || 0,
			pending_admin_approval: false,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getStartupProjectDocuments = async (req, res) => {
	try {
		if (req.user.role !== "Startup") {
			return res.status(403).json({ error: "Startup role required" });
		}
		const ctx = await getStartupContext(req.user.user_id);
		if (!ctx) return res.status(404).json({ error: "Startup profile not found" });
		if (!ctx.is_approved) {
			return res.json({
				uploaded: [],
				missing_expected: [],
				pending_admin_approval: true,
				note: "Document verification flags are not in schema; shown as pending when files exist.",
			});
		}
		const projectId = parsePid(req);
		if (!projectId) return res.status(400).json({ error: "Invalid project id" });
		const p = await assertProjectForStartup(ctx.startup_id, projectId);
		if (!p) return res.status(404).json({ error: "Project not found" });

		const docs = await pool.query(
			`SELECT document_id, file_name, description, file_type, file_size_bytes, created_at
       FROM documents WHERE project_id = $1 ORDER BY created_at DESC`,
			[projectId],
		);

		const uploaded = docs.rows.map((d) => ({
			...d,
			verification_status: "pending",
		}));

		const names = docs.rows.map((d) => `${d.file_name} ${d.description || ""}`.toLowerCase());
		const missSimple = [];
		if (!names.some((n) => n.includes("pitch") || n.includes("deck"))) {
			missSimple.push({ label: "pitch_deck", required: true });
		}
		if (!names.some((n) => n.includes("business") && n.includes("plan"))) {
			missSimple.push({ label: "business_plan", required: true });
		}
		if (!names.some((n) => n.includes("financial") || n.includes("projection"))) {
			missSimple.push({ label: "financial_projection", required: true });
		}

		return res.json({
			project_id: projectId,
			uploaded,
			missing_expected: missSimple,
			pending_admin_approval: false,
			note: "Expected files align with POST /api/projects/create. verification_status is placeholder until modeled in DB.",
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getStartupProjectFeedback = async (req, res) => {
	try {
		if (req.user.role !== "Startup") {
			return res.status(403).json({ error: "Startup role required" });
		}
		const ctx = await getStartupContext(req.user.user_id);
		if (!ctx) return res.status(404).json({ error: "Startup profile not found" });
		if (!ctx.is_approved) {
			return res.json({ feedback: [], pending_admin_approval: true });
		}
		const projectId = parsePid(req);
		if (!projectId) return res.status(400).json({ error: "Invalid project id" });
		const p = await assertProjectForStartup(ctx.startup_id, projectId);
		if (!p) return res.status(404).json({ error: "Project not found" });

		const inv = await pool.query(
			`SELECT ir.investment_request_id, ir.status, ir.proposal_message, ir.created_at,
              iu.first_name || ' ' || iu.last_name AS investor_name, 'investment_request' AS source
       FROM investment_requests ir
       JOIN investors inv ON inv.investor_id = ir.investor_id
       JOIN users iu ON iu.user_id = inv.user_id
       WHERE ir.project_id = $1
       ORDER BY ir.created_at DESC
       LIMIT 20`,
			[projectId],
		);

		const feedback = inv.rows.map((row) => ({
			id: row.investment_request_id,
			source: row.source,
			from_name: row.investor_name,
			body: row.proposal_message,
			status: row.status,
			created_at: row.created_at,
		}));

		return res.json({
			project_id: projectId,
			feedback,
			pending_admin_approval: false,
			note: "Mentorship feedback is startup-wide in schema (no project_id on mentorship_reports); use /api/startups/dashboard/feedback for mentor reviews.",
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getStartupProjectEvents = async (req, res) => {
	try {
		if (req.user.role !== "Startup") {
			return res.status(403).json({ error: "Startup role required" });
		}
		const ctx = await getStartupContext(req.user.user_id);
		if (!ctx) return res.status(404).json({ error: "Startup profile not found" });
		if (!ctx.is_approved) {
			return res.json({ events: [], pending_admin_approval: true });
		}
		const projectId = parsePid(req);
		if (!projectId) return res.status(400).json({ error: "Invalid project id" });
		const p = await assertProjectForStartup(ctx.startup_id, projectId);
		if (!p) return res.status(404).json({ error: "Project not found" });

		// Schema has no project_id on mentorship_requests; return startup mentorship sessions as related calendar.
		const sessions = await pool.query(
			`SELECT ms.mentorship_session_id, ms.scheduled_at, ms.duration_minutes, ms.meeting_link AS join_link,
              ms.status, COALESCE(ms.notes, mr.subject) AS agenda, mr.subject
       FROM mentorship_sessions ms
       JOIN mentorship_requests mr ON mr.mentorship_request_id = ms.mentorship_request_id
       WHERE mr.startup_id = $1
         AND ms.scheduled_at >= NOW() - INTERVAL '1 hour'
         AND ms.status = 'scheduled'
       ORDER BY ms.scheduled_at ASC
       LIMIT 25`,
			[ctx.startup_id],
		);

		return res.json({
			project_id: projectId,
			events: sessions.rows,
			pending_admin_approval: false,
			note: "mentorship_requests has no project_id; events are startup-level mentor sessions (shown for each project).",
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getStartupProjectActivity = async (req, res) => {
	try {
		if (req.user.role !== "Startup") {
			return res.status(403).json({ error: "Startup role required" });
		}
		const ctx = await getStartupContext(req.user.user_id);
		if (!ctx) return res.status(404).json({ error: "Startup profile not found" });
		if (!ctx.is_approved) {
			return res.json({ activity: [], pending_admin_approval: true });
		}
		const projectId = parsePid(req);
		if (!projectId) return res.status(400).json({ error: "Invalid project id" });
		const p = await assertProjectForStartup(ctx.startup_id, projectId);
		if (!p) return res.status(404).json({ error: "Project not found" });

		const limit = Math.min(Number(req.query.limit) || 40, 100);

		const docs = await pool.query(
			`SELECT document_id AS id, 'document_upload' AS type, created_at AS at,
              file_name AS headline, COALESCE(description, 'File uploaded') AS detail
       FROM documents WHERE project_id = $1 ORDER BY created_at DESC LIMIT 25`,
			[projectId],
		);

		const inv = await pool.query(
			`SELECT investment_request_id AS id, 'investment_request' AS type, created_at AS at,
              'Request ' || status AS headline, COALESCE(proposal_message, '') AS detail
       FROM investment_requests WHERE project_id = $1 ORDER BY created_at DESC LIMIT 25`,
			[projectId],
		);

		const activity = [...docs.rows, ...inv.rows]
			.sort((a, b) => new Date(b.at) - new Date(a.at))
			.slice(0, limit);

		return res.json({ project_id: projectId, activity, pending_admin_approval: false });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};
