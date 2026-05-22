const pool = require("../config/db");

(async () => {
	try {
		const res = await pool.query(
			"SELECT user_id, first_name, last_name, email, role, is_approved, is_active FROM users ORDER BY user_id DESC LIMIT 15",
		);
		console.log("users rows:", res.rows.length);
		console.table(res.rows);
		await pool.end();
	} catch (err) {
		console.error("Error querying users:", err.message);
		process.exit(1);
	}
})();
