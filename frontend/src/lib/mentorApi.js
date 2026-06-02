import { apiFetch, apiFetchBlob, apiPatchJson, apiPostForm, apiPostJson, apiPutForm, apiPutJson } from "./api";

/** Dashboard */
export function fetchMentorDashboard() {
	return apiFetch("/mentors/dashboard");
}

export function fetchMentorProfile() {
	return apiFetch("/mentors/profile");
}

export function updateMentorProfile(body) {
	if (body instanceof FormData) {
		return apiPutForm("/mentors/profile", body);
	}
	return apiPutJson("/mentors/profile", body);
}

export function fetchMentorDocument(documentId) {
	return apiFetchBlob(`/mentors/profile/documents/${documentId}`);
}

/** Mentorship requests */
export function fetchIncomingRequests() {
	return apiFetch("/mentorship/requests/incoming");
}

export function fetchMentorRequest(requestId) {
	return apiFetch(`/mentorship/requests/${requestId}`);
}

export function respondToRequest(requestId, status) {
	return apiPutJson(`/mentorship/requests/${requestId}/respond`, { status });
}

export function acceptRequest(requestId) {
	return apiPutJson(`/mentors/mentorship-requests/${requestId}/accept`, {});
}

export function rejectRequest(requestId, reason) {
	return apiPutJson(`/mentors/mentorship-requests/${requestId}/reject`, { reason });
}

export function sendProposal(body) {
	return apiPostJson("/mentors/proposals", body);
}

export function fetchProposalOptions() {
	return apiFetch("/mentors/proposal-options");
}

/** Startups */
export function browseStartups(params = {}) {
	const q = new URLSearchParams();
	if (params.industry) q.set("industry", params.industry);
	if (params.stage) q.set("stage", params.stage);
	if (params.location) q.set("location", params.location);
	if (params.search) q.set("search", params.search);
	if (params.page) q.set("page", String(params.page));
	if (params.limit) q.set("limit", String(params.limit));
	const qs = q.toString();
	return apiFetch(`/mentors/startups${qs ? `?${qs}` : ""}`);
}

export function fetchStartupFilterOptions() {
	return apiFetch("/mentors/startups/filter-options");
}

export function fetchMyStartups() {
	return apiFetch("/mentors/my-startups");
}

export function fetchStartupDetails(startupId) {
	return apiFetch(`/mentors/startups/${startupId}`);
}

export function fetchStartupDocument(startupId, documentId) {
	return apiFetchBlob(`/mentors/startups/${startupId}/documents/${documentId}`);
}

/** Sessions */
export function fetchMentorSessions() {
	return apiFetch("/mentorship/sessions");
}

export function scheduleSession(body) {
	return apiPostJson("/mentorship/sessions", body);
}

export function updateSession(sessionId, body) {
	return apiPutJson(`/mentorship/sessions/${sessionId}`, body);
}

export async function downloadMentorshipSessionCalendar(sessionId) {
	const { blob, filename } = await apiFetchBlob(`/mentorship/sessions/${sessionId}/calendar.ics`);
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename || `mentorship-session-${sessionId}.ics`;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Reports */
export function fetchMentorReports() {
	return apiFetch("/mentorship/reports");
}

export function submitReport(body) {
	return apiPostJson("/mentorship/reports", body);
}

/** Resources */
export function fetchMentorResources() {
	return apiFetch("/mentorship/resources");
}

export function shareResource(formData) {
	return apiPostForm("/mentorship/resources", formData);
}

/** Payments / earnings */
export function fetchMentorPayments() {
	return apiFetch("/mentorship/payments");
}

/** Mentor chat */
export function fetchMentorConversations() {
	return apiFetch("/mentors/mentor-chat/conversations");
}

export function createMentorConversation(startupId) {
	return apiPostJson("/mentors/mentor-chat/conversations", { startup_id: startupId });
}

export function fetchMentorMessages(conversationId) {
	return apiFetch(`/mentors/mentor-chat/conversations/${conversationId}/messages`);
}

export function sendMentorMessage(conversationId, body) {
	return apiPostJson(`/mentors/mentor-chat/conversations/${conversationId}/messages`, {
		body,
	});
}

export function sendMentorChatFile(conversationId, formData) {
	return apiPostForm(`/mentors/mentor-chat/conversations/${conversationId}/files`, formData);
}

export function downloadMentorChatFile(conversationId, messageId) {
	return apiFetchBlob(`/mentors/mentor-chat/conversations/${conversationId}/files/${messageId}`);
}

export function fetchMentorChatNotifications() {
	return apiFetch("/mentors/mentor-chat/notifications");
}

export function getMentorVideoStatus(conversationId) {
	return apiFetch(`/mentors/mentor-chat/conversations/${conversationId}/video/status`);
}

export function startMentorVideoCall(conversationId) {
	return apiPostJson(`/mentors/mentor-chat/conversations/${conversationId}/video/start`, {});
}

export function joinMentorVideoCall(conversationId) {
	return apiPostJson(`/mentors/mentor-chat/conversations/${conversationId}/video/join`, {});
}

export function endMentorVideoCall(conversationId) {
	return apiPostJson(`/mentors/mentor-chat/conversations/${conversationId}/video/end`, {});
}

export function setMentorVideoScreenShare(conversationId, action) {
	return apiPostJson(`/mentors/mentor-chat/conversations/${conversationId}/video/screen-share`, { action });
}

/** History */
export function fetchMentorshipHistory() {
	return apiFetch("/mentorship/history");
}
