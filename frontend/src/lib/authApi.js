import { apiFetch, apiPostJson } from "./api";
import { API_BASE } from "./config";
import { getToken } from "./authStorage";

export async function loginRequest(email, password) {
	return apiPostJson("/auth/login", { email, password });
}

export async function validateRegistrationEmail(email) {
	return apiPostJson("/auth/validate-email", { email: email.trim() });
}

export async function startRegistrationEmailVerification(email) {
	return apiPostJson("/auth/registration-email/start", { email: email.trim() });
}

export async function getRegistrationEmailVerificationStatus(verificationId, email) {
	return apiFetch(
		`/auth/registration-email/status?verificationId=${encodeURIComponent(verificationId)}&email=${encodeURIComponent(email.trim())}`,
	);
}

export async function verifyLogin2FA(pendingToken, code, backupCode) {
	return apiPostJson("/auth/login/verify-2fa", {
		pendingToken,
		code: code || undefined,
		backupCode: backupCode || undefined,
	});
}

export async function googleAuth(credential, role, mode = "login") {
	return apiPostJson("/auth/google", { credential, role, mode });
}

export async function googleCompleteRole(googleSignupToken, role) {
	return apiPostJson("/auth/google/complete-role", { googleSignupToken, role });
}

export async function forgotPassword(email) {
	return apiPostJson("/auth/forgot-password", { email });
}

export async function resetPassword(token, newPassword, confirmPassword) {
	return apiPostJson("/auth/reset-password", { token, newPassword, confirmPassword });
}

export async function verifyEmailToken(token, mode) {
	const query = new URLSearchParams({ token });
	if (mode) query.set("mode", mode);
	return apiFetch(`/auth/verify-email?${query.toString()}`);
}

export async function resendVerification(email) {
	return apiPostJson("/auth/resend-verification", { email });
}

export async function getCurrentAccount() {
	return apiFetch("/auth/me");
}

export async function fetchProfilePictureBlob() {
	const token = getToken();
	if (!token) throw new Error("Not authenticated");
	const response = await fetch(`${API_BASE}/auth/profile-picture`, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "image/*,*/*",
		},
	});
	if (!response.ok) throw new Error("Profile picture not found");
	return { blob: await response.blob() };
}

export async function updateProfilePicture(file) {
	const token = getToken();
	if (!token) throw new Error("Not authenticated");
	const formData = new FormData();
	formData.append("profile_picture", file);
	const response = await fetch(`${API_BASE}/auth/profile-picture`, {
		method: "PUT",
		headers: { Authorization: `Bearer ${token}` },
		body: formData,
	});
	const payload = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(payload.message || payload.error || "Unable to update profile picture");
	return payload;
}

export async function updateCurrentAccount(payload) {
	return apiFetch("/auth/me", {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
}

export async function get2FAStatus() {
	return apiFetch("/auth/2fa/status");
}

export async function setup2FA() {
	return apiFetch("/auth/2fa/setup");
}

export async function sendEnable2FAOtp() {
	return apiPostJson("/auth/2fa/send-enable-otp", {});
}

export async function enable2FA(method, code) {
	return apiPostJson("/auth/2fa/enable", { method, code });
}

export async function disable2FA(password, code) {
	return apiPostJson("/auth/2fa/disable", { password, code });
}
