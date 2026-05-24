"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
	acceptRequest,
	fetchIncomingRequests,
	fetchStartupDocument,
	fetchStartupDetails,
	rejectRequest,
} from "@/lib/mentorApi";

function Icon({ path, className = "h-4 w-4" }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={path} />
		</svg>
	);
}

function initials(name) {
	return String(name || "SC")
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();
}

function formatCurrency(value) {
	const amount = Number(value || 0);
	if (!amount) return "$0";
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(amount);
}

function formatBytes(value) {
	const size = Number(value || 0);
	if (!size) return "Size not set";
	const units = ["B", "KB", "MB", "GB"];
	const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
	return `${(size / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(value) {
	if (!value) return "No date";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "No date";
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function shortMoney(value) {
	const amount = Number(value || 0);
	if (!amount) return "$0";
	if (amount >= 1000000) return `$${(amount / 1000000).toFixed(amount % 1000000 ? 1 : 0)}M`;
	if (amount >= 1000) return `$${(amount / 1000).toFixed(amount % 1000 ? 1 : 0)}K`;
	return formatCurrency(amount);
}

function startupLocation(startup) {
	return startup?.location || startup?.city || startup?.region || "Location not set";
}

function requestStartupId(request) {
	return request?.startup_id || request?.startupId || request?.startup?.startup_id;
}

function docTone(doc) {
	const text = `${doc.file_type || ""} ${doc.file_name || ""} ${doc.description || ""}`.toLowerCase();
	if (text.includes("financial") || text.includes("projection") || text.includes("xls")) {
		return { bg: "bg-amber-50", color: "text-amber-600" };
	}
	if (text.includes("plan") || text.includes("roadmap")) {
		return { bg: "bg-emerald-50", color: "text-emerald-600" };
	}
	return { bg: "bg-red-50", color: "text-red-500" };
}

function StatCard({ label, value, detail }) {
	return (
		<div className="px-4 text-center">
			<p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{label}</p>
			<p className="mb-1 text-3xl font-black tracking-tight text-[#063f33]">{value}</p>
			<p className="text-xs font-medium text-gray-500">{detail}</p>
		</div>
	);
}

function ProfileContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const requestId = searchParams.get("requestId");
	const startupId = searchParams.get("startupId");

	const [startup, setStartup] = useState(null);
	const [documents, setDocuments] = useState([]);
	const [projects, setProjects] = useState([]);
	const [request, setRequest] = useState(null);
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [openingDocId, setOpeningDocId] = useState(null);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");

	useEffect(() => {
		let cancelled = false;

		async function loadProfile() {
			setLoading(true);
			setError("");
			setNotice("");

			try {
				let resolvedStartupId = startupId;
				let selectedRequest = null;

				if (requestId || startupId) {
					const incoming = await fetchIncomingRequests();
					const requests = Array.isArray(incoming) ? incoming : incoming?.requests || [];
					selectedRequest = requestId
						? requests.find((item) => String(item.mentorship_request_id) === String(requestId)) || null
						: requests.find((item) => String(requestStartupId(item)) === String(startupId)) || null;
					resolvedStartupId = resolvedStartupId || requestStartupId(selectedRequest);
				}

				if (!resolvedStartupId) {
					throw new Error("Missing startupId or a valid requestId.");
				}

				const detail = await fetchStartupDetails(resolvedStartupId);
				if (cancelled) return;

				setRequest(selectedRequest);
				setStartup(detail.startup || null);
				setDocuments(Array.isArray(detail.documents) ? detail.documents : []);
				setProjects(Array.isArray(detail.projects) ? detail.projects : []);
			} catch (ex) {
				if (!cancelled) setError(ex.message || "Failed to load startup profile.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		loadProfile();
		return () => {
			cancelled = true;
		};
	}, [requestId, startupId]);

	const totals = useMemo(() => {
		const fundingGoal = projects.reduce((sum, project) => sum + Number(project.funding_goal || 0), 0);
		const raised = projects.reduce((sum, project) => sum + Number(project.amount_raised || 0), 0);
		const target = fundingGoal || Number(startup?.funding_needed || 0);
		const percent = target ? Math.min(100, Math.round((raised / target) * 100)) : 0;
		return { fundingGoal: target, raised, percent };
	}, [projects, startup]);

	const sid = startup?.startup_id || startupId || requestStartupId(request);
	const description = startup?.description || startup?.startup_tagline || "No startup description has been provided yet.";
	const founderName = startup?.founder_full_name || request?.founder_name || "Founder not provided";
	const founderRole = startup?.founder_role || "Founder";
	const canRespond = requestId && ["pending", "new"].includes(String(request?.status || "pending").toLowerCase());
	const requestStatus = String(request?.status || "").toLowerCase();
	const isAccepted = requestStatus === "accepted";

	async function onAccept() {
		if (!requestId) return;
		setBusy(true);
		setError("");
		try {
			await acceptRequest(requestId);
			router.push("/mentor/requests");
		} catch (ex) {
			setError(ex.message || "Accept failed.");
		} finally {
			setBusy(false);
		}
	}

	async function onReject() {
		if (!requestId) return;
		const reason = window.prompt("Reason (optional):") || "";
		setBusy(true);
		setError("");
		try {
			await rejectRequest(requestId, reason);
			router.push("/mentor/requests");
		} catch (ex) {
			setError(ex.message || "Decline failed.");
		} finally {
			setBusy(false);
		}
	}

	async function shareAccess() {
		try {
			await navigator.clipboard.writeText(window.location.href);
			setNotice("Profile link copied.");
		} catch {
			setNotice("Copy failed. Use the browser address bar.");
		}
	}

	async function openDocument(doc) {
		if (!sid || !doc.document_id) {
			setNotice("This document cannot be opened.");
			return;
		}

		setOpeningDocId(doc.document_id);
		setNotice("");
		try {
			const { blob } = await fetchStartupDocument(sid, doc.document_id);
			const url = URL.createObjectURL(blob);
			window.open(url, "_blank", "noopener,noreferrer");
			window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
		} catch (ex) {
			setNotice(ex.message || "Unable to open document.");
		} finally {
			setOpeningDocId(null);
		}
	}

	if (loading) {
		return <p className="p-8 text-sm font-medium text-gray-500">Loading startup profile...</p>;
	}

	if (error) {
		return (
			<div className="p-8">
				<div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">{error}</div>
			</div>
		);
	}

	if (!startup) {
		return <p className="p-8 text-sm font-medium text-gray-500">Startup not found.</p>;
	}

	return (
		<div className="min-h-full bg-white text-[#061f1a]">
			<header className="sticky top-0 z-20 flex min-h-[76px] flex-col gap-4 border-b border-gray-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
				<div>
					<Link href="/mentor/startups" className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0b4a3c] hover:text-[#07382d]">
						Back to startups
					</Link>
					<h1 className="mt-2 text-3xl font-black tracking-tight text-[#052b23]">Startup Profile</h1>
					<p className="mt-1 text-sm text-gray-500">Detailed mentorship view for {startup.startup_name}.</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<button
						type="button"
						onClick={() => window.print()}
						className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-black text-gray-700 shadow-sm transition hover:bg-gray-50"
					>
						<Icon path="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231a1.125 1.125 0 01-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75v-4.5A2.25 2.25 0 0018.75 9H5.25A2.25 2.25 0 003 11.25v4.5A2.25 2.25 0 005.25 18h1.091m11.318 0H6.34M6 9V4.5A2.25 2.25 0 018.25 2.25h7.5A2.25 2.25 0 0118 4.5V9" />
						Export PDF
					</button>
					<button
						type="button"
						onClick={shareAccess}
						className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-black text-gray-700 shadow-sm transition hover:bg-gray-50"
					>
						<Icon path="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
						Share Access
					</button>
				</div>
			</header>

			<main className="mx-auto grid w-full max-w-[1120px] grid-cols-1 gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_285px] lg:px-8">
				<section className="min-w-0 space-y-6">
					{notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-[#0b4a3c]">{notice}</div> : null}

					<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
						<div className="flex flex-col gap-6 sm:flex-row sm:items-start">
							<div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#3d7a5b] text-white shadow-inner">
								<span className="text-2xl font-black">{initials(startup.startup_name)}</span>
								<span className="mt-1 max-w-[72px] truncate text-[10px] font-black">{startup.startup_name}</span>
							</div>
							<div className="min-w-0 flex-1">
								<div className="mb-2 flex flex-wrap items-center gap-3">
									<h2 className="text-2xl font-black tracking-tight text-gray-950">{startup.startup_name}</h2>
									<span className="rounded bg-emerald-100 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-700">
										{startup.admin_status || "Verified"}
									</span>
								</div>
								<div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500">
									<span>{startup.industry || "Industry not set"}</span>
									<span className="h-1 w-1 rounded-full bg-gray-300" />
									<span>{startup.business_stage || "Stage not set"}</span>
									<span className="h-1 w-1 rounded-full bg-gray-300" />
									<span>{startupLocation(startup)}</span>
								</div>
								<p className="line-clamp-3 text-sm leading-6 text-gray-600">{description}</p>
							</div>
						</div>
					</div>

					<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
						<div className="mb-6 flex items-center justify-between">
							<h3 className="flex items-center gap-2 text-sm font-black text-[#0a4d3c]">
								<Icon path="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.63-1.038m0 0l-5.25-1.125M21.75 9l-1.125 5.25" />
								Traction Summary
							</h3>
							<span className="text-gray-400">...</span>
						</div>
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:divide-x sm:divide-gray-100 sm:gap-0">
							<StatCard label="Projects" value={projects.length || "0"} detail="Published records" />
							<StatCard label="Team Size" value={startup.team_size || "N/A"} detail="Reported team" />
							<StatCard label="Founded" value={startup.founded_year || "N/A"} detail="Company start" />
						</div>
					</div>

					<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
						<div className="mb-6 flex items-center justify-between">
							<h3 className="flex items-center gap-2 text-sm font-black text-[#0a4d3c]">
								<Icon path="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3h7.5M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
								Investment Documents
							</h3>
						</div>
						<div className="space-y-4">
							{documents.length ? documents.map((doc) => {
								const tone = docTone(doc);
								return (
									<button
										key={doc.document_id || doc.file_name}
										type="button"
										onClick={() => openDocument(doc)}
										disabled={openingDocId === doc.document_id}
										className="flex w-full items-center gap-4 rounded-xl p-3 text-left transition hover:bg-gray-50 disabled:cursor-wait disabled:opacity-70"
									>
										<div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.bg} ${tone.color}`}>
											<Icon path="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-black text-gray-950">{doc.file_name || doc.description || "Startup document"}</p>
											<p className="text-[10px] font-medium text-gray-500">
												{openingDocId === doc.document_id ? "Opening..." : `${doc.file_type || "Document"} - ${formatBytes(doc.file_size_bytes)} - ${formatDate(doc.created_at)}`}
											</p>
										</div>
										<Icon path="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" className="h-4 w-4 shrink-0 text-gray-400" />
									</button>
								);
							}) : (
								<p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">No documents are available for this startup yet.</p>
							)}
						</div>
					</div>
				</section>

				<aside className="space-y-6">
					<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
						<p className="mb-4 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
							Funding Goal: {formatCurrency(totals.fundingGoal)}
						</p>
						<div className="mb-2 flex items-end justify-between gap-3">
							<h3 className="text-3xl font-black tracking-tight text-[#0a4d3c]">{shortMoney(totals.raised)}</h3>
							<span className="mb-1 text-xs font-black text-gray-600">{totals.percent}% Raised</span>
						</div>
						<div className="mb-6 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
							<div className="h-full rounded-full bg-[#0a4d3c]" style={{ width: `${totals.percent}%` }} />
						</div>
						{requestStatus === "accepted" ? (
							<Link href={`/mentor/sessions?startupId=${sid}`} className="flex h-11 w-full items-center justify-center rounded-xl bg-[#0a4d3c] text-xs font-black uppercase text-white transition hover:bg-[#07382b]">
								Schedule Session
							</Link>
						) : ["pending", "new"].includes(requestStatus) ? (
							<button type="button" disabled className="flex h-11 w-full items-center justify-center rounded-xl bg-gray-200 text-xs font-black uppercase text-gray-500">
								Proposal Pending
							</button>
						) : (
							<Link href={`/mentor/requests/proposal?startupId=${sid}`} className="flex h-11 w-full items-center justify-center rounded-xl bg-[#0a4d3c] text-xs font-black uppercase text-white transition hover:bg-[#07382b]">
								Send Proposal
							</Link>
						)}
					</div>

					<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
						<h3 className="mb-6 flex items-center gap-2 text-sm font-black text-[#0a4d3c]">
							<Icon path="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a5.971 5.971 0 00-.941 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" />
							Leadership Team
						</h3>
						<div className="space-y-4">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0a4d3c] text-xs font-black text-white">{initials(founderName)}</div>
								<div className="min-w-0">
									<p className="truncate text-sm font-black text-gray-950">{founderName}</p>
									<p className="text-[10px] font-medium text-gray-500">{founderRole}</p>
								</div>
							</div>
						</div>
					</div>

					<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
						<h3 className="mb-6 flex items-center gap-2 text-sm font-black text-[#0a4d3c]">
							<Icon path="M13 10V3L4 14h7v7l9-11h-7z" />
							Quick Actions
						</h3>
						<div className="space-y-3">
							{isAccepted ? (
							<Link href={`/mentor/messages?startupId=${sid}`} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-xs font-black uppercase text-gray-700 shadow-sm transition hover:bg-gray-50">
								<Icon path="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
								Message Startup
							</Link>
							) : (
							<button type="button" disabled className="flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-black uppercase text-gray-400">
								<Icon path="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
								Accept First to Message
							</button>
							)}
							{isAccepted ? (
							<Link href={`/mentor/sessions?startupId=${sid}`} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-xs font-black uppercase text-gray-700 shadow-sm transition hover:bg-gray-50">
								<Icon path="M6.75 3v2.25M17.25 3v2.25M3 18.75V8.25A2.25 2.25 0 015.25 6h13.5A2.25 2.25 0 0121 8.25v10.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75z" />
								Schedule Meeting
							</Link>
							) : (
							<button type="button" disabled className="flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-black uppercase text-gray-400">
								<Icon path="M6.75 3v2.25M17.25 3v2.25M3 18.75V8.25A2.25 2.25 0 015.25 6h13.5A2.25 2.25 0 0121 8.25v10.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75z" />
								Accept First to Schedule
							</button>
							)}
							<Link href={`/mentor/reports?startupId=${sid}`} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-xs font-black uppercase text-gray-700 shadow-sm transition hover:bg-gray-50">
								<Icon path="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.43.376.35.025.67.21.865.501L12 21l2.748-4.136c.195-.291.515-.476.865-.501a48.172 48.172 0 003.43-.376c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
								Give Feedback
							</Link>
							{canRespond ? (
								<div className="grid grid-cols-2 gap-2 pt-1">
									<button type="button" disabled={busy} onClick={onAccept} className="h-10 rounded-xl bg-emerald-50 text-xs font-black text-[#0b4a3c] ring-1 ring-emerald-200 disabled:opacity-60">
										Accept
									</button>
									<button type="button" disabled={busy} onClick={onReject} className="h-10 rounded-xl bg-red-50 text-xs font-black text-red-700 ring-1 ring-red-100 disabled:opacity-60">
										Decline
									</button>
								</div>
							) : null}
						</div>
					</div>
				</aside>
			</main>
		</div>
	);
}

export default function MentorRequestProfilePage() {
	return (
		<Suspense fallback={<p className="p-8 text-gray-500">Loading...</p>}>
			<ProfileContent />
		</Suspense>
	);
}
