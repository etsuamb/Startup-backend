const pool = require("../config/db");

// GET /api/notifications
exports.listNotifications = async (req, res) => {
	const userId = req.user.user_id;
	const { limit = 50, offset = 0 } = req.query;
	try {
		const r = await pool.query(
			`SELECT notification_id, notification_type, title, message, is_read, reference_type, reference_id, created_at
       FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
			[userId, limit, offset],
		);
		return res.json({ notifications: r.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
	const userId = req.user.user_id;
	const { id } = req.params;
	try {
		const r = await pool.query(
			"UPDATE notifications SET is_read = true WHERE notification_id = $1 AND user_id = $2 RETURNING notification_id, is_read",
			[id, userId],
		);
		if (r.rows.length === 0)
			return res.status(404).json({ message: "Notification not found" });
		return res.json({ notification: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// GET /api/notifications/unread-count
exports.unreadCount = async (req, res) => {
	const userId = req.user.user_id;
	try {
		const r = await pool.query(
			"SELECT COUNT(*)::int AS unread FROM notifications WHERE user_id = $1 AND is_read = false",
			[userId],
		);
		return res.json({ unread: r.rows[0].unread });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// PUT /api/notifications/mark-all-read
exports.markAllRead = async (req, res) => {
	const userId = req.user.user_id;
	try {
		const r = await pool.query(
			"UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false RETURNING notification_id",
			[userId],
		);
		return res.json({ marked: r.rowCount });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};
