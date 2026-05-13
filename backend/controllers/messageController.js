const pool = require("../config/db");

exports.sendMessage = async (req, res) => {
	try {
		const senderId = req.user.user_id;
		const { receiver_user_id, subject, body } = req.body || {};

		if (!receiver_user_id || !body || typeof body !== "string" || body.trim() === "") {
			return res.status(400).json({
				error: "receiver_user_id and body are required",
			});
		}

		const receiverId = Number(receiver_user_id);
		if (!Number.isInteger(receiverId) || receiverId <= 0) {
			return res.status(400).json({ error: "receiver_user_id must be a valid integer" });
		}

		if (receiverId === senderId) {
			return res.status(400).json({ error: "Sender and receiver cannot be the same user" });
		}

		const userCheck = await pool.query(
			"SELECT user_id FROM users WHERE user_id = $1",
			[receiverId],
		);
		if (userCheck.rowCount === 0) {
			return res.status(404).json({ error: "Receiver user not found" });
		}

		const result = await pool.query(
			`INSERT INTO messages (sender_user_id, receiver_user_id, subject, body)
         VALUES ($1,$2,$3,$4)
         RETURNING *`,
			[senderId, receiverId, subject || null, body.trim()],
		);

		res.status(201).json({ message: "Message sent", message_record: result.rows[0] });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.listMessages = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { partner_id, limit = 50, offset = 0 } = req.query;

		let query = `SELECT * FROM messages WHERE sender_user_id = $1 OR receiver_user_id = $1`;
		const params = [userId];

		if (partner_id) {
			const partnerId = Number(partner_id);
			if (!Number.isInteger(partnerId) || partnerId <= 0) {
				return res.status(400).json({ error: "partner_id must be a valid integer" });
			}
			query += " AND (sender_user_id = $2 OR receiver_user_id = $2)";
			params.push(partnerId);
		}

		query += " ORDER BY created_at DESC LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2);
		params.push(Number(limit));
		params.push(Number(offset));

		const result = await pool.query(query, params);

		res.json({ messages: result.rows });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};
