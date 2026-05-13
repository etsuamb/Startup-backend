const router = require("express").Router();
const { authenticate } = require("../middleware/authMiddleware");
const messageController = require("../controllers/messageController");

router.post("/", authenticate, messageController.sendMessage);
router.get("/", authenticate, messageController.listMessages);

module.exports = router;
