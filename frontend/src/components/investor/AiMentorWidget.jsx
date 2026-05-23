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
	const [open, setOpen] = useState(false);
	const [sessionId, setSessionId] = useState(null);
	const [sessions, setSessions] = useState([]);
	const [messages, setMessages] = useState([
		{
			id: "welcome",
			sender: "ai",
			message: "Hi, I am your AI investment assistant. Ask me about startup evaluation, due diligence, portfolio fit, or offer preparation.",
			created_at: new Date().toISOString(),
		},
	]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!open) return;
		getInvestorAiMentorSessions()
			.then((data) => setSessions(Array.isArray(data?.sessions) ? data.sessions : []))
			.catch(() => {});
	}, [open]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, open]);

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
		if (!text || loading) return;

		setMessages((current) => [
			...current,
			{
				id: `local-${Date.now()}`,
				sender: "startup",
				message: text,
				created_at: new Date().toISOString(),
			},
		]);
		setInput("");
		setLoading(true);
		setError("");

		try {
			const data = await sendInvestorAiMentorMessage({ sessionId, message: text });
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
				.catch(() => {});
		} catch (err) {
			setError(err?.message || "AI assistant could not respond.");
		} finally {
			setLoading(false);
		}
	}

	function startNewChat() {
		setSessionId(null);
		setError("");
		setMessages([
			{
				id: "welcome",
				sender: "ai",
				message: "New chat started. Which startup, deal term, or portfolio question should we analyze?",
				created_at: new Date().toISOString(),
			},
		]);
	}

	return (
		<div className="fixed bottom-8 right-8 z-50">
			{open ? (
				<div className="mb-4 flex h-[620px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
					<div className="flex items-center justify-between bg-[#0a4d3c] px-5 py-4 text-white">
						<div>
							<h2 className="text-sm font-bold">AI Investment Assistant</h2>
							<p className="text-[11px] text-white/70">StartupConnect Ethiopia</p>
						</div>
						<div className="flex items-center gap-2">
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
						<div className="flex gap-2 overflow-x-auto border-b border-gray-100 px-4 py-3">
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

					<div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">
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

					<form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-100 bg-white p-4">
						<input
							value={input}
							onChange={(event) => setInput(event.target.value)}
							placeholder="Ask about a startup or deal..."
							className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#0a4d3c]/40 focus:ring-2 focus:ring-[#0a4d3c]/10"
						/>
						<button type="submit" disabled={!input.trim() || loading} className="rounded-xl bg-[#0a4d3c] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#07382b] disabled:bg-gray-300">
							Send
						</button>
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
