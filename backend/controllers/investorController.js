const pool = require("../config/db");
const fs = require("fs");
const path = require("path");
const { normalizeMultipartBody } = require("../utils/requestBody");
const {
	validateInvestorProfile,
	validateNumber,
	validateArray,
	errorResponse,
	successResponse,
} = require("../utils/validation");

exports.getMyInvestorProfile = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const [investorResult, documentsResult] = await Promise.all([
			pool.query(
				`SELECT i.*, u.user_id, u.first_name, u.last_name, u.email
				 FROM investors i
				 JOIN users u ON u.user_id = i.user_id
				 WHERE i.user_id = $1`,
				[userId],
			),
			pool.query(
				`SELECT investor_document_id, document_type, file_name, file_path, file_type, file_size_bytes, description, created_at
				 FROM investor_documents
				 WHERE investor_id = (SELECT investor_id FROM investors WHERE user_id = $1)
				 ORDER BY created_at DESC`,
				[userId],
			),
		]);

		if (!investorResult.rowCount) {
			return res.status(404).json(errorResponse("Investor profile not found"));
		}

		const investor = investorResult.rows[0];
		investor.documents = documentsResult.rows;

		return res.status(200).json(investor);
	} catch (err) {
		return res.status(500).json(errorResponse(err.message));
	}
};

exports.createInvestorProfile = async (req, res) => {
	try {
		const userId = req.user.user_id;
		req.body = normalizeMultipartBody(req.body);

		const existing = await pool.query(
			"SELECT investor_id FROM investors WHERE user_id = $1",
			[userId],
		);
		if (existing.rowCount > 0) {
			return res
				.status(409)
				.json(
					errorResponse(
						"Investor profile already exists for this user. Use PUT /api/investors/profile to update.",
					),
				);
		}

		// Validate profile data
		const validation = validateInvestorProfile(req.body);
		if (!validation.valid) {
			return res
				.status(400)
				.json(errorResponse("Validation failed", validation.errors));
		}

		const {
			investor_type,
			organization_name,
			investment_budget,
			preferred_industry,
			investment_stage,
			country,
			portfolio_size,
			bio,
			investment_focus,
			funding_range_min,
			funding_range_max,
		} = validation.validatedData;

		// Handle profile picture upload
		let profilePicturePath = null;
		if (req.files && req.files.profile_picture) {
			const file = req.files.profile_picture[0];
			profilePicturePath = file.path;
		}

		// Create investor profile
		const result = await pool.query(
			`INSERT INTO investors(
				user_id,
				investor_type,
				organization_name,
				investment_budget,
				preferred_industry,
				investment_stage,
				country,
				portfolio_size,
				bio,
				profile_picture,
				investment_focus,
				funding_range_min,
				funding_range_max
			)
			VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
			RETURNING *`,
			[
				userId,
				investor_type,
				organization_name,
				investment_budget,
				preferred_industry,
				investment_stage,
				country,
				portfolio_size,
				bio,
				profilePicturePath,
				JSON.stringify(investment_focus || []),
				funding_range_min,
				funding_range_max,
			],
		);

		const investor = result.rows[0];
		const investorId = investor.investor_id;

		// Parse numeric fields from DECIMAL database type
		if (investor.investment_budget !== null) {
			investor.investment_budget = Number(investor.investment_budget);
		}
		if (investor.funding_range_min !== null) {
			investor.funding_range_min = Number(investor.funding_range_min);
		}
		if (investor.funding_range_max !== null) {
			investor.funding_range_max = Number(investor.funding_range_max);
		}
		if (investor.portfolio_size !== null) {
			investor.portfolio_size = Number(investor.portfolio_size);
		}

		// Handle portfolio/document uploads
		if (req.files && req.files.portfolio) {
			for (const file of req.files.portfolio) {
				await pool.query(
					`INSERT INTO investor_documents(
						investor_id,
						document_type,
						file_name,
						file_path,
						file_type,
						file_size_bytes
					)
					VALUES($1,$2,$3,$4,$5,$6)`,
					[
						investorId,
						"portfolio",
						file.originalname,
						file.path,
						file.mimetype,
						file.size,
					],
				);
			}
		}

		// Fetch documents list
		const documents = await pool.query(
			`SELECT investor_document_id, document_type, file_name, file_path, file_type, file_size_bytes, created_at
			 FROM investor_documents
			 WHERE investor_id = $1
			 ORDER BY created_at DESC`,
			[investorId],
		);

		investor.documents = documents.rows;

		return res
			.status(201)
			.json(
				successResponse({ investor }, "Investor profile created successfully"),
			);
	} catch (err) {
		return res.status(500).json(errorResponse(err.message));
	}
};

exports.updateInvestorProfile = async (req, res) => {
	try {
		const userId = req.user.user_id;
		req.body = normalizeMultipartBody(req.body);

		const existing = await pool.query(
			"SELECT investor_id FROM investors WHERE user_id = $1",
			[userId],
		);
		if (!existing.rowCount) {
			return res.status(404).json(errorResponse("Investor profile not found"));
		}

		// Extract fields
		const {
			investor_type,
			organization_name,
			investment_budget,
			preferred_industry,
			investment_stage,
			country,
			portfolio_size,
			bio,
			investment_focus,
			funding_range_min,
			funding_range_max,
		} = req.body || {};

		// Validate profile data - for PUT, allow partial updates
		const errors = [];

		if (
			investor_type !== undefined &&
			investor_type !== null &&
			investor_type !== ""
		) {
			if (typeof investor_type !== "string") {
				errors.push("'investor_type' must be a string");
			}
		}

		if (
			investment_budget !== undefined &&
			investment_budget !== null &&
			investment_budget !== ""
		) {
			const budgetValidation = validateNumber(
				investment_budget,
				"investment_budget",
			);
			if (!budgetValidation.valid) {
				errors.push(budgetValidation.error);
			}
		}

		if (
			portfolio_size !== undefined &&
			portfolio_size !== null &&
			portfolio_size !== ""
		) {
			const portfolioValidation = validateNumber(
				portfolio_size,
				"portfolio_size",
				true,
			);
			if (!portfolioValidation.valid) {
				errors.push(portfolioValidation.error);
			}
		}

		if (
			funding_range_min !== undefined &&
			funding_range_min !== null &&
			funding_range_min !== ""
		) {
			const minValidation = validateNumber(
				funding_range_min,
				"funding_range_min",
			);
			if (!minValidation.valid) {
				errors.push(minValidation.error);
			}
		}

		if (
			funding_range_max !== undefined &&
			funding_range_max !== null &&
			funding_range_max !== ""
		) {
			const maxValidation = validateNumber(
				funding_range_max,
				"funding_range_max",
			);
			if (!maxValidation.valid) {
				errors.push(maxValidation.error);
			}
		}

		if (errors.length > 0) {
			return res.status(400).json(errorResponse("Validation failed", errors));
		}

		// Handle profile picture upload
		let profilePicturePath = null;
		if (req.files && req.files.profile_picture) {
			const file = req.files.profile_picture[0];
			profilePicturePath = file.path;
		}

		// Build update query with only provided fields
		const updateFields = [];
		const updateValues = [];
		let paramCount = 1;

		if (investor_type !== undefined) {
			updateFields.push(`investor_type = $${paramCount++}`);
			updateValues.push(investor_type);
		}
		if (organization_name !== undefined) {
			updateFields.push(`organization_name = $${paramCount++}`);
			updateValues.push(organization_name);
		}
		if (investment_budget !== undefined) {
			updateFields.push(`investment_budget = $${paramCount++}`);
			updateValues.push(investment_budget);
		}
		if (preferred_industry !== undefined) {
			updateFields.push(`preferred_industry = $${paramCount++}`);
			updateValues.push(preferred_industry);
		}
		if (investment_stage !== undefined) {
			updateFields.push(`investment_stage = $${paramCount++}`);
			updateValues.push(investment_stage);
		}
		if (country !== undefined) {
			updateFields.push(`country = $${paramCount++}`);
			updateValues.push(country);
		}
		if (portfolio_size !== undefined) {
			updateFields.push(`portfolio_size = $${paramCount++}`);
			updateValues.push(portfolio_size);
		}
		if (bio !== undefined) {
			updateFields.push(`bio = $${paramCount++}`);
			updateValues.push(bio);
		}
		if (profilePicturePath !== null) {
			updateFields.push(`profile_picture = $${paramCount++}`);
			updateValues.push(profilePicturePath);
		}
		if (investment_focus !== undefined) {
			updateFields.push(`investment_focus = $${paramCount++}`);
			updateValues.push(JSON.stringify(investment_focus || []));
		}
		if (funding_range_min !== undefined) {
			updateFields.push(`funding_range_min = $${paramCount++}`);
			updateValues.push(funding_range_min);
		}
		if (funding_range_max !== undefined) {
			updateFields.push(`funding_range_max = $${paramCount++}`);
			updateValues.push(funding_range_max);
		}

		if (updateFields.length === 0) {
			return res.status(400).json(errorResponse("No fields to update"));
		}

		updateValues.push(userId);
		const updateQuery = `UPDATE investors SET ${updateFields.join(", ")} WHERE user_id = $${paramCount} RETURNING *`;

		const updated = await pool.query(updateQuery, updateValues);

		const investorId = updated.rows[0].investor_id;
		const investor = updated.rows[0];

		// Parse numeric fields from DECIMAL database type
		if (investor.investment_budget !== null) {
			investor.investment_budget = Number(investor.investment_budget);
		}
		if (investor.funding_range_min !== null) {
			investor.funding_range_min = Number(investor.funding_range_min);
		}
		if (investor.funding_range_max !== null) {
			investor.funding_range_max = Number(investor.funding_range_max);
		}
		if (investor.portfolio_size !== null) {
			investor.portfolio_size = Number(investor.portfolio_size);
		}

		// Handle new portfolio/document uploads
		if (req.files && req.files.portfolio) {
			for (const file of req.files.portfolio) {
				await pool.query(
					`INSERT INTO investor_documents(
						investor_id,
						document_type,
						file_name,
						file_path,
						file_type,
						file_size_bytes
					)
					VALUES($1,$2,$3,$4,$5,$6)`,
					[
						investorId,
						"portfolio",
						file.originalname,
						file.path,
						file.mimetype,
						file.size,
					],
				);
			}
		}

		// Fetch documents list
		const documents = await pool.query(
			`SELECT investor_document_id, document_type, file_name, file_path, file_type, file_size_bytes, created_at
			 FROM investor_documents
			 WHERE investor_id = $1
			 ORDER BY created_at DESC`,
			[investorId],
		);

		investor.documents = documents.rows;

		return res
			.status(200)
			.json(
				successResponse({ investor }, "Investor profile updated successfully"),
			);
	} catch (err) {
		return res.status(500).json(errorResponse(err.message));
	}
};

exports.getAllInvestors = async (req, res) => {
	try {
		const { industry, min_budget, max_budget, stage, country, focus } =
			req.query || {};

		const filters = [];
		const values = [];

		// Discovery should return only active and approved users.
		filters.push("u.is_active = true");
		filters.push("u.is_approved = true");

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

		if (min_budget !== undefined && min_budget !== "") {
			const parsedMin = validateNumber(min_budget, "min_budget");
			if (!parsedMin.valid) {
				return res.status(400).json(errorResponse(parsedMin.error));
			}
			values.push(parsedMin.parsedValue);
			filters.push(`i.investment_budget >= $${values.length}`);
		}

		if (max_budget !== undefined && max_budget !== "") {
			const parsedMax = validateNumber(max_budget, "max_budget");
			if (!parsedMax.valid) {
				return res.status(400).json(errorResponse(parsedMax.error));
			}
			values.push(parsedMax.parsedValue);
			filters.push(`i.investment_budget <= $${values.length}`);
		}

		// Filter by investment focus (any match in JSONB array)
		if (focus) {
			values.push(focus);
			filters.push(
				`i.investment_focus @> jsonb_build_array($${values.length}::text)`,
			);
		}

		const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

		const result = await pool.query(
			`SELECT
				i.investor_id,
				i.investor_type,
				i.organization_name,
				i.investment_budget,
				i.preferred_industry,
				i.investment_stage,
				i.country,
				i.portfolio_size,
				i.bio,
				i.profile_picture,
				i.investment_focus,
				i.funding_range_min,
				i.funding_range_max,
				i.verification_status,
				i.created_at,
				u.user_id,
				u.first_name,
				u.last_name,
				u.email
			 FROM investors i
			 JOIN users u ON u.user_id = i.user_id
			 ${whereClause}
			 ORDER BY i.created_at DESC`,
			values,
		);

		return res.status(200).json(result.rows);
	} catch (err) {
		return res.status(500).json(errorResponse(err.message));
	}
};

exports.deleteInvestorDocument = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { documentId } = req.params;

		// Verify document belongs to investor
		const docResult = await pool.query(
			`SELECT id.*, i.user_id 
			 FROM investor_documents id
			 JOIN investors i ON i.investor_id = id.investor_id
			 WHERE id.investor_document_id = $1`,
			[documentId],
		);

		if (!docResult.rowCount) {
			return res.status(404).json(errorResponse("Document not found"));
		}

		if (docResult.rows[0].user_id !== userId) {
			return res
				.status(403)
				.json(errorResponse("Unauthorized to delete this document"));
		}

		const filePath = docResult.rows[0].file_path;

		// Delete file from disk
		if (filePath && fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}

		// Delete from database
		await pool.query(
			"DELETE FROM investor_documents WHERE investor_document_id = $1",
			[documentId],
		);

		return res
			.status(200)
			.json(successResponse({}, "Document deleted successfully"));
	} catch (err) {
		return res.status(500).json(errorResponse(err.message));
	}
};

exports.updateInvestorDocument = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { documentId } = req.params;

		if (!req.files || !req.files.document) {
			return res.status(400).json(errorResponse("No document file provided"));
		}

		// Verify document belongs to investor
		const docResult = await pool.query(
			`SELECT id.*, i.user_id 
			 FROM investor_documents id
			 JOIN investors i ON i.investor_id = id.investor_id
			 WHERE id.investor_document_id = $1`,
			[documentId],
		);

		if (!docResult.rowCount) {
			return res.status(404).json(errorResponse("Document not found"));
		}

		if (docResult.rows[0].user_id !== userId) {
			return res
				.status(403)
				.json(errorResponse("Unauthorized to update this document"));
		}

		// Delete old file
		const oldFilePath = docResult.rows[0].file_path;
		if (oldFilePath && fs.existsSync(oldFilePath)) {
			fs.unlinkSync(oldFilePath);
		}

		// Upload new file
		const file = req.files.document[0];
		const updated = await pool.query(
			`UPDATE investor_documents 
			 SET file_name = $1, file_path = $2, file_type = $3, file_size_bytes = $4
			 WHERE investor_document_id = $5
			 RETURNING *`,
			[file.originalname, file.path, file.mimetype, file.size, documentId],
		);

		return res
			.status(200)
			.json(successResponse(updated.rows[0], "Document updated successfully"));
	} catch (err) {
		return res.status(500).json(errorResponse(err.message));
	}
};

exports.discoverStartups = async (req, res) => {
	try {
		const {
			q,
			industry,
			stage,
			location,
			min_funding,
			max_funding,
			limit = 100,
			offset = 0,
		} = req.query || {};

		const filters = ["u.is_active = true", "u.is_approved = true"];
		const values = [];

		if (q) {
			values.push(`%${q}%`);
			filters.push(
				`(s.startup_name ILIKE $${values.length} OR s.description ILIKE $${values.length})`,
			);
		}
		if (industry) {
			values.push(`%${industry}%`);
			filters.push(`s.industry ILIKE $${values.length}`);
		}
		if (stage) {
			values.push(`%${stage}%`);
			filters.push(`s.business_stage ILIKE $${values.length}`);
		}
		if (location) {
			values.push(`%${location}%`);
			filters.push(`s.location ILIKE $${values.length}`);
		}
		if (min_funding !== undefined && min_funding !== "") {
			const parsed = Number(min_funding);
			if (Number.isNaN(parsed) || parsed < 0) {
				return res
					.status(400)
					.json({ error: "min_funding must be a non-negative number" });
			}
			values.push(parsed);
			filters.push(`COALESCE(s.funding_needed, 0) >= $${values.length}`);
		}
		if (max_funding !== undefined && max_funding !== "") {
			const parsed = Number(max_funding);
			if (Number.isNaN(parsed) || parsed < 0) {
				return res
					.status(400)
					.json({ error: "max_funding must be a non-negative number" });
			}
			values.push(parsed);
			filters.push(`COALESCE(s.funding_needed, 0) <= $${values.length}`);
		}

		values.push(Number(limit) || 100);
		values.push(Number(offset) || 0);

		const result = await pool.query(
			`SELECT
				s.*,
				u.user_id,
				u.first_name,
				u.last_name,
				u.email,
				COUNT(DISTINCT p.project_id) AS project_count,
				COALESCE(SUM(p.amount_raised), 0) AS total_raised
			 FROM startups s
			 JOIN users u ON u.user_id = s.user_id
			 LEFT JOIN projects p ON p.startup_id = s.startup_id
			 WHERE ${filters.join(" AND ")}
			 GROUP BY s.startup_id, u.user_id
			 ORDER BY s.created_at DESC
			 LIMIT $${values.length - 1} OFFSET $${values.length}`,
			values,
		);

		return res.json({ startups: result.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getStartupDetails = async (req, res) => {
	try {
		const startupId = Number(req.params.startupId);
		if (!Number.isInteger(startupId) || startupId <= 0) {
			return res.status(400).json({ error: "Invalid startup id" });
		}

		const result = await pool.query(
			`SELECT s.*, u.user_id, u.first_name, u.last_name, u.email
			 FROM startups s
			 JOIN users u ON u.user_id = s.user_id
			 WHERE s.startup_id = $1
			   AND u.is_active = true
			   AND u.is_approved = true`,
			[startupId],
		);

		if (!result.rowCount) {
			return res.status(404).json({ error: "Startup not found" });
		}

		const [projects, documents, feedback] = await Promise.all([
			pool.query(
				`SELECT *
				 FROM projects
				 WHERE startup_id = $1 AND status <> 'cancelled'
				 ORDER BY created_at DESC`,
				[startupId],
			),
			pool.query(
				`SELECT document_id, file_name, file_path, file_type, file_size_bytes, description, created_at
				 FROM documents
				 WHERE startup_id = $1
				 ORDER BY created_at DESC`,
				[startupId],
			),
			pool.query(
				`SELECT rating, comment, created_at
				 FROM investor_feedback
				 WHERE startup_id = $1
				 ORDER BY created_at DESC`,
				[startupId],
			),
		]);

		const startup = result.rows[0];
		startup.projects = projects.rows;
		startup.documents = documents.rows;
		startup.investor_feedback = feedback.rows;

		return res.json({ startup });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getStartupRecommendations = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const investorResult = await pool.query(
			"SELECT * FROM investors WHERE user_id = $1",
			[userId],
		);
		if (!investorResult.rowCount) {
			return res.status(404).json({ error: "Investor profile not found" });
		}
		const investor = investorResult.rows[0];

		const result = await pool.query(
			`SELECT
				s.*,
				u.first_name,
				u.last_name,
				u.email,
				(
					CASE WHEN investor.preferred_industry IS NOT NULL
					      AND s.industry ILIKE '%' || investor.preferred_industry || '%' THEN 40 ELSE 0 END
					+ CASE WHEN investor.investment_stage IS NOT NULL
					      AND s.business_stage ILIKE '%' || investor.investment_stage || '%' THEN 30 ELSE 0 END
					+ CASE WHEN investor.investment_budget IS NOT NULL
					      AND COALESCE(s.funding_needed, 0) <= investor.investment_budget THEN 20 ELSE 0 END
					+ CASE WHEN investor.country IS NOT NULL
					      AND s.location ILIKE '%' || investor.country || '%' THEN 10 ELSE 0 END
				) AS match_score
			 FROM startups s
			 JOIN users u ON u.user_id = s.user_id
			 CROSS JOIN (SELECT $1::text AS preferred_industry,
			                    $2::text AS investment_stage,
			                    $3::numeric AS investment_budget,
			                    $4::text AS country) investor
			 WHERE u.is_active = true AND u.is_approved = true
			 ORDER BY match_score DESC, s.created_at DESC
			 LIMIT 20`,
			[
				investor.preferred_industry,
				investor.investment_stage,
				investor.investment_budget,
				investor.country,
			],
		);

		return res.json({
			recommendations: result.rows,
			method: "rule_based_profile_match",
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getInvestmentPortfolio = async (req, res) => {
	try {
		const investorResult = await pool.query(
			"SELECT investor_id FROM investors WHERE user_id = $1",
			[req.user.user_id],
		);
		if (!investorResult.rowCount) {
			return res.status(404).json({ error: "Investor profile not found" });
		}

		const result = await pool.query(
			`SELECT
				inv.*,
				ir.project_id,
				p.project_title,
				p.funding_goal,
				p.amount_raised,
				s.startup_id,
				s.startup_name,
				s.industry
			 FROM investments inv
			 JOIN investment_requests ir ON ir.investment_request_id = inv.investment_request_id
			 JOIN projects p ON p.project_id = ir.project_id
			 JOIN startups s ON s.startup_id = ir.startup_id
			 WHERE ir.investor_id = $1
			 ORDER BY inv.created_at DESC`,
			[investorResult.rows[0].investor_id],
		);

		const totalCommitted = result.rows.reduce(
			(sum, row) =>
				["pending", "completed"].includes(row.status)
					? sum + Number(row.amount || 0)
					: sum,
			0,
		);
		const totalCompleted = result.rows.reduce(
			(sum, row) =>
				row.status === "completed" ? sum + Number(row.amount || 0) : sum,
			0,
		);

		return res.json({
			summary: {
				total_committed: totalCommitted,
				total_completed: totalCompleted,
				investment_count: result.rowCount,
			},
			portfolio: result.rows,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};
