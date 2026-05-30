/** Public Google OAuth client ID (must match backend GOOGLE_CLIENT_ID). */
export const GOOGLE_CLIENT_ID =
	(typeof process !== "undefined" && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim()) || "";

export function isGoogleAuthConfigured() {
	return GOOGLE_CLIENT_ID.length > 0;
}
