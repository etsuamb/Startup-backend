const pool = require("../config/db");

// GET /api/notifications/settings
// Get notification settings for the current user
exports.getNotificationSettings = async (req, res) => {
  const userId = req.user.user_id;
  try {
    // Get user's notification preferences from user metadata or a separate table
    // For now, we'll use a simple approach with user settings
    const result = await pool.query(
      `SELECT 
        COALESCE((metadata->>'email_notifications')::boolean, true) AS email_notifications,
        COALESCE((metadata->>'push_notifications')::boolean, true) AS push_notifications,
        COALESCE((metadata->>'rating_notifications')::boolean, true) AS rating_notifications,
        COALESCE((metadata->>'mentorship_notifications')::boolean, true) AS mentorship_notifications,
        COALESCE((metadata->>'investment_notifications')::boolean, true) AS investment_notifications,
        COALESCE((metadata->>'message_notifications')::boolean, true) AS message_notifications
       FROM users 
       WHERE user_id = $1`,
      [userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const settings = result.rows[0];
    return res.json({
      settings: {
        email_notifications: settings.email_notifications,
        push_notifications: settings.push_notifications,
        rating_notifications: settings.rating_notifications,
        mentorship_notifications: settings.mentorship_notifications,
        investment_notifications: settings.investment_notifications,
        message_notifications: settings.message_notifications,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// PUT /api/notifications/settings
// Update notification settings for the current user
exports.updateNotificationSettings = async (req, res) => {
  const userId = req.user.user_id;
  const {
    email_notifications,
    push_notifications,
    rating_notifications,
    mentorship_notifications,
    investment_notifications,
    message_notifications,
  } = req.body || {};

  try {
    // Build metadata update
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (email_notifications !== undefined) {
      updates.push(`metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{email_notifications}', $${paramIndex}::jsonb)`);
      params.push(JSON.stringify(email_notifications));
      paramIndex++;
    }
    if (push_notifications !== undefined) {
      updates.push(`metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{push_notifications}', $${paramIndex}::jsonb)`);
      params.push(JSON.stringify(push_notifications));
      paramIndex++;
    }
    if (rating_notifications !== undefined) {
      updates.push(`metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{rating_notifications}', $${paramIndex}::jsonb)`);
      params.push(JSON.stringify(rating_notifications));
      paramIndex++;
    }
    if (mentorship_notifications !== undefined) {
      updates.push(`metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{mentorship_notifications}', $${paramIndex}::jsonb)`);
      params.push(JSON.stringify(mentorship_notifications));
      paramIndex++;
    }
    if (investment_notifications !== undefined) {
      updates.push(`metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{investment_notifications}', $${paramIndex}::jsonb)`);
      params.push(JSON.stringify(investment_notifications));
      paramIndex++;
    }
    if (message_notifications !== undefined) {
      updates.push(`metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{message_notifications}', $${paramIndex}::jsonb)`);
      params.push(JSON.stringify(message_notifications));
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No settings provided to update" });
    }

    // Initialize metadata if null and update
    const updateQuery = `
      UPDATE users 
      SET metadata = COALESCE(metadata, '{}'::jsonb),
          ${updates.join(", ")}
      WHERE user_id = $${paramIndex}
      RETURNING user_id`;
    
    params.push(userId);

    const result = await pool.query(updateQuery, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ message: "Notification settings updated successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/notifications
exports.listNotifications = async (req, res) => {
	const userId = req.user.user_id;
	const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
	const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
	try {
		const [notifications, unread] = await Promise.all([
			pool.query(
			`SELECT notification_id, notification_type, title, message, is_read, reference_type, reference_id, created_at
       FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
			[userId, limit, offset],
			),
			pool.query(
				"SELECT COUNT(*)::int AS unread FROM notifications WHERE user_id = $1 AND is_read = false",
				[userId],
			),
		]);
		return res.json({
			notifications: notifications.rows,
			unread: unread.rows[0].unread,
			limit,
			offset,
		});
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

// PATCH /api/notifications/:id
exports.updateNotification = async (req, res) => {
	const userId = req.user.user_id;
	const { id } = req.params;
	const { is_read } = req.body || {};
	try {
		const readValue =
			is_read === undefined
				? true
				: typeof is_read === "boolean"
					? is_read
					: ["true", "1", "yes", "on"].includes(String(is_read).trim().toLowerCase());
		const r = await pool.query(
			"UPDATE notifications SET is_read = $1 WHERE notification_id = $2 AND user_id = $3 RETURNING notification_id, is_read, title, message, reference_type, reference_id",
			[readValue, id, userId],
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
