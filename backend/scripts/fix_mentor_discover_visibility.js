/**
 * One-time helper: ensure registered mentors are visible in startup discover.
 * Run: node scripts/fix_mentor_discover_visibility.js
 */
const pool = require("../config/db");

async function main() {
	const updated = await pool.query(
		`UPDATE mentors m
		 SET is_approved = true
		 FROM users u
		 WHERE u.user_id = m.user_id
		   AND u.role = 'Mentor'
		 RETURNING m.mentor_id`,
	);
	console.log(`Mentor listings updated: ${updated.rowCount}`);

	const sample = await pool.query(
		`SELECT m.mentor_id, u.email, u.is_approved, u.is_active, m.is_approved AS mentor_listed
		 FROM mentors m
		 JOIN users u ON u.user_id = m.user_id
		 ORDER BY m.created_at DESC
		 LIMIT 10`,
	);
	console.log(JSON.stringify(sample.rows, null, 2));
}

main()
	.catch((err) => {
		console.error(err);
		process.exit(1);
	})
	.finally(() => pool.end());
