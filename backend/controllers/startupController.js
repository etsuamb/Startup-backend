const pool = require("../config/db");

// Create startup profile
exports.createStartupProfile = async (req, res) => {
	try {
		const userId = req.user.user_id; // from JWT

		// If a startup already exists for this user, return 409 Conflict
		const existing = await pool.query(
			"SELECT startup_id FROM startups WHERE user_id = $1",
			[userId],
		);
		if (existing.rowCount > 0) {
			return res.status(409).json({
				error:
					"Startup profile already exists for this user. Use PUT /api/startups/profile to update.",
			});
		}
		// Accept JSON and multipart/form-data bodies.
		if (!req.body || typeof req.body !== "object") {
			req.body = {};
		}

		// Some clients send a JSON string in a multipart field named 'data'.
		if (typeof req.body.data === "string" && req.body.data.trim() !== "") {
			try {
				req.body = JSON.parse(req.body.data);
			} catch (parseErr) {
				return res.status(400).json({
					error: "Invalid JSON in form-data field 'data'",
				});
			}
		}

		let {
			startup_name,
			industry,
			description,
			business_stage,
			founded_year,
			team_size,
			location,
			website,
			funding_needed,
		} = req.body || {};

		if (!startup_name || typeof startup_name !== "string") {
			return res.status(400).json({
				error:
					"'startup_name' is required. Send either JSON (application/json) or form-data fields with startup_name.",
			});
		}

		// Validate optional typed fields
		if (
			founded_year !== undefined &&
			founded_year !== null &&
			founded_year !== ""
		) {
			const fy = Number(founded_year);
			if (!Number.isInteger(fy) || fy < 1900 || fy > 2100) {
				return res.status(400).json({
					error: "'founded_year' must be an integer between 1900 and 2100",
				});
			}
			founded_year = fy;
		} else {
			founded_year = null;
		}

		if (team_size !== undefined && team_size !== null && team_size !== "") {
			const ts = Number(team_size);
			if (!Number.isInteger(ts) || ts < 0) {
				return res
					.status(400)
					.json({ error: "'team_size' must be a non-negative integer" });
			}
			team_size = ts;
		} else {
			team_size = null;
		}

		if (
			funding_needed !== undefined &&
			funding_needed !== null &&
			funding_needed !== ""
		) {
			const fn = Number(funding_needed);
			if (Number.isNaN(fn) || fn < 0) {
				return res
					.status(400)
					.json({ error: "'funding_needed' must be a non-negative number" });
			}
			funding_needed = fn;
		} else {
			funding_needed = null;
		}

		if (website !== undefined && website !== null && website !== "") {
			if (
				typeof website !== "string" ||
				!(website.startsWith("http://") || website.startsWith("https://"))
			) {
				return res.status(400).json({
					error:
						"'website' must be a valid URL starting with http:// or https://",
				});
			}
		}

		const result = await pool.query(
			`
      INSERT INTO startups (
        user_id,
        startup_name,
        industry,
        description,
        business_stage,
        founded_year,
        team_size,
        location,
        website,
        funding_needed
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
      `,
			[
				userId,
				startup_name,
				industry,
				description,
				business_stage,
				founded_year,
				team_size,
				location,
				website,
				funding_needed,
			],
		);

		const startup = result.rows[0];
		const uploadedFiles = [];

		if (req.files && typeof req.files === "object") {
			for (const fileGroup of Object.values(req.files)) {
				if (Array.isArray(fileGroup)) {
					uploadedFiles.push(...fileGroup);
				}
			}
		}

		if (req.file) {
			uploadedFiles.push(req.file);
		}

		for (const file of uploadedFiles) {
			try {
				await pool.query(
					`INSERT INTO documents (startup_id, file_name, file_path, file_type, file_size_bytes, created_at)
					 VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP)`,
					[
						startup.startup_id,
						file.originalname,
						file.path,
						file.mimetype,
						file.size,
					],
				);
			} catch (docErr) {
				console.error("Failed to save uploaded file record:", docErr.message);
			}
		}

		res.status(201).json({ message: "Startup profile created", startup });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// Update existing startup profile (by authenticated Startup user)
exports.updateStartupProfile = async (req, res) => {
	try {
		const userId = req.user.user_id;

		// Accept JSON and multipart/form-data bodies.
		if (!req.body || typeof req.body !== "object") {
			req.body = {};
		}

		if (typeof req.body.data === "string" && req.body.data.trim() !== "") {
			try {
				req.body = JSON.parse(req.body.data);
			} catch (parseErr) {
				return res.status(400).json({
					error: "Invalid JSON in form-data field 'data'",
				});
			}
		}

		let {
			startup_name,
			industry,
			description,
			business_stage,
			founded_year,
			team_size,
			location,
			website,
			funding_needed,
		} = req.body || {};

		// Basic required validation
		if (!startup_name || typeof startup_name !== "string") {
			return res.status(400).json({
				error:
					"'startup_name' is required. Send either JSON (application/json) or form-data fields with startup_name.",
			});
		}

		// Validate typed fields (same rules as create)
		if (
			founded_year !== undefined &&
			founded_year !== null &&
			founded_year !== ""
		) {
			const fy = Number(founded_year);
			if (!Number.isInteger(fy) || fy < 1900 || fy > 2100) {
				return res.status(400).json({
					error: "'founded_year' must be an integer between 1900 and 2100",
				});
			}
			founded_year = fy;
		} else {
			founded_year = null;
		}

		if (team_size !== undefined && team_size !== null && team_size !== "") {
			const ts = Number(team_size);
			if (!Number.isInteger(ts) || ts < 0) {
				return res
					.status(400)
					.json({ error: "'team_size' must be a non-negative integer" });
			}
			team_size = ts;
		} else {
			team_size = null;
		}

		if (
			funding_needed !== undefined &&
			funding_needed !== null &&
			funding_needed !== ""
		) {
			const fn = Number(funding_needed);
			if (Number.isNaN(fn) || fn < 0) {
				return res
					.status(400)
					.json({ error: "'funding_needed' must be a non-negative number" });
			}
			funding_needed = fn;
		} else {
			funding_needed = null;
		}

		if (website !== undefined && website !== null && website !== "") {
			if (
				typeof website !== "string" ||
				!(website.startsWith("http://") || website.startsWith("https://"))
			) {
				return res.status(400).json({
					error:
						"'website' must be a valid URL starting with http:// or https://",
				});
			}
		}

		// Ensure startup exists
		const existing = await pool.query(
			"SELECT startup_id FROM startups WHERE user_id = $1",
			[userId],
		);
		if (existing.rowCount === 0) {
			return res.status(404).json({ error: "Startup profile not found" });
		}

		const updateRes = await pool.query(
			`UPDATE startups SET
				startup_name = $1,
				industry = $2,
				description = $3,
				business_stage = $4,
				founded_year = $5,
				team_size = $6,
				location = $7,
				website = $8,
				funding_needed = $9
			WHERE user_id = $10
			RETURNING *
			`,
			[
				startup_name,
				industry,
				description,
				business_stage,
				founded_year,
				team_size,
				location,
				website,
				funding_needed,
				userId,
			],
		);

		const startup = updateRes.rows[0];
		const uploadedFiles = [];

		if (req.files && typeof req.files === "object") {
			for (const fileGroup of Object.values(req.files)) {
				if (Array.isArray(fileGroup)) {
					uploadedFiles.push(...fileGroup);
				}
			}
		}

		if (req.file) {
			uploadedFiles.push(req.file);
		}

		for (const file of uploadedFiles) {
			try {
				await pool.query(
					`INSERT INTO documents (startup_id, file_name, file_path, file_type, file_size_bytes, created_at)
					 VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP)`,
					[
						startup.startup_id,
						file.originalname,
						file.path,
						file.mimetype,
						file.size,
					],
				);
			} catch (docErr) {
				console.error("Failed to save uploaded file record:", docErr.message);
			}
		}

		res.status(200).json({ message: "Startup profile updated", startup });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};
