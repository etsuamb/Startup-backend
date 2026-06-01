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

async function getStartupByUserId(userId) {
	const r = await pool.query(
		"SELECT startup_id, user_id FROM startups WHERE user_id = $1",
		[userId],
	);
	return r.rows[0] || null;
}

async function getMentorByUserId(userId) {
	const r = await pool.query(
		"SELECT mentor_id, user_id FROM mentors WHERE user_id = $1",
		[userId],
	);
	return r.rows[0] || null;
}

async function getMentorshipPair(startupId, mentorId) {
	const r = await pool.query(
		`SELECT mentorship_request_id, status FROM mentorship_requests
     WHERE startup_id = $1 AND mentor_id = $2
     ORDER BY created_at DESC LIMIT 1`,
		[startupId, mentorId],
	);
	return r.rows[0] || null;
}

async function hasAcceptedMentorshipPair(startupId, mentorId) {
	const pair = await getMentorshipPair(startupId, mentorId);
	return pair?.status === "accepted";
}

async function ensureAcceptedMentorConversations(startupId) {
	await pool.query(
		`INSERT INTO mentor_chat_conversations (startup_id, mentor_id)
     SELECT DISTINCT startup_id, mentor_id
     FROM mentorship_requests
     WHERE startup_id = $1
       AND status = 'accepted'
     ON CONFLICT (startup_id, mentor_id) DO NOTHING`,
		[startupId],
	);
}

async function loadMentorConversation(convId) {
	const r = await pool.query(
		`SELECT c.*, su.user_id AS startup_user_id, mu.user_id AS mentor_user_id
     FROM mentor_chat_conversations c
     INNER JOIN startups s ON s.startup_id = c.startup_id
     INNER JOIN users su ON su.user_id = s.user_id
     INNER JOIN mentors m ON m.mentor_id = c.mentor_id
     INNER JOIN users mu ON mu.user_id = m.user_id
     WHERE c.mentor_conversation_id = $1`,
		[convId],
	);
	return r.rows[0] || null;
}

function isParticipant(conv, userId) {
	const uid = Number(userId);
	return (
		Number(conv.startup_user_id) === uid || Number(conv.mentor_user_id) === uid
	);
}

function isStartupUser(conv, userId) {
	return Number(conv.startup_user_id) === Number(userId);
}

/** POST — Startup: { mentor_id }; Mentor: { startup_id } */
exports.createOrGetConversation = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const role = req.user.role;
		const { mentor_id, startup_id } = req.body || {};

		if (role === "Startup") {
			const s = await getStartupByUserId(userId);
			if (!s)
				return res.status(403).json({ error: "Startup profile required" });
			const mid = Number(mentor_id);
			if (!Number.isInteger(mid) || mid <= 0) {
				return res
					.status(400)
					.json({ error: "mentor_id is required for Startup" });
			}
			const m = await pool.query(
				"SELECT mentor_id FROM mentors WHERE mentor_id = $1",
				[mid],
			);
			if (!m.rowCount)
				return res.status(404).json({ error: "Mentor not found" });
			const pair = await getMentorshipPair(s.startup_id, mid);
			if (!pair || pair.status !== "accepted") {
				return res.status(404).json({
					error:
						"Chat is available only after the mentorship request has been accepted",
				});
			}
			const ex = await pool.query(
				"SELECT * FROM mentor_chat_conversations WHERE startup_id = $1 AND mentor_id = $2",
				[s.startup_id, mid],
			);
			if (ex.rows.length)
				return res.status(200).json({ conversation: ex.rows[0] });
			const ins = await pool.query(
				`INSERT INTO mentor_chat_conversations (startup_id, mentor_id) VALUES ($1,$2) RETURNING *`,
				[s.startup_id, mid],
			);
			return res.status(201).json({ conversation: ins.rows[0] });
		}

		if (role === "Mentor") {
			const ment = await getMentorByUserId(userId);
			if (!ment)
				return res.status(403).json({ error: "Mentor profile required" });
			const sid = Number(startup_id);
			if (!Number.isInteger(sid) || sid <= 0) {
				return res
					.status(400)
					.json({ error: "startup_id is required for Mentor" });
			}
			const st = await pool.query(
				"SELECT startup_id FROM startups WHERE startup_id = $1",
				[sid],
			);
			if (!st.rowCount)
				return res.status(404).json({ error: "Startup not found" });
			const pair = await getMentorshipPair(sid, ment.mentor_id);
			if (!pair || pair.status !== "accepted") {
				return res.status(404).json({
					error:
						"Chat is available only after the mentorship request has been accepted",
				});
			}
			const ex = await pool.query(
				"SELECT * FROM mentor_chat_conversations WHERE startup_id = $1 AND mentor_id = $2",
				[sid, ment.mentor_id],
			);
			if (ex.rows.length)
				return res.status(200).json({ conversation: ex.rows[0] });
			const ins = await pool.query(
				`INSERT INTO mentor_chat_conversations (startup_id, mentor_id) VALUES ($1,$2) RETURNING *`,
				[sid, ment.mentor_id],
			);
			return res.status(201).json({ conversation: ins.rows[0] });
		}

		return res
			.status(403)
			.json({ error: "Only Startup or Mentor may use mentor chat" });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.listConversations = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const role = req.user.role;
		let rows;

		if (role === "Startup") {
			const s = await getStartupByUserId(userId);
			if (!s)
				return res.status(403).json({ error: "Startup profile required" });
			await ensureAcceptedMentorConversations(s.startup_id);
			const r = await pool.query(
				`SELECT c.mentor_conversation_id, c.startup_id, c.mentor_id, c.created_at, c.last_message_at,
              mu.first_name AS mentor_first_name, mu.last_name AS mentor_last_name, mu.email AS mentor_email,
              m.headline AS mentor_headline,
              (SELECT cm.message_type FROM mentor_chat_messages cm WHERE cm.mentor_conversation_id = c.mentor_conversation_id ORDER BY cm.created_at DESC LIMIT 1) AS last_message_type,
              (SELECT COALESCE(cm.text_body, cm.file_name, '') FROM mentor_chat_messages cm WHERE cm.mentor_conversation_id = c.mentor_conversation_id ORDER BY cm.created_at DESC LIMIT 1) AS last_message_preview,
              (SELECT COUNT(*)::int FROM mentor_chat_messages cm
               WHERE cm.mentor_conversation_id = c.mentor_conversation_id
                 AND cm.sender_user_id <> $2
                 AND cm.read_at_startup IS NULL) AS unread_count
       FROM mentor_chat_conversations c
       INNER JOIN mentors m ON m.mentor_id = c.mentor_id
       INNER JOIN users mu ON mu.user_id = m.user_id
       WHERE c.startup_id = $1
         AND EXISTS (
           SELECT 1 FROM mentorship_requests mr
           WHERE mr.startup_id = c.startup_id
             AND mr.mentor_id = c.mentor_id
             AND mr.status = 'accepted'
         )
       ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC`,
				[s.startup_id, userId],
			);
			rows = r.rows;
		} else if (role === "Mentor") {
			const ment = await getMentorByUserId(userId);
			if (!ment)
				return res.status(403).json({ error: "Mentor profile required" });
			const r = await pool.query(
				`SELECT c.mentor_conversation_id, c.startup_id, c.mentor_id, c.created_at, c.last_message_at,
              su.first_name AS startup_contact_first_name, su.last_name AS startup_contact_last_name,
              s.startup_name, s.industry, s.business_stage,
              (SELECT cm.message_type FROM mentor_chat_messages cm WHERE cm.mentor_conversation_id = c.mentor_conversation_id ORDER BY cm.created_at DESC LIMIT 1) AS last_message_type,
              (SELECT COALESCE(cm.text_body, cm.file_name, '') FROM mentor_chat_messages cm WHERE cm.mentor_conversation_id = c.mentor_conversation_id ORDER BY cm.created_at DESC LIMIT 1) AS last_message_preview,
              (SELECT COUNT(*)::int FROM mentor_chat_messages cm
               WHERE cm.mentor_conversation_id = c.mentor_conversation_id
                 AND cm.sender_user_id <> $2
                 AND cm.read_at_mentor IS NULL) AS unread_count
       FROM mentor_chat_conversations c
       INNER JOIN startups s ON s.startup_id = c.startup_id
       INNER JOIN users su ON su.user_id = s.user_id
       WHERE c.mentor_id = $1
         AND EXISTS (
           SELECT 1 FROM mentorship_requests mr
           WHERE mr.startup_id = c.startup_id
             AND mr.mentor_id = c.mentor_id
             AND mr.status = 'accepted'
         )
       ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC`,
				[ment.mentor_id, userId],
			);
			rows = r.rows;
		} else {
			return res
				.status(403)
				.json({
					error: "Only Startup or Mentor may list mentor conversations",
				});
		}

		return res.json({ conversations: rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getMessages = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const convId = Number(req.params.id);
		if (!Number.isInteger(convId) || convId <= 0) {
			return res.status(400).json({ error: "Invalid conversation id" });
		}
		const conv = await loadMentorConversation(convId);
		if (!conv) return res.status(404).json({ error: "Conversation not found" });
		if (!isParticipant(conv, userId))
			return res.status(403).json({ error: "Forbidden" });
		if (!(await hasAcceptedMentorshipPair(conv.startup_id, conv.mentor_id))) {
			return res
				.status(403)
				.json({
					error: "This mentor chat is available only for accepted mentorships",
				});
		}

		const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
		const offset = Math.max(0, Number(req.query.offset) || 0);
		const role = req.user.role;

		if (role === "Startup") {
			await pool.query(
				`UPDATE mentor_chat_messages SET read_at_startup = COALESCE(read_at_startup, CURRENT_TIMESTAMP)
         WHERE mentor_conversation_id = $1 AND sender_user_id <> $2 AND read_at_startup IS NULL`,
				[convId, userId],
			);
		} else if (role === "Mentor") {
			await pool.query(
				`UPDATE mentor_chat_messages SET read_at_mentor = COALESCE(read_at_mentor, CURRENT_TIMESTAMP)
         WHERE mentor_conversation_id = $1 AND sender_user_id <> $2 AND read_at_mentor IS NULL`,
				[convId, userId],
			);
		}

		const r = await pool.query(
			`SELECT mentor_chat_message_id, mentor_conversation_id, sender_user_id, message_type, text_body,
              file_name, file_mime, file_size_bytes,
              (file_data IS NOT NULL) AS has_file,
              created_at
       FROM mentor_chat_messages
       WHERE mentor_conversation_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
			[convId, limit, offset],
		);
		return res.json({ messages: [...r.rows].reverse() });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.sendTextMessage = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const convId = Number(req.params.id);
		if (!Number.isInteger(convId) || convId <= 0) {
			return res.status(400).json({ error: "Invalid conversation id" });
		}
		const conv = await loadMentorConversation(convId);
		if (!conv) return res.status(404).json({ error: "Conversation not found" });
		if (!isParticipant(conv, userId))
			return res.status(403).json({ error: "Forbidden" });
		if (!(await hasAcceptedMentorshipPair(conv.startup_id, conv.mentor_id))) {
			return res
				.status(403)
				.json({
					error: "This mentor chat is available only for accepted mentorships",
				});
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
			`INSERT INTO mentor_chat_messages (mentor_conversation_id, sender_user_id, message_type, text_body)
       VALUES ($1,$2,'text',$3)
       RETURNING mentor_chat_message_id, mentor_conversation_id, sender_user_id, message_type, text_body, created_at`,
			[convId, userId, text.trim()],
		);
		await pool.query(
			"UPDATE mentor_chat_conversations SET last_message_at = CURRENT_TIMESTAMP WHERE mentor_conversation_id = $1",
			[convId],
		);

		const peerUserId = isStartupUser(conv, userId)
			? conv.mentor_user_id
			: conv.startup_user_id;
		await pool.query(
			`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
       VALUES ($1, 'mentor_chat', 'New mentor chat message', $2, 'mentor_chat_conversations', $3)`,
			[
				peerUserId,
				text.trim().slice(0, 200) || "You have a new message",
				convId,
			],
		);

		const outboundMessage = {
			...ins.rows[0],
			conversation_id: convId,
			channel: "mentor",
		};
		emitToRoom("mentor", convId, "receive_message", outboundMessage);
		emitToUser(peerUserId, "chat_notification", {
			channel: "mentor",
			conversationId: convId,
			kind: "received",
			text: text.trim().slice(0, 200),
			senderUserId: userId,
			receivedAt: new Date().toISOString(),
		});
		emitToUser(userId, "chat_notification", {
			channel: "mentor",
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

exports.uploadMentorChatFile = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const convId = Number(req.params.id);
		if (!Number.isInteger(convId) || convId <= 0) {
			return res.status(400).json({ error: "Invalid conversation id" });
		}
		const conv = await loadMentorConversation(convId);
		if (!conv) return res.status(404).json({ error: "Conversation not found" });
		if (!isParticipant(conv, userId))
			return res.status(403).json({ error: "Forbidden" });
		if (!(await hasAcceptedMentorshipPair(conv.startup_id, conv.mentor_id))) {
			return res
				.status(403)
				.json({
					error: "This mentor chat is available only for accepted mentorships",
				});
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
			`INSERT INTO mentor_chat_messages (mentor_conversation_id, sender_user_id, message_type, text_body, file_name, file_mime, file_size_bytes, file_data)
       VALUES ($1,$2,'file',$3,$4,$5,$6,$7)
       RETURNING mentor_chat_message_id, mentor_conversation_id, sender_user_id, message_type, text_body, file_name, file_mime, file_size_bytes, created_at`,
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
			"UPDATE mentor_chat_conversations SET last_message_at = CURRENT_TIMESTAMP WHERE mentor_conversation_id = $1",
			[convId],
		);

		const peerUserId = isStartupUser(conv, userId)
			? conv.mentor_user_id
			: conv.startup_user_id;
		await pool.query(
			`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
       VALUES ($1, 'mentor_chat', 'New file in mentor chat', $2, 'mentor_chat_conversations', $3)`,
			[peerUserId, file.originalname || "Attachment", convId],
		);

		const outboundMessage = {
			...ins.rows[0],
			conversation_id: convId,
			channel: "mentor",
		};
		emitToRoom("mentor", convId, "receive_message", outboundMessage);
		emitToUser(peerUserId, "chat_notification", {
			channel: "mentor",
			conversationId: convId,
			kind: "received",
			text: file.originalname || "Attachment",
			senderUserId: userId,
			receivedAt: new Date().toISOString(),
		});
		emitToUser(userId, "chat_notification", {
			channel: "mentor",
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

exports.getMentorChatNotifications = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const role = req.user.role;

		if (role !== "Startup" && role !== "Mentor") {
			return res.status(403).json({ error: "Only Startup or Mentor" });
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
					unread_mentor_chat_notifications: 0,
				});
			}
			const r = await pool.query(
				`SELECT c.mentor_conversation_id,
              (SELECT COUNT(*)::int FROM mentor_chat_messages cm
               WHERE cm.mentor_conversation_id = c.mentor_conversation_id AND cm.sender_user_id <> $2 AND cm.read_at_startup IS NULL) AS unread
       FROM mentor_chat_conversations c WHERE c.startup_id = $1`,
				[s.startup_id, userId],
			);
			for (const row of r.rows) {
				unreadTotal += row.unread || 0;
				if (row.unread > 0) {
					conversationsWithUnread.push({
						mentor_conversation_id: row.mentor_conversation_id,
						unread: row.unread,
					});
				}
			}
		} else {
			const ment = await getMentorByUserId(userId);
			if (!ment) {
				return res.json({
					unread_chat_total: 0,
					conversations_with_unread: [],
					video_alerts: [],
					unread_mentor_chat_notifications: 0,
				});
			}
			const r = await pool.query(
				`SELECT c.mentor_conversation_id,
              (SELECT COUNT(*)::int FROM mentor_chat_messages cm
               WHERE cm.mentor_conversation_id = c.mentor_conversation_id AND cm.sender_user_id <> $2 AND cm.read_at_mentor IS NULL) AS unread
       FROM mentor_chat_conversations c WHERE c.mentor_id = $1`,
				[ment.mentor_id, userId],
			);
			for (const row of r.rows) {
				unreadTotal += row.unread || 0;
				if (row.unread > 0) {
					conversationsWithUnread.push({
						mentor_conversation_id: row.mentor_conversation_id,
						unread: row.unread,
					});
				}
			}
		}

		const videoR = await pool.query(
			`SELECT v.mentor_video_call_id, v.mentor_conversation_id, v.room_id, v.status, v.started_by_user_id,
              v.screen_share_user_id, v.participant_user_ids, v.created_at, v.ended_at
       FROM mentor_chat_video_calls v
       INNER JOIN mentor_chat_conversations c ON c.mentor_conversation_id = v.mentor_conversation_id
       INNER JOIN startups s ON s.startup_id = c.startup_id
       INNER JOIN mentors m ON m.mentor_id = c.mentor_id
       WHERE (s.user_id = $1 OR m.user_id = $1)
         AND v.status IN ('ringing', 'active')
       ORDER BY v.created_at DESC
       LIMIT 20`,
			[userId],
		);

		const appNotif = await pool.query(
			`SELECT COUNT(*)::int AS c FROM notifications
       WHERE user_id = $1 AND is_read = FALSE
         AND notification_type IN ('mentor_chat', 'mentor_video')`,
			[userId],
		);

		return res.json({
			unread_chat_total: unreadTotal,
			conversations_with_unread: conversationsWithUnread,
			video_alerts: videoR.rows,
			unread_mentor_chat_notifications: appNotif.rows[0]?.c ?? 0,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

async function endStaleMentorVideoCalls(client, mentorConversationId) {
	const ended = await client.query(
		`UPDATE mentor_chat_video_calls SET status = 'ended', ended_at = CURRENT_TIMESTAMP
     WHERE mentor_conversation_id = $1 AND status IN ('ringing', 'active')
     RETURNING mentor_video_call_id`,
		[mentorConversationId],
	);
	const ids = ended.rows.map((row) => row.mentor_video_call_id);
	if (ids.length) {
		await client.query(
			`UPDATE mentor_chat_video_session_participants SET left_at = CURRENT_TIMESTAMP
       WHERE mentor_video_call_id = ANY($1::int[]) AND left_at IS NULL`,
			[ids],
		);
	}
}

async function ensureMentorVideoParticipantJoined(
	client,
	mentorVideoCallId,
	userId,
) {
	await client.query(
		`INSERT INTO mentor_chat_video_session_participants (mentor_video_call_id, user_id)
     SELECT $1, $2
     WHERE NOT EXISTS (
       SELECT 1 FROM mentor_chat_video_session_participants p
       WHERE p.mentor_video_call_id = $1 AND p.user_id = $2 AND p.left_at IS NULL
     )`,
		[mentorVideoCallId, userId],
	);
}

async function closeMentorParticipantSessionsForCall(
	client,
	mentorVideoCallId,
) {
	await client.query(
		`UPDATE mentor_chat_video_session_participants SET left_at = CURRENT_TIMESTAMP
     WHERE mentor_video_call_id = $1 AND left_at IS NULL`,
		[mentorVideoCallId],
	);
}

exports.videoStart = async (req, res) => {
	const client = await pool.connect();
	try {
		const userId = req.user.user_id;
		const convId = Number(req.params.id);
		if (!Number.isInteger(convId) || convId <= 0) {
			return res.status(400).json({ error: "Invalid conversation id" });
		}
		const conv = await loadMentorConversation(convId);
		if (!conv) return res.status(404).json({ error: "Conversation not found" });
		if (!isParticipant(conv, userId))
			return res.status(403).json({ error: "Forbidden" });
		if (!(await hasAcceptedMentorshipPair(conv.startup_id, conv.mentor_id))) {
			return res
				.status(403)
				.json({ error: "Video calls require an accepted mentorship" });
		}

		await client.query("BEGIN");
		await endStaleMentorVideoCalls(client, convId);
		const roomId = crypto.randomUUID();
		const ins = await client.query(
			`INSERT INTO mentor_chat_video_calls (mentor_conversation_id, room_id, status, started_by_user_id, participant_user_ids)
       VALUES ($1,$2,'ringing',$3,$4)
       RETURNING *`,
			[convId, roomId, userId, [userId]],
		);
		const newCallId = ins.rows[0].mentor_video_call_id;
		await client.query(
			`INSERT INTO mentor_chat_video_session_participants (mentor_video_call_id, user_id) VALUES ($1, $2)`,
			[newCallId, userId],
		);
		await client.query("COMMIT");

		const peerUserId = isStartupUser(conv, userId)
			? conv.mentor_user_id
			: conv.startup_user_id;
		await pool.query(
			`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
       VALUES ($1, 'mentor_video', 'Incoming mentor video call', $2, 'mentor_chat_conversations', $3)`,
			[peerUserId, `Room ${roomId}`, convId],
		);

		const startedCall = { ...ins.rows[0], join_url: videoJoinUrl(roomId) };
		emitToRoom("mentor", convId, "call_signal", {
			channel: "mentor",
			conversationId: convId,
			event: "ringing",
			video_call: startedCall,
		});
		emitToUser(peerUserId, "call_signal", {
			channel: "mentor",
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

exports.videoJoin = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const convId = Number(req.params.id);
		if (!Number.isInteger(convId) || convId <= 0) {
			return res.status(400).json({ error: "Invalid conversation id" });
		}
		const conv = await loadMentorConversation(convId);
		if (!conv) return res.status(404).json({ error: "Conversation not found" });
		if (!isParticipant(conv, userId))
			return res.status(403).json({ error: "Forbidden" });
		if (!(await hasAcceptedMentorshipPair(conv.startup_id, conv.mentor_id))) {
			return res
				.status(403)
				.json({ error: "Video calls require an accepted mentorship" });
		}

		const r = await pool.query(
			`SELECT * FROM mentor_chat_video_calls
       WHERE mentor_conversation_id = $1 AND status IN ('ringing', 'active')
       ORDER BY created_at DESC LIMIT 1`,
			[convId],
		);
		if (!r.rowCount) {
			return res
				.status(404)
				.json({ error: "No active or ringing call for this conversation" });
		}

		const call = r.rows[0];
		let participants = Array.isArray(call.participant_user_ids)
			? [...call.participant_user_ids]
			: [];
		const uid = Number(userId);
		if (!participants.some((p) => Number(p) === uid)) participants.push(uid);

		const upd = await pool.query(
			`UPDATE mentor_chat_video_calls
       SET status = 'active', participant_user_ids = $2
       WHERE mentor_video_call_id = $1
       RETURNING *`,
			[call.mentor_video_call_id, participants],
		);

		await ensureMentorVideoParticipantJoined(
			pool,
			call.mentor_video_call_id,
			userId,
		);

		const joinedCall = {
			...upd.rows[0],
			join_url: videoJoinUrl(upd.rows[0].room_id),
		};
		emitToRoom("mentor", convId, "call_signal", {
			channel: "mentor",
			conversationId: convId,
			event: "active",
			video_call: joinedCall,
		});
		emitToUser(conv.startup_user_id, "call_signal", {
			channel: "mentor",
			conversationId: convId,
			event: "active",
			video_call: joinedCall,
		});
		emitToUser(conv.mentor_user_id, "call_signal", {
			channel: "mentor",
			conversationId: convId,
			event: "active",
			video_call: joinedCall,
		});

		return res.json({ video_call: joinedCall });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.videoEnd = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const convId = Number(req.params.id);
		if (!Number.isInteger(convId) || convId <= 0) {
			return res.status(400).json({ error: "Invalid conversation id" });
		}
		const conv = await loadMentorConversation(convId);
		if (!conv) return res.status(404).json({ error: "Conversation not found" });
		if (!isParticipant(conv, userId))
			return res.status(403).json({ error: "Forbidden" });
		if (!(await hasAcceptedMentorshipPair(conv.startup_id, conv.mentor_id))) {
			return res
				.status(403)
				.json({ error: "Video calls require an accepted mentorship" });
		}

		const r = await pool.query(
			`SELECT * FROM mentor_chat_video_calls
       WHERE mentor_conversation_id = $1 AND status IN ('ringing', 'active')
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
			`UPDATE mentor_chat_video_calls
       SET status = $2, ended_at = CURRENT_TIMESTAMP, screen_share_user_id = NULL
       WHERE mentor_video_call_id = $1
       RETURNING *`,
			[call.mentor_video_call_id, status],
		);

		await closeMentorParticipantSessionsForCall(
			pool,
			call.mentor_video_call_id,
		);

		const endedCall = {
			...upd.rows[0],
			join_url: videoJoinUrl(upd.rows[0].room_id),
		};
		emitToRoom("mentor", convId, "call_signal", {
			channel: "mentor",
			conversationId: convId,
			event: "ended",
			video_call: endedCall,
		});
		emitToUser(conv.startup_user_id, "call_signal", {
			channel: "mentor",
			conversationId: convId,
			event: "ended",
			video_call: endedCall,
		});
		emitToUser(conv.mentor_user_id, "call_signal", {
			channel: "mentor",
			conversationId: convId,
			event: "ended",
			video_call: endedCall,
		});

		return res.json({ video_call: endedCall });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.videoStatus = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const convId = Number(req.params.id);
		if (!Number.isInteger(convId) || convId <= 0) {
			return res.status(400).json({ error: "Invalid conversation id" });
		}
		const conv = await loadMentorConversation(convId);
		if (!conv) return res.status(404).json({ error: "Conversation not found" });
		if (!isParticipant(conv, userId))
			return res.status(403).json({ error: "Forbidden" });
		if (!(await hasAcceptedMentorshipPair(conv.startup_id, conv.mentor_id))) {
			return res
				.status(403)
				.json({ error: "Video calls require an accepted mentorship" });
		}

		const r = await pool.query(
			`SELECT * FROM mentor_chat_video_calls
       WHERE mentor_conversation_id = $1
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
       FROM mentor_chat_video_session_participants
       WHERE mentor_video_call_id = $1
       ORDER BY joined_at ASC`,
			[vc.mentor_video_call_id],
		);

		return res.json({
			status: vc.status,
			video_call: {
				mentor_video_call_id: vc.mentor_video_call_id,
				mentor_conversation_id: vc.mentor_conversation_id,
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

exports.videoScreenShare = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const convId = Number(req.params.id);
		if (!Number.isInteger(convId) || convId <= 0) {
			return res.status(400).json({ error: "Invalid conversation id" });
		}
		const conv = await loadMentorConversation(convId);
		if (!conv) return res.status(404).json({ error: "Conversation not found" });
		if (!isParticipant(conv, userId))
			return res.status(403).json({ error: "Forbidden" });

		const action = String((req.body || {}).action || "").toLowerCase();
		if (action !== "start" && action !== "stop") {
			return res
				.status(400)
				.json({ error: "action must be 'start' or 'stop'" });
		}

		const r = await pool.query(
			`SELECT * FROM mentor_chat_video_calls
       WHERE mentor_conversation_id = $1 AND status = 'active'
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
			`UPDATE mentor_chat_video_calls SET screen_share_user_id = $2 WHERE mentor_video_call_id = $1 RETURNING *`,
			[call.mentor_video_call_id, screenUid],
		);

		emitToRoom("mentor", convId, "call_signal", {
			channel: "mentor",
			conversationId: convId,
			event: "screen-share",
			video_call: upd.rows[0],
		});
		emitToUser(conv.startup_user_id, "call_signal", {
			channel: "mentor",
			conversationId: convId,
			event: "screen-share",
			video_call: upd.rows[0],
		});
		emitToUser(conv.mentor_user_id, "call_signal", {
			channel: "mentor",
			conversationId: convId,
			event: "screen-share",
			video_call: upd.rows[0],
		});

		return res.json({ video_call: upd.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.downloadMentorChatFile = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const convId = Number(req.params.id);
		const msgId = Number(req.params.messageId);
		if (!Number.isInteger(convId) || !Number.isInteger(msgId)) {
			return res.status(400).json({ error: "Invalid id" });
		}
		const conv = await loadMentorConversation(convId);
		if (!conv) return res.status(404).json({ error: "Conversation not found" });
		if (!isParticipant(conv, userId))
			return res.status(403).json({ error: "Forbidden" });

		const r = await pool.query(
			`SELECT file_name, file_mime, file_data FROM mentor_chat_messages
       WHERE mentor_chat_message_id = $1 AND mentor_conversation_id = $2 AND message_type = 'file'`,
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
