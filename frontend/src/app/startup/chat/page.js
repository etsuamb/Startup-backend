"use client";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/startup/Sidebar";
import ChatCallPanel from "@/components/startup/ChatCallPanel";
import { getToken } from "@/lib/authStorage";
import {
  endInvestorVideoCall,
  getInvestorChatConversations,
  getInvestorChatMessages,
  getInvestorVideoStatus,
  joinInvestorVideoCall,
  sendInvestorChatMessage,
  sendInvestorChatFile,
  setInvestorVideoScreenShare,
  startInvestorVideoCall,
} from "@/lib/startupApi";

const investorCallApi = {
  getStatus: getInvestorVideoStatus,
  start: startInvestorVideoCall,
  join: joinInvestorVideoCall,
  end: endInvestorVideoCall,
  screenShare: setInvestorVideoScreenShare,
};

function readCurrentUserId() {
  try {
    const token = getToken();
    if (!token) return null;
    const payloadPart = (token.split(".")[1] || "").replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(payloadPart));
    return payload.user_id;
  } catch {
    return null;
  }
}

function normalizeInvestorConversation(row) {
  const name = `${row.investor_first_name || ""} ${row.investor_last_name || ""}`.trim() || "Investor";
  return {
    id: row.conversation_id,
    name,
    subtitle: row.investor_type || row.investor_email || "Accepted investment partner",
    preview: row.last_message_preview || "No messages yet",
    unread: row.unread_count || 0,
    lastAt: row.last_message_at || row.created_at,
  };
}

export default function StartupInvestorChatPage() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState(null);
  const currentUserId = useMemo(readCurrentUserId, []);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetchMessages(selected.id);
  }, [selected?.id]);

  async function loadConversations() {
    try {
      setLoading(true);
      setError(null);
      const data = await getInvestorChatConversations();
      const list = (data.conversations || []).map(normalizeInvestorConversation);
      setConversations(list);
      setSelected((current) => {
        if (current && list.some((c) => c.id === current.id)) return current;
        return list[0] || null;
      });
    } catch (err) {
      setError(err.message || "Unable to load accepted investor conversations.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(conversationId) {
    try {
      setMessagesLoading(true);
      setError(null);
      const data = await getInvestorChatMessages(conversationId);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message || "Unable to load messages.");
    } finally {
      setMessagesLoading(false);
    }
  }

  function startVoiceRecording() {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setError("Voice recognition is not supported in your browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      setMessageText(transcript);
    };
    recognition.onerror = (event) => {
      setIsRecording(false);
      setError(event.error === "not-allowed" ? "Microphone access denied" : "Voice recognition failed");
    };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  }

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setMessageText(`📎 ${file.name}`);
    }
  }

  async function handleSendWithFile(event) {
    event.preventDefault();
    if (!selected) return;

    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const caption = messageText.replace(`📎 ${selectedFile.name}`, "").trim();
      if (caption) formData.append("caption", caption);

      try {
        const data = await sendInvestorChatFile(selected.id, formData);
        setMessages((current) => [...current, data.message]);
        await loadConversations();
        setSelectedFile(null);
        setMessageText("");
      } catch (err) {
        setError(err.message || "Unable to send file.");
      }
    } else {
      if (!messageText.trim()) return;
      const text = messageText.trim();
      setMessageText("");
      try {
        const data = await sendInvestorChatMessage(selected.id, text);
        setMessages((current) => [...current, data.message]);
        await loadConversations();
      } catch (err) {
        setError(err.message || "Unable to send message.");
        setMessageText(text);
      }
    }
  }

  function messageKey(message, index) {
    return message.chat_message_id || `${message.created_at}-${index}`;
  }

  function messageBody(message) {
    return message.text_body || message.message || message.body || message.content || "";
  }

  function messageFileType(message) {
    return message.message_type || message.type || "text";
  }

  function fileName(message) {
    return message.file_name || message.name || null;
  }

  function isMine(message) {
    return Number(message.sender_user_id) === Number(currentUserId);
  }

  return (
    <div className="flex min-h-screen overflow-hidden bg-white font-sans text-gray-900">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto">
        <header className="px-8 py-6 bg-white border-b border-gray-100 sticky top-0 z-10">
          <h1 className="text-3xl font-bold text-gray-900">Investor Chat</h1>
          <p className="text-sm text-gray-500 mt-1">
            Message your investors and run voice or video sessions after investment is accepted.
          </p>
        </header>

        <div className="px-4 sm:px-10 py-8 w-full max-w-[1400px] mx-auto pb-24">
          {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
            <aside className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 p-5">
                <h2 className="text-lg font-bold text-gray-900">Conversations</h2>
                <p className="mt-1 text-sm text-gray-500">Accepted investors only</p>
              </div>
              {loading ? (
                <p className="p-5 text-sm text-gray-500">Loading conversations...</p>
              ) : conversations.length === 0 ? (
                <p className="p-5 text-sm text-gray-500">
                  No accepted investor chats yet. Conversations appear after an investment offer or request is accepted.
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setSelected(conversation)}
                      className={`w-full p-4 text-left transition ${
                        selected?.id === conversation.id ? "bg-[#e8f7ef]" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-bold text-gray-900">{conversation.name}</p>
                        {conversation.unread > 0 && (
                          <span className="rounded-full bg-[#0f3d32] px-2 py-0.5 text-[10px] font-bold text-white">
                            {conversation.unread}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-gray-500">{conversation.subtitle}</p>
                      <p className="mt-2 truncate text-xs text-gray-400">{conversation.preview}</p>
                    </button>
                  ))}
                </div>
              )}
            </aside>

            <section className="rounded-xl border border-gray-200 bg-white shadow-sm flex min-h-[640px] flex-col overflow-hidden">
              <div className="border-b border-gray-100 p-5 space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selected?.name || "Select a conversation"}</h2>
                  <p className="text-sm text-gray-500">{selected?.subtitle || "Choose an accepted investor."}</p>
                </div>
                <ChatCallPanel
                  conversationId={selected?.id}
                  partnerName={selected?.name}
                  currentUserId={currentUserId}
                  api={investorCallApi}
                  onError={(msg) => setError(msg || null)}
                />
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {!selected ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-[#f8fafc] p-10 text-center text-gray-500">
                    Select an accepted investor to start chatting.
                  </div>
                ) : messagesLoading ? (
                  <p className="text-sm text-gray-500">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-[#f8fafc] p-8 text-center text-gray-500">
                    No messages yet. Start the conversation with this investor.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={messageKey(message, index)}
                        className={`max-w-[78%] rounded-2xl px-5 py-3 ${
                          isMine(message) ? "ml-auto bg-[#0f3d32] text-white" : "bg-[#f3f4f6] text-gray-900"
                        }`}
                      >
                        {messageFileType(message) === "file" ? (
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <svg className="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{fileName(message) || "Attachment"}</p>
                                {message.file_size_bytes && (
                                  <p className="text-xs opacity-70">{(message.file_size_bytes / 1024).toFixed(1)} KB</p>
                                )}
                              </div>
                            </div>
                            {messageBody(message) && <p className="text-sm leading-6 mt-2">{messageBody(message)}</p>}
                          </div>
                        ) : (
                          <p className="text-sm leading-6">{messageBody(message)}</p>
                        )}
                        <p className={`mt-2 text-[11px] ${isMine(message) ? "text-white/60" : "text-gray-400"}`}>
                          {message.created_at ? new Date(message.created_at).toLocaleString() : "Just now"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleSendWithFile} className="border-t border-gray-100 p-4">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      disabled={!selected}
                      placeholder={selected ? "Type your message..." : "Select a conversation first"}
                      className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-4 py-3 pr-24 text-sm outline-none focus:border-[#0f3d32] focus:ring-2 focus:ring-[#0f3d32]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <input type="file" id="investor-file-upload" className="hidden" onChange={handleFileSelect} disabled={!selected} />
                      <label
                        htmlFor="investor-file-upload"
                        className={`cursor-pointer rounded-lg p-2 transition ${!selected ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200"}`}
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </label>
                      <button
                        type="button"
                        onClick={startVoiceRecording}
                        disabled={!selected}
                        className={`rounded-lg p-2 transition ${
                          !selected ? "opacity-50 cursor-not-allowed" : isRecording ? "bg-red-100 hover:bg-red-200" : "hover:bg-gray-200"
                        }`}
                      >
                        {isRecording ? (
                          <svg className="w-4 h-4 text-red-600 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="6" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!selected || !messageText.trim()}
                    className="rounded-xl bg-[#0f3d32] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0a2921] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
                {selectedFile && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                    <span className="bg-gray-100 rounded-lg px-2 py-1">
                      📎 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setMessageText("");
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
