const pool = require("../config/db");
const profileAccessService = require("../services/profileAccessService");
const profileSanitizer = require("../services/profileSanitizer");

async function getStartupIdByUserId(userId) {
	const r = await pool.query(
		"SELECT startup_id FROM startups WHERE user_id = $1",
		[userId],
	);
	if (r.rowCount === 0) return null;
	return r.rows[0].startup_id;
}

function parsePositiveInt(v, fallback) {
	const n = Number.parseInt(String(v), 10);
	if (!Number.isFinite(n) || n < 1) return fallback;
	return n;
}

/** Join targets before WHERE; favorites LEFT JOIN must sit between FROM and WHERE */
const mentorUserJoin = `
  FROM mentors m
  INNER JOIN users u ON u.user_id = m.user_id
`;

const mentorVisibilityWhere = `
  WHERE u.role = 'Mentor'
    AND u.is_active = TRUE
    AND u.is_approved = TRUE
    AND COALESCE(m.is_approved, FALSE) = TRUE
`;

const investorUserJoin = `
  FROM investors i
  INNER JOIN users u ON u.user_id = i.user_id
`;

const investorVisibilityWhere = `
  WHERE u.role = 'Investor'
    AND u.is_active = TRUE
    AND u.is_approved = TRUE
    AND COALESCE(i.is_approved, FALSE) = TRUE
`;

exports.searchMentors = async (req, res) => {
	try {
		const startupId = await getStartupIdByUserId(req.user.user_id);
		const page = parsePositiveInt(req.query.page, 1);
		const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
		const offset = (page - 1) * limit;

		const industry = req.query.industry
			? String(req.query.industry).trim()
			: "";
		const country = req.query.country ? String(req.query.country).trim() : "";
		const q =
			req.query.q || req.query.search
				? String(req.query.q || req.query.search).trim()
				: "";

		const conds = [];
		const params = [];

		if (industry) {
			params.push(`%${industry}%`);
			const i = params.length;
			conds.push(
				`(m.primary_industry ILIKE $${i} OR m.secondary_industry ILIKE $${i} OR m.expertise ILIKE $${i})`,
			);
		}
		if (country) {
			params.push(`%${country}%`);
			const i = params.length;
			conds.push(`(m.country ILIKE $${i} OR m.city_location ILIKE $${i})`);
		}
		if (q) {
			params.push(`%${q}%`);
			const i = params.length;
			conds.push(
				`(m.headline ILIKE $${i} OR m.expertise ILIKE $${i} OR m.bio ILIKE $${i} OR m.professional_title ILIKE $${i} OR m.current_organization ILIKE $${i} OR m.key_achievement ILIKE $${i} OR u.first_name ILIKE $${i} OR u.last_name ILIKE $${i})`,
			);
		}

		const whereExtra = conds.length ? `AND (${conds.join(" AND ")})` : "";
		const countParams = [...params];

		let favJoin = "";
		if (startupId) {
			params.push(startupId);
			favJoin = `LEFT JOIN startup_discover_favorites f ON f.startup_id = $${params.length}::int AND f.mentor_id = m.mentor_id AND f.investor_id IS NULL`;
		}
		params.push(limit);
		const limIdx = params.length;
		params.push(offset);
		const offIdx = params.length;

		const countSql = `SELECT COUNT(*)::int AS c ${mentorUserJoin} ${mentorVisibilityWhere} ${whereExtra}`;
		const { rows: countRows } = await pool.query(countSql, countParams);
		const total = countRows[0]?.c ?? 0;

		const listSql = `
      SELECT
        m.mentor_id,
        m.headline,
        m.expertise,
        m.years_experience,
        m.hourly_rate,
        m.country,
        m.bio,
        m.professional_title,
        m.languages,
        m.primary_industry,
        m.secondary_industry,
        m.city_location,
        m.session_pricing,
        m.current_organization,
        m.current_title,
        m.mentoring_style,
        m.key_achievement,
        u.first_name,
        u.last_name,
        ${startupId ? "(f.favorite_id IS NOT NULL) AS is_favorite" : "FALSE AS is_favorite"}
      ${mentorUserJoin}
      ${startupId ? favJoin : ""}
      ${mentorVisibilityWhere}
      ${whereExtra}
      ORDER BY m.created_at DESC
      LIMIT $${limIdx} OFFSET $${offIdx}
    `;

		const { rows } = await pool.query(listSql, params);

		return res.json({
			mentors: rows.map((row) => profileSanitizer.sanitizeMentorPublic(row)),
			pagination: { page, limit, total },
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.searchInvestors = async (req, res) => {
	try {
		const startupId = await getStartupIdByUserId(req.user.user_id);
		const page = parsePositiveInt(req.query.page, 1);
		const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
		const offset = (page - 1) * limit;

		const industry = req.query.industry
			? String(req.query.industry).trim()
			: "";
		const country = req.query.country ? String(req.query.country).trim() : "";
		const locationPreference = req.query.location
			? String(req.query.location).trim()
			: "";
		const investorType = req.query.investor_type
			? String(req.query.investor_type).trim()
			: "";
		const q =
			req.query.q || req.query.search
				? String(req.query.q || req.query.search).trim()
				: "";

		const conds = [];
		const params = [];

		if (industry) {
			params.push(`%${industry}%`);
			const i = params.length;
			conds.push(`i.preferred_industry ILIKE $${i}`);
		}
		if (country) {
			params.push(`%${country}%`);
			const i = params.length;
			conds.push(
				`(i.country ILIKE $${i} OR i.location_preference ILIKE $${i})`,
			);
		}
		if (locationPreference) {
			params.push(`%${locationPreference}%`);
			const i = params.length;
			conds.push(
				`(i.country ILIKE $${i} OR i.location_preference ILIKE $${i})`,
			);
		}
		if (investorType) {
			params.push(`%${investorType}%`);
			const i = params.length;
			conds.push(`i.investor_type ILIKE $${i}`);
		}
		if (q) {
			params.push(`%${q}%`);
			const i = params.length;
			conds.push(
				`(i.organization_name ILIKE $${i} OR i.bio ILIKE $${i} OR i.preferred_industry ILIKE $${i} OR u.first_name ILIKE $${i} OR u.last_name ILIKE $${i})`,
			);
		}

		const whereExtra = conds.length ? `AND (${conds.join(" AND ")})` : "";
		const countParams = [...params];

		let favJoin = "";
		if (startupId) {
			params.push(startupId);
			favJoin = `LEFT JOIN startup_discover_favorites f ON f.startup_id = $${params.length}::int AND f.investor_id = i.investor_id AND f.mentor_id IS NULL`;
		}
		params.push(limit);
		const limIdx = params.length;
		params.push(offset);
		const offIdx = params.length;

		const countSql = `SELECT COUNT(*)::int AS c ${investorUserJoin} ${investorVisibilityWhere} ${whereExtra}`;
		const { rows: countRows } = await pool.query(countSql, countParams);
		const total = countRows[0]?.c ?? 0;

		const listSql = `
      SELECT
        i.investor_id,
        i.investor_type,
        i.organization_name,
        i.investment_budget,
        i.preferred_industry,
        i.investment_stage,
        i.location_preference,
        i.bio,
        i.country,
        i.portfolio_size,
        u.first_name,
        u.last_name,
        ${startupId ? "(f.favorite_id IS NOT NULL) AS is_favorite" : "FALSE AS is_favorite"}
      ${investorUserJoin}
      ${startupId ? favJoin : ""}
      ${investorVisibilityWhere}
      ${whereExtra}
      ORDER BY i.created_at DESC
      LIMIT $${limIdx} OFFSET $${offIdx}
    `;

		const { rows } = await pool.query(listSql, params);

		return res.json({
			investors: rows.map((row) =>
				profileSanitizer.sanitizeInvestorPublic(row),
			),
			pagination: { page, limit, total },
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

/** GET /api/startups/discover/investors/:investorId — detail with relationship-based contact unlock */
exports.getDiscoverInvestor = async (req, res) => {
	try {
		const investorId = Number.parseInt(req.params.investorId, 10);
		if (!Number.isInteger(investorId) || investorId <= 0) {
			return res.status(400).json({ error: "Invalid investor id" });
		}

		const r = await pool.query(
			`SELECT i.*, u.user_id, u.first_name, u.last_name, u.email, u.phone_number,
              u.is_approved AS user_approved, COALESCE(i.is_approved, false) AS investor_listed
       FROM investors i
       INNER JOIN users u ON u.user_id = i.user_id
       WHERE i.investor_id = $1 AND u.role = 'Investor' AND u.is_active = TRUE`,
			[investorId],
		);
		if (!r.rowCount)
			return res.status(404).json({ error: "Investor not found" });

		const row = r.rows[0];
		const access = await profileAccessService.evaluateSensitiveAccess(
			req.user.user_id,
			row.user_id,
			{ endpoint: "discover.getInvestor" },
		);

		return res.json({
			investor: profileSanitizer.sanitizeInvestor(row, access),
			privacy: access.privacy,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

/** GET /api/startups/discover/mentors/:mentorId */
exports.getDiscoverMentor = async (req, res) => {
	try {
		const mentorId = Number.parseInt(req.params.mentorId, 10);
		if (!Number.isInteger(mentorId) || mentorId <= 0) {
			return res.status(400).json({ error: "Invalid mentor id" });
		}

		const r = await pool.query(
			`SELECT m.*, u.user_id, u.first_name, u.last_name, u.email, u.phone_number,
              u.is_approved AS user_approved, COALESCE(m.is_approved, false) AS mentor_listed
       FROM mentors m
       INNER JOIN users u ON u.user_id = m.user_id
       WHERE m.mentor_id = $1 AND u.role = 'Mentor' AND u.is_active = TRUE`,
			[mentorId],
		);
		if (!r.rowCount) return res.status(404).json({ error: "Mentor not found" });

		const row = r.rows[0];
		const access = await profileAccessService.evaluateSensitiveAccess(
			req.user.user_id,
			row.user_id,
			{ endpoint: "discover.getMentor" },
		);

		return res.json({
			mentor: profileSanitizer.sanitizeMentor(row, access),
			privacy: access.privacy,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.requestMentor = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const startupId = await getStartupIdByUserId(userId);
		if (!startupId) {
			return res.status(404).json({ error: "Startup profile not found" });
		}

		const mentorId = Number.parseInt(req.params.mentorId, 10);
		if (!Number.isInteger(mentorId) || mentorId <= 0) {
			return res.status(400).json({ error: "Invalid mentor id" });
		}

		let { subject, message } = req.body || {};
		if (!subject || typeof subject !== "string" || subject.trim() === "") {
			return res.status(400).json({ error: "'subject' is required" });
		}

		const mentorOk = await pool.query(
			`SELECT m.mentor_id
       FROM mentors m
       INNER JOIN users u ON u.user_id = m.user_id
       WHERE m.mentor_id = $1
         AND u.role = 'Mentor'
         AND u.is_active = TRUE
         AND u.is_approved = TRUE`,
			[mentorId],
		);
		if (mentorOk.rowCount === 0) {
			return res.status(404).json({ error: "Mentor not found" });
		}

		const result = await pool.query(
			`INSERT INTO mentorship_requests (startup_id, mentor_id, subject, message, status, initiated_by)
       VALUES ($1,$2,$3,$4,'pending','startup')
       RETURNING *`,
			[startupId, mentorId, subject.trim(), message || null],
		);

		return res.status(201).json({
			message: "Mentorship request sent",
			mentorship_request: result.rows[0],
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.expressInvestorInterest = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const startupId = await getStartupIdByUserId(userId);
		if (!startupId) {
			return res.status(404).json({ error: "Startup profile not found" });
		}

		const investorId = Number.parseInt(req.params.investorId, 10);
		if (!Number.isInteger(investorId) || investorId <= 0) {
			return res.status(400).json({ error: "Invalid investor id" });
		}

		const { message } = req.body || {};

		const invOk = await pool.query(
			`SELECT i.investor_id
       FROM investors i
       INNER JOIN users u ON u.user_id = i.user_id
       WHERE i.investor_id = $1
         AND u.role = 'Investor'
         AND u.is_active = TRUE
         AND u.is_approved = TRUE`,
			[investorId],
		);
		if (invOk.rowCount === 0) {
			return res.status(404).json({ error: "Investor not found" });
		}

		const result = await pool.query(
			`INSERT INTO startup_investor_interests (startup_id, investor_id, message, status)
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT (startup_id, investor_id) DO UPDATE SET
         message = COALESCE(EXCLUDED.message, startup_investor_interests.message)
       RETURNING *`,
			[startupId, investorId, message || null],
		);

		return res.status(200).json({
			message: "Interest saved",
			interest: result.rows[0],
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.saveFavorite = async (req, res) => {
	try {
		const startupId = await getStartupIdByUserId(req.user.user_id);
		if (!startupId) {
			return res.status(404).json({ error: "Startup profile not found" });
		}

		const profileId = Number.parseInt(req.params.profileId, 10);
		if (!Number.isInteger(profileId) || profileId <= 0) {
			return res.status(400).json({ error: "Invalid profile id" });
		}

		const type = String((req.body && req.body.type) || "").toLowerCase();
		if (type !== "mentor" && type !== "investor") {
			return res
				.status(400)
				.json({ error: "Body 'type' must be 'mentor' or 'investor'" });
		}

		if (type === "mentor") {
			const mOk = await pool.query(
				`SELECT m.mentor_id FROM mentors m
         INNER JOIN users u ON u.user_id = m.user_id
         WHERE m.mentor_id = $1 AND u.is_active AND u.is_approved`,
				[profileId],
			);
			if (mOk.rowCount === 0) {
				return res.status(404).json({ error: "Mentor not found" });
			}

			const ex = await pool.query(
				`SELECT favorite_id FROM startup_discover_favorites
         WHERE startup_id = $1 AND mentor_id = $2 AND investor_id IS NULL`,
				[startupId, profileId],
			);
			if (ex.rowCount > 0) {
				await pool.query(
					`DELETE FROM startup_discover_favorites WHERE favorite_id = $1`,
					[ex.rows[0].favorite_id],
				);
				return res.json({ bookmarked: false, mentor_id: profileId });
			}

			await pool.query(
				`INSERT INTO startup_discover_favorites (startup_id, mentor_id, investor_id)
         VALUES ($1, $2, NULL)`,
				[startupId, profileId],
			);
			return res.status(201).json({ bookmarked: true, mentor_id: profileId });
		}

		const iOk = await pool.query(
			`SELECT i.investor_id FROM investors i
       INNER JOIN users u ON u.user_id = i.user_id
       WHERE i.investor_id = $1 AND u.is_active AND u.is_approved`,
			[profileId],
		);
		if (iOk.rowCount === 0) {
			return res.status(404).json({ error: "Investor not found" });
		}

		const ex = await pool.query(
			`SELECT favorite_id FROM startup_discover_favorites
       WHERE startup_id = $1 AND investor_id = $2 AND mentor_id IS NULL`,
			[startupId, profileId],
		);
		if (ex.rowCount > 0) {
			await pool.query(
				`DELETE FROM startup_discover_favorites WHERE favorite_id = $1`,
				[ex.rows[0].favorite_id],
			);
			return res.json({ bookmarked: false, investor_id: profileId });
		}

		await pool.query(
			`INSERT INTO startup_discover_favorites (startup_id, mentor_id, investor_id)
       VALUES ($1, NULL, $2)`,
			[startupId, profileId],
		);
		return res.status(201).json({ bookmarked: true, investor_id: profileId });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

function normApplicationStatusLabel(s) {
	if (!s || typeof s !== "string") return "Draft";
	const t = s.trim();
	if (/^submitted$/i.test(t)) return "Submitted";
	return "Draft";
}

function statusLabelToDb(s) {
	return s === "Submitted" ? "submitted" : "draft";
}

exports.applyToInvestor = async (req, res) => {
	try {
		const startupId = await getStartupIdByUserId(req.user.user_id);
		if (!startupId) {
			return res.status(404).json({ error: "Startup profile not found" });
		}

		const investorId = Number.parseInt(req.params.investorId, 10);
		if (!Number.isInteger(investorId) || investorId <= 0) {
			return res.status(400).json({ error: "Invalid investor id" });
		}

		const body = req.body && typeof req.body === "object" ? req.body : {};
		const appIn =
			body.application && typeof body.application === "object"
				? body.application
				: {};

		const startupProject = appIn.startupProject;
		const requestedAmount = appIn.requestedAmount;
		const useOfFunds = appIn.useOfFunds;
		const expectedMilestones = appIn.expectedMilestones;
		const messageToInvestor = appIn.messageToInvestor;

		if (typeof startupProject !== "string" || !startupProject.trim()) {
			return res
				.status(400)
				.json({ error: "application.startupProject is required" });
		}
		const amt = Number(requestedAmount);
		if (!Number.isFinite(amt) || amt <= 0) {
			return res.status(400).json({
				error: "application.requestedAmount must be a positive number",
			});
		}
		if (typeof messageToInvestor !== "string" || !messageToInvestor.trim()) {
			return res
				.status(400)
				.json({ error: "application.messageToInvestor is required" });
		}

		const invRes = await pool.query(
			`SELECT i.*, u.first_name, u.last_name, u.is_active AS user_active
       FROM investors i
       INNER JOIN users u ON u.user_id = i.user_id
       WHERE i.investor_id = $1
         AND u.role = 'Investor'
         AND u.is_active = TRUE
         AND u.is_approved = TRUE`,
			[investorId],
		);
		if (invRes.rowCount === 0) {
			return res.status(404).json({ error: "Investor not found" });
		}
		const inv = invRes.rows[0];

		const stRes = await pool.query(
			`SELECT startup_name, industry FROM startups WHERE startup_id = $1`,
			[startupId],
		);
		if (stRes.rowCount === 0) {
			return res.status(404).json({ error: "Startup not found" });
		}
		const st = stRes.rows[0];

		const ovInv =
			body.investor && typeof body.investor === "object" ? body.investor : {};
		const investor = {
			name:
				(typeof ovInv.name === "string" && ovInv.name.trim()) ||
				inv.organization_name ||
				`${inv.first_name} ${inv.last_name}`.trim(),
			status:
				(typeof ovInv.status === "string" && ovInv.status.trim()) ||
				(inv.user_active ? "Active" : "Inactive"),
			location:
				(typeof ovInv.location === "string" && ovInv.location.trim()) ||
				[inv.location_preference, inv.country].filter(Boolean).join(", ") ||
				null,
			fundingRange:
				(typeof ovInv.fundingRange === "string" && ovInv.fundingRange.trim()) ||
				(inv.investment_budget != null
					? `0-${Math.round(Number(inv.investment_budget))}`
					: null),
		};

		const application = {
			startupProject: startupProject.trim(),
			requestedAmount: amt,
			useOfFunds:
				typeof useOfFunds === "string" && useOfFunds.trim()
					? useOfFunds.trim()
					: (useOfFunds ?? ""),
			expectedMilestones:
				typeof expectedMilestones === "string" && expectedMilestones.trim()
					? expectedMilestones.trim()
					: (expectedMilestones ?? ""),
			messageToInvestor: messageToInvestor.trim(),
		};

		const docsIn =
			body.documents && typeof body.documents === "object"
				? body.documents
				: {};
		const documents = {
			pitchDeck: docsIn.pitchDeck ?? null,
			businessPlan: docsIn.businessPlan ?? null,
			financialDocument: docsIn.financialDocument ?? null,
			demoVideo: docsIn.demoVideo ?? null,
		};

		const sumIn =
			body.summary && typeof body.summary === "object" ? body.summary : {};
		const statusLabel = normApplicationStatusLabel(sumIn.status || body.status);
		const summary = {
			startupName: sumIn.startupName || st.startup_name,
			project: sumIn.project || application.startupProject,
			industry: sumIn.industry || st.industry || null,
			requestedAmount:
				sumIn.requestedAmount != null
					? Number(sumIn.requestedAmount)
					: application.requestedAmount,
			status: statusLabel,
		};

		const payload = { investor, application, documents, summary };

		await pool.query(
			`INSERT INTO discover_investor_applications (startup_id, investor_id, payload, application_status)
       VALUES ($1, $2, $3::jsonb, $4)
       ON CONFLICT (startup_id, investor_id) DO UPDATE SET
         payload = EXCLUDED.payload,
         application_status = EXCLUDED.application_status,
         updated_at = CURRENT_TIMESTAMP`,
			[startupId, investorId, payload, statusLabelToDb(statusLabel)],
		);

		return res.status(201).json(payload);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.applyToMentor = async (req, res) => {
	try {
		const startupId = await getStartupIdByUserId(req.user.user_id);
		if (!startupId) {
			return res.status(404).json({ error: "Startup profile not found" });
		}

		const mentorId = Number.parseInt(req.params.mentorId, 10);
		if (!Number.isInteger(mentorId) || mentorId <= 0) {
			return res.status(400).json({ error: "Invalid mentor id" });
		}

		const body = req.body && typeof req.body === "object" ? req.body : {};
		const appIn =
			body.application && typeof body.application === "object"
				? body.application
				: {};

		const startupProject = appIn.startupProject;
		const mentorshipFocus = appIn.mentorshipFocus;
		const preferredSessionFormat = appIn.preferredSessionFormat;
		const expectedOutcomes = appIn.expectedOutcomes;
		const messageToMentor = appIn.messageToMentor;

		if (typeof startupProject !== "string" || !startupProject.trim()) {
			return res
				.status(400)
				.json({ error: "application.startupProject is required" });
		}
		if (typeof messageToMentor !== "string" || !messageToMentor.trim()) {
			return res
				.status(400)
				.json({ error: "application.messageToMentor is required" });
		}

		const mRes = await pool.query(
			`SELECT m.*, u.first_name, u.last_name, u.is_active AS user_active
       FROM mentors m
       INNER JOIN users u ON u.user_id = m.user_id
       WHERE m.mentor_id = $1
         AND u.role = 'Mentor'
         AND u.is_active = TRUE
         AND u.is_approved = TRUE`,
			[mentorId],
		);
		if (mRes.rowCount === 0) {
			return res.status(404).json({ error: "Mentor not found" });
		}
		const m = mRes.rows[0];

		const stRes = await pool.query(
			`SELECT startup_name, industry FROM startups WHERE startup_id = $1`,
			[startupId],
		);
		if (stRes.rowCount === 0) {
			return res.status(404).json({ error: "Startup not found" });
		}
		const st = stRes.rows[0];

		const ov =
			body.mentor && typeof body.mentor === "object" ? body.mentor : {};
		const industries = [m.primary_industry, m.secondary_industry]
			.filter(Boolean)
			.join(", ");
		const mentor = {
			name:
				(typeof ov.name === "string" && ov.name.trim()) ||
				`${m.first_name} ${m.last_name}`.trim(),
			status:
				(typeof ov.status === "string" && ov.status.trim()) ||
				(m.user_active ? "Active" : "Inactive"),
			location:
				(typeof ov.location === "string" && ov.location.trim()) ||
				[m.city_location, m.country].filter(Boolean).join(", ") ||
				null,
			expertiseAreas:
				(typeof ov.expertiseAreas === "string" && ov.expertiseAreas.trim()) ||
				industries ||
				m.expertise ||
				null,
			sessionAvailability:
				(typeof ov.sessionAvailability === "string" &&
					ov.sessionAvailability.trim()) ||
				m.session_frequency ||
				m.availability_preference ||
				null,
		};

		const application = {
			startupProject: startupProject.trim(),
			mentorshipFocus:
				typeof mentorshipFocus === "string" && mentorshipFocus.trim()
					? mentorshipFocus.trim()
					: (mentorshipFocus ?? ""),
			preferredSessionFormat:
				typeof preferredSessionFormat === "string" &&
				preferredSessionFormat.trim()
					? preferredSessionFormat.trim()
					: (preferredSessionFormat ?? ""),
			expectedOutcomes:
				typeof expectedOutcomes === "string" && expectedOutcomes.trim()
					? expectedOutcomes.trim()
					: (expectedOutcomes ?? ""),
			messageToMentor: messageToMentor.trim(),
		};

		const docsIn =
			body.documents && typeof body.documents === "object"
				? body.documents
				: {};
		const documents = {
			pitchDeck: docsIn.pitchDeck ?? null,
			businessPlan: docsIn.businessPlan ?? null,
			financialDocument: docsIn.financialDocument ?? null,
			demoVideo: docsIn.demoVideo ?? null,
			introVideo: docsIn.introVideo ?? null,
			cvOrBio: docsIn.cvOrBio ?? null,
		};

		const sumIn =
			body.summary && typeof body.summary === "object" ? body.summary : {};
		const statusLabel = normApplicationStatusLabel(sumIn.status || body.status);
		const summary = {
			startupName: sumIn.startupName || st.startup_name,
			project: sumIn.project || application.startupProject,
			industry: sumIn.industry || st.industry || null,
			mentorshipFocus:
				sumIn.mentorshipFocus || application.mentorshipFocus || null,
			status: statusLabel,
		};

		const payload = { mentor, application, documents, summary };

		await pool.query(
			`INSERT INTO discover_mentor_applications (startup_id, mentor_id, payload, application_status)
       VALUES ($1, $2, $3::jsonb, $4)
       ON CONFLICT (startup_id, mentor_id) DO UPDATE SET
         payload = EXCLUDED.payload,
         application_status = EXCLUDED.application_status,
         updated_at = CURRENT_TIMESTAMP`,
			[startupId, mentorId, payload, statusLabelToDb(statusLabel)],
		);

		return res.status(201).json(payload);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};
