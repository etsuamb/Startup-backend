"use client";

import StartupChatView from "@/components/startup/StartupChatView";
import {
	downloadInvestorChatFile,
	createInvestorChatConversation,
	endInvestorVideoCall,
	getInvestorChatConversations,
	getInvestorChatMessages,
	joinInvestorVideoCall,
	sendInvestorChatFile,
	sendInvestorChatMessage,
	setInvestorVideoScreenShare,
	startInvestorVideoCall,
	getInvestorVideoStatus,
} from "@/lib/startupApi";

const investorCallApi = {
	getStatus: getInvestorVideoStatus,
	start: startInvestorVideoCall,
	join: joinInvestorVideoCall,
	end: endInvestorVideoCall,
	screenShare: setInvestorVideoScreenShare,
};

function normalizeInvestorConversation(row) {
	const contactName =
		`${row.investor_first_name || ""} ${row.investor_last_name || ""}`.trim() ||
		"Investor";
	const company =
		row.investor_type ||
		row.investor_email ||
		row.investor_company ||
		"Investor";
	return {
		id: row.conversation_id,
		partnerId: row.investor_id,
		company,
		contactName,
		avatarLetter: (company[0] || "I").toUpperCase(),
		preview: row.last_message_preview || "",
		unread: row.unread_count || 0,
		lastAt: row.last_message_at || row.created_at,
		statusLabel: row.unread_count ? "WAITING REPLY" : null,
		statusTone: row.unread_count ? "waiting" : "online",
	};
}

export default function StartupInvestorChatPage() {
	return (
		<StartupChatView
			chatKind="investor"
			profileDiscoverBase="/startup/discover/investor"
			loadConversations={getInvestorChatConversations}
			loadMessages={getInvestorChatMessages}
			createConversation={createInvestorChatConversation}
			targetQueryParam="investorId"
			sendText={sendInvestorChatMessage}
			sendFile={sendInvestorChatFile}
			downloadFile={downloadInvestorChatFile}
			normalizeConversation={normalizeInvestorConversation}
			messageId={(m) => m.chat_message_id || m.investor_chat_message_id}
			callApi={investorCallApi}
			emptyListHint="No accepted investor chats yet. Conversations appear after an investment offer or request is accepted."
		/>
	);
}
