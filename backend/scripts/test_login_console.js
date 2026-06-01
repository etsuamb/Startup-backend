const BASE_URL = process.env.TEST_API_URL || "http://localhost:5001";
const email = String(process.env.TEST_LOGIN_EMAIL || "").trim();
const password = String(process.env.TEST_LOGIN_PASSWORD || "");

function fail(message, details) {
	console.error(`FAIL: ${message}`);
	if (details) console.error(details);
	process.exit(1);
}

async function main() {
	if (!email || !password) {
		fail(
			"Set TEST_LOGIN_EMAIL and TEST_LOGIN_PASSWORD before running the login test.",
			"Example: $env:TEST_LOGIN_EMAIL='your-test-email'; $env:TEST_LOGIN_PASSWORD='your-test-password'; npm run test-login",
		);
	}

	console.log(`Testing login API: ${BASE_URL}/api/auth/login`);
	console.log(`Test account: ${email}`);

	const response = await fetch(`${BASE_URL}/api/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});

	const text = await response.text();
	let body;
	try {
		body = JSON.parse(text);
	} catch {
		body = { raw: text };
	}

	if (!response.ok) {
		fail(`Login request returned HTTP ${response.status}.`, body.message || body.raw);
	}

	if (body.requires2FA) {
		console.log("PASS: Password accepted and the account correctly requires 2FA.");
		console.log(`Two-factor method: ${body.twoFactorMethod || "configured method"}`);
		console.log("Next step: verify the OTP or backup code through the 2FA login screen.");
		return;
	}

	if (body.message !== "Login successful" || !body.token) {
		fail("Login response did not contain the expected success payload.");
	}

	console.log("PASS: Login successful.");
	console.log(`Role: ${body.user?.role || "unknown"}`);
	console.log(`Email verified: ${Boolean(body.emailVerified)}`);
	console.log(`Admin approved: ${Boolean(body.isApproved)}`);
	console.log("Access token received: yes");
	console.log("Screenshot this PASS output for Figure 6.1 evidence.");
}

main().catch((error) => fail("Login test could not be completed.", error.message));

