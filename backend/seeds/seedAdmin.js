const bcrypt = require("bcrypt");
const pool = require("../config/db");

const ADMIN_EMAIL = "admin@startupconnect.test";
const ADMIN_PASSWORD = "AdminPass123!";

/**
 * Ensures the platform admin exists. Idempotent: skips insert when already present
 * unless resetIfExists is true (CLI ensure-admin script).
 */
async function seedAdmin({ resetIfExists = false } = {}) {
	const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

	const exists = await pool.query(
		"SELECT user_id FROM users WHERE email = $1",
		[ADMIN_EMAIL],
	);

	if (exists.rows.length) {
		if (!resetIfExists) {
			console.log("Admin user already exists, skipping seed:", ADMIN_EMAIL);
			return;
		}

		const userId = exists.rows[0].user_id;
		await pool.query(
			`UPDATE users
       SET password_hash = $1, role = 'Admin', is_approved = true, is_active = true,
           email_verified = true, provider_type = 'local', updated_at = NOW()
       WHERE user_id = $2`,
			[hash, userId],
		);
		await ensureAdminProfile(userId);
		console.log("Admin user already exists; credentials refreshed:", ADMIN_EMAIL);
		return;
	}

	const inserted = await pool.query(
		`INSERT INTO users (
       first_name, last_name, email, password_hash, role,
       is_approved, is_active, email_verified, provider_type, created_at
     )
     VALUES ($1, $2, $3, $4, 'Admin', true, true, true, 'local', NOW())
     RETURNING user_id`,
		["Platform", "Admin", ADMIN_EMAIL, hash],
	);

	await ensureAdminProfile(inserted.rows[0].user_id);
	console.log("Admin user created:", ADMIN_EMAIL);
}

async function ensureAdminProfile(userId) {
	const adminRow = await pool.query(
		"SELECT admin_id FROM admins WHERE user_id = $1",
		[userId],
	);

	if (!adminRow.rows.length) {
		await pool.query(
			"INSERT INTO admins (user_id, privilege_level) VALUES ($1, $2)",
			[userId, 10],
		);
		return;
	}

	await pool.query(
		"UPDATE admins SET privilege_level = $1 WHERE user_id = $2",
		[10, userId],
	);
}

module.exports = {
	seedAdmin,
	ADMIN_EMAIL,
	ADMIN_PASSWORD,
};
