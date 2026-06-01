/**
 * Generic form draft utility for saving/loading form state across pages
 * Uses localStorage for persistence (survives page reloads and session restarts)
 */

const PREFIX = "sc_form_draft_";

/**
 * Save form draft to localStorage
 * @param {string} pageKey - Unique key for the page/form (e.g., "register_startup", "mentor_proposal")
 * @param {object} data - Form data to save
 */
export function saveDraft(pageKey, data) {
	if (typeof window === "undefined") return false;
	try {
		const key = PREFIX + pageKey;
		localStorage.setItem(key, JSON.stringify({
			data,
			savedAt: new Date().toISOString(),
		}));
		return true;
	} catch (err) {
		console.error("Error saving draft:", err);
		return false;
	}
}

/**
 * Load form draft from localStorage
 * @param {string} pageKey - Unique key for the page/form
 * @returns {object|null} Draft data or null if not found
 */
export function loadDraft(pageKey) {
	if (typeof window === "undefined") return null;
	try {
		const key = PREFIX + pageKey;
		const stored = localStorage.getItem(key);
		if (!stored) return null;
		const parsed = JSON.parse(stored);
		return parsed.data || null;
	} catch (err) {
		console.error("Error loading draft:", err);
		return null;
	}
}

/**
 * Get saved draft timestamp
 * @param {string} pageKey - Unique key for the page/form
 * @returns {string|null} ISO timestamp or null
 */
export function getDraftSavedAt(pageKey) {
	if (typeof window === "undefined") return null;
	try {
		const key = PREFIX + pageKey;
		const stored = localStorage.getItem(key);
		if (!stored) return null;
		const parsed = JSON.parse(stored);
		return parsed.savedAt || null;
	} catch {
		return null;
	}
}

/**
 * Clear form draft from localStorage
 * @param {string} pageKey - Unique key for the page/form
 */
export function clearDraft(pageKey) {
	if (typeof window === "undefined") return;
	try {
		const key = PREFIX + pageKey;
		localStorage.removeItem(key);
	} catch (err) {
		console.error("Error clearing draft:", err);
	}
}

/**
 * Check if a draft exists
 * @param {string} pageKey - Unique key for the page/form
 * @returns {boolean} True if draft exists
 */
export function hasDraft(pageKey) {
	if (typeof window === "undefined") return false;
	try {
		const key = PREFIX + pageKey;
		return localStorage.getItem(key) !== null;
	} catch {
		return false;
	}
}

/**
 * Format saved timestamp for display
 * @param {string} isoString - ISO timestamp string
 * @returns {string} Formatted time like "2:30 PM"
 */
export function formatSavedTime(isoString) {
	if (!isoString) return null;
	try {
		const date = new Date(isoString);
		return date.toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			meridiem: "short",
		});
	} catch {
		return null;
	}
}
