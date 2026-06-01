const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
const REFRESH_TOKEN_EXP_DAYS = parseInt(
	process.env.REFRESH_TOKEN_DAYS || "30",
	10,
);
const crypto = require("crypto");
const securityMonitoringService = require("../services/securityMonitoringService");
const authSecurity = require("../services/authSecurityService");
const authSecurityController = require("./authSecurityController");
const { getPlatformConfig } = require("../services/platformSettingsService");

const isValidUrl = (value) => {
	if (!value) return false;
	try {
		const url = new URL(String(value).trim());
		return url.protocol === "http:" || url.protocol === "https:";
	} catch (err) {
		return false;
	}
};

const hasStrongPassword = (password) => {
	return typeof password === "string" && /(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d).{8,}/.test(password);
};

function normalizePhone(phone) {
	const trimmed = String(phone || "").trim();
	return trimmed || null;
}

function mapRegistrationDbError(err) {
	if (err.code === "23505") {
		const detail = String(err.detail || err.message || "").toLowerCase();
		const constraint = String(err.constraint || "").toLowerCase();
		if (constraint.includes("email") || detail.includes("email")) {
			return { status: 409, message: "An account with this email already exists" };
		}
		if (constraint.includes("phone") || detail.includes("phone")) {
			return { status: 409, message: "This phone number is already registered" };
		}
		return { status: 409, message: "Account already exists with these details" };
	}
	if (err.code === "23514") {
		return { status: 400, message: "Invalid registration data" };
	}
	return null;
}

async function resolveGoogleProfileUser(token) {
	if (!token) return null;
	let decoded;
	try {
		decoded = jwt.verify(token, JWT_SECRET);
	} catch {
		const err = new Error("Invalid or expired Google profile session");
		err.status = 400;
		throw err;
	}
	if (decoded.purpose !== "google_profile" || !decoded.userId) {
		const err = new Error("Invalid Google profile session");
		err.status = 400;
		throw err;
	}
	const result = await pool.query("SELECT * FROM users WHERE user_id = $1", [
		decoded.userId,
	]);
	const user = result.rows[0];
	if (!user || user.provider_type !== "google") {
		const err = new Error("Google account not found");
		err.status = 404;
		throw err;
	}
	return user;
}

// ========================
// REGISTER
// ========================
exports.register = async (req, res) => {
	if (!req.body || typeof req.body !== "object") {
		req.body = {};
	}

	if (typeof req.body.data === "string" && req.body.data.trim() !== "") {
		try {
			req.body = JSON.parse(req.body.data);
		} catch (parseErr) {
			return res.status(400).json({ error: "Invalid JSON in form-data field 'data'" });
		}
	}

	const {
		first_name,
		last_name,
		email,
		password,
		confirm_password,
		role,
		phone_number,
		founder_full_name,
		startup_name,
		industry,
		startup_tagline,
		business_stage,
		startup_type,
		founded_year,
		region,
		city,
		team_size,
		founder_role,
		website,
		investor_type,
		investment_stage,
		startup_stage,
		investment_range,
		investment_range_min,
		preferred_industry,
		location_preference,
		linked_in_or_website,
		bio,
		personal_verification,
		professional_title,
		year_of_experience,
		years_experience,
		language,
		languages,
		expertise_area,
		professional_bio,
		linkedin_portfolio,
		availability_preference,
		session_pricing,
		session_pricing_min,
		current_organization,
		current_title,
		primary_industry,
		secondary_industry,
		city_location,
		mentor_platform,
		session_frequency,
		required_time_slots,
		mentoring_style,
		notable_startups_mentored,
		key_achievement,
		google_profile_token,
		registration_email_verification_id,
	} = req.body;

	// Investor form may send camelCase or an array of industries; normalize for DB + validation.
	const preferredIndustryResolved = (() => {
		const v =
			preferred_industry ??
			req.body.preferredIndustry ??
			req.body.preferred_industries ??
			req.body.preferredIndustries;
		if (v == null || v === "") return null;
		if (Array.isArray(v)) {
			return v.map((x) => String(x).trim()).filter(Boolean).join(", ") || null;
		}
		const s = String(v).trim();
		return s || null;
	})();

	const allowedRoles = ["Startup", "Investor", "Mentor"];
	let mentorResolved = null;

	try {
		const googleProfileUser = await resolveGoogleProfileUser(
			google_profile_token || req.body.googleProfileToken,
		);
		const isGoogleProfileCompletion = Boolean(googleProfileUser);
		const normalizedRole = String(role || googleProfileUser?.role || "").trim();
		const effectiveFirstName = first_name || googleProfileUser?.first_name;
		const effectiveLastName = last_name || googleProfileUser?.last_name;
		const effectiveEmail = email || googleProfileUser?.email;

		// Basic validation
		if (
			!effectiveFirstName ||
			!effectiveLastName ||
			!effectiveEmail ||
			!role ||
			(!isGoogleProfileCompletion && (!password || !confirm_password))
		) {
			return res.status(400).json({
				message:
					"first_name, last_name, email, password, confirm_password and role are required",
			});
		}

		if (!isGoogleProfileCompletion && password !== confirm_password) {
			return res.status(400).json({ message: "Password and confirm password must match" });
		}

		if (!isGoogleProfileCompletion && !hasStrongPassword(password)) {
			return res.status(400).json({
				message:
					"Password must be at least 8 characters and include 1 capital letter, 1 special character, and 1 number",
			});
		}

		if (normalizedRole === "Admin") {
			return res.status(403).json({
				message: "Admin accounts cannot be registered. Use admin login instead.",
			});
		}
		if (!allowedRoles.includes(normalizedRole)) {
			return res.status(400).json({
				message: "Role must be one of Startup, Investor, or Mentor",
			});
		}

		const platformConfig = await getPlatformConfig();
		if (!isGoogleProfileCompletion && platformConfig.userRegistration === false) {
			return res.status(403).json({
				message: "New user registration is currently disabled by the platform administrator",
			});
		}
		if (isGoogleProfileCompletion && googleProfileUser.role !== normalizedRole) {
			return res.status(400).json({
				message: "Selected role does not match this Google signup session",
			});
		}

		// Startup-specific validation
		if (normalizedRole === "Startup") {
			if (
				(!isGoogleProfileCompletion && !phone_number) ||
				!founder_full_name ||
				!startup_name ||
				!industry ||
				!startup_tagline ||
				!business_stage ||
				!startup_type ||
				!founded_year ||
				!region ||
				!city ||
				(team_size === undefined || team_size === null || team_size === "") ||
				!founder_role
			) {
				return res.status(400).json({
					message:
						"Startup registration requires founder_full_name, phone_number, startup_name, industry, startup_tagline, business_stage, startup_type, founded_year, region, city, team_size, and founder_role",
				});
			}

			if (!req.files || !req.files.founder_id || !req.files.founder_id.length) {
				return res.status(400).json({
					message: "Founder or representative ID file is required for Startup registration",
				});
			}

			if (
				!req.files ||
				!req.files.business_registration_proof ||
				!req.files.business_registration_proof.length
			) {
				return res.status(400).json({
					message: "Business registration proof file is required for Startup registration",
				});
			}

			if (!req.files || !req.files.startup_logo || !req.files.startup_logo.length) {
				return res.status(400).json({
					message: "Startup logo is required for Startup registration",
				});
			}
		}

		// Investor-specific validation
		if (normalizedRole === "Investor") {
			const chosenInvestmentStage = investment_stage || startup_stage;
			if (
				(!isGoogleProfileCompletion && !phone_number) ||
				!investor_type ||
				!preferredIndustryResolved ||
				!chosenInvestmentStage ||
				!investment_range ||
				!location_preference ||
				!linked_in_or_website ||
				!bio ||
				!personal_verification
			) {
				return res.status(400).json({
					message:
						"Investor registration requires investor_type, preferred_industry, investment_stage, investment_range, location_preference, linked_in_or_website, bio, and personal_verification",
				});
			}

			if (!isValidUrl(linked_in_or_website)) {
				return res.status(400).json({
					message: "linked_in_or_website must be a valid URL starting with http:// or https://",
				});
			}

			if (!req.files || !req.files.registration_doc || !req.files.registration_doc.length) {
				return res.status(400).json({
					message: "Registration document file is required for Investor registration",
				});
			}

			if (!req.files || !req.files.trade_license || !req.files.trade_license.length) {
				return res.status(400).json({
					message: "Trade license file is required for Investor registration",
				});
			}

			if (!req.files || !req.files.tin_certificate || !req.files.tin_certificate.length) {
				return res.status(400).json({
					message: "TIN certificate file is required for Investor registration",
				});
			}

			if (!req.files || !req.files.profile_picture || !req.files.profile_picture.length) {
				return res.status(400).json({
					message: "Profile picture is required for Investor registration",
				});
			}
		}

		if (normalizedRole === "Mentor") {
			const str = (v) => (v == null ? "" : String(v).trim());
			const mentorTitle =
				str(professional_title) ||
				str(req.body.professionalTitle) ||
				"";
			const mentorYearsRaw =
				year_of_experience ?? years_experience ?? req.body.yearOfExperience ?? req.body.yearsOfExperience;
			const rawLang =
				language ?? languages ?? req.body.language ?? req.body.languages;
			const mentorLanguages = str(rawLang);
			const mentorExpertise = str(expertise_area) || str(req.body.expertiseArea) || "";
			const mentorBio = str(professional_bio) || str(req.body.professionalBio) || "";
			const mentorLinkedin =
				str(linkedin_portfolio) ||
				str(req.body.linkedinPortfolio) ||
				str(req.body.linkedInOrPortfolio) ||
				"";
			if (mentorLinkedin && !isValidUrl(mentorLinkedin)) {
				return res.status(400).json({
					message: "linkedin_portfolio must be a valid URL starting with http:// or https://",
				});
			}
			const mentorAvailPref =
				str(availability_preference) || str(req.body.availabilityPreference) || "";
			const mentorSessionPrice = session_pricing ?? req.body.sessionPricing;
			const mentorSessionPriceMin = session_pricing_min ?? req.body.sessionPricingMin ?? 0;
			const mentorOrg = str(current_organization) || str(req.body.currentOrganization) || "";
			const mentorJobTitle = str(current_title) || str(req.body.currentTitle) || "";
			const mentorPrimaryInd = str(primary_industry) || str(req.body.primaryIndustry) || "";
			const mentorSecondaryRaw =
				str(secondary_industry) || str(req.body.secondaryIndustry) || "";
			const mentorSecondaryInd = mentorSecondaryRaw || null;
			const mentorCity =
				str(city_location) || str(req.body.cityLocation) || str(req.body.city) || "";
			const mentorPlatform = str(mentor_platform) || str(req.body.mentorPlatform) || "";
			const mentorSessionFreq = str(session_frequency) || str(req.body.sessionFrequency) || "";
			const mentorTimeSlots = required_time_slots ?? req.body.requiredTimeSlots;
			const mentorStyle = str(mentoring_style) || str(req.body.mentoringStyle) || "";
			const mentorNotable =
				str(notable_startups_mentored) || str(req.body.notableStartupsMentored) || "";
			const mentorKeyAch = str(key_achievement) || str(req.body.keyAchievement) || "";

			if (
				(!isGoogleProfileCompletion && !phone_number) ||
				!mentorTitle ||
				mentorYearsRaw === undefined ||
				mentorYearsRaw === null ||
				mentorYearsRaw === "" ||
				!mentorLanguages ||
				!mentorExpertise ||
				!mentorBio ||
				!mentorLinkedin ||
				!mentorAvailPref ||
				mentorSessionPrice === undefined ||
				mentorSessionPrice === null ||
				mentorSessionPrice === "" ||
				!mentorOrg ||
				!mentorJobTitle ||
				!mentorPrimaryInd ||
				!mentorCity ||
				!mentorPlatform ||
				!mentorSessionFreq ||
				mentorTimeSlots === undefined ||
				mentorTimeSlots === null ||
				(typeof mentorTimeSlots === "string" && mentorTimeSlots.trim() === "") ||
				!mentorStyle ||
				!mentorNotable ||
				!mentorKeyAch
			) {
				return res.status(400).json({
					message:
						"Mentor registration requires phone_number, professional_title, year_of_experience, language(s), expertise_area, professional_bio, linkedin_portfolio, availability_preference, session_pricing, current_organization, current_title, primary_industry, city_location, mentor_platform, session_frequency, required_time_slots, mentoring_style, notable_startups_mentored, and key_achievement",
				});
			}

			const parsedMentorYears = Number(mentorYearsRaw);
			if (!Number.isInteger(parsedMentorYears) || parsedMentorYears < 0) {
				return res.status(400).json({
					message: "year_of_experience must be a non-negative integer",
				});
			}

			const parsedSessionPricing = Number(mentorSessionPrice);
			const parsedSessionPricingMin = Number(mentorSessionPriceMin);
			if (Number.isNaN(parsedSessionPricing) || parsedSessionPricing < 0) {
				return res.status(400).json({
					message: "session_pricing must be a valid non-negative number",
				});
			}
			if (
				Number.isNaN(parsedSessionPricingMin) ||
				parsedSessionPricingMin < 0 ||
				parsedSessionPricingMin > parsedSessionPricing
			) {
				return res.status(400).json({
					message: "session_pricing_min must be a valid number no greater than session_pricing",
				});
			}

			// Store as TEXT (same pattern as other text fields; avoids Postgres json/jsonb cast errors from multipart).
			let requiredTimeSlotsDb = "";
			if (typeof mentorTimeSlots === "string") {
				const t = mentorTimeSlots.trim();
				if (t) {
					try {
						const parsed = JSON.parse(t);
						requiredTimeSlotsDb = JSON.stringify(parsed);
					} catch {
						requiredTimeSlotsDb = t;
					}
				}
			} else if (mentorTimeSlots != null && typeof mentorTimeSlots === "object") {
				requiredTimeSlotsDb = JSON.stringify(mentorTimeSlots);
			}

			const slotsBad =
				!requiredTimeSlotsDb.trim() ||
				requiredTimeSlotsDb.trim() === "[]" ||
				requiredTimeSlotsDb.trim() === "{}";
			if (slotsBad) {
				return res.status(400).json({
					message:
						"required_time_slots is required: use plain text (e.g. Mon/Wed 6–8pm) or valid JSON array/object as a string",
				});
			}

			if (!req.files || !req.files.profile_picture || !req.files.profile_picture.length) {
				return res.status(400).json({
					message: "Profile picture is required for Mentor registration",
				});
			}

			mentorResolved = {
				professionalTitle: mentorTitle,
				yearsExperience: parsedMentorYears,
				languagesStr: mentorLanguages,
				expertiseArea: mentorExpertise,
				professionalBio: mentorBio,
				linkedinOrPortfolio: mentorLinkedin,
				certificationCredentials: "",
				availabilityPreference: mentorAvailPref,
				sessionPricing: parsedSessionPricing,
				sessionPricingMin: parsedSessionPricingMin,
				currentOrganization: mentorOrg,
				currentTitle: mentorJobTitle,
				primaryIndustry: mentorPrimaryInd,
				secondaryIndustry: mentorSecondaryInd,
				cityLocation: mentorCity,
				mentorPlatform: mentorPlatform,
				sessionFrequency: mentorSessionFreq,
				requiredTimeSlotsDb,
				mentoringStyle: mentorStyle,
				notableStartupsMentored: mentorNotable,
				keyAchievement: mentorKeyAch,
			};
		}

		const normalizedEmail = String(effectiveEmail).trim().toLowerCase();
		const phoneForDb = normalizePhone(phone_number);

		if (!isGoogleProfileCompletion) {
			if (!registration_email_verification_id) {
				return res.status(400).json({
					message: "Verify your email on the first registration step before submitting your account",
					code: "REGISTRATION_EMAIL_NOT_VERIFIED",
				});
			}
			let emailCheck;
			try {
				emailCheck = await authSecurity.validateEmailDeliverability(normalizedEmail);
			} catch (validationErr) {
				console.error("Email validation error:", validationErr.message);
				return res.status(400).json({
					message: authSecurity.emailRejectMessage("validation_error"),
				});
			}
			if (!emailCheck.ok) {
				return res.status(400).json({
					message: authSecurity.emailRejectMessage(emailCheck.reason),
					code: emailCheck.reason,
				});
			}
		}

		// Check if user already exists
		const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [
			normalizedEmail,
		]);

		if (
			existingUser.rows.length > 0 &&
			(!isGoogleProfileCompletion ||
				Number(existingUser.rows[0].user_id) !== Number(googleProfileUser.user_id))
		) {
			return res.status(409).json({ message: "An account with this email already exists" });
		}

		if (phoneForDb) {
			const existingPhone = await pool.query(
				"SELECT user_id FROM users WHERE phone_number = $1",
				[phoneForDb],
			);
			if (
				existingPhone.rows.length > 0 &&
				(!isGoogleProfileCompletion ||
					Number(existingPhone.rows[0].user_id) !== Number(googleProfileUser.user_id))
			) {
				return res.status(409).json({ message: "This phone number is already registered" });
			}
		}

		const client = await pool.connect();
		try {
			await client.query("BEGIN");

			let user;
			if (isGoogleProfileCompletion) {
				const userUpdateResult = await client.query(
					`UPDATE users
					 SET first_name = $1,
					     last_name = $2,
					     phone_number = COALESCE($3, phone_number),
					     role = $4,
					     provider_type = 'google',
					     email_verified = true,
					     updated_at = CURRENT_TIMESTAMP
					 WHERE user_id = $5
					 RETURNING user_id, first_name, last_name, email, role, is_approved, email_verified`,
					[
						effectiveFirstName,
						effectiveLastName,
						phoneForDb,
						normalizedRole,
						googleProfileUser.user_id,
					],
				);
				user = userUpdateResult.rows[0];
			} else {
				const emailVerificationConsumed =
					await authSecurity.consumeRegistrationEmailVerification(
						client,
						registration_email_verification_id,
						normalizedEmail,
					);
				if (!emailVerificationConsumed) {
					await client.query("ROLLBACK");
					return res.status(400).json({
						message: "Your registration email verification is missing or expired. Return to the first step and verify your email again.",
						code: "REGISTRATION_EMAIL_NOT_VERIFIED",
					});
				}

				// Hash password
				const hashedPassword = await bcrypt.hash(password, 10);

				const userInsertResult = await client.query(
					`INSERT INTO users (first_name, last_name, email, password_hash, role, phone_number, provider_type, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, 'local', true)
         RETURNING user_id, first_name, last_name, email, role, is_approved, email_verified`,
					[
						effectiveFirstName,
						effectiveLastName,
						normalizedEmail,
						hashedPassword,
						normalizedRole,
						phoneForDb,
					],
				);
				user = userInsertResult.rows[0];
			}

			let startupProfile = null;
			let investorProfile = null;
			let mentorProfile = null;

		const saveDoc = async (entityType, entityId, file, documentType) => {
			if (!file) return null;
			const fileBuffer = file.buffer;
			const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
			const storagePath = `db://documents/${entityType}/${entityId}/${crypto.randomBytes(16).toString("hex")}`;
			const fkColumn =
				entityType === "startup"
					? "startup_id"
					: entityType === "investor"
						? "investor_id"
						: entityType === "mentor"
							? "mentor_id"
							: null;
			if (!fkColumn) {
				throw new Error(`Unsupported document owner type: ${entityType}`);
			}
			const result = await client.query(
				`INSERT INTO documents (${fkColumn}, file_name, file_path, file_type, file_size_bytes, file_hash, file_data, description, created_at)
              VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP)
              RETURNING document_id`,
				[
					entityId,
					file.originalname,
					storagePath,
					file.mimetype,
					file.size,
					fileHash,
					fileBuffer,
					documentType,
				],
			);
			return {
				document_id: result.rows[0].document_id,
				document_type: documentType,
				file_name: file.originalname,
				file_path: storagePath,
				file_type: file.mimetype,
				file_size_bytes: file.size,
				file_hash: fileHash,
				created_at: new Date().toISOString(),
			};
		};

			if (normalizedRole === "Startup") {
				const parsedFoundedYear = Number(founded_year);
				const parsedTeamSize = Number(team_size);

				if (!Number.isInteger(parsedFoundedYear) || parsedFoundedYear < 1900 || parsedFoundedYear > 2100) {
					throw new Error("founded_year must be an integer between 1900 and 2100");
				}

				if (!Number.isInteger(parsedTeamSize) || parsedTeamSize < 0) {
					throw new Error("team_size must be a non-negative integer");
				}

				const uploadedDocs = [];

				const startupInsertResult = await client.query(
					`INSERT INTO startups (
            user_id,
            founder_full_name,
            startup_name,
            industry,
            startup_tagline,
            business_stage,
            startup_type,
            founded_year,
            region,
            city,
            team_size,
            founder_role,
            location,
            website,
            uploaded_documents
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
          RETURNING *`,
				[
					user.user_id,
					founder_full_name,
					startup_name,
					industry,
					startup_tagline,
					business_stage,
					startup_type,
					(parsedFoundedYear),
					region,
					city,
					parsedTeamSize,
					founder_role,
					`${region}, ${city}`,
					website || null,
					null,
				],
				);

				startupProfile = startupInsertResult.rows[0];

				const autoApproveStartup = platformConfig.strictVerification !== true;
				await client.query(
					`UPDATE startups
					 SET is_listed = $2, admin_status = $3
					 WHERE startup_id = $1`,
					[startupProfile.startup_id, autoApproveStartup, autoApproveStartup ? "Active" : "Pending"],
				);
				startupProfile.is_listed = autoApproveStartup;
				startupProfile.admin_status = autoApproveStartup ? "Active" : "Pending";

				if (req.files.startup_logo && req.files.startup_logo.length) {
					uploadedDocs.push(
						await saveDoc("startup", startupProfile.startup_id, req.files.startup_logo[0], "Company logo"),
					);
				}
				uploadedDocs.push(
					await saveDoc("startup", startupProfile.startup_id, req.files.founder_id[0], "Founder or representative ID"),
				);
				uploadedDocs.push(
					await saveDoc(
						"startup",
						startupProfile.startup_id,
						req.files.business_registration_proof[0],
						"Business registration proof",
					),
				);
				if (req.files.support_affiliation_letter && req.files.support_affiliation_letter.length) {
					uploadedDocs.push(
						await saveDoc(
							"startup",
							startupProfile.startup_id,
							req.files.support_affiliation_letter[0],
							"Support or affiliation letter",
						),
					);
				}
				if (req.files.tin_certificate && req.files.tin_certificate.length) {
					uploadedDocs.push(
						await saveDoc("startup", startupProfile.startup_id, req.files.tin_certificate[0], "TIN certificate"),
					);
				}

				if (uploadedDocs.length) {
					await client.query(
						"UPDATE startups SET uploaded_documents = $1 WHERE startup_id = $2",
						[JSON.stringify(uploadedDocs), startupProfile.startup_id],
					);
					startupProfile.uploaded_documents = uploadedDocs;
				}
			}

			if (normalizedRole === "Investor") {
				await client.query(
					"ALTER TABLE investors ADD COLUMN IF NOT EXISTS investment_budget_min DECIMAL(14,2) CHECK (investment_budget_min IS NULL OR investment_budget_min >= 0)",
				);
				const chosenInvestmentStage = investment_stage || startup_stage;
				const parsedInvestmentRange = Number(investment_range);
				const parsedInvestmentRangeMin = Number(investment_range_min || 0);
				if (Number.isNaN(parsedInvestmentRange) || parsedInvestmentRange < 0) {
					throw new Error("investment_range must be a valid non-negative number");
				}
				if (
					Number.isNaN(parsedInvestmentRangeMin) ||
					parsedInvestmentRangeMin < 0 ||
					parsedInvestmentRangeMin > parsedInvestmentRange
				) {
					throw new Error("investment_range_min must be no greater than investment_range");
				}

				const uploadedDocs = [];
				const investorInsertResult = await client.query(
					`INSERT INTO investors (
            user_id,
            investor_type,
            preferred_industry,
            investment_stage,
            investment_budget,
            investment_budget_min,
            location_preference,
            linked_in_or_website,
            bio,
            personal_verification,
            uploaded_documents
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
          RETURNING *`,
				[
					user.user_id,
					investor_type,
					preferredIndustryResolved,
					chosenInvestmentStage,
					parsedInvestmentRange,
					parsedInvestmentRangeMin,
					location_preference,
					linked_in_or_website,
					bio,
					personal_verification,
					null,
				],
				);

				investorProfile = investorInsertResult.rows[0];

				uploadedDocs.push(await saveDoc("investor", investorProfile.investor_id, req.files.profile_picture[0], "Profile picture"));
				uploadedDocs.push(await saveDoc("investor", investorProfile.investor_id, req.files.registration_doc[0], "Registration document"));
				uploadedDocs.push(await saveDoc("investor", investorProfile.investor_id, req.files.trade_license[0], "Trade license"));
				uploadedDocs.push(await saveDoc("investor", investorProfile.investor_id, req.files.tin_certificate[0], "TIN certificate"));

				const savedInvestorDocs = uploadedDocs.filter(Boolean);
				if (savedInvestorDocs.length) {
					await client.query(
						"UPDATE investors SET uploaded_documents = $1 WHERE investor_id = $2",
						[JSON.stringify(savedInvestorDocs), investorProfile.investor_id],
					);
					investorProfile.uploaded_documents = savedInvestorDocs;
				}
			}

			if (normalizedRole === "Mentor" && mentorResolved) {
				await client.query(
					"ALTER TABLE mentors ADD COLUMN IF NOT EXISTS session_pricing_min DECIMAL(10,2) CHECK (session_pricing_min IS NULL OR session_pricing_min >= 0)",
				);
				const m = mentorResolved;
				const mentorInsertResult = await client.query(
					`INSERT INTO mentors (
            user_id,
            headline,
            expertise,
            years_experience,
            hourly_rate,
            country,
            bio,
            availability,
            professional_title,
            languages,
            linkedin_or_portfolio,
            certification_credentials,
            availability_preference,
            session_pricing,
            session_pricing_min,
            current_organization,
            current_title,
            primary_industry,
            secondary_industry,
            city_location,
            mentor_platform,
            session_frequency,
            required_time_slots,
            mentoring_style,
            notable_startups_mentored,
            key_achievement,
            uploaded_documents
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27
          )
          RETURNING *`,
					[
						user.user_id,
						m.professionalTitle,
						m.expertiseArea,
						m.yearsExperience,
						m.sessionPricing,
						null,
						m.professionalBio,
						null,
						m.professionalTitle,
						m.languagesStr,
						m.linkedinOrPortfolio,
						m.certificationCredentials,
						m.availabilityPreference,
						m.sessionPricing,
						m.sessionPricingMin,
						m.currentOrganization,
						m.currentTitle,
						m.primaryIndustry,
						m.secondaryIndustry,
						m.cityLocation,
						m.mentorPlatform,
						m.sessionFrequency,
						m.requiredTimeSlotsDb,
						m.mentoringStyle,
						m.notableStartupsMentored,
						m.keyAchievement,
						null,
					],
				);

				mentorProfile = mentorInsertResult.rows[0];

				await client.query(
					"UPDATE mentors SET is_approved = true WHERE mentor_id = $1",
					[mentorProfile.mentor_id],
				);
				mentorProfile.is_approved = true;

				const mentorDocMeta = [];
				mentorDocMeta.push(
					await saveDoc("mentor", mentorProfile.mentor_id, req.files.profile_picture[0], "Profile picture"),
				);
				if (req.files && req.files.mentor_id && req.files.mentor_id.length) {
					mentorDocMeta.push(
						await saveDoc("mentor", mentorProfile.mentor_id, req.files.mentor_id[0], "Government-issued ID"),
					);
				}
				if (req.files && req.files.intro_video && req.files.intro_video.length) {
					mentorDocMeta.push(
						await saveDoc("mentor", mentorProfile.mentor_id, req.files.intro_video[0], "Introduction video"),
					);
				}
				if (req.files && req.files.certifications && req.files.certifications.length) {
					for (const certFile of req.files.certifications) {
						mentorDocMeta.push(
							await saveDoc(
								"mentor",
								mentorProfile.mentor_id,
								certFile,
								"Certification or credential file",
							),
						);
					}
				}

				const savedMentorDocs = mentorDocMeta.filter(Boolean);
				if (savedMentorDocs.length) {
					await client.query(
						"UPDATE mentors SET uploaded_documents = $1 WHERE mentor_id = $2",
						[JSON.stringify(savedMentorDocs), mentorProfile.mentor_id],
					);
					mentorProfile.uploaded_documents = savedMentorDocs;
				}
			}

			// Get all admins and notify them
			const adminsRes = await client.query("SELECT user_id FROM users WHERE role = 'Admin'");
			const admins = adminsRes.rows;

			for (const admin of admins) {
				if (platformConfig.notifNewUsers !== false) {
					await client.query(
						`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
						 VALUES ($1, 'registration', $2, $3, 'user', $4)`,
						[
							admin.user_id,
							`New ${normalizedRole} Registered`,
							`A new ${normalizedRole} account for ${effectiveFirstName} ${effectiveLastName} (${normalizedEmail}) has registered and is pending approval.`,
							user.user_id,
						],
					);
				}

				if (platformConfig.notifVerification !== false) {
					await client.query(
						`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
						 VALUES ($1, 'verification', $2, $3, 'user', $4)`,
						[
							admin.user_id,
							`Verification Request: ${effectiveFirstName} ${effectiveLastName}`,
							`${effectiveFirstName} ${effectiveLastName} (${normalizedRole}) has submitted documents for verification.`,
							user.user_id,
						],
					);
				}
			}

			await client.query("COMMIT");

			const regMessage = `${normalizedRole} user registered successfully. Your email is verified and your account is pending admin approval.`;
			return res.status(201).json({
				message: regMessage,
				user,
				startup: startupProfile,
				investor: investorProfile,
				mentor: mentorProfile,
			});
		} catch (err) {
			await client.query("ROLLBACK");
			if (err.message.includes("founded_year")) {
				return res.status(400).json({ message: err.message });
			}
			const mapped = mapRegistrationDbError(err);
			if (mapped) {
				return res.status(mapped.status).json({ message: mapped.message });
			}
			console.error("Register transaction error:", err.message);
			return res.status(500).json({ message: "Registration failed. Please try again." });
		} finally {
			client.release();
		}
	} catch (err) {
		if (err.status) {
			return res.status(err.status).json({ message: err.message });
		}
		const mapped = mapRegistrationDbError(err);
		if (mapped) {
			return res.status(mapped.status).json({ message: mapped.message });
		}
		console.error("Register error:", err.message);
		return res.status(500).json({ message: "Registration failed. Please try again." });
	}
};

// ========================
// LOGIN
// ========================
exports.login = async (req, res) => {
	const { email, password } = req.body;

	try {
		const ip_address = securityMonitoringService.readIpAddress(req);
		const user_agent = req.headers["user-agent"] || "";
		const normalizedEmail = String(email || "")
			.trim()
			.toLowerCase();

		// Find user
		const result = await pool.query("SELECT * FROM users WHERE email = $1", [
			normalizedEmail,
		]);

		if (result.rows.length === 0) {
			await securityMonitoringService.logLoginAttempt({
				email,
				userId: null,
				success: false,
				failureReason: "user_not_found",
				ipAddress: ip_address,
				userAgent: user_agent,
			});
			await securityMonitoringService.detectAndRecordBruteForce({
				email,
				ipAddress: ip_address,
			});
			return res.status(404).json({ message: "User not found" });
		}

		const user = result.rows[0];

		if (!user.password_hash) {
			return res.status(400).json({
				message: "This account uses Google Sign-In. Continue with Google instead.",
				code: "USE_GOOGLE_LOGIN",
			});
		}

		// Check password
		const isMatch = await bcrypt.compare(password, user.password_hash);

		if (!isMatch) {
			await securityMonitoringService.logLoginAttempt({
				email,
				userId: user.user_id,
				success: false,
				failureReason: "invalid_password",
				ipAddress: ip_address,
				userAgent: user_agent,
			});
			await securityMonitoringService.detectAndRecordBruteForce({
				email,
				ipAddress: ip_address,
			});
			return res.status(401).json({ message: "Invalid password" });
		}

		if (!user.is_active) {
			await securityMonitoringService.logLoginAttempt({
				email,
				userId: user.user_id,
				success: false,
				failureReason: "account_disabled",
				ipAddress: ip_address,
				userAgent: user_agent,
			});
			return res.status(403).json({ message: "Account disabled" });
		}

		// NOTE: allow login even if not yet admin-approved so user can continue profile creation
		// Approval gating is enforced by `requireApproval` middleware on protected routes.

		if (user.two_factor_enabled) {
			return authSecurityController.finishLoginOr2FA(
				req,
				res,
				user,
				normalizedEmail,
				ip_address,
				user_agent,
			);
		}

		return authSecurityController.finishLoginOr2FA(
			req,
			res,
			user,
			normalizedEmail,
			ip_address,
			user_agent,
		);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// POST /auth/refresh
exports.refresh = async (req, res) => {
	const { refreshToken } = req.body;
	if (!refreshToken)
		return res.status(400).json({ message: "refreshToken required" });

	try {
		const result = await pool.query(
			"SELECT * FROM refresh_tokens WHERE token = $1",
			[refreshToken],
		);
		if (result.rows.length === 0)
			return res.status(401).json({ message: "Invalid refresh token" });

		const row = result.rows[0];
		if (row.revoked)
			return res.status(401).json({ message: "Refresh token revoked" });
		if (new Date(row.expires_at) < new Date())
			return res.status(401).json({ message: "Refresh token expired" });

		const userRes = await pool.query(
			"SELECT user_id, role, is_active, is_approved FROM users WHERE user_id=$1",
			[row.user_id],
		);
		if (userRes.rows.length === 0)
			return res.status(404).json({ message: "User not found" });
		const user = userRes.rows[0];
		if (!user.is_active)
			return res.status(403).json({ message: "Account disabled" });
		// allow refresh for unapproved users so they can continue profile creation;
		// requireApproval middleware still protects important endpoints.

		const token = jwt.sign(
			{ user_id: user.user_id, role: user.role },
			JWT_SECRET,
			{ expiresIn: "1d" },
		);
		return res.json({ token });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// POST /auth/logout
exports.logout = async (req, res) => {
	const { refreshToken } = req.body;
	if (!refreshToken)
		return res.status(400).json({ message: "refreshToken required" });

	try {
		await pool.query(
			"UPDATE refresh_tokens SET revoked = true WHERE token = $1",
			[refreshToken],
		);
		return res.json({ message: "Logged out" });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// PUT /auth/admin/change-password (Admin only)
// Change password for the authenticated admin and send verification email
const mail = require("../utils/mail");
exports.changeAdminPassword = async (req, res) => {
	const { user_id } = req.user;
	const { currentPassword, newPassword } = req.body;

	try {
		if (!currentPassword || !newPassword) {
			return res.status(400).json({ message: "Current and new password are required" });
		}

		// Validate strong password: 8+ chars, uppercase, lowercase, number, special char
		const hasUppercase = /[A-Z]/.test(newPassword);
		const hasLowercase = /[a-z]/.test(newPassword);
		const hasNumber = /\d/.test(newPassword);
		const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\\|,.<>\/?]/.test(newPassword);
		const hasLength = newPassword.length >= 8;

		if (!hasLength) {
			return res.status(400).json({ message: "Password must be at least 8 characters" });
		}
		if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
			return res.status(400).json({ message: "Password must contain uppercase, lowercase, number, and special character" });
		}

		// Fetch current user
		const userRes = await pool.query(
			"SELECT user_id, email, password_hash, first_name FROM users WHERE user_id = $1",
			[user_id],
		);

		if (userRes.rows.length === 0) {
			return res.status(404).json({ message: "Admin user not found" });
		}

		const admin = userRes.rows[0];

		// Verify current password
		const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
		if (!isMatch) {
			return res.status(401).json({ message: "Current password is incorrect" });
		}

		// Hash new password
		const newHashedPassword = await bcrypt.hash(newPassword, 10);

		// Update password in database
		await pool.query(
			"UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2",
			[newHashedPassword, user_id],
		);

		// Send verification email
		const emailSubject = "Password Changed — Startup Connect Admin";
		const emailText = `Hello ${admin.first_name},\n\nYour admin account password has been successfully changed. If you did not make this change, please contact support immediately.\n\nFor security, this change was made at ${new Date().toLocaleString()}.`;
		const emailHtml = `
			<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
				<div style="background: linear-gradient(135deg, #0f3d32 0%, #1a5a4a 100%); color: white; padding: 32px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
					<h1 style="margin: 0; font-size: 24px; font-weight: bold;">Password Changed</h1>
				</div>
				<div style="background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
					<p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">Hello <strong>${admin.first_name}</strong>,</p>
					<p style="margin: 0 0 16px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">Your admin account password has been successfully changed. If you did not make this change, please contact support immediately.</p>
					<div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
						<p style="margin: 0; color: #6b7280; font-size: 13px;"><strong>Change Time:</strong> ${new Date().toLocaleString()}</p>
					</div>
					<p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 12px;">This is an automated security notification. Please do not reply to this email.</p>
				</div>
			</div>
		`;

		try {
			await mail.sendMail(admin.email, emailSubject, emailText, emailHtml);
		} catch (emailErr) {
			console.error("Failed to send password change email:", emailErr.message);
			// Still return success since password was changed, but log the email error
		}

		return res.json({ message: "Password changed successfully. Verification email sent." });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// PUT /auth/approve/:userId  (Admin only)
// Delegate to adminController.approveUser to avoid duplicate logic
const adminController = require("./adminController");
exports.approveUser = async (req, res) => {
	return adminController.approveUser(req, res);
};

// GET /api/auth/sessions (Authenticated)
exports.getActiveSessions = async (req, res) => {
	const { user_id } = req.user;
	try {
		const r = await pool.query(
			`SELECT token, device, ip_address, location, created_at, expires_at
			 FROM refresh_tokens
			 WHERE user_id = $1 AND revoked = false AND expires_at > NOW()
			 ORDER BY created_at DESC`,
			[user_id]
		);
		return res.json({ sessions: r.rows });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// DELETE /api/auth/sessions/:token (Authenticated)
exports.revokeSession = async (req, res) => {
	const { user_id } = req.user;
	const { token } = req.params;
	try {
		const r = await pool.query(
			"UPDATE refresh_tokens SET revoked = true WHERE token = $1 AND user_id = $2 RETURNING token",
			[token, user_id]
		);
		if (r.rows.length === 0) {
			return res.status(404).json({ message: "Session not found or already revoked" });
		}
		return res.json({ message: "Session revoked successfully" });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// DELETE /api/auth/sessions (Authenticated)
exports.revokeAllOtherSessions = async (req, res) => {
	const { user_id } = req.user;
	const { currentToken } = req.body;
	try {
		if (currentToken) {
			await pool.query(
				"UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND token <> $2 AND revoked = false",
				[user_id, currentToken]
			);
		} else {
			await pool.query(
				"UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND revoked = false",
				[user_id]
			);
		}
		return res.json({ message: "All other sessions revoked successfully" });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

const PROFILE_PICTURE_OWNERS = {
	Startup: { table: "startups", id: "startup_id", description: "Company logo" },
	Investor: { table: "investors", id: "investor_id", description: "Profile picture" },
	Mentor: { table: "mentors", id: "mentor_id", description: "Profile picture" },
};

function profilePictureDescriptionClause(role) {
	return role === "Startup"
		? `(LOWER(COALESCE(d.description, '')) LIKE '%company logo%'
		    OR (LOWER(COALESCE(d.description, '')) LIKE '%logo%'
		        AND LOWER(COALESCE(d.description, '')) NOT LIKE '%profile%'))`
		: `(LOWER(COALESCE(d.description, '')) LIKE '%profile picture%'
		    OR LOWER(COALESCE(d.description, '')) LIKE '%profile photo%'
		    OR LOWER(COALESCE(d.description, '')) LIKE '%avatar%')`;
}

async function sendProfilePicture(res, owner, ownerValue, ownerColumn, role, cacheControl) {
	const result = await pool.query(
		`SELECT d.file_name, d.file_type, d.file_data
		 FROM documents d
		 JOIN ${owner.table} p ON p.${owner.id} = d.${owner.id}
		 WHERE p.${ownerColumn} = $1
		   AND ${profilePictureDescriptionClause(role)}
		 ORDER BY d.created_at DESC
		 LIMIT 1`,
		[ownerValue],
	);
	const picture = result.rows[0];
	if (!picture?.file_data) {
		return res.status(404).json({ message: "Profile picture not found" });
	}
	const safeName = String(picture.file_name || "profile-picture").replace(/[^\w.\- ()]/g, "_");
	res.setHeader("Content-Type", picture.file_type || "application/octet-stream");
	res.setHeader("Content-Disposition", `inline; filename="${safeName}"`);
	res.setHeader("Cache-Control", cacheControl);
	return res.send(picture.file_data);
}

// GET /api/auth/profile-picture (Authenticated)
exports.getProfilePicture = async (req, res) => {
	const { user_id: userId, role } = req.user;
	const owner = PROFILE_PICTURE_OWNERS[role];
	if (!owner) return res.status(404).json({ message: "Profile picture not found" });

	try {
		return await sendProfilePicture(res, owner, userId, "user_id", role, "private, max-age=300");
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// GET /api/auth/profile-picture/:role/:profileId (Public)
exports.getPublicProfilePicture = async (req, res) => {
	const role = String(req.params.role || "").trim().toLowerCase();
	const normalizedRole = role === "startup" ? "Startup" : role === "investor" ? "Investor" : role === "mentor" ? "Mentor" : "";
	const profileId = Number.parseInt(req.params.profileId, 10);
	const owner = PROFILE_PICTURE_OWNERS[normalizedRole];
	if (!owner || !Number.isInteger(profileId) || profileId <= 0) {
		return res.status(404).json({ message: "Profile picture not found" });
	}
	try {
		return await sendProfilePicture(res, owner, profileId, owner.id, normalizedRole, "public, max-age=300");
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// PUT /api/auth/profile-picture (Authenticated)
exports.updateProfilePicture = async (req, res) => {
	const { user_id: userId, role } = req.user;
	const owner = PROFILE_PICTURE_OWNERS[role];
	const file = req.file;
	if (!owner) return res.status(400).json({ message: "Profile pictures are not supported for this account" });
	if (!file) return res.status(400).json({ message: "Choose a JPG or PNG image to upload" });
	if (!["image/jpeg", "image/png"].includes(file.mimetype)) {
		return res.status(400).json({ message: "Profile picture must be a JPG or PNG image" });
	}
	if (file.size > 5 * 1024 * 1024) {
		return res.status(400).json({ message: "Profile picture must be 5 MB or smaller" });
	}
	try {
		const profile = await pool.query(
			`SELECT ${owner.id} AS profile_id FROM ${owner.table} WHERE user_id = $1`,
			[userId],
		);
		if (!profile.rowCount) return res.status(404).json({ message: "Profile not found" });
		const fileHash = crypto.createHash("sha256").update(file.buffer).digest("hex");
		const storagePath = `db://documents/${role.toLowerCase()}/${profile.rows[0].profile_id}/${crypto.randomBytes(16).toString("hex")}`;
		await pool.query(
			`INSERT INTO documents (${owner.id}, file_name, file_path, file_type, file_size_bytes, file_hash, file_data, description, created_at)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP)`,
			[
				profile.rows[0].profile_id,
				file.originalname,
				storagePath,
				file.mimetype,
				file.size,
				fileHash,
				file.buffer,
				owner.description,
			],
		);
		return res.json({ message: role === "Startup" ? "Company logo updated" : "Profile picture updated" });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

