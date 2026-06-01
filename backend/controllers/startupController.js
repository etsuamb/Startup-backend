const pool = require("../config/db");
const { addMinutes, buildIcsEvent, sendIcs } = require("../utils/calendarIcs");

async function ensureInvestmentRequestDirectionSchema(client = pool) {
  await client.query("ALTER TABLE investment_requests ALTER COLUMN project_id DROP NOT NULL");
  await client.query("ALTER TABLE investment_requests ADD COLUMN IF NOT EXISTS initiated_by VARCHAR(20) NOT NULL DEFAULT 'startup'");
  await client.query("ALTER TABLE investment_requests DROP CONSTRAINT IF EXISTS investment_requests_initiated_by_check");
  await client.query("ALTER TABLE investment_requests ADD CONSTRAINT investment_requests_initiated_by_check CHECK (initiated_by IN ('startup', 'investor'))");
}

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
      first_name,
      last_name,
      phone_number,
      founder_full_name,
      startup_name,
      industry,
      startup_tagline,
      description,
      business_stage,
      startup_type,
      founded_year,
      team_size,
      region,
      city,
      founder_role,
      location,
      website,
      funding_needed,
    } = req.body || {};

    // Basic required validation
    if (!startup_name || typeof startup_name !== "string" || !startup_name.trim()) {
      return res.status(400).json({
        error:
          "'startup_name' is required. Send either JSON (application/json) or form-data fields with startup_name.",
      });
    }
    startup_name = startup_name.trim();

    if (first_name !== undefined && (typeof first_name !== "string" || !first_name.trim())) {
      return res.status(400).json({ error: "'first_name' must be a non-empty string" });
    }
    if (last_name !== undefined && (typeof last_name !== "string" || !last_name.trim())) {
      return res.status(400).json({ error: "'last_name' must be a non-empty string" });
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

    if (website !== undefined && website !== null && String(website).trim() !== "") {
      website = String(website).trim();
      if (!website.startsWith("http://") && !website.startsWith("https://")) {
        website = `https://${website}`;
      }
    } else {
      website = null;
    }

    // Ensure startup exists
    const existing = await pool.query(
      "SELECT startup_id, founder_full_name FROM startups WHERE user_id = $1",
      [userId],
    );
    if (existing.rowCount === 0) {
      return res.status(404).json({ error: "Startup profile not found" });
    }

    const resolvedFounderName =
      typeof founder_full_name === "string" && founder_full_name.trim()
        ? founder_full_name.trim()
        : existing.rows[0].founder_full_name;

    if (first_name !== undefined || last_name !== undefined || phone_number !== undefined) {
      const userPatch = await pool.query(
        `SELECT first_name, last_name, phone_number FROM users WHERE user_id = $1`,
        [userId],
      );
      const current = userPatch.rows[0] || {};
      await pool.query(
        `UPDATE users SET
          first_name = $1,
          last_name = $2,
          phone_number = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $4`,
        [
          first_name !== undefined ? String(first_name).trim() : current.first_name,
          last_name !== undefined ? String(last_name).trim() : current.last_name,
          phone_number !== undefined && String(phone_number).trim() !== ""
            ? String(phone_number).trim()
            : phone_number !== undefined
              ? null
              : current.phone_number,
          userId,
        ],
      );
    }

    const updateRes = await pool.query(
      `UPDATE startups SET
				founder_full_name = $1,
				startup_name = $2,
				industry = $3,
				startup_tagline = $4,
				description = $5,
				business_stage = $6,
				startup_type = $7,
				founded_year = $8,
				team_size = $9,
				region = $10,
				city = $11,
				founder_role = $12,
				location = $13,
				website = $14,
				funding_needed = $15
			WHERE user_id = $16
			RETURNING *
			`,
      [
        resolvedFounderName,
        startup_name,
        industry || null,
        startup_tagline || null,
        description || null,
        business_stage || null,
        startup_type || null,
        founded_year,
        team_size,
        region || null,
        city || null,
        founder_role || null,
        location || null,
        website,
        funding_needed,
        userId,
      ],
    );

    const profileRes = await pool.query(
      `SELECT s.*, u.first_name, u.last_name, u.email, u.phone_number
       FROM startups s
       JOIN users u ON u.user_id = s.user_id
       WHERE s.user_id = $1`,
      [userId],
    );
    const startup = profileRes.rows[0];
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

    const docLabels = {
      founder_id: "Founder or representative ID",
      business_registration_proof: "Business registration proof",
      support_affiliation_letter: "Support or affiliation letter",
      tin_certificate: "TIN certificate",
      logo: "Company logo",
      startup_logo: "Company logo",
      proof_of_address: "Proof of address",
      pitch_deck: "Pitch deck",
      business_plan: "Business plan",
    };

    for (const file of uploadedFiles) {
      try {
        const description = docLabels[file.fieldname] || file.fieldname || null;
        if (description) {
          await pool.query(
            `DELETE FROM documents WHERE startup_id = $1 AND LOWER(COALESCE(description, '')) = LOWER($2)`,
            [startup.startup_id, description],
          );
        }
        await pool.query(
          `INSERT INTO documents (startup_id, file_name, file_path, file_type, file_size_bytes, description, created_at)
					 VALUES ($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP)`,
          [
            startup.startup_id,
            file.originalname,
            file.path,
            file.mimetype,
            file.size,
            description,
          ],
        );
      } catch (docErr) {
        console.error("Failed to save uploaded file record:", docErr.message);
      }
    }

    const docs = await pool.query(
      `SELECT document_id, file_name, file_path, file_type, file_size_bytes, description, created_at
       FROM documents WHERE startup_id = $1 ORDER BY created_at DESC`,
      [startup.startup_id],
    );

    res.status(200).json({
      message: "Startup profile updated",
      startup,
      documents: docs.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyStartupProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const result = await pool.query(
      `SELECT s.*, u.first_name, u.last_name, u.email, u.phone_number,
              u.is_approved, u.is_active
			 FROM startups s
			 JOIN users u ON u.user_id = s.user_id
			 WHERE s.user_id = $1`,
      [userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Startup profile not found" });
    }

    const startup = result.rows[0];
    const docs = await pool.query(
      `SELECT document_id, file_name, file_path, file_type, file_size_bytes, description, created_at
       FROM documents WHERE startup_id = $1 ORDER BY created_at DESC`,
      [startup.startup_id],
    );

    res.json({ startup, documents: docs.rows });
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
        `(LOWER(COALESCE(s.startup_name, '')) LIKE LOWER($${idx})
          OR LOWER(COALESCE(s.description, '')) LIKE LOWER($${idx})
          OR LOWER(COALESCE(s.startup_tagline, '')) LIKE LOWER($${idx})
          OR LOWER(COALESCE(s.industry, '')) LIKE LOWER($${idx})
          OR LOWER(COALESCE(s.business_stage, '')) LIKE LOWER($${idx})
          OR LOWER(COALESCE(s.location, '')) LIKE LOWER($${idx})
          OR LOWER(COALESCE(s.city, '')) LIKE LOWER($${idx})
          OR LOWER(COALESCE(s.region, '')) LIKE LOWER($${idx}))`,
      );
      params.push(`%${q.trim()}%`);
      idx++;
    }

    if (industry && industry.trim() !== "") {
      whereClauses.push(`COALESCE(s.industry, '') ILIKE $${idx}`);
      params.push(`%${industry.trim()}%`);
      idx++;
    }

    if (stage && stage.trim() !== "") {
      whereClauses.push(`COALESCE(s.business_stage, '') ILIKE $${idx}`);
      params.push(`%${stage.trim()}%`);
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

async function fetchContactDocumentFolders(contactType, contactId) {
  if (!contactId) return [];

  if (contactType === "mentor") {
    const docs = await pool.query(
      `SELECT * FROM (
         SELECT document_id AS id,
                COALESCE(description, 'document') AS document_type,
                file_name, file_path, file_type, file_size_bytes, description, created_at
         FROM documents WHERE mentor_id = $1
         UNION ALL
         SELECT mentor_document_id AS id,
                document_type,
                file_name, file_path, file_type, file_size_bytes, description, created_at
         FROM mentor_documents WHERE mentor_id = $1
       ) merged ORDER BY document_type, created_at DESC`,
      [contactId],
    );
    return groupDocumentsIntoFolders(docs.rows);
  }

  if (contactType === "investor") {
    const docs = await pool.query(
      `SELECT document_id AS id,
              COALESCE(description, file_type, 'document') AS document_type,
              file_name, file_path, file_type, file_size_bytes, description, created_at
       FROM documents
       WHERE investor_id = $1
       ORDER BY document_type, created_at DESC`,
      [contactId],
    );
    return groupDocumentsIntoFolders(docs.rows);
  }

  return [];
}

function groupDocumentsIntoFolders(documents) {
  const folderMap = new Map();
  for (const doc of documents) {
    const folderName = (doc.document_type || "other").trim() || "other";
    if (!folderMap.has(folderName)) {
      folderMap.set(folderName, {
        folder: folderName,
        documents: [],
      });
    }
    folderMap.get(folderName).documents.push({
      id: doc.id,
      file_name: doc.file_name,
      file_path: doc.file_path,
      file_type: doc.file_type,
      file_size_bytes: doc.file_size_bytes,
      description: doc.description,
      created_at: doc.created_at,
    });
  }
  return Array.from(folderMap.values());
}

const INVESTMENT_INCOMING_EXISTS = `
  EXISTS (
    SELECT 1
    FROM notifications n
    INNER JOIN startups s ON s.startup_id = ir.startup_id AND n.user_id = s.user_id
    WHERE n.reference_type = 'investment_requests'
      AND n.reference_id = ir.investment_request_id
      AND n.title = 'New Funding Offer'
  )`;

const MENTORSHIP_INCOMING_EXISTS = `COALESCE(mr.initiated_by, 'startup') = 'mentor'`;

const INVESTMENT_SOURCE_DIRECTION_SQL = `CASE WHEN ${INVESTMENT_INCOMING_EXISTS} THEN 'incoming' ELSE 'sent' END`;
const MENTORSHIP_SOURCE_DIRECTION_SQL = `CASE WHEN ${MENTORSHIP_INCOMING_EXISTS} THEN 'incoming' ELSE 'sent' END`;

async function notifyUser(client, userId, type, title, message, referenceType, referenceId) {
  await client.query(
    `INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, type, title, message, referenceType || null, referenceId || null],
  );
}

// Get all offers (investment and mentorship) for a startup
exports.getStartupOffers = async (req, res) => {
  try {
    await ensureInvestmentRequestDirectionSchema();
    const userId = req.user.user_id;

    const startupResult = await pool.query(
      "SELECT startup_id FROM startups WHERE user_id = $1",
      [userId],
    );

    if (startupResult.rowCount === 0) {
      return res.status(404).json({ error: "Startup profile not found" });
    }

    const startupId = startupResult.rows[0].startup_id;
    const offers = [];

    const investmentOffers = await pool.query(
      `SELECT 
          ir.investment_request_id as id,
          'Investor' as type,
          ir.status,
          ir.created_at,
          ir.requested_amount as amount,
          ir.proposal_message as message,
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM notifications n
              WHERE n.reference_type = 'investment_requests'
                AND n.reference_id = ir.investment_request_id
                AND n.title = 'New Funding Offer'
            )
            THEN 'incoming'
            ELSE 'sent'
          END as source_direction,
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM notifications n
              WHERE n.reference_type = 'investment_requests'
                AND n.reference_id = ir.investment_request_id
                AND n.title = 'New Funding Offer'
            )
            THEN 'Investor made this offer'
            ELSE 'Startup sent this investment request'
          END as source_label,
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
        LEFT JOIN projects p ON p.project_id = ir.project_id
        WHERE ir.startup_id = $1
        ORDER BY ir.created_at DESC`,
      [startupId],
    );

    for (const offer of investmentOffers.rows) {
      const document_folders = await fetchContactDocumentFolders("investor", offer.investor_id);
      offers.push({
        ...offer,
        offerType: "investment",
        equity: null,
        document_folders,
        document_count: document_folders.reduce((sum, folder) => sum + folder.documents.length, 0),
        canStartupRespond: offer.source_direction === "incoming" && offer.status === "pending",
        terms: offer.source_direction === "incoming"
          ? `Funding offer for ${offer.project_title}`
          : `Investment request for ${offer.project_title}`,
      });
    }

    const mentorshipOffers = await pool.query(
      `SELECT 
          mr.mentorship_request_id as id,
          'Mentor' as type,
          mr.status,
          mr.created_at,
          mr.subject,
          mr.message,
          ${MENTORSHIP_SOURCE_DIRECTION_SQL} as source_direction,
          CASE
            WHEN ${MENTORSHIP_INCOMING_EXISTS} THEN 'Mentor sent this offer'
            WHEN mr.status = 'accepted' THEN 'Mentor accepted your request'
            WHEN mr.status = 'rejected' THEN 'Mentor rejected your request'
            ELSE 'Startup sent this mentorship request'
          END as source_label,
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
        WHERE mr.startup_id = $1
        ORDER BY mr.created_at DESC`,
      [startupId],
    );

    for (const offer of mentorshipOffers.rows) {
      const document_folders = await fetchContactDocumentFolders("mentor", offer.mentor_id);
      offers.push({
        ...offer,
        offerType: "mentorship",
        amount: null,
        document_folders,
        document_count: document_folders.reduce((sum, folder) => sum + folder.documents.length, 0),
        canStartupRespond: offer.source_direction === "incoming" && offer.status === "pending",
        terms: offer.subject || "Mentorship request",
      });
    }

    offers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ offers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get detailed information about a specific offer
exports.getOfferDetails = async (req, res) => {
  try {
    await ensureInvestmentRequestDirectionSchema();
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
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM notifications n
              WHERE n.reference_type = 'investment_requests'
                AND n.reference_id = ir.investment_request_id
                AND n.title = 'New Funding Offer'
            )
            THEN 'incoming'
            ELSE 'sent'
          END as source_direction,
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM notifications n
              WHERE n.reference_type = 'investment_requests'
                AND n.reference_id = ir.investment_request_id
                AND n.title = 'New Funding Offer'
            )
            THEN 'Investor made this offer'
            ELSE 'Startup sent this investment request'
          END as source_label,
          i.investor_id,
          i.organization_name as company,
          i.investment_budget,
          i.preferred_industry,
          i.investment_stage,
          i.location_preference,
          i.country,
          i.bio,
          i.investor_type,
          i.portfolio_size,
          u.first_name,
          u.last_name,
          u.email,
          u.phone_number,
          s.startup_name,
          s.industry as startup_industry,
          p.project_title,
          p.industry as project_industry,
          p.funding_goal,
          p.description as project_description
        FROM investment_requests ir
        JOIN startups s ON s.startup_id = ir.startup_id
        JOIN investors i ON i.investor_id = ir.investor_id
        JOIN users u ON u.user_id = i.user_id
        LEFT JOIN projects p ON p.project_id = ir.project_id
        WHERE ir.investment_request_id = $1 AND ir.startup_id = $2`,
        [offerId, startupId],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Investment offer not found" });
      }

      const offer = result.rows[0];
      offer.document_folders = await fetchContactDocumentFolders("investor", offer.investor_id);
      offer.document_count = offer.document_folders.reduce(
        (sum, folder) => sum + folder.documents.length,
        0,
      );

      return res.json({ offer });
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
          ${MENTORSHIP_SOURCE_DIRECTION_SQL} as source_direction,
          CASE
            WHEN ${MENTORSHIP_INCOMING_EXISTS} THEN 'Mentor sent this offer'
            WHEN mr.status = 'accepted' THEN 'Mentor accepted your request'
            WHEN mr.status = 'rejected' THEN 'Mentor rejected your request'
            ELSE 'Startup sent this mentorship request'
          END as source_label,
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
          u.phone_number,
          s.startup_name,
          s.industry as startup_industry
        FROM mentorship_requests mr
        JOIN startups s ON s.startup_id = mr.startup_id
        JOIN mentors m ON m.mentor_id = mr.mentor_id
        JOIN users u ON u.user_id = m.user_id
        WHERE mr.mentorship_request_id = $1 AND mr.startup_id = $2`,
        [offerId, startupId],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Mentorship offer not found" });
      }

      const offer = result.rows[0];
      offer.document_folders = await fetchContactDocumentFolders("mentor", offer.mentor_id);
      offer.document_count = offer.document_folders.reduce(
        (sum, folder) => sum + folder.documents.length,
        0,
      );

      return res.json({ offer });
    }

    res.status(400).json({ error: "Invalid offer type" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Accept or reject an offer
exports.updateOfferStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    await ensureInvestmentRequestDirectionSchema();
    const userId = req.user.user_id;
    const { offerId, offerType } = req.params;
    const rawStatus = String(req.body?.status || "").trim().toLowerCase();
    const status =
      rawStatus === "accept" || rawStatus === "accepted"
        ? "accepted"
        : rawStatus === "reject" || rawStatus === "rejected"
          ? "rejected"
          : null;

    if (!status) {
      return res.status(400).json({ error: "Status must be 'accepted' or 'rejected'" });
    }

    const startupResult = await client.query(
      "SELECT startup_id, startup_name FROM startups WHERE user_id = $1",
      [userId],
    );

    if (startupResult.rowCount === 0) {
      return res.status(404).json({ error: "Startup profile not found" });
    }

    const startupId = startupResult.rows[0].startup_id;
    const startupName = startupResult.rows[0].startup_name;

    await client.query("BEGIN");

    if (offerType === "investment") {
      const nextStatus = status === "accepted" ? "approved" : "rejected";
      const requestResult = await client.query(
        `SELECT ir.*,
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM notifications n
              WHERE n.reference_type = 'investment_requests'
                AND n.reference_id = ir.investment_request_id
                AND n.title = 'New Funding Offer'
            )
            THEN 'incoming'
            ELSE 'sent'
         END as source_direction
         FROM investment_requests ir
         JOIN investors i ON i.investor_id = ir.investor_id
         WHERE ir.investment_request_id = $1 AND ir.startup_id = $2`,
        [offerId, startupId],
      );

      if (requestResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Investment offer not found" });
      }

      const row = requestResult.rows[0];
      if (row.source_direction !== "incoming") {
        await client.query("ROLLBACK");
        return res.status(403).json({
          error: "Startup-created investment requests must be answered by the investor",
        });
      }

      if (row.status !== "pending") {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "Only pending offers can be updated" });
      }

      const updateResult = await pool.query(
        `UPDATE investment_requests
         SET status = $1
         WHERE investment_request_id = $2
         RETURNING *`,
        [nextStatus, offerId],
        );

      return res.json({ offer: updateResult.rows[0] });
    }

    if (offerType === "mentorship") {
      const requestResult = await client.query(
        `SELECT mr.*,
          ${MENTORSHIP_SOURCE_DIRECTION_SQL} as source_direction,
          m.user_id AS mentor_user_id
         FROM mentorship_requests mr
         JOIN mentors m ON m.mentor_id = mr.mentor_id
         WHERE mr.mentorship_request_id = $1 AND mr.startup_id = $2`,
        [offerId, startupId],
      );

      if (requestResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Mentorship offer not found" });
      }

      const row = requestResult.rows[0];
      if (row.source_direction !== "incoming") {
        await client.query("ROLLBACK");
        return res.status(403).json({
          error: "Mentorship requests you sent must be accepted or rejected by the mentor",
        });
      }

      if (row.status !== "pending") {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "Only pending offers can be updated" });
      }

      const nextStatus = status === "accepted" ? "accepted" : "rejected";
      const updateResult = await client.query(
        `UPDATE mentorship_requests
         SET status = $1
         WHERE mentorship_request_id = $2
         RETURNING *`,
        [nextStatus, offerId],
      );

      await notifyUser(
        client,
        row.mentor_user_id,
        "mentorship",
        status === "accepted" ? "Mentorship Offer Accepted" : "Mentorship Offer Rejected",
        `${startupName || "A startup"} ${status === "accepted" ? "accepted" : "rejected"} your mentorship proposal.`,
        "mentorship_requests",
        Number(offerId),
      );

      await client.query("COMMIT");
      return res.json({ offer: updateResult.rows[0], message: `Offer ${status}` });
    }

    await client.query("ROLLBACK");
    return res.status(400).json({ error: "Invalid offer type" });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
// ===== Startup Sessions (Mentors & Investors) =====

exports.getStartupSessions = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const startupRes = await pool.query("SELECT startup_id FROM startups WHERE user_id = $1", [userId]);
    
    if (startupRes.rowCount === 0) {
      return res.status(404).json({ error: "Startup profile not found" });
    }
    const startupId = startupRes.rows[0].startup_id;

    // Fetch Mentorship Sessions
    const mentorSessions = await pool.query(
      `SELECT
         ms.mentorship_session_id as id,
         'mentor' as type,
         u.first_name || ' ' || u.last_name as actor_name,
         'Mentorship Session' as topic,
         ms.scheduled_at,
         ms.duration_minutes,
         ms.meeting_link,
         ms.status
       FROM mentorship_sessions ms
       JOIN mentorship_requests mr ON mr.mentorship_request_id = ms.mentorship_request_id
       JOIN mentors m ON m.mentor_id = mr.mentor_id
       JOIN users u ON u.user_id = m.user_id
       WHERE mr.startup_id = $1`,
      [startupId]
    );

    // Fetch Investor Meetings
    const investorMeetings = await pool.query(
      `SELECT
         im.investor_meeting_id as id,
         'investor' as type,
         COALESCE(i.organization_name, u.first_name || ' ' || u.last_name) as actor_name,
         im.topic,
         im.scheduled_at,
         im.duration_minutes,
         im.meeting_link,
         im.status
       FROM investor_meetings im
       JOIN investors i ON i.investor_id = im.investor_id
       JOIN users u ON u.user_id = i.user_id
       WHERE im.startup_id = $1`,
      [startupId]
    );

    const sessions = [
      ...mentorSessions.rows.map(s => ({ ...s, unique_id: `mentor_${s.id}` })),
      ...investorMeetings.rows.map(s => ({ ...s, unique_id: `investor_${s.id}` }))
    ].sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createStartupSession = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const startupRes = await pool.query("SELECT startup_id FROM startups WHERE user_id = $1", [userId]);
    
    if (startupRes.rowCount === 0) {
      return res.status(404).json({ error: "Startup profile not found" });
    }
    const startupId = startupRes.rows[0].startup_id;

    const { type, request_id, scheduled_at, topic, meeting_link } = req.body;
    const normalizedType = {
      mentor: "mentor",
      mentorship: "mentor",
      investor: "investor",
      investment: "investor",
    }[String(type || "").trim().toLowerCase()];
    const when = new Date(scheduled_at);

    if (Number.isNaN(when.getTime())) {
      return res.status(400).json({ error: "Invalid scheduled_at time" });
    }

    if (normalizedType === "mentor") {
      // Validate request belongs to startup
      const reqCheck = await pool.query(
        "SELECT mentorship_request_id FROM mentorship_requests WHERE mentorship_request_id = $1 AND startup_id = $2 AND status = 'accepted'",
        [request_id, startupId]
      );
      if (reqCheck.rowCount === 0) {
        return res.status(403).json({ error: "Invalid or unaccepted mentorship request" });
      }

      const insertRes = await pool.query(
        `INSERT INTO mentorship_sessions (mentorship_request_id, scheduled_at, duration_minutes, meeting_link, status)
         VALUES ($1, $2, 30, $3, 'scheduled') RETURNING mentorship_session_id as id`,
        [request_id, when.toISOString(), meeting_link || null]
      );
      return res.json({ session_id: `mentor_${insertRes.rows[0].id}`, message: "Mentorship session scheduled" });

    } else if (normalizedType === "investor") {
      // Validate request belongs to startup
      const reqCheck = await pool.query(
        "SELECT investor_id FROM investment_requests WHERE investment_request_id = $1 AND startup_id = $2 AND status IN ('approved', 'accepted')",
        [request_id, startupId]
      );
      if (reqCheck.rowCount === 0) {
        return res.status(403).json({ error: "Invalid or unaccepted investment request" });
      }
      const investorId = reqCheck.rows[0].investor_id;

      const insertRes = await pool.query(
        `INSERT INTO investor_meetings (startup_id, investor_id, investment_request_id, scheduled_at, topic, meeting_link, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING investor_meeting_id as id`,
        [startupId, investorId, request_id, when.toISOString(), topic || "Investment Discussion", meeting_link || null]
      );
      return res.json({ session_id: `investor_${insertRes.rows[0].id}`, message: "Investor meeting scheduled" });

    } else {
      return res.status(400).json({ error: "Invalid session type" });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStartupSession = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { sessionId } = req.params;
    const { status } = req.body;

    const startupRes = await pool.query("SELECT startup_id FROM startups WHERE user_id = $1", [userId]);
    if (startupRes.rowCount === 0) {
      return res.status(404).json({ error: "Startup profile not found" });
    }
    const startupId = startupRes.rows[0].startup_id;

    if (sessionId.startsWith("mentor_")) {
      const id = parseInt(sessionId.split("_")[1], 10);
      const ownershipCheck = await pool.query(
        `SELECT ms.mentorship_session_id FROM mentorship_sessions ms
         JOIN mentorship_requests mr ON mr.mentorship_request_id = ms.mentorship_request_id
         WHERE ms.mentorship_session_id = $1 AND mr.startup_id = $2`,
        [id, startupId]
      );
      if (ownershipCheck.rowCount === 0) return res.status(403).json({ error: "Access denied" });

      await pool.query("UPDATE mentorship_sessions SET status = $1 WHERE mentorship_session_id = $2", [status, id]);
      return res.json({ message: "Session updated" });

    } else if (sessionId.startsWith("investor_")) {
      const id = parseInt(sessionId.split("_")[1], 10);
      const ownershipCheck = await pool.query(
        "SELECT investor_meeting_id FROM investor_meetings WHERE investor_meeting_id = $1 AND startup_id = $2",
        [id, startupId]
      );
      if (ownershipCheck.rowCount === 0) return res.status(403).json({ error: "Access denied" });

      await pool.query("UPDATE investor_meetings SET status = $1 WHERE investor_meeting_id = $2", [status, id]);
      return res.json({ message: "Meeting updated" });
    }

    return res.status(400).json({ error: "Invalid session format" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.downloadStartupSessionCalendar = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { sessionId } = req.params;

    const startupRes = await pool.query("SELECT startup_id, startup_name FROM startups WHERE user_id = $1", [userId]);
    if (startupRes.rowCount === 0) {
      return res.status(404).json({ error: "Startup profile not found" });
    }
    const startup = startupRes.rows[0];

    let result;
    let type;
    if (sessionId.startsWith("mentor_")) {
      type = "mentor";
      const id = parseInt(sessionId.split("_")[1], 10);
      result = await pool.query(
        `SELECT
           ms.mentorship_session_id AS id,
           ms.scheduled_at,
           ms.duration_minutes,
           ms.meeting_link,
           ms.status,
           ms.created_at,
           ms.updated_at,
           mr.subject,
           u.first_name || ' ' || u.last_name AS actor_name
         FROM mentorship_sessions ms
         JOIN mentorship_requests mr ON mr.mentorship_request_id = ms.mentorship_request_id
         JOIN mentors m ON m.mentor_id = mr.mentor_id
         JOIN users u ON u.user_id = m.user_id
         WHERE ms.mentorship_session_id = $1 AND mr.startup_id = $2`,
        [id, startup.startup_id],
      );
    } else if (sessionId.startsWith("investor_")) {
      type = "investor";
      const id = parseInt(sessionId.split("_")[1], 10);
      result = await pool.query(
        `SELECT
           im.investor_meeting_id AS id,
           im.scheduled_at,
           im.duration_minutes,
           im.meeting_link,
           im.status,
           im.created_at,
           im.updated_at,
           im.topic AS subject,
           COALESCE(i.organization_name, u.first_name || ' ' || u.last_name) AS actor_name
         FROM investor_meetings im
         JOIN investors i ON i.investor_id = im.investor_id
         JOIN users u ON u.user_id = i.user_id
         WHERE im.investor_meeting_id = $1 AND im.startup_id = $2`,
        [id, startup.startup_id],
      );
    } else {
      return res.status(400).json({ error: "Invalid session format" });
    }

    if (!result.rowCount) {
      return res.status(404).json({ error: "Session not found" });
    }

    const session = result.rows[0];
    const title = session.subject || `${type === "mentor" ? "Mentorship session" : "Investor meeting"} with ${session.actor_name}`;
    const description = [
      `Startup: ${startup.startup_name}`,
      `${type === "mentor" ? "Mentor" : "Investor"}: ${session.actor_name}`,
      `Status: ${session.status}`,
    ].join("\n");
    const ics = buildIcsEvent({
      uid: `startup-${type}-session-${session.id}@startupconnect.local`,
      title,
      description,
      location: session.meeting_link || "Online meeting",
      url: session.meeting_link,
      start: session.scheduled_at,
      end: addMinutes(session.scheduled_at, session.duration_minutes || 30),
      created: session.created_at,
      updated: session.updated_at,
    });

    return sendIcs(res, `startupconnect-${type}-session-${session.id}.ics`, ics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
