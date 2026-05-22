import { apiFetch, apiPostJson, apiPutJson, apiPostForm, apiPutForm } from "./api";

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

export async function getInvestorRecommendations() {
  return apiFetch("/startups/recommendations/investors");
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
  return apiPutJson(`/startups/offers/${offerType}/${offerId}`, { status });
}
