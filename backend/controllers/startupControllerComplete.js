const pool = require("../config/db");
const profileSanitizer = require("../services/profileSanitizer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const PROJECT_DOC_CATEGORIES = {
	pitch_deck: {
		label: "Pitch deck",
		acceptMime: ["application/pdf"],
		acceptExt: [".pdf"],
		maxBytes: 10 * 1024 * 1024,
		required: true,
	},
	business_plan: {
		label: "Business plan",
		acceptMime: ["application/pdf"],
		acceptExt: [".pdf"],
		maxBytes: 20 * 1024 * 1024,
		required: true,
	},
	financial_doc: {
		label: "Financial doc",
		acceptMime: [
			"application/pdf",
			"application/vnd.ms-excel",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		],
		acceptExt: [".pdf", ".xls", ".xlsx"],
		maxBytes: 10 * 1024 * 1024,
		required: true,
	},
	demo_video: {
		label: "Demo video",
		acceptMime: ["video/mp4"],
		acceptExt: [".mp4"],
		maxBytes: 50 * 1024 * 1024,
		required: false,
	},
};

function resolveProjectDocCategory(body = {}) {
	const key = String(body.document_category || "").trim().toLowerCase();
	if (key && PROJECT_DOC_CATEGORIES[key]) return { key, ...PROJECT_DOC_CATEGORIES[key] };
	const desc = String(body.description || "").trim().toLowerCase();
	for (const [k, cfg] of Object.entries(PROJECT_DOC_CATEGORIES)) {
		if (desc === cfg.label.toLowerCase()) return { key: k, ...cfg };
	}
	return null;
}

function validateProjectFile(file, category) {
	if (!file || !category) {
		return { ok: false, error: "Invalid upload request." };
	}
	const ext = path.extname(file.originalname || "").toLowerCase();
	const mime = String(file.mimetype || "").toLowerCase();
	const mimeOk =
		category.acceptMime.includes(mime) ||
		category.acceptExt.includes(ext);
	if (!mimeOk) {
		const formats =
			category.key === "demo_video"
				? "MP4"
				: category.key === "financial_doc"
					? "PDF or Excel"
					: "PDF";
		return {
			ok: false,
			error: `Invalid format. ${category.label} must be ${formats}.`,
		};
	}
	if (file.size > category.maxBytes) {
		const maxMb = Math.round(category.maxBytes / (1024 * 1024));
		return {
			ok: false,
			error: `${category.label} exceeds the ${maxMb}MB size limit.`,
		};
	}
	return { ok: true };
}

async function assertProjectOwnership(projectId, userId) {
	const projectRes = await pool.query(
		`SELECT p.project_id, p.status
     FROM projects p
     JOIN startups s ON p.startup_id = s.startup_id
     WHERE p.project_id = $1 AND s.user_id = $2`,
		[projectId, userId],
	);
	return projectRes.rows[0] || null;
}

function unlinkStoredFile(filePath) {
	if (!filePath || String(filePath).startsWith("db://")) return;
	try {
		const resolvedPath = resolveStoredUploadPath(filePath) || filePath;
		if (fs.existsSync(resolvedPath)) fs.unlinkSync(resolvedPath);
	} catch {
		/* ignore */
	}
}

function resolveStoredUploadPath(filePath) {
	if (!filePath || String(filePath).startsWith("db://")) return null;
	const normalized = String(filePath).replace(/\\/g, "/");
	const uploadRoots = [
		path.resolve(process.cwd(), "uploads"),
		path.resolve(__dirname, "..", "uploads"),
	];
	const candidates = path.isAbsolute(normalized)
		? [path.resolve(normalized)]
		: [
				path.resolve(process.cwd(), normalized),
				path.resolve(__dirname, "..", normalized),
			];

	for (const candidate of candidates) {
		if (
			uploadRoots.some(
				(root) => candidate === root || candidate.startsWith(`${root}${path.sep}`),
			) &&
			fs.existsSync(candidate)
		) {
			return candidate;
		}
	}
	return null;
}

async function ensureInvestmentRequestDirectionSchema() {
	await pool.query("ALTER TABLE investment_requests ALTER COLUMN project_id DROP NOT NULL");
	await pool.query("ALTER TABLE investment_requests ADD COLUMN IF NOT EXISTS initiated_by VARCHAR(20) NOT NULL DEFAULT 'startup'");
	await pool.query("ALTER TABLE investment_requests DROP CONSTRAINT IF EXISTS investment_requests_initiated_by_check");
	await pool.query("ALTER TABLE investment_requests ADD CONSTRAINT investment_requests_initiated_by_check CHECK (initiated_by IN ('startup', 'investor'))");
}

// UC_28: Create Startup Project
exports.createProject = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const {
			project_title,
			industry,
			lifecycle_stage,
			description,
			problem_statement,
			solution_statement,
			expected_impact,
			funding_goal,
			start_date,
			end_date,
		} = req.body;

		const cover_photo_path = req.file
			? path.join("uploads", req.file.filename).replace(/\\/g, "/")
			: null;

		if (!project_title || !funding_goal) {
			return res.status(400).json({
				error: "project_title and funding_goal are required",
			});
		}

		// Get startup
		const startupRes = await pool.query(
			"SELECT startup_id FROM startups WHERE user_id = $1",
			[userId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup profile not found" });
		}

		const startup_id = startupRes.rows[0].startup_id;

		const result = await pool.query(
			`INSERT INTO projects (startup_id, project_title, industry, lifecycle_stage, description, problem_statement, solution_statement, expected_impact, cover_photo_path, funding_goal, start_date, end_date, status)
				 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'draft') RETURNING *`,
			[startup_id, project_title, industry, lifecycle_stage, description, problem_statement, solution_statement, expected_impact, cover_photo_path, funding_goal, start_date, end_date]
		);

		res.status(201).json({ ...result.rows[0], project_id: result.rows[0].project_id });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_28b: Get My Projects
exports.getMyProjects = async (req, res) => {
	try {
		const userId = req.user.user_id;

		const startupRes = await pool.query(
			"SELECT startup_id FROM startups WHERE user_id = $1",
			[userId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup profile not found" });
		}

		const startup_id = startupRes.rows[0].startup_id;

		const result = await pool.query(
			"SELECT * FROM projects WHERE startup_id = $1 ORDER BY created_at DESC",
			[startup_id]
		);

		res.json({ projects: result.rows });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_28c: Get Project Details
exports.getProjectDetails = async (req, res) => {
	try {
		const { projectId } = req.params;
		const userId = req.user.user_id;

		const projectRes = await pool.query(
			"SELECT * FROM projects WHERE project_id = $1",
			[projectId]
		);

		if (projectRes.rows.length === 0) {
			return res.status(404).json({ message: "Project not found" });
		}

		// Verify ownership
		const startupRes = await pool.query(
			"SELECT startup_id FROM startups WHERE startup_id = $1 AND user_id = $2",
			[projectRes.rows[0].startup_id, userId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(403).json({ message: "Unauthorized" });
		}

		res.json(projectRes.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_28d: Update Project
exports.updateProject = async (req, res) => {
	try {
		const { projectId } = req.params;
		const userId = req.user.user_id;
		const {
			project_title,
			industry,
			lifecycle_stage,
			description,
			problem_statement,
			solution_statement,
			expected_impact,
			funding_goal,
			status,
		} = req.body;

		const cover_photo_path = req.file
			? path.join("uploads", req.file.filename).replace(/\\/g, "/")
			: null;

		// Verify ownership
		const projectRes = await pool.query(
			"SELECT p.* FROM projects p JOIN startups s ON p.startup_id = s.startup_id WHERE p.project_id = $1 AND s.user_id = $2",
			[projectId, userId]
		);

		if (projectRes.rows.length === 0) {
			return res.status(403).json({ message: "Unauthorized" });
		}

		const result = await pool.query(
			`UPDATE projects SET project_title = COALESCE($1, project_title), 
			 industry = COALESCE($2, industry), lifecycle_stage = COALESCE($3, lifecycle_stage),
			 description = COALESCE($4, description), problem_statement = COALESCE($5, problem_statement),
			 solution_statement = COALESCE($6, solution_statement), expected_impact = COALESCE($7, expected_impact),
			 funding_goal = COALESCE($8, funding_goal), cover_photo_path = COALESCE($9, cover_photo_path),
			 status = COALESCE($10, status)
			 WHERE project_id = $11 RETURNING *`,
			[project_title, industry, lifecycle_stage, description, problem_statement, solution_statement, expected_impact, funding_goal, cover_photo_path, status, projectId]
		);

		res.json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.deleteProject = async (req, res) => {
	let client;
	try {
		client = await pool.connect();
		const userId = req.user.user_id;
		const projectId = Number(req.params.projectId);
		if (!Number.isInteger(projectId) || projectId <= 0) {
			return res.status(400).json({ error: "Invalid project id" });
		}

		await client.query("BEGIN");
		const projectRes = await client.query(
			`SELECT p.project_id, p.cover_photo_path
			 FROM projects p
			 JOIN startups s ON s.startup_id = p.startup_id
			 WHERE p.project_id = $1 AND s.user_id = $2
			 FOR UPDATE`,
			[projectId, userId],
		);
		if (!projectRes.rowCount) {
			await client.query("ROLLBACK");
			return res.status(404).json({ error: "Project not found" });
		}

		const linkedRequests = await client.query(
			"SELECT 1 FROM investment_requests WHERE project_id = $1 LIMIT 1",
			[projectId],
		);
		if (linkedRequests.rowCount) {
			await client.query("ROLLBACK");
			return res.status(409).json({
				error: "This project has funding activity and cannot be deleted.",
			});
		}

		const docs = await client.query(
			"SELECT file_path FROM documents WHERE project_id = $1",
			[projectId],
		);
		await client.query("DELETE FROM projects WHERE project_id = $1", [projectId]);
		await client.query("COMMIT");

		for (const doc of docs.rows) unlinkStoredFile(doc.file_path);
		unlinkStoredFile(projectRes.rows[0].cover_photo_path);

		return res.json({ message: "Project deleted successfully" });
	} catch (err) {
		try {
			await client.query("ROLLBACK");
		} catch {
			/* ignore */
		}
		return res.status(500).json({ error: err.message });
	} finally {
		client?.release();
	}
};

// UC_29: Upload Documents
exports.uploadDocument = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { project_id, description } = req.body;

		if (!req.file) {
			return res.status(400).json({ error: "No file uploaded" });
		}

		const startupRes = await pool.query(
			"SELECT startup_id FROM startups WHERE user_id = $1",
			[userId],
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup profile not found" });
		}

		const startup_id = startupRes.rows[0].startup_id;
		const projectIdValue = project_id ? Number(project_id) : null;

		if (!projectIdValue || Number.isNaN(projectIdValue)) {
			return res.status(400).json({ error: "project_id is required for project documents." });
		}

		const project = await assertProjectOwnership(projectIdValue, userId);
		if (!project) {
			return res.status(403).json({ message: "Unauthorized or project not found" });
		}

		const category = resolveProjectDocCategory(req.body);
		const docDescription = category ? category.label : description || null;

		if (category) {
			const validation = validateProjectFile(req.file, category);
			if (!validation.ok) {
				unlinkStoredFile(req.file.path);
				return res.status(400).json({ error: validation.error });
			}
		}

		const existing = await pool.query(
			`SELECT document_id, file_path FROM documents
       WHERE startup_id = $1 AND project_id = $2 AND LOWER(TRIM(description)) = LOWER(TRIM($3))`,
			[startup_id, projectIdValue, docDescription],
		);
		for (const row of existing.rows) {
			unlinkStoredFile(row.file_path);
			await pool.query("DELETE FROM documents WHERE document_id = $1", [row.document_id]);
		}

		const fileBuffer = fs.readFileSync(req.file.path);
		const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
		const storedPath = `db://documents/startup/${startup_id}/${crypto.randomBytes(16).toString("hex")}`;
		const result = await pool.query(
			`INSERT INTO documents (startup_id, project_id, file_name, file_path, file_type, file_size_bytes, file_hash, file_data, description)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			 RETURNING document_id, startup_id, project_id, file_name, file_path, file_type,
			           file_size_bytes, description, created_at`,
			[
				startup_id,
				projectIdValue,
				req.file.originalname,
				storedPath,
				req.file.mimetype,
				req.file.size,
				fileHash,
				fileBuffer,
				docDescription,
			],
		);
		unlinkStoredFile(req.file.path);

		res.status(201).json(result.rows[0]);
	} catch (err) {
		unlinkStoredFile(req.file?.path);
		res.status(500).json({ error: err.message });
	}
};

// UC_29: Get Documents
exports.getDocuments = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { project_id } = req.query;

		const startupRes = await pool.query(
			"SELECT startup_id FROM startups WHERE user_id = $1",
			[userId],
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup profile not found" });
		}

		const params = [startupRes.rows[0].startup_id];
		let query = `SELECT document_id, startup_id, project_id, file_name, file_path, file_type,
                    file_size_bytes, description,
                    (file_data IS NOT NULL) AS has_file_data,
                    COALESCE(verification_status, 'pending') AS verification_status,
                    created_at
             FROM documents WHERE startup_id = $1`;

		if (project_id) {
			params.push(Number(project_id));
			query += ` AND project_id = $${params.length}`;
		}

		query += " ORDER BY created_at DESC";

		const result = await pool.query(query, params);

		res.json({
			documents: result.rows.map(({ has_file_data, ...doc }) => ({
				...doc,
				file_available:
					has_file_data || Boolean(resolveStoredUploadPath(doc.file_path)),
			})),
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

/** GET /api/startups/documents/:documentId/file — stream document for in-app preview */
exports.getDocumentFile = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const role = req.user.role;
		const documentId = Number(req.params.documentId);

		if (!Number.isInteger(documentId) || documentId <= 0) {
			return res.status(400).json({ error: "Invalid document id" });
		}

		let query;
		let params;

		if (role === "Startup") {
			query = `SELECT d.* FROM documents d
         JOIN startups s ON s.startup_id = d.startup_id
         WHERE d.document_id = $1 AND s.user_id = $2`;
			params = [documentId, userId];
		} else if (role === "Investor" || role === "Admin") {
			query = "SELECT * FROM documents WHERE document_id = $1";
			params = [documentId];
		} else if (role === "Mentor") {
			query = `SELECT d.* FROM documents d
         JOIN mentorship_requests mr ON mr.startup_id = d.startup_id
         JOIN mentors m ON m.mentor_id = mr.mentor_id
         WHERE d.document_id = $1 AND m.user_id = $2 AND mr.status = 'accepted'`;
			params = [documentId, userId];
		} else {
			return res.status(403).json({ error: "Not allowed to view this document" });
		}

		const docRes = await pool.query(query, params);
		if (!docRes.rows.length) {
			return res.status(404).json({ error: "Document not found" });
		}

		const doc = docRes.rows[0];
		const safeName = String(doc.file_name || "document").replace(/[^\w.\- ()]/g, "_");
		const contentType = doc.file_type || "application/octet-stream";

		res.setHeader("Content-Type", contentType);
		res.setHeader("Content-Disposition", `inline; filename="${safeName}"`);

		if (doc.file_data) {
			return res.send(doc.file_data);
		}

		if (!doc.file_path || String(doc.file_path).startsWith("db://")) {
			return res.status(404).json({ error: "File content is not available" });
		}

		const absPath = resolveStoredUploadPath(doc.file_path);
		if (!absPath) {
			return res.status(404).json({ error: "File missing on server" });
		}
		return res.sendFile(absPath);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.deleteDocument = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const documentId = Number(req.params.documentId);

		const docRes = await pool.query(
			`SELECT d.* FROM documents d
       JOIN startups s ON s.startup_id = d.startup_id
       WHERE d.document_id = $1 AND s.user_id = $2`,
			[documentId, userId],
		);

		if (docRes.rows.length === 0) {
			return res.status(404).json({ message: "Document not found" });
		}

		const doc = docRes.rows[0];
		unlinkStoredFile(doc.file_path);
		await pool.query("DELETE FROM documents WHERE document_id = $1", [documentId]);

		res.json({ message: "Document deleted" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.publishProject = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const projectId = Number(req.params.projectId);

		const project = await assertProjectOwnership(projectId, userId);
		if (!project) {
			return res.status(403).json({ message: "Unauthorized or project not found" });
		}

		const docsRes = await pool.query(
			`SELECT LOWER(TRIM(description)) AS description
       FROM documents WHERE project_id = $1`,
			[projectId],
		);

		const uploaded = new Set(docsRes.rows.map((r) => r.description));
		const missing = Object.values(PROJECT_DOC_CATEGORIES)
			.filter((c) => c.required)
			.filter((c) => !uploaded.has(c.label.toLowerCase()))
			.map((c) => c.label);

		if (missing.length) {
			return res.status(400).json({
				error: "Upload all mandatory documents before publishing.",
				missing,
			});
		}

		const result = await pool.query(
			`UPDATE projects SET status = 'active' WHERE project_id = $1 RETURNING *`,
			[projectId],
		);

		res.json({ message: "Project published", project: result.rows[0] });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_30: Update Project Progress
exports.addProgressUpdate = async (req, res) => {
	try {
		const { projectId } = req.params;
		const userId = req.user.user_id;
		const { description, milestone, amount_raised } = req.body;

		// Verify ownership
		const projectRes = await pool.query(
			"SELECT p.* FROM projects p JOIN startups s ON p.startup_id = s.startup_id WHERE p.project_id = $1 AND s.user_id = $2",
			[projectId, userId]
		);

		if (projectRes.rows.length === 0) {
			return res.status(403).json({ message: "Unauthorized" });
		}

		// Update amount_raised if provided
		if (amount_raised !== undefined) {
			await pool.query(
				"UPDATE projects SET amount_raised = amount_raised + $1 WHERE project_id = $2",
				[amount_raised, projectId]
			);
		}

		// Log progress in a table (you'd need to create a project_updates table)
		// For now, we'll just return success
		res.json({ message: "Progress updated", milestone, amount_raised });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_31: Search Investors & Mentors
exports.searchInvestors = async (req, res) => {
	try {
		const {
			investment_range,
			industry,
			country,
			search,
			page = 1,
			limit = 20,
		} = req.query;

		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		let query = `
			SELECT i.*, u.first_name, u.last_name, u.email,
			       u.is_approved AS user_approved,
			       COALESCE(i.is_approved, false) AS investor_listed
			FROM investors i
			JOIN users u ON i.user_id = u.user_id
			WHERE u.role = 'Investor'
			  AND COALESCE(u.is_active, true) = true
			  AND u.is_approved = true
			  AND COALESCE(i.is_approved, false) = true
		`;
		const params = [];

		if (industry) {
			params.push(`%${String(industry).trim()}%`);
			query += ` AND COALESCE(i.preferred_industry, '') ILIKE $${params.length}`;
		}

		if (country) {
			params.push(`%${String(country).trim()}%`);
			query += ` AND (
				COALESCE(i.country, '') ILIKE $${params.length}
				OR COALESCE(i.location_preference, '') ILIKE $${params.length}
			)`;
		}

		if (search) {
			params.push(`%${String(search).trim()}%`);
			query += ` AND (
				COALESCE(i.organization_name, '') ILIKE $${params.length}
				OR COALESCE(i.preferred_industry, '') ILIKE $${params.length}
				OR COALESCE(i.investor_type, '') ILIKE $${params.length}
				OR COALESCE(i.investment_stage, '') ILIKE $${params.length}
				OR COALESCE(i.location_preference, '') ILIKE $${params.length}
				OR COALESCE(i.country, '') ILIKE $${params.length}
				OR COALESCE(i.bio, '') ILIKE $${params.length}
				OR COALESCE(u.first_name, '') ILIKE $${params.length}
				OR COALESCE(u.last_name, '') ILIKE $${params.length}
			)`;
		}

		const countQuery = query.replace(/SELECT[\s\S]+?FROM/i, "SELECT COUNT(*)::int AS total FROM");
		const countResult = await pool.query(countQuery, params);
		const total = parseInt(countResult.rows[0].total, 10);

		query += ` ORDER BY i.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
		params.push(limitNum, offset);

		const result = await pool.query(query, params);

		res.json({
			investors: result.rows.map((row) => profileSanitizer.sanitizeInvestorPublic(row)),
			total,
			page: pageNum,
			limit: limitNum,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.searchMentors = async (req, res) => {
	try {
		const { expertise, experience, country, search, page = 1, limit = 20 } = req.query;

		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		// List mentors with completed profiles; approved mentors first, then pending account approval
		let query = `
			SELECT m.*, u.first_name, u.last_name, u.email,
			       u.is_approved AS user_approved,
			       COALESCE(m.is_approved, false) AS mentor_listed,
			       m.current_organization AS company,
			       COALESCE(m.city_location, m.country) AS location,
			       m.professional_title AS mentor_type
			FROM mentors m
			JOIN users u ON m.user_id = u.user_id
			WHERE u.role = 'Mentor'
			  AND COALESCE(u.is_active, true) = true
			  AND u.is_approved = true
			  AND COALESCE(m.is_approved, false) = true
		`;
		const params = [];

		if (expertise) {
			params.push(`%${expertise}%`);
			query += ` AND (
				COALESCE(m.expertise, '') ILIKE $${params.length}
				OR COALESCE(m.primary_industry, '') ILIKE $${params.length}
				OR COALESCE(m.secondary_industry, '') ILIKE $${params.length}
				OR COALESCE(m.professional_title, '') ILIKE $${params.length}
			)`;
		}

		if (experience) {
			params.push(experience);
			query += ` AND m.years_experience >= $${params.length}`;
		}

		if (country) {
			params.push(`%${String(country).trim()}%`);
			query += ` AND (
				COALESCE(m.country, '') ILIKE $${params.length}
				OR COALESCE(m.city_location, '') ILIKE $${params.length}
			)`;
		}

		if (search) {
			params.push(`%${String(search).trim()}%`);
			query += ` AND (
				COALESCE(m.headline, '') ILIKE $${params.length}
				OR COALESCE(m.bio, '') ILIKE $${params.length}
				OR COALESCE(m.expertise, '') ILIKE $${params.length}
				OR COALESCE(m.primary_industry, '') ILIKE $${params.length}
				OR COALESCE(m.secondary_industry, '') ILIKE $${params.length}
				OR COALESCE(m.professional_title, '') ILIKE $${params.length}
				OR COALESCE(m.current_organization, '') ILIKE $${params.length}
				OR COALESCE(m.city_location, '') ILIKE $${params.length}
				OR COALESCE(m.country, '') ILIKE $${params.length}
				OR COALESCE(u.first_name, '') ILIKE $${params.length}
				OR COALESCE(u.last_name, '') ILIKE $${params.length}
			)`;
		}

		const countQuery = query.replace(/SELECT[\s\S]+?FROM/i, "SELECT COUNT(*)::int AS total FROM");
		const countResult = await pool.query(countQuery, params);
		const total = parseInt(countResult.rows[0].total, 10);

		query += ` ORDER BY (CASE WHEN u.is_approved = true AND COALESCE(m.is_approved, false) = true THEN 0 ELSE 1 END), m.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
		params.push(limitNum, offset);

		const result = await pool.query(query, params);

		res.json({
			mentors: result.rows.map((row) => profileSanitizer.sanitizeMentorPublic(row)),
			total,
			page: pageNum,
			limit: limitNum,
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

function sameValue(left, right) {
	return Boolean(left && right && String(left).trim().toLowerCase() === String(right).trim().toLowerCase());
}

function containsValue(left, right) {
	return Boolean(left && right && String(left).toLowerCase().includes(String(right).toLowerCase()));
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
		investor.first_name,
		investor.last_name,
	].filter(Boolean).join(" ");
}

// UC_32: AI Recommendations
exports.getInvestorRecommendations = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const limitNum = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 10));

		const startupRes = await pool.query(
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
			 WHERE s.user_id = $1`,
			[userId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup profile not found" });
		}

		const startup = startupRes.rows[0];
		const startupIndustry = startup.project_industry || startup.industry;
		const startupStage = startup.lifecycle_stage || startup.business_stage;
		const fundingNeed = Number(startup.funding_goal || startup.funding_needed || 0);
		const startupText = buildStartupRecommendationText(startup);

		const result = await pool.query(
			`SELECT i.*, u.first_name, u.last_name, u.email
			 FROM investors i
			 JOIN users u ON i.user_id = u.user_id
			 WHERE u.is_approved = true
			   AND u.is_active = true
			 ORDER BY i.created_at DESC
			 LIMIT 100`
		);

		const recommendations = result.rows
			.map((investor) => {
				const reasons = [];
				let ruleScore = 0;
				const investmentBudget = Number(investor.investment_budget || 0);

				if (
					sameValue(investor.preferred_industry, startupIndustry) ||
					containsValue(investor.preferred_industry, startupIndustry) ||
					containsValue(startupIndustry, investor.preferred_industry)
				) {
					ruleScore += 0.32;
					reasons.push("Investor focuses on your industry");
				}

				if (
					sameValue(investor.investment_stage, startupStage) ||
					containsValue(investor.investment_stage, startupStage) ||
					containsValue(startupStage, investor.investment_stage)
				) {
					ruleScore += 0.22;
					reasons.push("Investor prefers your startup stage");
				}

				if (investmentBudget > 0 && fundingNeed > 0) {
					const ratio = fundingNeed / investmentBudget;
					if (ratio <= 1) {
						ruleScore += 0.18;
						reasons.push("Investor budget can cover your funding need");
					} else if (ratio <= 1.5) {
						ruleScore += 0.08;
						reasons.push("Investor budget is close to your funding need");
					}
				}

				if (
					investor.location_preference &&
					containsValue(`${startup.location || ""} ${startup.region || ""} ${startup.city || ""}`, investor.location_preference)
				) {
					ruleScore += 0.08;
					reasons.push("Investor location preference matches your market");
				}

				const similarityScore = tokenSimilarity(startupText, buildInvestorRecommendationText(investor));
				const finalScore = Math.min(0.99, Math.max(0.35, similarityScore * 0.35 + ruleScore + 0.2));
				const score = Number(finalScore.toFixed(2));

				return {
					investor: profileSanitizer.sanitizeInvestorPublic({
						investor_id: investor.investor_id,
						investor_type: investor.investor_type,
						organization_name: investor.organization_name,
						investment_budget: investor.investment_budget,
						investment_budget_min: investor.investment_budget_min,
						preferred_industry: investor.preferred_industry,
						investment_stage: investor.investment_stage,
						location_preference: investor.location_preference,
						country: investor.country,
						portfolio_size: investor.portfolio_size,
						bio: investor.bio,
						first_name: investor.first_name,
						last_name: investor.last_name,
						user_approved: true,
						investor_listed: investor.is_approved,
					}),
					score,
					match_percent: Math.round(score * 100),
					similarityScore: Number(similarityScore.toFixed(3)),
					ruleScore: Number(ruleScore.toFixed(3)),
					finalScore: score,
					reasons,
					reason: reasons.join(", ") || "Investor profile is related to your startup and project details",
				};
			})
			.sort((a, b) => b.finalScore - a.finalScore)
			.slice(0, limitNum);

		res.json({
			recommendations,
			source: "ai-reccommendation/adapted",
			startup_profile: {
				industry: startupIndustry,
				stage: startupStage,
				funding_need: fundingNeed,
				location: startup.location || startup.city || startup.region,
				project_id: startup.project_id,
			},
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.getMentorRecommendations = async (req, res) => {
	try {
		const userId = req.user.user_id;

		const startupRes = await pool.query(
			"SELECT industry FROM startups WHERE user_id = $1",
			[userId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup profile not found" });
		}

		const { industry } = startupRes.rows[0];

		// Find matching mentors
		const result = await pool.query(
			`SELECT m.*, u.first_name, u.last_name FROM mentors m 
			 JOIN users u ON m.user_id = u.user_id
			 WHERE u.is_approved = true AND m.expertise ILIKE $1
			 LIMIT 10`,
			[`%${industry}%`]
		);

		const recommendations = result.rows.map((mentor) => ({
			mentor: profileSanitizer.sanitizeMentorPublic(mentor),
			score: 0.8,
			reason: `Expertise in ${industry}`,
		}));

		res.json({ recommendations });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_33: Apply for Investment
exports.createInvestmentRequest = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { investor_id, project_id, requested_amount, proposal_message } =
			req.body;
		let projectId = project_id ? Number.parseInt(project_id, 10) : null;
		const amount = Number(requested_amount);

		if (!investor_id) {
			return res.status(400).json({ error: "investor_id is required" });
		}

		if (!Number.isFinite(amount) || amount <= 0) {
			return res.status(400).json({ error: "requested_amount must be a positive number" });
		}

		if (project_id && !Number.isInteger(projectId)) {
			return res.status(400).json({ error: "project_id must be a valid number" });
		}

		// Validate investor exists
		const investorRes = await pool.query(
			"SELECT investor_id FROM investors WHERE investor_id = $1",
			[investor_id]
		);

		if (investorRes.rows.length === 0) {
			return res.status(404).json({ error: "Investor not found" });
		}

		// Validate startup exists
		const startupRes = await pool.query(
			"SELECT startup_id FROM startups WHERE user_id = $1",
			[userId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup profile not found" });
		}

		const startup_id = startupRes.rows[0].startup_id;

		const existingOffer = await pool.query(
			`SELECT investment_request_id, status
			 FROM investment_requests
			 WHERE startup_id = $1 AND investor_id = $2
			   AND status IN ('pending', 'approved')
			 LIMIT 1`,
			[startup_id, investor_id],
		);

		if (existingOffer.rowCount > 0) {
			return res.status(409).json({
				error: "You already have an active investment request with this investor.",
				existing_offer: {
					offerType: "investment",
					id: existingOffer.rows[0].investment_request_id,
					status: existingOffer.rows[0].status,
				},
			});
		}

		// Validate project exists if provided
		if (projectId) {
			const projectRes = await pool.query(
				"SELECT project_id FROM projects WHERE project_id = $1 AND startup_id = $2",
				[projectId, startup_id]
			);

			if (projectRes.rows.length === 0) {
				return res.status(404).json({ error: "Project not found" });
			}
		} else {
			const projectRes = await pool.query(
				`SELECT project_id
				 FROM projects
				 WHERE startup_id = $1 AND status IN ('active', 'draft')
				 ORDER BY status = 'active' DESC, created_at DESC
				 LIMIT 1`,
				[startup_id]
			);
			projectId = projectRes.rows[0]?.project_id || null;
		}

		await ensureInvestmentRequestDirectionSchema();

		const existingOpenOffer = await pool.query(
			`SELECT investment_request_id, initiated_by, status
			 FROM investment_requests
			 WHERE startup_id = $1
			   AND investor_id = $2
			   AND ($3::int IS NULL OR project_id = $3)
			   AND status IN ('pending', 'approved', 'accepted')
			 ORDER BY created_at DESC
			 LIMIT 1`,
			[startup_id, investor_id, projectId]
		);

		if (existingOpenOffer.rowCount > 0) {
			const existing = existingOpenOffer.rows[0];
			const direction = existing.initiated_by === "startup" ? "your existing request" : "the investor's existing offer";
			return res.status(409).json({
				error: `There is already an open investment record for this investor/project. Respond to ${direction} instead of creating a second request.`,
				offer: existing,
			});
		}

		const result = await pool.query(
			`INSERT INTO investment_requests (startup_id, investor_id, project_id, requested_amount, proposal_message, initiated_by)
			 VALUES ($1, $2, $3, $4, $5, 'startup') RETURNING *`,
			[startup_id, investor_id, projectId, amount, proposal_message]
		);

		await pool.query(
			`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
			 SELECT user_id, 'investment', 'New Investment Request', $1, 'investment_requests', $2
			 FROM investors WHERE investor_id = $3`,
			[
				`A startup sent you an investment request for ${requested_amount}.`,
				result.rows[0].investment_request_id,
				investor_id,
			]
		);

		res.status(201).json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_38: Request Mentorship
exports.createMentorshipRequest = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { mentor_id, subject, message } = req.body;

		if (!mentor_id || !subject) {
			return res.status(400).json({ error: "mentor_id and subject are required" });
		}

		// Validate mentor exists
		const mentorRes = await pool.query(
			"SELECT mentor_id FROM mentors WHERE mentor_id = $1",
			[mentor_id]
		);

		if (mentorRes.rows.length === 0) {
			return res.status(404).json({ error: "Mentor not found" });
		}

		const startupRes = await pool.query(
			"SELECT startup_id FROM startups WHERE user_id = $1",
			[userId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup profile not found" });
		}

		const startup_id = startupRes.rows[0].startup_id;

		const existingRequest = await pool.query(
			`SELECT mentorship_request_id, status
			 FROM mentorship_requests
			 WHERE startup_id = $1 AND mentor_id = $2
			   AND status IN ('pending', 'accepted')
			 LIMIT 1`,
			[startup_id, mentor_id],
		);

		if (existingRequest.rowCount > 0) {
			return res.status(409).json({
				error: "You already have an active mentorship request with this mentor.",
				existing_offer: {
					offerType: "mentorship",
					id: existingRequest.rows[0].mentorship_request_id,
					status: existingRequest.rows[0].status,
				},
			});
		}

		const result = await pool.query(
			`INSERT INTO mentorship_requests (startup_id, mentor_id, subject, message, initiated_by)
			 VALUES ($1, $2, $3, $4, 'startup') RETURNING *`,
			[startup_id, mentor_id, subject, message]
		);

		// Notify mentor
		await pool.query(
			`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
			 SELECT user_id, $1, $2, $3, 'mentorship_requests', $4 FROM mentors WHERE mentor_id = $5`,
			["mentorship", "New Mentorship Request", subject, result.rows[0].mentorship_request_id, mentor_id]
		);

		res.status(201).json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_34: Send Message to Investor
exports.sendMessage = async (req, res) => {
	try {
		const startupUserId = req.user.user_id;
		const { investorId } = req.params;
		const { message } = req.body;

		if (!message) {
			return res.status(400).json({ error: "message is required" });
		}

		// Get investor user_id
		const investorRes = await pool.query(
			"SELECT user_id FROM investors WHERE investor_id = $1",
			[investorId]
		);

		if (investorRes.rows.length === 0) {
			return res.status(404).json({ message: "Investor not found" });
		}

		const investorUserId = investorRes.rows[0].user_id;
		const startupRes = await pool.query(
			"SELECT startup_id FROM startups WHERE user_id = $1",
			[startupUserId]
		);
		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup profile not found" });
		}
		const acceptedRes = await pool.query(
			`SELECT 1 FROM investment_requests
			 WHERE startup_id = $1 AND investor_id = $2 AND status IN ('approved', 'accepted')
			 LIMIT 1`,
			[startupRes.rows[0].startup_id, investorId]
		);
		if (acceptedRes.rowCount === 0) {
			return res.status(403).json({ error: "Chat is available only after an investment offer is accepted." });
		}

		// Save message
		const result = await pool.query(
			`INSERT INTO messages (sender_user_id, receiver_user_id, body, subject)
			 VALUES ($1, $2, $3, 'Investment Discussion') RETURNING *`,
			[startupUserId, investorUserId, message]
		);

		res.status(201).json({ message_id: result.rows[0].message_id });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_34: Get Messages from Investor
exports.getMessages = async (req, res) => {
	try {
		const startupUserId = req.user.user_id;
		const { investorId } = req.params;
		const { page = 1, limit = 20 } = req.query;

		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		// Get investor user_id
		const investorRes = await pool.query(
			"SELECT user_id FROM investors WHERE investor_id = $1",
			[investorId]
		);

		if (investorRes.rows.length === 0) {
			return res.status(404).json({ message: "Investor not found" });
		}

		const investorUserId = investorRes.rows[0].user_id;
		const startupRes = await pool.query(
			"SELECT startup_id FROM startups WHERE user_id = $1",
			[startupUserId]
		);
		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup profile not found" });
		}
		const acceptedRes = await pool.query(
			`SELECT 1 FROM investment_requests
			 WHERE startup_id = $1 AND investor_id = $2 AND status IN ('approved', 'accepted')
			 LIMIT 1`,
			[startupRes.rows[0].startup_id, investorId]
		);
		if (acceptedRes.rowCount === 0) {
			return res.status(403).json({ error: "Chat is available only after an investment offer is accepted." });
		}

		const result = await pool.query(
			`SELECT * FROM messages 
			 WHERE (sender_user_id = $1 AND receiver_user_id = $2) OR (sender_user_id = $2 AND receiver_user_id = $1)
			 ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
			[startupUserId, investorUserId, limitNum, offset]
		);

		// Mark as read
		await pool.query(
			"UPDATE messages SET is_read = true WHERE receiver_user_id = $1 AND sender_user_id = $2",
			[startupUserId, investorUserId]
		);

		res.json({ messages: result.rows });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

module.exports = exports;
