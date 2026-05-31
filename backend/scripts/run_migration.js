const pool = require("../config/db");
const { ensureUploads, runMigrations } = require("../services/initDatabase");

async function main() {
	await ensureUploads();
	await runMigrations();
	console.log("Migration complete");
	await pool.end();
}

main().catch((err) => {
	console.error("Migration failed:", err.message || err);
	process.exit(1);
});
