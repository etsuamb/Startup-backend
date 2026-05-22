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

exports.getMyStartupProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const result = await pool.query(
      `SELECT s.*, u.first_name, u.last_name, u.email, u.phone_number
			 FROM startups s
			 JOIN users u ON u.user_id = s.user_id
			 WHERE s.user_id = $1`,
      [userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Startup profile not found" });
    }

    res.json({ startup: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStartupDocuments = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const startupRes = await pool.query(
      "SELECT startup_id FROM startups WHERE user_id = $1",
      [userId],
    );

    if (startupRes.rowCount === 0) {
      return res.status(404).json({ error: "Startup profile not found" });
    }

    const startupId = startupRes.rows[0].startup_id;
    const docs = await pool.query(
      `SELECT document_id, file_name, file_path, file_type, file_size_bytes, description, created_at
			 FROM documents WHERE startup_id = $1 ORDER BY created_at DESC`,
      [startupId],
    );

    res.json({ documents: docs.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listFeaturedStartups = async (req, res) => {
  try {
    const { page = 1, limit = 3 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(12, Math.max(1, parseInt(limit, 10) || 3));
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
    const total = parseInt(countResult.rows[0].total, 10);

    const result = await pool.query(
      `SELECT s.startup_id, s.startup_name, s.industry, s.description, s.business_stage, s.team_size,
			 s.location, s.website, s.funding_needed, s.created_at
			 FROM startups s
			 JOIN users u ON s.user_id = u.user_id
			 WHERE ${visibilityWhere}
			 ORDER BY s.created_at DESC
			 LIMIT $1 OFFSET $2`,
      [limitNum, offset],
    );

    res.json({ startups: result.rows, total, page: pageNum, limit: limitNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Public search endpoint for startups (search, industry, stage, pagination)
exports.searchPublicStartups = async (req, res) => {
  try {
    const {
      q = "",
      industry = "",
      stage = "",
      page = 1,
      limit = 12,
    } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    const visibilityWhere = `
      u.is_approved = true
      AND u.is_active = true
      AND COALESCE(s.is_listed, false) = true
      AND COALESCE(s.admin_status, 'Pending') IN ('Active', 'Funded')
    `;

    // Build dynamic where clauses
    const whereClauses = [visibilityWhere];
    const params = [];
    let idx = 1;

    if (q && q.trim() !== "") {
      whereClauses.push(
        `(LOWER(s.startup_name) LIKE LOWER($${idx}) OR LOWER(s.description) LIKE LOWER($${idx}))`,
      );
      params.push(`%${q.trim()}%`);
      idx++;
    }

    if (industry && industry.trim() !== "") {
      whereClauses.push(`s.industry = $${idx}`);
      params.push(industry.trim());
      idx++;
    }

    if (stage && stage.trim() !== "") {
      whereClauses.push(`s.business_stage = $${idx}`);
      params.push(stage.trim());
      idx++;
    }

    const whereSql = whereClauses.join(" AND ");

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM startups s JOIN users u ON s.user_id = u.user_id WHERE ${whereSql}`,
      params,
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Add pagination params
    params.push(limitNum);
    params.push(offset);

    const result = await pool.query(
      `SELECT s.startup_id, s.startup_name, s.industry, s.description, s.business_stage, s.team_size,
        s.location, s.website, s.funding_needed, s.created_at
        FROM startups s
        JOIN users u ON s.user_id = u.user_id
        WHERE ${whereSql}
        ORDER BY s.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}`,
      params,
    );

    res.json({ startups: result.rows, total, page: pageNum, limit: limitNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all offers (investment and mentorship) for a startup
exports.getStartupOffers = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { type } = req.query;

    const startupResult = await pool.query(
      "SELECT startup_id FROM startups WHERE user_id = $1",
      [userId],
    );

    if (startupResult.rowCount === 0) {
      return res.status(404).json({ error: "Startup profile not found" });
    }

    const startupId = startupResult.rows[0].startup_id;
    const offers = [];

    // Fetch investment offers
    if (!type || type === "investor" || type === "all") {
      const investmentOffers = await pool.query(
        `SELECT 
          ir.investment_request_id as id,
          'Investor' as type,
          ir.status,
          ir.created_at,
          ir.requested_amount as amount,
          ir.proposal_message as message,
          i.investor_id,
          i.organization_name as company,
          i.investment_budget,
          i.preferred_industry,
          i.investment_stage,
          i.location_preference,
          i.bio,
          u.first_name,
          u.last_name,
          u.email,
          p.project_title,
          p.funding_goal
        FROM investment_requests ir
        JOIN investors i ON i.investor_id = ir.investor_id
        JOIN users u ON u.user_id = i.user_id
        JOIN projects p ON p.project_id = ir.project_id
        WHERE ir.startup_id = $1
        ORDER BY ir.created_at DESC`,
        [startupId],
      );

      investmentOffers.rows.forEach(offer => {
        offers.push({
          ...offer,
          offerType: 'investment',
          equity: null,
          terms: `Investment offer for ${offer.project_title}`,
        });
      });
    }

    // Fetch mentorship offers (where mentor has accepted the startup's request)
    if (!type || type === "mentor" || type === "all") {
      const mentorshipOffers = await pool.query(
        `SELECT 
          mr.mentorship_request_id as id,
          'Mentor' as type,
          mr.status,
          mr.created_at,
          mr.subject,
          mr.message,
          m.mentor_id,
          m.headline,
          m.expertise,
          m.years_experience,
          m.country,
          m.bio,
          m.professional_title,
          m.primary_industry,
          u.first_name,
          u.last_name,
          u.email
        FROM mentorship_requests mr
        JOIN mentors m ON m.mentor_id = mr.mentor_id
        JOIN users u ON u.user_id = m.user_id
        WHERE mr.startup_id = $1 AND mr.status = 'accepted'
        ORDER BY mr.created_at DESC`,
        [startupId],
      );

      mentorshipOffers.rows.forEach(offer => {
        offers.push({
          ...offer,
          offerType: 'mentorship',
          amount: null,
          terms: offer.subject || 'Mentorship offer',
        });
      });
    }

    res.json({ offers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get detailed information about a specific offer
exports.getOfferDetails = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { offerId, offerType } = req.params;

    const startupResult = await pool.query(
      "SELECT startup_id FROM startups WHERE user_id = $1",
      [userId],
    );

    if (startupResult.rowCount === 0) {
      return res.status(404).json({ error: "Startup profile not found" });
    }

    const startupId = startupResult.rows[0].startup_id;

    if (offerType === 'investment') {
      const result = await pool.query(
        `SELECT 
          ir.investment_request_id as id,
          'Investor' as type,
          ir.status,
          ir.created_at,
          ir.requested_amount as amount,
          ir.proposal_message as message,
          i.investor_id,
          i.organization_name as company,
          i.investment_budget,
          i.preferred_industry,
          i.investment_stage,
          i.location_preference,
          i.bio,
          i.investor_type,
          i.portfolio_size,
          u.first_name,
          u.last_name,
          u.email,
          u.phone_number,
          p.project_title,
          p.funding_goal,
          p.description as project_description
        FROM investment_requests ir
        JOIN investors i ON i.investor_id = ir.investor_id
        JOIN users u ON u.user_id = i.user_id
        JOIN projects p ON p.project_id = ir.project_id
        WHERE ir.investment_request_id = $1 AND ir.startup_id = $2`,
        [offerId, startupId],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Investment offer not found" });
      }

      return res.json({ offer: result.rows[0] });
    }

    if (offerType === 'mentorship') {
      const result = await pool.query(
        `SELECT 
          mr.mentorship_request_id as id,
          'Mentor' as type,
          mr.status,
          mr.created_at,
          mr.subject,
          mr.message,
          m.mentor_id,
          m.headline,
          m.expertise,
          m.years_experience,
          m.country,
          m.bio,
          m.professional_title,
          m.primary_industry,
          m.secondary_industry,
          m.session_pricing,
          m.mentoring_style,
          m.notable_startups_mentored,
          m.key_achievement,
          u.first_name,
          u.last_name,
          u.email,
          u.phone_number
        FROM mentorship_requests mr
        JOIN mentors m ON m.mentor_id = mr.mentor_id
        JOIN users u ON u.user_id = m.user_id
        WHERE mr.mentorship_request_id = $1 AND mr.startup_id = $2`,
        [offerId, startupId],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Mentorship offer not found" });
      }

      return res.json({ offer: result.rows[0] });
    }

    res.status(400).json({ error: "Invalid offer type" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Accept or reject an offer
exports.updateOfferStatus = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { offerId, offerType } = req.params;
    const { status } = req.body;

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'accepted' or 'rejected'" });
    }

    const startupResult = await pool.query(
      "SELECT startup_id FROM startups WHERE user_id = $1",
      [userId],
    );

    if (startupResult.rowCount === 0) {
      return res.status(404).json({ error: "Startup profile not found" });
    }

    const startupId = startupResult.rows[0].startup_id;

    if (offerType === 'investment') {
      const requestResult = await pool.query(
        `SELECT ir.*, p.startup_id
         FROM investment_requests ir
         JOIN projects p ON p.project_id = ir.project_id
         WHERE ir.investment_request_id = $1 AND p.startup_id = $2`,
        [offerId, startupId],
      );

      if (requestResult.rowCount === 0) {
        return res.status(404).json({ error: "Investment offer not found" });
      }

      const currentStatus = requestResult.rows[0].status;
      if (currentStatus !== 'pending') {
        return res.status(409).json({ error: "Only pending offers can be updated" });
      }

      const updateResult = await pool.query(
        `UPDATE investment_requests
         SET status = $1
         WHERE investment_request_id = $2
         RETURNING *`,
        [status, offerId],
      );

      return res.json({ offer: updateResult.rows[0] });
    }

    if (offerType === 'mentorship') {
      const requestResult = await pool.query(
        `SELECT * FROM mentorship_requests
         WHERE mentorship_request_id = $1 AND startup_id = $2`,
        [offerId, startupId],
      );

      if (requestResult.rowCount === 0) {
        return res.status(404).json({ error: "Mentorship offer not found" });
      }

      const currentStatus = requestResult.rows[0].status;
      if (currentStatus !== 'accepted') {
        return res.status(409).json({ error: "Only accepted mentorship offers can be rejected" });
      }

      if (status === 'accepted') {
        return res.status(400).json({ error: "Mentorship offer is already accepted" });
      }

      const updateResult = await pool.query(
        `UPDATE mentorship_requests
         SET status = $1
         WHERE mentorship_request_id = $2
         RETURNING *`,
        [status, offerId],
      );

      return res.json({ offer: updateResult.rows[0] });
    }

    res.status(400).json({ error: "Invalid offer type" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
