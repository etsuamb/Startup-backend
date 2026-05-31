const pool = require("../config/db");
const { seedAdmin, ADMIN_EMAIL, ADMIN_PASSWORD } = require("../seeds/seedAdmin");

seedAdmin({ resetIfExists: true })
	.then(() => {
		console.log("Credentials:");
		console.log("  email:", ADMIN_EMAIL);
		console.log("  password:", ADMIN_PASSWORD);
		console.log("  login: POST /api/auth/login");
		return pool.end();
	})
	.catch((err) => {
		console.error("Error creating admin:", err.message || err);
		process.exit(1);
	});
