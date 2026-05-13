const crypto = require("crypto");
const pool = require("../config/db");

async function getStartupIdByUserId(userId) {
	const startupResult = await pool.query(
		"SELECT startup_id FROM startups WHERE user_id = $1",
		[userId],
	);

	if (startupResult.rowCount === 0) {
		return null;
	}

	return startupResult.rows[0].startup_id;
}

function parseMaybeJsonArray(val) {
	if (val == null || val === "") return [];
	if (Array.isArray(val)) return val;
	if (typeof val === "string") {
		try {
			const j = JSON.parse(val);
			return Array.isArray(j) ? j : [];
		} catch {
			return [];
		}
	}
	return [];
}

function parseMaybeJsonObject(val) {
	if (val == null || val === "") return {};
	if (typeof val === "object" && !Array.isArray(val) && val !== null) return val;
	if (typeof val === "string") {
		try {
			const j = JSON.parse(val);
			return j && typeof j === "object" && !Array.isArray(j) ? j : {};
		} catch {
			return {};
		}
	}
	return {};
}

function parseBoolLoose(v) {
	if (v === true || v === false) return v;
	if (typeof v === "string") return ["true", "1", "yes", "on"].includes(v.trim().toLowerCase());
	return Boolean(v);
}

function parseCreatePayload(req) {
	const flat = req.body && typeof req.body === "object" ? { ...req.body } : {};
	let body = { ...flat };

	if (typeof flat.data === "string" && flat.data.trim() !== "") {
		try {
			const parsed = JSON.parse(flat.data);
			body = { ...parsed, ...flat };
		} catch {
			return { error: "Invalid JSON in form-data field 'data'" };
		}
	} else if (typeof flat.payload === "string" && flat.payload.trim() !== "") {
		try {
			const parsed = JSON.parse(flat.payload);
			body = { ...parsed, ...flat };
		} catch {
			return { error: "Invalid JSON in form-data field 'payload'" };
		}
	}

	delete body.data;
	delete body.payload;

	if (!body.basicInfo || typeof body.basicInfo !== "object") {
		body.basicInfo = {
			name: body.name || body.project_title,
			industry: body.industry,
			stage: body.stage,
			summary: body.summary || body.description,
			problem: body.problem,
			solution: body.solution,
			requiredFunding: body.requiredFunding ?? body.funding_goal,
			expectedImpact: body.expectedImpact,
			startDate: body.startDate || body.start_date,
			endDate: body.endDate || body.end_date,
		};
	}

	const basic = body.basicInfo || {};
	const name = basic.name || body.project_title;
	const summary = basic.summary || body.description;
	const funding = basic.requiredFunding ?? body.funding_goal ?? body.requiredFunding;
	const industry = basic.industry ?? body.industry ?? null;
	const stage = basic.stage ?? body.stage ?? null;
	const problem = basic.problem ?? body.problem ?? null;
	const solution = basic.solution ?? body.solution ?? null;
	const expectedImpact = basic.expectedImpact ?? body.expectedImpact ?? null;
	const startOverride = basic.startDate || body.startDate || body.start_date || null;
	const endOverride = basic.endDate || body.endDate || body.end_date || null;

	let mentor = body.mentor;
	if (!mentor || typeof mentor !== "object") {
		mentor = {
			requested:
				body.mentor_requested !== undefined
					? parseBoolLoose(body.mentor_requested)
					: false,
			preferredField: body.mentor_preferred_field || body.mentorPreferredField || null,
		};
	}

	const timeline = parseMaybeJsonArray(body.timeline);
	const goals = parseMaybeJsonObject(body.goals);
	const market = parseMaybeJsonObject(body.market);

	return {
		body,
		basic: {
			name,
			industry,
			stage,
			summary,
			problem,
			solution,
			requiredFunding: funding,
			expectedImpact,
			startOverride,
			endOverride,
		},
		mentor,
		timeline,
		goals,
		market,
	};
}

function deriveStartEndDates(basic, timeline) {
	if (basic.startOverride && basic.endOverride) {
		return { start_date: basic.startOverride, end_date: basic.endOverride };
	}
	if (Array.isArray(timeline) && timeline.length > 0) {
		const dates = timeline
			.map((t) => t && t.deadline)
			.filter(Boolean)
			.map((d) => new Date(d))
			.filter((d) => !Number.isNaN(d.getTime()));
		if (dates.length > 0) {
			const minT = Math.min(...dates.map((d) => d.getTime()));
			const maxT = Math.max(...dates.map((d) => d.getTime()));
			const min = new Date(minT);
			const max = new Date(maxT);
			if (maxT <= minT) {
				const end = new Date(min);
				end.setFullYear(end.getFullYear() + 1);
				return {
					start_date: min.toISOString().slice(0, 10),
					end_date: end.toISOString().slice(0, 10),
				};
			}
			return {
				start_date: min.toISOString().slice(0, 10),
				end_date: max.toISOString().slice(0, 10),
			};
		}
	}
	const s = new Date();
	const e = new Date(s);
	e.setFullYear(e.getFullYear() + 1);
	return { start_date: s.toISOString().slice(0, 10), end_date: e.toISOString().slice(0, 10) };
}

async function insertProjectDocument(client, startupId, projectId, file, description) {
	if (!file || !file.buffer) return null;
	const fileBuffer = file.buffer;
	const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
	const storagePath = `db://documents/project/${projectId}/${crypto.randomBytes(16).toString("hex")}`;
	const result = await client.query(
		`INSERT INTO documents (
      startup_id, project_id, file_name, file_path, file_type, file_size_bytes, file_hash, file_data, description, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CURRENT_TIMESTAMP)
    RETURNING document_id, file_name, description`,
		[
			startupId,
			projectId,
			file.originalname,
			storagePath,
			file.mimetype,
			file.size,
			fileHash,
			fileBuffer,
			description,
		],
	);
	return result.rows[0];
}

function buildDocumentsResponse(uploadedMeta, files) {
	const byDesc = new Map(uploadedMeta.map((u) => [u.description, u]));
	const rows = [];
	const slots = [
		["Pitch deck", "pitch_deck"],
		["Business plan", "business_plan"],
		["Financial projection", "financial_projection"],
		["Tax clearance", "tax_clearance"],
	];
	for (const [description, fileKey] of slots) {
		const row = byDesc.get(description);
		const f = files && files[fileKey] && files[fileKey][0];
		if (row) {
			rows.push({
				name: row.file_name,
				status: "uploaded",
				document_id: row.document_id,
			});
		} else if (f && f.buffer) {
			rows.push({ name: f.originalname, status: "uploaded" });
		} else {
			rows.push({
				name:
					description === "Tax clearance"
						? "TaxClearance.pdf"
						: description === "Pitch deck"
							? "PitchDeck.pdf"
							: description === "Business plan"
								? "BusinessPlan.docx"
								: "Financials.xlsx",
				status: "missing",
			});
		}
	}
	return rows;
}

function buildCreateResponse(projectRow, uploadedMeta, files) {
	const basicInfo = {
		name: projectRow.project_title,
		industry: projectRow.industry,
		stage: projectRow.lifecycle_stage,
		summary: projectRow.description,
		problem: projectRow.problem_statement,
		solution: projectRow.solution_statement,
		requiredFunding: Number(projectRow.funding_goal),
		expectedImpact: projectRow.expected_impact,
		coverPhoto:
			uploadedMeta.find((u) => u.description === "Cover photo")?.file_name ||
			(files?.cover_photo?.[0]?.originalname ?? null),
		demoVideo:
			uploadedMeta.find((u) => u.description === "Demo video")?.file_name ||
			(files?.demo_video?.[0]?.originalname ?? null),
	};

	const documents = buildDocumentsResponse(uploadedMeta, files);

	return {
		basicInfo,
		documents,
		mentor: {
			requested: Boolean(projectRow.mentor_requested),
			preferredField: projectRow.mentor_preferred_field,
		},
		timeline: projectRow.timeline || [],
		goals: projectRow.goals || {},
		market: projectRow.market || {},
		project_id: projectRow.project_id,
		start_date: projectRow.start_date,
		end_date: projectRow.end_date,
		status: projectRow.status,
	};
}

exports.createProject = async (req, res) => {
	let client = null;
	try {
		const userId = req.user.user_id;
		const startupId = await getStartupIdByUserId(userId);

		if (!startupId) {
			return res.status(404).json({ error: "Startup profile not found" });
		}

		const parsed = parseCreatePayload(req);
		if (parsed.error) {
			return res.status(400).json({ error: parsed.error });
		}

		const { basic, mentor, timeline, goals, market } = parsed;
		const { start_date, end_date } = deriveStartEndDates(basic, timeline);

		if (!basic.name || typeof basic.name !== "string" || !basic.name.trim()) {
			return res.status(400).json({
				error: "basicInfo.name (or project_title) is required",
			});
		}
		if (!basic.summary || typeof basic.summary !== "string" || !basic.summary.trim()) {
			return res.status(400).json({
				error: "basicInfo.summary (or description) is required",
			});
		}

		const fundingGoalNumber = Number(basic.requiredFunding);
		if (Number.isNaN(fundingGoalNumber) || fundingGoalNumber <= 0) {
			return res.status(400).json({
				error: "basicInfo.requiredFunding must be a positive number",
			});
		}

		const startDate = new Date(start_date);
		const endDate = new Date(end_date);
		if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
			return res.status(400).json({ error: "Invalid derived start_date or end_date" });
		}
		if (endDate <= startDate) {
			return res.status(400).json({ error: "end_date must be after start_date" });
		}

		const files = req.files || {};
		if (!files.pitch_deck?.length || !files.business_plan?.length || !files.financial_projection?.length) {
			return res.status(400).json({
				error:
					"Multipart files pitch_deck, business_plan, and financial_projection are required (memory upload, stored in DB)",
			});
		}
		for (const key of ["pitch_deck", "business_plan", "financial_projection"]) {
			const f = files[key][0];
			if (!f.buffer) {
				return res.status(400).json({
					error: `Field ${key} must be uploaded in memory (use multipart with multer memoryStorage); disk paths are not accepted`,
				});
			}
		}

		const mentorRequested = Boolean(mentor && mentor.requested);
		const mentorPreferred =
			typeof mentor.preferredField === "string" ? mentor.preferredField.trim() : null;

		const timelineJson =
			Array.isArray(timeline) && timeline.length > 0 ? JSON.stringify(timeline) : null;
		const goalsJson = goals && typeof goals === "object" ? JSON.stringify(goals) : null;
		const marketJson = market && typeof market === "object" ? JSON.stringify(market) : null;

		client = await pool.connect();
		await client.query("BEGIN");

		const insertResult = await client.query(
			`INSERT INTO projects(
        startup_id,
        project_title,
        description,
        funding_goal,
        start_date,
        end_date,
        industry,
        lifecycle_stage,
        problem_statement,
        solution_statement,
        expected_impact,
        timeline,
        goals,
        market,
        mentor_requested,
        mentor_preferred_field
      )
      VALUES($1,$2,$3,$4,$5::date,$6::date,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14::jsonb,$15,$16)
      RETURNING *`,
			[
				startupId,
				basic.name.trim(),
				basic.summary.trim(),
				fundingGoalNumber,
				start_date,
				end_date,
				basic.industry,
				basic.stage,
				basic.problem,
				basic.solution,
				basic.expectedImpact,
				timelineJson,
				goalsJson,
				marketJson,
				mentorRequested,
				mentorPreferred,
			],
		);

		const project = insertResult.rows[0];
		const uploadedMeta = [];

		const save = async (field, description) => {
			const arr = files[field];
			if (!arr || !arr.length) return;
			const f = arr[0];
			if (!f.buffer) return;
			const row = await insertProjectDocument(client, startupId, project.project_id, f, description);
			if (row) uploadedMeta.push({ ...row, description });
		};

		await save("pitch_deck", "Pitch deck");
		await save("business_plan", "Business plan");
		await save("financial_projection", "Financial projection");
		await save("tax_clearance", "Tax clearance");
		await save("cover_photo", "Cover photo");
		await save("demo_video", "Demo video");

		await client.query("COMMIT");

		const responseBody = buildCreateResponse(project, uploadedMeta, files);

		return res.status(201).json({
			message: "Project created successfully",
			...responseBody,
		});
	} catch (err) {
		if (client) {
			try {
				await client.query("ROLLBACK");
			} catch {
				/* ignore */
			}
		}
		return res.status(500).json({ error: err.message });
	} finally {
		if (client) client.release();
	}
};

exports.getMyProjects = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const startupId = await getStartupIdByUserId(userId);

		if (!startupId) {
			return res.status(404).json({ error: "Startup profile not found" });
		}

		const result = await pool.query(
			`SELECT p.*, s.startup_name, s.industry AS startup_industry
       FROM projects p
       JOIN startups s ON p.startup_id = s.startup_id
       WHERE p.startup_id = $1
       ORDER BY p.created_at DESC`,
			[startupId],
		);

		res.json({ projects: result.rows });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.updateProject = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const startupId = await getStartupIdByUserId(userId);

		if (!startupId) {
			return res.status(404).json({ error: "Startup profile not found" });
		}

		const projectId = Number(req.params.projectId);
		if (!Number.isInteger(projectId) || projectId <= 0) {
			return res.status(400).json({ error: "Invalid projectId" });
		}

		const existing = await pool.query(
			`SELECT * FROM projects WHERE project_id = $1 AND startup_id = $2`,
			[projectId, startupId],
		);

		if (existing.rowCount === 0) {
			return res.status(404).json({ error: "Project not found" });
		}

		const {
			project_title,
			description,
			funding_goal,
			start_date,
			end_date,
			status,
			industry,
			lifecycle_stage,
			problem_statement,
			solution_statement,
			expected_impact,
			timeline,
			goals,
			market,
			mentor_requested,
			mentor_preferred_field,
		} = req.body;

		const current = existing.rows[0];
		const title = project_title || current.project_title;
		const desc = description || current.description;
		const fundingGoal = funding_goal !== undefined ? Number(funding_goal) : current.funding_goal;
		const startDate = start_date ? new Date(start_date) : current.start_date;
		const endDate = end_date ? new Date(end_date) : current.end_date;

		if (project_title !== undefined && (typeof project_title !== "string" || project_title.trim() === "")) {
			return res.status(400).json({ error: "project_title must be a non-empty string" });
		}

		if (funding_goal !== undefined && (Number.isNaN(fundingGoal) || fundingGoal <= 0)) {
			return res.status(400).json({ error: "funding_goal must be a positive number" });
		}

		if (start_date !== undefined && Number.isNaN(new Date(start_date).getTime())) {
			return res.status(400).json({ error: "start_date must be a valid date" });
		}

		if (end_date !== undefined && Number.isNaN(new Date(end_date).getTime())) {
			return res.status(400).json({ error: "end_date must be a valid date" });
		}

		if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
			return res.status(400).json({ error: "end_date must be after start_date" });
		}

		const timelineVal =
			timeline !== undefined
				? typeof timeline === "string"
					? timeline
					: JSON.stringify(timeline)
				: current.timeline;
		const goalsVal =
			goals !== undefined ? (typeof goals === "string" ? goals : JSON.stringify(goals)) : current.goals;
		const marketVal =
			market !== undefined
				? typeof market === "string"
					? market
					: JSON.stringify(market)
				: current.market;

		const updateResult = await pool.query(
			`UPDATE projects SET
         project_title = $1,
         description = $2,
         funding_goal = $3,
         start_date = $4,
         end_date = $5,
         status = COALESCE($6, status),
         industry = COALESCE($7, industry),
         lifecycle_stage = COALESCE($8, lifecycle_stage),
         problem_statement = COALESCE($9, problem_statement),
         solution_statement = COALESCE($10, solution_statement),
         expected_impact = COALESCE($11, expected_impact),
         timeline = COALESCE($12::jsonb, timeline),
         goals = COALESCE($13::jsonb, goals),
         market = COALESCE($14::jsonb, market),
         mentor_requested = COALESCE($15, mentor_requested),
         mentor_preferred_field = COALESCE($16, mentor_preferred_field)
       WHERE project_id = $17 AND startup_id = $18
       RETURNING *`,
			[
				title,
				desc,
				fundingGoal,
				startDate,
				endDate,
				status || null,
				industry ?? null,
				lifecycle_stage ?? null,
				problem_statement ?? null,
				solution_statement ?? null,
				expected_impact ?? null,
				timelineVal,
				goalsVal,
				marketVal,
				mentor_requested !== undefined ? mentor_requested : null,
				mentor_preferred_field ?? null,
				projectId,
				startupId,
			],
		);

		res.json({ project: updateResult.rows[0] });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.deleteProject = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const startupId = await getStartupIdByUserId(userId);

		if (!startupId) {
			return res.status(404).json({ error: "Startup profile not found" });
		}

		const projectId = Number(req.params.projectId);
		if (!Number.isInteger(projectId) || projectId <= 0) {
			return res.status(400).json({ error: "Invalid projectId" });
		}

		const result = await pool.query(
			`DELETE FROM projects WHERE project_id = $1 AND startup_id = $2 RETURNING *`,
			[projectId, startupId],
		);

		if (result.rowCount === 0) {
			return res.status(404).json({ error: "Project not found" });
		}

		res.json({ message: "Project deleted successfully", project: result.rows[0] });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.getAllProjects = async (req, res) => {
	try {
		const result = await pool.query(
			`SELECT
         p.project_id,
         p.project_title,
         p.description,
         p.funding_goal,
         p.amount_raised,
         p.status,
         p.industry,
         p.lifecycle_stage,
         s.startup_name,
         s.industry AS startup_industry
       FROM projects p
       JOIN startups s ON p.startup_id = s.startup_id
       ORDER BY p.created_at DESC`,
		);

		res.json(result.rows);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};
