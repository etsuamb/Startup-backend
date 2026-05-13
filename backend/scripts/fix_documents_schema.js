const pool = require("../config/db");

async function columnExists(column) {
	const res = await pool.query(
		`SELECT column_name FROM information_schema.columns WHERE table_name='documents' AND column_name = $1`,
		[column],
	);
	return res.rowCount > 0;
}

async function addColumnIfMissing(columnDef) {
	try {
		await pool.query(columnDef);
		console.log("Executed:", columnDef.split("\n")[0]);
	} catch (err) {
		console.error(
			"Failed to execute:",
			columnDef.split("\n")[0],
			err.message || err,
		);
		throw err;
	}
}

async function main() {
	if (!(await columnExists("file_hash"))) {
		await addColumnIfMissing(
			"ALTER TABLE documents ADD COLUMN file_hash VARCHAR(128)",
		);
	} else {
		console.log("file_hash exists");
	}

	console.log("Documents schema fixup complete");
	await pool.end();
}

main().catch((err) => {
	console.error("Documents schema fix failed", err.message || err);
	process.exit(1);
});
