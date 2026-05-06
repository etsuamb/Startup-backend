const pool = require("../config/db");
const { normalizeMultipartBody } = require("../utils/requestBody");

exports.getMyInvestorProfile = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const result = await pool.query(
			`SELECT i.*, u.user_id, u.first_name, u.last_name, u.email
			 FROM investors i
			 JOIN users u ON u.user_id = i.user_id
			 WHERE i.user_id = $1`,
			[userId],
		);

		if (!result.rowCount) {
			return res.status(404).json({ error: "Investor profile not found" });
		}

		return res.status(200).json(result.rows[0]);
	} catch (err) {
		return res.status(500).json({ error: err.message });
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
			return res.status(409).json({
				error:
					"Investor profile already exists for this user. Use PUT /api/investors/profile to update.",
			});
		}

		const {
			investor_type,
			organization_name,
			investment_budget,
			preferred_industry,
			investment_stage,
			country,
			portfolio_size,
		} = req.body || {};

		if (!investor_type || typeof investor_type !== "string") {
			return res.status(400).json({
				error: "'investor_type' is required",
			});
		}

		let budgetValue = null;
		if (
			investment_budget !== undefined &&
			investment_budget !== null &&
			investment_budget !== ""
		) {
			const parsedBudget = Number(investment_budget);
			if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
				return res
					.status(400)
					.json({ error: "'investment_budget' must be a non-negative number" });
			}
			budgetValue = parsedBudget;
		}

		let portfolioValue = null;
		if (
			portfolio_size !== undefined &&
			portfolio_size !== null &&
			portfolio_size !== ""
		) {
			const parsedPortfolio = Number(portfolio_size);
			if (!Number.isInteger(parsedPortfolio) || parsedPortfolio < 0) {
				return res.status(400).json({
					error: "'portfolio_size' must be a non-negative integer",
				});
			}
			portfolioValue = parsedPortfolio;
		}

		const result = await pool.query(
			`
INSERT INTO investors(
 user_id,
 investor_type,
 organization_name,
 investment_budget,
 preferred_industry,
 investment_stage,
 country,
 portfolio_size
)
VALUES($1,$2,$3,$4,$5,$6,$7,$8)
RETURNING *
`,
			[
				userId,
				investor_type,
				organization_name,
				budgetValue,
				preferred_industry,
				investment_stage,
				country,
				portfolioValue,
			],
		);

		return res.status(201).json({
			message: "Investor profile created",
			investor: result.rows[0],
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
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
			return res.status(404).json({ error: "Investor profile not found" });
		}

		const {
			investor_type,
			organization_name,
			investment_budget,
			preferred_industry,
			investment_stage,
			country,
			portfolio_size,
		} = req.body || {};

		let budgetValue = null;
		if (
			investment_budget !== undefined &&
			investment_budget !== null &&
			investment_budget !== ""
		) {
			const parsedBudget = Number(investment_budget);
			if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
				return res
					.status(400)
					.json({ error: "'investment_budget' must be a non-negative number" });
			}
			budgetValue = parsedBudget;
		}

		let portfolioValue = null;
		if (
			portfolio_size !== undefined &&
			portfolio_size !== null &&
			portfolio_size !== ""
		) {
			const parsedPortfolio = Number(portfolio_size);
			if (!Number.isInteger(parsedPortfolio) || parsedPortfolio < 0) {
				return res.status(400).json({
					error: "'portfolio_size' must be a non-negative integer",
				});
			}
			portfolioValue = parsedPortfolio;
		}

		const updated = await pool.query(
			`UPDATE investors SET
        investor_type = COALESCE($1, investor_type),
        organization_name = COALESCE($2, organization_name),
        investment_budget = COALESCE($3, investment_budget),
        preferred_industry = COALESCE($4, preferred_industry),
        investment_stage = COALESCE($5, investment_stage),
        country = COALESCE($6, country),
        portfolio_size = COALESCE($7, portfolio_size)
       WHERE user_id = $8
       RETURNING *`,
			[
				investor_type,
				organization_name,
				budgetValue,
				preferred_industry,
				investment_stage,
				country,
				portfolioValue,
				userId,
			],
		);

		return res.status(200).json({
			message: "Investor profile updated",
			investor: updated.rows[0],
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getAllInvestors = async (req, res) => {
	try {
		const { industry, min_budget, max_budget, stage, country } =
			req.query || {};

		const filters = [];
		const values = [];

		// Discovery should return only active and approved users.
		filters.push("u.is_active = true");
		filters.push("u.is_approved = true");

		if (industry) {
			values.push(industry);
			filters.push(`i.preferred_industry ILIKE $${values.length}`);
		}

		if (stage) {
			values.push(stage);
			filters.push(`i.investment_stage ILIKE $${values.length}`);
		}

		if (country) {
			values.push(country);
			filters.push(`i.country ILIKE $${values.length}`);
		}

		if (min_budget !== undefined && min_budget !== "") {
			const parsedMin = Number(min_budget);
			if (Number.isNaN(parsedMin) || parsedMin < 0) {
				return res
					.status(400)
					.json({ error: "'min_budget' must be a non-negative number" });
			}
			values.push(parsedMin);
			filters.push(`i.investment_budget >= $${values.length}`);
		}

		if (max_budget !== undefined && max_budget !== "") {
			const parsedMax = Number(max_budget);
			if (Number.isNaN(parsedMax) || parsedMax < 0) {
				return res
					.status(400)
					.json({ error: "'max_budget' must be a non-negative number" });
			}
			values.push(parsedMax);
			filters.push(`i.investment_budget <= $${values.length}`);
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
		return res.status(500).json({ error: err.message });
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
					      AND s.industry ILIKE investor.preferred_industry THEN 40 ELSE 0 END
					+ CASE WHEN investor.investment_stage IS NOT NULL
					      AND s.business_stage ILIKE investor.investment_stage THEN 30 ELSE 0 END
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
