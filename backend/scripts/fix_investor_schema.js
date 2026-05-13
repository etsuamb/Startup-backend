const pool = require("../config/db");

async function columnExists(table, column) {
	const res = await pool.query(
		`SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
		[table, column],
	);
	return res.rowCount > 0;
}

async function addColumnIfMissing(columnDef) {
	try {
		await pool.query(columnDef);
		console.log("Executed:", columnDef.split("\n")[0]);
	} catch (err) {
		console.error("Failed to execute:", columnDef.split("\n")[0], err.message || err);
		throw err;
	}
}

async function main() {
	if (!(await columnExists("investors", "location_preference"))) {
		await addColumnIfMissing(
			"ALTER TABLE investors ADD COLUMN location_preference VARCHAR(255)",
		);
	} else {
		console.log("investors.location_preference exists");
	}

	if (!(await columnExists("investors", "linked_in_or_website"))) {
		await addColumnIfMissing(
			"ALTER TABLE investors ADD COLUMN linked_in_or_website VARCHAR(255)",
		);
	} else {
		console.log("investors.linked_in_or_website exists");
	}

	if (!(await columnExists("investors", "bio"))) {
		await addColumnIfMissing(
			"ALTER TABLE investors ADD COLUMN bio TEXT",
		);
	} else {
		console.log("investors.bio exists");
	}

	if (!(await columnExists("investors", "personal_verification"))) {
		await addColumnIfMissing(
			"ALTER TABLE investors ADD COLUMN personal_verification VARCHAR(255)",
		);
	} else {
		console.log("investors.personal_verification exists");
	}

	if (!(await columnExists("investors", "uploaded_documents"))) {
		await addColumnIfMissing(
			"ALTER TABLE investors ADD COLUMN uploaded_documents JSONB",
		);
	} else {
		console.log("investors.uploaded_documents exists");
	}

	if (!(await columnExists("documents", "investor_id"))) {
		await addColumnIfMissing(
			"ALTER TABLE documents ADD COLUMN investor_id INTEGER REFERENCES investors(investor_id) ON DELETE CASCADE",
		);
	} else {
		console.log("documents.investor_id exists");
	}

	console.log("Investor schema fixup complete");
	await pool.end();
}

main().catch((err) => {
	console.error("Investor schema fix failed", err.message || err);
	process.exit(1);
});