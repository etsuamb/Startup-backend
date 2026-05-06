const pool = require("../config/db");

function splitFullName(fullName) {
	if (!fullName || typeof fullName !== "string") return null;
	const parts = fullName.trim().split(/\s+/).filter(Boolean);
	if (!parts.length) return null;
	if (parts.length === 1) {
		return { first_name: parts[0], last_name: parts[0] };
	}
	return {
		first_name: parts.shift(),
		last_name: parts.join(" "),
	};
}

async function getRoleProfile(userId, role) {
	if (role === "Mentor") {
		const result = await pool.query(
			"SELECT * FROM mentors WHERE user_id = $1",
			[userId],
		);
		return result.rows[0] || null;
	}

	if (role === "Startup") {
		const result = await pool.query(
			"SELECT * FROM startups WHERE user_id = $1",
			[userId],
		);
		return result.rows[0] || null;
	}

	if (role === "Investor") {
		const result = await pool.query(
			"SELECT * FROM investors WHERE user_id = $1",
			[userId],
		);
		return result.rows[0] || null;
	}

	return null;
}

exports.getMyProfile = async (req, res) => {
	try {
		const userId = req.user.user_id;

		const userRes = await pool.query(
			`SELECT
				user_id,
				first_name,
				last_name,
				email,
				role,
				phone_number,
				is_active,
				is_approved,
				approved_at,
				created_at
			 FROM users
			 WHERE user_id = $1`,
			[userId],
		);

		if (!userRes.rowCount) {
			return res.status(404).json({ error: "User not found" });
		}

		const user = userRes.rows[0];
		const roleProfile = await getRoleProfile(user.user_id, user.role);

		return res.status(200).json({
			user,
			profile: roleProfile,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.updateMyProfile = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { full_name, first_name, last_name, phone_number, email } =
			req.body || {};

		let nextFirstName = null;
		let nextLastName = null;

		if (full_name !== undefined) {
			const parsed = splitFullName(full_name);
			if (!parsed) {
				return res.status(400).json({
					error: "full_name must be a non-empty string",
				});
			}
			nextFirstName = parsed.first_name;
			nextLastName = parsed.last_name;
		} else {
			if (first_name !== undefined) {
				if (typeof first_name !== "string" || !first_name.trim()) {
					return res
						.status(400)
						.json({ error: "first_name must be a non-empty string" });
				}
				nextFirstName = first_name.trim();
			}

			if (last_name !== undefined) {
				if (typeof last_name !== "string" || !last_name.trim()) {
					return res
						.status(400)
						.json({ error: "last_name must be a non-empty string" });
				}
				nextLastName = last_name.trim();
			}
		}

		if (
			phone_number !== undefined &&
			phone_number !== null &&
			phone_number !== ""
		) {
			if (typeof phone_number !== "string" || phone_number.trim().length < 7) {
				return res.status(400).json({
					error: "phone_number must be a valid phone number",
				});
			}
		}

		if (email !== undefined) {
			if (typeof email !== "string" || !email.includes("@") || !email.trim()) {
				return res.status(400).json({ error: "email must be valid" });
			}

			const existingEmail = await pool.query(
				"SELECT user_id FROM users WHERE email = $1 AND user_id <> $2",
				[email.trim(), userId],
			);

			if (existingEmail.rowCount) {
				return res.status(409).json({ error: "Email already in use" });
			}
		}

		const updated = await pool.query(
			`UPDATE users
			 SET
				first_name = COALESCE($1, first_name),
				last_name = COALESCE($2, last_name),
				phone_number = CASE
					WHEN $3::text IS NULL THEN phone_number
					WHEN $3::text = '' THEN NULL
					ELSE $3
				END,
				email = COALESCE($4, email)
			 WHERE user_id = $5
			 RETURNING
				user_id,
				first_name,
				last_name,
				email,
				role,
				phone_number,
				is_active,
				is_approved,
				approved_at,
				created_at`,
			[
				nextFirstName,
				nextLastName,
				phone_number === undefined ? null : phone_number,
				email === undefined ? null : email.trim(),
				userId,
			],
		);

		if (!updated.rowCount) {
			return res.status(404).json({ error: "User not found" });
		}

		const user = updated.rows[0];
		const roleProfile = await getRoleProfile(user.user_id, user.role);

		return res.status(200).json({
			message: "User profile updated",
			user,
			profile: roleProfile,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};
