const RULES = {
	profile_picture: {
		types: ["image/jpeg", "image/png"],
		message: "Profile picture must be a JPG or PNG image",
	},
	founder_id: {
		types: ["image/jpeg", "image/png"],
		message: "Founder or representative ID must be a JPG or PNG image",
	},
	startup_logo: {
		types: ["image/jpeg", "image/png"],
		message: "Startup logo must be a JPG or PNG image",
	},
	business_registration_proof: {
		types: ["application/pdf"],
		message: "Business registration proof must be a PDF document",
	},
	support_affiliation_letter: {
		types: ["application/pdf"],
		message: "Support or affiliation letter must be a PDF document",
	},
	tin_certificate: {
		types: ["application/pdf"],
		message: "TIN certificate must be a PDF document",
	},
	registration_doc: {
		types: ["application/pdf"],
		message: "Registration document must be a PDF document",
	},
	trade_license: {
		types: ["application/pdf"],
		message: "Trade license must be a PDF document",
	},
	mentor_id: {
		types: ["image/jpeg", "image/png"],
		message: "Government-issued ID must be a JPG or PNG image",
	},
	certifications: {
		types: ["application/pdf"],
		message: "Certification files must be PDF documents",
	},
	intro_video: {
		types: ["video/mp4", "video/quicktime", "video/webm"],
		message: "Introduction video must be an MP4, MOV, or WebM video",
	},
};

module.exports = function validateRegistrationUploadFormats(req, res, next) {
	for (const [fieldName, files] of Object.entries(req.files || {})) {
		const rule = RULES[fieldName];
		if (!rule) continue;
		if (files.some((file) => !rule.types.includes(file.mimetype))) {
			return res.status(400).json({ message: rule.message });
		}
	}
	next();
};
