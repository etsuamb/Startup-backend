const pool = require("../config/db");
const profileAccessService = require("../services/profileAccessService");
const profileSanitizer = require("../services/profileSanitizer");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { filterProfileForViewer } = require("../utils/profileVisibility");

// UC_44c: Update Mentor Profile
exports.updateMentorProfile = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const {
			first_name,
			last_name,
			phone_number,
			headline,
			professional_title,
			expertise,
			years_experience,
			hourly_rate,
			session_pricing,
			country,
			city_location,
			bio,
			availability,
			languages,
			linkedin_or_portfolio,
			availability_preference,
			current_organization,
			current_title,
			primary_industry,
			secondary_industry,
			mentor_platform,
			session_frequency,
			required_time_slots,
			mentoring_style,
			notable_startups_mentored,
			key_achievement,
		} = req.body;

		const normalizedPhoneNumber = phone_number === "" ? null : phone_number;

		await pool.query(
			`UPDATE users SET
			first_name = COALESCE($1, first_name),
			last_name = COALESCE($2, last_name),
			phone_number = COALESCE($3, phone_number)
			WHERE user_id = $4`,
			[first_name, last_name, normalizedPhoneNumber, userId]
		);

		const result = await pool.query(
			`UPDATE mentors SET
			 headline = COALESCE($1, headline),
			 professional_title = COALESCE($2, professional_title),
			 expertise = COALESCE($3, expertise),
			 years_experience = COALESCE($4, years_experience),
			 hourly_rate = COALESCE($5, hourly_rate),
			 session_pricing = COALESCE($6, session_pricing),
			 country = COALESCE($7, country),
			 city_location = COALESCE($8, city_location),
			 bio = COALESCE($9, bio),
			 availability = COALESCE($10, availability),
			 languages = COALESCE($11, languages),
			 linkedin_or_portfolio = COALESCE($12, linkedin_or_portfolio),
			 availability_preference = COALESCE($13, availability_preference),
			 current_organization = COALESCE($14, current_organization),
			 current_title = COALESCE($15, current_title),
			 primary_industry = COALESCE($16, primary_industry),
			 secondary_industry = COALESCE($17, secondary_industry),
			 mentor_platform = COALESCE($18, mentor_platform),
			 session_frequency = COALESCE($19, session_frequency),
			 required_time_slots = COALESCE($20, required_time_slots),
			 mentoring_style = COALESCE($21, mentoring_style),
			 notable_startups_mentored = COALESCE($22, notable_startups_mentored),
			 key_achievement = COALESCE($23, key_achievement)
			 WHERE user_id = $24 RETURNING *`,
			[
				headline,
				professional_title,
				expertise,
				years_experience,
				hourly_rate,
				session_pricing,
				country,
				city_location,
				bio,
				availability,
				languages,
				linkedin_or_portfolio,
				availability_preference,
				current_organization,
				current_title,
				primary_industry,
				secondary_industry,
				mentor_platform,
				session_frequency,
				required_time_slots,
				mentoring_style,
				notable_startups_mentored,
				key_achievement,
				userId,
			]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ message: "Mentor profile not found" });
		}

		res.json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_44d: Get My Mentor Profile
exports.getMentorProfile = async (req, res) => {
	try {
		const userId = req.user.user_id;

		const result = await pool.query(
			`SELECT m.*, u.first_name, u.last_name, u.email, u.phone_number, u.is_approved
       FROM mentors m
       JOIN users u ON u.user_id = m.user_id
       WHERE m.user_id = $1`,
			[userId]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ message: "Mentor profile not found" });
		}

		const mentor = result.rows[0];
		const docs = await pool.query(
			`SELECT * FROM (
			   SELECT document_id AS id,
			          document_id,
			          COALESCE(description, 'document') AS document_type,
			          file_name, file_path, file_type, file_size_bytes, description, created_at
			   FROM documents WHERE mentor_id = $1
			   UNION ALL
			   SELECT mentor_document_id AS id,
			          mentor_document_id AS document_id,
			          document_type,
			          file_name, file_path, file_type, file_size_bytes, description, created_at
			   FROM mentor_documents WHERE mentor_id = $1
			) merged ORDER BY created_at DESC`,
			[mentor.mentor_id]
		);

		mentor.documents = docs.rows;
		res.json({ mentor, documents: docs.rows });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

function sendStoredDocument(res, doc) {
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

	const uploadsDir = path.resolve(process.cwd(), "uploads");
	const absPath = path.resolve(process.cwd(), doc.file_path);
	if (!absPath.startsWith(uploadsDir)) {
		return res.status(400).json({ error: "Invalid file path" });
	}
	if (!fs.existsSync(absPath)) {
		return res.status(404).json({ error: "File missing on server" });
	}
	return res.sendFile(absPath);
}

exports.getMentorDocument = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const documentId = Number(req.params.documentId);

		if (!Number.isInteger(documentId) || documentId <= 0) {
			return res.status(400).json({ error: "Invalid document id" });
		}

		let docRes = await pool.query(
			`SELECT d.* FROM documents d
			 JOIN mentors m ON m.mentor_id = d.mentor_id
			 WHERE d.document_id = $1 AND m.user_id = $2`,
			[documentId, userId],
		);

		if (!docRes.rows.length) {
			docRes = await pool.query(
				`SELECT md.* FROM mentor_documents md
				 JOIN mentors m ON m.mentor_id = md.mentor_id
				 WHERE md.mentor_document_id = $1 AND m.user_id = $2`,
				[documentId, userId],
			);
		}

		if (!docRes.rows.length) {
			return res.status(404).json({ error: "Document not found" });
		}

		return sendStoredDocument(res, docRes.rows[0]);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getStartupDocument = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const startupId = Number(req.params.startupId);
		const documentId = Number(req.params.documentId);

		if (!Number.isInteger(startupId) || startupId <= 0) {
			return res.status(400).json({ error: "Invalid startup id" });
		}
		if (!Number.isInteger(documentId) || documentId <= 0) {
			return res.status(400).json({ error: "Invalid document id" });
		}

		const docRes = await pool.query(
			`SELECT d.*, s.user_id AS startup_user_id
			 FROM documents d
			 JOIN startups s ON s.startup_id = d.startup_id
			 JOIN users u ON u.user_id = s.user_id
			 WHERE d.document_id = $1 AND d.startup_id = $2 AND u.is_approved = true`,
			[documentId, startupId],
		);

		if (!docRes.rows.length) {
			return res.status(404).json({ error: "Document not found" });
		}

		const doc = docRes.rows[0];
		const access = await profileAccessService.evaluateSensitiveAccess(
			userId,
			doc.startup_user_id,
			{ endpoint: "mentor.getStartupDocument" },
		);

		if (!access.sensitiveVisible) {
			return res.status(403).json({
				error: "Not allowed to view this document",
				privacy: access.privacy,
			});
		}

		return sendStoredDocument(res, doc);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// UC_45: Get Mentorship Requests
exports.getMentorshipRequests = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { status, page = 1, limit = 20 } = req.query;

		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		let query = `
			SELECT mr.*, s.startup_name, u.first_name, u.last_name FROM mentorship_requests mr
			JOIN startups s ON mr.startup_id = s.startup_id
			JOIN users u ON s.user_id = u.user_id
			WHERE mr.mentor_id = (SELECT mentor_id FROM mentors WHERE user_id = $1)
		`;
		const params = [userId];

		if (status) {
			params.push(status);
			query += ` AND mr.status = $${params.length}`;
		}

		const countQuery = query.replace(/SELECT mr\..*FROM/, "SELECT COUNT(*) as total FROM");
		const countResult = await pool.query(countQuery, params);
		const total = parseInt(countResult.rows[0].total);

		query += ` ORDER BY mr.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
		params.push(limitNum, offset);

		const result = await pool.query(query, params);

		res.json({
			requests: result.rows,
			total,
			page: pageNum,
			limit: limitNum,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_45: Accept Mentorship Request
exports.acceptMentorshipRequest = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { requestId } = req.params;
		const { duration_weeks, rate } = req.body;

		// Verify ownership
		const mentorRes = await pool.query(
			"SELECT mentor_id FROM mentors WHERE user_id = $1",
			[userId]
		);

		if (mentorRes.rows.length === 0) {
			return res.status(404).json({ message: "Mentor profile not found" });
		}

		const mentor_id = mentorRes.rows[0].mentor_id;

		// Get the request
		const reqRes = await pool.query(
			"SELECT * FROM mentorship_requests WHERE mentorship_request_id = $1 AND mentor_id = $2",
			[requestId, mentor_id]
		);

		if (reqRes.rows.length === 0) {
			return res.status(404).json({ message: "Request not found" });
		}

		// Update status
		const result = await pool.query(
			"UPDATE mentorship_requests SET status = 'accepted' WHERE mentorship_request_id = $1 RETURNING *",
			[requestId]
		);

		// Notify startup
		const startupRes = await pool.query(
			"SELECT user_id FROM startups WHERE startup_id = $1",
			[result.rows[0].startup_id]
		);

		if (startupRes.rows.length > 0) {
			await pool.query(
				"INSERT INTO notifications (user_id, notification_type, title, message) VALUES ($1, $2, $3, $4)",
				[
					startupRes.rows[0].user_id,
					"mentorship",
					"Mentorship Accepted",
					"Your mentorship request has been accepted!",
				]
			);
		}

		res.json({
			message: "Mentorship request accepted",
			mentorship: result.rows[0],
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_45: Reject Mentorship Request
exports.rejectMentorshipRequest = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { requestId } = req.params;
		const { reason } = req.body;

		const mentorRes = await pool.query(
			"SELECT mentor_id FROM mentors WHERE user_id = $1",
			[userId]
		);

		if (mentorRes.rows.length === 0) {
			return res.status(404).json({ message: "Mentor profile not found" });
		}

		const mentor_id = mentorRes.rows[0].mentor_id;

		const result = await pool.query(
			"UPDATE mentorship_requests SET status = 'rejected' WHERE mentorship_request_id = $1 AND mentor_id = $2 RETURNING *",
			[requestId, mentor_id]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ message: "Request not found" });
		}

		res.json({ message: "Mentorship request rejected" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_46: Send Mentorship Proposal
exports.sendMentorshipProposal = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { startup_id, subject, message, duration_weeks, hourly_rate } = req.body;

		const mentorRes = await pool.query(
			"SELECT mentor_id FROM mentors WHERE user_id = $1",
			[userId]
		);

		if (mentorRes.rows.length === 0) {
			return res.status(404).json({ message: "Mentor profile not found" });
		}

		const mentor_id = mentorRes.rows[0].mentor_id;

		const existingRequest = await pool.query(
			`SELECT mentorship_request_id, status
			 FROM mentorship_requests
			 WHERE startup_id = $1 AND mentor_id = $2
			   AND status IN ('pending', 'accepted')
			 ORDER BY created_at DESC
			 LIMIT 1`,
			[startup_id, mentor_id]
		);

		if (existingRequest.rows.length > 0) {
			return res.status(409).json({
				error: existingRequest.rows[0].status === "accepted"
					? "This mentorship is already accepted. You cannot send another proposal."
					: "You already have a pending mentorship proposal with this startup.",
				existing_offer: {
					offerType: "mentorship",
					id: existingRequest.rows[0].mentorship_request_id,
					status: existingRequest.rows[0].status,
				},
			});
		}

		// Create a mentorship request
		const result = await pool.query(
			`INSERT INTO mentorship_requests (startup_id, mentor_id, subject, message)
			 VALUES ($1, $2, $3, $4) RETURNING *`,
			[startup_id, mentor_id, subject, message]
		);

		// Notify startup
		const startupUserRes = await pool.query(
			"SELECT user_id FROM startups WHERE startup_id = $1",
			[startup_id]
		);

		if (startupUserRes.rows.length > 0) {
			await pool.query(
				`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
				[
					startupUserRes.rows[0].user_id,
					"mentorship",
					"Mentorship Proposal",
					subject,
					"mentorship_requests",
					result.rows[0].mentorship_request_id,
				],
			);
		}

		res.status(201).json({
			message: "Proposal sent",
			proposal: result.rows[0],
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_47: View Startup Profiles
exports.listStartups = async (req, res) => {
	try {
		const { industry, stage, location, search, page = 1, limit = 20 } = req.query;

		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		let query = `
			SELECT s.* FROM startups s 
			JOIN users u ON s.user_id = u.user_id
			WHERE u.is_approved = true
		`;
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
			params.push(location);
			query += ` AND COALESCE(s.city, s.region, s.location, '') = $${params.length}`;
		}

		if (search) {
			params.push(`%${search}%`);
			query += ` AND (
				s.startup_name ILIKE $${params.length}
				OR s.description ILIKE $${params.length}
				OR s.industry ILIKE $${params.length}
				OR s.founder_full_name ILIKE $${params.length}
				OR COALESCE(s.city, s.region, s.location, '') ILIKE $${params.length}
			)`;
		}

		const countQuery = query.replace(/SELECT s\..*FROM/, "SELECT COUNT(*) as total FROM");
		const countResult = await pool.query(countQuery, params);
		const total = parseInt(countResult.rows[0].total);

		query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
		params.push(limitNum, offset);

		const result = await pool.query(query, params);
		const startups = await Promise.all(result.rows.map((startup) =>
			filterProfileForViewer(req, startup, {
				profileType: "startup",
				profileId: startup.startup_id,
				startup_id: startup.startup_id,
				user_id: startup.user_id,
				role: "Startup",
			})
		));

		res.json({
			startups: result.rows.map((row) => profileSanitizer.sanitizeStartupPublic(row)),
			total,
			page: pageNum,
			limit: limitNum,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_47: View Startup Details
exports.getStartupDetails = async (req, res) => {
	try {
		const { startupId } = req.params;

		const startupRes = await pool.query(
			`SELECT s.* FROM startups s JOIN users u ON s.user_id = u.user_id
			 WHERE s.startup_id = $1 AND u.is_approved = true`,
			[startupId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup not found" });
		}

		const startup = startupRes.rows[0];
		const access = await profileAccessService.evaluateSensitiveAccess(
			req.user.user_id,
			startup.user_id,
			{ endpoint: "mentor.getStartupDetails" },
		);

		// Get documents
		const documentsRes = await pool.query(
			"SELECT * FROM documents WHERE startup_id = $1",
			[startupId]
		);

		res.json({
			startup: profileSanitizer.sanitizeStartup(startup, access),
			documents: profileSanitizer.sanitizeDocuments(documentsRes.rows, access),
			privacy: access.privacy,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_48: Provide Learning Resources
exports.uploadResource = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { mentorship_id, startup_id, resource_title, resource_type, external_url, description } = req.body;

		const mentorRes = await pool.query(
			"SELECT mentor_id FROM mentors WHERE user_id = $1",
			[userId]
		);

		if (mentorRes.rows.length === 0) {
			return res.status(404).json({ message: "Mentor profile not found" });
		}

		const mentor_id = mentorRes.rows[0].mentor_id;

		let file_path = null;
		let file_name = null;
		let file_type = null;
		let file_size_bytes = null;

		if (req.file) {
			file_path = req.file.path;
			file_name = req.file.originalname;
			file_type = req.file.mimetype;
			file_size_bytes = req.file.size;
		}

		const result = await pool.query(
			`INSERT INTO mentorship_resources 
			 (mentorship_request_id, startup_id, mentor_id, resource_title, resource_type, 
			  file_name, file_path, file_type, file_size_bytes, external_url, resource_description)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
			[
				mentorship_id,
				startup_id,
				mentor_id,
				resource_title,
				resource_type,
				file_name,
				file_path,
				file_type,
				file_size_bytes,
				external_url,
				description,
			]
		);

		res.status(201).json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_49: Schedule Mentorship Sessions
exports.scheduleMentorshipSession = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { mentorship_request_id, scheduled_at, duration_minutes } = req.body;

		if (!mentorship_request_id || !scheduled_at || !duration_minutes) {
			return res.status(400).json({
				error: "mentorship_request_id, scheduled_at, and duration_minutes are required",
			});
		}

		const mentorRes = await pool.query(
			"SELECT mentor_id FROM mentors WHERE user_id = $1",
			[userId]
		);

		if (mentorRes.rows.length === 0) {
			return res.status(404).json({ message: "Mentor profile not found" });
		}

		const result = await pool.query(
			`INSERT INTO mentorship_sessions (mentorship_request_id, scheduled_at, duration_minutes)
			 VALUES ($1, $2, $3) RETURNING *`,
			[mentorship_request_id, scheduled_at, duration_minutes]
		);

		res.status(201).json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_49: Get Mentorship Sessions
exports.getMentorshipSessions = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { status, page = 1, limit = 20 } = req.query;

		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		const mentorRes = await pool.query(
			"SELECT mentor_id FROM mentors WHERE user_id = $1",
			[userId]
		);

		if (mentorRes.rows.length === 0) {
			return res.status(404).json({ message: "Mentor profile not found" });
		}

		const mentor_id = mentorRes.rows[0].mentor_id;

		let query = `
			SELECT ms.* FROM mentorship_sessions ms
			JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.mentorship_request_id
			WHERE mr.mentor_id = $1
		`;
		const params = [mentor_id];

		if (status) {
			params.push(status);
			query += ` AND ms.status = $${params.length}`;
		}

		const countQuery = query.replace(/SELECT ms\..*FROM/, "SELECT COUNT(*) as total FROM");
		const countResult = await pool.query(countQuery, params);
		const total = parseInt(countResult.rows[0].total);

		query += ` ORDER BY ms.scheduled_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
		params.push(limitNum, offset);

		const result = await pool.query(query, params);

		res.json({
			sessions: result.rows,
			total,
			page: pageNum,
			limit: limitNum,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_51: Chat with Startup
exports.sendMessage = async (req, res) => {
	try {
		const mentorUserId = req.user.user_id;
		const { startupId } = req.params;
		const { message } = req.body;

		// Get startup user_id
		const startupRes = await pool.query(
			"SELECT user_id FROM startups WHERE startup_id = $1",
			[startupId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup not found" });
		}

		const startupUserId = startupRes.rows[0].user_id;

		const result = await pool.query(
			`INSERT INTO messages (sender_user_id, receiver_user_id, body, subject)
			 VALUES ($1, $2, $3, 'Mentorship Discussion') RETURNING *`,
			[mentorUserId, startupUserId, message]
		);

		res.status(201).json({ message_id: result.rows[0].message_id });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_51: Get Messages
exports.getMessages = async (req, res) => {
	try {
		const mentorUserId = req.user.user_id;
		const { startupId } = req.params;
		const { page = 1, limit = 20 } = req.query;

		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		const startupRes = await pool.query(
			"SELECT user_id FROM startups WHERE startup_id = $1",
			[startupId]
		);

		if (startupRes.rows.length === 0) {
			return res.status(404).json({ message: "Startup not found" });
		}

		const startupUserId = startupRes.rows[0].user_id;

		const result = await pool.query(
			`SELECT * FROM messages 
			 WHERE (sender_user_id = $1 AND receiver_user_id = $2) OR (sender_user_id = $2 AND receiver_user_id = $1)
			 ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
			[mentorUserId, startupUserId, limitNum, offset]
		);

		// Mark as read
		await pool.query(
			"UPDATE messages SET is_read = true WHERE receiver_user_id = $1 AND sender_user_id = $2",
			[mentorUserId, startupUserId]
		);

		res.json({ messages: result.rows });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_53: Submit Mentorship Reports
exports.submitReport = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const {
			mentorship_session_id,
			report_title,
			summary,
			action_items,
			next_steps,
			progress_rating,
			mentor_notes,
		} = req.body;

		const mentorRes = await pool.query(
			"SELECT mentor_id FROM mentors WHERE user_id = $1",
			[userId]
		);

		if (mentorRes.rows.length === 0) {
			return res.status(404).json({ message: "Mentor profile not found" });
		}

		const mentor_id = mentorRes.rows[0].mentor_id;

		// Get session details
		const sessionRes = await pool.query(
			`SELECT mr.startup_id FROM mentorship_sessions ms
			 JOIN mentorship_requests mr ON ms.mentorship_request_id = mr.mentorship_request_id
			 WHERE ms.mentorship_session_id = $1`,
			[mentorship_session_id]
		);

		if (sessionRes.rows.length === 0) {
			return res.status(404).json({ message: "Session not found" });
		}

		const startup_id = sessionRes.rows[0].startup_id;

		const result = await pool.query(
			`INSERT INTO mentorship_reports 
			 (mentorship_session_id, startup_id, mentor_id, report_title, summary, action_items, next_steps, progress_rating, mentor_notes)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
			[
				mentorship_session_id,
				startup_id,
				mentor_id,
				report_title,
				summary,
				action_items,
				next_steps,
				progress_rating,
				mentor_notes,
			]
		);

		res.status(201).json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// UC_54: View Mentorship History
exports.getMentorshipHistory = async (req, res) => {
	try {
		const userId = req.user.user_id;

		const mentorRes = await pool.query(
			"SELECT mentor_id FROM mentors WHERE user_id = $1",
			[userId]
		);

		if (mentorRes.rows.length === 0) {
			return res.status(404).json({ message: "Mentor profile not found" });
		}

		const mentor_id = mentorRes.rows[0].mentor_id;

		const result = await pool.query(
			`SELECT mr.*, s.startup_name, u.first_name, u.last_name
			 FROM mentorship_requests mr
			 JOIN startups s ON mr.startup_id = s.startup_id
			 JOIN users u ON s.user_id = u.user_id
			 WHERE mr.mentor_id = $1
			 ORDER BY mr.created_at DESC`,
			[mentor_id]
		);

		res.json({ mentorships: result.rows });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

module.exports = exports;
