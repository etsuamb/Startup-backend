import { apiFetch, apiPatchJson, apiPutJson } from "./api";
import { API_BASE } from "./config";
import { getToken } from "./authStorage";

/** Dashboard analytics & entity management (`/admin/dashboard/*`) */
export function fetchSystemAnalytics() {
	return apiFetch("/admin/dashboard/analytics/system");
}

export function fetchStartupAnalytics() {
	return apiFetch("/admin/dashboard/analytics/startups");
}

export function fetchFundingAnalytics() {
	return apiFetch("/admin/dashboard/analytics/funding");
}

export function fetchEngagementAnalytics() {
	return apiFetch("/admin/dashboard/analytics/engagement");
}

export function fetchDashboardStartups(params = {}) {
	const q = new URLSearchParams();
	if (params.status) q.set("status", params.status);
	if (params.listed) q.set("listed", params.listed);
	if (params.account) q.set("account", params.account);
	if (params.limit) q.set("limit", String(params.limit));
	if (params.offset) q.set("offset", String(params.offset));
	const qs = q.toString();
	return apiFetch(`/admin/dashboard/startups${qs ? `?${qs}` : ""}`);
}

export function fetchDashboardStartup(startupId) {
	return apiFetch(`/admin/dashboard/startups/${startupId}`);
}

export function updateStartupStatus(startupId, status, comment) {
	return apiPatchJson(`/admin/dashboard/startups/${startupId}/status`, {
		status,
		comment,
	});
}

export function fetchDashboardMentors(params = {}) {
	const q = new URLSearchParams();
	if (params.approval) q.set("approval", params.approval);
	if (params.listed) q.set("listed", params.listed);
	if (params.account) q.set("account", params.account);
	if (params.limit) q.set("limit", String(params.limit));
	const qs = q.toString();
	return apiFetch(`/admin/dashboard/mentors${qs ? `?${qs}` : ""}`);
}

export function updateMentorApproval(mentorId, approved, reason) {
	return apiPatchJson(`/admin/dashboard/mentors/${mentorId}/approval`, {
		approved,
		reason,
	});
}

export function fetchDashboardInvestors(params = {}) {
	const q = new URLSearchParams();
	if (params.approval) q.set("approval", params.approval);
	if (params.listed) q.set("listed", params.listed);
	if (params.account) q.set("account", params.account);
	if (params.limit) q.set("limit", String(params.limit));
	const qs = q.toString();
	return apiFetch(`/admin/dashboard/investors${qs ? `?${qs}` : ""}`);
}

export function updateInvestorApproval(investorId, approved, reason) {
	return apiPatchJson(`/admin/dashboard/investors/${investorId}/approval`, {
		approved,
		reason,
	});
}

/** User approval workflow (`/admin/users/*`) */
export function fetchPendingUsers() {
	return apiFetch("/admin/users/pending");
}

export function fetchPendingUser(userId) {
	return apiFetch(`/admin/users/pending/${userId}`);
}

export function approveUser(userId, comment) {
	return apiPutJson(`/admin/users/approve/${userId}`, { comment });
}

export function rejectUser(userId, reason) {
	return apiPutJson(`/admin/users/reject/${userId}`, { reason });
}

export function searchUsers({ q, role, limit = 50, offset = 0 } = {}) {
	const params = new URLSearchParams();
	if (q) params.set("q", q);
	if (role) params.set("role", role);
	params.set("limit", String(limit));
	params.set("offset", String(offset));
	const qs = params.toString();
	return apiFetch(`/admin/users${qs ? `?${qs}` : ""}`);
}

export function fetchUser(userId) {
	return apiFetch(`/admin/users/${userId}`);
}

export function suspendUser(userId, reason = "") {
	return apiFetch(`/admin/users/${userId}/suspend`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ reason }),
	});
}

export function unsuspendUser(userId) {
	return apiFetch(`/admin/users/${userId}/unsuspend`, { method: "POST" });
}

export function deleteUser(userId, { hard = false } = {}) {
	const qs = hard ? "?hard=true" : "";
	return apiFetch(`/admin/users/${userId}${qs}`, { method: "DELETE" });
}

async function fetchAdminDocumentBlob(documentId, path) {
	const token = getToken();
	if (!token) throw new Error("Not authenticated");
	const url = `${API_BASE}${path}`;
	const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
	if (!res.ok) {
		let message = "Could not open document";
		try {
			const data = await res.json();
			message = data.message || data.error || message;
		} catch {
			/* ignore */
		}
		const err = new Error(message);
		err.status = res.status;
		throw err;
	}
	return res.blob();
}

/** Open a pending user's uploaded file in a new tab (auth required). */
export async function openAdminDocument(documentId, { isMentorDocument = false } = {}) {
	const primary = isMentorDocument
		? `/admin/mentor-documents/${documentId}`
		: `/admin/documents/${documentId}`;
	const fallback = isMentorDocument
		? `/admin/documents/${documentId}`
		: `/admin/mentor-documents/${documentId}`;

	let blob;
	try {
		blob = await fetchAdminDocumentBlob(documentId, primary);
	} catch (ex) {
		if (ex.status === 404) {
			blob = await fetchAdminDocumentBlob(documentId, fallback);
		} else {
			throw ex;
		}
	}

	const blobUrl = URL.createObjectURL(blob);
	window.open(blobUrl, "_blank", "noopener,noreferrer");
	setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

/** Legacy admin helpers */
export function fetchReportsOverview() {
	return apiFetch("/admin/reports/overview");
}

export function fetchMaintenanceStatus() {
	return apiFetch("/admin/maintenance/status");
}

// Public platform categories (industries, etc.)
export function fetchPlatformCategories(type) {
	const q = type ? `?type=${encodeURIComponent(type)}` : "";
	return apiFetch(`/platform/categories${q}`);
}
export function clearOldAuditLogs(days = 365) {
	return apiFetch("/admin/maintenance/clear-audit-logs", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ days }),
	});
}

export function fetchAuditLogs({ limit = 100, offset = 0 } = {}) {
	const q = new URLSearchParams();
	q.set("limit", String(limit));
	q.set("offset", String(offset));
	return apiFetch(`/admin/audit-logs?${q.toString()}`);
}

/** Investments oversight */
export function fetchInvestmentRequests() {
	return apiFetch("/admin/investment-requests");
}

export function updateInvestmentRequestStatus(id, status, comment = "") {
	return apiPutJson(`/admin/investment-requests/${id}/status`, { status, comment });
}

export function fetchInvestments({ limit = 100, offset = 0 } = {}) {
	const q = new URLSearchParams();
	q.set("limit", String(limit));
	q.set("offset", String(offset));
	return apiFetch(`/admin/investments?${q.toString()}`);
}

export function fetchDashboardFunding(params = {}) {
	const q = new URLSearchParams();
	if (params.status) q.set("status", params.status);
	if (params.limit) q.set("limit", String(params.limit));
	if (params.offset) q.set("offset", String(params.offset));
	const qs = q.toString();
	return apiFetch(`/admin/dashboard/funding${qs ? `?${qs}` : ""}`);
}

export function updateFundingApproval(fundingId, status, comment = "") {
	return apiPatchJson(`/admin/dashboard/funding/${fundingId}/approval`, { status, comment });
}

/** Server-side CSV exports */
export async function downloadReportExport(type) {
	const token = getToken();
	if (!token) throw new Error("Not authenticated");
	const url = `${API_BASE}/admin/reports/export?type=${encodeURIComponent(type)}`;
	const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
	if (!res.ok) {
		let message = "Export failed";
		try {
			const data = await res.json();
			message = data.message || data.error || message;
		} catch {
			/* ignore */
		}
		throw new Error(message);
	}
	const blob = await res.blob();
	const blobUrl = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = blobUrl;
	a.download = `${type}_report.csv`;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

export async function downloadAuditLogsExport({ since, until } = {}) {
	const token = getToken();
	if (!token) throw new Error("Not authenticated");
	const q = new URLSearchParams();
	if (since) q.set("since", since);
	if (until) q.set("until", until);
	const url = `${API_BASE}/admin/audit-logs/export${q.toString() ? `?${q}` : ""}`;
	const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
	if (!res.ok) throw new Error("Audit export failed");
	const blob = await res.blob();
	const blobUrl = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = blobUrl;
	a.download = "audit_logs.csv";
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

export function scheduleReport(type, runAt = "") {
	return apiFetch("/admin/reports/schedule", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ type, run_at: runAt }),
	});
}

export function fetchMentorshipOverview() {
	return apiFetch("/admin/mentorship/overview");
}

/** Payments monitoring */
export function fetchPayments(params = {}) {
	const q = new URLSearchParams();
	if (params.status) q.set("status", params.status);
	if (params.payment_method) q.set("payment_method", params.payment_method);
	if (params.page) q.set("page", String(params.page));
	if (params.limit) q.set("limit", String(params.limit));
	const qs = q.toString();
	return apiFetch(`/admin/payments${qs ? `?${qs}` : ""}`);
}

export function fetchPaymentStats() {
	return apiFetch("/admin/payments/stats");
}

/** Chat moderation monitoring */
export function fetchChatModerationLogs(params = {}) {
	const q = new URLSearchParams();
	if (params.limit) q.set("limit", String(params.limit));
	if (params.offset) q.set("offset", String(params.offset));
	if (params.user_id) q.set("user_id", String(params.user_id));
	if (params.channel) q.set("channel", String(params.channel));
	const qs = q.toString();
	return apiFetch(`/admin/chat-moderation/logs${qs ? `?${qs}` : ""}`);
}

export function fetchChatViolations() {
	return apiFetch("/admin/chat-moderation/violations");
}

export function fetchChatModerationStats(hours = 24) {
	return apiFetch(`/admin/chat-moderation/stats?hours=${encodeURIComponent(String(hours))}`);
}

export function suspendUserChat(userId, { hours = 72, notes = "" } = {}) {
	return apiFetch(`/admin/chat-moderation/users/${userId}/suspend`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ hours, notes }),
	});
}

export function unsuspendUserChat(userId, { notes = "" } = {}) {
	return apiFetch(`/admin/chat-moderation/users/${userId}/unsuspend`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ notes }),
	});
}

export function warnChatUser(userId, message) {
	return apiFetch(`/admin/chat-moderation/users/${userId}/warn`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ message }),
	});
}

/** Monitoring: failed logins and security events (dashboard APIs) */
export function fetchMonitoringSummary(hours = 24) {
	return apiFetch(`/admin/dashboard/monitoring/summary?hours=${encodeURIComponent(String(hours))}`);
}

export function fetchLoginAttempts(params = {}) {
	const q = new URLSearchParams();
	if (params.limit) q.set("limit", String(params.limit));
	if (params.offset) q.set("offset", String(params.offset));
	if (params.email) q.set("email", String(params.email));
	if (params.ip) q.set("ip", String(params.ip));
	if (params.success !== undefined) q.set("success", String(params.success));
	const qs = q.toString();
	return apiFetch(`/admin/dashboard/monitoring/login-attempts${qs ? `?${qs}` : ""}`);
}

export function fetchSecurityEvents(params = {}) {
	const q = new URLSearchParams();
	if (params.limit) q.set("limit", String(params.limit));
	if (params.offset) q.set("offset", String(params.offset));
	if (params.type) q.set("type", String(params.type));
	if (params.severity) q.set("severity", String(params.severity));
	const qs = q.toString();
	return apiFetch(`/admin/dashboard/monitoring/security-events${qs ? `?${qs}` : ""}`);
}

/** Admin password change with email verification */
export function changeAdminPassword(currentPassword, newPassword) {
	return apiPutJson("/auth/admin/change-password", {
		currentPassword,
		newPassword,
	});
}

/** Admin notification management */
export function fetchNotifications() {
	return apiFetch("/notifications");
}

export function markNotificationRead(id) {
	return apiPatchJson(`/notifications/${id}`, { is_read: true });
}

export function markAllNotificationsRead() {
	return apiPutJson("/notifications/mark-all-read", {});
}

export function fetchUnreadNotificationCount() {
	return apiFetch("/notifications/unread-count");
}

/** Active session management */
export function fetchActiveSessions() {
	return apiFetch("/auth/sessions");
}

export function revokeActiveSession(token) {
	return apiFetch(`/auth/sessions/${token}`, {
		method: "DELETE",
	});
}

export function revokeAllOtherSessions(currentToken = "") {
	return apiFetch("/auth/sessions", {
		method: "DELETE",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ currentToken }),
	});
}

/** Document verification (dashboard) */
export function fetchDashboardDocuments(params = {}) {
	const q = new URLSearchParams();
	if (params.status) q.set("status", params.status);
	if (params.limit) q.set("limit", String(params.limit || 100));
	const qs = q.toString();
	return apiFetch(`/admin/dashboard/documents${qs ? `?${qs}` : ""}`);
}

export function updateDocumentVerification(documentId, verification_status, notes = "", source = "document") {
	return apiPatchJson(`/admin/dashboard/documents/${documentId}/verification`, {
		verification_status,
		notes,
		source,
	});
}

/** Projects / content */
export function fetchAdminProjects(params = {}) {
	const q = new URLSearchParams();
	if (params.limit) q.set("limit", String(params.limit));
	if (params.offset) q.set("offset", String(params.offset));
	const qs = q.toString();
	return apiFetch(`/admin/projects${qs ? `?${qs}` : ""}`);
}

export function updateProjectStatus(projectId, status) {
	return apiPutJson(`/admin/projects/${projectId}/status`, { status });
}

export function removeProject(projectId) {
	return apiFetch(`/admin/projects/${projectId}`, { method: "DELETE" });
}

export function restoreProject(projectId) {
	return apiFetch(`/admin/projects/${projectId}/restore`, { method: "PUT" });
}

/** Mentorship admin */
export function fetchMentorshipRequests() {
	return apiFetch("/admin/mentorship/requests");
}

export function fetchMentorshipSessions() {
	return apiFetch("/admin/mentorship/sessions");
}

export function fetchMentorshipReports() {
	return apiFetch("/admin/mentorship/reports");
}

export function fetchMentorshipPayments() {
	return apiFetch("/admin/mentorship/payments");
}

/** User extended */
export function fetchUserAuditLogs(userId, params = {}) {
	const q = new URLSearchParams();
	if (params.limit) q.set("limit", String(params.limit));
	if (params.offset) q.set("offset", String(params.offset));
	const qs = q.toString();
	return apiFetch(`/admin/users/${userId}/audit-logs${qs ? `?${qs}` : ""}`);
}

export function verifyUserEmail(userId) {
	return apiFetch(`/admin/users/${userId}/verify-email`, { method: "POST" });
}

export function restoreUser(userId) {
	return apiFetch(`/admin/users/${userId}/restore`, { method: "POST" });
}

/** Investment disputes */
export function fetchInvestmentDisputes() {
	return apiFetch("/admin/investment-disputes");
}

export function createInvestmentDispute(body) {
	return apiFetch("/admin/investment-disputes", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

export function resolveInvestmentDispute(id, status, resolution_notes = "") {
	return apiPatchJson(`/admin/investment-disputes/${id}`, { status, resolution_notes });
}

export function verifyInvestmentRequest(id) {
	return apiFetch(`/admin/investment-requests/${id}/verify-legitimacy`, { method: "POST" });
}

export function verifyInvestment(id) {
	return apiFetch(`/admin/investments/${id}/verify-legitimacy`, { method: "POST" });
}

/** Payments extended */
export function fetchPaymentById(paymentId) {
	return apiFetch(`/admin/payments/${paymentId}`);
}

export function refundPayment(paymentId, notes = "") {
	return apiFetch(`/admin/payments/${paymentId}/refund`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ notes }),
	});
}

export function flagPayment(paymentId, suspicious = true, notes = "") {
	return apiFetch(`/admin/payments/${paymentId}/flag`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ suspicious, notes }),
	});
}

export function recordChargeback(paymentId, notes = "") {
	return apiFetch(`/admin/payments/${paymentId}/chargeback`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ notes }),
	});
}

export function fetchSuspiciousPayments() {
	return apiFetch("/admin/payments/suspicious");
}

/** Content flags */
export function fetchContentFlags(status = "pending") {
	return apiFetch(`/admin/content/flags?status=${encodeURIComponent(status)}`);
}

export function reviewContentFlag(flagId, status, notes = "") {
	return apiPatchJson(`/admin/content/flags/${flagId}`, { status, notes });
}

export function flagProjectContent(projectId, reason = "") {
	return apiFetch(`/admin/content/projects/${projectId}/flag`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ reason }),
	});
}

/** Reports extended */
export function fetchFinancialReport() {
	return apiFetch("/admin/reports/financial");
}

export function fetchUsageReport(days = 30) {
	return apiFetch(`/admin/reports/usage?days=${encodeURIComponent(String(days))}`);
}

export function fetchKpiReport() {
	return apiFetch("/admin/reports/kpi");
}

/** Platform & maintenance */
export function fetchPlatformSettings() {
	return apiFetch("/admin/platform/settings");
}

export function updatePlatformSettings(value, key = "platform_config") {
	return apiFetch("/admin/platform/settings", {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ key, value }),
	});
}

export function fetchCategories(type) {
	const q = type ? `?type=${encodeURIComponent(type)}` : "";
	return apiFetch(`/admin/platform/categories${q}`);
}

export function suggestPlatformCategory(body) {
  return apiPostJson(`/platform/categories/suggest`, body);
}

export function createCategory(body) {
	return apiFetch("/admin/platform/categories", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

export function updateCategory(id, body) {
	return apiPatchJson(`/admin/platform/categories/${id}`, body);
}

export function deleteCategory(id) {
	return apiFetch(`/admin/platform/categories/${id}`, { method: "DELETE" });
}

export function fetchBackupStatus() {
	return apiFetch("/admin/maintenance/backup");
}

export function triggerBackup() {
	return apiFetch("/admin/maintenance/backup", { method: "POST" });
}

export function fetchErrorLogs(limit = 100) {
	return apiFetch(`/admin/maintenance/error-logs?limit=${encodeURIComponent(String(limit))}`);
}

export function fetchFraudSummary() {
	return apiFetch("/admin/monitoring/fraud-summary");
}

