"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/mentor/Sidebar";
import ConnectionsPage from "@/components/connections/ConnectionsPage";
import { fetchMentorConversations } from "@/lib/mentorApi";

export default function MentorConnectionsPage() {
	const [connections, setConnections] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let ignore = false;
		fetchMentorConversations()
			.then((data) => !ignore && setConnections((data.conversations || []).map((row) => ({
				role: "startup",
				id: row.startup_id,
				name: row.startup_name || "Startup",
				label: row.industry || row.business_stage || "Startup",
				description: "Mentorship connection",
				viewHref: `/mentor/requests/profile?startupId=${row.startup_id}`,
				chatHref: `/mentor/messages?startupId=${row.startup_id}&conversationId=${row.mentor_conversation_id}`,
			}))))
			.catch((ex) => !ignore && setError(ex.message || "Unable to load connections."))
			.finally(() => !ignore && setLoading(false));
		return () => { ignore = true; };
	}, []);

	return <div className="flex min-h-screen bg-white"><Sidebar /><ConnectionsPage subtitle="Startups connected through accepted mentorship requests." connections={connections} loading={loading} error={error} emptyText="Your accepted startup connections will appear here." /></div>;
}
