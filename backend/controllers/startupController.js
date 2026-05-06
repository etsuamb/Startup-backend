const pool = require("../config/db");
const { normalizeMultipartBody } = require("../utils/requestBody");

exports.getMyStartupProfile = async (req, res) => {
	try {
		const userId = req.user.user_id;

		const result = await pool.query(
			`SELECT s.*, u.user_id, u.first_name, u.last_name, u.email
			 FROM startups s
			 JOIN users u ON u.user_id = s.user_id
			 WHERE s.user_id = $1`,
			[userId],
		);

		if (!result.rowCount) {
			return res.status(404).json({ error: "Startup profile not found" });
		}

		const startup = result.rows[0];
		const docs = await pool.query(
			`SELECT document_id, file_name, file_path, file_type, file_size_bytes, description, created_at
			 FROM documents
			 WHERE startup_id = $1
			 ORDER BY created_at DESC`,
			[startup.startup_id],
		);

		startup.documents = docs.rows;
		return res.status(200).json(startup);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

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
		req.body = normalizeMultipartBody(req.body);

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

		req.body = normalizeMultipartBody(req.body);

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

		// For PUT requests, allow partial updates - don't require startup_name if not provided
		// Only validate startup_name if it is provided
		if (
			startup_name !== undefined &&
			startup_name !== null &&
			startup_name !== ""
		) {
			if (typeof startup_name !== "string") {
				return res.status(400).json({
					error: "'startup_name' must be a string",
				});
			}
		} else {
			startup_name = undefined; // Don't update this field if not provided
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
			founded_year = undefined; // Don't update this field if not provided
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
			team_size = undefined; // Don't update this field if not provided
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
			funding_needed = undefined; // Don't update this field if not provided
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

		// Build dynamic UPDATE query - only update fields that were provided
		const updateFields = [];
		const updateValues = [];
		let paramIndex = 1;

		if (startup_name !== undefined) {
			updateFields.push(`startup_name = $${paramIndex++}`);
			updateValues.push(startup_name);
		}
		if (industry !== undefined && industry !== null && industry !== "") {
			updateFields.push(`industry = $${paramIndex++}`);
			updateValues.push(industry);
		}
		if (
			description !== undefined &&
			description !== null &&
			description !== ""
		) {
			updateFields.push(`description = $${paramIndex++}`);
			updateValues.push(description);
		}
		if (
			business_stage !== undefined &&
			business_stage !== null &&
			business_stage !== ""
		) {
			updateFields.push(`business_stage = $${paramIndex++}`);
			updateValues.push(business_stage);
		}
		if (founded_year !== undefined) {
			updateFields.push(`founded_year = $${paramIndex++}`);
			updateValues.push(founded_year);
		}
		if (team_size !== undefined) {
			updateFields.push(`team_size = $${paramIndex++}`);
			updateValues.push(team_size);
		}
		if (location !== undefined && location !== null && location !== "") {
			updateFields.push(`location = $${paramIndex++}`);
			updateValues.push(location);
		}
		if (website !== undefined && website !== null && website !== "") {
			updateFields.push(`website = $${paramIndex++}`);
			updateValues.push(website);
		}
		if (funding_needed !== undefined) {
			updateFields.push(`funding_needed = $${paramIndex++}`);
			updateValues.push(funding_needed);
		}

		// If no fields to update, return error
		if (updateFields.length === 0) {
			return res
				.status(400)
				.json({ error: "No valid fields provided for update" });
		}

		// Add WHERE clause with user_id parameter
		updateValues.push(userId);

		const updateQuery = `UPDATE startups SET ${updateFields.join(", ")} WHERE user_id = $${paramIndex} RETURNING *`;
		const updateRes = await pool.query(updateQuery, updateValues);

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

async function getStartupByUserId(userId) {
	const result = await pool.query("SELECT * FROM startups WHERE user_id = $1", [
		userId,
	]);
	return result.rowCount ? result.rows[0] : null;
}

exports.searchInvestorsAndMentors = async (req, res) => {
	try {
		const {
			q,
			industry,
			stage,
			country,
			type = "all",
			limit = 50,
			offset = 0,
		} = req.query || {};

		const payload = {};
		const maxLimit = Math.min(Number(limit) || 50, 100);
		const startOffset = Number(offset) || 0;

		if (type === "all" || type === "investors") {
			const filters = ["u.is_active = true", "u.is_approved = true"];
			const values = [];
			if (q) {
				values.push(`%${q}%`);
				filters.push(
					`(i.organization_name ILIKE $${values.length} OR u.first_name ILIKE $${values.length} OR u.last_name ILIKE $${values.length})`,
				);
			}
			if (industry) {
				values.push(`%${industry}%`);
				filters.push(`i.preferred_industry ILIKE $${values.length}`);
			}
			if (stage) {
				values.push(`%${stage}%`);
				filters.push(`i.investment_stage ILIKE $${values.length}`);
			}
			if (country) {
				values.push(`%${country}%`);
				filters.push(`i.country ILIKE $${values.length}`);
			}
			values.push(maxLimit, startOffset);

			const investors = await pool.query(
				`SELECT i.*, u.user_id, u.first_name, u.last_name, u.email
				 FROM investors i
				 JOIN users u ON u.user_id = i.user_id
				 WHERE ${filters.join(" AND ")}
				 ORDER BY i.created_at DESC
				 LIMIT $${values.length - 1} OFFSET $${values.length}`,
				values,
			);
			payload.investors = investors.rows;
		}

		if (type === "all" || type === "mentors") {
			const filters = [
				"u.is_active = true",
				"u.is_approved = true",
				"m.verification_status = 'approved'",
			];
			const values = [];
			if (q) {
				values.push(`%${q}%`);
				filters.push(
					`(m.headline ILIKE $${values.length} OR m.expertise ILIKE $${values.length} OR u.first_name ILIKE $${values.length} OR u.last_name ILIKE $${values.length})`,
				);
			}
			if (industry) {
				values.push(`%${industry}%`);
				filters.push(
					`(m.expertise ILIKE $${values.length} OR m.industries::text ILIKE $${values.length})`,
				);
			}
			if (country) {
				values.push(`%${country}%`);
				filters.push(`m.country ILIKE $${values.length}`);
			}
			values.push(maxLimit, startOffset);

			const mentors = await pool.query(
				`SELECT m.*, u.user_id, u.first_name, u.last_name, u.email
				 FROM mentors m
				 JOIN users u ON u.user_id = m.user_id
				 WHERE ${filters.join(" AND ")}
				 ORDER BY m.created_at DESC
				 LIMIT $${values.length - 1} OFFSET $${values.length}`,
				values,
			);
			payload.mentors = mentors.rows;
		}

		return res.json(payload);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getRecommendations = async (req, res) => {
	try {
		const startup = await getStartupByUserId(req.user.user_id);
		if (!startup) {
			return res.status(404).json({ error: "Startup profile not found" });
		}

		const [investors, mentors] = await Promise.all([
			pool.query(
				`SELECT
					i.*,
					u.first_name,
					u.last_name,
					u.email,
					(
						CASE WHEN i.preferred_industry IS NOT NULL
						      AND $1::text IS NOT NULL
						      AND i.preferred_industry ILIKE '%' || $1 || '%' THEN 45 ELSE 0 END
						+ CASE WHEN i.investment_stage IS NOT NULL
						      AND $2::text IS NOT NULL
						      AND i.investment_stage ILIKE '%' || $2 || '%' THEN 30 ELSE 0 END
						+ CASE WHEN i.investment_budget IS NOT NULL
						      AND $3::numeric IS NOT NULL
						      AND i.investment_budget >= $3 THEN 25 ELSE 0 END
					) AS match_score
				 FROM investors i
				 JOIN users u ON u.user_id = i.user_id
				 WHERE u.is_active = true AND u.is_approved = true
				 ORDER BY match_score DESC, i.created_at DESC
				 LIMIT 20`,
				[startup.industry, startup.business_stage, startup.funding_needed],
			),
			pool.query(
				`SELECT
					m.*,
					u.first_name,
					u.last_name,
					u.email,
					(
						CASE WHEN $1::text IS NOT NULL
						      AND (m.expertise ILIKE '%' || $1 || '%'
						           OR m.industries::text ILIKE '%' || $1 || '%') THEN 60 ELSE 0 END
						+ CASE WHEN $2::text IS NOT NULL
						      AND m.country ILIKE '%' || $2 || '%' THEN 15 ELSE 0 END
						+ CASE WHEN m.years_experience >= 3 THEN 25 ELSE 0 END
					) AS match_score
				 FROM mentors m
				 JOIN users u ON u.user_id = m.user_id
				 WHERE u.is_active = true
				   AND u.is_approved = true
				   AND m.verification_status = 'approved'
				 ORDER BY match_score DESC, m.created_at DESC
				 LIMIT 20`,
				[startup.industry, startup.location],
			),
		]);

		return res.json({
			method: "rule_based_profile_match",
			investors: investors.rows,
			mentors: mentors.rows,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getDashboardStatus = async (req, res) => {
	try {
		const startup = await getStartupByUserId(req.user.user_id);
		if (!startup) {
			return res.status(404).json({ error: "Startup profile not found" });
		}

		const [projects, investments, mentorship, payments, feedback] =
			await Promise.all([
				pool.query(
					`SELECT status, COUNT(*)::int AS count, COALESCE(SUM(amount_raised),0) AS amount_raised
					 FROM projects
					 WHERE startup_id = $1
					 GROUP BY status`,
					[startup.startup_id],
				),
				pool.query(
					`SELECT status, COUNT(*)::int AS count
					 FROM investment_requests
					 WHERE startup_id = $1
					 GROUP BY status`,
					[startup.startup_id],
				),
				pool.query(
					`SELECT status, COUNT(*)::int AS count
					 FROM mentorship_requests
					 WHERE startup_id = $1
					 GROUP BY status`,
					[startup.startup_id],
				),
				pool.query(
					`SELECT pay.status, COUNT(*)::int AS count, COALESCE(SUM(pay.amount),0) AS total
					 FROM payments pay
					 JOIN investment_requests ir
					   ON ir.investment_request_id = pay.reference_id
					  AND pay.reference_type = 'investment_requests'
					 WHERE ir.startup_id = $1
					 GROUP BY pay.status`,
					[startup.startup_id],
				),
				pool.query(
					`SELECT COUNT(*)::int AS count, AVG(rating)::numeric(10,2) AS average_rating
					 FROM investor_feedback
					 WHERE startup_id = $1`,
					[startup.startup_id],
				),
			]);

		const activeMentorship =
			mentorship.rows.find((row) => row.status === "accepted") ||
			mentorship.rows.find((row) => row.status === "pending");
		const fundedProject = projects.rows.find((row) => row.status === "funded");

		return res.json({
			startup,
			status: fundedProject
				? "Funded"
				: activeMentorship
					? "Mentored"
					: projects.rows.length
						? "Active"
						: "Profile",
			projects: projects.rows,
			investments: investments.rows,
			mentorship: mentorship.rows,
			payments: payments.rows,
			feedback: feedback.rows[0],
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};
