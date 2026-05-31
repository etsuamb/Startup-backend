require("dotenv").config();
const pool = require("../config/db");

async function main() {
	const column = await pool.query(
		`SELECT column_name, column_default, is_nullable
		 FROM information_schema.columns
		 WHERE table_name = 'mentorship_requests' AND column_name = 'initiated_by'`,
	);
	const counts = await pool.query(
		`SELECT initiated_by, status, COUNT(*)::int AS count
		 FROM mentorship_requests
		 GROUP BY initiated_by, status
		 ORDER BY initiated_by, status`,
	);
	const recent = await pool.query(
		`SELECT mentorship_request_id, initiated_by, status, subject,
		        CASE WHEN COALESCE(initiated_by, 'startup') = 'mentor' THEN 'incoming' ELSE 'sent' END AS startup_direction
		 FROM mentorship_requests
		 ORDER BY created_at DESC
		 LIMIT 10`,
	);

	console.log(JSON.stringify({ column: column.rows, counts: counts.rows, recent: recent.rows }, null, 2));
	await pool.end();
}

main().catch(async (err) => {
	console.error(err);
	await pool.end();
	process.exit(1);
});
