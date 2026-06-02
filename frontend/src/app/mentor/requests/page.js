"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import NotificationBell from "@/components/NotificationBell";
import ActorAvatar from "@/components/auth/ActorAvatar";
import {
	acceptRequest,
	fetchIncomingRequests,
	rejectRequest,
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

function normalizeStatus(status) {
	const value = String(status || "pending").toLowerCase();
	if (value === "rejected") return "declined";
	return value;
}

function statusStyles(status) {
	const normalized = normalizeStatus(status);
	if (normalized === "pending") return "bg-emerald-100 text-[#0a4d3c]";
	if (normalized === "accepted") return "bg-blue-50 text-blue-700";
	if (normalized === "new") return "bg-[#0a4d3c] text-white";
	if (normalized === "declined") return "bg-red-50 text-red-700";
	return "bg-gray-100 text-gray-700";
}

function priorityLabel(request) {
	const value = String(request.priority || request.urgency || "").toLowerCase();
	if (value.includes("high")) return { label: "High Priority", color: "bg-red-500" };
	if (value.includes("low")) return { label: "Low Priority", color: "bg-gray-400" };
	return { label: "Med Priority", color: "bg-emerald-500" };
}

function requestFocus(request) {
	return request.focus_area || request.subject || request.requested_support || "Mentorship";
}

function founderName(request) {
	return request.founder_name || request.contact_name || request.full_name || request.name || "Founder";
}

function compactText(value, limit = 120) {
	const text = String(value || "").replace(/\s+/g, " ").trim();
	if (!text) return "";
	return text.length > limit ? `${text.slice(0, limit).trim()}...` : text;
}

function proposalDetails(request) {
	const raw = String(request?.message || request?.description || "").trim();
	const fields = {};
	const labelPattern = /(?:^|\s)(Proposal Title|Focus Area|Duration|Sessions Count|Frequency|Format|Mode|Remote Start Date|Optional Fee|Scope & Objectives|Mentorship Plan|Deliverables):\s*/g;
	const matches = Array.from(raw.matchAll(labelPattern));

	matches.forEach((match, index) => {
		const key = match[1];
		const start = match.index + match[0].length;
		const end = matches[index + 1]?.index ?? raw.length;
		fields[key] = raw.slice(start, end).trim();
	});

	return {
		title: fields["Proposal Title"] || requestFocus(request),
		focus: fields["Focus Area"] || request.focus_area || request.requested_support || requestFocus(request),
		duration: fields.Duration || "",
		sessions: fields["Sessions Count"] || "",
		frequency: fields.Frequency || "",
		format: fields.Format || "",
		mode: fields.Mode || "",
		startDate: fields["Remote Start Date"] || "",
		fee: fields["Optional Fee"] || "",
		objective: fields["Scope & Objectives"] || raw || `Seeking guidance on ${requestFocus(request).toLowerCase()} and execution readiness.`,
	};
}

function exportCsv(rows) {
	const header = ["Startup", "Founder", "Industry", "Stage", "Support", "Direction", "Status"];
	const body = rows.map((row) => [
		row.startup_name || "",
		founderName(row),
		row.industry || "",
		row.business_stage || row.stage || "",
		requestFocus(row),
		row.initiated_by === "mentor" ? "Sent by mentor" : "Sent by startup",
		row.status || "",
	]);
	const csv = [header, ...body]
		.map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
		.join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = "mentorship-requests.csv";
	link.click();
	URL.revokeObjectURL(url);
}

function Icon({ path, className = "h-4 w-4" }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={path} />
		</svg>
	);
}

function DetailRow({ label, value }) {
	return (
		<div className="flex items-start justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2">
			<p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">{label}</p>
			<p className="max-w-[150px] text-right text-xs font-black text-gray-950">{value}</p>
		</div>
	);
}

export default function MentorRequestsPage() {
	const searchParams = useSearchParams();
	const [query, setQuery] = useState(searchParams.get("search") || "");
	const [requests, setRequests] = useState([]);
	const [statusFilter, setStatusFilter] = useState("all");
	const [industryFilter, setIndustryFilter] = useState("all");
	const [stageFilter, setStageFilter] = useState("all");
	const [focusFilter, setFocusFilter] = useState("all");
	const [selectedId, setSelectedId] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [busyId, setBusyId] = useState(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const rows = await fetchIncomingRequests();
			const allRequests = Array.isArray(rows) ? rows : rows?.requests || [];
			const list = allRequests;
			setRequests(list);
			setSelectedId((current) => current || list[0]?.mentorship_request_id || null);
		} catch (ex) {
			setError(ex.message || "Failed to load requests");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		// Load backend request data when the page opens.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		load();
	}, [load]);

	useEffect(() => {
		queueMicrotask(() => setQuery(searchParams.get("search") || ""));
	}, [searchParams]);

	const options = useMemo(() => {
		const unique = (keyFn) => Array.from(new Set(requests.map(keyFn).filter(Boolean))).sort();
		return {
			industries: unique((request) => request.industry),
			stages: unique((request) => request.business_stage || request.stage),
			focusAreas: unique(requestFocus),
		};
	}, [requests]);

	const filtered = useMemo(() => {
		const needle = query.trim().toLowerCase();
		return requests.filter((request) => {
			const status = normalizeStatus(request.status);
			const stage = request.business_stage || request.stage || "";
			return (
				(statusFilter === "all" || status === statusFilter || request.status === statusFilter) &&
				(industryFilter === "all" || request.industry === industryFilter) &&
				(stageFilter === "all" || stage === stageFilter) &&
				(focusFilter === "all" || requestFocus(request) === focusFilter) &&
				(!needle || [
					request.startup_name,
					founderName(request),
					request.industry,
					stage,
					requestFocus(request),
				].some((value) => String(value || "").toLowerCase().includes(needle)))
			);
		});
	}, [focusFilter, industryFilter, query, requests, stageFilter, statusFilter]);

	useEffect(() => {
		if (!filtered.length) {
			// Keep the detail panel in sync with the filtered table.
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setSelectedId(null);
			return;
		}
		if (!filtered.some((request) => request.mentorship_request_id === selectedId)) {
			// Keep the selected row valid after filters change.
			setSelectedId(filtered[0].mentorship_request_id);
		}
	}, [filtered, selectedId]);

	const selected = filtered.find((request) => request.mentorship_request_id === selectedId) || filtered[0] || null;
	const selectedDetails = selected ? proposalDetails(selected) : null;
	const selectedIsOutbound = selected?.initiated_by === "mentor";

	const stats = useMemo(() => {
		const proposalsSent = requests.filter((request) => request.initiated_by === "mentor").length;
		const awaiting = requests.filter(
			(request) => request.initiated_by === "mentor" && ["pending", "new"].includes(normalizeStatus(request.status)),
		).length;
		return {
			total: requests.length,
			proposalsSent,
			awaiting,
		};
	}, [requests]);

	async function onAccept(id) {
		setBusyId(id);
		try {
			await acceptRequest(id);
			await load();
		} catch (ex) {
			setError(ex.message || "Accept failed");
		} finally {
			setBusyId(null);
		}
	}

	async function onReject(id) {
		const reason = window.prompt("Rejection reason (optional):") || "";
		setBusyId(id);
		try {
			await rejectRequest(id, reason);
			await load();
		} catch (ex) {
			setError(ex.message || "Decline failed");
		} finally {
			setBusyId(null);
		}
	}

	return (
		<div className="min-h-full bg-[#fbfcfc] text-[#061f1a]">
			<header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-gray-100 bg-white px-5 sm:px-8">
				<div className="relative w-full max-w-[360px]">
					<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
						<Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
					</div>
					<input
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Search startups or founders..."
						className="h-10 w-full rounded-full border border-transparent bg-[#eef1f4] pl-11 pr-4 text-xs font-medium text-gray-700 outline-none transition focus:border-[#0b4a3c]/20 focus:bg-white focus:ring-2 focus:ring-[#0b4a3c]/10"
					/>
				</div>
				<div className="flex items-center gap-4">
					<NotificationBell />
					<button type="button" className="hidden h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-50 hover:text-gray-700 sm:flex" aria-label="Settings">
						<Icon path="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.33.787.713 1.002.382.215.837.244 1.242.1l.85-.304a1.125 1.125 0 011.37.49l.546.947c.275.477.196 1.079-.197 1.464l-.646.635a1.125 1.125 0 000 1.604l.646.635c.393.385.472.987.197 1.464l-.546.947a1.125 1.125 0 01-1.37.49l-.85-.304a1.125 1.125 0 00-1.242.1 1.125 1.125 0 00-.713 1.002l-.149.894c-.09.542-.56.94-1.11.94h-1.093c-.55 0-1.02-.398-1.11-.94l-.149-.894a1.125 1.125 0 00-.713-1.002 1.125 1.125 0 00-1.242-.1l-.85.304a1.125 1.125 0 01-1.37-.49l-.546-.947a1.125 1.125 0 01.197-1.464l.646-.635a1.125 1.125 0 000-1.604l-.646-.635a1.125 1.125 0 01-.197-1.464l.546-.947a1.125 1.125 0 011.37-.49l.85.304c.405.145.86.115 1.242-.1.383-.215.643-.578.713-1.002l.149-.894zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</button>
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b4a3c] text-xs font-black text-white ring-2 ring-white">
						M
					</div>
				</div>
			</header>

			<main className="mx-auto grid w-full max-w-[1120px] grid-cols-1 gap-5 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8">
				<section className="min-w-0">
					<div className="mb-6">
						<h1 className="text-[28px] font-black tracking-tight text-[#052b23]">Mentorship Requests & Proposals</h1>
						<p className="mt-2 text-sm text-gray-500">
							Review incoming startup requests and track the proposals you sent to startups.
						</p>
					</div>

					{error ? (
						<div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">{error}</div>
					) : null}

					<div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
						{[
							["Total Requests", stats.total, "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"],
							["Proposals Sent", stats.proposalsSent, "M12 3l7.5 15h-15L12 3z"],
							["Awaiting Response", stats.awaiting, "M12 6v6l4 2"],
						].map(([label, value, path]) => (
							<div key={label} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-[#0b4a3c]">
									<Icon path={path} className="h-5 w-5" />
								</div>
								<div>
									<p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">{label}</p>
									<p className="text-2xl font-black text-gray-950">{loading ? "-" : value}</p>
								</div>
							</div>
						))}
					</div>

					<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex flex-wrap gap-2">
							<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 rounded-lg border border-transparent bg-gray-100 px-3 text-xs font-black outline-none focus:border-[#0b4a3c]/20">
								<option value="all">Status: All</option>
								<option value="pending">Status: Pending</option>
								<option value="accepted">Status: Accepted</option>
								<option value="new">Status: New</option>
								<option value="declined">Status: Declined</option>
							</select>
							<select value={industryFilter} onChange={(event) => setIndustryFilter(event.target.value)} className="h-9 rounded-lg border border-transparent bg-gray-100 px-3 text-xs font-black outline-none focus:border-[#0b4a3c]/20">
								<option value="all">Industry: All</option>
								{options.industries.map((industry) => (
									<option key={industry} value={industry}>{industry}</option>
								))}
							</select>
							<select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)} className="h-9 rounded-lg border border-transparent bg-gray-100 px-3 text-xs font-black outline-none focus:border-[#0b4a3c]/20">
								<option value="all">Stage: All</option>
								{options.stages.map((stage) => (
									<option key={stage} value={stage}>{stage}</option>
								))}
							</select>
							<select value={focusFilter} onChange={(event) => setFocusFilter(event.target.value)} className="h-9 rounded-lg border border-transparent bg-gray-100 px-3 text-xs font-black outline-none focus:border-[#0b4a3c]/20">
								<option value="all">Focus: All</option>
								{options.focusAreas.map((focus) => (
									<option key={focus} value={focus}>{focus}</option>
								))}
							</select>
						</div>
						<button
							type="button"
							onClick={() => exportCsv(filtered)}
							className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#0b4a3c] px-4 text-xs font-black text-white transition hover:bg-[#07382d]"
						>
							<Icon path="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 12L12 16.5m0 0l4.5-4.5M12 16.5V3" />
							Export Data
						</button>
					</div>

					<div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
						<div className="grid min-w-[760px] grid-cols-[1.4fr_1fr_1.2fr_90px_70px] bg-gray-50 px-4 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
							<span>Startup & Founder</span>
							<span>Context</span>
							<span>Requested Support</span>
							<span>Status</span>
							<span className="text-right">Actions</span>
						</div>

						{loading ? (
							<p className="px-5 py-8 text-sm text-gray-500">Loading requests...</p>
						) : filtered.length === 0 ? (
							<p className="px-5 py-8 text-sm text-gray-500">No requests match these filters.</p>
						) : (
							filtered.map((request) => {
								const selectedRow = selected?.mentorship_request_id === request.mentorship_request_id;
								const priority = priorityLabel(request);
								const stage = request.business_stage || request.stage || "Early Revenue";
								return (
									<button
										key={request.mentorship_request_id}
										type="button"
										onClick={() => setSelectedId(request.mentorship_request_id)}
										className={`grid min-w-[760px] w-full grid-cols-[1.4fr_1fr_1.2fr_90px_70px] items-center border-t border-gray-50 px-4 py-4 text-left text-xs transition ${selectedRow ? "bg-[#eef4f1]" : "hover:bg-gray-50"}`}
									>
										<div className="flex min-w-0 items-center gap-3">
											<ActorAvatar role="startup" profileId={request.startup_id} initials={initials(request.startup_name)} className="h-9 w-9 shrink-0 rounded-lg text-xs font-black" alt={request.startup_name} />
											<div className="min-w-0">
												<p className="truncate font-black text-gray-950">{request.startup_name || "Startup"}</p>
												<p className="truncate text-[11px] font-medium text-gray-500">{founderName(request)}</p>
											</div>
										</div>
										<div className="min-w-0">
											<span className="rounded bg-gray-100 px-2 py-1 text-[9px] font-black uppercase text-[#0b4a3c]">{request.industry || "General"}</span>
											<p className="mt-1 truncate text-[11px] font-medium text-gray-500">{stage}</p>
										</div>
										<div className="min-w-0">
											<p className="truncate font-black text-gray-950">{requestFocus(request)}</p>
											<p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
												<span className={`h-1.5 w-1.5 rounded-full ${priority.color}`} />
												{request.initiated_by === "mentor" ? "Your proposal" : priority.label}
											</p>
										</div>
										<div>
											<span className={`rounded-full px-3 py-1 text-[10px] font-black capitalize ${statusStyles(request.status)}`}>
												{normalizeStatus(request.status)}
											</span>
										</div>
										<div className="flex justify-end">
											<span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-[#0b4a3c]">
												<Icon path="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
											</span>
										</div>
									</button>
								);
							})
						)}
					</div>
				</section>

				<aside className="lg:pt-[237px]">
					<div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
						<div className="h-16 bg-[#0b4a3c]" />
						{selected ? (
							<div className="p-5">
								<ActorAvatar role="startup" profileId={selected.startup_id} initials={initials(selected.startup_name)} className="-mt-11 mb-4 h-14 w-14 rounded-xl text-lg font-black ring-4 ring-white" alt={selected.startup_name} />
								<div className="mb-4 flex items-start justify-between gap-3">
									<div>
										<h2 className="text-base font-black text-gray-950">{selected.startup_name || "Startup"}</h2>
										<p className="mt-1 text-xs font-medium text-gray-500">{selected.city || selected.location || "Ethiopia"}</p>
									</div>
									<Link href={`/mentor/requests/profile?requestId=${selected.mentorship_request_id}`} className="text-gray-400 hover:text-[#0b4a3c]" aria-label="Open request profile">
										<Icon path="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
									</Link>
								</div>

								<div className="mb-4 rounded-xl bg-gray-50 p-4">
									<div className="flex items-center gap-3">
										<div className="h-9 w-9 rounded-full bg-emerald-100" />
										<div>
											<p className="text-xs font-black text-gray-950">{founderName(selected)}</p>
											<p className="text-[11px] font-medium text-gray-500">{selected.founder_title || "Founder & CEO"}</p>
										</div>
									</div>
								</div>

								<div className="mb-4">
									<p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Request Summary</p>
									<div className="rounded-xl bg-emerald-50 p-3">
										<p className="text-xs font-black text-[#0b4a3c]">{selectedDetails.title}</p>
										<p className="mt-2 text-xs font-semibold leading-5 text-[#0b4a3c]">
											{compactText(selectedDetails.objective, 150)}
										</p>
									</div>
								</div>

								<div className="mb-5 space-y-2">
									<DetailRow label="Focus" value={selectedDetails.focus} />
									<DetailRow label="Format" value={[selectedDetails.format, selectedDetails.mode].filter(Boolean).join(" / ") || "-"} />
									<DetailRow label="Duration" value={[selectedDetails.duration, selectedDetails.sessions ? `${selectedDetails.sessions} sessions` : ""].filter(Boolean).join(" - ") || "-"} />
									<DetailRow label="Frequency" value={selectedDetails.frequency || "-"} />
									<DetailRow label="Fee" value={selectedDetails.fee || "Not specified"} />
								</div>

								<div className="mb-5 grid grid-cols-2 gap-3">
									<div className="rounded-xl bg-gray-50 p-3">
										<p className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-500">Monthly Rev</p>
										<p className="mt-1 text-sm font-black text-gray-950">{selected.monthly_revenue ? `$${selected.monthly_revenue}` : "-"}</p>
									</div>
									<div className="rounded-xl bg-gray-50 p-3">
										<p className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-500">Team Size</p>
										<p className="mt-1 text-sm font-black text-gray-950">{selected.team_size ? `${selected.team_size} Emp.` : "-"}</p>
									</div>
								</div>

								<div className="space-y-2">
									<Link
										href={`/mentor/requests/profile?requestId=${selected.mentorship_request_id}`}
										className="flex h-10 items-center justify-center rounded-lg bg-[#0b4a3c] text-xs font-black text-white transition hover:bg-[#07382d]"
									>
										Review Details
									</Link>
									{normalizeStatus(selected.status) === "accepted" && selected.startup_id ? (
										<>
										<Link
											href={`/mentor/messages?startupId=${selected.startup_id}`}
											className="flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-black text-gray-900 transition hover:bg-gray-50"
										>
											Message Startup
										</Link>
										<Link
											href={`/mentor/sessions?startupId=${selected.startup_id}`}
											className="flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-black text-gray-900 transition hover:bg-gray-50"
										>
											Schedule Session
										</Link>
										</>
									) : ["pending", "new"].includes(normalizeStatus(selected.status)) ? (
										<button
											type="button"
											disabled
											className="flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs font-black text-gray-400"
										>
											{selectedIsOutbound ? "Awaiting Startup Response" : "Request Pending"}
										</button>
									) : selected.startup_id ? (
										<Link
											href={`/mentor/requests/proposal?startupId=${selected.startup_id}`}
											className="flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-black text-gray-900 transition hover:bg-gray-50"
										>
											Send Proposal
										</Link>
									) : (
										<button
											type="button"
											disabled
											className="flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-black text-gray-400"
										>
											Send Proposal
										</button>
									)}
									{!selectedIsOutbound && (normalizeStatus(selected.status) === "pending" || normalizeStatus(selected.status) === "new") ? (
										<div className="grid grid-cols-2 gap-2">
											<button
												type="button"
												disabled={busyId === selected.mentorship_request_id}
												onClick={() => onAccept(selected.mentorship_request_id)}
												className="h-9 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-black text-[#0b4a3c] disabled:opacity-60"
											>
												Accept
											</button>
											<button
												type="button"
												disabled={busyId === selected.mentorship_request_id}
												onClick={() => onReject(selected.mentorship_request_id)}
												className="h-9 rounded-lg border border-red-100 bg-red-50 text-xs font-black text-red-700 disabled:opacity-60"
											>
												Decline
											</button>
										</div>
									) : null}
								</div>
							</div>
						) : (
							<div className="p-5 text-sm text-gray-500">Select a request to view details.</div>
						)}
					</div>
				</aside>
			</main>
		</div>
	);
}
