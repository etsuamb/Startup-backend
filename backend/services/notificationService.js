const pool = require("../config/db");

let socketUtils = null;

function getSocketUtils() {
	if (socketUtils) return socketUtils;
	try {
		socketUtils = require("../utils/socket");
	} catch (err) {
		socketUtils = null;
	}
	return socketUtils;
}

async function createNotification({
	userId,
	notificationType,
	title,
	message,
	referenceType = null,
	referenceId = null,
	metadata = null,
}) {
	const result = await pool.query(
		`INSERT INTO notifications (
			user_id,
			notification_type,
			title,
			message,
			reference_type,
			reference_id
		)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING *`,
		[userId, notificationType, title, message, referenceType, referenceId],
	);
	if (metadata && result.rows[0]) {
		result.rows[0].metadata = metadata;
	}

	const sockets = getSocketUtils();
	const io = sockets && sockets.getIO ? sockets.getIO() : null;
	if (io && result.rows[0]) {
		io.to(`user:${Number(userId)}`).emit("notification:new", result.rows[0]);
	}
	return result.rows[0];
}

module.exports = {
	createNotification,
};
