const fs = require("fs").promises;
const path = require("path");
const pool = require("../config/db");
const { seedAdmin } = require("../seeds/seedAdmin");
const { ensureAuthSecuritySchema } = require("./ensureAuthSecuritySchema");
const { ensurePaymentSchema } = require("./ensurePaymentSchema");

const MIGRATION_FILES = [
	"001_init.sql",
	"002_chat_system.sql",
	"003_admin_monitoring.sql",
	"004_profile_privacy.sql",
	"005_auth_security.sql",
	"006_admin_uc.sql",
	"007_payment_gateway.sql",
];

async function ensureUploads() {
	const uploadsDir = path.resolve(process.cwd(), "uploads");
	await fs.mkdir(uploadsDir, { recursive: true });
}

async function runSqlFile(filePath) {
	const sql = await fs.readFile(filePath, "utf8");

	try {
		await pool.query(sql);
		return;
	} catch (err) {
		console.warn(
			"Batch SQL failed, retrying statement-by-statement:",
			err.message || err,
		);
	}

	const statements = sql
		.split(/;\s*\n/)
		.map((s) => s.trim())
		.filter(Boolean);

	for (const stmt of statements) {
		try {
			await pool.query(stmt);
		} catch (e) {
			console.error("Statement failed:", stmt.slice(0, 120));
			throw e;
		}
	}
}

async function runMigrations() {
	for (const file of MIGRATION_FILES) {
		const sqlPath = path.resolve(process.cwd(), file);
		try {
			await fs.access(sqlPath);
		} catch {
			console.warn("Skipping missing migration:", file);
			continue;
		}
		console.log("Applying migration:", file);
		await runSqlFile(sqlPath);
	}
}

/**
 * Applies SQL migrations (idempotent CREATE IF NOT EXISTS / ALTER IF NOT EXISTS)
 * and seeds the default admin when missing. Safe to run on every server start.
 */
async function initDatabase() {
	console.log("Initializing database...");
	await ensureUploads();
	await runMigrations();
	await ensureAuthSecuritySchema();
	await ensurePaymentSchema();
	await seedAdmin();
	console.log("Database initialization complete");
}

module.exports = {
	initDatabase,
	runMigrations,
	ensureUploads,
	MIGRATION_FILES,
};
