const pool = require("../config/db");

/**
 * Verified = active account with verified email and admin approval.
 */
async function isVerifiedUser(userId) {
	const r = await pool.query(
		`SELECT is_approved, is_active, email_verified FROM users WHERE user_id = $1`,
		[userId],
	);
	if (!r.rowCount) return { ok: false, reason: "user_not_found" };
	const u = r.rows[0];
	if (!u.is_active) return { ok: false, reason: "account_disabled" };
	if (u.email_verified === false) return { ok: false, reason: "email_not_verified" };
	if (!u.is_approved) return { ok: false, reason: "pending_verification" };
	return { ok: true };
}

async function isChatSuspended(userId) {
	const r = await pool.query(
		`SELECT is_chat_suspended, suspended_until FROM chat_user_violations WHERE user_id = $1`,
		[userId],
	);
	if (!r.rowCount) return false;
	const row = r.rows[0];
	if (!row.is_chat_suspended) return false;
	if (row.suspended_until && new Date(row.suspended_until) < new Date()) {
		await pool.query(
			`UPDATE chat_user_violations SET is_chat_suspended = FALSE, suspended_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
			[userId],
		);
		return false;
	}
	return true;
}

/** Funding: approved investment OR acknowledged interest */
async function hasInvestorChatUnlock(startupId, investorId) {
	const inv = await pool.query(
		`SELECT 1 FROM investment_requests
     WHERE startup_id = $1 AND investor_id = $2 AND status IN ('approved', 'accepted')
     LIMIT 1`,
		[startupId, investorId],
	);
	if (inv.rowCount) return true;

	const interest = await pool.query(
		`SELECT 1 FROM startup_investor_interests
     WHERE startup_id = $1 AND investor_id = $2 AND status = 'acknowledged'
     LIMIT 1`,
		[startupId, investorId],
	);
	return interest.rowCount > 0;
}

async function hasMentorChatUnlock(startupId, mentorId) {
	const r = await pool.query(
		`SELECT 1 FROM mentorship_requests
     WHERE startup_id = $1 AND mentor_id = $2 AND status = 'accepted'
     LIMIT 1`,
		[startupId, mentorId],
	);
	return r.rowCount > 0;
}

async function hasCollaborationUnlock(startupIdA, startupIdB) {
	if (!startupIdA || !startupIdB || Number(startupIdA) === Number(startupIdB)) return false;
	const r = await pool.query(
		`SELECT 1 FROM collaboration_requests
     WHERE status = 'accepted'
       AND (
         (requester_startup_id = $1 AND partner_startup_id = $2)
         OR (requester_startup_id = $2 AND partner_startup_id = $1)
       )
     LIMIT 1`,
		[startupIdA, startupIdB],
	);
	return r.rowCount > 0;
}

/**
 * Full gate for using chat: verified + not suspended + relationship unlocked.
 */
async function assertChatAccess(userId, { channel, conversationId }) {
	const verified = await isVerifiedUser(userId);
	if (!verified.ok) {
		return {
			allowed: false,
			code: verified.reason,
			message:
				verified.reason === "email_not_verified"
					? "Please verify your email address before using chat."
					: verified.reason === "pending_verification"
					? "Only verified users can use chat. Please wait for admin approval."
					: "Your account cannot use chat at this time.",
		};
	}

	if (await isChatSuspended(userId)) {
		return {
			allowed: false,
			code: "chat_suspended",
			message: "Chat access is temporarily suspended due to repeated policy violations.",
		};
	}

	if (channel === "investor") {
		const conv = await pool.query(
			`SELECT c.startup_id, c.investor_id, s.user_id AS startup_user_id, iu.user_id AS investor_user_id
       FROM chat_conversations c
       INNER JOIN startups s ON s.startup_id = c.startup_id
       INNER JOIN investors inv ON inv.investor_id = c.investor_id
       INNER JOIN users iu ON iu.user_id = inv.user_id
       WHERE c.conversation_id = $1`,
			[conversationId],
		);
		if (!conv.rowCount) {
			return { allowed: false, code: "not_found", message: "Conversation not found" };
		}
		const row = conv.rows[0];
		if (Number(row.startup_user_id) !== Number(userId) && Number(row.investor_user_id) !== Number(userId)) {
			return { allowed: false, code: "forbidden", message: "Forbidden" };
		}
		const unlocked = await hasInvestorChatUnlock(row.startup_id, row.investor_id);
		if (!unlocked) {
			return {
				allowed: false,
				code: "chat_locked",
				message:
					"Chat unlocks after funding interest is accepted or an investment offer is approved.",
			};
		}
		return { allowed: true, conversation: row, channel: "investor" };
	}

	if (channel === "mentor") {
		const conv = await pool.query(
			`SELECT c.startup_id, c.mentor_id, c.mentor_conversation_id,
              s.user_id AS startup_user_id, mu.user_id AS mentor_user_id
       FROM mentor_chat_conversations c
       INNER JOIN startups s ON s.startup_id = c.startup_id
       INNER JOIN mentors m ON m.mentor_id = c.mentor_id
       INNER JOIN users mu ON mu.user_id = m.user_id
       WHERE c.mentor_conversation_id = $1`,
			[conversationId],
		);
		if (!conv.rowCount) {
			return { allowed: false, code: "not_found", message: "Conversation not found" };
		}
		const row = conv.rows[0];
		if (Number(row.startup_user_id) !== Number(userId) && Number(row.mentor_user_id) !== Number(userId)) {
			return { allowed: false, code: "forbidden", message: "Forbidden" };
		}
		const unlocked = await hasMentorChatUnlock(row.startup_id, row.mentor_id);
		if (!unlocked) {
			return {
				allowed: false,
				code: "chat_locked",
				message: "Chat unlocks only after mentorship has been accepted.",
			};
		}
		return { allowed: true, conversation: row, channel: "mentor" };
	}

	return { allowed: false, code: "invalid_channel", message: "Invalid chat channel" };
}

module.exports = {
	isVerifiedUser,
	isChatSuspended,
	hasInvestorChatUnlock,
	hasMentorChatUnlock,
	hasCollaborationUnlock,
	assertChatAccess,
};
