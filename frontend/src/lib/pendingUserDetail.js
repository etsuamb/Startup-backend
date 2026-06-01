/** Normalize GET /admin/users/pending/:id response for the detail UI. */
export function normalizePendingUserResponse(data) {
	if (!data) return { user: null, profile: null, documents: [] };
	if (data.user) {
		return {
			user: data.user,
			profile: data.profile || null,
			documents: Array.isArray(data.documents) ? data.documents : [],
		};
	}
	return {
		user: data,
		profile: null,
		documents: Array.isArray(data.documents) ? data.documents : [],
	};
}

function fmt(value) {
	if (value === null || value === undefined || value === "") return null;
	return value;
}

function fmtMoney(value, currency = "ETB") {
	if (value === null || value === undefined || value === "") return null;
	const n = Number(value);
	if (Number.isNaN(n)) return String(value);
	return `${n.toLocaleString()} ${currency}`;
}

function fmtDate(value) {
	if (!value) return null;
	try {
		return new Date(value).toLocaleString(undefined, {
			dateStyle: "medium",
			timeStyle: "short",
		});
	} catch {
		return String(value);
	}
}

function parseTimeSlots(raw) {
	if (!raw) return null;
	if (typeof raw === "object") {
		try {
			return JSON.stringify(raw, null, 2);
		} catch {
			return String(raw);
		}
	}
	const s = String(raw).trim();
	if (!s) return null;
	try {
		const parsed = JSON.parse(s);
		if (Array.isArray(parsed)) {
			return parsed
				.map((slot) => {
					if (typeof slot === "string") return slot;
					const day = slot.day || slot.Day || "";
					const note = slot.note || slot.time || slot.Note || "";
					return [day, note].filter(Boolean).join(" — ");
				})
				.filter(Boolean)
				.join("\n");
		}
		if (typeof parsed === "object") {
			return JSON.stringify(parsed, null, 2);
		}
	} catch {
		/* plain text */
	}
	return s;
}

/**
 * Build labeled sections for the admin review page.
 * @returns {{ id: string, title: string, items: { label: string, value: string | null, multiline?: boolean }[] }[]}
 */
export function buildProfileSections(user, profile) {
	if (!user) return [];

	const role = user.role;
	const sections = [];

	sections.push({
		id: "account",
		title: "Account",
		items: [
			{ label: "First name", value: fmt(user.first_name) },
			{ label: "Last name", value: fmt(user.last_name) },
			{ label: "Email", value: fmt(user.email) },
			{ label: "Phone", value: fmt(user.phone_number) },
			{ label: "Role", value: fmt(user.role) },
			{ label: "Registered", value: fmtDate(user.created_at) },
		],
	});

	if (!profile) return sections;

	if (role === "Startup") {
		sections.push({
			id: "startup-identity",
			title: "Startup identity",
			items: [
				{ label: "Founder full name", value: fmt(profile.founder_full_name) },
				{ label: "Startup name", value: fmt(profile.startup_name) },
				{ label: "Industry", value: fmt(profile.industry) },
				{ label: "Tagline", value: fmt(profile.startup_tagline), multiline: true },
				{ label: "Founder role", value: fmt(profile.founder_role) },
			],
		});
		sections.push({
			id: "startup-details",
			title: "Company details",
			items: [
				{ label: "Business stage", value: fmt(profile.business_stage) },
				{ label: "Startup type", value: fmt(profile.startup_type) },
				{ label: "Year founded", value: profile.founded_year != null ? String(profile.founded_year) : null },
				{ label: "Team size", value: profile.team_size != null ? String(profile.team_size) : null },
				{ label: "Region", value: fmt(profile.region) },
				{ label: "City", value: fmt(profile.city) },
				{ label: "Location", value: fmt(profile.location) },
				{ label: "Website", value: fmt(profile.website) },
				{
					label: "Funding needed",
					value: profile.funding_needed != null ? fmtMoney(profile.funding_needed, "USD") : null,
				},
			],
		});
		if (profile.description) {
			sections.push({
				id: "startup-description",
				title: "Description",
				items: [{ label: "About the startup", value: fmt(profile.description), multiline: true }],
			});
		}
	}

	if (role === "Investor") {
		sections.push({
			id: "investor-profile",
			title: "Investor profile",
			items: [
				{ label: "Investor type", value: fmt(profile.investor_type) },
				{ label: "Organization", value: fmt(profile.organization_name) },
				{ label: "Preferred industries", value: fmt(profile.preferred_industry) },
				{ label: "Investment stage", value: fmt(profile.investment_stage) },
				{
					label: "Investment budget / range",
					value:
						profile.investment_budget != null
							? `${fmtMoney(profile.investment_budget_min || 0, "USD")} - ${fmtMoney(profile.investment_budget, "USD")}`
							: null,
				},
				{ label: "Location preference", value: fmt(profile.location_preference) },
				{ label: "Country", value: fmt(profile.country) },
				{
					label: "Portfolio size",
					value: profile.portfolio_size != null ? String(profile.portfolio_size) : null,
				},
				{ label: "LinkedIn or website", value: fmt(profile.linked_in_or_website) },
			],
		});
		sections.push({
			id: "investor-bio",
			title: "Background",
			items: [
				{ label: "Professional bio", value: fmt(profile.bio), multiline: true },
				{
					label: "Investment history / verification notes",
					value: fmt(profile.personal_verification),
					multiline: true,
				},
			],
		});
	}

	if (role === "Mentor") {
		sections.push({
			id: "mentor-professional",
			title: "Professional profile",
			items: [
				{ label: "Professional title", value: fmt(profile.professional_title || profile.headline) },
				{
					label: "Years of experience",
					value:
						profile.years_experience != null
							? String(profile.years_experience)
							: null,
				},
				{ label: "Languages", value: fmt(profile.languages) },
				{
					label: "Expertise area",
					value: fmt(profile.expertise_area || profile.expertise),
					multiline: true,
				},
				{
					label: "Professional bio",
					value: fmt(profile.bio || profile.professional_bio),
					multiline: true,
				},
				{ label: "Certifications & credentials", value: fmt(profile.certification_credentials), multiline: true },
				{ label: "LinkedIn / portfolio", value: fmt(profile.linkedin_or_portfolio) },
			],
		});
		sections.push({
			id: "mentor-organization",
			title: "Organization & focus",
			items: [
				{ label: "Current organization", value: fmt(profile.current_organization) },
				{ label: "Current title", value: fmt(profile.current_title) },
				{ label: "Primary industry", value: fmt(profile.primary_industry) },
				{ label: "Secondary industry", value: fmt(profile.secondary_industry) },
				{ label: "City / location", value: fmt(profile.city_location || profile.country) },
			],
		});
		sections.push({
			id: "mentor-mentoring",
			title: "Mentoring preferences",
			items: [
				{ label: "Platform preference", value: fmt(profile.mentor_platform) },
				{ label: "Availability", value: fmt(profile.availability_preference), multiline: true },
				{ label: "Session frequency", value: fmt(profile.session_frequency) },
				{
					label: "Preferred time slots",
					value: parseTimeSlots(profile.required_time_slots),
					multiline: true,
				},
				{
					label: "Session pricing",
					value:
						profile.session_pricing != null
							? `${fmtMoney(profile.session_pricing_min || 0, "ETB")} - ${fmtMoney(profile.session_pricing, "ETB")}`
							: profile.hourly_rate != null
								? fmtMoney(profile.hourly_rate, "ETB")
								: null,
				},
				{ label: "Mentoring style", value: fmt(profile.mentoring_style) },
				{ label: "Notable startups mentored", value: fmt(profile.notable_startups_mentored), multiline: true },
				{ label: "Key achievement", value: fmt(profile.key_achievement), multiline: true },
			],
		});
	}

	return sections.map((section) => ({
		...section,
		items: section.items.filter((item) => item.value != null),
	})).filter((section) => section.items.length > 0);
}

export function formatFileSize(bytes) {
	if (bytes == null || bytes === "") return "";
	const n = Number(bytes);
	if (Number.isNaN(n) || n <= 0) return "";
	if (n < 1024) return `${n} B`;
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
	return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
