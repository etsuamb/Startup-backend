"use client";

import StartupChatView from "@/components/startup/StartupChatView";
import {
  downloadMentorChatFile,
  createMentorChatConversation,
  endMentorVideoCall,
  getMentorChatConversations,
  getMentorChatMessages,
  joinMentorVideoCall,
  sendMentorChatFile,
  sendMentorChatMessage,
  setMentorVideoScreenShare,
  startMentorVideoCall,
  getMentorVideoStatus,
} from "@/lib/startupApi";

const mentorCallApi = {
  getStatus: getMentorVideoStatus,
  start: startMentorVideoCall,
  join: joinMentorVideoCall,
  end: endMentorVideoCall,
  screenShare: setMentorVideoScreenShare,
};

function normalizeMentorConversation(row) {
  const contactName =
    `${row.mentor_first_name || ""} ${row.mentor_last_name || ""}`.trim() || "Mentor";
  const company = row.mentor_headline || row.mentor_email || "Mentor";
  return {
    id: row.mentor_conversation_id,
    partnerId: row.mentor_id,
    company,
    contactName,
    avatarLetter: (company[0] || "M").toUpperCase(),
    preview: row.last_message_preview || "",
    unread: row.unread_count || 0,
    lastAt: row.last_message_at || row.created_at,
    statusLabel: row.unread_count ? "WAITING REPLY" : null,
    statusTone: row.unread_count ? "waiting" : "online",
  };
}

export default function StartupMentorChatPage() {
  return (
    <StartupChatView
      chatKind="mentor"
      profileDiscoverBase="/startup/discover/mentor"
      loadConversations={getMentorChatConversations}
      loadMessages={getMentorChatMessages}
      createConversation={createMentorChatConversation}
      targetQueryParam="mentorId"
      sendText={sendMentorChatMessage}
      sendFile={sendMentorChatFile}
      downloadFile={downloadMentorChatFile}
      normalizeConversation={normalizeMentorConversation}
      messageId={(m) => m.mentor_chat_message_id}
      callApi={mentorCallApi}
      emptyListHint="No accepted mentor chats yet. Conversations appear after a mentorship offer or request is accepted."
    />
  );
}
