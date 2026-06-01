"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/startup/Sidebar";
import ConnectionsPage from "@/components/connections/ConnectionsPage";
import { getInvestorChatConversations, getMentorChatConversations } from "@/lib/startupApi";

export default function StartupConnectionsPage() {
	const [connections, setConnections] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let ignore = false;
		Promise.all([getInvestorChatConversations(), getMentorChatConversations()])
			.then(([investors, mentors]) => {
				if (ignore) return;
				setConnections([
					...(investors.conversations || []).map((row) => ({
						role: "investor",
						id: row.investor_id,
						name: row.investor_company || `${row.investor_first_name || ""} ${row.investor_last_name || ""}`.trim() || "Investor",
						label: row.investor_type || "Investor",
						description: "Investment connection",
						viewHref: `/startup/discover/investor/${row.investor_id}`,
						chatHref: `/startup/chat?kind=investor&conversationId=${row.conversation_id}`,
					})),
					...(mentors.conversations || []).map((row) => ({
						role: "mentor",
						id: row.mentor_id,
						name: `${row.mentor_first_name || ""} ${row.mentor_last_name || ""}`.trim() || "Mentor",
						label: row.mentor_headline || "Mentor",
						description: "Mentorship connection",
						viewHref: `/startup/discover/mentor/${row.mentor_id}`,
						chatHref: `/startup/chat?kind=mentor&conversationId=${row.mentor_conversation_id}`,
					})),
				]);
			})
			.catch((ex) => !ignore && setError(ex.message || "Unable to load connections."))
			.finally(() => !ignore && setLoading(false));
		return () => { ignore = true; };
	}, []);

	return <div className="flex min-h-screen bg-white"><Sidebar /><ConnectionsPage subtitle="Investors and mentors connected through accepted requests." connections={connections} loading={loading} error={error} emptyText="Your accepted investor and mentor connections will appear here." /></div>;
}
