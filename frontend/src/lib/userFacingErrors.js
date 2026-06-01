const VALIDATION_MESSAGES = {
	invalid_format: "Enter a valid email address.",
	disposable_email: "Temporary email addresses are not allowed. Use an email account you can access.",
	reserved_domain: "Use a real email address instead of a reserved or example domain.",
	no_mx_records: "This email domain cannot receive messages. Check the address or use another email.",
	domain_not_found: "This email domain could not be found. Check the address or use another email.",
	validation_error: "We could not validate this email address. Please try again.",
};

export function userFacingError(error, fallback = "Something went wrong. Please try again.") {
	const code = error?.code || error?.data?.code;
	const status = error?.status;
	const message = String(error?.message || error?.data?.message || "").trim();

	if (VALIDATION_MESSAGES[code]) return VALIDATION_MESSAGES[code];
	if (code === "RATE_LIMITED") return "Too many attempts. Please wait a few minutes, then try again.";
	if (code === "REGISTRATION_EMAIL_NOT_VERIFIED") {
		return "Your email verification is missing or expired. Return to the first registration step and verify your email again.";
	}
	if (
		code === "EMAIL_DELIVERY_FAILED" ||
		String(code || "").startsWith("BREVO_") ||
		/email provider|brevo|smtp|authori[sz]ed ip|unrecognised ip|connection timeout/i.test(message)
	) {
		return "We could not send the verification email right now. Please try again shortly.";
	}
	if (status >= 500) return "The service could not complete your request right now. Please try again shortly.";

	return message || fallback;
}
