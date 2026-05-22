const TOKEN = "sc_access_token";
const REFRESH = "sc_refresh_token";
const ROLE = "sc_role";
const USER_NAME = "sc_user_name";

export function getToken() {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(TOKEN);
}

export function getRefreshToken() {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(REFRESH);
}

export function getRole() {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(ROLE);
}

export function getUserName() {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(USER_NAME);
}

export function setSession({ token, refreshToken, role, userName }) {
	if (typeof window === "undefined") return;
	if (token != null) localStorage.setItem(TOKEN, token);
	if (refreshToken != null) localStorage.setItem(REFRESH, refreshToken);
	if (role != null) localStorage.setItem(ROLE, role);
	if (userName != null) localStorage.setItem(USER_NAME, userName);
}

export function clearSession() {
	if (typeof window === "undefined") return;
	localStorage.removeItem(TOKEN);
	localStorage.removeItem(REFRESH);
	localStorage.removeItem(ROLE);
	localStorage.removeItem(USER_NAME);
}
