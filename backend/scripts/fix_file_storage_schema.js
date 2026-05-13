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
	if (!(await columnExists("documents", "file_data"))) {
		await addColumnIfMissing(
			"ALTER TABLE documents ADD COLUMN file_data BYTEA",
		);
	} else {
		console.log("documents.file_data exists");
	}

	if (!(await columnExists("mentor_documents", "file_data"))) {
		await addColumnIfMissing(
			"ALTER TABLE mentor_documents ADD COLUMN file_data BYTEA",
		);
	} else {
		console.log("mentor_documents.file_data exists");
	}

	console.log("File storage schema fixup complete");
	await pool.end();
}

main().catch((err) => {
	console.error("File storage schema fix failed", err.message || err);
	process.exit(1);
});