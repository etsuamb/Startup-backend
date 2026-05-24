const pool = require("../config/db");

const SENSITIVE_FIELDS = [
	"email",
	"phone_number",
	"telegram",
	"telegram_handle",
	"whatsapp",
	"whatsapp_number",
	"address",
	"exact_address",
	"social_links",
	"social_media_links",
	"linked_in_or_website",
	"linkedin_or_portfolio",
	"linkedin",
	"facebook",
	"twitter",
	"x_profile",
	"instagram",
];

const STARTUP_LOCATION_FIELDS = ["location"];
const MENTOR_LOCATION_FIELDS = ["city_location"];
const INVESTOR_LOCATION_FIELDS = ["location_preference"];

async function ensurePrivacySchema(client = pool) {
	await client.query(`
		CREATE TABLE IF NOT EXISTS sensitive_access_audit (
			audit_id SERIAL PRIMARY KEY,
			viewer_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
			viewer_role VARCHAR(20),
			target_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
			target_role VARCHAR(20),
			target_profile_type VARCHAR(30),
			target_profile_id INTEGER,
			fields_accessed TEXT[] NOT NULL DEFAULT '{}',
			access_reason VARCHAR(120),
			created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`);
}

function roleOf(user) {
	return user?.role || user?.user_role || null;
}

function publicLocationFor(profile, profileType) {
	if (profileType === "startup") {
		return profile.region || profile.city || null;
	}
	if (profileType === "mentor") {
		return profile.country || null;
	}
	if (profileType === "investor") {
		return profile.country || null;
	}
	return null;
}

function hiddenFieldsFor(profileType) {
	if (profileType === "startup") return [...SENSITIVE_FIELDS, ...STARTUP_LOCATION_FIELDS];
	if (profileType === "mentor") return [...SENSITIVE_FIELDS, ...MENTOR_LOCATION_FIELDS];
	if (profileType === "investor") return [...SENSITIVE_FIELDS, ...INVESTOR_LOCATION_FIELDS];
	return SENSITIVE_FIELDS;
}

function redactProfile(profile, { profileType, canViewSensitive, reason = "public_profile" }) {
	if (!profile || typeof profile !== "object") return profile;

	const hiddenFields = hiddenFieldsFor(profileType).filter((field) =>
		Object.prototype.hasOwnProperty.call(profile, field),
	);
	const filtered = { ...profile };

	if (!canViewSensitive) {
		for (const field of hiddenFields) {
			delete filtered[field];
		}
		const publicLocation = publicLocationFor(profile, profileType);
		if (publicLocation) filtered.public_location = publicLocation;
	}

	filtered.profile_visibility = {
		mode: canViewSensitive ? "private" : "public",
		sensitive_visible: Boolean(canViewSensitive),
		reason,
		hidden_fields: canViewSensitive ? [] : hiddenFields,
	};

	return filtered;
}

async function getViewerProfile(userId, role) {
	if (!userId || !role) return {};
	if (role === "Startup") {
		const result = await pool.query("SELECT startup_id FROM startups WHERE user_id = $1", [userId]);
		return { startup_id: result.rows[0]?.startup_id || null };
	}
	if (role === "Investor") {
		const result = await pool.query("SELECT investor_id FROM investors WHERE user_id = $1", [userId]);
		return { investor_id: result.rows[0]?.investor_id || null };
	}
	if (role === "Mentor") {
		const result = await pool.query("SELECT mentor_id FROM mentors WHERE user_id = $1", [userId]);
		return { mentor_id: result.rows[0]?.mentor_id || null };
	}
	return {};
}

async function completedPaymentExists(leftUserId, rightUserId) {
	if (!leftUserId || !rightUserId) return false;
	const result = await pool.query(
		`SELECT 1
		   FROM payments
		  WHERE status = 'completed'
		    AND (
		      (from_user_id = $1 AND to_user_id = $2)
		      OR (from_user_id = $2 AND to_user_id = $1)
		    )
		  LIMIT 1`,
		[leftUserId, rightUserId],
	);
	return result.rowCount > 0;
}

async function acceptedInvestmentExists(startupId, investorId) {
	if (!startupId || !investorId) return false;
	const result = await pool.query(
		`SELECT 1
		   FROM investment_requests
		  WHERE startup_id = $1
		    AND investor_id = $2
		    AND status IN ('approved', 'accepted')
		  LIMIT 1`,
		[startupId, investorId],
	);
	return result.rowCount > 0;
}

async function acceptedMentorshipExists(startupId, mentorId) {
	if (!startupId || !mentorId) return false;
	const result = await pool.query(
		`SELECT 1
		   FROM mentorship_requests
		  WHERE startup_id = $1
		    AND mentor_id = $2
		    AND status = 'accepted'
		  LIMIT 1`,
		[startupId, mentorId],
	);
	return result.rowCount > 0;
}

async function verifiedPair(viewerUserId, targetUserId) {
	if (!viewerUserId || !targetUserId) return false;
	const result = await pool.query(
		`SELECT COUNT(*)::int AS approved_count
		   FROM users
		  WHERE user_id IN ($1, $2)
		    AND is_active = TRUE
		    AND is_approved = TRUE`,
		[viewerUserId, targetUserId],
	);
	const requiredCount = String(viewerUserId) === String(targetUserId) ? 1 : 2;
	return Number(result.rows[0]?.approved_count || 0) >= requiredCount;
}

async function resolveProfileVisibility(req, target) {
	const viewer = req.user || null;
	const viewerRole = roleOf(viewer);
	const viewerUserId = viewer?.user_id || null;
	const targetUserId = target.user_id || null;
	const targetRole = target.role || target.user_role || null;

	if (viewerRole === "Admin") return { canViewSensitive: true, reason: "admin" };
	if (viewerUserId && targetUserId && String(viewerUserId) === String(targetUserId)) {
		return { canViewSensitive: true, reason: "owner" };
	}

	const bothVerified = await verifiedPair(viewerUserId, targetUserId);
	if (!bothVerified) return { canViewSensitive: false, reason: "public_profile" };

	const viewerProfile = await getViewerProfile(viewerUserId, viewerRole);
	let relationshipApproved = false;

	if (target.profileType === "startup" && viewerRole === "Investor") {
		relationshipApproved = await acceptedInvestmentExists(target.startup_id, viewerProfile.investor_id);
	} else if (target.profileType === "startup" && viewerRole === "Mentor") {
		relationshipApproved = await acceptedMentorshipExists(target.startup_id, viewerProfile.mentor_id);
	} else if (target.profileType === "investor" && viewerRole === "Startup") {
		relationshipApproved = await acceptedInvestmentExists(viewerProfile.startup_id, target.investor_id);
	} else if (target.profileType === "mentor" && viewerRole === "Startup") {
		relationshipApproved = await acceptedMentorshipExists(viewerProfile.startup_id, target.mentor_id);
	}

	if (relationshipApproved) {
		return { canViewSensitive: true, reason: "approved_collaboration" };
	}

	if (await completedPaymentExists(viewerUserId, targetUserId)) {
		return { canViewSensitive: true, reason: "completed_payment" };
	}

	return { canViewSensitive: false, reason: "public_profile" };
}

async function auditSensitiveAccess(req, target, fields, reason) {
	if (!fields.length || !req.user?.user_id) return;
	await ensurePrivacySchema();
	await pool.query(
		`INSERT INTO sensitive_access_audit (
			viewer_user_id, viewer_role, target_user_id, target_role,
			target_profile_type, target_profile_id, fields_accessed, access_reason
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		[
			req.user.user_id,
			roleOf(req.user),
			target.user_id || null,
			target.role || target.user_role || null,
			target.profileType || null,
			target.profileId || target.startup_id || target.investor_id || target.mentor_id || null,
			fields,
			reason || null,
		],
	);
}

async function filterProfileForViewer(req, profile, options) {
	const target = {
		...options,
		user_id: options.user_id ?? profile?.user_id,
	};
	const visibility = await resolveProfileVisibility(req, target);
	const fields = hiddenFieldsFor(options.profileType).filter((field) =>
		Object.prototype.hasOwnProperty.call(profile || {}, field),
	);

	if (visibility.canViewSensitive) {
		await auditSensitiveAccess(req, target, fields, visibility.reason);
	}

	return redactProfile(profile, {
		profileType: options.profileType,
		canViewSensitive: visibility.canViewSensitive,
		reason: visibility.reason,
	});
}

function filterPublicProfile(profile, profileType) {
	return redactProfile(profile, {
		profileType,
		canViewSensitive: false,
		reason: "public_profile",
	});
}

module.exports = {
	ensurePrivacySchema,
	filterProfileForViewer,
	filterPublicProfile,
	redactProfile,
	resolveProfileVisibility,
	SENSITIVE_FIELDS,
};
