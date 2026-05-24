const pool = require("../config/db");

async function getMentorIdByUserId(userId) {
	const r = await pool.query(
		"SELECT mentor_id FROM mentors WHERE user_id = $1",
		[userId],
	);
	return r.rows[0]?.mentor_id ?? null;
}

/** GET /api/mentors/dashboard — mentor home KPIs + recent activity */
exports.getDashboard = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const mentorId = await getMentorIdByUserId(userId);
		if (!mentorId) {
			return res.status(404).json({ message: "Mentor profile not found" });
		}

		const profileRes = await pool.query(
			`SELECT m.*, u.first_name, u.last_name, u.email, u.is_approved
       FROM mentors m
       JOIN users u ON u.user_id = m.user_id
       WHERE m.user_id = $1`,
			[userId],
		);

		const statsRes = await pool.query(
			`SELECT
         (SELECT COUNT(*)::int FROM mentorship_requests WHERE mentor_id = $1 AND status = 'accepted') AS active_startups,
         (SELECT COUNT(*)::int FROM mentorship_requests WHERE mentor_id = $1 AND status = 'pending') AS pending_requests,
         (SELECT COUNT(*)::int FROM mentorship_sessions ms
            JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.mentorship_request_id
            WHERE mr.mentor_id = $1 AND ms.status = 'scheduled' AND ms.scheduled_at >= NOW()) AS upcoming_sessions,
         (SELECT COUNT(*)::int FROM mentorship_requests WHERE mentor_id = $1 AND status = 'accepted') AS proposals_sent,
         (SELECT COUNT(*)::int FROM mentorship_sessions ms
            JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.mentorship_request_id
            WHERE mr.mentor_id = $1
              AND ms.status = 'scheduled'
              AND ms.scheduled_at >= NOW()
              AND ms.scheduled_at < NOW() + INTERVAL '3 days') AS follow_ups,
         (SELECT COUNT(*)::int FROM mentorship_sessions ms
            JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.mentorship_request_id
            LEFT JOIN mentorship_reports rep ON rep.mentorship_session_id = ms.mentorship_session_id
            WHERE mr.mentor_id = $1
              AND ms.status = 'completed'
              AND rep.report_id IS NULL) AS reports_due,
         (SELECT COALESCE(SUM(amount), 0)::float FROM payments WHERE to_user_id = $2 AND reference_type = 'MENTORSHIP_SESSION') AS total_earnings`,
			[mentorId, userId],
		);

		const pendingRes = await pool.query(
			`SELECT mr.*,
              s.startup_name, s.industry, s.business_stage, s.city, s.region,
              s.team_size, s.funding_needed,
              CONCAT_WS(' ', u.first_name, u.last_name) AS founder_name,
              u.first_name AS startup_owner_first_name,
              u.last_name AS startup_owner_last_name
       FROM mentorship_requests mr
       JOIN startups s ON s.startup_id = mr.startup_id
       JOIN users u ON u.user_id = s.user_id
       WHERE mr.mentor_id = $1 AND mr.status = 'pending'
       ORDER BY mr.created_at DESC LIMIT 5`,
			[mentorId],
		);

		const sessionsRes = await pool.query(
			`SELECT ms.*, s.startup_name, s.industry, mr.subject
       FROM mentorship_sessions ms
       JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.mentorship_request_id
       JOIN startups s ON s.startup_id = mr.startup_id
       WHERE mr.mentor_id = $1 AND ms.status = 'scheduled' AND ms.scheduled_at >= NOW()
       ORDER BY ms.scheduled_at ASC LIMIT 5`,
			[mentorId],
		);

		const activeStartupsRes = await pool.query(
			`SELECT
              mr.mentorship_request_id,
              mr.subject,
              mr.created_at,
              s.startup_id,
              s.startup_name,
              s.industry,
              s.business_stage,
              s.city,
              s.team_size,
              COALESCE(ROUND(AVG(rep.progress_rating) * 20), 0)::int AS progress_percentage,
              COUNT(rep.report_id)::int AS reports_count
       FROM mentorship_requests mr
       JOIN startups s ON s.startup_id = mr.startup_id
       LEFT JOIN mentorship_reports rep ON rep.mentorship_request_id = mr.mentorship_request_id
       WHERE mr.mentor_id = $1 AND mr.status = 'accepted'
       GROUP BY mr.mentorship_request_id, s.startup_id
       ORDER BY mr.created_at DESC
       LIMIT 5`,
			[mentorId],
		);

		const chatsRes = await pool.query(
			`SELECT c.mentor_conversation_id, c.startup_id, c.last_message_at, s.startup_name,
              (SELECT COALESCE(mcm.text_body, mcm.file_name, 'File attachment')
               FROM mentor_chat_messages mcm
               WHERE mcm.mentor_conversation_id = c.mentor_conversation_id
               ORDER BY mcm.created_at DESC LIMIT 1) AS last_message_preview,
              (SELECT COUNT(*)::int
               FROM mentor_chat_messages mcm
               WHERE mcm.mentor_conversation_id = c.mentor_conversation_id
                 AND mcm.sender_user_id <> $2
                 AND mcm.read_at_mentor IS NULL) AS unread_count
       FROM mentor_chat_conversations c
       JOIN startups s ON s.startup_id = c.startup_id
       WHERE c.mentor_id = $1
       ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC LIMIT 5`,
			[mentorId, userId],
		);

		return res.json({
			profile: profileRes.rows[0] || null,
			stats: statsRes.rows[0],
			pending_requests: pendingRes.rows,
			upcoming_sessions: sessionsRes.rows,
			active_startups: activeStartupsRes.rows,
			recent_conversations: chatsRes.rows,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

/** GET /api/mentors/my-startups — accepted mentorships with startup info */
exports.getMyStartups = async (req, res) => {
	try {
		const mentorId = await getMentorIdByUserId(req.user.user_id);
		if (!mentorId) {
			return res.status(404).json({ message: "Mentor profile not found" });
		}

		const r = await pool.query(
			`SELECT mr.mentorship_request_id, mr.status, mr.created_at, mr.subject,
              s.startup_id, s.startup_name, s.industry, s.business_stage, s.city, s.region,
              s.startup_tagline, s.funding_needed, s.team_size, u.email AS owner_email,
              COALESCE(ROUND(AVG(rep.progress_rating) * 20), 0)::int AS progress_percentage,
              COUNT(rep.report_id)::int AS reports_count
       FROM mentorship_requests mr
       JOIN startups s ON s.startup_id = mr.startup_id
       JOIN users u ON u.user_id = s.user_id
       LEFT JOIN mentorship_reports rep ON rep.mentorship_request_id = mr.mentorship_request_id
       WHERE mr.mentor_id = $1 AND mr.status = 'accepted'
       GROUP BY mr.mentorship_request_id, s.startup_id, u.email
       ORDER BY mr.created_at DESC`,
			[mentorId],
		);

		return res.json({ startups: r.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};
