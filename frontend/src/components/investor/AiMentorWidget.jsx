"use client";

import { useEffect, useRef, useState } from "react";
import { getInvestorAiMentorMessages, getInvestorAiMentorSessions, sendInvestorAiMentorMessage } from "@/lib/investorApi";

function formatTime(value) {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function InvestorAiMentorWidget() {
	const bottomRef = useRef(null);
	const fileInputRef = useRef(null);
	const recognitionRef = useRef(null);
	const [open, setOpen] = useState(false);
	const [sessionId, setSessionId] = useState(null);
	const [sessions, setSessions] = useState([]);
	const [messages, setMessages] = useState([
		{
			id: "welcome",
			sender: "ai",
			message: "Hi, I can help with StartupConnect features, dashboard navigation, startup discovery, offers, payments, meetings, notifications, and investment questions. Ask me anything about using the app.",
			created_at: new Date().toISOString(),
		},
	]);
	const [input, setInput] = useState("");
	const [files, setFiles] = useState([]);
	const [listening, setListening] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!open) return;
		getInvestorAiMentorSessions()
			.then((data) => setSessions(Array.isArray(data?.sessions) ? data.sessions : []))
			.catch((err) => setError(err?.message || "Unable to load AI assistant chat history."));
	}, [open]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, open]);

	useEffect(() => {
		return () => recognitionRef.current?.abort?.();
	}, []);

	async function loadSession(nextSessionId) {
		try {
			setError("");
			const data = await getInvestorAiMentorMessages(nextSessionId);
			const loaded = Array.isArray(data?.messages) ? data.messages : [];
			setSessionId(nextSessionId);
			setMessages(loaded.length ? loaded : messages);
		} catch (err) {
			setError(err?.message || "Unable to load this chat.");
		}
	}

	async function handleSubmit(event) {
		event.preventDefault();
		const text = input.trim();
		if ((!text && files.length === 0) || loading) return;

		setMessages((current) => [
			...current,
			{
				id: `local-${Date.now()}`,
				sender: "startup",
				message: files.length
					? `${text || "Please review the attached file(s)."}\n\n${files.map((file) => `[Attached file: ${file.name}]`).join("\n")}`
					: text,
				created_at: new Date().toISOString(),
			},
		]);
		setInput("");
		const outgoingFiles = files;
		setFiles([]);
		setLoading(true);
		setError("");

		try {
			const payload = new FormData();
			if (sessionId) payload.append("sessionId", sessionId);
			payload.append("message", text);
			outgoingFiles.forEach((file) => payload.append("files", file));
			const data = await sendInvestorAiMentorMessage(payload);
			setSessionId(data.sessionId);
			setMessages((current) => [
				...current,
				data.message || {
					id: `ai-${Date.now()}`,
					sender: "ai",
					message: data.reply,
					created_at: new Date().toISOString(),
				},
			]);
			getInvestorAiMentorSessions()
				.then((sessionsData) => setSessions(Array.isArray(sessionsData?.sessions) ? sessionsData.sessions : []))
				.catch((err) => setError(err?.message || "Unable to refresh AI assistant chat history."));
		} catch (err) {
			setError(err?.message || "AI assistant could not respond.");
		} finally {
			setLoading(false);
		}
	}

	function handleFilesSelected(event) {
		const selected = Array.from(event.target.files || []);
		setFiles((current) => [...current, ...selected].slice(0, 5));
		event.target.value = "";
	}

	function removeFile(index) {
		setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
	}

	function toggleVoiceInput() {
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		if (!SpeechRecognition) {
			setError("Voice input is not supported in this browser.");
			return;
		}

		if (listening) {
			recognitionRef.current?.stop?.();
			setListening(false);
			return;
		}

		const recognition = new SpeechRecognition();
		recognition.lang = "en-US";
		recognition.interimResults = true;
		recognition.continuous = false;
		recognition.onresult = (event) => {
			const transcript = Array.from(event.results)
				.map((result) => result[0]?.transcript || "")
				.join(" ")
				.trim();
			if (transcript) setInput(transcript);
		};
		recognition.onerror = () => {
			setListening(false);
			setError("Voice input stopped. Please try again.");
		};
		recognition.onend = () => setListening(false);
		recognitionRef.current = recognition;
		setListening(true);
		recognition.start();
	}

	function startNewChat() {
		setSessionId(null);
		setError("");
		setMessages([
			{
				id: "welcome",
				sender: "ai",
				message: "New chat started. Ask me about the app, startup discovery, offers, meetings, payments, messages, or investment evaluation.",
				created_at: new Date().toISOString(),
			},
		]);
	}

	return (
		<div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
			{open ? (
				<div className="mb-3 flex h-[min(620px,calc(100vh-6rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
					<div className="flex shrink-0 items-center justify-between bg-[#0a4d3c] px-4 py-3 text-white sm:px-5 sm:py-4">
						<div>
							<h2 className="text-sm font-bold">AI Investment Assistant</h2>
							<p className="text-[11px] text-white/70">App help and investment assistant</p>
						</div>
						<div className="flex shrink-0 items-center gap-2">
							<button type="button" onClick={startNewChat} className="rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-bold hover:bg-white/15">
								New
							</button>
							<button type="button" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/15" aria-label="Close AI assistant">
								<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					</div>

					{sessions.length ? (
						<div className="flex shrink-0 gap-2 overflow-x-auto border-b border-gray-100 px-4 py-3">
							{sessions.slice(0, 5).map((session) => (
								<button
									key={session.id}
									type="button"
									onClick={() => loadSession(session.id)}
									className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${
										String(sessionId) === String(session.id)
											? "bg-[#e9f7ef] text-[#0a4d3c]"
											: "bg-gray-100 text-gray-500 hover:bg-gray-200"
									}`}
								>
									{session.title || "Chat"}
								</button>
							))}
						</div>
					) : null}

					<div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">
						{messages.map((message) => {
							const outgoing = message.sender === "startup";
							return (
								<div key={message.id || `${message.sender}-${message.created_at}`} className={`flex ${outgoing ? "justify-end" : "justify-start"}`}>
									<div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
										outgoing ? "rounded-br-sm bg-[#0a4d3c] text-white" : "rounded-bl-sm bg-white text-gray-700"
									}`}>
										<p className="whitespace-pre-wrap">{message.message}</p>
										<div className={`mt-2 text-right text-[10px] ${outgoing ? "text-white/60" : "text-gray-400"}`}>
											{formatTime(message.created_at)}
										</div>
									</div>
								</div>
							);
						})}
						{loading ? (
							<div className="flex justify-start">
								<div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm font-semibold text-gray-500 shadow-sm">
									Thinking...
								</div>
							</div>
						) : null}
						<div ref={bottomRef} />
					</div>

					{error ? <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">{error}</div> : null}

					<form onSubmit={handleSubmit} className="shrink-0 border-t border-gray-100 bg-white p-3">
						{files.length ? (
							<div className="mb-2 flex max-h-20 flex-wrap gap-2 overflow-y-auto">
								{files.map((file, index) => (
									<button
										type="button"
										key={`${file.name}-${index}`}
										onClick={() => removeFile(index)}
										className="max-w-full truncate rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-100"
										title="Remove file"
									>
										{file.name}
									</button>
								))}
							</div>
						) : null}
						<div className="flex items-end gap-2">
							<input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilesSelected} />
							<button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" aria-label="Attach file">
								<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a4 4 0 10-5.657-5.657L5.757 10.757a6 6 0 108.486 8.486L20.5 13" />
								</svg>
							</button>
							<button type="button" onClick={toggleVoiceInput} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-gray-600 hover:bg-gray-50 ${listening ? "border-red-300 bg-red-50 text-red-600" : "border-gray-200"}`} aria-label="Voice input">
								<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18.75a6 6 0 006-6h-1.5a4.5 4.5 0 01-9 0H6a6 6 0 006 6zm0 0V22m-3 0h6M12 15a3 3 0 003-3V5a3 3 0 10-6 0v7a3 3 0 003 3z" />
								</svg>
							</button>
							<textarea
								value={input}
								onChange={(event) => setInput(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter" && !event.shiftKey) {
										event.preventDefault();
										event.currentTarget.form?.requestSubmit();
									}
								}}
								rows={1}
								placeholder={listening ? "Listening..." : "Ask about the app or a deal..."}
								className="max-h-24 min-h-11 min-w-0 flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#0a4d3c]/40 focus:ring-2 focus:ring-[#0a4d3c]/10"
							/>
							<button type="submit" disabled={(!input.trim() && files.length === 0) || loading} className="h-11 shrink-0 rounded-xl bg-[#0a4d3c] px-4 text-sm font-bold text-white transition hover:bg-[#07382b] disabled:bg-gray-300">
								Send
							</button>
						</div>
					</form>
				</div>
			) : null}

			<button type="button" onClick={() => setOpen((current) => !current)} className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0a4d3c] text-white shadow-xl transition hover:scale-105 hover:bg-[#07382b]" aria-label="Open AI assistant">
				<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z" />
				</svg>
			</button>
		</div>
	);
}
