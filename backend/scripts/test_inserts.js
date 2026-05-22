const pool = require("../config/db");

(async () => {
	try {
		console.log("Testing mentorship request insert...");
		// Startup ID 14, Mentor ID 2
		const mentorshipRes = await pool.query(
			`INSERT INTO mentorship_requests (startup_id, mentor_id, subject, message)
			 VALUES ($1, $2, $3, $4) RETURNING *`,
			[14, 2, "Test Mentorship Subject", "Test mentorship message of sufficient length for test purposes"]
		);
		console.log("Mentorship insert success:", mentorshipRes.rows[0]);

		// Delete the test row
		await pool.query("DELETE FROM mentorship_requests WHERE mentorship_request_id = $1", [mentorshipRes.rows[0].mentorship_request_id]);
		console.log("Mentorship test row cleaned up.");

		console.log("Testing investment request insert...");
		// Startup ID 14, Investor ID 1, Project ID 1
		// First get an investor and a project
		const investor = await pool.query("SELECT investor_id FROM investors LIMIT 1");
		const project = await pool.query("SELECT project_id FROM projects WHERE startup_id = 14 LIMIT 1");
		
		if (investor.rows.length === 0) {
			console.log("No investors found in db");
		} else {
			const investorId = investor.rows[0].investor_id;
			let projectId = null;
			if (project.rows.length > 0) {
				projectId = project.rows[0].project_id;
			} else {
				// Let's create a dummy project for startup 14
				const newProj = await pool.query(
					"INSERT INTO projects (startup_id, project_title, funding_goal) VALUES ($1, $2, $3) RETURNING project_id",
					[14, "Test Project", 10000]
				);
				projectId = newProj.rows[0].project_id;
				console.log("Created temp project:", projectId);
			}

			const investmentRes = await pool.query(
				`INSERT INTO investment_requests (startup_id, investor_id, project_id, requested_amount, proposal_message)
				 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
				[14, investorId, projectId, 5000, "Test proposal message of sufficient length for test"]
			);
			console.log("Investment insert success:", investmentRes.rows[0]);

			// Clean up
			await pool.query("DELETE FROM investment_requests WHERE investment_request_id = $1", [investmentRes.rows[0].investment_request_id]);
			console.log("Investment test row cleaned up.");
		}

		await pool.end();
	} catch (err) {
		console.error("Error during DB insert test:", err);
		process.exit(1);
	}
})();
