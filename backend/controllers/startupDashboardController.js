const pool = require("../config/db");

async function getStartupContext(userId) {
	const r = await pool.query(
		`SELECT s.*, u.user_id, u.first_name, u.last_name, u.email, u.phone_number, u.is_approved, u.is_active
     FROM startups s
     JOIN users u ON u.user_id = s.user_id
     WHERE s.user_id = $1`,
		[userId],
	);
	if (r.rowCount === 0) return null;
	const row = r.rows[0];
	return { startup: row, startupId: row.startup_id };
}

function hourGreeting() {
	const h = new Date().getHours();
	if (h < 12) return "Good morning";
	if (h < 18) return "Good afternoon";
	return "Good evening";
}

/** Profile registration doc labels (match authController descriptions where possible). */
const REQUIRED_DOC_LABELS = [
	"Founder or representative ID",
	"Business registration proof",
];
const OPTIONAL_DOC_LABELS = [
	"TIN certificate",
	"Support or affiliation letter",
];

function docMatchesLabel(description, fileName, label) {
	const d = `${description || ""} ${fileName || ""}`.toLowerCase();
	const l = label.toLowerCase();
	return d.includes(l) || (l.includes("tin") && d.includes("tin"));
}

exports.getStartupInfo = async (req, res) => {
	try {
		const ctx = await getStartupContext(req.user.user_id);
		if (!ctx) return res.status(404).json({ error: "Startup profile not found" });
		const { startup: s } = ctx;
		const founder =
			s.founder_full_name ||
			[s.first_name, s.last_name].filter(Boolean).join(" ").trim() ||
			null;
		return res.json({
			startup_name: s.startup_name,
			founder_name: founder,
			startup_tagline: s.startup_tagline || null,
			industry: s.industry || null,
			business_stage: s.business_stage || null,
			greeting: `${hourGreeting()}, ${s.first_name || "there"}!`,
			is_approved: s.is_approved,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getMentorUpdates = async (req, res) => {
	try {
		const ctx = await getStartupContext(req.user.user_id);
		if (!ctx) return res.status(404).json({ error: "Startup profile not found" });
		const { startupId } = ctx;
		const limit = Math.min(Number(req.query.limit) || 15, 50);

		const requests = await pool.query(
			`SELECT mr.mentorship_request_id, mr.subject, mr.message, mr.status, mr.created_at,
              m.mentor_id,
              mu.first_name AS mentor_first_name, mu.last_name AS mentor_last_name
       FROM mentorship_requests mr
       JOIN mentors m ON m.mentor_id = mr.mentor_id
       JOIN users mu ON mu.user_id = m.user_id
       WHERE mr.startup_id = $1
       ORDER BY mr.created_at DESC
       LIMIT $2`,
			[startupId, limit],
		);

		const reports = await pool.query(
			`SELECT r.report_id, r.report_title, r.summary, r.progress_rating, r.created_at,
              r.next_steps, r.action_items,
              mu.first_name AS mentor_first_name, mu.last_name AS mentor_last_name
       FROM mentorship_reports r
       JOIN mentors m ON m.mentor_id = r.mentor_id
       JOIN users mu ON mu.user_id = m.user_id
       WHERE r.startup_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2`,
			[startupId, limit],
		);

		const sessions = await pool.query(
			`SELECT ms.mentorship_session_id, ms.scheduled_at, ms.status, ms.notes, ms.meeting_link, ms.created_at,
              mr.subject AS request_subject
       FROM mentorship_sessions ms
       JOIN mentorship_requests mr ON mr.mentorship_request_id = ms.mentorship_request_id
       WHERE mr.startup_id = $1
       ORDER BY COALESCE(ms.scheduled_at, ms.created_at) DESC
       LIMIT $2`,
			[startupId, limit],
		);

		return res.json({
			mentorship_requests: requests.rows,
			mentorship_reports: reports.rows,
			recent_sessions: sessions.rows,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getStartupStatus = async (req, res) => {
	try {
		const ctx = await getStartupContext(req.user.user_id);
		if (!ctx) return res.status(404).json({ error: "Startup profile not found" });
		const { startup: s, startupId } = ctx;

		if (!s.is_approved) {
			return res.json({
				status: "Pending",
				status_label: "Pending admin approval",
				business_stage: s.business_stage || null,
				account_active: s.is_active,
			});
		}

		const proj = await pool.query(
			`SELECT project_id, status, funding_goal, amount_raised
       FROM projects WHERE startup_id = $1`,
			[startupId],
		);
		const rows = proj.rows;
		let status = "Active";
		let status_label = "Your startup is active";

		const anyFunded = rows.some((p) => p.status === "funded");
		const anyCompleted = rows.some((p) => p.status === "completed");
		const anyFullyRaised = rows.some(
			(p) =>
				Number(p.funding_goal) > 0 &&
				Number(p.amount_raised) >= Number(p.funding_goal),
		);

		if (anyFunded || anyFullyRaised) {
			status = "Funded";
			status_label = "Funding goal reached or project marked funded";
		} else if (anyCompleted) {
			status = "Completed";
			status_label = "A project has been completed";
		} else if (rows.length === 0) {
			status = "Active";
			status_label = "No projects yet — create one to track fundraising";
		} else if (rows.every((p) => p.status === "draft")) {
			status = "Draft";
			status_label = "Projects are in draft";
		} else if (rows.some((p) => p.status === "cancelled") && rows.every((p) => ["cancelled", "draft"].includes(p.status))) {
			status = "Inactive";
			status_label = "No active fundraising projects";
		}

		return res.json({
			status,
			status_label,
			business_stage: s.business_stage || null,
			account_active: s.is_active,
			project_count: rows.length,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getProjectProgress = async (req, res) => {
	try {
		const ctx = await getStartupContext(req.user.user_id);
		if (!ctx) return res.status(404).json({ error: "Startup profile not found" });
		const { startupId } = ctx;

		const proj = await pool.query(
			`SELECT project_id, project_title, status, funding_goal, amount_raised, start_date, end_date, created_at
       FROM projects WHERE startup_id = $1
       ORDER BY created_at DESC`,
			[startupId],
		);

		const projects = proj.rows.map((p) => {
			const goal = Number(p.funding_goal) || 0;
			const raised = Number(p.amount_raised) || 0;
			let progress_percent = 0;
			if (goal > 0) progress_percent = Math.min(100, Math.round((raised / goal) * 1000) / 10);
			const phaseMap = {
				draft: "Draft",
				active: "Fundraising",
				funded: "Funded",
				completed: "Completed",
				cancelled: "Cancelled",
			};
			return {
				project_id: p.project_id,
				project_title: p.project_title,
				status: p.status,
				phase: phaseMap[p.status] || p.status,
				progress_percent,
				funding_goal: goal,
				amount_raised: raised,
				start_date: p.start_date,
				end_date: p.end_date,
			};
		});

		let overall_progress_percent = 0;
		if (projects.length) {
			overall_progress_percent =
				Math.round(
					(projects.reduce((a, p) => a + p.progress_percent, 0) / projects.length) * 10,
				) / 10;
		}

		return res.json({
			overall_progress_percent,
			primary_phase: projects[0]?.phase || "No project",
			projects,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getFundingSummary = async (req, res) => {
	try {
		const ctx = await getStartupContext(req.user.user_id);
		if (!ctx) return res.status(404).json({ error: "Startup profile not found" });
		const { startup: s, startupId } = ctx;

		const goals = await pool.query(
			`SELECT COALESCE(SUM(funding_goal), 0)::numeric AS total_goal,
              COALESCE(SUM(amount_raised), 0)::numeric AS total_raised_projects
       FROM projects WHERE startup_id = $1 AND status IN ('active', 'draft', 'funded')`,
			[startupId],
		);

		const applied = await pool.query(
			`SELECT COALESCE(SUM(ir.requested_amount), 0)::numeric AS total
       FROM investment_requests ir
       WHERE ir.startup_id = $1 AND ir.status IN ('pending', 'approved')`,
			[startupId],
		);

		const received = await pool.query(
			`SELECT COALESCE(SUM(inv.amount), 0)::numeric AS total
       FROM investments inv
       JOIN investment_requests ir ON ir.investment_request_id = inv.investment_request_id
       WHERE ir.startup_id = $1 AND inv.status = 'completed'`,
			[startupId],
		);

		const profileTarget = s.funding_needed != null ? Number(s.funding_needed) : null;
		const projectsGoal = Number(goals.rows[0].total_goal) || 0;

		return res.json({
			required_funding_profile: profileTarget,
			required_funding_projects_total: projectsGoal,
			required_funding:
				profileTarget != null && !Number.isNaN(profileTarget)
					? profileTarget
					: projectsGoal,
			applied_funding: Number(applied.rows[0].total) || 0,
			received_funding: Number(received.rows[0].total) || 0,
			amount_raised_in_projects: Number(goals.rows[0].total_raised_projects) || 0,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getDocumentsStatus = async (req, res) => {
	try {
		const ctx = await getStartupContext(req.user.user_id);
		if (!ctx) return res.status(404).json({ error: "Startup profile not found" });
		const { startup: s, startupId } = ctx;

		const docs = await pool.query(
			`SELECT document_id, file_name, description, file_type, file_size_bytes, created_at, project_id
       FROM documents
       WHERE startup_id = $1
       ORDER BY created_at DESC`,
			[startupId],
		);

		let manifest = [];
		if (s.uploaded_documents && typeof s.uploaded_documents === "object") {
			manifest = Array.isArray(s.uploaded_documents) ? s.uploaded_documents : [];
		}

		const uploadedRows = docs.rows.map((d) => ({
			document_id: d.document_id,
			file_name: d.file_name,
			description: d.description,
			project_id: d.project_id,
			source: "documents",
			verification_status: "pending",
		}));

		const missing = [];
		const requiredPresent = [];
		for (const label of REQUIRED_DOC_LABELS) {
			const hit = docs.rows.some((d) =>
				docMatchesLabel(d.description, d.file_name, label),
			);
			if (hit) requiredPresent.push(label);
			else missing.push({ label, required: true });
		}

		const optionalStatus = OPTIONAL_DOC_LABELS.map((label) => ({
			label,
			uploaded: docs.rows.some((d) =>
				docMatchesLabel(d.description, d.file_name, label),
			),
			required: false,
		}));

		return res.json({
			uploaded: uploadedRows,
			uploaded_documents_manifest: manifest,
			missing_required: missing,
			optional: optionalStatus,
			note: "verification_status is placeholder until admin verification is modeled in the schema.",
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getLatestFeedback = async (req, res) => {
	try {
		const ctx = await getStartupContext(req.user.user_id);
		if (!ctx) return res.status(404).json({ error: "Startup profile not found" });
		const { startupId } = ctx;
		const limit = Math.min(Number(req.query.limit) || 10, 50);

		const reviews = await pool.query(
			`SELECT r.review_id, r.rating, r.comment AS body, r.created_at,
              mu.first_name || ' ' || mu.last_name AS from_name, 'mentor_review' AS source
       FROM reviews r
       JOIN mentors m ON m.mentor_id = r.mentor_id
       JOIN users mu ON mu.user_id = m.user_id
       WHERE r.startup_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2`,
			[startupId, limit],
		);

		const reportFeedback = await pool.query(
			`SELECT mr.report_id, mr.report_title, mr.startup_feedback AS body, mr.progress_rating AS rating,
              mr.created_at,
              mu.first_name || ' ' || mu.last_name AS from_name, 'mentorship_report' AS source
       FROM mentorship_reports mr
       JOIN mentors m ON m.mentor_id = mr.mentor_id
       JOIN users mu ON mu.user_id = m.user_id
       WHERE mr.startup_id = $1 AND mr.startup_feedback IS NOT NULL AND btrim(mr.startup_feedback) <> ''
       ORDER BY mr.created_at DESC
       LIMIT $2`,
			[startupId, limit],
		);

		const investorMsgs = await pool.query(
			`SELECT m.message_id, m.subject, m.body, m.created_at,
              CASE WHEN m.sender_user_id = $1 THEN ru.first_name || ' ' || ru.last_name
                   ELSE su.first_name || ' ' || su.last_name END AS from_name,
              'message' AS source
       FROM messages m
       JOIN users su ON su.user_id = m.sender_user_id
       JOIN users ru ON ru.user_id = m.receiver_user_id
       WHERE (m.sender_user_id = $1 OR m.receiver_user_id = $1)
         AND (su.role = 'Investor' OR ru.role = 'Investor')
       ORDER BY m.created_at DESC
       LIMIT $2`,
			[req.user.user_id, limit],
		);

		const combined = [
			...reviews.rows.map((r) => ({ ...r, kind: "review" })),
			...reportFeedback.rows.map((r) => ({ ...r, kind: "report" })),
			...investorMsgs.rows.map((r) => ({ ...r, kind: "message" })),
		]
			.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
			.slice(0, limit);

		return res.json({ feedback: combined });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getUpcomingEvents = async (req, res) => {
	try {
		const ctx = await getStartupContext(req.user.user_id);
		if (!ctx) return res.status(404).json({ error: "Startup profile not found" });
		const { startupId } = ctx;

		const sessions = await pool.query(
			`SELECT ms.mentorship_session_id,
              ms.scheduled_at,
              ms.duration_minutes,
              ms.meeting_link AS join_link,
              COALESCE(ms.notes, mr.message, mr.subject) AS agenda,
              ms.status,
              mr.subject,
              mu.first_name || ' ' || mu.last_name AS mentor_name
       FROM mentorship_sessions ms
       JOIN mentorship_requests mr ON mr.mentorship_request_id = ms.mentorship_request_id
       JOIN mentors m ON m.mentor_id = mr.mentor_id
       JOIN users mu ON mu.user_id = m.user_id
       WHERE mr.startup_id = $1
         AND ms.scheduled_at >= NOW() - INTERVAL '1 hour'
         AND ms.status = 'scheduled'
       ORDER BY ms.scheduled_at ASC
       LIMIT 25`,
			[startupId],
		);

		return res.json({ events: sessions.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getRecentActivity = async (req, res) => {
	try {
		const ctx = await getStartupContext(req.user.user_id);
		if (!ctx) return res.status(404).json({ error: "Startup profile not found" });
		const { startupId } = ctx;
		const userId = req.user.user_id;
		const limit = Math.min(Number(req.query.limit) || 30, 100);

		const notifications = await pool.query(
			`SELECT notification_id AS id, 'notification' AS type, created_at AS at,
              title AS headline, message AS detail, is_read
       FROM notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 25`,
			[userId],
		);

		const docUploads = await pool.query(
			`SELECT document_id AS id, 'document_upload' AS type, created_at AS at,
              file_name AS headline, COALESCE(description, 'File uploaded') AS detail
       FROM documents WHERE startup_id = $1
       ORDER BY created_at DESC LIMIT 25`,
			[startupId],
		);

		const invReq = await pool.query(
			`SELECT ir.investment_request_id AS id, 'investment_request' AS type, ir.created_at AS at,
              'Investment request ' || ir.status AS headline,
              COALESCE(ir.proposal_message, '') AS detail
       FROM investment_requests ir
       WHERE ir.startup_id = $1
       ORDER BY ir.created_at DESC LIMIT 15`,
			[startupId],
		);

		const mReq = await pool.query(
			`SELECT mr.mentorship_request_id AS id, 'mentorship_request' AS type, mr.created_at AS at,
              'Mentorship ' || mr.status AS headline, mr.subject AS detail
       FROM mentorship_requests mr
       WHERE mr.startup_id = $1
       ORDER BY mr.created_at DESC LIMIT 15`,
			[startupId],
		);

		const timeline = [
			...notifications.rows,
			...docUploads.rows,
			...invReq.rows,
			...mReq.rows,
		]
			.sort((a, b) => new Date(b.at) - new Date(a.at))
			.slice(0, limit);

		return res.json({ activity: timeline });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.postQuickActions = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const ctx = await getStartupContext(userId);
		if (!ctx) return res.status(404).json({ error: "Startup profile not found" });

		const { action, payload } = req.body || {};
		if (!action || typeof action !== "string") {
			return res.status(400).json({
				error: "action is required",
				supported_actions: [
					"mark_notifications_read",
					"create_project_hint",
					"request_investment_hint",
				],
			});
		}

		switch (action) {
			case "mark_notifications_read": {
				const ids = payload && Array.isArray(payload.notification_ids) ? payload.notification_ids : null;
				if (ids && ids.length) {
					await pool.query(
						`UPDATE notifications SET is_read = true
             WHERE user_id = $1 AND notification_id = ANY($2::int[])`,
						[userId, ids],
					);
				} else {
					await pool.query(`UPDATE notifications SET is_read = true WHERE user_id = $1`, [userId]);
				}
				return res.json({ message: "Notifications marked read", action });
			}
			case "create_project_hint":
				return res.json({
					message: "Use POST /api/projects/create with multipart files (pitch_deck, business_plan, financial_projection) and JSON fields.",
					endpoint: "POST /api/projects/create",
					required_fields: [
						"project_title",
						"description",
						"funding_goal",
						"start_date",
						"end_date",
					],
					action,
				});
			case "request_investment_hint":
				return res.json({
					message: "Create or select a project, then use investment flows under /api/investments as documented.",
					endpoint: "POST /api/investments (or your collection’s investment request route)",
					action,
				});
			default:
				return res.status(400).json({
					error: "Unknown action",
					supported_actions: [
						"mark_notifications_read",
						"create_project_hint",
						"request_investment_hint",
					],
				});
		}
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};
