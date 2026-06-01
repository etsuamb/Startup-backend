const bcrypt = require("bcrypt");
const pool = require("../config/db");

process.env.CHAPA_PUBLIC_KEY =
	process.env.CHAPA_PUBLIC_KEY || "test-public-key";
process.env.CHAPA_SECRET_KEY =
	process.env.CHAPA_SECRET_KEY || "test-secret-key";
process.env.CHAPA_RETURN_URL =
	process.env.CHAPA_RETURN_URL || "http://localhost:3000";

global.fetch = async (url) => {
	if (String(url).includes("/transaction/initialize")) {
		return {
			ok: true,
			status: 200,
			json: async () => ({
				status: "success",
				data: { checkout_url: "https://mock.chapa.local/checkout/demo" },
			}),
		};
	}

	return {
		ok: false,
		status: 404,
		json: async () => ({ status: "error", message: "Unexpected fetch URL" }),
	};
};

const paymentController = require("../controllers/paymentController");

async function main() {
	await pool.query(
		"UPDATE users SET password_hash = $1, email_verified = true, is_approved = true, is_active = true WHERE user_id = $2",
		[await bcrypt.hash("Investor1234", 10), 2],
	);

	await pool.query(
		"DELETE FROM investment_requests WHERE startup_id = $1 AND investor_id = $2",
		[2, 1],
	);
	const offerResult = await pool.query(
		`INSERT INTO investment_requests (
			startup_id,
			investor_id,
			project_id,
			requested_amount,
			proposal_message,
			status
		)
		VALUES ($1, $2, $3, $4, $5, 'approved')
		RETURNING investment_request_id`,
		[2, 1, 1, 50000, "Chapter 6 Chapa payment smoke test"],
	);

	const req = {
		body: {
			offer_id: offerResult.rows[0].investment_request_id,
			payment_contract_accepted: true,
			payment_contract_version: "startupconnect-payment-v1",
		},
		user: { user_id: 2, role: "Investor" },
		headers: {},
	};

	const response = {
		statusCode: 200,
		payload: null,
		status(code) {
			this.statusCode = code;
			return this;
		},
		json(body) {
			this.payload = body;
			return this;
		},
	};

	await paymentController.initializeChapaPayment(req, response);

	console.log(`PAYMENT_STATUS ${response.statusCode}`);
	console.log(JSON.stringify(response.payload));

	if (response.statusCode !== 201) {
		throw new Error("Chapa payment initialization failed");
	}

	console.log("PASS: Chapa payment initialization completed successfully.");
	console.log(`Checkout URL: ${response.payload.checkout_url}`);
	await pool.end();
}

main().catch(async (error) => {
	console.error("FAIL:", error.message);
	try {
		await pool.end();
	} catch {
		// ignore
	}
	process.exit(1);
});
