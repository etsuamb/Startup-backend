require("dotenv").config();
const http = require("http");
const jwt = require("jsonwebtoken");
const { io: createClient } = require("../../frontend/node_modules/socket.io-client");
const pool = require("../config/db");
const initializeSocket = require("../socket");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

function waitFor(socket, event, timeoutMs = 5000) {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), timeoutMs);
		socket.once(event, (payload) => {
			clearTimeout(timeout);
			resolve(payload);
		});
	});
}

function connect(url, user) {
	return new Promise((resolve, reject) => {
		const socket = createClient(url, {
			auth: { token: jwt.sign(user, JWT_SECRET) },
			transports: ["websocket"],
			forceNew: true,
		});
		socket.once("connect", () => resolve(socket));
		socket.once("connect_error", reject);
	});
}

function join(socket, channel, conversationId) {
	return new Promise((resolve, reject) => {
		socket.emit("join_room", { channel, conversationId }, (response) => {
			if (response?.error) reject(new Error(response.error));
			else resolve(response);
		});
	});
}

async function findConversation() {
	const investor = await pool.query(
		`SELECT c.conversation_id, s.user_id AS first_user_id, su.role AS first_role,
		        i.user_id AS second_user_id, iu.role AS second_role
		 FROM chat_conversations c
		 JOIN startups s ON s.startup_id = c.startup_id
		 JOIN users su ON su.user_id = s.user_id
		 JOIN investors i ON i.investor_id = c.investor_id
		 JOIN users iu ON iu.user_id = i.user_id
		 WHERE EXISTS (
		     SELECT 1 FROM investment_requests ir
		     WHERE ir.startup_id = c.startup_id AND ir.investor_id = c.investor_id
		       AND ir.status IN ('approved', 'accepted')
		 )
		 LIMIT 1`,
	);
	if (investor.rowCount) return { channel: "investor", ...investor.rows[0] };

	const mentor = await pool.query(
		`SELECT c.mentor_conversation_id AS conversation_id,
		        s.user_id AS first_user_id, su.role AS first_role,
		        m.user_id AS second_user_id, mu.role AS second_role
		 FROM mentor_chat_conversations c
		 JOIN startups s ON s.startup_id = c.startup_id
		 JOIN users su ON su.user_id = s.user_id
		 JOIN mentors m ON m.mentor_id = c.mentor_id
		 JOIN users mu ON mu.user_id = m.user_id
		 WHERE EXISTS (
		     SELECT 1 FROM mentorship_requests mr
		     WHERE mr.startup_id = c.startup_id AND mr.mentor_id = c.mentor_id
		       AND mr.status = 'accepted'
		 )
		 LIMIT 1`,
	);
	if (mentor.rowCount) return { channel: "mentor", ...mentor.rows[0] };
	throw new Error("An accepted chat conversation is required for the signaling smoke test");
}

async function main() {
	const conversation = await findConversation();
	const server = http.createServer();
	const io = initializeSocket(server);
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	const url = `http://127.0.0.1:${server.address().port}`;
	let first;
	let second;

	try {
		first = await connect(url, { user_id: conversation.first_user_id, role: conversation.first_role });
		second = await connect(url, { user_id: conversation.second_user_id, role: conversation.second_role });
		await join(first, conversation.channel, conversation.conversation_id);
		await join(second, conversation.channel, conversation.conversation_id);

		const received = waitFor(second, "webrtc_signal");
		first.emit("webrtc_signal", {
			channel: conversation.channel,
			conversationId: Number(conversation.conversation_id),
			signal: { type: "ready" },
		});
		const payload = await received;
		if (payload.signal?.type !== "ready") throw new Error("WebRTC signal relay payload was incorrect");

		console.log(`PASS: authenticated WebRTC signaling relay works for ${conversation.channel} conversation ${conversation.conversation_id}`);
	} finally {
		first?.disconnect();
		second?.disconnect();
		await new Promise((resolve) => io.close(resolve));
		await new Promise((resolve) => server.close(resolve));
		await pool.end();
	}
}

main().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
