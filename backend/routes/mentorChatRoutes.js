const express = require("express");
const multer = require("multer");
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 25 * 1024 * 1024 },
});

const mentorChatController = require("../controllers/mentorChatController");

/**
 * Mentor–startup chat + video (paths: /conversations, /notifications, …).
 * @param {import("express").RequestHandler[]} accessMiddleware
 */
function buildMentorChatRoutes(accessMiddleware) {
	const router = express.Router();
	const chain = accessMiddleware;

	router.post("/conversations", ...chain, mentorChatController.createOrGetConversation);
	router.get("/conversations", ...chain, mentorChatController.listConversations);
	router.get("/conversations/:id/messages", ...chain, mentorChatController.getMessages);
	router.post("/conversations/:id/messages", ...chain, mentorChatController.sendTextMessage);
	router.post(
		"/conversations/:id/files",
		...chain,
		upload.single("file"),
		mentorChatController.uploadMentorChatFile,
	);
	router.get("/notifications", ...chain, mentorChatController.getMentorChatNotifications);

	router.post("/conversations/:id/video/start", ...chain, mentorChatController.videoStart);
	router.post("/conversations/:id/video/join", ...chain, mentorChatController.videoJoin);
	router.post("/conversations/:id/video/end", ...chain, mentorChatController.videoEnd);
	router.get("/conversations/:id/video/status", ...chain, mentorChatController.videoStatus);
	router.post(
		"/conversations/:id/video/screen-share",
		...chain,
		mentorChatController.videoScreenShare,
	);

	router.get(
		"/conversations/:id/files/:messageId",
		...chain,
		mentorChatController.downloadMentorChatFile,
	);

	return router;
}

module.exports = { buildMentorChatRoutes };
