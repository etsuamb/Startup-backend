"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/startup/Sidebar";
import StartupChatView from "@/components/startup/StartupChatView";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import {
	downloadInvestorChatFile,
	createInvestorChatConversation,
	createMentorChatConversation,
	endInvestorVideoCall,
	endMentorVideoCall,
	getInvestorChatConversations,
	getInvestorChatMessages,
	getMentorChatConversations,
	getMentorChatMessages,
	joinInvestorVideoCall,
	joinMentorVideoCall,
	sendInvestorChatFile,
	sendInvestorChatMessage,
	sendMentorChatFile,
	sendMentorChatMessage,
	setInvestorVideoScreenShare,
	setMentorVideoScreenShare,
	startInvestorVideoCall,
	startMentorVideoCall,
	getInvestorVideoStatus,
	getMentorVideoStatus,
} from "@/lib/startupApi";

const investorCallApi = {
	getStatus: getInvestorVideoStatus,
	start: startInvestorVideoCall,
	join: joinInvestorVideoCall,
	end: endInvestorVideoCall,
	screenShare: setInvestorVideoScreenShare,
};

const mentorCallApi = {
	getStatus: getMentorVideoStatus,
	start: startMentorVideoCall,
	join: joinMentorVideoCall,
	end: endMentorVideoCall,
	screenShare: setMentorVideoScreenShare,
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

function normalizeMentorConversation(row) {
	const contactName =
		`${row.mentor_first_name || ""} ${row.mentor_last_name || ""}`.trim() ||
		"Mentor";
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

function StartupAllChats() {
	const router = useRouter();
	const [conversations, setConversations] = useState([]);
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const { setHandlers: setSocketHandlers } = useRealtimeChat({
		channel: "investor",
		conversationId: null,
		enabled: false,
	});

	useEffect(() => {
		let ignore = false;
		(async () => {
			try {
				const [investorData, mentorData] = await Promise.all([
					getInvestorChatConversations(),
					getMentorChatConversations(),
				]);
				if (ignore) return;
				setConversations([
					...(investorData.conversations || []).map((row) => ({
						...normalizeInvestorConversation(row),
						kind: "investor",
					})),
					...(mentorData.conversations || []).map((row) => ({
						...normalizeMentorConversation(row),
						kind: "mentor",
					})),
				]);
			} catch (err) {
				if (!ignore) setError(err.message || "Unable to load conversations.");
			} finally {
				if (!ignore) setLoading(false);
			}
		})();
		return () => {
			ignore = true;
		};
	}, []);

	useEffect(() => {
		setSocketHandlers({
			onCallSignal: (payload) => {
				if (payload?.event !== "ringing") return;
				const kind = payload.channel === "mentor" ? "mentor" : "investor";
				router.push(
					`/startup/chat?kind=${kind}&conversationId=${payload.conversationId}`,
				);
			},
		});
	}, [router, setSocketHandlers]);

	const visibleConversations = useMemo(() => {
		const needle = query.trim().toLowerCase();
		return conversations
			.filter((conversation) =>
				!needle ||
				[conversation.company, conversation.contactName, conversation.preview]
					.some((value) => String(value || "").toLowerCase().includes(needle)),
			)
			.sort((a, b) => new Date(b.lastAt || 0) - new Date(a.lastAt || 0));
	}, [conversations, query]);

	return (
		<div className="flex h-screen overflow-hidden bg-white font-sans text-gray-900">
			<Sidebar />
			<main className="min-w-0 flex-1 overflow-y-auto bg-[#fafbfc]">
				<header className="border-b border-gray-100 bg-white px-6 py-5 sm:px-8">
					<h1 className="text-xl font-bold">Messages</h1>
					<p className="mt-1 text-sm text-gray-500">Investor and mentor conversations</p>
				</header>
				<section className="mx-auto max-w-4xl px-4 py-6 sm:px-8">
					<div className="mb-5 flex flex-wrap gap-2">
						<Link href="/startup/chat" className="rounded-lg bg-[#0f3d32] px-3 py-2 text-xs font-bold text-white">
							All Chats
						</Link>
						<Link href="/startup/chat?kind=investor" className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50">
							Investors
						</Link>
						<Link href="/startup/chat?kind=mentor" className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50">
							Mentors
						</Link>
					</div>
					<input
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Search conversations..."
						className="mb-5 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0f3d32]/50 focus:ring-2 focus:ring-[#0f3d32]/10"
					/>
					{error ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
					{loading ? (
						<p className="text-sm text-gray-500">Loading conversations...</p>
					) : visibleConversations.length ? (
						<div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
							{visibleConversations.map((conversation) => (
								<Link
									key={`${conversation.kind}-${conversation.id}`}
									href={`/startup/chat?kind=${conversation.kind}&conversationId=${conversation.id}`}
									className="flex items-center gap-4 border-b border-gray-100 px-4 py-4 last:border-b-0 hover:bg-gray-50"
								>
									<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0f3d32] text-sm font-bold text-white">
										{conversation.avatarLetter}
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<p className="truncate text-sm font-bold">{conversation.contactName}</p>
											<span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-500">
												{conversation.kind}
											</span>
										</div>
										<p className="mt-1 truncate text-xs text-gray-500">{conversation.company}</p>
										<p className="mt-1 truncate text-xs text-gray-400">{conversation.preview || "No messages yet"}</p>
									</div>
									{conversation.unread ? (
										<span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#0f3d32] px-1.5 text-[10px] font-bold text-white">
											{conversation.unread}
										</span>
									) : null}
								</Link>
							))}
						</div>
					) : (
						<p className="text-sm text-gray-500">No accepted conversations yet.</p>
					)}
				</section>
			</main>
		</div>
	);
}

export default function StartupInvestorChatPage() {
	const searchParams = useSearchParams();
	const chatKind = searchParams.get("kind");
	const isMentorChat = chatKind === "mentor";

	if (!chatKind) return <StartupAllChats />;

	if (isMentorChat) {
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
				messageId={(m) => m.mentor_chat_message_id || m.chat_message_id}
				callApi={mentorCallApi}
				emptyListHint="No accepted mentor chats yet. Conversations appear after a mentorship offer or request is accepted."
			/>
		);
	}

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
