const pool = require("../config/db");
const crypto = require("crypto");
const { emitToRoom, emitToUser } = require("../services/socketBus");

function videoJoinUrl(roomId) {
	const base = (
		process.env.VIDEO_MEETING_BASE_URL ||
		process.env.FRONTEND_URL ||
		"http://localhost:3000"
	).replace(/\/$/, "");
	return `${base}/video-room/${encodeURIComponent(roomId)}`;
}

/** SQL fragment: conversation row c is unlocked for investor chat */
const CHAT_UNLOCK_EXISTS = `(
  EXISTS (
    SELECT 1 FROM investment_requests ir
    WHERE ir.startup_id = c.startup_id
      AND ir.investor_id = c.investor_id
      AND ir.status IN ('approved', 'accepted')
  )
  OR EXISTS (
    SELECT 1 FROM startup_investor_interests si
    WHERE si.startup_id = c.startup_id
      AND si.investor_id = c.investor_id
      AND si.status = 'acknowledged'
  )
)`;

async function getStartupByUserId(userId) {
	const r = await pool.query(
		"SELECT startup_id, user_id FROM startups WHERE user_id = $1",
		[userId],
	);
	return r.rows[0] || null;
}

async function getInvestorByUserId(userId) {
	const r = await pool.query(
		"SELECT investor_id, user_id FROM investors WHERE user_id = $1",
		[userId],
	);
	return r.rows[0] || null;
}

async function hasAcceptedInvestmentPair(startupId, investorId) {
	const r = await pool.query(
		`SELECT 1
     FROM investment_requests
     WHERE startup_id = $1
       AND investor_id = $2
       AND status IN ('approved', 'accepted')
     LIMIT 1`,
		[startupId, investorId],
	);
	if (r.rowCount > 0) return true;

	const interest = await pool.query(
		`SELECT 1 FROM startup_investor_interests
     WHERE startup_id = $1 AND investor_id = $2 AND status = 'acknowledged'
     LIMIT 1`,
		[startupId, investorId],
	);
	return interest.rowCount > 0;
}

async function ensureAcceptedInvestorConversations(startupId) {
	await pool.query(
		`INSERT INTO chat_conversations (startup_id, investor_id)
     SELECT startup_id, investor_id FROM (
       SELECT DISTINCT startup_id, investor_id
       FROM investment_requests
       WHERE startup_id = $1 AND status IN ('approved', 'accepted')
       UNION
       SELECT DISTINCT startup_id, investor_id
       FROM startup_investor_interests
       WHERE startup_id = $1 AND status = 'acknowledged'
     ) unlocked
     ON CONFLICT (startup_id, investor_id) DO NOTHING`,
		[startupId],
	);
}

async function loadConversationWithParties(conversationId) {
	const r = await pool.query(
		`SELECT c.*, su.user_id AS startup_user_id, iu.user_id AS investor_user_id
     FROM chat_conversations c
     INNER JOIN startups s ON s.startup_id = c.startup_id
     INNER JOIN users su ON su.user_id = s.user_id
     INNER JOIN investors inv ON inv.investor_id = c.investor_id
     INNER JOIN users iu ON iu.user_id = inv.user_id
     WHERE c.conversation_id = $1`,
		[conversationId],
	);
	return r.rows[0] || null;
}

function isParticipant(conv, userId) {
	const uid = Number(userId);
	return (
		Number(conv.startup_user_id) === uid ||
		Number(conv.investor_user_id) === uid
	);
}

function isStartupUser(conv, userId) {
	return Number(conv.startup_user_id) === Number(userId);
}

async function hasAcceptedInvestment(startupId, investorId) {
	const r = await pool.query(
		`SELECT 1
		 FROM investment_requests
		 WHERE startup_id = $1
		   AND investor_id = $2
		   AND status IN ('approved', 'accepted')
		 LIMIT 1`,
		[startupId, investorId],
	);
	return r.rowCount > 0;
}

async function requireAcceptedInvestment(startupId, investorId, res) {
	if (await hasAcceptedInvestment(startupId, investorId)) return true;
	res.status(403).json({
		error: "Chat is available only after an investment offer is accepted.",
	});
	return false;
}

/** POST /chat/conversations — create or return existing thread (Startup sends investor_id, Investor sends startup_id) */
exports.createOrGetConversation = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const role = req.user.role;
		const { investor_id, startup_id } = req.body || {};

		if (role === "Startup") {
			const s = await getStartupByUserId(userId);
			if (!s)
				return res.status(403).json({ error: "Startup profile required" });
			const invId = Number(investor_id);
			if (!Number.isInteger(invId) || invId <= 0) {
				return res
					.status(400)
					.json({ error: "investor_id is required for Startup" });
			}
			const inv = await pool.query(
				"SELECT investor_id FROM investors WHERE investor_id = $1",
				[invId],
			);
			if (!inv.rowCount)
				return res.status(404).json({ error: "Investor not found" });
			if (!(await hasAcceptedInvestmentPair(s.startup_id, invId))) {
				return res.status(403).json({
					error:
						"Chat is available only after an investment offer or request has been accepted",
				});
			}
			const ex = await pool.query(
				"SELECT * FROM chat_conversations WHERE startup_id = $1 AND investor_id = $2",
				[s.startup_id, invId],
			);
			if (ex.rows.length)
				return res.status(200).json({ conversation: ex.rows[0] });
			const ins = await pool.query(
				`INSERT INTO chat_conversations (startup_id, investor_id) VALUES ($1,$2) RETURNING *`,
				[s.startup_id, invId],
			);
			return res.status(201).json({ conversation: ins.rows[0] });
		}

		if (role === "Investor") {
			const inv = await getInvestorByUserId(userId);
			if (!inv)
				return res.status(403).json({ error: "Investor profile required" });
			const sid = Number(startup_id);
			if (!Number.isInteger(sid) || sid <= 0) {
				return res
					.status(400)
					.json({ error: "startup_id is required for Investor" });
			}
			const st = await pool.query(
				"SELECT startup_id FROM startups WHERE startup_id = $1",
				[sid],
			);
			if (!st.rowCount)
				return res.status(404).json({ error: "Startup not found" });
			if (!(await hasAcceptedInvestmentPair(sid, inv.investor_id))) {
				return res.status(403).json({
					error:
						"Chat is available only after an investment offer or request has been accepted",
				});
			}
			const ex = await pool.query(
				"SELECT * FROM chat_conversations WHERE startup_id = $1 AND investor_id = $2",
				[sid, inv.investor_id],
			);
			if (ex.rows.length)
				return res.status(200).json({ conversation: ex.rows[0] });
			const ins = await pool.query(
				`INSERT INTO chat_conversations (startup_id, investor_id) VALUES ($1,$2) RETURNING *`,
				[sid, inv.investor_id],
			);
			return res.status(201).json({ conversation: ins.rows[0] });
		}

		return res
			.status(403)
			.json({ error: "Only Startup or Investor may use chat" });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

/** GET /chat/conversations */
exports.listConversations = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const role = req.user.role;
		let rows;

		if (role === "Startup") {
			const s = await getStartupByUserId(userId);
			if (!s)
				return res.status(403).json({ error: "Startup profile required" });
			await ensureAcceptedInvestorConversations(s.startup_id);
			const r = await pool.query(
				`SELECT c.conversation_id, c.startup_id, c.investor_id, c.created_at, c.last_message_at,
              iu.first_name AS investor_first_name, iu.last_name AS investor_last_name, iu.email AS investor_email,
              inv.investor_type, inv.organization_name AS investor_company,
              (SELECT cm.message_type FROM chat_messages cm WHERE cm.conversation_id = c.conversation_id ORDER BY cm.created_at DESC LIMIT 1) AS last_message_type,
              (SELECT COALESCE(cm.text_body, cm.file_name, '') FROM chat_messages cm WHERE cm.conversation_id = c.conversation_id ORDER BY cm.created_at DESC LIMIT 1) AS last_message_preview,
              (SELECT COUNT(*)::int FROM chat_messages cm
               WHERE cm.conversation_id = c.conversation_id
                 AND cm.sender_user_id <> $2
                 AND cm.read_at_startup IS NULL) AS unread_count
       FROM chat_conversations c
       INNER JOIN investors inv ON inv.investor_id = c.investor_id
       INNER JOIN users iu ON iu.user_id = inv.user_id
       WHERE c.startup_id = $1
         AND ${CHAT_UNLOCK_EXISTS}
       ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC`,
				[s.startup_id, userId],
			);
			rows = r.rows;
		} else if (role === "Investor") {
			const inv = await getInvestorByUserId(userId);
			if (!inv)
				return res.status(403).json({ error: "Investor profile required" });
			const r = await pool.query(
				`SELECT c.conversation_id, c.startup_id, c.investor_id, c.created_at, c.last_message_at,
              su.first_name AS startup_contact_first_name, su.last_name AS startup_contact_last_name,
              s.startup_name, s.industry,
              (SELECT cm.message_type FROM chat_messages cm WHERE cm.conversation_id = c.conversation_id ORDER BY cm.created_at DESC LIMIT 1) AS last_message_type,
              (SELECT COALESCE(cm.text_body, cm.file_name, '') FROM chat_messages cm WHERE cm.conversation_id = c.conversation_id ORDER BY cm.created_at DESC LIMIT 1) AS last_message_preview,
              (SELECT COUNT(*)::int FROM chat_messages cm
               WHERE cm.conversation_id = c.conversation_id
                 AND cm.sender_user_id <> $2
                 AND cm.read_at_investor IS NULL) AS unread_count
       FROM chat_conversations c
       INNER JOIN startups s ON s.startup_id = c.startup_id
       INNER JOIN users su ON su.user_id = s.user_id
       WHERE c.investor_id = $1
         AND ${CHAT_UNLOCK_EXISTS}
       ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC`,
				[inv.investor_id, userId],
			);
			rows = r.rows;
		} else {
			return res
				.status(403)
				.json({ error: "Only Startup or Investor may list conversations" });
		}

		return res.json({ conversations: rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

/** GET /chat/conversations/:id/messages */
exports.getMessages = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const convId = Number(req.params.id);
		if (!Number.isInteger(convId) || convId <= 0) {
			return res.status(400).json({ error: "Invalid conversation id" });
		}
		const conv = await loadConversationWithParties(convId);
		if (!conv) return res.status(404).json({ error: "Conversation not found" });
		if (!isParticipant(conv, userId))
			return res.status(403).json({ error: "Forbidden" });
		if (!(await hasAcceptedInvestmentPair(conv.startup_id, conv.investor_id))) {
			return res
				.status(403)
				.json({ error: "This investor chat is no longer available" });
		}

		const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
		const offset = Math.max(0, Number(req.query.offset) || 0);

		const role = req.user.role;
		if (role === "Startup") {
			await pool.query(
				`UPDATE chat_messages SET read_at_startup = COALESCE(read_at_startup, CURRENT_TIMESTAMP)
         WHERE conversation_id = $1 AND sender_user_id <> $2 AND read_at_startup IS NULL`,
				[convId, userId],
			);
		} else if (role === "Investor") {
			await pool.query(
				`UPDATE chat_messages SET read_at_investor = COALESCE(read_at_investor, CURRENT_TIMESTAMP)
         WHERE conversation_id = $1 AND sender_user_id <> $2 AND read_at_investor IS NULL`,
				[convId, userId],
			);
		}

		const r = await pool.query(
			`SELECT chat_message_id, conversation_id, sender_user_id, message_type, text_body,
              file_name, file_mime, file_size_bytes,
              (file_data IS NOT NULL) AS has_file,
              created_at
       FROM chat_messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
			[convId, limit, offset],
		);

		const chronological = [...r.rows].reverse();
		return res.json({ messages: chronological });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

/** POST /chat/conversations/:id/messages */
exports.sendTextMessage = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const convId = Number(req.params.id);
		if (!Number.isInteger(convId) || convId <= 0) {
			return res.status(400).json({ error: "Invalid conversation id" });
		}
		const conv = await loadConversationWithParties(convId);
		if (!conv) return res.status(404).json({ error: "Conversation not found" });
		if (!isParticipant(conv, userId))
			return res.status(403).json({ error: "Forbidden" });
		if (!(await hasAcceptedInvestmentPair(conv.startup_id, conv.investor_id))) {
			return res
				.status(403)
				.json({ error: "This investor chat is no longer available" });
		}

		const body = req.body || {};
		const text =
			typeof body.body === "string"
				? body.body
				: typeof body.text === "string"
					? body.text
					: "";
		if (!text.trim()) {
			return res
				.status(400)
				.json({ error: "Message body is required (field 'body' or 'text')" });
		}

		const ins = await pool.query(
			`INSERT INTO chat_messages (conversation_id, sender_user_id, message_type, text_body)
       VALUES ($1,$2,'text',$3)
       RETURNING chat_message_id, conversation_id, sender_user_id, message_type, text_body, created_at`,
			[convId, userId, text.trim()],
		);
		await pool.query(
			"UPDATE chat_conversations SET last_message_at = CURRENT_TIMESTAMP WHERE conversation_id = $1",
			[convId],
		);

		const peerUserId = isStartupUser(conv, userId)
			? conv.investor_user_id
			: conv.startup_user_id;
		await pool.query(
			`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
       VALUES ($1, 'chat', 'New chat message', $2, 'chat_conversations', $3)`,
			[
				peerUserId,
				text.trim().slice(0, 200) || "You have a new message",
				convId,
			],
		);

		const outboundMessage = { ...ins.rows[0], channel: "investor" };
		emitToRoom("investor", convId, "receive_message", outboundMessage);
		emitToUser(peerUserId, "chat_notification", {
			channel: "investor",
			conversationId: convId,
			kind: "received",
			text: text.trim().slice(0, 200),
			senderUserId: userId,
			receivedAt: new Date().toISOString(),
		});
		emitToUser(userId, "chat_notification", {
			channel: "investor",
			conversationId: convId,
			kind: "sent",
			text: text.trim().slice(0, 200),
			receivedAt: new Date().toISOString(),
		});

		return res.status(201).json({ message: ins.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

/** POST /chat/conversations/:id/files */
exports.uploadChatFile = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const convId = Number(req.params.id);
		if (!Number.isInteger(convId) || convId <= 0) {
			return res.status(400).json({ error: "Invalid conversation id" });
		}
		const conv = await loadConversationWithParties(convId);
		if (!conv) return res.status(404).json({ error: "Conversation not found" });
		if (!isParticipant(conv, userId))
			return res.status(403).json({ error: "Forbidden" });
		if (!(await hasAcceptedInvestmentPair(conv.startup_id, conv.investor_id))) {
			return res
				.status(403)
				.json({ error: "This investor chat is no longer available" });
		}

		const file = req.file;
		if (!file || !file.buffer) {
			return res
				.status(400)
				.json({ error: "File field 'file' is required (multipart)" });
		}

		const caption =
			typeof req.body?.caption === "string" && req.body.caption.trim()
				? req.body.caption.trim()
				: null;

		const ins = await pool.query(
			`INSERT INTO chat_messages (conversation_id, sender_user_id, message_type, text_body, file_name, file_mime, file_size_bytes, file_data)
       VALUES ($1,$2,'file',$3,$4,$5,$6,$7)
       RETURNING chat_message_id, conversation_id, sender_user_id, message_type, text_body, file_name, file_mime, file_size_bytes, created_at`,
			[
				convId,
				userId,
				caption,
				file.originalname || "attachment",
				file.mimetype || "application/octet-stream",
				file.size,
				file.buffer,
			],
		);
		await pool.query(
			"UPDATE chat_conversations SET last_message_at = CURRENT_TIMESTAMP WHERE conversation_id = $1",
			[convId],
		);

		const peerUserId = isStartupUser(conv, userId)
			? conv.investor_user_id
			: conv.startup_user_id;
		await pool.query(
			`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
       VALUES ($1, 'chat', 'New file in chat', $2, 'chat_conversations', $3)`,
			[peerUserId, file.originalname || "Attachment", convId],
		);

		const outboundMessage = { ...ins.rows[0], channel: "investor" };
		emitToRoom("investor", convId, "receive_message", outboundMessage);
		emitToUser(peerUserId, "chat_notification", {
			channel: "investor",
			conversationId: convId,
			kind: "received",
			text: file.originalname || "Attachment",
			senderUserId: userId,
			receivedAt: new Date().toISOString(),
		});
		emitToUser(userId, "chat_notification", {
			channel: "investor",
			conversationId: convId,
			kind: "sent",
			text: file.originalname || "Attachment",
			receivedAt: new Date().toISOString(),
		});

		return res.status(201).json({ message: ins.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

/** GET /chat/notifications — chat-focused unread + active video */
exports.getChatNotifications = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const role = req.user.role;

		if (role !== "Startup" && role !== "Investor") {
			return res.status(403).json({ error: "Only Startup or Investor" });
		}

		let unreadTotal = 0;
		const conversationsWithUnread = [];

		if (role === "Startup") {
			const s = await getStartupByUserId(userId);
			if (!s) {
				return res.json({
					unread_chat_total: 0,
					conversations_with_unread: [],
					video_alerts: [],
					unread_chat_video_notifications: 0,
				});
			}
			const r = await pool.query(
				`SELECT c.conversation_id,
              (SELECT COUNT(*)::int FROM chat_messages cm
               WHERE cm.conversation_id = c.conversation_id AND cm.sender_user_id <> $2 AND cm.read_at_startup IS NULL) AS unread
       FROM chat_conversations c
       WHERE c.startup_id = $1
         AND ${CHAT_UNLOCK_EXISTS}`,
				[s.startup_id, userId],
			);
			for (const row of r.rows) {
				unreadTotal += row.unread || 0;
				if (row.unread > 0)
					conversationsWithUnread.push({
						conversation_id: row.conversation_id,
						unread: row.unread,
					});
			}
		} else {
			const inv = await getInvestorByUserId(userId);
			if (!inv) {
				return res.json({
					unread_chat_total: 0,
					conversations_with_unread: [],
					video_alerts: [],
					unread_chat_video_notifications: 0,
				});
			}
			const r = await pool.query(
				`SELECT c.conversation_id,
              (SELECT COUNT(*)::int FROM chat_messages cm
               WHERE cm.conversation_id = c.conversation_id AND cm.sender_user_id <> $2 AND cm.read_at_investor IS NULL) AS unread
       FROM chat_conversations c
       WHERE c.investor_id = $1
         AND ${CHAT_UNLOCK_EXISTS}`,
				[inv.investor_id, userId],
			);
			for (const row of r.rows) {
				unreadTotal += row.unread || 0;
				if (row.unread > 0)
					conversationsWithUnread.push({
						conversation_id: row.conversation_id,
						unread: row.unread,
					});
			}
		}

		const videoR = await pool.query(
			`SELECT v.video_call_id, v.conversation_id, v.room_id, v.status, v.started_by_user_id,
              v.screen_share_user_id, v.participant_user_ids, v.created_at, v.ended_at
       FROM chat_video_calls v
       INNER JOIN chat_conversations c ON c.conversation_id = v.conversation_id
       INNER JOIN startups s ON s.startup_id = c.startup_id
       INNER JOIN investors i ON i.investor_id = c.investor_id
       WHERE (s.user_id = $1 OR i.user_id = $1)
         AND ${CHAT_UNLOCK_EXISTS}
         AND v.status IN ('ringing', 'active')
       ORDER BY v.created_at DESC
       LIMIT 20`,
			[userId],
		);

		const appNotif = await pool.query(
			`SELECT COUNT(*)::int AS c FROM notifications
       WHERE user_id = $1 AND is_read = FALSE
         AND notification_type IN ('chat', 'video')`,
			[userId],
		);
		const unreadAppChatVideo = appNotif.rows[0]?.c ?? 0;

		return res.json({
			unread_chat_total: unreadTotal,
			conversations_with_unread: conversationsWithUnread,
			video_alerts: videoR.rows,
			unread_chat_video_notifications: unreadAppChatVideo,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

async function endStaleCallsForConversation(client, conversationId) {
	const ended = await client.query(
		`UPDATE chat_video_calls SET status = 'ended', ended_at = CURRENT_TIMESTAMP
     WHERE conversation_id = $1 AND status IN ('ringing', 'active')
     RETURNING video_call_id`,
		[conversationId],
	);
	const ids = ended.rows.map((row) => row.video_call_id);
	if (ids.length) {
		await client.query(
			`UPDATE chat_video_session_participants SET left_at = CURRENT_TIMESTAMP
       WHERE video_call_id = ANY($1::int[]) AND left_at IS NULL`,
			[ids],
		);
	}
}

/** Open session row for this user on this call (skip if already in an open row). */
async function ensureVideoParticipantJoined(client, videoCallId, userId) {
	await client.query(
		`INSERT INTO chat_video_session_participants (video_call_id, user_id)
     SELECT $1, $2
     WHERE NOT EXISTS (
       SELECT 1 FROM chat_video_session_participants p
       WHERE p.video_call_id = $1 AND p.user_id = $2 AND p.left_at IS NULL
     )`,
		[videoCallId, userId],
	);
}

async function closeParticipantSessionsForCall(client, videoCallId) {
	await client.query(
		`UPDATE chat_video_session_participants SET left_at = CURRENT_TIMESTAMP
     WHERE video_call_id = $1 AND left_at IS NULL`,
		[videoCallId],
	);
}

/** POST /chat/conversations/:id/video/start */
exports.videoStart = async (req, res) => {
	const client = await pool.connect();
	try {
		const userId = req.user.user_id;
		const convId = Number(req.params.id);
		if (!Number.isInteger(convId) || convId <= 0) {
			return res.status(400).json({ error: "Invalid conversation id" });
		}
		const conv = await loadConversationWithParties(convId);
		if (!conv) return res.status(404).json({ error: "Conversation not found" });
		if (!isParticipant(conv, userId))
			return res.status(403).json({ error: "Forbidden" });
		if (!(await hasAcceptedInvestmentPair(conv.startup_id, conv.investor_id))) {
			return res
				.status(403)
				.json({
					error: "Video calls require an accepted investment relationship",
				});
		}

		await client.query("BEGIN");
		await endStaleCallsForConversation(client, convId);
		const roomId = crypto.randomUUID();
		const ins = await client.query(
			`INSERT INTO chat_video_calls (conversation_id, room_id, status, started_by_user_id, participant_user_ids)
       VALUES ($1,$2,'ringing',$3,$4)
       RETURNING *`,
			[convId, roomId, userId, [userId]],
		);
		const newCallId = ins.rows[0].video_call_id;
		await client.query(
			`INSERT INTO chat_video_session_participants (video_call_id, user_id) VALUES ($1, $2)`,
			[newCallId, userId],
		);
		await client.query("COMMIT");

		const peerUserId = isStartupUser(conv, userId)
			? conv.investor_user_id
			: conv.startup_user_id;
		await pool.query(
			`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
       VALUES ($1, 'video', 'Incoming video call', $2, 'chat_conversations', $3)`,
			[peerUserId, `Room ${roomId}`, convId],
		);

		const startedCall = { ...ins.rows[0], join_url: videoJoinUrl(roomId) };
		emitToRoom("investor", convId, "call_signal", {
			channel: "investor",
			conversationId: convId,
			event: "ringing",
			video_call: startedCall,
		});
		emitToUser(peerUserId, "call_signal", {
			channel: "investor",
			conversationId: convId,
			event: "ringing",
			video_call: startedCall,
		});

		return res.status(201).json({ video_call: startedCall });
	} catch (err) {
		await client.query("ROLLBACK").catch(() => {});
		return res.status(500).json({ error: err.message });
	} finally {
		client.release();
	}
};

/** POST /chat/conversations/:id/video/join */
exports.videoJoin = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const convId = Number(req.params.id);
		if (!Number.isInteger(convId) || convId <= 0) {
			return res.status(400).json({ error: "Invalid conversation id" });
		}
		const conv = await loadConversationWithParties(convId);
		if (!conv) return res.status(404).json({ error: "Conversation not found" });
		if (!isParticipant(conv, userId))
			return res.status(403).json({ error: "Forbidden" });
		if (!(await hasAcceptedInvestmentPair(conv.startup_id, conv.investor_id))) {
			return res
				.status(403)
				.json({
					error: "Video calls require an accepted investment relationship",
				});
		}

		const r = await pool.query(
			`SELECT * FROM chat_video_calls
       WHERE conversation_id = $1 AND status IN ('ringing', 'active')
       ORDER BY created_at DESC LIMIT 1`,
			[convId],
		);
		if (!r.rowCount)
			return res
				.status(404)
				.json({ error: "No active or ringing call for this conversation" });

		const call = r.rows[0];
		let participants = Array.isArray(call.participant_user_ids)
			? [...call.participant_user_ids]
			: [];
		const uid = Number(userId);
		if (!participants.some((p) => Number(p) === uid)) participants.push(uid);

		const upd = await pool.query(
			`UPDATE chat_video_calls
       SET status = 'active', participant_user_ids = $2
       WHERE video_call_id = $1
       RETURNING *`,
			[call.video_call_id, participants],
		);

		await ensureVideoParticipantJoined(pool, call.video_call_id, userId);

		const joinedCall = {
			...upd.rows[0],
			join_url: videoJoinUrl(upd.rows[0].room_id),
		};
		emitToRoom("investor", convId, "call_signal", {
			channel: "investor",
			conversationId: convId,
			event: "active",
			video_call: joinedCall,
		});
		emitToUser(conv.startup_user_id, "call_signal", {
			channel: "investor",
			conversationId: convId,
			event: "active",
			video_call: joinedCall,
		});
		emitToUser(conv.investor_user_id, "call_signal", {
			channel: "investor",
			conversationId: convId,
			event: "active",
			video_call: joinedCall,
		});

		return res.json({ video_call: joinedCall });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

/** POST /chat/conversations/:id/video/end */
exports.videoEnd = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const convId = Number(req.params.id);
		if (!Number.isInteger(convId) || convId <= 0) {
			return res.status(400).json({ error: "Invalid conversation id" });
		}
		const conv = await loadConversationWithParties(convId);
		if (!conv) return res.status(404).json({ error: "Conversation not found" });
		if (!isParticipant(conv, userId))
			return res.status(403).json({ error: "Forbidden" });
		if (!(await hasAcceptedInvestmentPair(conv.startup_id, conv.investor_id))) {
			return res
				.status(403)
				.json({
					error: "Video calls require an accepted investment relationship",
				});
		}

		const r = await pool.query(
			`SELECT * FROM chat_video_calls
       WHERE conversation_id = $1 AND status IN ('ringing', 'active')
       ORDER BY created_at DESC LIMIT 1`,
			[convId],
		);
		if (!r.rowCount)
			return res.status(404).json({ error: "No active call to end" });

		const call = r.rows[0];
		let status = "ended";
		const participants = Array.isArray(call.participant_user_ids)
			? call.participant_user_ids
			: [];
		if (participants.length <= 1 && call.status === "ringing") {
			status = "missed";
		}

		const upd = await pool.query(
			`UPDATE chat_video_calls
       SET status = $2, ended_at = CURRENT_TIMESTAMP, screen_share_user_id = NULL
       WHERE video_call_id = $1
       RETURNING *`,
			[call.video_call_id, status],
		);

		await closeParticipantSessionsForCall(pool, call.video_call_id);

		const endedCall = {
			...upd.rows[0],
			join_url: videoJoinUrl(upd.rows[0].room_id),
		};
		emitToRoom("investor", convId, "call_signal", {
			channel: "investor",
			conversationId: convId,
			event: "ended",
			video_call: endedCall,
		});
		emitToUser(conv.startup_user_id, "call_signal", {
			channel: "investor",
			conversationId: convId,
			event: "ended",
			video_call: endedCall,
		});
		emitToUser(conv.investor_user_id, "call_signal", {
			channel: "investor",
			conversationId: convId,
			event: "ended",
			video_call: endedCall,
		});

		return res.json({ video_call: endedCall });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

/** GET /chat/conversations/:id/video/status */
exports.videoStatus = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const convId = Number(req.params.id);
		if (!Number.isInteger(convId) || convId <= 0) {
			return res.status(400).json({ error: "Invalid conversation id" });
		}
		const conv = await loadConversationWithParties(convId);
		if (!conv) return res.status(404).json({ error: "Conversation not found" });
		if (!isParticipant(conv, userId))
			return res.status(403).json({ error: "Forbidden" });
		if (!(await hasAcceptedInvestmentPair(conv.startup_id, conv.investor_id))) {
			return res
				.status(403)
				.json({
					error: "Video calls require an accepted investment relationship",
				});
		}

		const r = await pool.query(
			`SELECT * FROM chat_video_calls
       WHERE conversation_id = $1
       ORDER BY created_at DESC LIMIT 1`,
			[convId],
		);

		if (!r.rowCount) {
			return res.json({
				status: "none",
				video_call: null,
				hint: "No call has been placed for this conversation yet",
			});
		}

		const vc = r.rows[0];
		const partR = await pool.query(
			`SELECT user_id, joined_at, left_at
       FROM chat_video_session_participants
       WHERE video_call_id = $1
       ORDER BY joined_at ASC`,
			[vc.video_call_id],
		);

		return res.json({
			status: vc.status,
			video_call: {
				video_call_id: vc.video_call_id,
				room_id: vc.room_id,
				join_url: videoJoinUrl(vc.room_id),
				started_by_user_id: vc.started_by_user_id,
				screen_share_user_id: vc.screen_share_user_id,
				participant_user_ids: vc.participant_user_ids,
				created_at: vc.created_at,
				ended_at: vc.ended_at,
			},
			session_participants: partR.rows,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

/** POST /chat/conversations/:id/video/screen-share — body: { action: 'start' | 'stop' } */
exports.videoScreenShare = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const convId = Number(req.params.id);
		if (!Number.isInteger(convId) || convId <= 0) {
			return res.status(400).json({ error: "Invalid conversation id" });
		}
		const conv = await loadConversationWithParties(convId);
		if (!conv) return res.status(404).json({ error: "Conversation not found" });
		if (!isParticipant(conv, userId))
			return res.status(403).json({ error: "Forbidden" });
		if (
			!(await requireAcceptedInvestment(conv.startup_id, conv.investor_id, res))
		)
			return;

		const action = String((req.body || {}).action || "").toLowerCase();
		if (action !== "start" && action !== "stop") {
			return res
				.status(400)
				.json({ error: "action must be 'start' or 'stop'" });
		}

		const r = await pool.query(
			`SELECT * FROM chat_video_calls
       WHERE conversation_id = $1 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
			[convId],
		);
		if (!r.rowCount) {
			return res
				.status(400)
				.json({
					error: "Screen share is only available during an active call",
				});
		}

		const call = r.rows[0];
		let screenUid = call.screen_share_user_id;
		if (action === "start") {
			screenUid = userId;
		} else {
			if (Number(call.screen_share_user_id) !== Number(userId)) {
				return res
					.status(403)
					.json({
						error: "Only the user who started screen sharing can stop it",
					});
			}
			screenUid = null;
		}

		const upd = await pool.query(
			`UPDATE chat_video_calls SET screen_share_user_id = $2 WHERE video_call_id = $1 RETURNING *`,
			[call.video_call_id, screenUid],
		);

		emitToRoom("investor", convId, "call_signal", {
			channel: "investor",
			conversationId: convId,
			event: "screen-share",
			video_call: upd.rows[0],
		});
		emitToUser(conv.startup_user_id, "call_signal", {
			channel: "investor",
			conversationId: convId,
			event: "screen-share",
			video_call: upd.rows[0],
		});
		emitToUser(conv.investor_user_id, "call_signal", {
			channel: "investor",
			conversationId: convId,
			event: "screen-share",
			video_call: upd.rows[0],
		});

		return res.json({ video_call: upd.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

/** GET /chat/conversations/:id/messages/:messageId/file — download binary (optional helper) */
exports.downloadChatFile = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const convId = Number(req.params.id);
		const msgId = Number(req.params.messageId);
		if (!Number.isInteger(convId) || !Number.isInteger(msgId)) {
			return res.status(400).json({ error: "Invalid id" });
		}
		const conv = await loadConversationWithParties(convId);
		if (!conv) return res.status(404).json({ error: "Conversation not found" });
		if (!isParticipant(conv, userId))
			return res.status(403).json({ error: "Forbidden" });
		if (
			!(await requireAcceptedInvestment(conv.startup_id, conv.investor_id, res))
		)
			return;

		const r = await pool.query(
			`SELECT file_name, file_mime, file_data FROM chat_messages
       WHERE chat_message_id = $1 AND conversation_id = $2 AND message_type = 'file'`,
			[msgId, convId],
		);
		if (!r.rowCount || !r.rows[0].file_data)
			return res.status(404).json({ error: "File not found" });

		const row = r.rows[0];
		res.setHeader("Content-Type", row.file_mime || "application/octet-stream");
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="${encodeURIComponent(row.file_name || "file")}"`,
		);
		return res.send(row.file_data);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};
