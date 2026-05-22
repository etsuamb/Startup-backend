/** @type {import('next').NextConfig} */
const backend = process.env.BACKEND_URL || "http://localhost:5000";

const nextConfig = {
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
};

export default nextConfig;
