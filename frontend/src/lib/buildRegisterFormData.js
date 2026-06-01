import { loadRegistrationAccountInfo } from "./registerAccountStorage";

/**
 * Build multipart FormData for POST /api/auth/register from RegFlow state.
 */

function splitName(full) {
	const t = String(full || "").trim();
	if (!t) return { first_name: "", last_name: "" };
	const parts = t.split(/\s+/);
	if (parts.length === 1) return { first_name: parts[0], last_name: parts[0] };
	return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}

export function buildRegisterFormData(role, fields, files) {
	const fd = new FormData();
	const f = fields || {};
	const fl = files || {};
	const accountInfo = loadRegistrationAccountInfo() || {};
	const googleProfileToken =
		typeof sessionStorage !== "undefined"
			? sessionStorage.getItem("google_profile_token")
			: "";
	if (googleProfileToken) {
		fd.append("google_profile_token", googleProfileToken);
	}
	if (accountInfo.registration_email_verification_id) {
		fd.append("registration_email_verification_id", accountInfo.registration_email_verification_id);
	}
	const accountFullName =
		f.full_name ||
		accountInfo.full_name ||
		`${accountInfo.first_name || ""} ${accountInfo.last_name || ""}`.trim();

	const fallbackFirstName = f.first_name || accountInfo.first_name || "";
	const fallbackLastName = f.last_name || accountInfo.last_name || "";

	if (role === "Startup") {
		const founderName = f.founder_full_name || accountFullName;
		const { first_name, last_name } = splitName(founderName);
		fd.append("first_name", fallbackFirstName || first_name);
		fd.append("last_name", fallbackLastName || last_name);
		fd.append("email", f.email || accountInfo.email);
		fd.append("password", f.password || accountInfo.password);
		fd.append(
			"confirm_password",
			f.confirm_password || accountInfo.confirm_password || f.password || accountInfo.password,
		);
		fd.append("role", "Startup");
		fd.append("phone_number", f.phone_number || accountInfo.phone_number);
		fd.append("founder_full_name", founderName);
		fd.append("startup_name", f.startup_name);
		fd.append("industry", f.industry);
		fd.append("startup_tagline", f.startup_tagline);
		fd.append("business_stage", f.business_stage);
		fd.append("startup_type", f.startup_type);
		fd.append("founded_year", String(f.founded_year));
		fd.append("region", f.region);
		fd.append("city", f.city);
		fd.append("team_size", String(f.team_size));
		fd.append("founder_role", f.founder_role);
		if (f.website) fd.append("website", f.website);
		if (!fl.startup_logo) {
			throw new Error("Startup logo is required");
		}
		fd.append("startup_logo", fl.startup_logo);
		if (fl.founder_id) fd.append("founder_id", fl.founder_id);
		if (fl.business_registration_proof) {
			fd.append("business_registration_proof", fl.business_registration_proof);
		}
		if (fl.support_affiliation_letter) {
			fd.append("support_affiliation_letter", fl.support_affiliation_letter);
		}
		if (fl.tin_certificate) fd.append("tin_certificate", fl.tin_certificate);
		if (fl.additional_verification_document) {
			fd.append("additional_verification_document", fl.additional_verification_document);
		}
		return fd;
	}

	if (role === "Investor") {
		const { first_name, last_name } = splitName(accountFullName);
		fd.append("first_name", fallbackFirstName || first_name);
		fd.append("last_name", fallbackLastName || last_name);
		fd.append("email", f.email || accountInfo.email);
		fd.append("password", f.password || accountInfo.password);
		fd.append("confirm_password", f.confirm_password || f.password || accountInfo.confirm_password || accountInfo.password);
		fd.append("role", "Investor");
		fd.append("phone_number", f.phone_number || accountInfo.phone_number);
		fd.append("investor_type", f.investor_type);
		fd.append("preferred_industry", f.preferred_industry);
		fd.append("investment_stage", f.investment_stage);
		fd.append("investment_range_min", String(f.investment_range_min));
		fd.append("investment_range", String(f.investment_range));
		fd.append("location_preference", f.location_preference);
		fd.append("investment_history_summary", f.investment_history_summary);
		fd.append("linked_in_or_website", f.linked_in_or_website);
		fd.append("bio", f.bio);
		fd.append("personal_verification", f.personal_verification);
		if (!fl.profile_picture) {
			throw new Error("Profile picture is required");
		}
		fd.append("profile_picture", fl.profile_picture);
		if (fl.registration_doc) fd.append("registration_doc", fl.registration_doc);
		if (fl.trade_license) fd.append("trade_license", fl.trade_license);
		if (fl.tin_certificate) fd.append("tin_certificate", fl.tin_certificate);
		return fd;
	}

	if (role === "Mentor") {
		const { first_name, last_name } = splitName(accountFullName);
		fd.append("first_name", fallbackFirstName || first_name);
		fd.append("last_name", fallbackLastName || last_name);
		fd.append("email", f.email || accountInfo.email);
		fd.append("password", f.password || accountInfo.password);
		fd.append("confirm_password", f.confirm_password || f.password || accountInfo.confirm_password || accountInfo.password);
		fd.append("role", "Mentor");
		fd.append("phone_number", f.phone_number || accountInfo.phone_number);
		fd.append("professional_title", f.professional_title);
		fd.append("year_of_experience", String(f.year_of_experience));
		fd.append("language", f.language);
		fd.append("expertise_area", f.expertise_area);
		fd.append("professional_bio", f.professional_bio);
		fd.append("linkedin_portfolio", f.linkedin_portfolio);
		fd.append("availability_preference", f.availability_preference);
		fd.append("session_pricing_min", String(f.session_pricing_min));
		fd.append("session_pricing", String(f.session_pricing));
		fd.append("current_organization", f.current_organization);
		fd.append("current_title", f.current_title);
		fd.append("primary_industry", f.primary_industry);
		if (f.secondary_industry) {
			fd.append("secondary_industry", f.secondary_industry);
		}
		fd.append("city_location", f.city_location);
		fd.append("mentor_platform", f.mentor_platform);
		fd.append("session_frequency", f.session_frequency);
		fd.append(
			"required_time_slots",
			typeof f.required_time_slots === "string"
				? f.required_time_slots
				: JSON.stringify(f.required_time_slots || [{ day: "Mon", note: "Evenings" }]),
		);
		if (f.startup_stage) {
			if (Array.isArray(f.startup_stage)) {
				for (const stage of f.startup_stage) {
					fd.append("startup_stage", stage);
				}
			} else {
				fd.append("startup_stage", f.startup_stage);
			}
		}
		fd.append("mentoring_style", f.mentoring_style);
		fd.append("notable_startups_mentored", f.notable_startups_mentored);
		fd.append("key_achievement", f.key_achievement);
		if (!fl.profile_picture) {
			throw new Error("Profile picture is required");
		}
		fd.append("profile_picture", fl.profile_picture);
		if (fl.mentor_id) fd.append("mentor_id", fl.mentor_id);
		if (fl.intro_video) fd.append("intro_video", fl.intro_video);
		const certs = fl.certifications;
		if (certs) {
			if (Array.isArray(certs)) {
				for (const c of certs) fd.append("certifications", c);
			} else {
				fd.append("certifications", certs);
			}
		}
		return fd;
	}

	throw new Error(`Unknown role ${role}`);
}
