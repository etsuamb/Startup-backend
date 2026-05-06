const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
const { normalizeMultipartBody } = require("../utils/requestBody");

function parseStringArray(value) {
	if (value === undefined || value === null || value === "") return null;
	if (Array.isArray(value)) {
		return value.map((item) => String(item).trim()).filter(Boolean);
	}
	if (typeof value === "string") {
		try {
			const parsed = JSON.parse(value);
			if (Array.isArray(parsed)) {
				return parsed.map((item) => String(item).trim()).filter(Boolean);
			}
		} catch (_err) {}
		return value
			.split(",")
			.map((item) => item.trim())
			.filter(Boolean);
	}
	return [String(value).trim()].filter(Boolean);
}

exports.createMentorProfile = async (req, res) => {
	let client;
	const savedFilePaths = [];
	try {
		const userId = req.user.user_id;
		req.body = normalizeMultipartBody(req.body);

		client = await pool.connect();

		const existing = await client.query(
			"SELECT mentor_id FROM mentors WHERE user_id = $1",
			[userId],
		);

		if (existing.rowCount > 0) {
			return res
				.status(409)
				.json({ error: "Mentor profile already exists for this user" });
		}

		let {
			headline,
			expertise,
			skills,
			industries,
			years_experience,
			hourly_rate,
			country,
			bio,
			profile_picture,
			availability,
		} = req.body || {};

		if (
			years_experience !== undefined &&
			years_experience !== null &&
			years_experience !== ""
		) {
			const years = Number(years_experience);
			if (!Number.isInteger(years) || years < 0) {
				return res
					.status(400)
					.json({ error: "'years_experience' must be a non-negative integer" });
			}
			years_experience = years;
		} else {
			years_experience = null;
		}

		if (
			hourly_rate !== undefined &&
			hourly_rate !== null &&
			hourly_rate !== ""
		) {
			const rate = Number(hourly_rate);
			if (Number.isNaN(rate) || rate < 0) {
				return res
					.status(400)
					.json({ error: "'hourly_rate' must be a non-negative number" });
			}
			hourly_rate = rate;
		} else {
			hourly_rate = null;
		}

		let availabilityValue = null;
		if (
			availability !== undefined &&
			availability !== null &&
			availability !== ""
		) {
			if (typeof availability === "string") {
				try {
					availabilityValue = JSON.parse(availability);
				} catch (_err) {
					availabilityValue = availability;
				}
			} else {
				availabilityValue = availability;
			}
		}

		const skillsValue = parseStringArray(skills);
		const industriesValue = parseStringArray(industries);

		await client.query("BEGIN");

		const result = await client.query(
			`INSERT INTO mentors (
				user_id,
				headline,
				expertise,
				skills,
				industries,
				years_experience,
				hourly_rate,
				country,
				bio,
				profile_picture,
				availability
			)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
			RETURNING *`,
			[
				userId,
				headline,
				expertise,
				skillsValue ? JSON.stringify(skillsValue) : null,
				industriesValue ? JSON.stringify(industriesValue) : null,
				years_experience,
				hourly_rate,
				country,
				bio,
				profile_picture || null,
				availabilityValue ? JSON.stringify(availabilityValue) : null,
			],
		);

		const mentor = result.rows[0];

		// Save uploaded files (cv, certifications) if any
		const saveDoc = async (mentorId, file, documentType) => {
			if (!file) return;
			await client.query(
				`INSERT INTO mentor_documents (
					mentor_id, document_type, file_name, file_path, file_type, file_size_bytes
				) VALUES ($1,$2,$3,$4,$5,$6)`,
				[
					mentorId,
					documentType,
					file.originalname,
					file.path,
					file.mimetype,
					file.size,
				],
			);
			savedFilePaths.push(file.path);
		};

		if (req.files) {
			if (req.files.cv && req.files.cv.length) {
				await saveDoc(mentor.mentor_id, req.files.cv[0], "cv");
			}
			if (req.files.certifications && req.files.certifications.length) {
				for (const f of req.files.certifications) {
					await saveDoc(mentor.mentor_id, f, "certification");
				}
			}
		}

		await client.query("COMMIT");

		return res.status(201).json({ message: "Mentor profile created", mentor });
	} catch (err) {
		try {
			if (client) await client.query("ROLLBACK");
		} catch (e) {
			console.error("Rollback failed", e.message || e);
		}

		// remove any uploaded files to avoid orphans
		if (req.files) {
			const allFiles = [];
			if (req.files.cv) allFiles.push(...req.files.cv.map((f) => f.path));
			if (req.files.certifications)
				allFiles.push(...req.files.certifications.map((f) => f.path));
			for (const p of allFiles) {
				try {
					if (fs.existsSync(p)) fs.unlinkSync(p);
				} catch (e) {
					console.error(
						"Failed to cleanup file after error",
						p,
						e.message || e,
					);
				}
			}
		}

		return res.status(500).json({ error: err.message });
	} finally {
		if (client) client.release();
	}
};

exports.getAllMentors = async (_req, res) => {
	try {
		const result = await pool.query(
			`SELECT
        m.mentor_id,
        m.headline,
        m.expertise,
		m.skills,
		m.industries,
        m.years_experience,
        m.hourly_rate,
        m.country,
        m.bio,
		m.profile_picture,
		m.verification_status,
        m.availability,
        m.created_at,
        u.user_id,
        u.first_name,
        u.last_name,
        u.email
      FROM mentors m
      JOIN users u ON u.user_id = m.user_id
	      WHERE COALESCE(m.verification_status, 'pending') = 'approved'
      ORDER BY m.created_at DESC`,
		);

		return res.status(200).json(result.rows);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getMentorById = async (req, res) => {
	try {
		const mentorId = Number(req.params.mentorId);
		if (!Number.isInteger(mentorId) || mentorId <= 0) {
			return res.status(400).json({ error: "Invalid mentor id" });
		}

		const mentorResult = await pool.query(
			`SELECT m.*, u.user_id, u.first_name, u.last_name, u.email
		 FROM mentors m
		 JOIN users u ON u.user_id = m.user_id
		 WHERE m.mentor_id = $1 AND m.verification_status = 'approved'`,
			[mentorId],
		);

		if (!mentorResult.rowCount) {
			return res.status(404).json({ error: "Mentor not found" });
		}

		const docs = await pool.query(
			`SELECT mentor_document_id, document_type, file_name, file_path, file_type, file_size_bytes, description, created_at
		 FROM mentor_documents
		 WHERE mentor_id = $1
		 ORDER BY created_at DESC`,
			[mentorId],
		);

		const mentor = mentorResult.rows[0];
		mentor.documents = docs.rows;

		return res.status(200).json(mentor);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getMyProfile = async (req, res) => {
	try {
		const result = await pool.query(
			`SELECT m.*, u.user_id, u.first_name, u.last_name, u.email
			 FROM mentors m
			 JOIN users u ON u.user_id = m.user_id
			 WHERE m.user_id = $1`,
			[req.user.user_id],
		);

		if (!result.rowCount) {
			return res.status(404).json({ error: "Mentor profile not found" });
		}

		const mentorId = result.rows[0].mentor_id;
		const docs = await pool.query(
			`SELECT mentor_document_id, document_type, file_name, file_path, file_type, file_size_bytes, description, created_at
			 FROM mentor_documents
			 WHERE mentor_id = $1
			 ORDER BY created_at DESC`,
			[mentorId],
		);

		const mentor = result.rows[0];
		mentor.documents = docs.rows;
		return res.json(mentor);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.updateMentorProfile = async (req, res) => {
	let client;
	try {
		const userId = req.user.user_id;
		req.body = normalizeMultipartBody(req.body);
		client = await pool.connect();

		const existing = await client.query(
			"SELECT mentor_id FROM mentors WHERE user_id = $1",
			[userId],
		);

		if (!existing.rowCount) {
			return res.status(404).json({ error: "Mentor profile not found" });
		}

		const mentorId = existing.rows[0].mentor_id;

		let {
			headline,
			expertise,
			skills,
			industries,
			years_experience,
			hourly_rate,
			country,
			bio,
			profile_picture,
			availability,
		} = req.body || {};

		if (
			years_experience !== undefined &&
			years_experience !== null &&
			years_experience !== ""
		) {
			const years = Number(years_experience);
			if (!Number.isInteger(years) || years < 0) {
				return res
					.status(400)
					.json({ error: "'years_experience' must be a non-negative integer" });
			}
			years_experience = years;
		} else {
			years_experience = null;
		}

		if (
			hourly_rate !== undefined &&
			hourly_rate !== null &&
			hourly_rate !== ""
		) {
			const rate = Number(hourly_rate);
			if (Number.isNaN(rate) || rate < 0) {
				return res
					.status(400)
					.json({ error: "'hourly_rate' must be a non-negative number" });
			}
			hourly_rate = rate;
		} else {
			hourly_rate = null;
		}

		let availabilityValue = null;
		if (
			availability !== undefined &&
			availability !== null &&
			availability !== ""
		) {
			if (typeof availability === "string") {
				try {
					availabilityValue = JSON.parse(availability);
				} catch (_err) {
					availabilityValue = availability;
				}
			} else {
				availabilityValue = availability;
			}
		}

		const skillsValue = parseStringArray(skills);
		const industriesValue = parseStringArray(industries);

		await client.query("BEGIN");

		const updated = await client.query(
			`UPDATE mentors SET
				headline = COALESCE($1, headline),
				expertise = COALESCE($2, expertise),
				skills = COALESCE($3, skills),
				industries = COALESCE($4, industries),
				years_experience = COALESCE($5, years_experience),
				hourly_rate = COALESCE($6, hourly_rate),
				country = COALESCE($7, country),
				bio = COALESCE($8, bio),
				profile_picture = COALESCE($9, profile_picture),
				availability = COALESCE($10, availability)
			WHERE mentor_id = $11
			RETURNING *`,
			[
				headline,
				expertise,
				skillsValue ? JSON.stringify(skillsValue) : null,
				industriesValue ? JSON.stringify(industriesValue) : null,
				years_experience,
				hourly_rate,
				country,
				bio,
				profile_picture || null,
				availabilityValue ? JSON.stringify(availabilityValue) : null,
				mentorId,
			],
		);

		// Save uploaded files if any
		const savedPaths = [];
		const saveDoc = async (mentorId, file, documentType) => {
			if (!file) return;
			await client.query(
				`INSERT INTO mentor_documents (
					mentor_id, document_type, file_name, file_path, file_type, file_size_bytes
				) VALUES ($1,$2,$3,$4,$5,$6)`,
				[
					mentorId,
					documentType,
					file.originalname,
					file.path,
					file.mimetype,
					file.size,
				],
			);
			savedPaths.push(file.path);
		};

		if (req.files) {
			if (req.files.cv && req.files.cv.length) {
				await saveDoc(mentorId, req.files.cv[0], "cv");
			}
			if (req.files.certifications && req.files.certifications.length) {
				for (const f of req.files.certifications) {
					await saveDoc(mentorId, f, "certification");
				}
			}
		}

		await client.query("COMMIT");

		return res
			.status(200)
			.json({ message: "Mentor profile updated", mentor: updated.rows[0] });
	} catch (err) {
		try {
			if (client) await client.query("ROLLBACK");
		} catch (e) {
			console.error("Rollback failed", e.message || e);
		}

		// cleanup newly uploaded files on error
		if (req.files) {
			const allFiles = [];
			if (req.files.cv) allFiles.push(...req.files.cv.map((f) => f.path));
			if (req.files.certifications)
				allFiles.push(...req.files.certifications.map((f) => f.path));
			for (const p of allFiles) {
				try {
					if (fs.existsSync(p)) fs.unlinkSync(p);
				} catch (e) {
					console.error(
						"Failed to cleanup file after error",
						p,
						e.message || e,
					);
				}
			}
		}

		return res.status(500).json({ error: err.message });
	} finally {
		if (client) client.release();
	}
};

exports.deleteMentorDocument = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const documentId = Number(req.params.documentId);
		if (!Number.isInteger(documentId) || documentId <= 0) {
			return res.status(400).json({ error: "Invalid document id" });
		}

		const docRes = await pool.query(
			`SELECT md.*, m.user_id AS owner_user_id FROM mentor_documents md JOIN mentors m ON m.mentor_id = md.mentor_id WHERE md.mentor_document_id = $1`,
			[documentId],
		);

		if (!docRes.rowCount) {
			return res.status(404).json({ error: "Document not found" });
		}

		const doc = docRes.rows[0];
		if (doc.owner_user_id !== userId) {
			return res
				.status(403)
				.json({ error: "Not authorized to delete this document" });
		}

		// remove file from disk if present and safe
		const uploadsDir = path.resolve(process.cwd(), "uploads");
		const absPath = path.resolve(process.cwd(), doc.file_path);
		if (absPath.startsWith(uploadsDir) && fs.existsSync(absPath)) {
			try {
				fs.unlinkSync(absPath);
			} catch (e) {
				// log but don't fail deletion
				console.error("Failed removing file:", e.message || e);
			}
		}

		await pool.query(
			"DELETE FROM mentor_documents WHERE mentor_document_id = $1",
			[documentId],
		);

		return res.status(200).json({ message: "Mentor document deleted" });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.replaceMentorDocument = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const documentId = Number(req.params.documentId);
		if (!Number.isInteger(documentId) || documentId <= 0) {
			return res.status(400).json({ error: "Invalid document id" });
		}

		if (!req.file) {
			return res.status(400).json({ error: "No file uploaded" });
		}

		const docRes = await pool.query(
			`SELECT md.*, m.user_id AS owner_user_id FROM mentor_documents md JOIN mentors m ON m.mentor_id = md.mentor_id WHERE md.mentor_document_id = $1`,
			[documentId],
		);

		if (!docRes.rowCount) {
			return res.status(404).json({ error: "Document not found" });
		}

		const doc = docRes.rows[0];
		if (doc.owner_user_id !== userId) {
			return res
				.status(403)
				.json({ error: "Not authorized to replace this document" });
		}

		const oldPath = doc.file_path;

		const updateRes = await pool.query(
			`UPDATE mentor_documents SET file_name = $1, file_path = $2, file_type = $3, file_size_bytes = $4, created_at = NOW() WHERE mentor_document_id = $5 RETURNING *`,
			[
				req.file.originalname,
				req.file.path,
				req.file.mimetype,
				req.file.size,
				documentId,
			],
		);

		// remove old file from disk if present and safe
		const uploadsDir = path.resolve(process.cwd(), "uploads");
		const absOld = path.resolve(process.cwd(), oldPath);
		if (absOld.startsWith(uploadsDir) && fs.existsSync(absOld)) {
			try {
				fs.unlinkSync(absOld);
			} catch (e) {
				console.error("Failed removing old file:", e.message || e);
			}
		}

		return res.status(200).json({
			message: "Mentor document replaced",
			document: updateRes.rows[0],
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};
