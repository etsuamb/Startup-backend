const chatModerationService = require("../services/chatModerationService");

describe("ChatModerationService", () => {
	test("blocks obvious contact info samples", () => {
		const blocked = [
			"Call me at 0911234567",
			"email me at founder@gmail.com",
			"visit https://example.com",
			"join t.me/myusername",
		];

		for (const text of blocked) {
			const r = chatModerationService.validateMessage(text);
			expect(r.isClean).toBe(false);
			expect(r.rule).toBeTruthy();
		}
	});

	test("allows normal startup messages", () => {
		const allowed = [
			"Let's discuss the term sheet on StartupConnect",
			"Our startup raised 500000 ETB in seed",
		];

		for (const text of allowed) {
			const r = chatModerationService.validateMessage(text);
			expect(r.isClean).toBe(true);
			expect(r.rule).toBeNull();
		}
	});

	test("normalizeForScan collapses obfuscation", () => {
		const { normalizeForScan } = require("../services/chatModerationService");
		const obf = "founder (at) gmail (dot) com";
		const normalized = normalizeForScan(obf);
		expect(normalized).toContain("@");
		expect(normalized).toContain(".");
	});
});
