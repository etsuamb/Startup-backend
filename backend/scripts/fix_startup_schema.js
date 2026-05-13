const pool = require("../config/db");

async function columnExists(column) {
	const res = await pool.query(
		`SELECT column_name FROM information_schema.columns WHERE table_name='startups' AND column_name = $1`,
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
	if (!(await columnExists("founder_full_name"))) {
		await addColumnIfMissing(
			"ALTER TABLE startups ADD COLUMN founder_full_name VARCHAR(255)",
		);
	} else {
		console.log("founder_full_name exists");
	}

	if (!(await columnExists("startup_tagline"))) {
		await addColumnIfMissing(
			"ALTER TABLE startups ADD COLUMN startup_tagline VARCHAR(255)",
		);
	} else {
		console.log("startup_tagline exists");
	}

	if (!(await columnExists("startup_type"))) {
		await addColumnIfMissing(
			"ALTER TABLE startups ADD COLUMN startup_type VARCHAR(100)",
		);
	} else {
		console.log("startup_type exists");
	}

	if (!(await columnExists("region"))) {
		await addColumnIfMissing(
			"ALTER TABLE startups ADD COLUMN region VARCHAR(100)",
		);
	} else {
		console.log("region exists");
	}

	if (!(await columnExists("city"))) {
		await addColumnIfMissing(
			"ALTER TABLE startups ADD COLUMN city VARCHAR(100)",
		);
	} else {
		console.log("city exists");
	}

	if (!(await columnExists("founder_role"))) {
		await addColumnIfMissing(
			"ALTER TABLE startups ADD COLUMN founder_role VARCHAR(100)",
		);
	} else {
		console.log("founder_role exists");
	}

	if (!(await columnExists("website"))) {
		await addColumnIfMissing(
			"ALTER TABLE startups ADD COLUMN website VARCHAR(255)",
		);
	} else {
		console.log("website exists");
	}

	if (!(await columnExists("uploaded_documents"))) {
		await addColumnIfMissing(
			"ALTER TABLE startups ADD COLUMN uploaded_documents JSONB",
		);
	} else {
		console.log("uploaded_documents exists");
	}

	console.log("Startup schema fixup complete");
	await pool.end();
}

main().catch((err) => {
	console.error("Startup schema fix failed", err.message || err);
	process.exit(1);
});
