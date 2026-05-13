const fs = require("fs");
const p =
	"C:/Users/Hp/Documents/startup-connect/Startup-backend/backend/StartupConnect Backend API.postman_collection.json";
const col = JSON.parse(fs.readFileSync(p, "utf8"));
const items = [];
function walk(arr) {
	arr.forEach((i) => {
		if (i.request) {
			const method = i.request.method || "";
			const url =
				(i.request.url &&
					(i.request.url.raw ||
						(i.request.url.path && "/" + i.request.url.path.join("/")))) ||
				"";
			const bodyMode = (i.request.body && i.request.body.mode) || "";
			items.push({ name: i.name, method, url, bodyMode });
		}
		if (i.item) walk(i.item);
	});
}
walk(col.item);
const checks = [
	{ name: "Auth register", path: "/api/auth/register" },
	{ name: "Auth login", path: "/api/auth/login" },
	{ name: "Startup profile", path: "/api/startups/profile" },
	{ name: "Mentor profile", path: "/api/mentors/profile" },
	{ name: "Get mentor by id", path: "/api/mentors/:mentorId" },
	{
		name: "Admin mentor document download",
		path: "/api/admin/mentor-documents/",
	},
	{ name: "Mentorship requests (create)", path: "/api/mentorship/requests" },
	{ name: "Outgoing requests", path: "/api/mentorship/requests/outgoing" },
	{ name: "Incoming requests", path: "/api/mentorship/requests/incoming" },
	{ name: "Respond to request (respond)", path: "/respond" },
	{ name: "Mentorship sessions", path: "/api/mentorship/sessions" },
	{ name: "Mentorship history", path: "/api/mentorship/history" },
	{ name: "Mentorship reports", path: "/api/mentorship/reports" },
	{ name: "Mentorship resources", path: "/api/mentorship/resources" },
	{ name: "Mentorship payments", path: "/api/mentorship/payments" },
	{ name: "Projects create", path: "/api/projects/create" },
	{ name: "Projects all", path: "/api/projects/all" },
	{ name: "Investors profile", path: "/api/investors/profile" },
	{ name: "Notifications base", path: "/api/notifications" },
	{ name: "Test dashboard", path: "/api/test/dashboard" },
];
const results = checks.map((c) => {
	const found = items.find((it) => it.url && it.url.includes(c.path));
	return {
		check: c.name,
		path: c.path,
		found: !!found,
		sample: found
			? { url: found.url, method: found.method, bodyMode: found.bodyMode }
			: null,
	};
});
const mentorCreate = items.find(
	(it) =>
		it.url && it.url.includes("/api/mentors/profile") && it.method === "POST",
);
console.log(
	JSON.stringify(
		{
			totalRequests: items.length,
			checks: results,
			mentorCreate: mentorCreate || null,
		},
		null,
		2,
	),
);
