const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const pool = require("./config/db");
const chatModerationService = require("./services/chatModerationService");
const chatModerationActions = require("./services/chatModerationActions");
const chatAccessService = require("./services/chatAccessService");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

function roomKey(channel, conversationId) {
	return `chat_${channel}_${conversationId}`;
}

function parseConversationPayload(data) {
	const channel = data?.channel === "mentor" ? "mentor" : "investor";
	const conversationId = Number(data?.conversationId ?? data?.conversation_id);
	return { channel, conversationId };
}

function validWebRtcSignal(signal) {
	if (!signal || typeof signal !== "object") return false;
	if (!["ready", "offer", "answer", "candidate", "hangup"].includes(signal.type)) return false;
	return JSON.stringify(signal).length <= 50000;
}

module.exports = function initializeSocket(httpServer) {
	const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "*";

	const io = new Server(httpServer, {
		cors: {
			origin: corsOrigin,
			methods: ["GET", "POST"],
			credentials: true,
		},
		pingTimeout: 60000,
		pingInterval: 25000,
	});

	io.use(async (socket, next) => {
		try {
			const token =
				socket.handshake.auth?.token ||
				socket.handshake.headers?.authorization?.split(" ")[1];

			if (!token) return next(new Error("Authentication error: No token"));

			const decoded = jwt.verify(token, JWT_SECRET);
			socket.user = decoded;

			const verified = await chatAccessService.isVerifiedUser(decoded.user_id);
			if (!verified.ok) {
				return next(new Error("Only verified users can use chat"));
			}

			if (await chatAccessService.isChatSuspended(decoded.user_id)) {
				return next(new Error("Chat access suspended due to policy violations"));
			}

			next();
		} catch (err) {
			next(new Error(err.message || "Authentication error"));
		}
	});

	io.on("connection", (socket) => {
		const userId = socket.user.user_id;
		const userRole = socket.user.role;

		socket.join(`user_${userId}`);

		socket.on("join_room", async (data, callback) => {
			try {
				const { channel, conversationId } = parseConversationPayload(data);
				if (!Number.isInteger(conversationId) || conversationId <= 0) {
					if (callback) callback({ error: "Invalid conversation id" });
					return;
				}

				const access = await chatAccessService.assertChatAccess(userId, {
					channel,
					conversationId,
				});
				if (!access.allowed) {
					if (callback) callback({ error: access.message, code: access.code });
					return;
				}

				const room = roomKey(channel, conversationId);
				socket.join(room);
				socket.data.activeChannel = channel;
				socket.data.activeConversationId = conversationId;

				if (callback) {
					callback({ success: true, room, channel, conversationId });
				}
			} catch (err) {
				console.error("join_room error:", err);
				if (callback) callback({ error: "Server error" });
			}
		});

		socket.on("leave_room", (data) => {
			const { channel, conversationId } = parseConversationPayload(data);
			if (conversationId) socket.leave(roomKey(channel, conversationId));
		});

		socket.on("webrtc_signal", async (data, callback) => {
			try {
				const { channel, conversationId } = parseConversationPayload(data);
				if (!Number.isInteger(conversationId) || conversationId <= 0 || !validWebRtcSignal(data?.signal)) {
					if (callback) callback({ error: "Invalid WebRTC signal" });
					return;
				}

				const access = await chatAccessService.assertChatAccess(userId, {
					channel,
					conversationId,
				});
				if (!access.allowed) {
					if (callback) callback({ error: access.message, code: access.code });
					return;
				}

				const room = roomKey(channel, conversationId);
				socket.join(room);
				socket.to(room).emit("webrtc_signal", {
					channel,
					conversationId,
					senderUserId: userId,
					signal: data.signal,
				});
				if (callback) callback({ success: true });
			} catch (err) {
				console.error("webrtc_signal error:", err);
				if (callback) callback({ error: "Server error" });
			}
		});

		socket.on("typing", (data) => {
			const { channel, conversationId } = parseConversationPayload(data);
			if (!conversationId) return;
			socket.to(roomKey(channel, conversationId)).emit("user_typing", {
				channel,
				conversationId,
				userId,
				role: userRole,
			});
		});

		socket.on("stop_typing", (data) => {
			const { channel, conversationId } = parseConversationPayload(data);
			if (!conversationId) return;
			socket.to(roomKey(channel, conversationId)).emit("user_stop_typing", {
				channel,
				conversationId,
				userId,
				role: userRole,
			});
		});

		socket.on("mark_read", async (data, callback) => {
			try {
				const { channel, conversationId } = parseConversationPayload(data);
				if (!conversationId) {
					if (callback) callback({ error: "Invalid conversation id" });
					return;
				}

				const access = await chatAccessService.assertChatAccess(userId, {
					channel,
					conversationId,
				});
				if (!access.allowed) {
					if (callback) callback({ error: access.message, code: access.code });
					return;
				}

				if (channel === "investor") {
					if (userRole === "Startup") {
						await pool.query(
							`UPDATE chat_messages SET read_at_startup = CURRENT_TIMESTAMP
               WHERE conversation_id = $1 AND sender_user_id <> $2 AND read_at_startup IS NULL`,
							[conversationId, userId],
						);
					} else if (userRole === "Investor") {
						await pool.query(
							`UPDATE chat_messages SET read_at_investor = CURRENT_TIMESTAMP
               WHERE conversation_id = $1 AND sender_user_id <> $2 AND read_at_investor IS NULL`,
							[conversationId, userId],
						);
					}
				} else if (channel === "mentor") {
					if (userRole === "Startup") {
						await pool.query(
							`UPDATE mentor_chat_messages SET read_at_startup = CURRENT_TIMESTAMP
               WHERE mentor_conversation_id = $1 AND sender_user_id <> $2 AND read_at_startup IS NULL`,
							[conversationId, userId],
						);
					} else if (userRole === "Mentor") {
						await pool.query(
							`UPDATE mentor_chat_messages SET read_at_mentor = CURRENT_TIMESTAMP
               WHERE mentor_conversation_id = $1 AND sender_user_id <> $2 AND read_at_mentor IS NULL`,
							[conversationId, userId],
						);
					}
				}

				socket.to(roomKey(channel, conversationId)).emit("messages_read", {
					channel,
					conversationId,
					readBy: userId,
					role: userRole,
				});
				if (callback) callback({ success: true });
			} catch (err) {
				console.error("mark_read error:", err);
				if (callback) callback({ error: "Server error" });
			}
		});

		socket.on("send_message", async (data, callback) => {
			try {
				const { channel, conversationId } = parseConversationPayload(data);
				const text = typeof data?.text === "string" ? data.text.trim() : "";

				if (!conversationId || !text) {
					if (callback) callback({ error: "conversationId and text are required" });
					return;
				}

				const access = await chatAccessService.assertChatAccess(userId, {
					channel,
					conversationId,
				});
				if (!access.allowed) {
					if (callback) callback({ error: access.message, code: access.code });
					return;
				}

				const validation = chatModerationService.validateMessage(text);
				if (!validation.isClean) {
					const result = await chatModerationActions.recordViolation({
						senderUserId: userId,
						conversationId,
						attemptedMessage: text,
						flaggedReason: validation.reason,
						channel,
					});
					socket.emit("moderation_alert", {
						message: result.warning,
						code: result.code,
						flagged_reason: validation.reason,
					});
					if (callback) {
						callback({
							error: result.warning,
							code: result.code,
							flagged_reason: validation.reason,
						});
					}
					return;
				}

				let newMsg;
				if (channel === "investor") {
					const ins = await pool.query(
						`INSERT INTO chat_messages (conversation_id, sender_user_id, message_type, text_body)
             VALUES ($1, $2, 'text', $3)
             RETURNING chat_message_id, conversation_id, sender_user_id, message_type, text_body, created_at`,
						[conversationId, userId, text],
					);
					await pool.query(
						`UPDATE chat_conversations SET last_message_at = CURRENT_TIMESTAMP WHERE conversation_id = $1`,
						[conversationId],
					);
					newMsg = { ...ins.rows[0], channel };
				} else {
					const ins = await pool.query(
						`INSERT INTO mentor_chat_messages (mentor_conversation_id, sender_user_id, message_type, text_body)
             VALUES ($1, $2, 'text', $3)
             RETURNING mentor_chat_message_id AS chat_message_id, mentor_conversation_id AS conversation_id,
               sender_user_id, message_type, text_body, created_at`,
						[conversationId, userId, text],
					);
					await pool.query(
						`UPDATE mentor_chat_conversations SET last_message_at = CURRENT_TIMESTAMP WHERE mentor_conversation_id = $1`,
						[conversationId],
					);
					newMsg = { ...ins.rows[0], channel };
				}

				const room = roomKey(channel, conversationId);
				io.to(room).emit("receive_message", newMsg);
				if (callback) callback({ success: true, message: newMsg });
			} catch (err) {
				console.error("send_message error:", err);
				if (callback) callback({ error: "Server error" });
			}
		});

		socket.on("disconnect", () => {
			// room cleanup handled by socket.io
		});
	});

	return io;
};
