import { apiFetch, apiPatchJson, apiPostJson, apiPutJson, apiPostForm, apiPutForm } from "./api";

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

export async function getDocuments() {
  return apiFetch("/startups/documents");
}

export async function uploadDocument(formData) {
  return apiPostForm("/startups/documents", formData);
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

export async function getNotifications(params = {}) {
  const query = buildQuery(params);
  return apiFetch(`/notifications?${query}`);
}

export async function markNotificationAsRead(notificationId) {
  return apiPutJson(`/notifications/${notificationId}`, { is_read: true });
}

export async function markAllNotificationsRead() {
  return apiPutJson("/notifications/mark-all-read", {});
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

export async function getStartupOffers(params = {}) {
  const query = buildQuery(params);
  return apiFetch(`/startups/offers?${query}`);
}

export async function getOfferDetails(offerType, offerId) {
  return apiFetch(`/startups/offers/${offerType}/${offerId}`);
}

export async function updateOfferStatus(offerType, offerId, status) {
  return apiPatchJson(`/startups/offers/${offerType}/${offerId}`, { status });
}

export async function sendAiMentorMessage(payload) {
  return apiPostJson("/ai-mentor/chat", payload);
}

export async function getAiMentorSessions() {
  return apiFetch("/ai-mentor/sessions");
}

export async function getAiMentorMessages(sessionId) {
  return apiFetch(`/ai-mentor/messages/${sessionId}`);
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
