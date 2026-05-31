const nodemailer = require("nodemailer");

function readSmtpConfig() {
	const host = String(process.env.SMTP_HOST || "").trim();
	const port = Number(process.env.SMTP_PORT);
	const user = String(process.env.SMTP_USER || "").trim();
	// Gmail app passwords are often pasted with spaces — remove them.
	const pass = String(process.env.SMTP_PASS || "").replace(/\s+/g, "");
	const from = String(process.env.FROM_EMAIL || user || "no-reply@connectstartup.local").trim();

	if (!host || !port || !user || !pass) {
		return null;
	}

	return { host, port, user, pass, from };
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
	console.warn(`[mail-fallback] ${reason || "SMTP unavailable"} to=${to} subject=${subject}`);
	if (body) {
		console.warn("[mail-fallback] body:", body.slice(0, 2000));
	}
}

async function sendMail(to, subject, text, html) {
	const plainText = text || (html ? html.replace(/<[^>]+>/g, " ") : "");
	const from = smtpConfig?.from || "no-reply@connectstartup.local";

	if (!transporter) {
		logMailFallback(to, subject, plainText, html, "SMTP not configured");
		return { fallback: true };
	}

	try {
		const info = await transporter.sendMail({
			from,
			to,
			subject,
			text: plainText,
			html,
		});
		return info;
	} catch (err) {
		console.error("[mail-error]", err.message || err);
		logMailFallback(to, subject, plainText, html, err.message || "send failed");
		return { fallback: true, error: err.message || String(err) };
	}
}

module.exports = { sendMail };
