const router = require("express").Router();
const {
	authenticate,
	requireApproval,
} = require("../middleware/authMiddleware");
const conversationController = require("../controllers/conversationController");

router.post(
	"/",
	authenticate,
	requireApproval,
	conversationController.createOrGetConversation,
);
router.get(
	"/:userId",
	authenticate,
	requireApproval,
	conversationController.listMyConversations,
);
router.get(
	"/:userId/with/:otherUserId",
	authenticate,
	requireApproval,
	conversationController.getConversationByParticipants,
);

module.exports = router;
