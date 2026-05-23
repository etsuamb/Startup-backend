"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import NotificationBell from "@/components/NotificationBell";
import {
	fetchMentorConversations,
	fetchMentorDashboard,
	fetchMyStartups,
} from "@/lib/mentorApi";

function initials(name) {
	return String(name || "SC")
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();
}

function firstName(profile) {
	return profile?.first_name || String(profile?.full_name || profile?.name || "Mentor").split(/\s+/)[0];
}

function displayName(profile) {
	const joined = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim();
	return joined || profile?.full_name || profile?.name || "Mentor";
}

function formatCurrency(value) {
	const amount = Number(value || 0);
	if (!amount) return "0";
	if (amount >= 1000) return `${(amount / 1000).toFixed(amount >= 10000 ? 1 : 0)}k`;
	return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);
}

function formatDateBadge(value) {
	if (!value) return "Scheduled";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Scheduled";
	const now = new Date();
	const isToday = date.toDateString() === now.toDateString();
	const tomorrow = new Date(now);
	tomorrow.setDate(now.getDate() + 1);
	const day = isToday ? "Today" : date.toDateString() === tomorrow.toDateString() ? "Tomorrow" : date.toLocaleDateString([], { month: "short", day: "numeric" });
	const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	return `${day}, ${time}`;
}

function timeAgo(value) {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
	if (minutes < 60) return `${minutes} min ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours} hours ago`;
	const days = Math.round(hours / 24);
	return days === 1 ? "Yesterday" : `${days} days ago`;
}

function projectProgress(startup, index) {
	const raw =
		startup?.progress_percentage ??
		startup?.completion_percentage ??
		startup?.milestone_progress ??
		startup?.project_progress;
	const parsed = Number(raw);
	if (Number.isFinite(parsed) && parsed > 0) return Math.min(100, Math.round(parsed));
	return [85, 68, 42][index % 3];
}

function Icon({ path, className = "h-4 w-4" }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={path} />
		</svg>
	);
}

export default function MentorDashboard() {
	const [dashboard, setDashboard] = useState(null);
	const [conversations, setConversations] = useState([]);
	const [startups, setStartups] = useState([]);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let alive = true;

		async function loadDashboard() {
			setLoading(true);
			setError("");
			const [dashboardResult, conversationsResult, startupsResult] = await Promise.allSettled([
				fetchMentorDashboard(),
				fetchMentorConversations(),
				fetchMyStartups(),
			]);

			if (!alive) return;

			if (dashboardResult.status === "fulfilled") {
				setDashboard(dashboardResult.value);
			} else {
				setError(dashboardResult.reason?.message || "Failed to load mentor dashboard.");
			}

			if (conversationsResult.status === "fulfilled") {
				const list = conversationsResult.value?.conversations || conversationsResult.value || [];
				setConversations(Array.isArray(list) ? list : []);
			}

			if (startupsResult.status === "fulfilled") {
				const list = startupsResult.value?.startups || startupsResult.value?.my_startups || startupsResult.value || [];
				setStartups(Array.isArray(list) ? list : []);
			}

			setLoading(false);
		}

		loadDashboard();
		return () => {
			alive = false;
		};
	}, []);

	const profile = dashboard?.profile || {};
	const stats = dashboard?.stats || {};
	const pendingRequests = dashboard?.pending_requests || [];
	const upcomingSessions = dashboard?.upcoming_sessions || [];
	const recentMessages = conversations.slice(0, 3);
	const progressStartups = (startups.length ? startups : dashboard?.active_startups || []).slice(0, 3);

	const priorityCount = useMemo(() => {
		return Number(stats.pending_requests || pendingRequests.length || 0) + Number(stats.reports_due || 0);
	}, [pendingRequests.length, stats.pending_requests, stats.reports_due]);

	const statCards = [
		{
			label: "Active Startups",
			value: stats.active_startups ?? startups.length,
			detail: "+2 this month",
			accent: "text-emerald-700",
		},
		{
			label: "Pending Requests",
			value: stats.pending_requests ?? pendingRequests.length,
			detail: `${Math.min(Number(stats.pending_requests || pendingRequests.length || 0), 3)} priority`,
			accent: "text-orange-600",
		},
		{
			label: "Upcoming Sessions",
			value: stats.upcoming_sessions ?? upcomingSessions.length,
			detail: "Next 7 days",
			accent: "text-gray-500",
		},
		{
			label: "Earnings (ETB)",
			value: `${formatCurrency(stats.total_earnings)}${Number(stats.total_earnings || 0) >= 1000 ? "" : ""}`,
			detail: "+12% vs last qtr",
			accent: "text-emerald-700",
			watermark: "$",
		},
	];

	return (
		<div className="min-h-full bg-[#fbfcfc] text-[#061f1a]">
			<header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-gray-100 bg-white px-5 sm:px-8">
				<div className="relative w-full max-w-[360px]">
					<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
						<Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" className="h-4 w-4" />
					</div>
					<input
						type="search"
						placeholder="Search startups, sessions, or resources..."
						className="h-10 w-full rounded-full border border-transparent bg-[#eef1f4] pl-11 pr-4 text-xs font-medium text-gray-700 outline-none transition focus:border-[#0b4a3c]/20 focus:bg-white focus:ring-2 focus:ring-[#0b4a3c]/10"
					/>
				</div>

				<div className="flex items-center gap-4">
					<NotificationBell />
					<div className="hidden h-8 w-px bg-gray-200 sm:block" />
					<div className="hidden text-right sm:block">
						<p className="text-xs font-black text-gray-950">{displayName(profile)}</p>
						<p className="text-[10px] font-medium text-gray-500">{profile?.headline || profile?.professional_title || "Senior Strategy Mentor"}</p>
					</div>
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b4a3c] text-xs font-black text-white ring-2 ring-white">
						{initials(displayName(profile))}
					</div>
				</div>
			</header>

			<main className="mx-auto grid w-full max-w-[1120px] grid-cols-1 gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8">
				<section className="min-w-0">
					{error ? (
						<div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">{error}</div>
					) : null}

					<div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
						<div>
							<h1 className="text-[28px] font-black tracking-tight text-[#052b23]">
								Good morning, {firstName(profile)}
							</h1>
							<p className="mt-2 text-sm text-gray-500">
								You have {loading ? "..." : priorityCount} priority tasks requiring immediate attention today.
							</p>
						</div>
						<div className="flex flex-wrap gap-3">
							{[
								["Proposals", stats.pending_proposals ?? 4, "bg-orange-500"],
								["Follow-ups", stats.follow_ups ?? 2, "bg-emerald-500"],
								["Reports Due", stats.reports_due ?? 1, "bg-red-500"],
							].map(([label, value, color]) => (
								<div key={label} className="inline-flex h-8 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-[11px] font-black shadow-sm">
									<span className={`h-1.5 w-1.5 rounded-full ${color}`} />
									{label}: {loading ? "-" : value}
								</div>
							))}
						</div>
					</div>

					<div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
						{statCards.map((card, index) => (
							<div
								key={card.label}
								className={`relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm ${index === 0 ? "border-l-2 border-l-[#0b4a3c]" : ""}`}
							>
								<p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">{card.label}</p>
								<div className="mt-4 flex items-end gap-3">
									<p className="text-[28px] font-black leading-none text-[#071e1a]">{loading ? "-" : card.value ?? 0}</p>
									<p className={`pb-1 text-[10px] font-black ${card.accent}`}>{card.detail}</p>
								</div>
								{card.watermark ? (
									<div className="pointer-events-none absolute -right-1 -top-1 text-[88px] font-black leading-none text-gray-100">{card.watermark}</div>
								) : null}
							</div>
						))}
					</div>

					<div className="mb-7 flex items-center justify-between">
						<h2 className="flex items-center gap-2 text-base font-black text-[#052b23]">
							<Icon path="M6.75 3v2.25M17.25 3v2.25M3 8.25h18M5.25 5.25h13.5A2.25 2.25 0 0121 7.5v10.25A2.25 2.25 0 0118.75 20H5.25A2.25 2.25 0 013 17.75V7.5a2.25 2.25 0 012.25-2.25z" />
							Upcoming Sessions
						</h2>
						<Link href="/mentor/sessions" className="text-xs font-black text-[#0b4a3c] hover:text-[#07382d]">
							View Calendar
						</Link>
					</div>

					<div className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-2">
						{loading ? (
							<div className="rounded-xl border border-gray-100 bg-white p-5 text-sm text-gray-500 shadow-sm">Loading sessions...</div>
						) : upcomingSessions.length === 0 ? (
							<div className="rounded-xl border border-gray-100 bg-white p-5 text-sm text-gray-500 shadow-sm">No upcoming sessions.</div>
						) : (
							upcomingSessions.slice(0, 2).map((session) => (
								<div key={session.mentorship_session_id || session.session_id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
									<div className="mb-4 flex items-start justify-between gap-3">
										<div className="flex min-w-0 items-center gap-3">
											<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0b4a3c] text-[10px] font-black text-white">
												{initials(session.startup_name)}
											</div>
											<div className="min-w-0">
												<p className="truncate text-sm font-black text-gray-950">{session.startup_name || "Startup session"}</p>
												<p className="truncate text-[11px] font-medium text-gray-500">{session.subject || session.title || "Mentorship session"}</p>
											</div>
										</div>
										<span className="shrink-0 rounded-md bg-emerald-100 px-2 py-1 text-[9px] font-black uppercase text-[#0b4a3c]">
											{formatDateBadge(session.scheduled_at || session.start_time)}
										</span>
									</div>
									<div className="flex gap-2">
										<Link href="/mentor/sessions" className="flex-1 rounded-lg bg-[#0b4a3c] px-4 py-3 text-center text-xs font-black text-white transition hover:bg-[#07382d]">
											Join Session
										</Link>
										<button type="button" className="h-10 w-10 rounded-lg bg-gray-100 text-sm font-black text-gray-500 transition hover:bg-gray-200">
											...
										</button>
									</div>
								</div>
							))
						)}
					</div>

					<section className="mb-7">
						<div className="mb-3 flex items-center justify-between">
							<h2 className="flex items-center gap-2 text-base font-black text-[#052b23]">
								<Icon path="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0A5.971 5.971 0 006 18.72M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" />
								New Mentorship Requests
							</h2>
							<Link href="/mentor/requests" className="text-xs font-black text-[#0b4a3c] hover:text-[#07382d]">
								View All
							</Link>
						</div>
						<div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
							<div className="grid grid-cols-[1.2fr_1fr_1fr_80px] bg-gray-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
								<span>Startup</span>
								<span>Industry</span>
								<span>Focus Area</span>
								<span className="text-right">Action</span>
							</div>
							{loading ? (
								<p className="px-4 py-5 text-sm text-gray-500">Loading requests...</p>
							) : pendingRequests.length === 0 ? (
								<p className="px-4 py-5 text-sm text-gray-500">No new mentorship requests.</p>
							) : (
								pendingRequests.slice(0, 3).map((request) => (
									<div key={request.mentorship_request_id} className="grid grid-cols-[1.2fr_1fr_1fr_80px] items-center border-t border-gray-50 px-4 py-4 text-xs">
										<div className="flex min-w-0 items-center gap-3">
											<div className="flex h-7 w-7 items-center justify-center rounded bg-emerald-50 text-[10px] font-black text-[#0b4a3c]">
												{initials(request.startup_name)}
											</div>
											<span className="truncate font-black text-gray-950">{request.startup_name || "Startup"}</span>
										</div>
										<span className="truncate text-gray-700">{request.industry || "General"}</span>
										<span>
											<span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-[#0b4a3c]">
												{request.focus_area || request.subject || "Mentorship"}
											</span>
										</span>
										<Link href={`/mentor/requests/profile?requestId=${request.mentorship_request_id}`} className="text-right text-xs font-black text-[#0b4a3c]">
											Review
										</Link>
									</div>
								))
							)}
						</div>
					</section>

					<section>
						<h2 className="mb-3 flex items-center gap-2 text-base font-black text-[#052b23]">
							<Icon path="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
							Active Cohort Progress
						</h2>
						<div className="rounded-xl bg-[#0b4a3c] p-4 text-white shadow-sm">
							{progressStartups.length === 0 ? (
								<p className="text-sm text-emerald-100">No active cohort progress yet.</p>
							) : (
								<div className="space-y-4">
									{progressStartups.map((startup, index) => {
										const progress = projectProgress(startup, index);
										return (
											<div key={startup.startup_id || startup.id || startup.startup_name || index}>
												<div className="mb-2 flex justify-between text-xs font-black">
													<span>{startup.startup_name || startup.name || `Startup ${index + 1}`}</span>
													<span>{progress}%</span>
												</div>
												<div className="h-1.5 rounded-full bg-white/15">
													<div className="h-1.5 rounded-full bg-white" style={{ width: `${progress}%` }} />
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
					</section>
				</section>

				<aside className="space-y-6">
					<section>
						<p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Quick Actions</p>
						<div className="grid grid-cols-2 gap-3">
							{[
								["Review Requests", "/mentor/requests", "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"],
								["Schedule Session", "/mentor/sessions", "M6.75 3v2.25M17.25 3v2.25M3 8.25h18M5.25 5.25h13.5A2.25 2.25 0 0121 7.5v10.25A2.25 2.25 0 0118.75 20H5.25A2.25 2.25 0 013 17.75V7.5a2.25 2.25 0 012.25-2.25z"],
								["Share Resource", "/mentor/resources", "M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.697.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"],
							].map(([label, href, path]) => (
								<Link key={label} href={href} className="flex min-h-[88px] flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-4 text-center text-xs font-black text-gray-950 shadow-sm transition hover:border-[#0b4a3c]/20 hover:bg-emerald-50">
									<Icon path={path} className="mb-3 h-5 w-5 text-gray-500" />
									{label}
								</Link>
							))}
						</div>
					</section>

					<section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
						<div className="mb-4 flex items-center justify-between">
							<p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Recent Messages</p>
							<Link href="/mentor/messages" className="text-gray-400 hover:text-[#0b4a3c]">
								<Icon path="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
							</Link>
						</div>
						{recentMessages.length === 0 ? (
							<p className="py-3 text-sm text-gray-500">No recent messages.</p>
						) : (
							<div className="space-y-4">
								{recentMessages.map((message) => (
									<div key={message.mentor_conversation_id || message.conversation_id} className="flex gap-3">
										<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-black text-[#0b4a3c]">
											{initials(message.startup_name)}
										</div>
										<div className="min-w-0">
											<p className="truncate text-xs font-black text-gray-950">{message.startup_name || "StartupConnect"}</p>
											<p className="truncate text-[11px] text-gray-500">{message.last_message_preview || "New message available"}</p>
											<p className="mt-1 text-[10px] font-medium text-gray-400">{timeAgo(message.last_message_at || message.updated_at)}</p>
										</div>
									</div>
								))}
							</div>
						)}
						<Link href="/mentor/messages" className="mt-5 flex h-9 items-center justify-center rounded-lg border border-gray-200 text-xs font-black text-gray-900 transition hover:bg-gray-50">
							Go to Messages
						</Link>
					</section>

					<section className="border-l-2 border-[#0b4a3c] bg-[#eef4f1] p-5">
						<p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#0b4a3c]">Institutional Insight</p>
						<p className="text-sm font-semibold italic leading-6 text-[#092820]">
							"The most successful startups in Ethiopia are not just solving problems; they are creating infrastructure for the next generation of commerce."
						</p>
						<p className="mt-4 text-[10px] font-bold text-gray-500">Quarterly Mentor Review</p>
					</section>
				</aside>
			</main>
		</div>
	);
}
