const { ensurePrivacySchema, resolveProfileVisibility } = require("../utils/profileVisibility");

exports.attachVisibility = async (req, _res, next) => {
	try {
		await ensurePrivacySchema();
		req.visibility = {
			canViewSensitiveProfile: (target) => resolveProfileVisibility(req, target),
		};
		next();
	} catch (err) {
		next(err);
	}
};
