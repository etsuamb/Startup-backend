"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/investor/Sidebar";
import ChatCallPanel from "@/components/startup/ChatCallPanel";
import ActorAvatar from "@/components/auth/ActorAvatar";
import {
  createInvestorConversation,
  downloadInvestorChatFile,
  endInvestorVideoCall,
  getInvestorMessageThreads,
  getInvestorMessages,
  getInvestorProfile,
  getInvestorFundingOffers,
  getInvestorStartups,
  getInvestorVideoStatus,
  joinInvestorVideoCall,
  sendInvestorChatFile,
  sendInvestorMessage,
  setInvestorVideoScreenShare,
  startInvestorVideoCall,
} from "@/lib/investorApi";
import { chatAccessMessage, isChatAccessError } from "@/lib/chatAccess";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";

const callApi = {
  getStatus: getInvestorVideoStatus,
  start: startInvestorVideoCall,
  join: joinInvestorVideoCall,
  end: endInvestorVideoCall,
  screenShare: setInvestorVideoScreenShare,
};

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "ST";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatBytes(value) {
  const size = Number(value || 0);
  if (!size) return "";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  return `${(size / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function getThreadStartupId(thread) {
  return thread.startup_id ?? thread.id ?? thread.user_id ?? null;
}

function isAcceptedStatus(status) {
  return ["approved", "accepted"].includes(String(status || "").toLowerCase());
}

function ChatLockedNotice({ startupName }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-bold">Messaging is locked</p>
      <p className="mt-1 text-amber-800">
        You can message {startupName || "this startup"} after an investment offer or request is accepted by both sides.
      </p>
      <Link
        href="/investor/offers/new"
        className="mt-3 inline-flex rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-950 hover:bg-amber-200"
      >
        Send funding offer
      </Link>
    </div>
  );
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const startupIdFromUrl = searchParams.get("startupId") || "";
  const conversationIdFromUrl = searchParams.get("conversationId") || "";
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioUrlsRef = useRef({});

  const [startups, setStartups] = useState([]);
  const [threads, setThreads] = useState([]);
  const [acceptedStartupIds, setAcceptedStartupIds] = useState(new Set());
  const [activeStartupId, setActiveStartupId] = useState(startupIdFromUrl);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [draft, setDraft] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [attachmentCaption, setAttachmentCaption] = useState("");
  const [audioUrls, setAudioUrls] = useState({});
  const [query, setQuery] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [callMode, setCallMode] = useState(null);
  const [error, setError] = useState("");
  const [liveNotice, setLiveNotice] = useState("");
  const noticeTimerRef = useRef(null);

  const showLiveNotice = useCallback((text) => {
    if (!text) return;
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setLiveNotice(text);
    noticeTimerRef.current = setTimeout(() => setLiveNotice(""), 3500);
  }, []);

  const appendUniqueMessage = useCallback((message) => {
    if (!message) return;
    setMessages((current) => (
      current.some((item) => String(item.chat_message_id) === String(message.chat_message_id))
        ? current
        : [...current, message]
    ));
  }, []);

  const {
    setHandlers: setSocketHandlers,
    markRead: markReadSocket,
  } = useRealtimeChat({
    channel: "investor",
    conversationId: activeConversationId,
    enabled: Boolean(activeConversationId),
  });

  async function refreshThreads() {
    const threadData = await getInvestorMessageThreads();
    const loadedThreads = Array.isArray(threadData.conversations) ? threadData.conversations : [];
    setThreads(loadedThreads);
    return loadedThreads;
  }

  useEffect(() => {
    let ignore = false;

    async function loadInbox() {
      try {
        setLoadingThreads(true);
        setError("");
        const [threadData, startupData, profileData, offerData] = await Promise.all([
          getInvestorMessageThreads(),
          getInvestorStartups({ limit: 100 }),
          getInvestorProfile(),
          getInvestorFundingOffers().catch(() => ({ funding_offers: [] })),
        ]);
        if (ignore) return;
        const loadedThreads = Array.isArray(threadData.conversations) ? threadData.conversations : [];
        const loadedStartups = Array.isArray(startupData.startups) ? startupData.startups : [];
        setThreads(loadedThreads);
        setStartups(loadedStartups);
        setAcceptedStartupIds(
          new Set(
            (offerData.funding_offers || [])
              .filter((offer) => isAcceptedStatus(offer.status))
              .map((offer) => String(offer.startup_id)),
          ),
        );
        setCurrentUserId(profileData.investor?.user_id || null);
        if (!startupIdFromUrl) {
          const focusedThread = loadedThreads.find(
            (thread) => String(thread.conversation_id) === String(conversationIdFromUrl),
          );
          const first = focusedThread?.startup_id || loadedThreads[0]?.startup_id || loadedStartups[0]?.startup_id || "";
          setActiveStartupId(first ? String(first) : "");
        }
      } catch (err) {
        if (!ignore) setError(err.message || "Failed to load conversations.");
      } finally {
        if (!ignore) setLoadingThreads(false);
      }
    }

    loadInbox();
    return () => {
      ignore = true;
    };
  }, [conversationIdFromUrl, startupIdFromUrl]);

  const inbox = useMemo(() => {
    const threadMap = new Map(
      threads
        .map((thread) => [getThreadStartupId(thread), thread])
        .filter(([startupId]) => startupId !== null && startupId !== undefined)
        .map(([startupId, thread]) => [String(startupId), thread]),
    );
    const merged = startups.map((startup) => {
      const thread = threadMap.get(String(startup.startup_id));
      return {
        startup_id: startup.startup_id,
        startup_name: startup.startup_name,
        industry: startup.industry,
        conversation_id: thread?.conversation_id || null,
        last_message_at: thread?.last_message_at || null,
        last_message_preview: thread?.last_message_preview || "No messages yet.",
        unread_count: thread?.unread_count || 0,
      };
    });
    for (const thread of threads) {
      const threadStartupId = getThreadStartupId(thread);
      if (threadStartupId === null || threadStartupId === undefined) continue;
      if (!merged.some((item) => String(item.startup_id) === String(threadStartupId))) {
        merged.push({
          ...thread,
          startup_id: threadStartupId,
        });
      }
    }
    const deduped = Array.from(merged.reduce((map, item) => {
      const key = String(item.startup_id);
      const current = map.get(key);
      if (!current || new Date(item.last_message_at || 0) > new Date(current.last_message_at || 0)) {
        map.set(key, item);
      }
      return map;
    }, new Map()).values());

    return deduped
      .filter((item) => item.startup_name?.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0));
  }, [query, startups, threads]);

  const activeStartup = inbox.find((item) => String(item.startup_id) === String(activeStartupId));
  const activeCanMessage = Boolean(
    activeStartup?.conversation_id || acceptedStartupIds.has(String(activeStartupId)),
  );

  useEffect(() => {
    setSocketHandlers({
      onMessage: (message) => {
        if (Number(message.conversation_id) === Number(activeConversationId)) {
          appendUniqueMessage(message);
          markReadSocket();
        }
        refreshThreads();
      },
      onChatNotification: (payload) => {
        if (payload?.channel !== "investor") return;
        showLiveNotice(payload.kind === "sent" ? "Message sent" : "New message received");
      },
      onCallSignal: (payload) => {
        if (
          payload?.channel !== "investor"
          || payload.event !== "ringing"
          || Number(payload.video_call?.started_by_user_id) === Number(currentUserId)
        ) return;
        const thread = threads.find(
          (item) => Number(item.conversation_id) === Number(payload.conversationId),
        );
        const startupId = getThreadStartupId(thread || {});
        if (startupId) setActiveStartupId(String(startupId));
        setActiveConversationId(payload.conversationId);
        setCallMode(null);
        setCallOpen(true);
        showLiveNotice("Incoming call");
      },
    });
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, [
    activeConversationId,
    appendUniqueMessage,
    currentUserId,
    markReadSocket,
    setSocketHandlers,
    showLiveNotice,
    threads,
  ]);

  useEffect(() => {
    let ignore = false;

    async function loadAudioUrls() {
      const audioMessages = messages.filter((message) => (
        message.message_type === "file"
        && String(message.file_mime || "").startsWith("audio/")
        && message.conversation_id
        && message.chat_message_id
      ));

      const entries = await Promise.all(audioMessages.map(async (message) => {
        const key = String(message.chat_message_id);
        if (audioUrlsRef.current[key]) return [key, audioUrlsRef.current[key]];
        try {
          const { blob } = await downloadInvestorChatFile(message.conversation_id, message.chat_message_id);
          const url = URL.createObjectURL(blob);
          return [key, url];
        } catch {
          return null;
        }
      }));

      if (!ignore) {
        setAudioUrls((current) => {
          const next = { ...current };
          for (const entry of entries) {
            if (entry) next[entry[0]] = entry[1];
          }
          audioUrlsRef.current = next;
          return next;
        });
      }
    }

    loadAudioUrls();
    return () => {
      ignore = true;
    };
  }, [messages]);

  useEffect(() => {
    return () => {
      Object.values(audioUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadMessages() {
      if (!activeStartupId) {
        setMessages([]);
        setActiveConversationId(null);
        return;
      }

      const existingConversationId = activeStartup?.conversation_id || null;
      setActiveConversationId(existingConversationId);
      if (!existingConversationId) {
        setMessages([]);
        return;
      }

      try {
        setLoadingMessages(true);
        setError("");
        const data = await getInvestorMessages(existingConversationId, { limit: 50 });
        if (!ignore) setMessages(Array.isArray(data.messages) ? data.messages : []);
      } catch (err) {
        if (!ignore) setError(err.message || "Failed to load messages.");
      } finally {
        if (!ignore) setLoadingMessages(false);
      }
    }

    loadMessages();
    return () => {
      ignore = true;
    };
  }, [activeStartupId, activeStartup?.conversation_id]);

  async function ensureConversation() {
    if (activeConversationId) return activeConversationId;
    if (!activeStartupId) return null;
    const data = await createInvestorConversation(activeStartupId);
    const conversationId = data.conversation?.conversation_id;
    if (conversationId) {
      setActiveConversationId(conversationId);
      await refreshThreads();
    }
    return conversationId || null;
  }

  async function handleSend(event) {
    event.preventDefault();
    const text = draft.trim();
    if ((!text && !pendingAttachment) || !activeStartupId) return;
    if (!activeCanMessage) {
      setError(chatAccessMessage({ message: "investment chat locked" }));
      return;
    }

    try {
      setSending(true);
      setError("");
      const conversationId = await ensureConversation();
      if (!conversationId) throw new Error("Could not open conversation.");

      const data = pendingAttachment
        ? await sendInvestorChatFile(conversationId, pendingAttachment, attachmentCaption.trim())
        : await sendInvestorMessage(conversationId, text);
      appendUniqueMessage(data.message);
      setDraft("");
      setPendingAttachment(null);
      setAttachmentCaption("");
      await refreshThreads();
    } catch (err) {
      setError(isChatAccessError(err) ? chatAccessMessage(err) : err.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  async function handleFileSelected(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !activeStartupId) return;
    setPendingAttachment(file);
    setAttachmentCaption("");
  }

  async function handleToggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new Error("Voice recording is not supported in this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
        try {
          setUploading(true);
          const conversationId = await ensureConversation();
          if (!conversationId) throw new Error("Could not open conversation.");
          const data = await sendInvestorChatFile(conversationId, file, "Voice message");
          appendUniqueMessage(data.message);
          await refreshThreads();
        } catch (err) {
          setError(isChatAccessError(err) ? chatAccessMessage(err) : err.message || "Failed to send voice message.");
        } finally {
          setUploading(false);
        }
      };
      recorder.start();
      setRecording(true);
    } catch (err) {
      setError(err.message || "Failed to start voice recording.");
    }
  }

  async function handleDownload(message) {
    try {
      const { blob, filename } = await downloadInvestorChatFile(message.conversation_id, message.chat_message_id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || message.file_name || "attachment";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Failed to download file.");
    }
  }

  return (
    <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden">
      <Sidebar />
      {liveNotice ? (
        <div className="fixed right-5 top-5 z-[60] rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 shadow-lg">
          {liveNotice}
        </div>
      ) : null}

      <div className="flex-grow flex flex-col overflow-hidden bg-white pt-16">
        <div className="flex flex-grow overflow-hidden">
          <div className={`${activeStartup ? "hidden md:flex" : "flex"} w-full md:w-[340px] shrink-0 border-r border-gray-200 flex-col bg-white`}>
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-[13px] outline-none focus:bg-gray-100 transition"
                />
              </div>
            </div>

            <div className="flex-grow overflow-y-auto">
              {loadingThreads ? (
                <div className="p-5 text-sm font-semibold text-gray-500">Loading conversations...</div>
              ) : inbox.length ? inbox.map((chat) => (
                <button
                  type="button"
                  key={chat.startup_id}
                  onClick={() => setActiveStartupId(String(chat.startup_id))}
                  className={`w-full text-left p-4 border-b border-gray-50 cursor-pointer flex gap-4 transition relative ${
                    String(activeStartupId) === String(chat.startup_id) ? "bg-[#e8fbf0]" : "hover:bg-gray-50"
                  }`}
                >
                  {String(activeStartupId) === String(chat.startup_id) && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0a4d3c]" />}
                  <ActorAvatar role="startup" profileId={chat.startup_id} initials={initials(chat.startup_name)} className="h-12 w-12 shrink-0 rounded-full text-[13px]" alt={chat.startup_name} />
                  <div className="flex-grow min-w-0 pr-1">
                    <div className="flex justify-between items-baseline mb-1 gap-2">
                      <h4 className={`text-[15px] truncate ${String(activeStartupId) === String(chat.startup_id) ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                        {chat.startup_name}
                      </h4>
                      <span className={`text-[10px] shrink-0 font-bold ${chat.unread_count ? "text-[#0a4d3c]" : "text-gray-400"}`}>
                        {formatTime(chat.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] truncate text-gray-500 flex-grow">
                        {chat.last_message_preview}
                      </p>
                      {chat.unread_count ? (
                        <span className="w-5 h-5 rounded-full bg-[#0a4d3c] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {chat.unread_count}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              )) : (
                <div className="p-5 text-sm text-gray-500">No startups found.</div>
              )}
            </div>
          </div>

          <div className={`${activeStartup ? "flex" : "hidden md:flex"} min-w-0 flex-grow flex-col bg-white overflow-hidden relative`}>
            <div className="h-[76px] gap-2 border-b border-gray-200 px-3 sm:px-8 flex justify-between items-center shrink-0">
              {activeStartup ? (
                <>
                  <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                    <button type="button" onClick={() => setActiveStartupId("")} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-500 hover:bg-gray-100 md:hidden" aria-label="Back to conversations">
                      <span aria-hidden="true">&larr;</span>
                    </button>
                    <ActorAvatar role="startup" profileId={activeStartup.startup_id} initials={initials(activeStartup.startup_name)} className="h-11 w-11 shrink-0 rounded-full text-[13px]" alt={activeStartup.startup_name} />
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold text-gray-900 leading-tight">{activeStartup.startup_name}</h2>
                      <div className="text-[11px] font-bold text-[#0a4d3c]">{activeStartup.industry || "Startup"}</div>
                    </div>
                  </div>
                  <div className="flex max-w-[52%] shrink-0 items-center gap-2 overflow-x-auto sm:max-w-none sm:gap-3">
                    <Link href={`/investor/offers?startupId=${activeStartup.startup_id}`} className="whitespace-nowrap px-3 sm:px-5 py-2 bg-white border border-gray-300 rounded-lg text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm">
                      Send Offer
                    </Link>
                    <Link href={`/investor/meetings?startupId=${activeStartup.startup_id}`} className="whitespace-nowrap px-3 sm:px-5 py-2 bg-white border border-gray-300 rounded-lg text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm">
                      Schedule Meeting
                    </Link>
                    {activeConversationId && activeCanMessage ? (
                      <>
                        <button type="button" onClick={() => { setCallMode("voice"); setCallOpen(true); }} className="rounded-lg border border-gray-300 bg-white p-2 text-gray-600 hover:text-[#0a4d3c]" title="Voice call">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8m-4-8a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z" /></svg>
                        </button>
                        <button type="button" onClick={() => { setCallMode("video"); setCallOpen(true); }} className="rounded-lg border border-gray-300 bg-white p-2 text-gray-600 hover:text-[#0a4d3c]" title="Video call">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.6-2.3A1 1 0 0121 8.6v6.8a1 1 0 01-1.4.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                      </>
                    ) : null}
                  </div>
                </>
              ) : (
                <h2 className="text-lg font-bold text-gray-900">Messages</h2>
              )}
            </div>

            {error ? (
              <div className={`mx-8 mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
                isChatAccessError({ message: error })
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-red-100 bg-red-50 text-red-700"
              }`}>
                {error}
              </div>
            ) : null}

            <div className="flex-grow overflow-y-auto p-8 flex flex-col">
              {loadingMessages ? (
                <div className="text-sm font-semibold text-gray-500">Loading messages...</div>
              ) : activeStartup && !activeCanMessage ? (
                <div className="flex h-full items-center justify-center">
                  <ChatLockedNotice startupName={activeStartup.startup_name} />
                </div>
              ) : messages.length ? messages.map((message) => {
                const outgoing = String(message.sender_user_id) === String(currentUserId);
                const isFile = message.message_type === "file";
                const isAudio = isFile && String(message.file_mime || "").startsWith("audio/");
                const audioUrl = audioUrls[String(message.chat_message_id)];
                return (
                  <div key={message.chat_message_id} className={`flex mb-6 w-full ${outgoing ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] px-5 py-4 rounded-2xl shadow-sm ${
                      outgoing ? "bg-[#0a4d3c] text-white rounded-br-sm" : "bg-[#f0f2f5] text-gray-800 rounded-bl-sm"
                    }`}>
                      {isAudio ? (
                        <div className={`rounded-xl border px-4 py-3 ${
                          outgoing ? "border-white/20 bg-white/10" : "border-gray-200 bg-white"
                        }`}>
                          <div className="text-[13px] font-bold mb-2">Voice message</div>
                          {audioUrl ? (
                            <audio controls src={audioUrl} className="h-9 max-w-full" />
                          ) : (
                            <div className={`text-[12px] ${outgoing ? "text-white/70" : "text-gray-500"}`}>Loading audio...</div>
                          )}
                          {message.text_body ? <div className="text-[12px] mt-2">{message.text_body}</div> : null}
                        </div>
                      ) : isFile ? (
                        <button
                          type="button"
                          onClick={() => handleDownload(message)}
                          className={`w-full text-left rounded-xl border px-4 py-3 transition ${
                            outgoing ? "border-white/20 bg-white/10 hover:bg-white/15" : "border-gray-200 bg-white hover:bg-gray-50"
                          }`}
                        >
                          <div className="text-[13px] font-bold mb-1">{isAudio ? "Voice message" : message.file_name}</div>
                          <div className={`text-[11px] ${outgoing ? "text-white/70" : "text-gray-500"}`}>
                            {isAudio ? "Audio file" : message.file_mime || "Attachment"} {formatBytes(message.file_size_bytes)}
                          </div>
                          {message.text_body ? <div className="text-[12px] mt-2">{message.text_body}</div> : null}
                        </button>
                      ) : (
                        <p className="text-[14px] leading-relaxed mb-3">{message.text_body}</p>
                      )}
                      <div className={`text-[10px] font-medium text-right mt-3 ${outgoing ? "text-[#86e2b6]" : "text-gray-400"}`}>
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <p className="text-sm font-semibold">{activeStartup ? "No messages yet." : "Select a startup to start messaging."}</p>
                  {activeStartup ? <p className="text-xs mt-1">Send the first message to {activeStartup.startup_name}.</p> : null}
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-3 sm:p-6 bg-white border-t border-gray-200 shrink-0 flex min-w-0 items-center gap-2 sm:gap-3">
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!activeStartupId || !activeCanMessage || uploading}
                className="w-11 h-11 rounded-xl border border-gray-300 text-gray-500 hover:bg-gray-50 flex items-center justify-center disabled:opacity-50"
                title="Attach file"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828a4 4 0 10-5.657-5.657L5.757 10.757a6 6 0 108.486 8.486L20.829 12.657" /></svg>
              </button>
              <button
                type="button"
                onClick={handleToggleRecording}
                disabled={!activeStartupId || !activeCanMessage || uploading}
                className={`w-11 h-11 rounded-xl border flex items-center justify-center disabled:opacity-50 ${
                  recording ? "border-red-200 bg-red-50 text-red-600" : "border-gray-300 text-gray-500 hover:bg-gray-50"
                }`}
                title={recording ? "Stop recording" : "Record voice"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18.5a6 6 0 006-6m-12 0a6 6 0 006 6m0 0v3m-4 0h8M12 15a3 3 0 003-3V5a3 3 0 10-6 0v7a3 3 0 003 3z" /></svg>
              </button>

              <div className="min-w-0 flex-grow">
                {pendingAttachment ? (
                  <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-gray-900">{pendingAttachment.name}</div>
                        <div className="text-xs font-medium text-gray-500">{pendingAttachment.type || "Attachment"} {formatBytes(pendingAttachment.size)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingAttachment(null);
                          setAttachmentCaption("");
                        }}
                        className="text-xs font-bold text-gray-500 hover:text-gray-900"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={attachmentCaption}
                      onChange={(event) => setAttachmentCaption(event.target.value)}
                      placeholder="Add a caption..."
                      className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-[#0a4d3c]/50 focus:ring-2 focus:ring-[#0a4d3c]/10"
                    />
                  </div>
                ) : null}
                <input
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  disabled={!activeStartupId || !activeCanMessage || sending || Boolean(pendingAttachment)}
                  placeholder={recording ? "Recording voice..." : activeStartup && !activeCanMessage ? "Accept or send an offer before messaging" : activeStartup ? "Type your message here..." : "Select a startup first"}
                  className="w-full px-5 py-3.5 bg-white border border-gray-300 rounded-xl text-[14px] outline-none focus:border-[#0a4d3c]/50 focus:ring-4 focus:ring-[#0a4d3c]/10 transition shadow-sm disabled:bg-gray-50"
                />
              </div>

              <button
                type="submit"
                disabled={(!draft.trim() && !pendingAttachment) || !activeStartupId || !activeCanMessage || sending || uploading}
                className="px-3 sm:px-6 py-3.5 bg-[#0a3a2e] text-white font-bold text-[14px] rounded-xl hover:bg-[#072a21] shadow-md flex items-center justify-center gap-2 transition shrink-0 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
              >
                <span className="hidden sm:inline">{sending ? "Sending..." : uploading ? "Uploading..." : pendingAttachment ? "Send File" : "Send"}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </div>
        </div>
      </div>
      {callOpen && activeStartup && activeConversationId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="font-bold">Call with {activeStartup.startup_name}</h3>
              <button type="button" onClick={() => { setCallOpen(false); setCallMode(null); }} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4">
              <ChatCallPanel
                conversationId={activeConversationId}
                partnerName={activeStartup.startup_name}
                currentUserId={currentUserId}
                api={callApi}
                channel="investor"
                autoStartMode={callMode}
                onError={(message) => setError(message || "")}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <React.Suspense fallback={<p className="p-8 text-gray-500">Loading...</p>}>
      <MessagesContent />
    </React.Suspense>
  );
}
