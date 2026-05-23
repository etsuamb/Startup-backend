const router = require("express").Router();
const multer = require("multer");
const pool = require("../config/db");
const { authenticate, authorizeRoles } = require("../middleware/authMiddleware");
const { generateMentorResponse } = require("../services/aiMentorService");

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 5 * 1024 * 1024,
		files: 5,
	},
});

async function ensureAiMentorSchema() {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS ai_mentor_sessions (
			ai_mentor_session_id SERIAL PRIMARY KEY,
			startup_id INTEGER REFERENCES startups(startup_id) ON DELETE CASCADE,
			investor_id INTEGER REFERENCES investors(investor_id) ON DELETE CASCADE,
			user_role VARCHAR(20) NOT NULL DEFAULT 'Startup' CHECK (user_role IN ('Startup', 'Investor')),
			title VARCHAR(255) NOT NULL DEFAULT 'AI Mentor Chat',
			created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMPTZ
		)
	`);

	await pool.query("ALTER TABLE ai_mentor_sessions ALTER COLUMN startup_id DROP NOT NULL");
	await pool.query("ALTER TABLE ai_mentor_sessions ADD COLUMN IF NOT EXISTS investor_id INTEGER REFERENCES investors(investor_id) ON DELETE CASCADE");
	await pool.query("ALTER TABLE ai_mentor_sessions ADD COLUMN IF NOT EXISTS user_role VARCHAR(20) NOT NULL DEFAULT 'Startup'");

	await pool.query(`
		CREATE TABLE IF NOT EXISTS ai_mentor_messages (
			ai_mentor_message_id SERIAL PRIMARY KEY,
			session_id INTEGER NOT NULL REFERENCES ai_mentor_sessions(ai_mentor_session_id) ON DELETE CASCADE,
			sender VARCHAR(20) NOT NULL CHECK (sender IN ('startup', 'ai')),
			message TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`);
}

async function getStartupForUser(userId) {
	const result = await pool.query(
		`SELECT
			 s.startup_id,
			 s.startup_name,
			 s.industry,
			 s.business_stage,
			 s.description,
			 s.funding_needed,
			 s.location,
			 p.project_title,
			 p.description AS project_description,
			 p.funding_goal,
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
			ORDER BY
				CASE WHEN p.status = 'active' THEN 0 ELSE 1 END,
				p.created_at DESC
			LIMIT 1
		 ) p ON true
		 WHERE s.user_id = $1`,
		[userId],
	);

	return result.rows[0] || null;
}

async function getInvestorForUser(userId) {
	const result = await pool.query(
		`SELECT
			 i.*,
			 u.first_name,
			 u.last_name,
			 u.email
		 FROM investors i
		 JOIN users u ON u.user_id = i.user_id
		 WHERE i.user_id = $1`,
		[userId],
	);

	return result.rows[0] || null;
}

function buildStartupProfile(startup) {
	return `
Name: ${startup.startup_name || "Not provided"}
Industry: ${startup.project_industry || startup.industry || "Not provided"}
Stage: ${startup.lifecycle_stage || startup.business_stage || "Not provided"}
Location: ${startup.location || "Not provided"}
Funding Need: ${startup.funding_goal || startup.funding_needed || "Not provided"}
Description: ${startup.description || "Not provided"}
Current Project: ${startup.project_title || "Not provided"}
Project Description: ${startup.project_description || "Not provided"}
Problem: ${startup.problem_statement || "Not provided"}
Solution: ${startup.solution_statement || "Not provided"}
Expected Impact: ${startup.expected_impact || "Not provided"}
`;
}

function buildInvestorProfile(investor) {
	return `
Name: ${investor.organization_name || `${investor.first_name || ""} ${investor.last_name || ""}`.trim() || "Not provided"}
Investor Type: ${investor.investor_type || "Not provided"}
Preferred Industry: ${investor.preferred_industry || "Not provided"}
Investment Stage: ${investor.investment_stage || "Not provided"}
Investment Budget: ${investor.investment_budget || "Not provided"}
Location Preference: ${investor.location_preference || investor.country || "Not provided"}
Portfolio Size: ${investor.portfolio_size || "Not provided"}
Bio: ${investor.bio || "Not provided"}
`;
}

function buildFileContext(files = []) {
	if (!Array.isArray(files) || files.length === 0) return "";

	const summaries = files.map((file, index) => {
		const textLike =
			(file.mimetype || "").startsWith("text/") ||
			["application/json", "application/xml", "text/csv"].includes(file.mimetype);
		const content = textLike
			? file.buffer.toString("utf8", 0, Math.min(file.buffer.length, 12000))
			: "";

		return [
			`File ${index + 1}: ${file.originalname}`,
			`Type: ${file.mimetype || "unknown"}`,
			`Size: ${file.size || 0} bytes`,
			content
				? `Content preview:\n${content}`
				: "Content preview: binary file uploaded; use filename, type, and user instructions to guide your response.",
		].join("\n");
	});

	return `\n\nAttached files for this message:\n${summaries.join("\n\n---\n\n")}`;
}

router.post(
	"/chat",
	authenticate,
	authorizeRoles("Startup", "Investor"),
	upload.array("files", 5),
	async (req, res) => {
		try {
			await ensureAiMentorSchema();

			const { sessionId, message } = req.body || {};
			const cleanMessage = String(message || "").trim();
			const fileContext = buildFileContext(req.files);
			const messageForAi = `${cleanMessage || "Please review the attached file(s) and provide useful guidance."}${fileContext}`;
			const storedMessage = fileContext
				? `${cleanMessage || "Please review the attached file(s)."}\n\n${req.files
					.map((file) => `[Attached file: ${file.originalname} (${file.mimetype || "unknown"}, ${file.size || 0} bytes)]`)
					.join("\n")}`
				: cleanMessage;

			if (!cleanMessage && !req.files?.length) {
				return res.status(400).json({ error: "message or file is required" });
			}

			if (cleanMessage.length > 2000) {
				return res.status(400).json({ error: "Message is too long. Please shorten it." });
			}

			const isInvestor = req.user.role === "Investor";
			const profile = isInvestor
				? await getInvestorForUser(req.user.user_id)
				: await getStartupForUser(req.user.user_id);
			if (!profile) {
				return res.status(404).json({ error: `${req.user.role} profile not found` });
			}
			const ownerColumn = isInvestor ? "investor_id" : "startup_id";
			const ownerId = isInvestor ? profile.investor_id : profile.startup_id;

			let activeSessionId = sessionId ? Number(sessionId) : null;
			if (activeSessionId) {
				const sessionCheck = await pool.query(
					`SELECT ai_mentor_session_id FROM ai_mentor_sessions WHERE ai_mentor_session_id = $1 AND ${ownerColumn} = $2 AND user_role = $3`,
					[activeSessionId, ownerId, req.user.role],
				);
				if (sessionCheck.rowCount === 0) {
					return res.status(404).json({ error: "AI mentor session not found" });
				}
			}

			if (!activeSessionId) {
				const title = cleanMessage.slice(0, 60) || req.files?.[0]?.originalname?.slice(0, 60) || "AI Mentor Chat";
				const sessionResult = await pool.query(
					`INSERT INTO ai_mentor_sessions (${ownerColumn}, user_role, title)
					 VALUES ($1, $2, $3)
					 RETURNING ai_mentor_session_id`,
					[ownerId, req.user.role, title],
				);
				activeSessionId = sessionResult.rows[0].ai_mentor_session_id;
			}

			await pool.query(
				`INSERT INTO ai_mentor_messages (session_id, sender, message)
				 VALUES ($1, 'startup', $2)`,
				[activeSessionId, storedMessage],
			);

			const historyResult = await pool.query(
				`SELECT sender, message
				 FROM ai_mentor_messages
				 WHERE session_id = $1
				 ORDER BY created_at ASC
				 LIMIT 20`,
				[activeSessionId],
			);

			const reply = await generateMentorResponse({
				profileContext: isInvestor ? buildInvestorProfile(profile) : buildStartupProfile(profile),
				chatHistory: historyResult.rows,
				userMessage: messageForAi,
			});

			const aiMessageResult = await pool.query(
				`INSERT INTO ai_mentor_messages (session_id, sender, message)
				 VALUES ($1, 'ai', $2)
				 RETURNING ai_mentor_message_id, sender, message, created_at`,
				[activeSessionId, reply],
			);

			await pool.query(
				"UPDATE ai_mentor_sessions SET updated_at = CURRENT_TIMESTAMP WHERE ai_mentor_session_id = $1",
				[activeSessionId],
			);

			res.json({
				sessionId: activeSessionId,
				reply,
				message: aiMessageResult.rows[0],
			});
		} catch (error) {
			console.error("AI Mentor Error:", error);
			res.status(500).json({ error: error.message || "AI Mentor Assistant failed to respond" });
		}
	},
);

router.get(
	"/sessions",
	authenticate,
	authorizeRoles("Startup", "Investor"),
	async (req, res) => {
		try {
			await ensureAiMentorSchema();
			const isInvestor = req.user.role === "Investor";
			const profile = isInvestor
				? await getInvestorForUser(req.user.user_id)
				: await getStartupForUser(req.user.user_id);
			if (!profile) {
				return res.status(404).json({ error: `${req.user.role} profile not found` });
			}
			const ownerColumn = isInvestor ? "investor_id" : "startup_id";
			const ownerId = isInvestor ? profile.investor_id : profile.startup_id;

			const result = await pool.query(
				`SELECT
					 s.ai_mentor_session_id AS id,
					 s.title,
					 s.created_at,
					 s.updated_at,
					 (
						SELECT message
						FROM ai_mentor_messages
						WHERE session_id = s.ai_mentor_session_id
						ORDER BY created_at ASC
						LIMIT 1
					 ) AS first_message
				 FROM ai_mentor_sessions s
				 WHERE s.${ownerColumn} = $1 AND s.user_role = $2
				 ORDER BY COALESCE(s.updated_at, s.created_at) DESC`,
				[ownerId, req.user.role],
			);

			res.json({ sessions: result.rows });
		} catch (error) {
			res.status(500).json({ error: error.message || "Failed to load AI mentor sessions" });
		}
	},
);

router.get(
	"/messages/:sessionId",
	authenticate,
	authorizeRoles("Startup", "Investor"),
	async (req, res) => {
		try {
			await ensureAiMentorSchema();
			const isInvestor = req.user.role === "Investor";
			const profile = isInvestor
				? await getInvestorForUser(req.user.user_id)
				: await getStartupForUser(req.user.user_id);
			if (!profile) {
				return res.status(404).json({ error: `${req.user.role} profile not found` });
			}
			const ownerColumn = isInvestor ? "investor_id" : "startup_id";
			const ownerId = isInvestor ? profile.investor_id : profile.startup_id;

			const sessionId = Number(req.params.sessionId);
			const sessionCheck = await pool.query(
				`SELECT ai_mentor_session_id FROM ai_mentor_sessions WHERE ai_mentor_session_id = $1 AND ${ownerColumn} = $2 AND user_role = $3`,
				[sessionId, ownerId, req.user.role],
			);
			if (sessionCheck.rowCount === 0) {
				return res.status(404).json({ error: "AI mentor session not found" });
			}

			const result = await pool.query(
				`SELECT ai_mentor_message_id AS id, sender, message, created_at
				 FROM ai_mentor_messages
				 WHERE session_id = $1
				 ORDER BY created_at ASC`,
				[sessionId],
			);

			res.json({ messages: result.rows });
		} catch (error) {
			res.status(500).json({ error: error.message || "Failed to load AI mentor messages" });
		}
	},
);

module.exports = router;
