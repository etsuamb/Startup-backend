"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/investor/Sidebar";
import ConnectionsPage from "@/components/connections/ConnectionsPage";
import { getInvestorMessageThreads } from "@/lib/investorApi";

export default function InvestorConnectionsPage() {
	const [connections, setConnections] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let ignore = false;
		getInvestorMessageThreads()
			.then((data) => !ignore && setConnections((data.conversations || []).map((row) => ({
				role: "startup",
				id: row.startup_id,
				name: row.startup_name || "Startup",
				label: row.industry || "Startup",
				description: "Investment connection",
				viewHref: `/investor/discover/profile?startupId=${row.startup_id}`,
				chatHref: `/investor/messages?startupId=${row.startup_id}&conversationId=${row.conversation_id}`,
			}))))
			.catch((ex) => !ignore && setError(ex.message || "Unable to load connections."))
			.finally(() => !ignore && setLoading(false));
		return () => { ignore = true; };
	}, []);

	return <div className="flex min-h-screen bg-white pt-16"><Sidebar /><ConnectionsPage subtitle="Startups connected through accepted investment requests." connections={connections} loading={loading} error={error} emptyText="Your accepted startup connections will appear here." /></div>;
}
