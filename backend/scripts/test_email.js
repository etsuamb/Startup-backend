require("dotenv").config();
const mail = require("../utils/mail");

const to = process.argv[2] || process.env.TEST_EMAIL_TO;
if (!to) {
	console.error("Usage: node scripts/test_email.js you@example.com");
	process.exit(1);
}

async function main() {
	console.log("Mail setup:", mail.getMailProviderStatus());
	try {
		const result = await mail.sendMail(
			to,
			"StartupConnect email test",
			"If you received this, email delivery is working.",
			"<p>If you received this, <strong>email delivery is working</strong>.</p>",
		);
		console.log("Result:", result);
		if (!result.delivered) {
			process.exitCode = 1;
		}
	} catch (err) {
		console.error("Send failed:", err.message || err);
		if (err.code) console.error("Code:", err.code);
		if (err.details) console.error("Details:", err.details);
		process.exitCode = 1;
	}
}

main().catch((err) => {
	console.error(err.message || err);
	process.exitCode = 1;
});
