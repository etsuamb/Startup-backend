const bcrypt = require("bcrypt");
const { io } = require("socket.io-client");
const pool = require("../config/db");

const baseUrl = process.env.TEST_API_URL || "http://localhost:5001";
const startupEmail = "etsubegir@gmail.com";
const mentorEmail = "rich@gmail.com";
const startupPassword = "Startup1234";
const mentorPassword = "Mentor1234";

async function login(email, password) {
	const res = await fetch(`${baseUrl}/api/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});
	const body = await res.json();
	if (!res.ok) {
		throw new Error(
			`Login failed for ${email}: ${res.status} ${JSON.stringify(body)}`,
		);
	}
	return body.token;
}

function waitForEvent(socket, eventName) {
	return new Promise((resolve) => {
		socket.once(eventName, resolve);
	});
}

async function main() {
	await pool.query(
		"UPDATE users SET password_hash = $1, email_verified = true, is_approved = true, is_active = true WHERE user_id = $2",
		[await bcrypt.hash(startupPassword, 10), 5],
	);
	await pool.query(
		"UPDATE users SET password_hash = $1, email_verified = true, is_approved = true, is_active = true WHERE user_id = $2",
		[await bcrypt.hash(mentorPassword, 10), 3],
	);
	await pool.query(
		"DELETE FROM mentorship_requests WHERE startup_id = $1 AND mentor_id = $2",
		[2, 1],
	);
	await pool.query(
		`INSERT INTO mentorship_requests (startup_id, mentor_id, subject, message, status)
		 VALUES ($1, $2, $3, $4, 'accepted')`,
		[
			2,
			1,
			"Chapter 6 mentor chat smoke test",
			"Test mentorship pair for Socket.IO chat",
		],
	);

	const startupToken = await login(startupEmail, startupPassword);
	const mentorToken = await login(mentorEmail, mentorPassword);

	const createRes = await fetch(
		`${baseUrl}/api/startups/mentor-chat/conversations`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${startupToken}`,
			},
			body: JSON.stringify({ mentor_id: 1 }),
		},
	);
	const createBody = await createRes.json();
	if (!createRes.ok) {
		throw new Error(
			`Conversation creation failed: ${createRes.status} ${JSON.stringify(createBody)}`,
		);
	}

	const conversationId = createBody.conversation.mentor_conversation_id;
	console.log(`Conversation ready: ${conversationId}`);

	const startupSocket = io(baseUrl, {
		auth: { token: startupToken },
		transports: ["websocket"],
		forceNew: true,
	});
	const mentorSocket = io(baseUrl, {
		auth: { token: mentorToken },
		transports: ["websocket"],
		forceNew: true,
	});

	await Promise.all([
		waitForEvent(startupSocket, "connect"),
		waitForEvent(mentorSocket, "connect"),
	]);
	console.log("PASS: Both socket clients connected.");

	const joinStartup = await new Promise((resolve) => {
		startupSocket.emit(
			"join_room",
			{ channel: "mentor", conversationId },
			(resolveResult) => resolve(resolveResult),
		);
	});
	if (!joinStartup.success) {
		throw new Error(`Startup join failed: ${JSON.stringify(joinStartup)}`);
	}

	const joinMentor = await new Promise((resolve) => {
		mentorSocket.emit(
			"join_room",
			{ channel: "mentor", conversationId },
			(resolveResult) => resolve(resolveResult),
		);
	});
	if (!joinMentor.success) {
		throw new Error(`Mentor join failed: ${JSON.stringify(joinMentor)}`);
	}
	console.log("PASS: Both socket clients joined the same room.");

	const receivedMessage = waitForEvent(mentorSocket, "receive_message");
	const sendResult = await new Promise((resolve) => {
		startupSocket.emit(
			"send_message",
			{
				channel: "mentor",
				conversationId,
				text: "Hello from the startup side",
			},
			(resolveResult) => resolve(resolveResult),
		);
	});
	if (!sendResult.success) {
		throw new Error(`Send message failed: ${JSON.stringify(sendResult)}`);
	}

	const deliveredMessage = await receivedMessage;
	console.log("RECEIVED_MESSAGE", JSON.stringify(deliveredMessage));
	console.log("PASS: Real-time mentor chat message delivered successfully.");

	startupSocket.close();
	mentorSocket.close();
	await pool.end();
}

main().catch(async (error) => {
	console.error("FAIL:", error.message);
	try {
		await pool.end();
	} catch {
		// ignore
	}
	process.exit(1);
});
