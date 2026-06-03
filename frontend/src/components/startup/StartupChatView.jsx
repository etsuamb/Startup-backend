"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "@/components/startup/Sidebar";
import ChatCallPanel from "@/components/startup/ChatCallPanel";
import StartupProfileMenu from "@/components/startup/StartupProfileMenu";
import { getStartupProfile } from "@/lib/startupApi";
import { getToken } from "@/lib/authStorage";
import {
	decryptChatText,
	decryptMessages,
	isEncryptedChatPayload,
} from "@/lib/chatEncryption";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { MODERATION_WARNING } from "@/lib/socketClient";
import { chatAccessMessage, isChatAccessError } from "@/lib/chatAccess";
import ActorAvatar from "@/components/auth/ActorAvatar";

function readCurrentUserId() {
	try {
		const token = getToken();
		if (!token) return null;
		const payloadPart = (token.split(".")[1] || "")
			.replace(/-/g, "+")
			.replace(/_/g, "/");
		return JSON.parse(atob(payloadPart)).user_id;
	} catch {
		return null;
	}
}

function initials(name = "") {
	const parts = String(name).trim().split(/\s+/).filter(Boolean);
	if (!parts.length) return "?";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return parts
		.slice(0, 2)
		.map((p) => p[0])
		.join("")
		.toUpperCase();
}

function formatListTime(value) {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	const now = new Date();
	const diffMs = now - date;
	if (diffMs < 86400000) {
		return date.toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
		});
	}
	if (diffMs < 604800000) {
		return date.toLocaleDateString("en-US", { weekday: "short" });
	}
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMessageTime(value) {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	});
}

function formatBytes(value) {
	const size = Number(value || 0);
	if (!size) return "";
	const units = ["B", "KB", "MB", "GB"];
	const index = Math.min(
		Math.floor(Math.log(size) / Math.log(1024)),
		units.length - 1,
	);
	return `${(size / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function groupMessagesByDay(messages) {
	const groups = [];
	let currentLabel = null;
	for (const message of messages) {
		const date = message.created_at ? new Date(message.created_at) : null;
		const label =
			date && !Number.isNaN(date.getTime())
				? date.toDateString() === new Date().toDateString()
					? "TODAY"
					: date
							.toLocaleDateString("en-US", {
								weekday: "long",
								month: "short",
								day: "numeric",
							})
							.toUpperCase()
				: "MESSAGES";
		if (label !== currentLabel) {
			groups.push({ type: "divider", label });
			currentLabel = label;
		}
		groups.push({ type: "message", message });
	}
	return groups;
}

function previewText(raw, conversationId) {
	if (!raw) return "No messages yet";
	if (isEncryptedChatPayload(raw)) return "Encrypted message";
	return raw;
}

/**
 * @param {object} props
 * @param {'investor'|'mentor'} props.chatKind
 * @param {string} props.profileDiscoverBase - e.g. /startup/discover/investor
 * @param {() => Promise<{conversations: object[]}>} props.loadConversations
 * @param {(conversationId: string) => Promise<{messages: object[]}>} props.loadMessages
 * @param {(conversationId: string, body: string) => Promise<{message: object}>} props.sendText
 * @param {(conversationId: string, formData: FormData) => Promise<{message: object}>} props.sendFile
 * @param {(partnerId: string|number) => Promise<{conversation: object}>} [props.createConversation]
 * @param {string} [props.targetQueryParam]
 * @param {(conversationId: string, messageId: string|number) => Promise<{blob: Blob, contentType: string, filename: string}>} props.downloadFile
 * @param {(row: object) => object} props.normalizeConversation
 * @param {(message: object) => string|number|null} props.messageId
 * @param {object} props.callApi
 * @param {string} props.emptyListHint
 */
export default function StartupChatView({
	chatKind,
	profileDiscoverBase,
	loadConversations,
	loadMessages,
	sendText,
	sendFile,
	createConversation,
	targetQueryParam,
	downloadFile,
	normalizeConversation,
	messageId,
	callApi,
	emptyListHint,
}) {
	const searchParams = useSearchParams();
	const targetPartnerId = targetQueryParam
		? searchParams.get(targetQueryParam)
		: null;
	const targetConversationId = searchParams.get("conversationId");
	const [conversations, setConversations] = useState([]);
	const [selected, setSelected] = useState(null);
	const [messages, setMessages] = useState([]);
	const [messageText, setMessageText] = useState("");
	const [selectedFile, setSelectedFile] = useState(null);
	const [listFilter, setListFilter] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [loading, setLoading] = useState(true);
	const [messagesLoading, setMessagesLoading] = useState(false);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState(null);
	const [profile, setProfile] = useState(null);
	const [callModalOpen, setCallModalOpen] = useState(false);
	const [callAutoMode, setCallAutoMode] = useState(null);
	const [callConversationId, setCallConversationId] = useState(null);
	const [isRecording, setIsRecording] = useState(false);
	const messagesEndRef = useRef(null);
	const fileInputRef = useRef(null);
	const typingDebounceRef = useRef(null);
	const noticeTimerRef = useRef(null);
	const currentUserId = useMemo(readCurrentUserId, []);
	const [liveNotice, setLiveNotice] = useState(null);

	const showLiveNotice = useCallback((kind, text) => {
		if (!text) return;
		if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
		setLiveNotice({ kind, text });
		noticeTimerRef.current = setTimeout(() => setLiveNotice(null), 3500);
	}, []);

	const socketChannel = chatKind === "mentor" ? "mentor" : "investor";
	const {
		connected: socketConnected,
		typingUserId,
		moderationAlert,
		clearModerationAlert,
		setHandlers: setSocketHandlers,
		sendMessage: sendSocketMessage,
		emitTyping,
		emitStopTyping,
		markRead: markReadSocket,
	} = useRealtimeChat({
		channel: socketChannel,
		conversationId: selected?.id ?? null,
		enabled: Boolean(selected?.id),
	});

	const founderName =
		profile?.founder_full_name ||
		[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
		"Founder";
	const founderInitials = initials(founderName);

	const totalUnread = useMemo(
		() => conversations.reduce((sum, c) => sum + (c.unread || 0), 0),
		[conversations],
	);

	const filteredConversations = useMemo(() => {
		let list = [...conversations];
		if (listFilter === "unread") list = list.filter((c) => c.unread > 0);
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter(
				(c) =>
					c.company?.toLowerCase().includes(q) ||
					c.contactName?.toLowerCase().includes(q) ||
					c.preview?.toLowerCase().includes(q),
			);
		}
		return list;
	}, [conversations, listFilter, searchQuery]);

	const callConversation = useMemo(
		() =>
			conversations.find(
				(conversation) =>
					String(conversation.id) === String(callConversationId),
			) || selected,
		[callConversationId, conversations, selected],
	);

	const getMessageId = useCallback(
		(message) =>
			messageId(message) ||
			message.chat_message_id ||
			message.mentor_chat_message_id ||
			message.investor_chat_message_id,
		[messageId],
	);

	const appendUniqueMessage = useCallback(
		(message, displayBody) => {
			if (!message) return;
			const id = getMessageId(message);
			setMessages((current) => {
				if (
					id &&
					current.some(
						(item) => String(getMessageId(item)) === String(id),
					)
				) {
					return current;
				}
				return [
					...current,
					{
						...message,
						...(displayBody !== undefined
							? { display_body: displayBody }
							: {}),
					},
				];
			});
		},
		[getMessageId],
	);

	const refreshConversations = useCallback(
		async (preferredPartnerId = null, preferredConversationId = null) => {
			const data = await loadConversations();
			const list = await Promise.all(
				(data.conversations || []).map(async (row) => {
					const item = normalizeConversation(row);
					if (isEncryptedChatPayload(item.preview)) {
						try {
							item.preview = await decryptChatText(item.preview, item.id);
						} catch {
							item.preview = "Encrypted message";
						}
					}
					return item;
				}),
			);
			setConversations(list);
			setSelected((current) => {
				if (current && list.some((c) => c.id === current.id)) {
					return list.find((c) => c.id === current.id) || current;
				}
				if (preferredConversationId) {
					const preferred = list.find(
						(c) => String(c.id) === String(preferredConversationId),
					);
					if (preferred) return preferred;
				}
				if (preferredPartnerId) {
					const preferred = list.find(
						(c) => String(c.partnerId) === String(preferredPartnerId),
					);
					if (preferred) return preferred;
				}
				return list[0] || null;
			});
			return list;
		},
		[loadConversations, normalizeConversation],
	);

	const fetchMessages = useCallback(
		async (conversationId) => {
			const data = await loadMessages(conversationId);
			const raw = data.messages || [];
			const decrypted = await decryptMessages(
				raw,
				conversationId,
				(m) => m.text_body || m.message || m.body || m.content || "",
			);
			setMessages(
				decrypted.map((m) => ({
					...m,
					display_body:
						m._decrypted_body ??
						(isEncryptedChatPayload(m.text_body)
							? "[Encrypted message]"
							: messageBody(m)),
				})),
			);
		},
		[loadMessages],
	);

	useEffect(() => {
		async function init() {
			try {
				setLoading(true);
				setError(null);
				const profileData = await getStartupProfile().catch(() => null);
				setProfile(profileData?.startup || profileData || null);
				if (targetPartnerId && createConversation) {
					try {
						await createConversation(targetPartnerId);
					} catch (err) {
						setError(
							isChatAccessError(err)
								? chatAccessMessage(err)
								: err.message || "Unable to open conversation.",
						);
					}
				}
				await refreshConversations(targetPartnerId, targetConversationId);
			} catch (err) {
				setError(
					isChatAccessError(err)
						? chatAccessMessage(err)
						: err.message || "Unable to load conversations.",
				);
			} finally {
				setLoading(false);
			}
		}
		init();
	}, [
		createConversation,
		refreshConversations,
		targetConversationId,
		targetPartnerId,
	]);

	useEffect(() => {
		if (!selected?.id) {
			queueMicrotask(() => setMessages([]));
			return;
		}
		(async () => {
			try {
				setMessagesLoading(true);
				setError(null);
				await fetchMessages(selected.id);
				markReadSocket();
				setConversations((prev) =>
					prev.map((c) =>
						c.id === selected.id ? { ...c, unread: 0 } : c
					)
				);
			} catch (err) {
				setError(
					isChatAccessError(err)
						? chatAccessMessage(err)
						: err.message || "Unable to load messages.",
				);
			} finally {
				setMessagesLoading(false);
			}
		})();
	}, [selected?.id, fetchMessages, markReadSocket]);

	useEffect(() => {
		setSocketHandlers({
			onMessage: (msg) => {
				appendUniqueMessage(msg, msg.text_body || "");
				refreshConversations();
			},
			onChatNotification: (payload) => {
				if (!payload || payload.channel !== socketChannel) return;
				if (payload.kind === "received") {
					showLiveNotice("received", "New message received");
				} else if (payload.kind === "sent") {
					showLiveNotice("sent", "Message sent");
				}
			},
			onCallSignal: (payload) => {
				if (!payload || payload.channel !== socketChannel) return;
				if (
					payload.event === "ringing" &&
					Number(payload.video_call?.started_by_user_id) !==
						Number(currentUserId)
				) {
					setCallConversationId(payload.conversationId);
					const incomingConversation = conversations.find(
						(conversation) =>
							Number(conversation.id) === Number(payload.conversationId),
					);
					if (incomingConversation) setSelected(incomingConversation);
					else refreshConversations(null, payload.conversationId);
					setCallAutoMode(null);
					setCallModalOpen(true);
					showLiveNotice(
						"call",
						`Incoming call from ${incomingConversation?.contactName || "your contact"}`,
					);
				}
			},
		});
		return () => {
			if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
		};
	}, [
		setSocketHandlers,
		refreshConversations,
		appendUniqueMessage,
		socketChannel,
		currentUserId,
		conversations,
		showLiveNotice,
	]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, selected?.id]);

	function messageBody(message) {
		return (
			message.display_body ??
			message.text_body ??
			message.message ??
			message.body ??
			message.content ??
			""
		);
	}

	function messageFileType(message) {
		return message.message_type || message.type || "text";
	}

	function fileName(message) {
		return message.file_name || message.name || "Attachment";
	}

	function isMine(message) {
		return Number(message.sender_user_id) === Number(currentUserId);
	}

	function startVoiceRecording() {
		if (
			!("webkitSpeechRecognition" in window) &&
			!("SpeechRecognition" in window)
		) {
			setError("Voice recognition is not supported in your browser.");
			return;
		}
		const SpeechRecognition =
			window.SpeechRecognition || window.webkitSpeechRecognition;
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
			setError(
				event.error === "not-allowed"
					? "Microphone access denied"
					: "Voice recognition failed",
			);
		};
		recognition.onend = () => setIsRecording(false);
		recognition.start();
	}

	function handleFileSelect(event) {
		const file = event.target.files?.[0];
		if (file) setSelectedFile(file);
		event.target.value = "";
	}

	async function handleOpenFile(message) {
		const convId = selected?.id;
		const msgId = messageId(message);
		if (!convId || !msgId) return;
		try {
			const { blob, contentType, filename } = await downloadFile(convId, msgId);
			const url = URL.createObjectURL(blob);
			const mime = contentType || message.file_mime || blob.type || "";
			const canOpenInline =
				mime.startsWith("image/") ||
				mime.startsWith("audio/") ||
				mime.startsWith("video/") ||
				mime === "application/pdf";
			if (canOpenInline) {
				window.open(url, "_blank", "noopener,noreferrer");
				window.setTimeout(() => URL.revokeObjectURL(url), 60000);
			} else {
				const link = document.createElement("a");
				link.href = url;
				link.download = filename || fileName(message);
				link.click();
				URL.revokeObjectURL(url);
			}
		} catch (err) {
			setError(err.message || "Could not open file.");
		}
	}

	async function handleSend(event) {
		event.preventDefault();
		if (!selected?.id) return;

		if (selectedFile) {
			setSending(true);
			try {
				const formData = new FormData();
				formData.append("file", selectedFile);
				const caption = messageText.trim();
				if (caption) formData.append("caption", caption);
				const data = await sendFile(selected.id, formData);
				const next = {
					...data.message,
					display_body: caption || "",
				};
				appendUniqueMessage(next, caption || "");
				await refreshConversations();
				setSelectedFile(null);
				setMessageText("");
			} catch (err) {
				setError(
					isChatAccessError(err)
						? chatAccessMessage(err)
						: err.message || "Unable to send file.",
				);
			} finally {
				setSending(false);
			}
			return;
		}

		if (!messageText.trim()) return;
		const plain = messageText.trim();
		setMessageText("");
		emitStopTyping();
		setSending(true);
		clearModerationAlert();
		try {
			let sent;
			if (socketConnected) {
				try {
					sent = await sendSocketMessage(plain);
				} catch {
					const data = await sendText(selected.id, plain);
					sent = data.message;
				}
			} else {
				const data = await sendText(selected.id, plain);
				sent = data.message;
			}
			if (!socketConnected) {
				appendUniqueMessage(sent, plain);
			}
			await refreshConversations();
		} catch (err) {
			const isModeration =
				err?.data?.code === "MODERATION_BLOCKED" ||
				err?.status === 422 ||
				String(err.message || "").includes("transaction protection");
			if (isModeration) {
				clearModerationAlert();
				setError(err.message || MODERATION_WARNING);
			} else if (isChatAccessError(err)) {
				setError(chatAccessMessage(err));
			} else {
				setError(err.message || "Unable to send message.");
			}
			setMessageText(plain);
		} finally {
			setSending(false);
		}
	}

	function handleMessageInputChange(event) {
		setMessageText(event.target.value);
		if (!selected?.id) return;
		emitTyping();
		if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
		typingDebounceRef.current = setTimeout(() => emitStopTyping(), 1500);
	}

	function openCallModal(mode) {
		setCallConversationId(selected?.id ?? null);
		setCallAutoMode(mode);
		setCallModalOpen(true);
	}

	const messageGroups = useMemo(() => groupMessagesByDay(messages), [messages]);

	const profileHref = selected?.partnerId
		? `${profileDiscoverBase}/${selected.partnerId}`
		: null;

	return (
		<div className="flex h-screen overflow-hidden bg-white font-sans text-gray-900">
			<Sidebar />

			<div className="flex flex-grow flex-col overflow-hidden min-w-0">
				{/* Top bar */}
				<header className="h-[72px] shrink-0 border-b border-gray-100 bg-white px-4 sm:px-8 flex items-center gap-4 z-10">
					<div className="relative flex-1 max-w-[520px] hidden md:block">
						<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
						</div>
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search conversations or messages..."
							className="w-full pl-11 pr-4 py-2.5 bg-[#f3f4f6] border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0f3d32]/20"
						/>
					</div>
					<div className="flex items-center gap-4 ml-auto">
						<StartupProfileMenu
							profileName={profile?.startup_name || "My Startup"}
							profileSubtitle={founderName}
						/>
					</div>
				</header>

				<div className="flex flex-grow overflow-hidden min-h-0">
					{/* Conversation list */}
					<aside className={`${selected ? "hidden md:flex" : "flex"} w-full md:max-w-[360px] shrink-0 border-r border-gray-100 flex-col bg-white`}>
						<div className="px-5 pt-5 pb-3 border-b border-gray-50">
							<div className="flex items-center gap-2 mb-4">
								<h2 className="text-xl font-bold text-gray-900">Messages</h2>
								{totalUnread > 0 && (
									<span className="text-[10px] font-bold uppercase tracking-wider bg-[#0f3d32] text-white px-2 py-0.5 rounded-full">
										{totalUnread} unread
									</span>
								)}
							</div>
							<div className="flex gap-2 flex-wrap">
								<Link
									href="/startup/chat"
									onClick={() => setListFilter("all")}
									className="px-3 py-1.5 rounded-lg bg-[#f3f4f6] text-xs font-bold text-gray-600 hover:bg-gray-200"
								>
									All Chats
								</Link>
								<Link
									href="/startup/chat?kind=investor"
									onClick={() => setListFilter("all")}
									className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${chatKind === "investor" && listFilter !== "unread" ? "bg-[#0f3d32] text-white" : "bg-[#f3f4f6] text-gray-600 hover:bg-gray-200"}`}
								>
									Investors
								</Link>
								<Link
									href="/startup/chat?kind=mentor"
									onClick={() => setListFilter("all")}
									className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${chatKind === "mentor" && listFilter !== "unread" ? "bg-[#0f3d32] text-white" : "bg-[#f3f4f6] text-gray-600 hover:bg-gray-200"}`}
								>
									Mentors
								</Link>
								<button
									type="button"
									onClick={() => setListFilter(listFilter === "unread" ? "all" : "unread")}
									className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${listFilter === "unread" ? "bg-[#0f3d32] text-white" : "bg-[#f3f4f6] text-gray-600 hover:bg-gray-200"}`}
								>
									Unread
								</button>
							</div>
						</div>

						<div className="flex-grow overflow-y-auto">
							{loading ? (
								<p className="p-5 text-sm text-gray-500">
									Loading conversations…
								</p>
							) : filteredConversations.length === 0 ? (
								<p className="p-5 text-sm text-gray-500">{emptyListHint}</p>
							) : (
								filteredConversations.map((conversation) => {
									const active = selected?.id === conversation.id;
									return (
										<button
											key={conversation.id}
											type="button"
											onClick={() => setSelected(conversation)}
											className={`w-full text-left px-5 py-4 border-b border-gray-50 flex gap-3 relative transition ${
												active ? "bg-[#e8f7ef]" : "hover:bg-gray-50"
											}`}
										>
											{active && (
												<div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0f3d32]" />
											)}
											<ActorAvatar role={chatKind} profileId={conversation.partnerId} initials={conversation.avatarLetter || initials(conversation.company)} className="h-11 w-11 shrink-0 rounded-full text-sm" alt={conversation.contactName} />
											<div className="min-w-0 flex-grow">
												<div className="flex justify-between items-start gap-2">
													<p
														className={`text-sm truncate ${active ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}
													>
														{conversation.company}
													</p>
													<span className="text-[10px] font-bold text-gray-400 shrink-0">
														{formatListTime(conversation.lastAt)}
													</span>
												</div>
												<p className="text-xs text-gray-500 truncate mt-0.5">
													{conversation.contactName}
												</p>
												<div className="flex items-center gap-2 mt-1.5">
													{conversation.statusLabel && (
														<span
															className={`text-[9px] font-bold uppercase tracking-wider ${
																conversation.statusTone === "online"
																	? "text-[#16a34a]"
																	: conversation.statusTone === "waiting"
																		? "text-amber-600"
																		: "text-gray-400"
															}`}
														>
															{conversation.statusLabel}
														</span>
													)}
													<p className="text-xs text-gray-400 truncate flex-grow">
														{previewText(conversation.preview, conversation.id)}
													</p>
													{conversation.unread > 0 && (
														<span className="w-5 h-5 rounded-full bg-[#0f3d32] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
															{conversation.unread}
														</span>
													)}
												</div>
											</div>
										</button>
									);
								})
							)}
						</div>
					</aside>

					{/* Chat panel */}
					<section className={`${selected ? "flex" : "hidden md:flex"} flex-grow flex-col min-w-0 bg-[#fafbfc]`}>
						{liveNotice && (
							<div
								className={`mx-4 mt-3 rounded-xl border px-4 py-2 text-sm ${
									liveNotice.kind === "received"
										? "border-blue-200 bg-blue-50 text-blue-800"
										: liveNotice.kind === "call"
											? "border-emerald-200 bg-emerald-50 text-emerald-800"
											: "border-green-200 bg-green-50 text-green-800"
								}`}
							>
								{liveNotice.text}
							</div>
						)}

						{error && (
							<div
								className={`mx-4 mt-3 rounded-xl border px-4 py-2 text-sm ${
									isChatAccessError({ message: error })
										? "border-amber-200 bg-amber-50 text-amber-900"
										: "border-red-200 bg-red-50 text-red-700"
								}`}
							>
								{error}
								<button
									type="button"
									className="ml-3 font-bold underline"
									onClick={() => setError(null)}
								>
									Dismiss
								</button>
							</div>
						)}

						{/* Chat header */}
						<div className="h-[76px] shrink-0 border-b border-gray-100 bg-white px-4 sm:px-6 flex items-center justify-between gap-3">
							{selected ? (
								<>
									<div className="flex items-center gap-3 min-w-0">
										<button
											type="button"
											onClick={() => setSelected(null)}
											className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-500 hover:bg-gray-100 md:hidden"
											aria-label="Back to conversations"
										>
											<span aria-hidden="true">&larr;</span>
										</button>
										<ActorAvatar role={chatKind} profileId={selected.partnerId} initials={initials(selected.contactName)} className="h-11 w-11 shrink-0 rounded-full text-sm" alt={selected.contactName} />
										<div className="min-w-0">
											<h3 className="text-base font-bold text-gray-900 truncate">
												{selected.contactName}
											</h3>
											<p className="text-xs font-semibold text-[#0f3d32] truncate">
												{selected.company}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-1 sm:gap-2 shrink-0">
										{profileHref ? (
											<Link
												href={profileHref}
												className="p-2 rounded-lg text-gray-400 hover:text-[#0f3d32] hover:bg-gray-50 transition"
												title="View profile"
											>
												<svg
													className="w-5 h-5"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth="2"
														d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
													/>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth="2"
														d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
													/>
												</svg>
											</Link>
										) : null}
										<button
											type="button"
											onClick={() => openCallModal("voice")}
											className="p-2 rounded-lg text-gray-400 hover:text-[#0f3d32] hover:bg-gray-50 transition"
											title="Voice call"
										>
											<svg
												className="w-5 h-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
												/>
											</svg>
										</button>
										<button
											type="button"
											onClick={() => openCallModal("video")}
											className="p-2 rounded-lg text-gray-400 hover:text-[#0f3d32] hover:bg-gray-50 transition"
											title="Video call"
										>
											<svg
												className="w-5 h-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
												/>
											</svg>
										</button>
										<button
											type="button"
											className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition"
											title="More options"
											aria-label="More options"
										>
											<svg
												className="w-5 h-5"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
											</svg>
										</button>
									</div>
								</>
							) : (
								<p className="text-sm font-semibold text-gray-500">
									Select a conversation
								</p>
							)}
						</div>

						{(moderationAlert ||
							(error && String(error).includes("transaction protection"))) && (
							<div className="mx-4 sm:mx-8 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex gap-3 justify-between items-start">
								<p>{moderationAlert || error}</p>
								<button
									type="button"
									onClick={() => {
										clearModerationAlert();
										setError(null);
									}}
									className="text-amber-800 font-bold shrink-0 hover:underline"
								>
									Dismiss
								</button>
							</div>
						)}

						{/* Messages */}
						<div className="flex-grow overflow-y-auto px-4 sm:px-8 py-6">
							{!selected ? (
								<div className="h-full flex items-center justify-center text-sm text-gray-500">
									Select a conversation to view messages.
								</div>
							) : messagesLoading ? (
								<p className="text-sm text-gray-500">Loading messages…</p>
							) : messages.length === 0 ? (
								<div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
									<p className="text-sm font-semibold">No messages yet.</p>
									<p className="text-xs mt-1">
										Say hello to {selected.contactName}.
									</p>
								</div>
							) : (
								<div className="space-y-4">
									{messageGroups.map((item, index) => {
										if (item.type === "divider") {
											return (
												<div
													key={`d-${item.label}-${index}`}
													className="flex justify-center py-2"
												>
													<span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">
														{item.label}
													</span>
												</div>
											);
										}
										const message = item.message;
										const outgoing = isMine(message);
										const isFile = messageFileType(message) === "file";
										const body = messageBody(message);
										const id = messageId(message) || index;

										return (
											<div
												key={id}
												className={`flex gap-3 w-full ${outgoing ? "flex-row-reverse" : "flex-row"}`}
											>
												<div
													className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
														outgoing
															? "bg-[#1e293b] text-white"
															: "bg-[#0f3d32] text-white"
													}`}
												>
													{outgoing
														? founderInitials
														: initials(selected.contactName)}
												</div>
												<div
													className={`max-w-[75%] min-w-0 ${outgoing ? "items-end" : "items-start"} flex flex-col`}
												>
													<div
														className={`rounded-2xl px-4 py-3 shadow-sm ${
															outgoing
																? "bg-[#0f3d32] text-white rounded-br-md"
																: "bg-white text-gray-900 border border-gray-100 rounded-bl-md"
														}`}
													>
														{isFile ? (
															<button
																type="button"
																onClick={() => handleOpenFile(message)}
																className={`w-full text-left rounded-xl border px-3 py-2.5 transition ${
																	outgoing
																		? "border-white/25 bg-white/10 hover:bg-white/15"
																		: "border-gray-200 bg-gray-50 hover:bg-gray-100"
																}`}
															>
																<p className="text-sm font-bold truncate">
																	{fileName(message)}
																</p>
																<p
																	className={`text-[11px] mt-1 ${outgoing ? "text-white/70" : "text-gray-500"}`}
																>
																	{message.file_mime || "File"} ·{" "}
																	{formatBytes(message.file_size_bytes)} · Tap
																	to open
																</p>
																{body ? (
																	<p className="text-sm mt-2 leading-relaxed">
																		{body}
																	</p>
																) : null}
															</button>
														) : (
															<p className="text-sm leading-relaxed whitespace-pre-wrap">
																{body}
															</p>
														)}
													</div>
													<div
														className={`flex items-center gap-1.5 mt-1 px-1 ${
															outgoing ? "flex-row-reverse" : ""
														}`}
													>
														<span className="text-[10px] text-gray-400 font-medium">
															{formatMessageTime(message.created_at)}
														</span>
														{outgoing && (
															<svg
																className="w-3.5 h-3.5 text-blue-500"
																fill="currentColor"
																viewBox="0 0 20 20"
															>
																<path
																	fillRule="evenodd"
																	d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																	clipRule="evenodd"
																/>
															</svg>
														)}
													</div>
												</div>
											</div>
										);
									})}
									{typingUserId &&
										Number(typingUserId) !== Number(currentUserId) && (
											<p className="text-xs text-gray-400 italic px-12">
												{selected.contactName?.split(" ")[0] || "Contact"} is
												typing…
											</p>
										)}
									<div ref={messagesEndRef} />
								</div>
							)}
						</div>

						{/* Composer */}
						<form
							onSubmit={handleSend}
							className="shrink-0 border-t border-gray-200 bg-white p-3 sm:p-6"
						>
							{selectedFile && (
								<div className="mb-3 flex items-center gap-2 text-xs text-gray-600">
									<span className="bg-[#f3f4f6] rounded-lg px-3 py-1.5 font-semibold">
										{selectedFile.name} ({formatBytes(selectedFile.size)})
									</span>
									<button
										type="button"
										onClick={() => setSelectedFile(null)}
										className="text-red-600 font-bold hover:underline"
									>
										Remove
									</button>
								</div>
							)}
							<div className="flex min-w-0 items-center gap-2 sm:gap-3">
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									disabled={!selected || sending}
									className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 sm:h-11 sm:w-11"
									title="Attach file"
								>
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
										/>
									</svg>
								</button>
								<input
									ref={fileInputRef}
									type="file"
									className="hidden"
									onChange={handleFileSelect}
								/>
								<button
									type="button"
									onClick={startVoiceRecording}
									disabled={!selected || sending}
									className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border disabled:opacity-50 sm:h-11 sm:w-11 ${
										isRecording
											? "border-red-200 bg-red-50 text-red-600"
											: "border-gray-300 text-gray-500 hover:bg-gray-50"
									}`}
									title="Dictate message"
								>
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M12 18.5a6 6 0 006-6m-12 0a6 6 0 006 6m0 0v3m-4 0h8M12 15a3 3 0 003-3V5a3 3 0 10-6 0v7a3 3 0 003 3z"
										/>
									</svg>
								</button>
								<div className="min-w-0 flex-grow">
									<input
										value={messageText}
										onChange={handleMessageInputChange}
										onBlur={emitStopTyping}
										disabled={!selected || sending}
										placeholder={
											selected
												? `Write your message to ${selected.contactName?.split(" ")[0] || "them"}…`
												: "Select a conversation first"
										}
										className="w-full rounded-xl border border-gray-300 bg-white px-5 py-3.5 text-[14px] outline-none shadow-sm transition focus:border-[#0a4d3c]/50 focus:ring-4 focus:ring-[#0a4d3c]/10 disabled:bg-gray-50"
									/>
								</div>
								<button
									type="submit"
									disabled={
										!selected ||
										sending ||
										(!messageText.trim() && !selectedFile)
									}
									className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0a3a2e] px-3 py-3.5 text-[14px] font-bold text-white shadow-md transition hover:bg-[#072a21] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none sm:px-6"
									title="Send"
								>
									<span className="hidden sm:inline">{sending ? "Sending..." : selectedFile ? "Send File" : "Send"}</span>
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
										/>
									</svg>
								</button>
							</div>
						</form>
					</section>
				</div>
			</div>

			{/* Call modal */}
			{callModalOpen && callConversation && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
							<h3 className="font-bold text-gray-900">
								Call with {callConversation.contactName}
							</h3>
							<button
								type="button"
								onClick={() => {
									setCallModalOpen(false);
									setCallAutoMode(null);
									setCallConversationId(null);
								}}
								className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"
							>
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
						<div className="p-4">
							<ChatCallPanel
								conversationId={callConversation.id}
								channel={socketChannel}
								partnerName={callConversation.contactName}
								currentUserId={currentUserId}
								api={callApi}
								autoStartMode={callAutoMode}
								onError={(msg) => setError(msg || null)}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
