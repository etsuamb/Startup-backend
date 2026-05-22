const pool = require("../config/db");

(async () => {
	try {
		const res = await pool.query(
			"SELECT mentor_id, user_id, headline, expertise FROM mentors ORDER BY mentor_id",
		);
		console.log("mentors rows:", res.rows.length);
		console.table(res.rows);
		await pool.end();
	} catch (err) {
		console.error("Error querying mentors:", err.message);
		process.exit(1);
	}
})();
