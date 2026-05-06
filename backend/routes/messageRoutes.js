const router = require("express").Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const {
	authenticate,
	requireApproval,
} = require("../middleware/authMiddleware");
const messageController = require("../controllers/messageController");

router.post(
	"/",
	authenticate,
	requireApproval,
	upload.single("file"),
	messageController.sendMessage,
);
router.get(
	"/unread",
	authenticate,
	requireApproval,
	messageController.getUnreadCount,
);
router.put(
	"/:messageId",
	authenticate,
	requireApproval,
	upload.single("file"),
	messageController.editMessage,
);
router.delete(
	"/:messageId",
	authenticate,
	requireApproval,
	messageController.deleteMessage,
);
router.get(
	"/:conversationId",
	authenticate,
	requireApproval,
	messageController.getMessages,
);
router.put(
	"/seen/:conversationId",
	authenticate,
	requireApproval,
	messageController.markSeen,
);

module.exports = router;
