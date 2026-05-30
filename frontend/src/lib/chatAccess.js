export const CHAT_UNLOCK_MESSAGE =
	"Messaging unlocks after both sides are connected by an accepted offer or request. Send an offer first, or accept the incoming offer/request, then come back to messages.";

export function isChatAccessError(error) {
	const code = error?.code || error?.data?.code;
	const message = String(error?.message || error?.data?.message || error?.data?.error || "");
	return (
		code === "CHAT_REQUIRES_ACCEPTED_OFFER" ||
		/chat is available only after/i.test(message) ||
		/video calls require an accepted/i.test(message) ||
		/accepted investment relationship/i.test(message) ||
		/accepted mentorship/i.test(message) ||
		/no accepted .* conversations/i.test(message)
	);
}

export function chatAccessMessage(error) {
	const message = String(error?.message || error?.data?.message || error?.data?.error || "");
	if (/mentor|mentorship/i.test(message)) {
		return "Messaging unlocks after the mentorship request is accepted. Send or accept the mentorship request first, then you can chat.";
	}
	if (/investment|investor|funding/i.test(message)) {
		return "Messaging unlocks after an investment offer or request is accepted. Send an offer or accept the incoming request first, then you can chat.";
	}
	return CHAT_UNLOCK_MESSAGE;
}
