"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ChatCallPanel from "@/components/startup/ChatCallPanel";
import { getToken } from "@/lib/authStorage";
import {
	fetchMentorConversations,
	fetchMentorMessages,
	createMentorConversation,
	sendMentorMessage,
	sendMentorChatFile,
	downloadMentorChatFile,
	getMentorVideoStatus,
	startMentorVideoCall,
	joinMentorVideoCall,
	endMentorVideoCall,
	setMentorVideoScreenShare,
} from "@/lib/mentorApi";
import {
	decryptChatText,
	decryptMessages,
	encryptChatText,
	isEncryptedChatPayload,
} from "@/lib/chatEncryption";

const callApi = {
	getStatus: getMentorVideoStatus,
	start: startMentorVideoCall,
	join: joinMentorVideoCall,
	end: endMentorVideoCall,
	screenShare: setMentorVideoScreenShare,
};

function currentUserId() {
	try {
		const token = getToken();
		const payload = token?.split(".")?.[1]?.replace(/-/g, "+").replace(/_/g, "/");
		return payload ? JSON.parse(atob(payload)).user_id : null;
	} catch {
		return null;
	}
}

function initials(value = "") {
	const parts = String(value).trim().split(/\s+/).filter(Boolean);
	if (!parts.length) return "?";
	return parts.length === 1
		? parts[0].slice(0, 2).toUpperCase()
		: parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function listTime(value) {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	const diff = Date.now() - date.getTime();
	if (diff < 86400000) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
	if (diff < 604800000) return date.toLocaleDateString("en-US", { weekday: "short" });
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function messageTime(value) {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function bytes(value) {
	const size = Number(value || 0);
	if (!size) return "";
	const units = ["B", "KB", "MB", "GB"];
	const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
	return `${(size / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function dayLabel(value) {
	const date = value ? new Date(value) : null;
	if (!date || Number.isNaN(date.getTime())) return "MESSAGES";
	const today = new Date();
	if (date.toDateString() === today.toDateString()) return "TODAY";
	return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
}

function normalizeConversation(row) {
	const startupName = row.startup_name || `Startup #${row.startup_id}`;
	const founder = [row.startup_contact_first_name, row.startup_contact_last_name].filter(Boolean).join(" ");
	return {
		id: row.mentor_conversation_id,
		startupId: row.startup_id,
		startupName,
		founderName: founder || "Startup founder",
		sector: row.industry || row.business_stage || "Startup",
		preview: row.last_message_preview || "",
		lastAt: row.last_message_at || row.created_at,
		unread: row.unread_count || 0,
	};
}

export default function MentorMessagesPage() {
	const searchParams = useSearchParams();
	const startupIdFromUrl = searchParams.get("startupId");
	const [conversations, setConversations] = useState([]);
	const [selected, setSelected] = useState(null);
	const [messages, setMessages] = useState([]);
	const [query, setQuery] = useState("");
	const [filter, setFilter] = useState("all");
	const [text, setText] = useState("");
	const [file, setFile] = useState(null);
	const [loading, setLoading] = useState(true);
	const [messagesLoading, setMessagesLoading] = useState(false);
	const [sending, setSending] = useState(false);
	const [recording, setRecording] = useState(false);
	const [error, setError] = useState("");
	const [callOpen, setCallOpen] = useState(false);
	const [callMode, setCallMode] = useState(null);
	const uid = useMemo(() => currentUserId(), []);
	const fileInputRef = useRef(null);
	const endRef = useRef(null);

	const refreshConversations = useCallback(async (preferredStartupId = null) => {
		const data = await fetchMentorConversations();
		const rows = Array.isArray(data.conversations) ? data.conversations : [];
		const list = await Promise.all(rows.map(async (row) => {
			const item = normalizeConversation(row);
			if (isEncryptedChatPayload(item.preview)) {
				try {
					item.preview = await decryptChatText(item.preview, item.id);
				} catch {
					item.preview = "Encrypted message";
				}
			}
			return item;
		}));
		setConversations(list);
		setSelected((current) => {
			if (preferredStartupId) {
				return list.find((item) => String(item.startupId) === String(preferredStartupId)) || current || list[0] || null;
			}
			if (current) return list.find((item) => item.id === current.id) || current;
			return list[0] || null;
		});
		return list;
	}, []);

	const loadMessages = useCallback(async (conversationId) => {
		const data = await fetchMentorMessages(conversationId);
		const raw = Array.isArray(data.messages) ? data.messages : [];
		const decrypted = await decryptMessages(raw, conversationId, (message) => message.text_body || "");
		setMessages(decrypted.map((message) => ({
			...message,
			display_body:
				message._decrypted_body ??
				(isEncryptedChatPayload(message.text_body) ? "[Encrypted message]" : message.text_body || ""),
		})));
	}, []);

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				setError("");
				if (startupIdFromUrl) {
					await createMentorConversation(startupIdFromUrl);
				}
				await refreshConversations(startupIdFromUrl);
			} catch (ex) {
				setError(ex.message || "Failed to load conversations.");
			} finally {
				setLoading(false);
			}
		})();
	}, [refreshConversations, startupIdFromUrl]);

	useEffect(() => {
		if (!selected?.id) {
			return;
		}
		(async () => {
			try {
				setMessagesLoading(true);
				setError("");
				await loadMessages(selected.id);
				await refreshConversations();
			} catch (ex) {
				setError(ex.message || "Failed to load messages.");
			} finally {
				setMessagesLoading(false);
			}
		})();
	}, [selected?.id, loadMessages, refreshConversations]);

	useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, selected?.id]);

	const visibleConversations = useMemo(() => {
		const needle = query.trim().toLowerCase();
		return conversations.filter((conversation) => {
			if ((filter === "unread" || filter === "priority") && !conversation.unread) return false;
			if (!needle) return true;
			return [conversation.startupName, conversation.founderName, conversation.preview]
				.some((value) => String(value || "").toLowerCase().includes(needle));
		});
	}, [conversations, filter, query]);

	function isMine(message) {
		return Number(message.sender_user_id) === Number(uid);
	}

	function groupedMessages() {
		const items = [];
		let last = "";
		for (const message of messages) {
			const label = dayLabel(message.created_at);
			if (label !== last) {
				items.push({ type: "day", label });
				last = label;
			}
			items.push({ type: "message", message });
		}
		return items;
	}

	async function openFile(message) {
		try {
			const data = await downloadMentorChatFile(selected.id, message.mentor_chat_message_id);
			const url = URL.createObjectURL(data.blob);
			const mime = data.contentType || message.file_mime || "";
			const inline = mime.startsWith("image/") || mime.startsWith("audio/") || mime.startsWith("video/") || mime === "application/pdf";
			if (inline) {
				window.open(url, "_blank", "noopener,noreferrer");
				window.setTimeout(() => URL.revokeObjectURL(url), 60000);
				return;
			}
			const link = document.createElement("a");
			link.href = url;
			link.download = data.filename || message.file_name || "attachment";
			link.click();
			URL.revokeObjectURL(url);
		} catch (ex) {
			setError(ex.message || "Could not open file.");
		}
	}

	function startDictation() {
		if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
			setError("Voice recognition is not supported in this browser.");
			return;
		}
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		const recognition = new SpeechRecognition();
		recognition.continuous = false;
		recognition.interimResults = true;
		recognition.lang = "en-US";
		recognition.onstart = () => setRecording(true);
		recognition.onresult = (event) => {
			setText(Array.from(event.results).map((result) => result[0].transcript).join(""));
		};
		recognition.onerror = () => {
			setRecording(false);
			setError("Voice recognition failed.");
		};
		recognition.onend = () => setRecording(false);
		recognition.start();
	}

	async function send(event) {
		event.preventDefault();
		if (!selected?.id || sending || (!text.trim() && !file)) return;
		setSending(true);
		try {
			setError("");
			if (file) {
				const form = new FormData();
				form.append("file", file);
				const caption = text.trim();
				if (caption) form.append("caption", await encryptChatText(caption, selected.id));
				const data = await sendMentorChatFile(selected.id, form);
				setMessages((current) => [...current, { ...data.message, display_body: caption }]);
				setFile(null);
				setText("");
			} else {
				const plain = text.trim();
				setText("");
				const encrypted = await encryptChatText(plain, selected.id);
				const data = await sendMentorMessage(selected.id, encrypted);
				setMessages((current) => [...current, { ...data.message, display_body: plain }]);
			}
			await refreshConversations();
		} catch (ex) {
			setError(ex.message || "Message could not be sent.");
		} finally {
			setSending(false);
		}
	}

	function openCall(mode) {
		setCallMode(mode);
		setCallOpen(true);
	}

	return (
		<div className="flex h-full min-h-0 overflow-hidden bg-white text-gray-950">
			<div className="flex min-w-0 flex-1 flex-col">
				<header className="flex h-[74px] shrink-0 items-center gap-6 border-b border-gray-100 bg-white px-8">
					<h1 className="text-lg font-black">Messages</h1>
					<div className="relative w-full max-w-[360px]">
						<span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400">
							<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</span>
						<input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search conversations..."
							className="h-11 w-full rounded-full border-0 bg-gray-100 pl-11 pr-4 text-sm outline-none ring-1 ring-transparent focus:bg-white focus:ring-[#0a4d3c]/20"
						/>
					</div>
					<div className="ml-auto flex items-center gap-5 text-gray-400">
						<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
						</svg>
						<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M10.3 4.3l.7-1.8h2l.7 1.8a8 8 0 012.2.9l1.8-.8 1.4 1.4-.8 1.8c.4.7.7 1.4.9 2.2l1.8.7v2l-1.8.7a8 8 0 01-.9 2.2l.8 1.8-1.4 1.4-1.8-.8a8 8 0 01-2.2.9l-.7 1.8h-2l-.7-1.8a8 8 0 01-2.2-.9l-1.8.8-1.4-1.4.8-1.8a8 8 0 01-.9-2.2l-1.8-.7v-2l1.8-.7c.2-.8.5-1.5.9-2.2l-.8-1.8 1.4-1.4 1.8.8a8 8 0 012.2-.9z" />
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
						</svg>
						<div className="h-6 w-px bg-gray-200" />
						<div className="text-right">
							<p className="text-xs font-black text-gray-950">Mentor Portal</p>
							<p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Lead mentor</p>
						</div>
					</div>
				</header>

				<div className="flex min-h-0 flex-1">
					<aside className="flex w-[380px] shrink-0 flex-col border-r border-gray-100 bg-white">
						<div className="border-b border-gray-100 px-5 py-6">
							<div className="mb-4 flex items-center justify-between">
								<h2 className="text-base font-black">Inbox</h2>
								<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 5h18M6 12h12M10 19h4" />
								</svg>
							</div>
							<div className="grid grid-cols-3 gap-2">
								{[
									["all", "All"],
									["unread", "Unread"],
									["priority", "Priority"],
								].map(([key, label]) => (
									<button
										key={key}
										type="button"
										onClick={() => setFilter(key)}
										className={`h-9 rounded-full text-xs font-black ${filter === key ? "bg-[#073f32] text-white" : "bg-gray-100 text-gray-700"}`}
									>
										{label}
									</button>
								))}
							</div>
						</div>
						<div className="min-h-0 flex-1 overflow-y-auto">
							{loading ? (
								<p className="p-5 text-sm text-gray-500">Loading conversations...</p>
							) : visibleConversations.length ? visibleConversations.map((conversation) => {
								const active = selected?.id === conversation.id;
								return (
									<button
										key={conversation.id}
										type="button"
										onClick={() => setSelected(conversation)}
										className={`flex w-full gap-4 border-b border-gray-50 px-5 py-5 text-left transition ${active ? "bg-[#edf8f2]" : "hover:bg-gray-50"}`}
									>
										<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#073f32] text-sm font-black text-white">
											{initials(conversation.startupName)}
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-start justify-between gap-3">
												<p className="truncate text-sm font-black">{conversation.startupName}</p>
												<span className="shrink-0 text-[11px] font-bold text-gray-400">{listTime(conversation.lastAt)}</span>
											</div>
											<p className="mt-1 truncate text-xs font-semibold text-gray-500">{conversation.founderName}</p>
											<div className="mt-2 flex items-center gap-2">
												<p className={`truncate text-sm ${conversation.unread ? "font-black text-gray-950" : "text-gray-500"}`}>
													{conversation.preview || "No messages yet"}
												</p>
												{conversation.unread ? (
													<span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-black text-white">
														{conversation.unread}
													</span>
												) : null}
											</div>
										</div>
									</button>
								);
							}) : (
								<p className="p-5 text-sm text-gray-500">No real mentor-startup conversations yet. Accepted mentorships will appear here.</p>
							)}
						</div>
					</aside>

					<main className="flex min-w-0 flex-1 flex-col bg-[#f8fafb]">
						{selected ? (
							<>
								<div className="flex h-[86px] shrink-0 items-center justify-between border-b border-gray-100 bg-white px-8">
									<div className="flex min-w-0 items-center gap-4">
										<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#073f32] text-sm font-black text-white">
											{initials(selected.startupName)}
										</div>
										<div className="min-w-0">
											<h2 className="truncate text-lg font-black">{selected.startupName} - {selected.founderName}</h2>
											<p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
												<span className="h-2 w-2 rounded-full bg-emerald-500" />
												Active chat - {selected.sector}
											</p>
										</div>
									</div>
									<div className="flex shrink-0 items-center gap-3">
										<Link href={`/mentor/requests/profile?startupId=${selected.startupId}`} className="rounded-lg bg-emerald-50 px-4 py-2 text-xs font-black text-[#073f32] hover:bg-emerald-100">
											View Startup
										</Link>
										<Link href={`/mentor/sessions?startupId=${selected.startupId}`} className="rounded-lg bg-[#073f32] px-4 py-2 text-xs font-black text-white hover:bg-[#052f26]">
											Schedule Session
										</Link>
										<button type="button" onClick={() => openCall("voice")} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 hover:text-[#073f32]" title="Audio call">
											<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.3a1 1 0 011 .7l1.4 4.5a1 1 0 01-.5 1.2L6.7 10.5a11 11 0 005.8 5.8l1.1-2.5a1 1 0 011.2-.5l4.5 1.4a1 1 0 01.7 1V19a2 2 0 01-2 2h-1C9.3 21 3 14.7 3 7V5z" />
											</svg>
										</button>
										<button type="button" onClick={() => openCall("video")} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 hover:text-[#073f32]" title="Video call">
											<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.6-2.3A1 1 0 0121 8.6v6.8a1 1 0 01-1.4.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
											</svg>
										</button>
									</div>
								</div>

								{error ? (
									<div className="mx-8 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>
								) : null}

								<div className="min-h-0 flex-1 overflow-y-auto px-10 py-8">
									{messagesLoading ? (
										<p className="text-sm text-gray-500">Loading messages...</p>
									) : messages.length ? (
										<div className="space-y-5">
											{groupedMessages().map((item, index) => {
												if (item.type === "day") {
													return (
														<div key={`${item.label}-${index}`} className="flex justify-center">
															<span className="rounded-full border border-gray-200 bg-white px-5 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">{item.label}</span>
														</div>
													);
												}
												const message = item.message;
												const mine = isMine(message);
												const isFile = message.message_type === "file";
												return (
													<div key={message.mentor_chat_message_id || index} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
														<div className={`max-w-[68%] ${mine ? "text-right" : "text-left"}`}>
															<div className={`rounded-2xl px-5 py-4 shadow-sm ${mine ? "rounded-tr-sm bg-[#073f32] text-white" : "rounded-tl-sm border border-gray-100 bg-white text-gray-950"}`}>
																{isFile ? (
																	<button type="button" onClick={() => openFile(message)} className={`flex w-full min-w-[280px] items-center gap-4 rounded-xl p-3 text-left ${mine ? "bg-white/10 hover:bg-white/15" : "bg-gray-50 hover:bg-gray-100"}`}>
																		<span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${mine ? "bg-white/15" : "bg-emerald-50 text-emerald-600"}`}>
																			<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9l-6-6H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
																			</svg>
																		</span>
																		<span className="min-w-0 flex-1">
																			<span className="block truncate text-sm font-black">{message.file_name || "Attachment"}</span>
																			<span className={`mt-1 block text-xs ${mine ? "text-white/65" : "text-gray-500"}`}>{bytes(message.file_size_bytes)} - Press to view</span>
																		</span>
																	</button>
																) : (
																	<p className="whitespace-pre-wrap text-sm leading-7">{message.display_body || message.text_body}</p>
																)}
																{isFile && message.display_body ? <p className="mt-3 text-sm leading-6">{message.display_body}</p> : null}
															</div>
															<p className="mt-2 text-[10px] font-semibold text-gray-400">{messageTime(message.created_at)}{mine ? " - Sent" : ""}</p>
														</div>
													</div>
												);
											})}
											<div ref={endRef} />
										</div>
									) : (
										<div className="flex h-full items-center justify-center text-sm text-gray-500">No messages yet. Start the conversation with this startup.</div>
									)}
								</div>

								<form onSubmit={send} className="shrink-0 border-t border-gray-100 bg-white px-6 py-5">
									{file ? (
										<div className="mb-3 flex items-center gap-3 text-xs font-semibold text-gray-600">
											<span className="rounded-lg bg-gray-100 px-3 py-1.5">{file.name} ({bytes(file.size)})</span>
											<button type="button" onClick={() => setFile(null)} className="font-black text-red-600">Remove</button>
										</div>
									) : null}
									<div className="flex items-center gap-3 rounded-full bg-gray-100 px-4 py-2">
										<input ref={fileInputRef} type="file" className="hidden" onChange={(event) => setFile(event.target.files?.[0] || null)} />
										<button type="button" onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-[#073f32]" title="Attach file">
											<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.2 7l-6.6 6.6a2 2 0 102.8 2.8l6.4-6.6a4 4 0 00-5.6-5.6l-6.4 6.6a6 6 0 108.5 8.5l6.2-6.2" />
											</svg>
										</button>
										<input
											value={text}
											onChange={(event) => setText(event.target.value)}
											placeholder="Type your message here..."
											className="h-10 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
										/>
										<button type="button" onClick={startDictation} className={recording ? "text-red-500" : "text-gray-400 hover:text-[#073f32]"} title="Dictate message">
											<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm7-3a7 7 0 01-14 0m7 7v3m-4 0h8" />
											</svg>
										</button>
										<button type="submit" disabled={sending || (!text.trim() && !file)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#073f32] text-white shadow-sm hover:bg-[#052f26] disabled:opacity-40" title="Send">
											<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
											</svg>
										</button>
									</div>
								</form>
							</>
						) : (
							<div className="flex flex-1 items-center justify-center text-sm text-gray-500">Select a startup conversation.</div>
						)}
					</main>
				</div>
			</div>

			{callOpen && selected ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
						<div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
							<h3 className="font-black">Call with {selected.startupName}</h3>
							<button type="button" onClick={() => { setCallOpen(false); setCallMode(null); }} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
								<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<div className="p-4">
							<ChatCallPanel
								conversationId={selected.id}
								partnerName={selected.startupName}
								currentUserId={uid}
								api={callApi}
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
