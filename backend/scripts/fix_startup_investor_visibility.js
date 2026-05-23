/**
 * Ensure registered startups appear in investor discover.
 * Run: node scripts/fix_startup_investor_visibility.js
 */
const pool = require("../config/db");

async function main() {
	const updated = await pool.query(
		`UPDATE startups s
		 SET is_listed = true,
		     admin_status = CASE
		       WHEN COALESCE(s.admin_status, 'Pending') IN ('Closed', 'Rejected') THEN s.admin_status
		       ELSE 'Active'
		     END
		 FROM users u
		 WHERE u.user_id = s.user_id
		   AND u.role = 'Startup'
		 RETURNING s.startup_id, s.startup_name`,
	);
	console.log(`Startups updated for investor discover: ${updated.rowCount}`);

	const sample = await pool.query(
		`SELECT s.startup_id, s.startup_name, u.email, u.is_approved, u.is_active,
		        s.is_listed, s.admin_status
		 FROM startups s
		 JOIN users u ON u.user_id = s.user_id
		 ORDER BY s.created_at DESC
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
