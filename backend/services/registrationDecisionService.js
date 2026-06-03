async function ensureRegistrationAutomationSchema(client) {
	await client.query(
		"ALTER TABLE users ADD COLUMN IF NOT EXISTS automation_status VARCHAR(30)",
	);
	await client.query(
		"ALTER TABLE users ADD COLUMN IF NOT EXISTS automation_score INTEGER",
	);
	await client.query(
		"ALTER TABLE users ADD COLUMN IF NOT EXISTS automation_reasons JSONB",
	);
	await client.query(
		"ALTER TABLE users ADD COLUMN IF NOT EXISTS automation_decided_at TIMESTAMPTZ",
	);
	await client.query(
		"ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_review JSONB",
	);
	await client.query(
		"ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_recommendation VARCHAR(30)",
	);
	await client.query(
		"ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_risk_level VARCHAR(30)",
	);
}

function parseOpenAIJson(responseBody) {
	const outputText =
		responseBody.output_text ||
		responseBody.output
			?.flatMap((item) => item.content || [])
			?.map((content) => content.text || "")
			?.join("");
	if (!outputText) {
		throw new Error("OpenAI response did not include output text");
	}
	return JSON.parse(outputText);
}

function parseChatCompletionJson(responseBody, providerName) {
	const outputText = responseBody.choices?.[0]?.message?.content || "";
	if (!outputText) {
		throw new Error(`${providerName} response did not include output text`);
	}

	const trimmed = outputText.trim();
	const fencedJson = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
	return JSON.parse(fencedJson ? fencedJson[1] : trimmed);
}

function parseGeminiJson(responseBody) {
	const outputText =
		responseBody.candidates?.[0]?.content?.parts
			?.map((part) => part.text || "")
			?.join("") || "";
	if (!outputText) {
		throw new Error("Gemini response did not include output text");
	}
	return JSON.parse(outputText);
}

function safeString(value) {
	return String(value || "");
}

function safeProfile(profile) {
	return profile || {};
}

function startupReviewPrompt({ user, startup, uploadedDocuments, ruleDecision }) {
	const safeStartup = safeProfile(startup);
	return JSON.stringify({
		instruction:
			"Review this Startup registration. Return only JSON. Evaluate profile completeness, consistency, and document content if provided. Do not claim uploaded documents are authentic; you may only say whether visible/readable document content appears relevant, consistent, or suspicious.",
		required_json_shape: {
			recommendation: "approve or reject",
			risk_level: "low, medium, or high",
			summary: "short admin-facing explanation",
			concerns: ["risk or missing data"],
			positive_signals: ["good signals"],
		},
		rule_score: ruleDecision.score,
		rule_status: ruleDecision.status,
		rule_reasons: ruleDecision.reasons,
		user: {
			email_verified: Boolean(user.email_verified),
			phone_provided: Boolean(user.phone_number),
		},
		startup: {
			founder_full_name: safeString(safeStartup.founder_full_name),
			startup_name: safeString(safeStartup.startup_name),
			industry: safeString(safeStartup.industry),
			startup_tagline: safeString(safeStartup.startup_tagline),
			business_stage: safeString(safeStartup.business_stage),
			startup_type: safeString(safeStartup.startup_type),
			founded_year: safeString(safeStartup.founded_year),
			region: safeString(safeStartup.region),
			city: safeString(safeStartup.city),
			team_size: safeString(safeStartup.team_size),
			founder_role: safeString(safeStartup.founder_role),
			website: safeString(safeStartup.website),
		},
		uploaded_documents: (uploadedDocuments || []).map((doc) => ({
			document_type: doc.document_type,
			file_type: doc.file_type,
			file_size_bytes: doc.file_size_bytes,
			has_ai_file_content: Boolean(doc.file_data_base64),
		})),
	});
}

function registrationReviewPrompt({ role, user, profile, uploadedDocuments, ruleDecision }) {
	const safeProfileData = safeProfile(profile);
	if (role === "Startup") {
		return startupReviewPrompt({ user, startup: safeProfileData, uploadedDocuments, ruleDecision });
	}

	const isInvestor = role === "Investor";
	return JSON.stringify({
		instruction: `Review this ${role} registration. Return only JSON. Evaluate profile completeness, consistency, and document content if provided. Do not claim uploaded documents are authentic; you may only say whether visible/readable document content appears relevant, consistent, or suspicious.`,
		required_json_shape: {
			recommendation: "approve or reject",
			risk_level: "low, medium, or high",
			summary: "short admin-facing explanation",
			concerns: ["risk or missing data"],
			positive_signals: ["good signals"],
		},
		rule_score: ruleDecision.score,
		rule_status: ruleDecision.status,
		rule_reasons: ruleDecision.reasons,
		user: {
			email_verified: Boolean(user.email_verified),
			phone_provided: Boolean(user.phone_number),
		},
		[isInvestor ? "investor" : "mentor"]: isInvestor
			? {
				investor_type: safeString(safeProfileData.investor_type),
				preferred_industry: safeString(safeProfileData.preferred_industry),
				investment_stage: safeString(safeProfileData.investment_stage),
				investment_budget: safeString(safeProfileData.investment_budget),
				investment_budget_min: safeString(safeProfileData.investment_budget_min),
				location_preference: safeString(safeProfileData.location_preference),
				linked_in_or_website: safeString(safeProfileData.linked_in_or_website),
				bio: safeString(safeProfileData.bio),
				personal_verification: safeString(safeProfileData.personal_verification),
			}
			: {
				professional_title: safeString(safeProfileData.professional_title),
				expertise: safeString(safeProfileData.expertise),
				years_experience: safeString(safeProfileData.years_experience),
				languages: safeString(safeProfileData.languages),
				linkedin_or_portfolio: safeString(safeProfileData.linkedin_or_portfolio),
				certification_credentials: safeString(safeProfileData.certification_credentials),
				availability_preference: safeString(safeProfileData.availability_preference),
				session_pricing: safeString(safeProfileData.session_pricing),
				session_pricing_min: safeString(safeProfileData.session_pricing_min),
				current_organization: safeString(safeProfileData.current_organization),
				current_title: safeString(safeProfileData.current_title),
				primary_industry: safeString(safeProfileData.primary_industry),
				secondary_industry: safeString(safeProfileData.secondary_industry),
				city_location: safeString(safeProfileData.city_location),
				mentor_platform: safeString(safeProfileData.mentor_platform),
				session_frequency: safeString(safeProfileData.session_frequency),
				required_time_slots: safeString(safeProfileData.required_time_slots),
				mentoring_style: safeString(safeProfileData.mentoring_style),
				notable_startups_mentored: safeString(safeProfileData.notable_startups_mentored),
				key_achievement: safeString(safeProfileData.key_achievement),
			},
		uploaded_documents: (uploadedDocuments || []).map((doc) => ({
			document_type: doc.document_type,
			file_type: doc.file_type,
			file_size_bytes: doc.file_size_bytes,
			has_ai_file_content: Boolean(doc.file_data_base64),
		})),
	});
}

function normalizeAIReview(review) {
	const recommendation = review.recommendation === "approve" ? "approve" : "reject";
	const allowedRisks = new Set(["low", "medium", "high"]);
	const riskLevel = allowedRisks.has(review.risk_level) ? review.risk_level : "medium";
	return {
		recommendation,
		risk_level: riskLevel,
		summary: String(review.summary || "AI reviewed this Startup registration."),
		concerns: Array.isArray(review.concerns) ? review.concerns.map(String) : [],
		positive_signals: Array.isArray(review.positive_signals)
			? review.positive_signals.map(String)
			: [],
	};
}

async function reviewStartupWithGemini({ user, startup, uploadedDocuments, ruleDecision }) {
	return reviewRegistrationWithGemini({
		role: "Startup",
		user,
		profile: startup,
		uploadedDocuments,
		ruleDecision,
	});
}

async function reviewRegistrationWithGemini({ role, user, profile, uploadedDocuments, ruleDecision }) {
	if (!process.env.GEMINI_API_KEY) {
		return {
			status: "unavailable",
			provider: "gemini",
			model: process.env.GEMINI_STARTUP_REVIEW_MODEL || "gemini-2.5-flash",
			recommendation: "needs_human_or_rule_review",
			risk_level: "unknown",
			summary: `AI review was skipped because GEMINI_API_KEY is not configured.`,
			concerns: ["Missing GEMINI_API_KEY"],
			positive_signals: [],
		};
	}

	const model = process.env.GEMINI_STARTUP_REVIEW_MODEL || "gemini-2.5-flash";
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
	const contentParts = [
		{
			text: registrationReviewPrompt({
				role,
				user,
				profile,
				uploadedDocuments,
				ruleDecision,
			}),
		},
	];

	for (const doc of uploadedDocuments || []) {
		if (!doc.file_data_base64 || !doc.file_type) continue;
		contentParts.push({
			text: `Document for review: ${doc.document_type || doc.description || "Uploaded document"} (${doc.file_type})`,
		});
		contentParts.push({
			inlineData: {
				mimeType: doc.file_type,
				data: doc.file_data_base64,
			},
		});
	}

	const response = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			systemInstruction: {
				parts: [
					{
						text: `You are a ${role} registration risk reviewer for an admin dashboard. Return strict JSON only.`,
					},
				],
			},
			contents: [
				{
					role: "user",
					parts: contentParts,
				},
			],
			generationConfig: {
				temperature: 0.2,
				responseMimeType: "application/json",
			},
		}),
	});

	const body = await response.json();
	if (!response.ok) {
		throw new Error(body.error?.message || "Gemini startup review failed");
	}

	return {
		status: "completed",
		provider: "gemini",
		model,
		...normalizeAIReview(parseGeminiJson(body)),
	};
}

async function reviewStartupWithOpenAI({ user, startup, uploadedDocuments, ruleDecision }) {
	return reviewRegistrationWithOpenAI({
		role: "Startup",
		user,
		profile: startup,
		uploadedDocuments,
		ruleDecision,
	});
}

async function reviewRegistrationWithOpenAI({ role, user, profile, uploadedDocuments, ruleDecision }) {
	if (!process.env.OPENAI_API_KEY) {
		return {
			status: "unavailable",
			provider: "openai",
			model: process.env.OPENAI_STARTUP_REVIEW_MODEL || "gpt-4o-mini",
			recommendation: "needs_human_or_rule_review",
			risk_level: "unknown",
			summary: "AI review was skipped because OPENAI_API_KEY is not configured.",
			concerns: ["Missing OPENAI_API_KEY"],
			positive_signals: [],
		};
	}

	const model = process.env.OPENAI_STARTUP_REVIEW_MODEL || "gpt-4o-mini";
	const payload = {
		model,
		input: [
			{
				role: "system",
				content:
					`You are a ${role} registration risk reviewer. Review only the provided data. Do not claim documents are authentic. Recommend approve only when the profile is complete, consistent, and low risk.`,
			},
			{
				role: "user",
				content: registrationReviewPrompt({ role, user, profile, uploadedDocuments, ruleDecision }),
			},
		],
		text: {
			format: {
				type: "json_schema",
				name: "startup_registration_ai_review",
				strict: true,
				schema: {
					type: "object",
					additionalProperties: false,
					properties: {
						recommendation: {
							type: "string",
							enum: ["approve", "reject"],
						},
						risk_level: {
							type: "string",
							enum: ["low", "medium", "high"],
						},
						summary: { type: "string" },
						concerns: {
							type: "array",
							items: { type: "string" },
						},
						positive_signals: {
							type: "array",
							items: { type: "string" },
						},
					},
					required: [
						"recommendation",
						"risk_level",
						"summary",
						"concerns",
						"positive_signals",
					],
				},
			},
		},
	};

	const response = await fetch("https://api.openai.com/v1/responses", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	const body = await response.json();
	if (!response.ok) {
		throw new Error(body.error?.message || "OpenAI startup review failed");
	}

	const parsed = parseOpenAIJson(body);
	return {
		status: "completed",
		provider: "openai",
		model,
		...normalizeAIReview(parsed),
	};
}

async function reviewStartupWithGroq({ user, startup, uploadedDocuments, ruleDecision }) {
	return reviewRegistrationWithGroq({
		role: "Startup",
		user,
		profile: startup,
		uploadedDocuments,
		ruleDecision,
	});
}

async function reviewRegistrationWithGroq({ role, user, profile, uploadedDocuments, ruleDecision }) {
	if (!process.env.GROQ_API_KEY) {
		return {
			status: "unavailable",
			provider: "groq",
			model: process.env.GROQ_REVIEW_MODEL || process.env.GROQ_MODEL || "llama-3.1-8b-instant",
			recommendation: "needs_human_or_rule_review",
			risk_level: "unknown",
			summary: "AI review was skipped because GROQ_API_KEY is not configured.",
			concerns: ["Missing GROQ_API_KEY"],
			positive_signals: [],
		};
	}

	const model = process.env.GROQ_REVIEW_MODEL || process.env.GROQ_MODEL || "llama-3.1-8b-instant";
	const payload = {
		model,
		messages: [
			{
				role: "system",
				content:
					`You are a ${role} registration risk reviewer for an admin dashboard. Return strict JSON only with recommendation, risk_level, summary, concerns, and positive_signals.`,
			},
			{
				role: "user",
				content: registrationReviewPrompt({ role, user, profile, uploadedDocuments, ruleDecision }),
			},
		],
		temperature: 0.2,
		max_tokens: 800,
		response_format: { type: "json_object" },
	};

	const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	const body = await response.json();
	if (!response.ok) {
		throw new Error(body.error?.message || "Groq registration review failed");
	}

	return {
		status: "completed",
		provider: "groq",
		model,
		...normalizeAIReview(parseChatCompletionJson(body, "Groq")),
	};
}

async function reviewStartupWithPretrainedAI(args) {
	return reviewRegistrationWithPretrainedAI({
		role: "Startup",
		user: args.user,
		profile: args.startup,
		uploadedDocuments: args.uploadedDocuments,
		ruleDecision: args.ruleDecision,
	});
}

async function reviewRegistrationWithPretrainedAI(args) {
	const provider = String(process.env.AI_REVIEW_PROVIDER || "gemini").toLowerCase();
	if (provider === "openai") {
		return reviewRegistrationWithOpenAI(args);
	}
	if (provider === "groq") {
		return reviewRegistrationWithGroq(args);
	}
	return reviewRegistrationWithGemini(args);
}

function aiReviewModelForProvider(provider) {
	if (provider === "openai") return process.env.OPENAI_STARTUP_REVIEW_MODEL || "gpt-4o-mini";
	if (provider === "groq") return process.env.GROQ_REVIEW_MODEL || process.env.GROQ_MODEL || "llama-3.1-8b-instant";
	return process.env.GEMINI_STARTUP_REVIEW_MODEL || "gemini-2.5-flash";
}

function scoreStartupRegistration({ user, startup, uploadedDocuments }) {
	startup = safeProfile(startup);
	const reasons = [];
	let score = 0;

	const add = (points, reason) => {
		score += points;
		reasons.push({ type: "pass", points, reason });
	};
	const subtract = (points, reason) => {
		score -= points;
		reasons.push({ type: "risk", points: -points, reason });
	};

	if (user.email_verified) add(15, "Email is verified");
	else subtract(50, "Email is not verified");

	if (user.phone_number) add(10, "Phone number is provided");
	else subtract(15, "Phone number is missing");

	const requiredTextFields = [
		["founder_full_name", startup.founder_full_name],
		["startup_name", startup.startup_name],
		["industry", startup.industry],
		["startup_tagline", startup.startup_tagline],
		["business_stage", startup.business_stage],
		["startup_type", startup.startup_type],
		["region", startup.region],
		["city", startup.city],
		["founder_role", startup.founder_role],
	];
	const missingFields = requiredTextFields
		.filter(([, value]) => !String(value || "").trim())
		.map(([field]) => field);
	if (missingFields.length === 0) add(25, "All required Startup profile fields are present");
	else subtract(40, `Missing required Startup fields: ${missingFields.join(", ")}`);

	const foundedYear = Number(startup.founded_year);
	const currentYear = new Date().getFullYear();
	if (Number.isInteger(foundedYear) && foundedYear >= 1900 && foundedYear <= currentYear) {
		add(10, "Founded year is realistic");
	} else {
		subtract(25, "Founded year is invalid or in the future");
	}

	const teamSize = Number(startup.team_size);
	if (Number.isInteger(teamSize) && teamSize > 0) {
		add(10, "Team size is valid");
	} else if (Number.isInteger(teamSize) && teamSize === 0) {
		subtract(5, "Team size is zero");
	} else {
		subtract(20, "Team size is invalid");
	}

	const docs = Array.isArray(uploadedDocuments) ? uploadedDocuments : [];
	const hasDoc = (label) =>
		docs.some((doc) => String(doc.document_type || "").toLowerCase() === label);

	if (hasDoc("company logo")) add(5, "Company logo was uploaded");
	else subtract(10, "Company logo is missing");

	if (hasDoc("founder or representative id")) add(15, "Founder or representative ID was uploaded");
	else subtract(35, "Founder or representative ID is missing");

	if (hasDoc("business registration proof")) add(20, "Business registration proof was uploaded");
	else subtract(45, "Business registration proof is missing");

	if (startup.website) {
		try {
			const url = new URL(String(startup.website).trim());
			if (url.protocol === "http:" || url.protocol === "https:") {
				add(5, "Website URL is valid");
			} else {
				subtract(10, "Website URL must start with http:// or https://");
			}
		} catch {
			subtract(10, "Website URL is invalid");
		}
	}

	score = Math.max(0, Math.min(100, score));
	const status = score >= 80 ? "rule_recommends_approval" : "rule_recommends_rejection";
	return { status, score, reasons };
}

function createScoreBuilder() {
	const reasons = [];
	let score = 0;

	return {
		add(points, reason) {
			score += points;
			reasons.push({ type: "pass", points, reason });
		},
		subtract(points, reason) {
			score -= points;
			reasons.push({ type: "risk", points: -points, reason });
		},
		result() {
			score = Math.max(0, Math.min(100, score));
			const status = score >= 80 ? "rule_recommends_approval" : "rule_recommends_rejection";
			return { status, score, reasons };
		},
	};
}

function hasDocument(uploadedDocuments, label) {
	const docs = Array.isArray(uploadedDocuments) ? uploadedDocuments : [];
	return docs.some((doc) => String(doc.document_type || "").toLowerCase() === label);
}

function validHttpUrl(value) {
	if (!value) return false;
	try {
		const url = new URL(String(value).trim());
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

function scoreInvestorRegistration({ user, investor, uploadedDocuments }) {
	investor = safeProfile(investor);
	const score = createScoreBuilder();

	if (user.email_verified) score.add(15, "Email is verified");
	else score.subtract(50, "Email is not verified");

	if (user.phone_number) score.add(10, "Phone number is provided");
	else score.subtract(15, "Phone number is missing");

	const requiredTextFields = [
		["investor_type", investor.investor_type],
		["preferred_industry", investor.preferred_industry],
		["investment_stage", investor.investment_stage],
		["location_preference", investor.location_preference],
		["linked_in_or_website", investor.linked_in_or_website],
		["bio", investor.bio],
		["personal_verification", investor.personal_verification],
	];
	const missingFields = requiredTextFields
		.filter(([, value]) => !String(value || "").trim())
		.map(([field]) => field);
	if (missingFields.length === 0) score.add(25, "All required Investor profile fields are present");
	else score.subtract(40, `Missing required Investor fields: ${missingFields.join(", ")}`);

	const budget = Number(investor.investment_budget);
	const budgetMin = Number(investor.investment_budget_min || 0);
	if (!Number.isNaN(budget) && budget > 0 && !Number.isNaN(budgetMin) && budgetMin >= 0 && budgetMin <= budget) {
		score.add(15, "Investment budget range is valid");
	} else {
		score.subtract(25, "Investment budget range is invalid");
	}

	if (validHttpUrl(investor.linked_in_or_website)) score.add(10, "LinkedIn or website URL is valid");
	else score.subtract(15, "LinkedIn or website URL is invalid");

	if (hasDocument(uploadedDocuments, "profile picture")) score.add(5, "Profile picture was uploaded");
	else score.subtract(10, "Profile picture is missing");

	if (hasDocument(uploadedDocuments, "registration document")) score.add(15, "Registration document was uploaded");
	else score.subtract(35, "Registration document is missing");

	if (hasDocument(uploadedDocuments, "trade license")) score.add(15, "Trade license was uploaded");
	else score.subtract(35, "Trade license is missing");

	if (hasDocument(uploadedDocuments, "tin certificate")) score.add(15, "TIN certificate was uploaded");
	else score.subtract(30, "TIN certificate is missing");

	return score.result();
}

function scoreMentorRegistration({ user, mentor, uploadedDocuments }) {
	mentor = safeProfile(mentor);
	const score = createScoreBuilder();

	if (user.email_verified) score.add(15, "Email is verified");
	else score.subtract(50, "Email is not verified");

	if (user.phone_number) score.add(10, "Phone number is provided");
	else score.subtract(15, "Phone number is missing");

	const requiredTextFields = [
		["professional_title", mentor.professional_title],
		["expertise", mentor.expertise],
		["languages", mentor.languages],
		["bio", mentor.bio],
		["linkedin_or_portfolio", mentor.linkedin_or_portfolio],
		["availability_preference", mentor.availability_preference],
		["current_organization", mentor.current_organization],
		["current_title", mentor.current_title],
		["primary_industry", mentor.primary_industry],
		["city_location", mentor.city_location],
		["mentor_platform", mentor.mentor_platform],
		["session_frequency", mentor.session_frequency],
		["required_time_slots", mentor.required_time_slots],
		["mentoring_style", mentor.mentoring_style],
		["notable_startups_mentored", mentor.notable_startups_mentored],
		["key_achievement", mentor.key_achievement],
	];
	const missingFields = requiredTextFields
		.filter(([, value]) => !String(value || "").trim())
		.map(([field]) => field);
	if (missingFields.length === 0) score.add(25, "All required Mentor profile fields are present");
	else score.subtract(40, `Missing required Mentor fields: ${missingFields.join(", ")}`);

	const years = Number(mentor.years_experience);
	if (Number.isInteger(years) && years >= 0) score.add(10, "Years of experience is valid");
	else score.subtract(20, "Years of experience is invalid");

	const sessionPricing = Number(mentor.session_pricing);
	const sessionPricingMin = Number(mentor.session_pricing_min || 0);
	if (
		!Number.isNaN(sessionPricing) &&
		sessionPricing >= 0 &&
		!Number.isNaN(sessionPricingMin) &&
		sessionPricingMin >= 0 &&
		sessionPricingMin <= sessionPricing
	) {
		score.add(10, "Session pricing range is valid");
	} else {
		score.subtract(20, "Session pricing range is invalid");
	}

	if (validHttpUrl(mentor.linkedin_or_portfolio)) score.add(10, "LinkedIn or portfolio URL is valid");
	else score.subtract(15, "LinkedIn or portfolio URL is invalid");

	if (hasDocument(uploadedDocuments, "profile picture")) score.add(10, "Profile picture was uploaded");
	else score.subtract(20, "Profile picture is missing");

	if (hasDocument(uploadedDocuments, "government-issued id")) score.add(10, "Government-issued ID was uploaded");

	if (hasDocument(uploadedDocuments, "certification or credential file")) {
		score.add(10, "Certification or credential file was uploaded");
	}

	return score.result();
}

function scoreRegistration({ role, user, profile, uploadedDocuments }) {
	if (role === "Investor") {
		return scoreInvestorRegistration({ user, investor: profile, uploadedDocuments });
	}
	if (role === "Mentor") {
		return scoreMentorRegistration({ user, mentor: profile, uploadedDocuments });
	}
	return scoreStartupRegistration({ user, startup: profile, uploadedDocuments });
}

function roleConfig(role, profile) {
	if (role === "Investor") {
		return {
			profileKey: "investor",
			entityId: profile.investor_id,
			auditAction: "ai_review_investor_registration",
			updateSql: "UPDATE investors SET is_approved = false WHERE investor_id = $1 RETURNING *",
		};
	}
	if (role === "Mentor") {
		return {
			profileKey: "mentor",
			entityId: profile.mentor_id,
			auditAction: "ai_review_mentor_registration",
			updateSql: "UPDATE mentors SET is_approved = false WHERE mentor_id = $1 RETURNING *",
		};
	}
	return {
		profileKey: "startup",
		entityId: profile.startup_id,
		auditAction: "ai_review_startup_registration",
		updateSql: "UPDATE startups SET is_listed = false, admin_status = 'Pending' WHERE startup_id = $1 RETURNING *",
	};
}

async function decideRegistration(client, { role, user, profile, uploadedDocuments, reviewOnly = false }) {
	await ensureRegistrationAutomationSchema(client);

	const ruleDecision = scoreRegistration({ role, user, profile, uploadedDocuments });
	let aiReview;
	try {
		aiReview = await reviewRegistrationWithPretrainedAI({
			role,
			user,
			profile,
			uploadedDocuments,
			ruleDecision,
		});
	} catch (err) {
		const provider = String(process.env.AI_REVIEW_PROVIDER || "gemini").toLowerCase();
		aiReview = {
			status: "failed",
			provider,
			model: aiReviewModelForProvider(provider),
			recommendation: "needs_human_or_rule_review",
			risk_level: "unknown",
			summary: "AI review failed, so the system used the rule score only.",
			concerns: [err.message],
			positive_signals: [],
		};
	}

	const aiCompleted = aiReview.status === "completed";
	const aiAllowsApproval =
		aiReview.status === "completed" &&
		aiReview.recommendation === "approve" &&
		aiReview.risk_level !== "high";
	const recommendsApproval =
		ruleDecision.score >= 80 &&
		(aiCompleted ? aiAllowsApproval : true);
	const decision = {
		status: aiCompleted
			? recommendsApproval
				? "ai_recommends_approval"
				: "ai_recommends_rejection"
			: ruleDecision.status,
		score: ruleDecision.score,
		reasons: ruleDecision.reasons,
		ai_review: aiReview,
	};
	const config = roleConfig(role, profile);

	const automationParams = [
		decision.status,
		decision.score,
		JSON.stringify(decision.reasons),
		JSON.stringify(aiReview),
		aiReview.recommendation,
		aiReview.risk_level,
		user.user_id,
	];
	const userResult = reviewOnly
		? await client.query(
			`UPDATE users
			 SET automation_status = $1,
			     automation_score = $2,
			     automation_reasons = $3::jsonb,
			     ai_review = $4::jsonb,
			     ai_recommendation = $5,
			     ai_risk_level = $6,
			     automation_decided_at = NOW(),
			     updated_at = NOW()
			 WHERE user_id = $7
			 RETURNING user_id, first_name, last_name, email, role, phone_number, is_active,
			           is_approved, email_verified, automation_status, automation_score,
			           automation_reasons, ai_review, ai_recommendation, ai_risk_level,
			           rejection_reason`,
			automationParams,
		)
		: await client.query(
			`UPDATE users
			 SET is_approved = false,
			     is_active = true,
			     approved_by = NULL,
			     approved_at = NULL,
			     rejection_reason = NULL,
			     rejected_at = NULL,
			     rejected_by = NULL,
			     automation_status = $1,
			     automation_score = $2,
			     automation_reasons = $3::jsonb,
			     ai_review = $4::jsonb,
			     ai_recommendation = $5,
			     ai_risk_level = $6,
			     automation_decided_at = NOW(),
			     updated_at = NOW()
			 WHERE user_id = $7
			 RETURNING user_id, first_name, last_name, email, role, phone_number, is_active,
			           is_approved, email_verified, automation_status, automation_score,
			           automation_reasons, ai_review, ai_recommendation, ai_risk_level,
			           rejection_reason`,
			automationParams,
		);

	const profileResult = reviewOnly
		? { rows: [profile] }
		: await client.query(config.updateSql, [config.entityId]);

	await client.query(
		`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, metadata)
		 VALUES (NULL, $1, 'users', $2, $3, $4::jsonb)`,
		[
			reviewOnly ? `${config.auditAction}_review_only` : config.auditAction,
			user.user_id,
			`${role} registration AI review completed${reviewOnly ? " without changing approval" : ""}: ${decision.status}, score ${decision.score}`,
			JSON.stringify({
				role,
				review_only: reviewOnly,
				score: decision.score,
				status: decision.status,
				reasons: decision.reasons,
				ai_review: aiReview,
			}),
		],
	);

	return {
		...decision,
		user: userResult.rows[0],
		[config.profileKey]: profileResult.rows[0],
	};
}

async function decideStartupRegistration(client, { user, startup, uploadedDocuments, reviewOnly }) {
	return decideRegistration(client, {
		role: "Startup",
		user,
		profile: startup,
		uploadedDocuments,
		reviewOnly,
	});
}

async function decideInvestorRegistration(client, { user, investor, uploadedDocuments, reviewOnly }) {
	return decideRegistration(client, {
		role: "Investor",
		user,
		profile: investor,
		uploadedDocuments,
		reviewOnly,
	});
}

async function decideMentorRegistration(client, { user, mentor, uploadedDocuments, reviewOnly }) {
	return decideRegistration(client, {
		role: "Mentor",
		user,
		profile: mentor,
		uploadedDocuments,
		reviewOnly,
	});
}

module.exports = {
	decideRegistration,
	decideStartupRegistration,
	decideInvestorRegistration,
	decideMentorRegistration,
	scoreRegistration,
	scoreStartupRegistration,
	scoreInvestorRegistration,
	scoreMentorRegistration,
	reviewRegistrationWithPretrainedAI,
	reviewStartupWithPretrainedAI,
	reviewStartupWithGemini,
	reviewStartupWithGroq,
	reviewStartupWithOpenAI,
	reviewRegistrationWithGroq,
	ensureRegistrationAutomationSchema,
};
