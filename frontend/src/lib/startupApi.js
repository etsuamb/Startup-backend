import { apiFetch, apiFetchBlob, apiPatchJson, apiPostJson, apiPutJson, apiPostForm, apiPutForm } from "./api";
export {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationAsRead,
} from "./notificationApi";

function buildQuery(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}

export async function getStartupProfile() {
  return apiFetch("/startups/me");
}

export async function getStartupDashboardInfo() {
  return apiFetch("/startups/dashboard/info");
}

export async function getStartupDashboardStatus() {
  return apiFetch("/startups/dashboard/status");
}

export async function getStartupProjectProgress() {
  return apiFetch("/startups/dashboard/project-progress");
}

export async function getStartupFundingSummary() {
  return apiFetch("/startups/dashboard/funding-summary");
}

export async function getStartupDocumentsStatus() {
  return apiFetch("/startups/dashboard/documents-status");
}

export async function getStartupLatestFeedback(params = {}) {
  const query = buildQuery(params);
  return apiFetch(`/startups/dashboard/feedback${query ? `?${query}` : ""}`);
}

export async function getStartupUpcomingEvents() {
  return apiFetch("/startups/dashboard/events");
}

export async function getStartupRecentActivity(params = {}) {
  const query = buildQuery(params);
  return apiFetch(`/startups/dashboard/activity${query ? `?${query}` : ""}`);
}

export async function updateStartupProfile(payload) {
  return apiPutForm("/startups/profile", payload);
}

export async function getStartupDocuments() {
  return apiFetch("/startups/documents");
}

export async function getMyProjects() {
  return apiFetch("/startups/projects");
}

export async function getDocuments(params = {}) {
  const query = buildQuery(params);
  return apiFetch(`/startups/documents${query ? `?${query}` : ""}`);
}

export async function uploadDocument(formData) {
  return apiPostForm("/startups/documents", formData);
}

export async function deleteDocument(documentId) {
  return apiFetch(`/startups/documents/${documentId}`, { method: "DELETE" });
}

export async function publishProject(projectId) {
  return apiPostJson(`/startups/projects/${projectId}/publish`, {});
}

export async function searchInvestors(params = {}) {
  const { query, ...rest } = params;
  const search = params.search ?? query;
  const queryString = buildQuery({ ...rest, search });
  return apiFetch(`/startups/investors/search?${queryString}`);
}

export async function searchMentors(params = {}) {
  const { query, ...rest } = params;
  const search = params.search ?? query;
  const queryString = buildQuery({ ...rest, search });
  return apiFetch(`/startups/mentors/search?${queryString}`);
}

/** Discover detail with relationship-based contact unlock */
export async function getDiscoverInvestor(investorId) {
  return apiFetch(`/startups/discover/investors/${investorId}`);
}

export async function getDiscoverMentor(mentorId) {
  return apiFetch(`/startups/discover/mentors/${mentorId}`);
}

export async function getInvestorRecommendations(params = {}) {
  const query = buildQuery(params);
  return apiFetch(`/startups/recommendations/investors${query ? `?${query}` : ""}`);
}

export async function getMentorRecommendations() {
  return apiFetch("/startups/recommendations/mentors");
}

export async function createInvestmentRequest(payload) {
  return apiPostJson("/startups/investment-requests", payload);
}

export async function createMentorshipRequest(payload) {
  return apiPostJson("/startups/mentorship-requests", payload);
}

export async function getMentorshipResources() {
  return apiFetch("/mentorship/resources");
}

export async function getMentorshipReports() {
  return apiFetch("/mentorship/reports");
}

export async function sendInvestorMessage(investorId, message) {
  return apiPostJson(`/startups/chat/investors/${investorId}/send`, { message });
}

export async function getInvestorMessages(investorId, params = {}) {
  const query = buildQuery(params);
  return apiFetch(`/startups/chat/investors/${investorId}/messages?${query}`);
}

export async function getInvestorChatConversations() {
  return apiFetch("/chat/conversations");
}

export async function createInvestorChatConversation(investorId) {
  return apiPostJson("/chat/conversations", { investor_id: investorId });
}

export async function getInvestorChatMessages(conversationId, params = {}) {
  const query = buildQuery(params);
  return apiFetch(`/chat/conversations/${conversationId}/messages${query ? `?${query}` : ""}`);
}

export async function sendInvestorChatMessage(conversationId, body) {
  return apiPostJson(`/chat/conversations/${conversationId}/messages`, { body });
}

export async function sendInvestorChatFile(conversationId, formData) {
  return apiPostForm(`/chat/conversations/${conversationId}/files`, formData);
}

export async function downloadInvestorChatFile(conversationId, messageId) {
  return apiFetchBlob(`/chat/conversations/${conversationId}/files/${messageId}`);
}

export async function getInvestorVideoStatus(conversationId) {
  return apiFetch(`/chat/conversations/${conversationId}/video/status`);
}

export async function startInvestorVideoCall(conversationId) {
  return apiPostJson(`/chat/conversations/${conversationId}/video/start`, {});
}

export async function joinInvestorVideoCall(conversationId) {
  return apiPostJson(`/chat/conversations/${conversationId}/video/join`, {});
}

export async function endInvestorVideoCall(conversationId) {
  return apiPostJson(`/chat/conversations/${conversationId}/video/end`, {});
}

export async function getMentorChatConversations() {
  return apiFetch("/startups/mentor-chat/conversations");
}

export async function createMentorChatConversation(mentorId) {
  return apiPostJson("/startups/mentor-chat/conversations", { mentor_id: mentorId });
}

export async function getMentorChatMessages(conversationId, params = {}) {
  const query = buildQuery(params);
  return apiFetch(`/startups/mentor-chat/conversations/${conversationId}/messages${query ? `?${query}` : ""}`);
}

export async function sendMentorChatMessage(conversationId, body) {
  return apiPostJson(`/startups/mentor-chat/conversations/${conversationId}/messages`, { body });
}

export async function sendMentorChatFile(conversationId, formData) {
  return apiPostForm(`/startups/mentor-chat/conversations/${conversationId}/files`, formData);
}

export async function downloadMentorChatFile(conversationId, messageId) {
  return apiFetchBlob(`/startups/mentor-chat/conversations/${conversationId}/files/${messageId}`);
}

export async function getMentorVideoStatus(conversationId) {
  return apiFetch(`/startups/mentor-chat/conversations/${conversationId}/video/status`);
}

export async function startMentorVideoCall(conversationId) {
  return apiPostJson(`/startups/mentor-chat/conversations/${conversationId}/video/start`, {});
}

export async function joinMentorVideoCall(conversationId) {
  return apiPostJson(`/startups/mentor-chat/conversations/${conversationId}/video/join`, {});
}

export async function endMentorVideoCall(conversationId) {
  return apiPostJson(`/startups/mentor-chat/conversations/${conversationId}/video/end`, {});
}

export async function setMentorVideoScreenShare(conversationId, action) {
  return apiPostJson(`/startups/mentor-chat/conversations/${conversationId}/video/screen-share`, { action });
}

export async function setInvestorVideoScreenShare(conversationId, action) {
  return apiPostJson(`/chat/conversations/${conversationId}/video/screen-share`, { action });
}

export async function getDashboardActivities(params = {}) {
  const query = buildQuery(params);
  return apiFetch(`/startup-dashboard/activity?${query}`);
}

export async function getDashboardFeedback(params = {}) {
  const query = buildQuery(params);
  return apiFetch(`/startup-dashboard/feedback?${query}`);
}

export async function getDashboardEvents() {
  return apiFetch(`/startup-dashboard/events`);
}

export async function getProjectDetails(projectId) {
  return apiFetch(`/startups/projects/${projectId}`);
}

export async function createProject(project) {
  if (project instanceof FormData) {
    return apiPostForm("/startups/projects", project);
  }
  return apiPostJson("/startups/projects", project);
}

export async function updateProject(projectId, project) {
  if (project instanceof FormData) {
    return apiPutForm(`/startups/projects/${projectId}`, project);
  }
  return apiPutJson(`/startups/projects/${projectId}`, project);
}

export async function deleteProject(projectId) {
  return apiFetch(`/startups/projects/${projectId}`, { method: "DELETE" });
}

export async function getStartupOffers(params = {}) {
  const query = buildQuery(params);
  return apiFetch(`/startups/offers?${query}`);
}

export async function getOfferDetails(offerType, offerId) {
  return apiFetch(`/startups/offers/${offerType}/${offerId}`);
}

export async function updateOfferStatus(offerType, offerId, status) {
  const normalized =
    status === "accept" || status === "accepted"
      ? "accepted"
      : status === "reject" || status === "rejected"
        ? "rejected"
        : status;
  return apiPatchJson(`/startups/offers/${offerType}/${offerId}`, { status: normalized });
}

export async function getMentorshipPaymentItems() {
  return apiFetch("/payments/mentorship-items");
}

export async function createMentorshipChapaPayment(payload) {
  return apiPostJson("/payments/chapa/mentorship-hosted", payload);
}

export async function verifyChapaPayment(txRef) {
  return apiFetch(`/payments/chapa/verify/${encodeURIComponent(txRef)}`);
}

export async function sendAiMentorMessage(payload) {
  if (payload instanceof FormData) {
    return apiPostForm("/ai-mentor/chat", payload);
  }
  return apiPostJson("/ai-mentor/chat", payload);
}

export async function getAiMentorSessions() {
  return apiFetch("/ai-mentor/sessions");
}

export async function getAiMentorMessages(sessionId) {
  return apiFetch(`/ai-mentor/messages/${sessionId}`);
}

// ===== Session Scheduling (Mentors & Investors) =====

export async function getStartupSessions() {
  return apiFetch("/startups/sessions");
}

export async function createStartupSession(payload) {
  return apiPostJson("/startups/sessions", payload);
}

export async function updateStartupSession(sessionId, payload) {
  return apiPatchJson(`/startups/sessions/${sessionId}`, payload);
}

export async function downloadStartupSessionCalendar(sessionId) {
  const { blob, filename } = await apiFetchBlob(`/startups/sessions/${sessionId}/calendar.ics`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `startup-session-${sessionId}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// Rating functions
export async function createOrUpdateRating(payload) {
  return apiPostJson("/ratings", payload);
}

export async function getMentorRatings(mentorId) {
  return apiFetch(`/ratings/mentor/${mentorId}`);
}

export async function getStartupGivenRatings() {
  return apiFetch("/ratings/my-ratings");
}

export async function checkRatingEligibility(mentorId) {
  return apiFetch(`/ratings/check-eligibility/${mentorId}`);
}

export async function deleteRating(reviewId) {
  return apiFetch(`/ratings/${reviewId}`, { method: "DELETE" });
}

// Notification settings functions
export async function getNotificationSettings() {
  return apiFetch("/notifications/settings");
}

export async function updateNotificationSettings(payload) {
  return apiPutJson("/notifications/settings", payload);
}
