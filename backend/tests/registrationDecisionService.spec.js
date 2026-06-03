const {
	scoreStartupRegistration,
	scoreInvestorRegistration,
	scoreMentorRegistration,
	reviewRegistrationWithPretrainedAI,
} = require("../services/registrationDecisionService");

describe("registrationDecisionService Startup AI recommendation", () => {
	const cleanStartup = {
		founder_full_name: "Aster Founder",
		startup_name: "GreenGrid",
		industry: "CleanTech",
		startup_tagline: "Smarter local energy",
		business_stage: "MVP",
		startup_type: "SaaS",
		founded_year: new Date().getFullYear(),
		region: "Addis Ababa",
		city: "Addis Ababa",
		team_size: 3,
		founder_role: "CEO",
		website: "https://greengrid.example",
	};

	const requiredDocs = [
		{ document_type: "Company logo" },
		{ document_type: "Founder or representative ID" },
		{ document_type: "Business registration proof" },
	];

	it("recommends approval for a complete low-risk Startup registration", () => {
		const decision = scoreStartupRegistration({
			user: { email_verified: true, phone_number: "+251900000000" },
			startup: cleanStartup,
			uploadedDocuments: requiredDocs,
		});

		expect(decision.status).toBe("rule_recommends_approval");
		expect(decision.score).toBeGreaterThanOrEqual(80);
	});

	it("recommends rejection for a risky Startup registration", () => {
		const decision = scoreStartupRegistration({
			user: { email_verified: true, phone_number: null },
			startup: {
				...cleanStartup,
				founded_year: new Date().getFullYear() + 1,
				team_size: 0,
			},
			uploadedDocuments: [{ document_type: "Company logo" }],
		});

		expect(decision.status).toBe("rule_recommends_rejection");
		expect(decision.score).toBeLessThan(80);
		expect(decision.reasons.some((item) => item.type === "risk")).toBe(true);
	});

	it("recommends approval for a complete low-risk Investor registration", () => {
		const decision = scoreInvestorRegistration({
			user: { email_verified: true, phone_number: "+251900000001" },
			investor: {
				investor_type: "Angel",
				preferred_industry: "FinTech",
				investment_stage: "Seed",
				investment_budget: 100000,
				investment_budget_min: 10000,
				location_preference: "Ethiopia",
				linked_in_or_website: "https://investor.example",
				bio: "Experienced early-stage investor.",
				personal_verification: "Passport",
			},
			uploadedDocuments: [
				{ document_type: "Profile picture" },
				{ document_type: "Registration document" },
				{ document_type: "Trade license" },
				{ document_type: "TIN certificate" },
			],
		});

		expect(decision.status).toBe("rule_recommends_approval");
		expect(decision.score).toBeGreaterThanOrEqual(80);
	});

	it("recommends approval for a complete low-risk Mentor registration", () => {
		const decision = scoreMentorRegistration({
			user: { email_verified: true, phone_number: "+251900000002" },
			mentor: {
				professional_title: "Growth Mentor",
				expertise: "Go-to-market strategy",
				years_experience: 8,
				languages: "English, Amharic",
				bio: "Mentored startups from MVP to launch.",
				linkedin_or_portfolio: "https://mentor.example",
				availability_preference: "Weekdays",
				session_pricing: 50,
				session_pricing_min: 25,
				current_organization: "Startup Studio",
				current_title: "Advisor",
				primary_industry: "SaaS",
				city_location: "Addis Ababa",
				mentor_platform: "Online",
				session_frequency: "Weekly",
				required_time_slots: "Mon/Wed evenings",
				mentoring_style: "Hands-on",
				notable_startups_mentored: "Three early-stage teams",
				key_achievement: "Helped founders close seed pilots",
			},
			uploadedDocuments: [
				{ document_type: "Profile picture" },
				{ document_type: "Government-issued ID" },
				{ document_type: "Certification or credential file" },
			],
		});

		expect(decision.status).toBe("rule_recommends_approval");
		expect(decision.score).toBeGreaterThanOrEqual(80);
	});

	it("uses Groq when AI_REVIEW_PROVIDER is groq", async () => {
		const originalProvider = process.env.AI_REVIEW_PROVIDER;
		const originalKey = process.env.GROQ_API_KEY;
		const originalFetch = global.fetch;

		process.env.AI_REVIEW_PROVIDER = "groq";
		process.env.GROQ_API_KEY = "test-groq-key";
		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				choices: [
					{
						message: {
							content: JSON.stringify({
								recommendation: "approve",
								risk_level: "low",
								summary: "Complete and consistent registration.",
								concerns: [],
								positive_signals: ["Required fields and documents are present."],
							}),
						},
					},
				],
			}),
		});

		try {
			const review = await reviewRegistrationWithPretrainedAI({
				role: "Startup",
				user: { email_verified: true, phone_number: "+251900000000" },
				profile: cleanStartup,
				uploadedDocuments: requiredDocs,
				ruleDecision: {
					status: "rule_recommends_approval",
					score: 90,
					reasons: [],
				},
			});

			expect(review.provider).toBe("groq");
			expect(review.status).toBe("completed");
			expect(review.recommendation).toBe("approve");
			expect(global.fetch).toHaveBeenCalledWith(
				"https://api.groq.com/openai/v1/chat/completions",
				expect.objectContaining({
					method: "POST",
				}),
			);
		} finally {
			process.env.AI_REVIEW_PROVIDER = originalProvider;
			process.env.GROQ_API_KEY = originalKey;
			global.fetch = originalFetch;
		}
	});
});
