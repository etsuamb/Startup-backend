const nodemailer = require("nodemailer");

const IS_RENDER = Boolean(process.env.RENDER);
const RESEND_API_KEY = String(process.env.RESEND_API_KEY || "").trim();

function readEnv(name) {
	return String(process.env[name] || "").trim();
}

function resolveBrevoHttpApiKey() {
	const dedicated = readEnv("BREVO_HTTP_API_KEY");
	if (dedicated.startsWith("xkeysib-")) return dedicated;
	const legacy = readEnv("BREVO_API_KEY");
	if (legacy.startsWith("xkeysib-")) return legacy;
	return "";
}

function resolveBrevoSmtpPassword() {
	const dedicated = readEnv("BREVO_SMTP_KEY");
	if (dedicated.startsWith("xsmtpsib-")) return dedicated.replace(/\s+/g, "");
	const legacy = readEnv("BREVO_API_KEY");
	if (legacy.startsWith("xsmtpsib-")) return legacy.replace(/\s+/g, "");
	return "";
}

class MailDeliveryError extends Error {
	constructor(message, code, details = null) {
		super(message);
		this.name = "MailDeliveryError";
		this.code = code;
		this.details = details;
	}
}

function readGenericSmtpConfig() {
	const host = readEnv("SMTP_HOST");
	const port = Number(process.env.SMTP_PORT);
	const user = readEnv("SMTP_USER");
	const pass = readEnv("SMTP_PASS").replace(/\s+/g, "");
	const from = readEnv("FROM_EMAIL") || user || "no-reply@connectstartup.local";

	if (!host || !port || !user || !pass) {
		return null;
	}

	return { host, port, user, pass, from };
}

function readBrevoSmtpConfig() {
	const user = readEnv("BREVO_SMTP_USER");
	const pass = resolveBrevoSmtpPassword();
	const from = readEnv("BREVO_FROM_EMAIL") || readEnv("FROM_EMAIL");

	if (!user || !pass) {
		return null;
	}

	return {
		host: readEnv("BREVO_SMTP_HOST") || "smtp-relay.brevo.com",
		port: Number(process.env.BREVO_SMTP_PORT || 587),
		user,
		pass,
		from: from || user,
	};
}

function formatResendFrom() {
	const raw = readEnv("RESEND_FROM_EMAIL") || readEnv("FROM_EMAIL") || "onboarding@resend.dev";
	if (raw.includes("<")) return raw;
	return `StartupConnect <${raw}>`;
}

function readBrevoSender() {
	const email = readEnv("BREVO_FROM_EMAIL") || readEnv("FROM_EMAIL");
	const name = readEnv("BREVO_FROM_NAME") || "StartupConnect";
	if (!email || email.includes("@smtp-brevo.com")) {
		return null;
	}
	return { email, name };
}

function createTransporter(config) {
	return nodemailer.createTransport({
		host: config.host,
		port: config.port,
		secure: config.port === 465,
		requireTLS: config.port === 587,
		auth: {
			user: config.user,
			pass: config.pass,
		},
		connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 10000,
		greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS) || 10000,
		socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 15000,
		pool: false,
	});
}

function getRuntimeMailConfig() {
	const brevoHttpApiKey = resolveBrevoHttpApiKey();
	const brevoSmtpConfig = readBrevoSmtpConfig();
	const genericSmtpConfig = readGenericSmtpConfig();
	const allowGenericSmtp = !IS_RENDER || readEnv("RENDER_ALLOW_SMTP") === "true";

	return {
		brevoHttpApiKey,
		brevoSmtpConfig,
		brevoTransporter: brevoSmtpConfig ? createTransporter(brevoSmtpConfig) : null,
		genericSmtpConfig,
		genericTransporter:
			genericSmtpConfig && allowGenericSmtp && !/brevo\.com/i.test(genericSmtpConfig.host)
				? createTransporter(genericSmtpConfig)
				: null,
		allowGenericSmtp,
	};
}

function logMailFallback(to, subject, text, html, reason) {
	const body = text || (html ? html.replace(/<[^>]+>/g, " ") : "");
	console.warn(`[mail-fallback] ${reason || "delivery failed"} to=${to} subject=${subject}`);
	if (body) {
		console.warn("[mail-fallback] body:", body.slice(0, 2000));
	}
}

function parseResendError(message) {
	const text = String(message || "");
	if (/only send testing emails to your own email address/i.test(text)) {
		const match = text.match(/email address \(([^)]+)\)/i);
		return new MailDeliveryError(
			match
				? `Resend test mode only allows sending to ${match[1]}. Verify a domain at resend.com/domains or use Brevo HTTP API.`
				: "Resend test mode only allows sending to your Resend signup email until you verify a domain.",
			"RESEND_SANDBOX_ONLY",
			{ allowedEmail: match?.[1] || null },
		);
	}
	return new MailDeliveryError(text || "Resend delivery failed", "RESEND_FAILED");
}

function parseBrevoMisconfig() {
	const legacy = readEnv("BREVO_API_KEY");
	if (legacy.startsWith("xsmtpsib-") && !readEnv("BREVO_SMTP_USER")) {
		return new MailDeliveryError(
			"Set BREVO_SMTP_USER=your_login@smtp-brevo.com for the xsmtpsib SMTP key.",
			"BREVO_MISCONFIGURED",
		);
	}
	if (legacy.includes("xsmtpsib-") && legacy.includes("xkeysib-")) {
		return new MailDeliveryError(
			"BREVO_API_KEY contains two keys pasted together. Use BREVO_HTTP_API_KEY for xkeysib and BREVO_SMTP_KEY for xsmtpsib.",
			"BREVO_MISCONFIGURED",
		);
	}
	if (IS_RENDER && !resolveBrevoHttpApiKey() && !readBrevoSmtpConfig()) {
		return new MailDeliveryError(
			"On Render, set BREVO_HTTP_API_KEY (xkeysib-...) for reliable email delivery.",
			"BREVO_MISCONFIGURED",
		);
	}
	return null;
}

async function sendViaBrevoApi(to, subject, plainText, html, apiKey) {
	const sender = readBrevoSender();
	if (!sender) {
		throw new MailDeliveryError(
			"BREVO_FROM_EMAIL must be your verified sender Gmail, not the @smtp-brevo.com login.",
			"BREVO_MISCONFIGURED",
		);
	}

	const response = await fetch("https://api.brevo.com/v3/smtp/email", {
		method: "POST",
		headers: {
			"api-key": apiKey,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			sender,
			to: [{ email: to }],
			subject,
			textContent: plainText,
			htmlContent: html,
		}),
	});

	const payload = await response.json().catch(() => ({}));
	if (!response.ok) {
		const message = payload?.message || payload?.error || `Brevo HTTP ${response.status}`;
		if (/unrecognised ip address|unrecognized ip address|authorised_ips|authorized_ips/i.test(String(message))) {
			throw new MailDeliveryError(
				`${message} Disable IP blocking in Brevo -> Security -> Authorized IPs (or add your server IP). Render needs IP blocking turned OFF.`,
				"BREVO_IP_BLOCKED",
			);
		}
		if (/key not found|unauthorized|invalid api key/i.test(String(message))) {
			throw new MailDeliveryError(
				`${message}. Use BREVO_HTTP_API_KEY with a key starting xkeysib- from Brevo -> API Keys.`,
				"BREVO_INVALID_API_KEY",
			);
		}
		if (/sender.*not valid|sender.*not verified|invalid sender/i.test(String(message))) {
			throw new MailDeliveryError(
				`${message}. Verify ${sender.email} in Brevo -> Settings -> Senders.`,
				"BREVO_SENDER_NOT_VERIFIED",
				{ senderEmail: sender.email },
			);
		}
		throw new MailDeliveryError(message, "BREVO_FAILED");
	}

	return { delivered: true, provider: "brevo-api", id: payload.messageId || null };
}

async function sendViaBrevoSmtp(to, subject, plainText, html, config, transporter) {
	const fromEmail = config.from;
	const fromName = readEnv("BREVO_FROM_NAME") || "StartupConnect";
	const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

	const info = await transporter.sendMail({
		from,
		to,
		subject,
		text: plainText,
		html,
	});

	return { delivered: true, provider: "brevo-smtp", messageId: info.messageId };
}

async function sendViaResend(to, subject, plainText, html) {
	if (!RESEND_API_KEY) {
		return null;
	}

	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${RESEND_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from: formatResendFrom(),
			to: [to],
			subject,
			text: plainText,
			html,
		}),
	});

	const payload = await response.json().catch(() => ({}));
	if (!response.ok) {
		const message =
			payload?.message ||
			payload?.error ||
			(typeof payload === "string" ? payload : null) ||
			`Resend HTTP ${response.status}`;
		throw parseResendError(message);
	}

	return { delivered: true, provider: "resend", id: payload.id };
}

async function sendViaGenericSmtp(to, subject, plainText, html, config, transporter) {
	const info = await transporter.sendMail({
		from: config.from,
		to,
		subject,
		text: plainText,
		html,
	});
	return { delivered: true, provider: "smtp", messageId: info.messageId };
}

function describeMailSetup(config) {
	if (config.brevoHttpApiKey) return "Brevo HTTP API";
	if (config.brevoSmtpConfig) return "Brevo SMTP";
	if (RESEND_API_KEY) return "Resend API";
	if (config.genericSmtpConfig && config.allowGenericSmtp) return "SMTP";
	if (config.genericSmtpConfig) return "SMTP (disabled on Render)";
	return "none";
}

async function sendMail(to, subject, text, html) {
	const plainText = text || (html ? html.replace(/<[^>]+>/g, " ") : "");
	const misconfig = parseBrevoMisconfig();
	if (misconfig) {
		throw misconfig;
	}

	const config = getRuntimeMailConfig();
	const errors = [];
	let brevoAttempted = false;

	if (config.brevoHttpApiKey) {
		try {
			return await sendViaBrevoApi(to, subject, plainText, html, config.brevoHttpApiKey);
		} catch (err) {
			brevoAttempted = true;
			errors.push(`Brevo API: ${err.message || err}`);
			console.error("[mail-error] Brevo API failed:", err.message || err);
		}
	}

	if (config.brevoTransporter) {
		brevoAttempted = true;
		try {
			return await sendViaBrevoSmtp(
				to,
				subject,
				plainText,
				html,
				config.brevoSmtpConfig,
				config.brevoTransporter,
			);
		} catch (err) {
			const message = String(err.message || err);
			if (/unauthorized ip address/i.test(message)) {
				errors.push(
					"Brevo SMTP: blocked this server IP. Disable Brevo IP blocking or authorize the server IP.",
				);
				console.error("[mail-error] Brevo SMTP blocked this server IP");
			} else {
				errors.push(`Brevo SMTP: ${message}`);
				console.error("[mail-error] Brevo SMTP failed:", message);
			}
		}
	}

	if (RESEND_API_KEY) {
		try {
			return await sendViaResend(to, subject, plainText, html);
		} catch (err) {
			if (err instanceof MailDeliveryError) {
				throw err;
			}
			errors.push(`Resend: ${err.message || err}`);
			console.error("[mail-error] Resend failed:", err.message || err);
		}
	}

	if (config.genericTransporter) {
		try {
			return await sendViaGenericSmtp(
				to,
				subject,
				plainText,
				html,
				config.genericSmtpConfig,
				config.genericTransporter,
			);
		} catch (err) {
			errors.push(`SMTP: ${err.message || err}`);
			console.error("[mail-error] SMTP failed:", err.message || err);
		}
	} else if (IS_RENDER && !config.brevoHttpApiKey && !config.brevoTransporter && !RESEND_API_KEY) {
		errors.push("Configure BREVO_HTTP_API_KEY (xkeysib-...) on Render for email delivery.");
	}

	const reason = errors.join("; ") || "No email provider configured";
	logMailFallback(to, subject, plainText, html, reason);
	throw new MailDeliveryError(reason, "EMAIL_DELIVERY_FAILED");
}

function getMailProviderStatus() {
	const config = getRuntimeMailConfig();
	return {
		render: IS_RENDER,
		brevoApiConfigured: Boolean(config.brevoHttpApiKey),
		brevoSmtpConfigured: Boolean(config.brevoSmtpConfig),
		resendConfigured: Boolean(RESEND_API_KEY),
		genericSmtpConfigured: Boolean(config.genericSmtpConfig),
		genericSmtpEnabled: Boolean(config.genericTransporter),
		activeProvider: describeMailSetup(config),
		brevoSender: readBrevoSender()?.email || config.brevoSmtpConfig?.from || null,
		brevoSmtpUser: config.brevoSmtpConfig?.user || null,
		resendFrom: formatResendFrom(),
		recommendedOnRender: "Set BREVO_HTTP_API_KEY to your xkeysib- API key",
	};
}

module.exports = {
	sendMail,
	getMailProviderStatus,
	MailDeliveryError,
};
