import { apiFetch, apiPatchJson, apiPostJson } from "./api";

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
