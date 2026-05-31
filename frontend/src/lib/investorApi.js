import { apiFetch, apiFetchBlob, apiPatchJson, apiPostForm, apiPostJson, apiPutJson } from "./api";

function toQuery(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  }
  return query.toString();
}

export function getInvestorProfile() {
  return apiFetch("/investors/profile");
}

export function getInvestorSettings() {
  return apiFetch("/investors/settings");
}

export function updateInvestorSettings(payload) {
  return apiPutJson("/investors/settings", payload);
}

export function changeInvestorPassword(payload) {
  return apiPatchJson("/investors/settings/password", payload);
}

export function getInvestorStartups(params = {}) {
  const qs = toQuery(params);
  return apiFetch(`/investors/startups${qs ? `?${qs}` : ""}`);
}

export function searchInvestorStartups(params = {}) {
  const qs = toQuery(params);
  return apiFetch(`/investors/startups/search${qs ? `?${qs}` : ""}`);
}

export function getInvestorStartupDetails(startupId) {
  return apiFetch(`/investors/startups/${startupId}`);
}

export function getInvestorRecommendations(params = {}) {
  const qs = toQuery(params);
  return apiFetch(`/investors/recommendations${qs ? `?${qs}` : ""}`);
}

export function getInvestorFundingOffers() {
  return apiFetch("/investors/funding-offers");
}

export function getInvestorPortfolio() {
  return apiFetch("/investors/portfolio");
}

export function createInvestorFundingOffer(payload) {
  return apiPostJson("/investors/funding-offers", payload);
}

export function acceptInvestorFundingOffer(offerId) {
  return apiPatchJson(`/investors/funding-offers/${offerId}/accept`, {});
}

export function withdrawInvestorFundingOffer(offerId) {
  return apiPatchJson(`/investors/funding-offers/${offerId}/withdraw`, {});
}

export function getInvestorPaymentItems() {
	return apiFetch("/payments/investment-items");
}

export function initializeChapaPayment(payload) {
	return apiPostJson("/payments/chapa/initialize", payload);
}

export function createChapaHostedPayment(payload) {
	return apiPostJson("/payments/chapa/hosted", payload);
}

export function verifyChapaPayment(txRef) {
	return apiFetch(`/payments/chapa/verify/${encodeURIComponent(txRef)}`);
}

export function getInvestorRatings(params = {}) {
	const qs = toQuery(params);
	return apiFetch(`/investors/ratings${qs ? `?${qs}` : ""}`);
}

export function getInvestorMentorRatings(params = {}) {
	const qs = toQuery(params);
	return apiFetch(`/investors/mentor-ratings${qs ? `?${qs}` : ""}`);
}

export function submitInvestorRating(startupId, payload) {
	return apiPostJson(`/investors/startups/${startupId}/feedback`, payload);
}

export function getInvestorMessageThreads() {
	return apiFetch("/chat/conversations");
}

export function createInvestorConversation(startupId) {
	return apiPostJson("/chat/conversations", { startup_id: startupId });
}

export function getInvestorMessages(conversationId, params = {}) {
	const qs = toQuery(params);
	return apiFetch(`/chat/conversations/${conversationId}/messages${qs ? `?${qs}` : ""}`);
}

export function sendInvestorMessage(conversationId, message) {
	return apiPostJson(`/chat/conversations/${conversationId}/messages`, { body: message });
}

export function sendInvestorChatFile(conversationId, file, caption = "") {
	const form = new FormData();
	form.append("file", file);
	if (caption) form.append("caption", caption);
	return apiPostForm(`/chat/conversations/${conversationId}/files`, form);
}

export function downloadInvestorChatFile(conversationId, messageId) {
	return apiFetchBlob(`/chat/conversations/${conversationId}/files/${messageId}`);
}

export function getInvestorVideoStatus(conversationId) {
	return apiFetch(`/chat/conversations/${conversationId}/video/status`);
}

export function startInvestorVideoCall(conversationId) {
	return apiPostJson(`/chat/conversations/${conversationId}/video/start`, {});
}

export function joinInvestorVideoCall(conversationId) {
	return apiPostJson(`/chat/conversations/${conversationId}/video/join`, {});
}

export function endInvestorVideoCall(conversationId) {
	return apiPostJson(`/chat/conversations/${conversationId}/video/end`, {});
}

export function setInvestorVideoScreenShare(conversationId, action) {
	return apiPostJson(`/chat/conversations/${conversationId}/video/screen-share`, { action });
}

export function sendInvestorAiMentorMessage(payload) {
	if (payload instanceof FormData) {
		return apiPostForm("/ai-mentor/chat", payload);
	}
	return apiPostJson("/ai-mentor/chat", payload);
}

export function getInvestorAiMentorSessions() {
	return apiFetch("/ai-mentor/sessions");
}

export function getInvestorAiMentorMessages(sessionId) {
	return apiFetch(`/ai-mentor/messages/${sessionId}`);
}

export function getInvestorMeetings() {
	return apiFetch("/investors/meetings");
}

export function createInvestorMeeting(payload) {
	return apiPostJson("/investors/meetings", payload);
}

export function updateInvestorMeeting(meetingId, payload) {
	return apiPatchJson(`/investors/meetings/${meetingId}`, payload);
}

export async function downloadInvestorMeetingCalendar(meetingId) {
	const { blob, filename } = await apiFetchBlob(`/investors/meetings/${meetingId}/calendar.ics`);
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename || `investor-meeting-${meetingId}.ics`;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
