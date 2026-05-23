import { apiFetch, apiPutJson } from "./api";

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }
  return query.toString();
}

export function getNotifications(params = {}) {
  const query = buildQuery(params);
  return apiFetch(`/notifications${query ? `?${query}` : ""}`);
}

export function getUnreadNotificationCount() {
  return apiFetch("/notifications/unread-count");
}

export function markNotificationAsRead(notificationId, isRead = true) {
  return apiPutJson(`/notifications/${notificationId}`, { is_read: isRead });
}

export function markAllNotificationsRead() {
  return apiPutJson("/notifications/mark-all-read", {});
}
