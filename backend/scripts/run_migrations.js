const pool = require("../config/db");
const fs = require("fs");

async function runMigrations() {
	console.log("🚀 Starting migrations...");

	try {
		// Migration 1: Add user.status column
		console.log("\n📝 Migration 1: Adding status column to users table...");
		const migration1 = `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
      
      UPDATE users
      SET status = CASE
        WHEN is_active = true THEN 'active'
        WHEN is_approved = false THEN 'pending'
        ELSE 'inactive'
      END
      WHERE status = 'pending';
    `;

		await pool.query(migration1);
		console.log("✅ Migration 1 completed: status column added");

		// Migration 2: Create reports table
		console.log("\n📝 Migration 2: Creating reports table for user flags...");
		const migration2 = `
      CREATE TABLE IF NOT EXISTS reports (
        report_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
        target_id INTEGER,
        target_type VARCHAR(50),
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
      CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
      CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
    `;

		await pool.query(migration2);
		console.log("✅ Migration 2 completed: reports table created with indexes");

		console.log("\n✨ All migrations completed successfully!");
		process.exit(0);
	} catch (err) {
		console.error("❌ Migration failed:", err.message);
		process.exit(1);
	}
}

runMigrations();
