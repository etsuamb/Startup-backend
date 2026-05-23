const pool = require("../config/db");

async function ensureInvestmentRequestDirectionSchema(client = pool) {
	await client.query("ALTER TABLE investment_requests ALTER COLUMN project_id DROP NOT NULL");
	await client.query("ALTER TABLE investment_requests ADD COLUMN IF NOT EXISTS initiated_by VARCHAR(20) NOT NULL DEFAULT 'startup'");
	await client.query("ALTER TABLE investment_requests DROP CONSTRAINT IF EXISTS investment_requests_initiated_by_check");
	await client.query("ALTER TABLE investment_requests ADD CONSTRAINT investment_requests_initiated_by_check CHECK (initiated_by IN ('startup', 'investor'))");
}

// UC_13b: Create/Update Investor Profile
exports.createInvestorProfile = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const {
			investor_type,
			organization_name,
			investment_budget,
			preferred_industry,
			investment_stage,
			country,
			portfolio_size,
		} = req.body;

		// Check if profile exists
		const existing = await pool.query(
			"SELECT investor_id FROM investors WHERE user_id = $1",
			[userId]
		);

		if (existing.rows.length > 0) {
			// Update existing
			const result = await pool.query(
				`UPDATE investors SET investor_type = $1, organization_name = $2, investment_budget = $3,
				 preferred_industry = $4, investment_stage = $5, country = $6, portfolio_size = $7
				 WHERE user_id = $8 RETURNING *`,
				[
					investor_type,
					organization_name,
					investment_budget,
					preferred_industry,
					investment_stage,
					country,
					portfolio_size,
					userId,
				]
			);
			return res.json(result.rows[0]);
		}

		// Create new
		const result = await pool.query(
			`INSERT INTO investors (user_id, investor_type, organization_name, investment_budget,
			 preferred_industry, investment_stage, country, portfolio_size)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
			[
				userId,
				investor_type,
				organization_name,
				investment_budget,
				preferred_industry,
				investment_stage,
				country,
				portfolio_size,
			]
		);

		res.status(201).json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.getMyInvestorProfile = async (req, res) => {
	try {
		const result = await pool.query(
			`SELECT i.*, u.first_name, u.last_name, u.email, u.phone_number, u.is_approved, u.is_active
			 FROM investors i
			 JOIN users u ON u.user_id = i.user_id
			 WHERE i.user_id = $1`,
			[req.user.user_id]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ message: "Investor profile not found" });
		}

		res.json({ investor: result.rows[0] });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_14: View Startup List (Curated)
exports.listStartups = async (req, res) => {
	try {
		const { page = 1, limit = 20 } = req.query;
		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		const visibilityWhere = `
			u.is_approved = true
			AND u.is_active = true
			AND COALESCE(s.is_listed, false) = true
			AND COALESCE(s.admin_status, 'Pending') IN ('Active', 'Funded')
		`;

		const countResult = await pool.query(
			`SELECT COUNT(*) as total FROM startups s JOIN users u ON s.user_id = u.user_id WHERE ${visibilityWhere}`,
		);
		const total = parseInt(countResult.rows[0].total);

		const result = await pool.query(
			`SELECT s.startup_id, s.startup_name, s.industry, s.description, s.business_stage, s.team_size,
			 s.location, s.website, s.funding_needed, s.created_at
			 FROM startups s
			 JOIN users u ON s.user_id = u.user_id
			 WHERE ${visibilityWhere}
			 ORDER BY s.created_at DESC
			 LIMIT $1 OFFSET $2`,
			[limitNum, offset]
		);

		res.json({ startups: result.rows, total, page: pageNum, limit: limitNum });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_15: Search & Filter Startups
exports.searchStartups = async (req, res) => {
	try {
		const {
			industry,
			stage,
			location,
			funding_min,
			funding_max,
			search,
			page = 1,
			limit = 20,
		} = req.query;

		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		let query =
			`SELECT s.* FROM startups s JOIN users u ON s.user_id = u.user_id
			 WHERE u.is_approved = true
			   AND u.is_active = true
			   AND COALESCE(s.is_listed, false) = true
			   AND COALESCE(s.admin_status, 'Pending') IN ('Active', 'Funded')`;
		const params = [];

		if (industry) {
			params.push(industry);
			query += ` AND s.industry = $${params.length}`;
		}

		if (stage) {
			params.push(stage);
			query += ` AND s.business_stage = $${params.length}`;
		}

		if (location) {
			params.push(`%${location}%`);
			query += ` AND s.location ILIKE $${params.length}`;
		}

		if (funding_min) {
			params.push(funding_min);
			query += ` AND s.funding_needed >= $${params.length}`;
		}

		if (funding_max) {
			params.push(funding_max);
			query += ` AND s.funding_needed <= $${params.length}`;
		}

		if (search) {
			params.push(`%${search}%`);
			query += ` AND (s.startup_name ILIKE $${params.length} OR s.description ILIKE $${params.length})`;
		}

		const countQuery = query.replace(/SELECT s\.\*/, "SELECT COUNT(*) as total");
		const countResult = await pool.query(countQuery, params);
		const total = parseInt(countResult.rows[0].total);

		query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
		params.push(limitNum, offset);

		const result = await pool.query(query, params);

		res.json({
			startups: result.rows,
			total,
			page: pageNum,
			limit: limitNum,
			filters: { industry, stage, location, funding_min, funding_max },
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

function normalizeRecommendationText(value) {
	return String(value || "")
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.split(/\s+/)
		.filter((word) => word.length > 2);
}

function tokenSimilarity(left, right) {
	const leftTokens = new Set(normalizeRecommendationText(left));
	const rightTokens = new Set(normalizeRecommendationText(right));
	if (!leftTokens.size || !rightTokens.size) return 0;

	let overlap = 0;
	for (const token of leftTokens) {
		if (rightTokens.has(token)) overlap += 1;
	}

	return overlap / Math.max(leftTokens.size, rightTokens.size);
}

function buildInvestorRecommendationText(investor) {
	return [
		investor.investor_type,
		investor.organization_name,
		investor.preferred_industry,
		investor.investment_stage,
		investor.location_preference,
		investor.country,
		investor.bio,
		investor.investment_budget ? `budget ${investor.investment_budget}` : "",
		investor.portfolio_size ? `portfolio ${investor.portfolio_size}` : "",
	].filter(Boolean).join(" ");
}

function buildStartupRecommendationText(startup) {
	return [
		startup.startup_name,
		startup.industry,
		startup.business_stage,
		startup.startup_type,
		startup.startup_tagline,
		startup.description,
		startup.location,
		startup.region,
		startup.city,
		startup.project_title,
		startup.project_description,
		startup.project_industry,
		startup.lifecycle_stage,
		startup.problem_statement,
		startup.solution_statement,
		startup.expected_impact,
	].filter(Boolean).join(" ");
}

function sameValue(left, right) {
	return Boolean(left && right && String(left).trim().toLowerCase() === String(right).trim().toLowerCase());
}

function containsValue(left, right) {
	return Boolean(
		left &&
		right &&
		String(left).toLowerCase().includes(String(right).toLowerCase())
	);
}

// UC_16: AI Startup Recommendations
exports.getStartupRecommendations = async (req, res) => {
	try {
		const investorId = req.params.investorId || req.user.user_id;
		const limitNum = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 10));

		const investorRes = await pool.query(
			"SELECT * FROM investors WHERE user_id = $1",
			[investorId]
		);

		if (investorRes.rows.length === 0) {
			return res.status(404).json({ message: "Investor profile not found" });
		}

		const investor = investorRes.rows[0];
		const investorText = buildInvestorRecommendationText(investor);

		const result = await pool.query(
			`SELECT
				 s.*,
				 p.project_id,
				 p.project_title,
				 p.description AS project_description,
				 p.funding_goal,
				 p.amount_raised,
				 p.status AS project_status,
				 p.industry AS project_industry,
				 p.lifecycle_stage,
				 p.problem_statement,
				 p.solution_statement,
				 p.expected_impact
			 FROM startups s
			 JOIN users u ON s.user_id = u.user_id
			 LEFT JOIN LATERAL (
				SELECT *
				FROM projects p
				WHERE p.startup_id = s.startup_id
				  AND p.status IN ('active', 'funded')
				ORDER BY
				  CASE WHEN p.status = 'active' THEN 0 ELSE 1 END,
				  p.created_at DESC
				LIMIT 1
			 ) p ON true
			 WHERE u.is_approved = true
			   AND u.is_active = true
			   AND COALESCE(s.is_listed, false) = true
			   AND COALESCE(s.admin_status, 'Pending') IN ('Active', 'Funded')
			 ORDER BY s.created_at DESC
			 LIMIT 100`
		);

		const recommendations = result.rows
			.map((startup) => {
				const reasons = [];
				let ruleScore = 0;
				const startupIndustry = startup.project_industry || startup.industry;
				const startupStage = startup.lifecycle_stage || startup.business_stage;
				const fundingNeed = Number(startup.funding_goal || startup.funding_needed || 0);
				const investmentBudget = Number(investor.investment_budget || 0);

				if (
					sameValue(investor.preferred_industry, startupIndustry) ||
					containsValue(investor.preferred_industry, startupIndustry) ||
					containsValue(startupIndustry, investor.preferred_industry)
				) {
					ruleScore += 0.32;
					reasons.push("Industry matches your investment preference");
				}

				if (
					sameValue(investor.investment_stage, startupStage) ||
					containsValue(investor.investment_stage, startupStage) ||
					containsValue(startupStage, investor.investment_stage)
				) {
					ruleScore += 0.22;
					reasons.push("Startup stage fits your preferred stage");
				}

				if (investmentBudget > 0 && fundingNeed > 0) {
					const ratio = fundingNeed / investmentBudget;
					if (ratio <= 1) {
						ruleScore += 0.18;
						reasons.push("Funding need is within your stated budget");
					} else if (ratio <= 1.5) {
						ruleScore += 0.08;
						reasons.push("Funding need is close to your investment budget");
					}
				}

				if (
					investor.location_preference &&
					containsValue(`${startup.location || ""} ${startup.region || ""} ${startup.city || ""}`, investor.location_preference)
				) {
					ruleScore += 0.08;
					reasons.push("Location aligns with your preference");
				}

				const similarityScore = tokenSimilarity(investorText, buildStartupRecommendationText(startup));
				const finalScore = Math.min(0.99, Math.max(0.35, similarityScore * 0.35 + ruleScore + 0.2));
				const score = Number(finalScore.toFixed(2));

				return {
					startup: {
						startup_id: startup.startup_id,
						startup_name: startup.startup_name,
						industry: startup.industry,
						description: startup.description,
						business_stage: startup.business_stage,
						team_size: startup.team_size,
						location: startup.location || startup.city || startup.region,
						website: startup.website,
						funding_needed: startup.funding_needed,
					},
					project: startup.project_id ? {
						project_id: startup.project_id,
						project_title: startup.project_title,
						description: startup.project_description,
						funding_goal: startup.funding_goal,
						amount_raised: startup.amount_raised,
						status: startup.project_status,
						industry: startup.project_industry,
						lifecycle_stage: startup.lifecycle_stage,
					} : null,
					score,
					match_percent: Math.round(score * 100),
					similarityScore: Number(similarityScore.toFixed(3)),
					ruleScore: Number(ruleScore.toFixed(3)),
					finalScore: score,
					reasons,
					reason: reasons.join(", ") || "Profile details are related to your investor preferences",
				};
			})
			.sort((a, b) => b.finalScore - a.finalScore)
			.slice(0, limitNum);

		res.json({
			recommendations,
			source: "ai-reccommendation/adapted",
			investor_preferences: {
				preferred_industry: investor.preferred_industry,
				investment_stage: investor.investment_stage,
				investment_budget: investor.investment_budget,
				location_preference: investor.location_preference,
			},
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_17: View Detailed Startup Profile
exports.getStartupDetails = async (req, res) => {
	try {
		const { startupId } = req.params;

		const startupRes = await pool.query(
			"SELECT * FROM startups WHERE startup_id = $1",
			[startupId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup not found" });
		}

		const startup = startupRes.rows[0];

		// Get documents
		const documentsRes = await pool.query(
			"SELECT * FROM documents WHERE startup_id = $1",
			[startupId]
		);

		// Get projects
		const projectsRes = await pool.query(
			"SELECT * FROM projects WHERE startup_id = $1",
			[startupId]
		);

		res.json({ startup, documents: documentsRes.rows, projects: projectsRes.rows });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_18: Send Funding Offer to Startup
exports.sendFundingOffer = async (req, res) => {
	try {
		const investorId = req.user.user_id;
		const { startup_id, project_id, amount, requested_amount, proposal_message, message } =
			req.body;
		const requestedAmount = Number(requested_amount ?? amount);

		if (!startup_id || !requestedAmount) {
			return res.status(400).json({
				error: "startup_id and requested_amount are required",
			});
		}
		if (Number.isNaN(requestedAmount) || requestedAmount <= 0) {
			return res.status(400).json({ error: "requested_amount must be a positive number" });
		}

		// Get investor details
		const investorRes = await pool.query(
			"SELECT investor_id FROM investors WHERE user_id = $1",
			[investorId]
		);

		if (investorRes.rows.length === 0) {
			return res.status(404).json({ message: "Investor profile not found" });
		}

		const investor_id_pk = investorRes.rows[0].investor_id;
		let projectId = project_id ? Number(project_id) : null;

		if (projectId && (!Number.isInteger(projectId) || projectId <= 0)) {
			return res.status(400).json({ error: "project_id must be a valid integer" });
		}

		if (!projectId) {
			const projectRes = await pool.query(
				`SELECT project_id
				 FROM projects
				 WHERE startup_id = $1 AND status IN ('active', 'draft')
				 ORDER BY status = 'active' DESC, created_at DESC
				 LIMIT 1`,
				[startup_id]
			);

			if (projectRes.rows.length === 0) {
				return res.status(404).json({
					message: "No project found for this startup. Select a startup project before sending an offer.",
				});
			}
			projectId = projectRes.rows[0].project_id;
		}

		await ensureInvestmentRequestDirectionSchema();

		// Create investment request
		const result = await pool.query(
			`INSERT INTO investment_requests (startup_id, investor_id, project_id, requested_amount, proposal_message, status, initiated_by)
			 VALUES ($1, $2, $3, $4, $5, 'pending', 'investor') RETURNING *`,
			[startup_id, investor_id_pk, projectId, requestedAmount, proposal_message || message || null]
		);

		// Notify startup
		await pool.query(
			"INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id) SELECT user_id, $1, $2, $3, $4, $5 FROM startups WHERE startup_id = $6",
			[
				"investment",
				"New Funding Offer",
				`You received a funding offer of ${requestedAmount}`,
				"investment_requests",
				result.rows[0].investment_request_id,
				startup_id,
			]
		);

		res.status(201).json({
			message: "Funding offer sent",
			offer: result.rows[0],
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.getFundingOffers = async (req, res) => {
	try {
		await ensureInvestmentRequestDirectionSchema();

		const investorRes = await pool.query(
			"SELECT investor_id FROM investors WHERE user_id = $1",
			[req.user.user_id]
		);

		if (investorRes.rows.length === 0) {
			return res.status(404).json({ message: "Investor profile not found" });
		}

		const result = await pool.query(
			`SELECT ir.*,
			        s.startup_name,
			        s.industry,
			        s.business_stage,
			        COALESCE(ir.initiated_by, 'startup') AS initiated_by,
			        COALESCE(p.project_title, 'General funding request') AS project_title
			 FROM investment_requests ir
			 JOIN startups s ON s.startup_id = ir.startup_id
			 LEFT JOIN projects p ON p.project_id = ir.project_id
			 WHERE ir.investor_id = $1
			 ORDER BY ir.created_at DESC`,
			[investorRes.rows[0].investor_id]
		);

		res.json({
			investor_id: investorRes.rows[0].investor_id,
			funding_offers: result.rows,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.acceptFundingOffer = async (req, res) => {
	const client = await pool.connect();
	try {
		const { offerId } = req.params;
		const parsedOfferId = Number.parseInt(offerId, 10);

		if (!Number.isInteger(parsedOfferId)) {
			return res.status(400).json({ error: "Invalid funding offer id" });
		}

		await client.query("BEGIN");
		await ensureInvestmentRequestDirectionSchema(client);

		const investorRes = await client.query(
			"SELECT investor_id FROM investors WHERE user_id = $1",
			[req.user.user_id]
		);

		if (investorRes.rows.length === 0) {
			await client.query("ROLLBACK");
			return res.status(404).json({ message: "Investor profile not found" });
		}

		const requestRes = await client.query(
			`SELECT investment_request_id, startup_id, investor_id, project_id, requested_amount, status
			 FROM investment_requests
			 WHERE investment_request_id = $1 AND investor_id = $2
			 FOR UPDATE`,
			[parsedOfferId, investorRes.rows[0].investor_id]
		);

		if (requestRes.rows.length === 0) {
			await client.query("ROLLBACK");
			return res.status(404).json({ error: "Funding offer not found" });
		}

		const request = requestRes.rows[0];
		if (request.status !== "pending") {
			await client.query("ROLLBACK");
			return res.status(409).json({ error: "Only pending funding offers can be accepted" });
		}

		const updatedRes = await client.query(
			`UPDATE investment_requests
			 SET status = 'approved'
			 WHERE investment_request_id = $1
			 RETURNING *`,
			[parsedOfferId]
		);

		const investmentRes = await client.query(
			`INSERT INTO investments (investment_request_id, amount, status, closed_at)
			 VALUES ($1, $2, 'completed', CURRENT_TIMESTAMP)
			 ON CONFLICT (investment_request_id) DO NOTHING
			 RETURNING investment_id`,
			[parsedOfferId, request.requested_amount]
		);

		if (investmentRes.rows.length > 0) {
			await client.query(
				`UPDATE projects
				 SET amount_raised = COALESCE(amount_raised, 0) + $1
				 WHERE project_id = $2`,
				[request.requested_amount, request.project_id]
			);
		}

		await client.query("COMMIT");
		return res.json({
			message: "Funding offer accepted",
			offer: updatedRes.rows[0],
		});
	} catch (err) {
		await client.query("ROLLBACK").catch(() => {});
		return res.status(500).json({ error: err.message });
	} finally {
		client.release();
	}
};

exports.withdrawFundingOffer = async (req, res) => {
	try {
		await ensureInvestmentRequestDirectionSchema();

		const { offerId } = req.params;
		const parsedOfferId = Number.parseInt(offerId, 10);

		if (!Number.isInteger(parsedOfferId)) {
			return res.status(400).json({ error: "Invalid funding offer id" });
		}

		const investorRes = await pool.query(
			"SELECT investor_id FROM investors WHERE user_id = $1",
			[req.user.user_id]
		);

		if (investorRes.rows.length === 0) {
			return res.status(404).json({ message: "Investor profile not found" });
		}

		const requestRes = await pool.query(
			`SELECT investment_request_id, status
			 FROM investment_requests
			 WHERE investment_request_id = $1 AND investor_id = $2`,
			[parsedOfferId, investorRes.rows[0].investor_id]
		);

		if (requestRes.rows.length === 0) {
			return res.status(404).json({ error: "Funding offer not found" });
		}

		if (requestRes.rows[0].status !== "pending") {
			return res.status(409).json({ error: "Only pending funding offers can be withdrawn" });
		}

		const updatedRes = await pool.query(
			`UPDATE investment_requests
			 SET status = 'withdrawn'
			 WHERE investment_request_id = $1
			 RETURNING *`,
			[parsedOfferId]
		);

		return res.json({
			message: "Funding offer withdrawn",
			offer: updatedRes.rows[0],
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// UC_20: Get Investment Portfolio
exports.getPortfolio = async (req, res) => {
	try {
		const investorId = req.user.user_id;

		const investorRes = await pool.query(
			"SELECT investor_id FROM investors WHERE user_id = $1",
			[investorId]
		);

		if (investorRes.rows.length === 0) {
			return res.status(404).json({ message: "Investor profile not found" });
		}

		const investor_id_pk = investorRes.rows[0].investor_id;

		// Get all investments by this investor
		const investmentsRes = await pool.query(
			`SELECT i.*, s.startup_name, p.project_title
			 FROM investments i
			 JOIN investment_requests ir ON i.investment_request_id = ir.investment_request_id
			 JOIN startups s ON ir.startup_id = s.startup_id
			 LEFT JOIN projects p ON ir.project_id = p.project_id
			 WHERE ir.investor_id = $1`,
			[investor_id_pk]
		);

		const totalInvested = investmentsRes.rows.reduce(
			(sum, inv) => sum + (parseFloat(inv.amount) || 0),
			0
		);

		res.json({
			startups: investmentsRes.rows,
			total_investments: investmentsRes.rows.length,
			total_value: totalInvested,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

async function getInvestorIdForUser(userId) {
	const investorRes = await pool.query(
		"SELECT investor_id FROM investors WHERE user_id = $1",
		[userId]
	);
	return investorRes.rows[0]?.investor_id || null;
}

async function getAcceptedInvestmentRequest(startupId, investorId) {
	const result = await pool.query(
		`SELECT investment_request_id, startup_id, investor_id, requested_amount, status
		 FROM investment_requests
		 WHERE startup_id = $1
		   AND investor_id = $2
		   AND status IN ('approved', 'accepted')
		 ORDER BY created_at DESC
		 LIMIT 1`,
		[startupId, investorId]
	);
	return result.rows[0] || null;
}

async function ensureInvestorMeetingsSchema() {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS investor_meetings (
			investor_meeting_id SERIAL PRIMARY KEY,
			startup_id INTEGER NOT NULL REFERENCES startups(startup_id) ON DELETE CASCADE,
			investor_id INTEGER NOT NULL REFERENCES investors(investor_id) ON DELETE CASCADE,
			investment_request_id INTEGER REFERENCES investment_requests(investment_request_id) ON DELETE SET NULL,
			topic VARCHAR(255) NOT NULL DEFAULT 'Investment follow-up',
			scheduled_at TIMESTAMPTZ NOT NULL,
			duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
			meeting_link TEXT,
			status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
			created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`);
	await pool.query("CREATE INDEX IF NOT EXISTS idx_investor_meetings_startup ON investor_meetings (startup_id, scheduled_at DESC)");
	await pool.query("CREATE INDEX IF NOT EXISTS idx_investor_meetings_investor ON investor_meetings (investor_id, scheduled_at DESC)");
}

exports.getMeetings = async (req, res) => {
	try {
		await ensureInvestorMeetingsSchema();
		const investorId = await getInvestorIdForUser(req.user.user_id);
		if (!investorId) {
			return res.status(404).json({ message: "Investor profile not found" });
		}

		const result = await pool.query(
			`SELECT im.*, s.startup_name, s.industry, s.business_stage,
			        ir.requested_amount, ir.status AS offer_status
			 FROM investor_meetings im
			 JOIN startups s ON s.startup_id = im.startup_id
			 LEFT JOIN investment_requests ir ON ir.investment_request_id = im.investment_request_id
			 WHERE im.investor_id = $1
			 ORDER BY im.scheduled_at ASC`,
			[investorId]
		);

		return res.json({ meetings: result.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.createMeeting = async (req, res) => {
	try {
		await ensureInvestorMeetingsSchema();
		const investorId = await getInvestorIdForUser(req.user.user_id);
		if (!investorId) {
			return res.status(404).json({ message: "Investor profile not found" });
		}

		const { startup_id, scheduled_at, topic, meeting_link, duration_minutes } = req.body || {};
		const startupId = Number(startup_id);
		const duration = Number(duration_minutes || 30);
		const scheduledAt = new Date(scheduled_at);

		if (!Number.isInteger(startupId) || startupId <= 0) {
			return res.status(400).json({ error: "startup_id is required" });
		}
		if (Number.isNaN(scheduledAt.getTime())) {
			return res.status(400).json({ error: "scheduled_at must be a valid date/time" });
		}
		if (!Number.isInteger(duration) || duration <= 0) {
			return res.status(400).json({ error: "duration_minutes must be a positive integer" });
		}

		const startupRes = await pool.query(
			"SELECT startup_id, user_id, startup_name FROM startups WHERE startup_id = $1",
			[startupId]
		);
		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup not found" });
		}

		const acceptedOffer = await getAcceptedInvestmentRequest(startupId, investorId);
		if (!acceptedOffer) {
			return res.status(403).json({ error: "Meetings can be scheduled only after an investment offer is accepted." });
		}

		const result = await pool.query(
			`INSERT INTO investor_meetings
			   (startup_id, investor_id, investment_request_id, topic, scheduled_at, duration_minutes, meeting_link, status)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
			 RETURNING *`,
			[
				startupId,
				investorId,
				acceptedOffer.investment_request_id,
				String(topic || "Investment follow-up").trim() || "Investment follow-up",
				scheduledAt,
				duration,
				meeting_link || null,
			]
		);

		await pool.query(
			`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
			 VALUES ($1, 'meeting', 'New investor meeting', $2, 'investor_meetings', $3)`,
			[
				startupRes.rows[0].user_id,
				`A meeting was scheduled for ${startupRes.rows[0].startup_name}.`,
				result.rows[0].investor_meeting_id,
			]
		);

		return res.status(201).json({ meeting: result.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.updateMeeting = async (req, res) => {
	try {
		await ensureInvestorMeetingsSchema();
		const investorId = await getInvestorIdForUser(req.user.user_id);
		if (!investorId) {
			return res.status(404).json({ message: "Investor profile not found" });
		}

		const meetingId = Number(req.params.meetingId);
		if (!Number.isInteger(meetingId) || meetingId <= 0) {
			return res.status(400).json({ error: "Invalid meeting id" });
		}

		const { status, meeting_link } = req.body || {};
		const allowed = ["pending", "confirmed", "completed", "cancelled"];
		if (status && !allowed.includes(status)) {
			return res.status(400).json({ error: "Invalid meeting status" });
		}

		const result = await pool.query(
			`UPDATE investor_meetings
			 SET status = COALESCE($1, status),
			     meeting_link = COALESCE($2, meeting_link),
			     updated_at = CURRENT_TIMESTAMP
			 WHERE investor_meeting_id = $3 AND investor_id = $4
			 RETURNING *`,
			[status || null, meeting_link || null, meetingId, investorId]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "Meeting not found" });
		}

		return res.json({ meeting: result.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// UC_23: Chat with Startup
exports.getMessageThreads = async (req, res) => {
	try {
		const investorUserId = req.user.user_id;

		const result = await pool.query(
			`SELECT s.startup_id, s.startup_name, s.industry, s.business_stage,
			        MAX(m.created_at) AS last_message_at,
			        (ARRAY_AGG(m.body ORDER BY m.created_at DESC))[1] AS last_message_preview,
			        COUNT(*) FILTER (WHERE m.receiver_user_id = $1 AND m.is_read = false)::int AS unread_count
			 FROM messages m
			 JOIN startups s ON s.user_id = CASE
			   WHEN m.sender_user_id = $1 THEN m.receiver_user_id
			   ELSE m.sender_user_id
			 END
			 WHERE m.sender_user_id = $1 OR m.receiver_user_id = $1
			 GROUP BY s.startup_id, s.startup_name, s.industry, s.business_stage
			 ORDER BY last_message_at DESC`,
			[investorUserId]
		);

		res.json({ conversations: result.rows });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.sendMessage = async (req, res) => {
	try {
		const investorUserId = req.user.user_id;
		const { startupId } = req.params;
		const { message } = req.body;
		const text = String(message || "").trim();

		if (!text) {
			return res.status(400).json({ error: "message is required" });
		}

		// Get startup user_id
		const startupRes = await pool.query(
			"SELECT user_id FROM startups WHERE startup_id = $1",
			[startupId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup not found" });
		}

		const startupUserId = startupRes.rows[0].user_id;
		const investorRes = await pool.query(
			"SELECT investor_id FROM investors WHERE user_id = $1",
			[investorUserId]
		);
		if (investorRes.rows.length === 0) {
			return res.status(404).json({ message: "Investor profile not found" });
		}
		const acceptedRes = await pool.query(
			`SELECT 1 FROM investment_requests
			 WHERE startup_id = $1 AND investor_id = $2 AND status IN ('approved', 'accepted')
			 LIMIT 1`,
			[startupId, investorRes.rows[0].investor_id]
		);
		if (acceptedRes.rowCount === 0) {
			return res.status(403).json({ error: "Chat is available only after an investment offer is accepted." });
		}

		// Save message
		const result = await pool.query(
			`INSERT INTO messages (sender_user_id, receiver_user_id, body, subject)
			 VALUES ($1, $2, $3, 'Investment Discussion') RETURNING *`,
			[investorUserId, startupUserId, text]
		);

		res.status(201).json({ message: result.rows[0] });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_23: Get Chat Messages
exports.getMessages = async (req, res) => {
	try {
		const investorUserId = req.user.user_id;
		const { startupId } = req.params;
		const { page = 1, limit = 20 } = req.query;

		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		const startupRes = await pool.query(
			"SELECT startup_id, startup_name, user_id FROM startups WHERE startup_id = $1",
			[startupId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup not found" });
		}

		const startupUserId = startupRes.rows[0].user_id;
		const investorRes = await pool.query(
			"SELECT investor_id FROM investors WHERE user_id = $1",
			[investorUserId]
		);
		if (investorRes.rows.length === 0) {
			return res.status(404).json({ message: "Investor profile not found" });
		}
		const acceptedRes = await pool.query(
			`SELECT 1 FROM investment_requests
			 WHERE startup_id = $1 AND investor_id = $2 AND status IN ('approved', 'accepted')
			 LIMIT 1`,
			[startupId, investorRes.rows[0].investor_id]
		);
		if (acceptedRes.rowCount === 0) {
			return res.status(403).json({ error: "Chat is available only after an investment offer is accepted." });
		}

		const result = await pool.query(
			`SELECT * FROM messages 
			 WHERE (sender_user_id = $1 AND receiver_user_id = $2) OR (sender_user_id = $2 AND receiver_user_id = $1)
			 ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
			[investorUserId, startupUserId, limitNum, offset]
		);

		// Mark as read
		await pool.query(
			"UPDATE messages SET is_read = true WHERE receiver_user_id = $1 AND sender_user_id = $2",
			[investorUserId, startupUserId]
		);

		res.json({
			messages: [...result.rows].reverse(),
			current_user_id: investorUserId,
			startup: {
				startup_id: startupRes.rows[0].startup_id,
				startup_name: startupRes.rows[0].startup_name,
			},
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.getRatings = async (req, res) => {
	try {
		const investorRes = await pool.query(
			"SELECT investor_id FROM investors WHERE user_id = $1",
			[req.user.user_id]
		);

		if (investorRes.rows.length === 0) {
			return res.status(404).json({ message: "Investor profile not found" });
		}

		const limit = Math.min(Number(req.query.limit) || 10, 50);
		const result = await pool.query(
			`SELECT f.investor_feedback_id, f.startup_id, f.rating, f.comment, f.created_at,
			        s.startup_name, s.industry, s.business_stage
			 FROM investor_feedback f
			 JOIN startups s ON s.startup_id = f.startup_id
			 WHERE f.investor_id = $1
			 ORDER BY f.created_at DESC
			 LIMIT $2`,
			[investorRes.rows[0].investor_id, limit]
		);

		return res.json({ ratings: result.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// UC_25: Provide Rating to Startup
exports.sendFeedback = async (req, res) => {
	try {
		const investorUserId = req.user.user_id;
		const { startupId } = req.params;
		const { rating, comment, ratings } = req.body;
		const startupIdNumber = Number.parseInt(startupId, 10);

		if (!Number.isInteger(startupIdNumber)) {
			return res.status(400).json({ error: "Invalid startup id" });
		}

		const scores = ratings && typeof ratings === "object"
			? Object.values(ratings).map((value) => Number(value)).filter((value) => Number.isFinite(value))
			: [Number(rating)];
		const finalRating = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);

		const hasInvalidScore = scores.some((value) => !Number.isInteger(value) || value < 1 || value > 5);
		if (!scores.length || hasInvalidScore || !Number.isInteger(finalRating) || finalRating < 1 || finalRating > 5) {
			return res.status(400).json({ error: "rating must be between 1 and 5" });
		}

		const startupRes = await pool.query(
			"SELECT startup_id, user_id, startup_name FROM startups WHERE startup_id = $1",
			[startupIdNumber]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup not found" });
		}

		// Get investor_id
		const investorRes = await pool.query(
			"SELECT investor_id FROM investors WHERE user_id = $1",
			[investorUserId]
		);

		if (investorRes.rows.length === 0) {
			return res.status(404).json({ message: "Investor profile not found" });
		}

		// Create or update investor rating
		const result = await pool.query(
			`INSERT INTO investor_feedback (startup_id, investor_id, rating, comment)
			 VALUES ($1, $2, $3, $4)
			 ON CONFLICT (startup_id, investor_id)
			 DO UPDATE SET rating = EXCLUDED.rating,
			               comment = EXCLUDED.comment,
			               created_at = CURRENT_TIMESTAMP
			 RETURNING *`,
			[startupIdNumber, investorRes.rows[0].investor_id, finalRating, comment || null]
		);

		await pool.query(
			`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			[
				startupRes.rows[0].user_id,
				"rating",
				"New Investor Rating",
				`An investor rated ${startupRes.rows[0].startup_name} ${finalRating}/5.`,
				"investor_feedback",
				result.rows[0].investor_feedback_id,
			]
		);

		res.status(201).json({
			message: "Rating submitted",
			rating: result.rows[0],
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

module.exports = exports;
