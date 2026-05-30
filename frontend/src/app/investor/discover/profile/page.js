"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/investor/Sidebar";
import {
	acceptInvestorFundingOffer,
	getInvestorFundingOffers,
	getInvestorStartupDetails,
} from "@/lib/investorApi";
import { isSensitiveVisible, privacyMessage } from "@/lib/profilePrivacy";

function formatCurrency(value) {
	const amount = Number(value || 0);
	if (!amount) return "$0";
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(amount);
}

function formatDate(value) {
	if (!value) return "No date";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "No date";
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function formatBytes(value) {
	const size = Number(value || 0);
	if (!size) return "Size not set";
	const units = ["B", "KB", "MB", "GB"];
	const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
	return `${(size / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function initials(name = "") {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (!parts.length) return "ST";
	return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function statusLabel(status = "pending") {
	const normalized = String(status || "pending").toLowerCase();
	if (["approved", "accepted"].includes(normalized)) return "Accepted";
	if (normalized === "withdrawn") return "Cancelled";
	return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function StatCard({ label, value, detail }) {
	return (
		<div className="text-center px-4">
			<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
			<p className="text-3xl font-bold text-[#0a4d3c] mb-1">{value}</p>
			<p className="text-xs text-gray-500 font-medium">{detail}</p>
		</div>
	);
}

function MessageAction({
	canMessage,
	messageHref,
	lockedMessage,
	onLocked,
	className,
	children = "MESSAGE STARTUP",
	hasOffer,
}) {
	if (canMessage) {
		return (
			<Link href={messageHref} className={className}>
				{children}
			</Link>
		);
	}
	return (
		<button
			type="button"
			onClick={() => onLocked(lockedMessage)}
			className={className}
		>
			{hasOffer ? "ACCEPT FIRST TO MESSAGE" : "SEND OFFER FIRST"}
		</button>
	);
}

function StartupProfileContent() {
	const searchParams = useSearchParams();
	const startupId = searchParams.get("startupId");
	const [startup, setStartup] = useState(null);
	const [projects, setProjects] = useState([]);
	const [documents, setDocuments] = useState([]);
	const [offer, setOffer] = useState(null);
	const [privacy, setPrivacy] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [actionError, setActionError] = useState("");
	const [messageNotice, setMessageNotice] = useState("");
	const [accepting, setAccepting] = useState(false);

	useEffect(() => {
		let ignore = false;

		async function loadStartup() {
			if (!startupId) {
				setError("No startup was selected.");
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				setError("");
				const [data, offerData] = await Promise.all([
					getInvestorStartupDetails(startupId),
					getInvestorFundingOffers(),
				]);
				if (ignore) return;
				setStartup(data.startup || null);
				setPrivacy(data.privacy || data.startup?.privacy || null);
				setProjects(Array.isArray(data.projects) ? data.projects : []);
				setDocuments(Array.isArray(data.documents) ? data.documents : []);
				const startupOffers = Array.isArray(offerData.funding_offers)
					? offerData.funding_offers.filter((item) => String(item.startup_id) === String(startupId))
					: [];
				const selectedOffer = startupOffers.find((item) => String(item.status || "pending").toLowerCase() === "pending")
					|| startupOffers.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0]
					|| null;
				setOffer(selectedOffer);
			} catch (err) {
				if (!ignore) setError(err.message || "Failed to load startup profile.");
			} finally {
				if (!ignore) setLoading(false);
			}
		}

		loadStartup();
		return () => {
			ignore = true;
		};
	}, [startupId]);

	async function handleAcceptOffer() {
		if (!offer?.investment_request_id) return;

		try {
			setAccepting(true);
			setActionError("");
			const data = await acceptInvestorFundingOffer(offer.investment_request_id);
			setOffer((currentOffer) => ({
				...currentOffer,
				...(data.offer || {}),
				status: data.offer?.status || "approved",
			}));
		} catch (err) {
			setActionError(err.message || "Failed to accept offer.");
		} finally {
			setAccepting(false);
		}
	}

	const totals = useMemo(() => {
		const fundingGoal = projects.reduce((sum, project) => sum + Number(project.funding_goal || 0), 0);
		const raised = projects.reduce((sum, project) => sum + Number(project.amount_raised || 0), 0);
		const target = fundingGoal || Number(startup?.funding_needed || 0);
		const percent = target ? Math.min(100, Math.round((raised / target) * 100)) : 0;
		return { fundingGoal: target, raised, percent };
	}, [projects, startup]);

	const sensitiveVisible = isSensitiveVisible({ privacy: privacy || startup?.privacy });
	const location = sensitiveVisible
		? startup?.location || startup?.city || startup?.region || "Location not set"
		: [startup?.region, startup?.country].filter(Boolean).join(", ") || "Region available after relationship unlock";
	const offerStatus = String(offer?.status || "pending").toLowerCase();
	const canAcceptOffer = Boolean(offer?.investment_request_id) && offerStatus === "pending";
	const canMessage = ["approved", "accepted"].includes(offerStatus);
	const acceptLabel = accepting ? "ACCEPTING..." : offer ? statusLabel(offerStatus).toUpperCase() : "NO OFFER";
	const messageHref = startup?.startup_id ? `/investor/messages?startupId=${startup.startup_id}` : "/investor/messages";
	const lockedMessage = offer
		? "Messaging unlocks after this investment offer or request is accepted by both sides."
		: "Messaging unlocks after you send a funding offer or receive a startup request and it is accepted.";

	return (
		<div className="flex h-screen bg-[#f8f9fa] font-sans text-gray-900 overflow-hidden">
			<Sidebar />

			<div className="flex-grow flex flex-col overflow-hidden bg-white pt-16">
				<main className="flex-grow overflow-y-auto p-6 lg:p-10 bg-white">
					<div className="max-w-[1000px] mx-auto flex flex-col min-h-full">
						<div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 mb-8">
							<div>
								<Link href="/investor/discover" className="text-xs font-bold text-[#0a4d3c] hover:text-[#07382b]">
									BACK TO DISCOVER
								</Link>
								<h1 className="text-3xl font-bold text-[#0a4d3c] tracking-tight mt-3 mb-2">Startup Profile</h1>
								<p className="text-gray-500 text-sm">
									{startup ? `Detailed investor view for ${startup.startup_name}.` : "Detailed investor view for the selected startup."}
								</p>
							</div>
							{startup && (
								<div className="flex items-center gap-3">
									<button
										type="button"
										onClick={handleAcceptOffer}
										disabled={!canAcceptOffer || accepting}
										className="px-5 py-2.5 bg-[#0a4d3c] text-white rounded-lg text-xs font-bold hover:bg-[#07382b] transition shadow-sm disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
									>
										{acceptLabel}
									</button>
									<MessageAction
										canMessage={canMessage}
										messageHref={messageHref}
										lockedMessage={lockedMessage}
										onLocked={setMessageNotice}
										hasOffer={Boolean(offer)}
										className="px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition shadow-sm"
									>
										NEGOTIATING
									</MessageAction>
								</div>
							)}
						</div>

						{actionError ? (
							<div className="mb-5 bg-red-50 border border-red-100 rounded-xl p-4 text-sm font-semibold text-red-700">
								{actionError}
							</div>
						) : null}

						{!sensitiveVisible && privacy && startup ? (
							<div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
								<p className="font-semibold mb-1">Protected founder contact & links</p>
								<p className="leading-relaxed">{privacyMessage({ privacy })}</p>
							</div>
						) : null}

						{messageNotice ? (
							<div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
								<div className="flex items-start justify-between gap-4">
									<div>
										<p className="font-semibold mb-1">You are not connected yet</p>
										<p className="leading-relaxed text-amber-800">{messageNotice}</p>
									</div>
									<button
										type="button"
										onClick={() => setMessageNotice("")}
										className="text-xs font-bold text-amber-900 hover:underline"
									>
										Dismiss
									</button>
								</div>
							</div>
						) : null}

						{loading ? (
							<div className="border border-gray-200 rounded-2xl p-10 text-center text-gray-500 font-semibold shadow-sm">
								Loading startup profile...
							</div>
						) : error ? (
							<div className="border border-red-100 bg-red-50 rounded-2xl p-8 text-center shadow-sm">
								<p className="text-sm font-bold text-red-700 mb-4">{error}</p>
								<Link href="/investor/discover" className="inline-flex px-5 py-2.5 bg-white border border-red-100 rounded-lg text-xs font-bold text-red-700 hover:bg-red-100 transition">
									RETURN TO DISCOVER
								</Link>
							</div>
						) : startup ? (
							<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
								<div className="lg:col-span-2 flex flex-col gap-6">
									<div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start gap-6">
										<div className="w-24 h-24 bg-[#3d7a5b] rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
											<span className="text-white text-2xl font-black tracking-widest">{initials(startup.startup_name)}</span>
										</div>
										<div className="flex-grow pt-1 min-w-0">
											<div className="flex flex-wrap items-center gap-3 mb-2">
												<h2 className="text-2xl font-bold text-gray-900">{startup.startup_name}</h2>
												<span className="px-2 py-1 bg-green-100 text-green-700 text-[9px] font-black rounded uppercase tracking-wider">
													{startup.admin_status || "Approved"}
												</span>
											</div>
											<div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500 mb-4">
												<span>{startup.industry || "Industry not set"}</span>
												<span className="w-1 h-1 rounded-full bg-gray-300" />
												<span>{startup.business_stage || "Stage not set"}</span>
												<span className="w-1 h-1 rounded-full bg-gray-300" />
												<span>{location}</span>
											</div>
											<p className="text-sm text-gray-600 leading-relaxed">
												{startup.description || startup.startup_tagline || "No description has been provided yet."}
											</p>
										</div>
									</div>

									<div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
										<div className="flex justify-between items-center mb-6">
											<h3 className="text-sm font-bold text-[#0a4d3c]">Traction Summary</h3>
										</div>
										<div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-gray-100 gap-6 sm:gap-0">
											<StatCard label="Projects" value={projects.length} detail="Active records" />
											<StatCard label="Team Size" value={startup.team_size || "N/A"} detail="Reported team" />
											<StatCard label="Founded" value={startup.founded_year || "N/A"} detail="Company start" />
										</div>
									</div>

									<div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
										<div className="flex justify-between items-center mb-6">
											<h3 className="text-sm font-bold text-[#0a4d3c]">Projects</h3>
										</div>
										<div className="space-y-4">
											{projects.length ? projects.map((project) => (
												<div key={project.project_id} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
													<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
														<div>
															<p className="text-sm font-bold text-gray-900">{project.project_title}</p>
															<p className="text-xs text-gray-500 mt-1 leading-relaxed">{project.description || "No project description provided."}</p>
														</div>
														<span className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold uppercase text-gray-600 self-start">
															{project.status || "active"}
														</span>
													</div>
													<div className="mt-4 grid grid-cols-2 gap-3 text-xs">
														<div>
															<p className="font-bold text-gray-400 uppercase">Goal</p>
															<p className="font-bold text-[#0a4d3c]">{formatCurrency(project.funding_goal)}</p>
														</div>
														<div>
															<p className="font-bold text-gray-400 uppercase">Raised</p>
															<p className="font-bold text-[#0a4d3c]">{formatCurrency(project.amount_raised)}</p>
														</div>
													</div>
												</div>
											)) : (
												<p className="text-sm text-gray-500">No projects have been published for this startup yet.</p>
											)}
										</div>
									</div>

									<div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
										<div className="flex justify-between items-center mb-6">
											<h3 className="text-sm font-bold text-[#0a4d3c]">Investment Documents</h3>
										</div>
										<div className="space-y-4">
											{documents.length ? documents.map((doc) => (
												<div key={doc.document_id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition">
													<div className="min-w-0">
														<p className="text-sm font-bold text-gray-900 truncate">{doc.file_name}</p>
														<p className="text-[10px] text-gray-500 font-medium">
															{doc.file_type || "Document"} • {formatBytes(doc.file_size_bytes)} • {formatDate(doc.created_at)}
														</p>
													</div>
												</div>
											)) : (
												<p className="text-sm text-gray-500">No investor documents are available yet.</p>
											)}
										</div>
									</div>
								</div>

								<div className="flex flex-col gap-6">
									<div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
										<p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
											Funding Goal: {formatCurrency(totals.fundingGoal)}
										</p>
										<div className="flex justify-between items-end mb-2">
											<h3 className="text-3xl font-bold text-[#0a4d3c]">{formatCurrency(totals.raised)}</h3>
											<span className="text-xs font-bold text-gray-600 mb-1">{totals.percent}% Raised</span>
										</div>
										<div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-6">
											<div className="h-full bg-[#0a4d3c] rounded-full" style={{ width: `${totals.percent}%` }} />
										</div>
										<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
											<button
												type="button"
												onClick={handleAcceptOffer}
												disabled={!canAcceptOffer || accepting}
												className="w-full py-3.5 bg-[#0a4d3c] text-white text-xs font-bold rounded-xl hover:bg-[#07382b] transition shadow-sm flex justify-center disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
											>
												{acceptLabel}
											</button>
											<MessageAction
												canMessage={canMessage}
												messageHref={messageHref}
												lockedMessage={lockedMessage}
												onLocked={setMessageNotice}
												hasOffer={Boolean(offer)}
												className="w-full py-3.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition shadow-sm flex justify-center"
											>
												NEGOTIATING
											</MessageAction>
										</div>
									</div>

									<div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
										<h3 className="text-sm font-bold text-[#0a4d3c] mb-6">Company Info</h3>
										<div className="space-y-4 text-sm">
											<div>
												<p className="text-[10px] font-bold text-gray-400 uppercase">Founder</p>
												<p className="font-bold text-gray-900">{startup.founder_full_name || "Not provided"}</p>
											</div>
											<div>
												<p className="text-[10px] font-bold text-gray-400 uppercase">Founder Role</p>
												<p className="font-bold text-gray-900">{startup.founder_role || "Not provided"}</p>
											</div>
											<div>
												<p className="text-[10px] font-bold text-gray-400 uppercase">Startup Type</p>
												<p className="font-bold text-gray-900">{startup.startup_type || "Not provided"}</p>
											</div>
										</div>
									</div>

									<div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
										<h3 className="text-sm font-bold text-[#0a4d3c] mb-6">Quick Actions</h3>
										<div className="space-y-3">
											<MessageAction
												canMessage={canMessage}
												messageHref={messageHref}
												lockedMessage={lockedMessage}
												onLocked={setMessageNotice}
												hasOffer={Boolean(offer)}
												className="w-full py-3 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition flex justify-center items-center gap-2 shadow-sm"
											>
												MESSAGE STARTUP
											</MessageAction>
											<Link href={`/investor/feedback?startupId=${startup.startup_id}`} className="w-full py-3 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition flex justify-center items-center gap-2 shadow-sm">
												RATE STARTUP
											</Link>
										</div>
									</div>
								</div>
							</div>
						) : null}
					</div>
				</main>
			</div>
		</div>
	);
}

export default function StartupProfile() {
	return (
		<Suspense fallback={<p className="p-8 text-gray-500">Loading...</p>}>
			<StartupProfileContent />
		</Suspense>
	);
}
