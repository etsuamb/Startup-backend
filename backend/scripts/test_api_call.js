const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const JWT_SECRET = process.env.JWT_SECRET || "change_this_to_a_long_secret";
const port = process.env.PORT || 5000;
const baseUrl = `http://localhost:${port}`;

// Create token for user_id = 39 (role: Startup)
const token = jwt.sign(
	{ user_id: 39, role: "Startup" },
	JWT_SECRET,
	{ expiresIn: "1h" }
);

(async () => {
	// First let's check if the server is running. If not, we can import index.js to run it in-process!
	let server;
	try {
		// Try to fetch homepage to see if server is running
		await fetch(baseUrl + "/api/startups/featured");
		console.log("Backend server is already running.");
	} catch (e) {
		console.log("Backend server is not running. Starting in-process server...");
		try {
			server = require("../index");
			// Wait a bit for the server to bind
			await new Promise(resolve => setTimeout(resolve, 1000));
		} catch (err) {
			console.error("Failed to start backend:", err);
			process.exit(1);
		}
	}

	try {
		console.log("\n--- Testing POST /api/startups/investment-requests (WITHOUT investor_id) ---");
		let res = await fetch(`${baseUrl}/api/startups/investment-requests`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${token}`
			},
			body: JSON.stringify({
				project_id: 7,
				requested_amount: 5000,
				proposal_message: "Test investment request description of sufficient length"
			})
		});
		console.log("Status:", res.status);
		console.log("Response:", await res.text());

		console.log("\n--- Testing POST /api/startups/investment-requests (WITH investor_id: 1) ---");
		res = await fetch(`${baseUrl}/api/startups/investment-requests`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${token}`
			},
			body: JSON.stringify({
				investor_id: 1,
				project_id: 7,
				requested_amount: 5000,
				proposal_message: "Test investment request description of sufficient length"
			})
		});
		console.log("Status:", res.status);
		console.log("Response:", await res.text());

		console.log("\n--- Testing POST /api/startups/mentorship-requests (mentor_id: 2) ---");
		res = await fetch(`${baseUrl}/api/startups/mentorship-requests`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${token}`
			},
			body: JSON.stringify({
				mentor_id: 2,
				subject: "Mentorship Request from Startup name",
				message: "Test mentorship request description of sufficient length"
			})
		});
		console.log("Status:", res.status);
		console.log("Response:", await res.text());

	} catch (err) {
		console.error("Request error:", err);
	} finally {
		if (server && server.close) {
			server.close();
		}
		process.exit(0);
	}
})();
