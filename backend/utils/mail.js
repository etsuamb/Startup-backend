const nodemailer = require("nodemailer");

const IS_RENDER = Boolean(process.env.RENDER);
const RESEND_API_KEY = String(process.env.RESEND_API_KEY || "").trim();

function readSmtpConfig() {
	const host = String(process.env.SMTP_HOST || "").trim();
	const port = Number(process.env.SMTP_PORT);
	const user = String(process.env.SMTP_USER || "").trim();
	const pass = String(process.env.SMTP_PASS || "").replace(/\s+/g, "");
	const from = String(process.env.FROM_EMAIL || user || "no-reply@connectstartup.local").trim();

	if (!host || !port || !user || !pass) {
		return null;
	}

	return { host, port, user, pass, from };
}

function formatResendFrom() {
	const raw = String(
		process.env.RESEND_FROM_EMAIL || process.env.FROM_EMAIL || "onboarding@resend.dev",
	).trim();
	if (raw.includes("<")) return raw;
	return `StartupConnect <${raw}>`;
}

const smtpConfig = readSmtpConfig();
let transporter = null;

if (smtpConfig) {
	transporter = nodemailer.createTransport({
		host: smtpConfig.host,
		port: smtpConfig.port,
		secure: smtpConfig.port === 465,
		requireTLS: smtpConfig.port === 587,
		auth: {
			user: smtpConfig.user,
			pass: smtpConfig.pass,
		},
		connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 10000,
		greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS) || 10000,
		socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 15000,
		pool: false,
	});
}

function logMailFallback(to, subject, text, html, reason) {
	const body = text || (html ? html.replace(/<[^>]+>/g, " ") : "");
	console.warn(`[mail-fallback] ${reason || "delivery failed"} to=${to} subject=${subject}`);
	if (body) {
		console.warn("[mail-fallback] body:", body.slice(0, 2000));
	}
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
		throw new Error(message);
	}

	return { delivered: true, provider: "resend", id: payload.id };
}

async function sendViaSmtp(to, subject, plainText, html) {
	if (!transporter) {
		return null;
	}

	const info = await transporter.sendMail({
		from: smtpConfig.from,
		to,
		subject,
		text: plainText,
		html,
	});

	return { delivered: true, provider: "smtp", messageId: info.messageId };
}

function describeMailSetup() {
	if (RESEND_API_KEY) {
		return "Resend API";
	}
	if (smtpConfig) {
		return IS_RENDER
			? "SMTP (Render often blocks outbound SMTP; set RESEND_API_KEY for reliable delivery)"
			: "SMTP";
	}
	return "none (set RESEND_API_KEY or SMTP_* env vars)";
}

async function sendMail(to, subject, text, html) {
	const plainText = text || (html ? html.replace(/<[^>]+>/g, " ") : "");
	const errors = [];

	if (RESEND_API_KEY) {
		try {
			return await sendViaResend(to, subject, plainText, html);
		} catch (err) {
			errors.push(`Resend: ${err.message || err}`);
			console.error("[mail-error] Resend failed:", err.message || err);
		}
	}

	const skipSmtpOnRender = IS_RENDER && !process.env.RENDER_ALLOW_SMTP;
	if (!skipSmtpOnRender) {
		try {
			const smtpResult = await sendViaSmtp(to, subject, plainText, html);
			if (smtpResult) {
				return smtpResult;
			}
			errors.push("SMTP not configured");
		} catch (err) {
			errors.push(`SMTP: ${err.message || err}`);
			console.error("[mail-error] SMTP failed:", err.message || err);
		}
	} else if (!RESEND_API_KEY) {
		errors.push(
			"Render blocks outbound SMTP on most plans. Set RESEND_API_KEY in your Render environment.",
		);
	}

	const reason = errors.join("; ") || "No email provider configured";
	logMailFallback(to, subject, plainText, html, reason);
	return { delivered: false, provider: null, error: reason };
}

function getMailProviderStatus() {
	return {
		render: IS_RENDER,
		resendConfigured: Boolean(RESEND_API_KEY),
		smtpConfigured: Boolean(transporter),
		activeProvider: describeMailSetup(),
	};
}

module.exports = { sendMail, getMailProviderStatus };
