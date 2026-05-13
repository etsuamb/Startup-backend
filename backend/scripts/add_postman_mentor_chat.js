/**
 * Inserts "Mentor chat & video" folder before top-level "Mentor" in Postman collection.
 * Run from backend/: node scripts/add_postman_mentor_chat.js
 */
const fs = require("fs");
const path = require("path");

const collectionPath = path.join(
	__dirname,
	"..",
	"Connect Startup Backend API.postman_collection.json",
);

function authHeader() {
	return [{ key: "Authorization", value: "Bearer {{token}}" }];
}

function urlObj(segments, queryStr) {
	const raw =
		"http://localhost:5000/" + segments.join("/") + (queryStr ? "?" + queryStr : "");
	const o = {
		raw,
		host: ["http://localhost:5000"],
		path: segments,
	};
	if (queryStr) {
		o.query = queryStr.split("&").map((p) => {
			const i = p.indexOf("=");
			const k = i === -1 ? p : p.slice(0, i);
			const v = i === -1 ? "" : p.slice(i + 1);
			return { key: k, value: v };
		});
	}
	return o;
}

function jsonReq(name, method, segments, rawBody, description) {
	return {
		name,
		request: {
			method,
			header: [...authHeader(), { key: "Content-Type", value: "application/json" }],
			body: { mode: "raw", raw: rawBody },
			url: urlObj(segments),
			...(description ? { description } : {}),
		},
	};
}

function getReq(name, segments, query, description) {
	return {
		name,
		request: {
			method: "GET",
			header: authHeader(),
			url: urlObj(segments, query),
			...(description ? { description } : {}),
		},
	};
}

function postReq(name, segments, description) {
	return {
		name,
		request: {
			method: "POST",
			header: authHeader(),
			url: urlObj(segments),
			...(description ? { description } : {}),
		},
	};
}

function uploadReq(name, segments) {
	return {
		name,
		request: {
			method: "POST",
			header: authHeader(),
			body: {
				mode: "formdata",
				formdata: [
					{ key: "file", type: "file", src: [], description: "Doc / deck" },
					{ key: "caption", value: "Optional", type: "text" },
				],
			},
			url: urlObj(segments),
			description: "multipart field name: file",
		},
	};
}

function buildSubfolder(title, description, apiBase, createMode) {
	const prefix = [...apiBase, "conversations"];
	const conv = [...prefix, "{{mentorChatConversationId}}"];
	const createReq =
		createMode === "startup"
			? jsonReq(
					"Create or get conversation",
					"POST",
					prefix,
					'{\n  "mentor_id": {{mentorChatMentorId}}\n}',
					"Requires mentorship_requests for this startup + mentor.",
				)
			: jsonReq(
					"Create or get conversation",
					"POST",
					prefix,
					'{\n  "startup_id": {{mentorChatStartupId}}\n}',
					"Requires mentorship_requests for this startup + mentor.",
				);

	return {
		name: title,
		description,
		item: [
			createReq,
			getReq("List conversations", prefix),
			getReq(
				"Get messages",
				[...conv, "messages"],
				"limit=50&offset=0",
				"Marks peer messages read when opened.",
			),
			jsonReq(
				"Send text message",
				"POST",
				[...conv, "messages"],
				'{\n  "body": "Hello"\n}',
				"Field text also accepted.",
			),
			uploadReq("Upload file", [...conv, "files"]),
			getReq(
				"Mentor-chat notifications",
				[...apiBase, "notifications"],
				null,
				"unread_chat_total, video_alerts, unread_mentor_chat_notifications.",
			),
			postReq("Video — start", [...conv, "video", "start"]),
			postReq("Video — join", [...conv, "video", "join"]),
			postReq("Video — end", [...conv, "video", "end"]),
			getReq("Video — status", [...conv, "video", "status"], null, "Includes session_participants."),
			jsonReq(
				"Video — screen share",
				"POST",
				[...conv, "video", "screen-share"],
				'{\n  "action": "start"\n}',
				'Use action "stop" to end sharing.',
			),
			getReq(
				"Download file",
				[...conv, "files", "{{mentorChatMessageId}}"],
				null,
				"mentor_chat_message_id from upload response.",
			),
		],
	};
}

const folder = {
	name: "Mentor chat & video",
	description:
		"Startup–mentor messaging + video (DB: mentor_chat_*). Requires a mentorship_requests row for the pair.",
	item: [
		buildSubfolder(
			"Startup JWT — /api/startups/mentor-chat",
			"Startup-only routes under /api/startups/mentor-chat.",
			["api", "startups", "mentor-chat"],
			"startup",
		),
		buildSubfolder(
			"Mentor JWT — /api/mentors/mentor-chat",
			"Mentor-only routes under /api/mentors/mentor-chat.",
			["api", "mentors", "mentor-chat"],
			"mentor",
		),
	],
};

const raw = fs.readFileSync(collectionPath, "utf8");
const col = JSON.parse(raw);

const mentorIdx = col.item.findIndex((i) => i.name === "Mentor");
if (mentorIdx === -1) throw new Error("Mentor folder not found");
if (col.item.some((i) => i.name === "Mentor chat & video")) {
	console.error("Already added");
	process.exit(1);
}

const needVars = [
	{ key: "mentorChatConversationId", value: "1" },
	{ key: "mentorChatMentorId", value: "1" },
	{ key: "mentorChatStartupId", value: "1" },
	{ key: "mentorChatMessageId", value: "1" },
];
for (const v of needVars) {
	if (!col.variable.some((x) => x.key === v.key)) col.variable.push(v);
}

col.item.splice(mentorIdx, 0, folder);
fs.writeFileSync(collectionPath, JSON.stringify(col, null, 2) + "\n", "utf8");
console.log("OK: Mentor chat & video folder inserted.");
