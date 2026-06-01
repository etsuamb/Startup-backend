import { API_BASE } from "./config";
import { getToken } from "./authStorage";

/**
 * Thrown when the backend returns 502/503/504 — typically a Render cold start.
 * Components can check `err instanceof BackendWakingError` to show a warm-up UI.
 */
export class BackendWakingError extends Error {
	constructor() {
		super(
			"The server is waking up from sleep — this usually takes 30–60 seconds. Please wait…"
		);
		this.name = "BackendWakingError";
		this.status = 502;
	}
}

function authHeaders() {
	const t = getToken();
	const h = { Accept: "application/json" };
	if (t) h.Authorization = `Bearer ${t}`;
	return h;
}

function friendlyApiMessage(data, status, fallback) {
	if (data?.code === "EMAIL_NOT_VERIFIED") {
		return "Please verify your email before using this feature. Check your inbox for the verification link, or use the resend verification option on the login page.";
	}
	if (data?.code === "CHAT_REQUIRES_ACCEPTED_OFFER") {
		return "Messaging unlocks after both sides are connected by an accepted offer or request. Send an offer first, or accept the incoming offer/request, then come back to messages.";
	}

	const raw = data && (data.message || data.error || data.raw);
	if (typeof raw === "string") {
		if (/^access denied$/i.test(raw.trim())) {
			return "Access denied. Sign in with an administrator account to use the admin dashboard.";
		}
		if (/chat is available only after|video calls require an accepted|accepted investment relationship|accepted mentorship/i.test(raw)) {
			return /mentor|mentorship/i.test(raw)
				? "Messaging unlocks after the mentorship request is accepted. Send or accept the mentorship request first, then you can chat."
				: "Messaging unlocks after an investment offer or request is accepted. Send an offer or accept the incoming request first, then you can chat.";
		}
		if (/account pending admin approval/i.test(raw)) {
			return "Your account is waiting for admin approval. You can continue reviewing your profile, but actions are locked until an administrator approves your account.";
		}
		if (/must verify their email address before admin approval/i.test(raw)) {
			return "This account cannot be approved yet because the email address has not been verified.";
		}
		return raw;
	}

	if (status === 403) {
		if (typeof window !== "undefined" && window.location?.pathname?.startsWith("/admin")) {
			return "Access denied. Sign in with an administrator account to use the admin dashboard.";
		}
		return "You cannot use this feature yet. Your email must be verified and your account must be approved by an administrator.";
	}

	return fallback || "Request failed";
}

/** Wait `ms` milliseconds — used for retry back-off */
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Core fetch — single attempt, no retry.
 * Throws BackendWakingError on 502/503/504 so callers can handle warm-up.
 */
async function apiFetchOnce(path, options = {}) {
	const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
	const headers = { ...authHeaders(), ...(options.headers || {}) };
	let res;
	try {
		res = await fetch(url, { ...options, headers });
	} catch (error) {
		const err = new Error("Unable to reach the server. Check your connection and try again.");
		err.cause = error;
		throw err;
	}

	// 502 / 503 / 504 → Render cold-start — throw a special error
	if (res.status === 502 || res.status === 503 || res.status === 504) {
		throw new BackendWakingError();
	}

	const text = await res.text();
	let data;
	try {
		data = text ? JSON.parse(text) : null;
	} catch {
		data = { raw: text };
	}
	if (!res.ok) {
		const chapaMessage = data?.chapa_message
			? typeof data.chapa_message === "string"
				? data.chapa_message
				: JSON.stringify(data.chapa_message)
			: null;
		const err = new Error(
			chapaMessage ||
				friendlyApiMessage(data, res.status, res.statusText),
		);
		err.status = res.status;
		err.data = data;
		err.code = data?.code;
		throw err;
	}
	return data;
}

/**
 * Public fetch helper — retries up to 3 times on BackendWakingError
 * with exponential back-off (2 s → 4 s → 8 s).
 * On the last retry failure it re-throws the BackendWakingError so the
 * error boundary / component can display a "still waking up" UI.
 */
export async function apiFetch(path, options = {}) {
	const MAX_RETRIES = 3;
	const BASE_DELAY_MS = 2000;
	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		try {
			return await apiFetchOnce(path, options);
		} catch (err) {
			if (err instanceof BackendWakingError && attempt < MAX_RETRIES) {
				await sleep(BASE_DELAY_MS * Math.pow(2, attempt)); // 2 s, 4 s, 8 s
				continue;
			}
			throw err;
		}
	}
}

export async function apiPostJson(path, body) {
	return apiFetch(path, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

export async function apiPostForm(path, formData) {
	return apiFetch(path, {
		method: "POST",
		body: formData,
	});
}

export async function apiPutForm(path, formData) {
	return apiFetch(path, {
		method: "PUT",
		body: formData,
	});
}

export async function apiPutJson(path, body) {
	return apiFetch(path, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

export async function apiPatchJson(path, body) {
	return apiFetch(path, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

export async function apiFetchBlob(path) {
	const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
	let res;
	try {
		res = await fetch(url, {
			headers: authHeaders(),
		});
	} catch (error) {
		const err = new Error("Unable to reach the server. Check your connection and try again.");
		err.cause = error;
		throw err;
	}
	if (!res.ok) {
		const text = await res.text();
		let data;
		try {
			data = text ? JSON.parse(text) : null;
		} catch {
			data = { raw: text };
		}
		const err = new Error(friendlyApiMessage(data, res.status, res.statusText));
		err.code = data?.code;
		err.status = res.status;
		err.data = data;
		throw err;
	}
	const blob = await res.blob();
	return {
		blob,
		contentType: res.headers.get("Content-Type") || "application/octet-stream",
		filename: res.headers.get("Content-Disposition")?.match(/filename="?([^";]+)"?/)?.[1] || path.split("/").pop(),
	};
}

export async function loginRequest(email, password) {
	return apiPostJson("/auth/login", { email, password });
}

export async function registerMultipart(formData) {
	return apiPostForm("/auth/register", formData);
}
