import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Load KEY=VALUE lines from a .env file (no extra dependencies). */
function loadEnvFile(filePath) {
	try {
		if (!fs.existsSync(filePath)) return;
		const text = fs.readFileSync(filePath, "utf8");
		for (const line of text.split(/\r?\n/)) {
			const t = line.trim();
			if (!t || t.startsWith("#")) continue;
			const i = t.indexOf("=");
			if (i < 1) continue;
			const key = t.slice(0, i).trim();
			let value = t.slice(i + 1).trim();
			if (
				(value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))
			) {
				value = value.slice(1, -1);
			}
			process.env[key] = value;
		}
	} catch {
		/* ignore missing or unreadable env files */
	}
}

// Backend .env first, then frontend (frontend overrides)
loadEnvFile(path.join(__dirname, "../backend/.env"));
loadEnvFile(path.join(__dirname, ".env"));
loadEnvFile(path.join(__dirname, ".env.local"));

const backend = process.env.BACKEND_URL || "http://localhost:5000";

const googleClientId = (
	process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
	process.env.GOOGLE_CLIENT_ID ||
	""
).trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
	env: {
		NEXT_PUBLIC_GOOGLE_CLIENT_ID: googleClientId,
	},
	async rewrites() {
		return [
			{
				source: "/api-backend/:path*",
				destination: `${backend}/api/:path*`,
			},
			{
				source: "/uploads/:path*",
				destination: `${backend}/uploads/:path*`,
			},
		];
	},
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{
						key: "Cross-Origin-Opener-Policy",
						value: "same-origin-allow-popups",
					},
				],
			},
		];
	},
};

export default nextConfig;
