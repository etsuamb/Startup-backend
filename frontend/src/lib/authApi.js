import { apiFetch, apiPostJson } from "./api";

export async function loginRequest(email, password) {
	return apiPostJson("/auth/login", { email, password });
}

export async function validateRegistrationEmail(email) {
	return apiPostJson("/auth/validate-email", { email: email.trim() });
}

export async function verifyLogin2FA(pendingToken, code, backupCode) {
	return apiPostJson("/auth/login/verify-2fa", {
		pendingToken,
		code: code || undefined,
		backupCode: backupCode || undefined,
	});
}

export async function googleAuth(credential, role) {
	return apiPostJson("/auth/google", { credential, role });
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

export async function verifyEmailToken(token) {
	return apiFetch(`/auth/verify-email?token=${encodeURIComponent(token)}`);
}

export async function resendVerification(email) {
	return apiPostJson("/auth/resend-verification", { email });
}

export async function getCurrentAccount() {
	return apiFetch("/auth/me");
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
