const crypto = require("crypto");
const pool = require("../config/db");

async function insertMentorDocumentFromMemory(mentorId, file, description) {
	if (!file || !file.buffer) return;
	const fileBuffer = file.buffer;
	const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
	const storagePath = `db://documents/mentor/${mentorId}/${crypto.randomBytes(16).toString("hex")}`;
	await pool.query(
		`INSERT INTO documents (
      mentor_id, file_name, file_path, file_type, file_size_bytes, file_hash, file_data, description, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP)`,
		[
			mentorId,
			file.originalname,
			storagePath,
			file.mimetype,
			file.size,
			fileHash,
			fileBuffer,
			description || null,
		],
	);
}

exports.createMentorProfile = async (req, res) => {
	try {
		const userId = req.user.user_id;

		const existing = await pool.query(
			"SELECT mentor_id FROM mentors WHERE user_id = $1",
			[userId],
		);

		if (existing.rowCount > 0) {
			return res.status(409).json({
				error: "Mentor profile already exists for this user",
			});
		}

		let {
			headline,
			expertise,
			years_experience,
			hourly_rate,
			country,
			bio,
			availability,
		} = req.body || {};

		if (
			years_experience !== undefined &&
			years_experience !== null &&
			years_experience !== ""
		) {
			const years = Number(years_experience);
			if (!Number.isInteger(years) || years < 0) {
				return res.status(400).json({
					error: "'years_experience' must be a non-negative integer",
				});
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
				return res.status(400).json({
					error: "'hourly_rate' must be a non-negative number",
				});
			}
			hourly_rate = rate;
		} else {
			hourly_rate = null;
		}

		// convert availability to JSON if provided as string
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

		const result = await pool.query(
			`INSERT INTO mentors (
		user_id,
		headline,
		expertise,
		years_experience,
		hourly_rate,
		country,
		bio,
		availability
	  )
	  VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
	  RETURNING *`,
			[
				userId,
				headline,
				expertise,
				years_experience,
				hourly_rate,
				country,
				bio,
				availabilityValue,
			],
		);

		const mentor = result.rows[0];

		if (req.files) {
			if (req.files.cv && req.files.cv.length) {
				await insertMentorDocumentFromMemory(mentor.mentor_id, req.files.cv[0], "CV");
			}
			if (req.files.certifications && req.files.certifications.length) {
				for (const f of req.files.certifications) {
					await insertMentorDocumentFromMemory(mentor.mentor_id, f, "Certification");
				}
			}
			if (req.files.intro_video && req.files.intro_video.length) {
				await insertMentorDocumentFromMemory(
					mentor.mentor_id,
					req.files.intro_video[0],
					"Introduction video",
				);
			}
		}

		return res.status(201).json({ message: "Mentor profile created", mentor });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.getAllMentors = async (_req, res) => {
	try {
		const result = await pool.query(
			`SELECT
        m.mentor_id,
        m.headline,
        m.expertise,
        m.years_experience,
        m.hourly_rate,
        m.country,
        m.bio,
        m.availability,
        m.created_at,
        u.user_id,
        u.first_name,
        u.last_name,
        u.email
      FROM mentors m
      JOIN users u ON u.user_id = m.user_id
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
		 WHERE m.mentor_id = $1`,
			[mentorId],
		);

		if (!mentorResult.rowCount) {
			return res.status(404).json({ error: "Mentor not found" });
		}

		const docs = await pool.query(
			`SELECT * FROM (
			   SELECT document_id AS mentor_document_id,
			          COALESCE(description, 'document') AS document_type,
			          file_name, file_path, file_type, file_size_bytes, description, created_at
			   FROM documents WHERE mentor_id = $1
			   UNION ALL
			   SELECT mentor_document_id, document_type, file_name, file_path, file_type, file_size_bytes, description, created_at
			   FROM mentor_documents WHERE mentor_id = $1
			) merged ORDER BY created_at DESC`,
			[mentorId],
		);

		const mentor = mentorResult.rows[0];
		mentor.documents = docs.rows;

		return res.status(200).json(mentor);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

exports.updateMentorProfile = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const existing = await pool.query(
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
			years_experience,
			hourly_rate,
			country,
			bio,
			availability,
		} = req.body || {};

		if (
			years_experience !== undefined &&
			years_experience !== null &&
			years_experience !== ""
		) {
			const years = Number(years_experience);
			if (!Number.isInteger(years) || years < 0) {
				return res.status(400).json({
					error: "'years_experience' must be a non-negative integer",
				});
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
				return res.status(400).json({
					error: "'hourly_rate' must be a non-negative number",
				});
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

		const updated = await pool.query(
			`UPDATE mentors SET
		headline = COALESCE($1, headline),
		expertise = COALESCE($2, expertise),
		years_experience = COALESCE($3, years_experience),
		hourly_rate = COALESCE($4, hourly_rate),
		country = COALESCE($5, country),
		bio = COALESCE($6, bio),
		availability = COALESCE($7, availability)
	  WHERE mentor_id = $8
	  RETURNING *`,
			[
				headline,
				expertise,
				years_experience,
				hourly_rate,
				country,
				bio,
				availabilityValue,
				mentorId,
			],
		);

		if (req.files) {
			if (req.files.cv && req.files.cv.length) {
				await insertMentorDocumentFromMemory(mentorId, req.files.cv[0], "CV");
			}
			if (req.files.certifications && req.files.certifications.length) {
				for (const f of req.files.certifications) {
					await insertMentorDocumentFromMemory(mentorId, f, "Certification");
				}
			}
			if (req.files.intro_video && req.files.intro_video.length) {
				await insertMentorDocumentFromMemory(
					mentorId,
					req.files.intro_video[0],
					"Introduction video",
				);
			}
		}

		return res
			.status(200)
			.json({ message: "Mentor profile updated", mentor: updated.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};
