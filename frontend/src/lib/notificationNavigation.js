function normalize(value) {
	return String(value || "").trim().toLowerCase();
}

function roleHome(role) {
	if (role === "admin") return "/admin/dashboard";
	if (role === "investor") return "/investor/dashboard";
	if (role === "mentor") return "/mentor/dashboard";
	return "/startup/dashboard";
}

function withQuery(path, key, value) {
	return value == null || value === "" ? path : `${path}?${key}=${encodeURIComponent(String(value))}`;
}

export function resolveNotificationHref(notification, currentRole) {
	const role = normalize(currentRole);
	const referenceType = normalize(notification?.reference_type);
	const notificationType = normalize(notification?.notification_type);
	const referenceId = notification?.reference_id;

	if (role === "admin") {
		if (["user", "users"].includes(referenceType)) {
			return referenceId ? `/admin/users/${referenceId}` : "/admin/users";
		}
		if (referenceType === "startups") return "/admin/startups";
		if (referenceType === "investment_requests") return withQuery("/admin/investments", "requestId", referenceId);
		if (referenceType === "chat_moderation") return withQuery("/admin/moderation", "logId", referenceId);
		if (referenceType.includes("payment")) return "/admin/payments";
		if (referenceType.includes("mentor")) return "/admin/mentorship";
		if (referenceType.includes("project")) return "/admin/projects";
		if (["registration", "verification"].includes(notificationType)) return "/admin/users";
		if (notificationType === "moderation") return "/admin/moderation";
		if (notificationType === "investment") return "/admin/investments";
		return "/admin/activity";
	}

	if (referenceType === "chat_conversations") {
		return withQuery(role === "investor" ? "/investor/messages" : "/startup/chat", "conversationId", referenceId);
	}
	if (referenceType === "mentor_chat_conversations") {
		return withQuery(role === "mentor" ? "/mentor/messages" : "/startup/mentorship", "conversationId", referenceId);
	}
	if (referenceType === "chat_video_calls") return role === "investor" ? "/investor/messages" : "/startup/chat";
	if (referenceType === "mentor_chat_video_calls") return role === "mentor" ? "/mentor/messages" : "/startup/mentorship";
	if (referenceType === "investment_requests") {
		return role === "investor"
			? withQuery("/investor/offers", "requestId", referenceId)
			: referenceId
				? `/startup/offers/investment/${referenceId}`
				: "/startup/offers";
	}
	if (referenceType === "mentorship_requests") {
		return role === "mentor"
			? withQuery("/mentor/requests/profile", "requestId", referenceId)
			: referenceId
				? `/startup/offers/mentorship/${referenceId}`
				: "/startup/offers";
	}
	if (referenceType === "investor_meetings") {
		return withQuery(role === "investor" ? "/investor/meetings" : "/startup/meetings", "meetingId", referenceId);
	}
	if (referenceType === "review") {
		return role === "mentor" ? "/mentor/dashboard" : "/startup/ratings";
	}
	if (["user", "users"].includes(referenceType) || notificationType === "account") {
		return `/${role || "startup"}/settings`;
	}
	if (referenceType === "startups") {
		if (role === "investor") return "/investor/discover";
		if (role === "mentor") return "/mentor/startups";
		return "/startup/dashboard";
	}
	if (referenceType === "mentors") {
		return role === "mentor" ? "/mentor/dashboard" : "/startup/discover";
	}
	if (referenceType === "investors") {
		return role === "investor" ? "/investor/dashboard" : "/startup/discover";
	}
	if (referenceType.includes("mentorship")) {
		return role === "mentor"
			? withQuery("/mentor/requests/profile", "requestId", referenceId)
			: referenceId
				? `/startup/offers/mentorship/${referenceId}`
				: "/startup/offers";
	}
	if (notificationType === "chat") return role === "investor" ? "/investor/messages" : "/startup/chat";
	if (notificationType === "mentor_chat") return role === "mentor" ? "/mentor/messages" : "/startup/mentorship";
	if (notificationType === "video") return role === "investor" ? "/investor/messages" : "/startup/chat";
	if (notificationType === "mentor_video") return role === "mentor" ? "/mentor/messages" : "/startup/mentorship";
	if (notificationType === "investment") return role === "investor" ? "/investor/funding" : "/startup/offers";
	if (notificationType === "meeting") return role === "investor" ? "/investor/meetings" : "/startup/meetings";
	if (notificationType === "mentorship") return role === "mentor" ? "/mentor/requests" : "/startup/offers";
	if (notificationType === "rating") return role === "mentor" ? "/mentor/dashboard" : "/startup/ratings";
	if (notificationType === "moderation") return roleHome(role);
	return roleHome(role);
}
