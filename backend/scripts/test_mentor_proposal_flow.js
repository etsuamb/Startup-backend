require("dotenv").config();
const pool = require("../config/db");
const mentorController = require("../controllers/mentorControllerComplete");
const mentorshipController = require("../controllers/mentorshipController");
const startupController = require("../controllers/startupController");

function invoke(handler, req) {
	return new Promise((resolve, reject) => {
		const res = {
			statusCode: 200,
			status(code) {
				this.statusCode = code;
				return this;
			},
			json(body) {
				if (this.statusCode >= 400) {
					reject(new Error(`${this.statusCode}: ${body.error || body.message || "Request failed"}`));
					return;
				}
				resolve(body);
			},
		};
		Promise.resolve(handler(req, res)).catch(reject);
	});
}

async function main() {
	let requestId;
	try {
		const profiles = await pool.query(
			`SELECT s.startup_id, s.user_id AS startup_user_id, m.mentor_id, m.user_id AS mentor_user_id
			 FROM startups s
			 CROSS JOIN mentors m
			 ORDER BY s.startup_id, m.mentor_id
			 LIMIT 1`,
		);
		if (!profiles.rowCount) throw new Error("A startup and mentor profile are required for the smoke test");

		const {
			startup_id: startupId,
			startup_user_id: startupUserId,
			mentor_id: mentorId,
			mentor_user_id: mentorUserId,
		} = profiles.rows[0];
		const inserted = await pool.query(
			`INSERT INTO mentorship_requests (startup_id, mentor_id, subject, message, initiated_by)
			 VALUES ($1, $2, $3, $4, 'mentor')
			 RETURNING mentorship_request_id`,
			[startupId, mentorId, "Smoke test mentor proposal", "Temporary verification row"],
		);
		requestId = inserted.rows[0].mentorship_request_id;

		const mentorRequests = await invoke(mentorshipController.getMentorIncomingRequests, {
			user: { user_id: mentorUserId },
		});
		const outbound = mentorRequests.find(
			(request) => Number(request.mentorship_request_id) === Number(requestId),
		);
		if (!outbound || outbound.initiated_by !== "mentor") {
			throw new Error("Temporary proposal was not visible as an outbound mentor offer");
		}

		const options = await invoke(mentorController.getProposalOptions, {
			user: { user_id: mentorUserId },
		});
		if (!Array.isArray(options.focus_areas) || !options.focus_areas.length) {
			throw new Error("Proposal options endpoint did not return focus areas");
		}

		const offers = await invoke(startupController.getStartupOffers, {
			user: { user_id: startupUserId },
		});
		const proposal = offers.offers.find(
			(offer) => offer.offerType === "mentorship" && Number(offer.id) === Number(requestId),
		);
		if (!proposal) throw new Error("Temporary mentor proposal was not visible in startup offers");
		if (proposal.source_direction !== "incoming" || !proposal.canStartupRespond) {
			throw new Error(`Unexpected startup offer direction: ${JSON.stringify(proposal)}`);
		}

		const accepted = await invoke(startupController.updateOfferStatus, {
			user: { user_id: startupUserId },
			params: { offerType: "mentorship", offerId: String(requestId) },
			body: { status: "accepted" },
		});
		if (accepted.offer?.status !== "accepted") throw new Error("Startup acceptance did not persist");

		console.log("PASS: mentor proposal appears in mentor requests, reaches startup offers, and can be accepted");
	} finally {
		if (requestId) {
			await pool.query(
				"DELETE FROM notifications WHERE reference_type = 'mentorship_requests' AND reference_id = $1",
				[requestId],
			);
			await pool.query("DELETE FROM mentorship_requests WHERE mentorship_request_id = $1", [requestId]);
		}
		await pool.end();
	}
}

main().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
