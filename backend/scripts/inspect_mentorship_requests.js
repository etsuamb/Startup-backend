const pool = require("../config/db");

(async () => {
	try {
		const res = await pool.query(
			"SELECT mentorship_request_id, startup_id, mentor_id, subject, status, created_at FROM mentorship_requests ORDER BY mentorship_request_id DESC LIMIT 10",
		);
		console.log("mentorship_requests rows:", res.rows.length);
		console.table(res.rows);
		await pool.end();
	} catch (err) {
		console.error("Error querying mentorship_requests:", err.message);
		process.exit(1);
	}
})();
