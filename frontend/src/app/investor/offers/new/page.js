"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/investor/Sidebar";
import {
	createInvestorFundingOffer,
	getInvestorStartupDetails,
	getInvestorStartups,
} from "@/lib/investorApi";

function formatCurrency(value) {
	const amount = Number(value || 0);
	if (!amount) return "$0";
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(amount);
}

function initials(name) {
	return String(name || "ST")
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();
}

function existingOfferCopy(offer) {
	const isInvestorOffer = offer?.initiated_by === "investor";
	return {
		title: isInvestorOffer ? "You already sent an offer" : "This startup already sent you a request",
		body: isInvestorOffer
			? "Review or withdraw the existing offer instead of creating another one for the same startup and project."
			: "Open the startup request and accept or reject it. You do not need to send a second offer.",
		primaryHref: isInvestorOffer ? "/investor/offers" : "/investor/funding",
		primaryLabel: isInvestorOffer ? "View your offers" : "Review startup request",
	};
}

function SendFundingOfferContent() {
	const searchParams = useSearchParams();
	const startupIdFromUrl = searchParams.get("startupId");
	const [startups, setStartups] = useState([]);
	const [selectedStartupId, setSelectedStartupId] = useState(startupIdFromUrl || "");
	const [selectedStartup, setSelectedStartup] = useState(null);
	const [projects, setProjects] = useState([]);
	const [projectId, setProjectId] = useState("");
	const [amount, setAmount] = useState("");
	const [equity, setEquity] = useState("");
	const [terms, setTerms] = useState("");
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [conflict, setConflict] = useState(null);

	useEffect(() => {
		let alive = true;

		async function loadInitialData() {
			setLoading(true);
			setError("");
			try {
				const startupList = await getInvestorStartups({ limit: 50 });
				if (!alive) return;
				const visibleStartups = startupList.startups || [];
				setStartups(visibleStartups);

				const initialId = startupIdFromUrl || visibleStartups[0]?.startup_id || "";
				if (initialId) {
					setSelectedStartupId(String(initialId));
				}
			} catch (err) {
				if (alive) setError(err.message || "Unable to load startups.");
			} finally {
				if (alive) setLoading(false);
			}
		}

		loadInitialData();
		return () => {
			alive = false;
		};
	}, [startupIdFromUrl]);

	useEffect(() => {
		let alive = true;

		async function loadStartupDetails() {
			if (!selectedStartupId) {
				setSelectedStartup(null);
				setProjects([]);
				setProjectId("");
				return;
			}

			setError("");
			try {
				const data = await getInvestorStartupDetails(selectedStartupId);
				if (!alive) return;
				setSelectedStartup(data.startup || null);
				const loadedProjects = data.projects || [];
				setProjects(loadedProjects);
				const firstProject = loadedProjects.find((project) => project.status === "active") || loadedProjects[0];
				setProjectId(firstProject ? String(firstProject.project_id) : "");
				setAmount((current) => current || String(data.startup?.funding_needed || firstProject?.funding_goal || ""));
			} catch (err) {
				if (alive) setError(err.message || "Unable to load startup details.");
			}
		}

		loadStartupDetails();
		return () => {
			alive = false;
		};
	}, [selectedStartupId]);

	const impliedValuation = useMemo(() => {
		const parsedAmount = Number(amount);
		const parsedEquity = Number(equity);
		if (!parsedAmount || !parsedEquity) return null;
		return parsedAmount / (parsedEquity / 100);
	}, [amount, equity]);

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");
		setSuccess("");
		setConflict(null);

		if (!selectedStartupId) {
			setError("Select a startup before sending an offer.");
			return;
		}

		const requestedAmount = Number(amount);
		if (!requestedAmount || requestedAmount <= 0) {
			setError("Enter a valid investment amount.");
			return;
		}

		setSubmitting(true);
		try {
			const detailParts = [
				equity ? `Proposed equity: ${equity}%` : null,
				terms ? `Terms: ${terms}` : null,
				message ? `Message: ${message}` : null,
			].filter(Boolean);

			await createInvestorFundingOffer({
				startup_id: Number(selectedStartupId),
				project_id: projectId ? Number(projectId) : undefined,
				requested_amount: requestedAmount,
				proposal_message: detailParts.join("\n\n") || null,
			});

			setSuccess("Funding offer sent successfully.");
		} catch (err) {
			if (err.status === 409 && err.data?.offer) {
				setConflict({
					message: err.message || "An active offer or request already exists.",
					offer: err.data.offer,
				});
				return;
			}
			setError(err.message || "Unable to send funding offer.");
		} finally {
			setSubmitting(false);
		}
	}

	const conflictCopy = conflict ? existingOfferCopy(conflict.offer) : null;

	return (
		<div className="flex h-screen bg-[#f8f9fa] font-sans text-gray-900 overflow-hidden">
			<Sidebar />

			<div className="flex-grow flex flex-col overflow-hidden bg-[#f8f9fa]">
				<header className="flex justify-between items-center px-8 py-4 bg-white border-b border-gray-100 z-10 shrink-0">
					<div className="text-sm font-medium">
						<Link href="/investor/offers" className="text-gray-400 hover:text-gray-600">Offers</Link>
						<span className="text-gray-300 mx-2">/</span>
						<span className="text-[#0a4d3c] font-bold">Send Funding Offer</span>
					</div>
					<Link href="/investor/discover" className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 transition">
						Browse Startups
					</Link>
				</header>

				<main className="flex-grow overflow-y-auto">
					<div className="p-10 max-w-[960px] w-full mx-auto">
						<div className="mb-8">
							<h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Send Funding Offer</h1>
							<p className="text-gray-500 text-[15px]">Create an investment request for a startup and submit your proposed terms.</p>
						</div>

						{error ? (
							<div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
						) : null}
						{success ? (
							<div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">{success}</div>
						) : null}
						{conflict ? (
							<div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
								<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
									<div>
										<div className="flex flex-wrap items-center gap-2 mb-2">
											<h2 className="text-sm font-black text-amber-950">{conflictCopy.title}</h2>
											<span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
												{conflict.offer?.status || "active"}
											</span>
										</div>
										<p className="text-sm font-medium text-amber-900">{conflict.message}</p>
										<p className="mt-1 text-xs text-amber-800">{conflictCopy.body}</p>
									</div>
									<div className="flex shrink-0 flex-wrap gap-2">
										<Link
											href={conflictCopy.primaryHref}
											className="inline-flex items-center justify-center rounded-lg bg-[#0a4d3c] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#07382b]"
										>
											{conflictCopy.primaryLabel}
										</Link>
										<Link
											href="/investor/offers"
											className="inline-flex items-center justify-center rounded-lg border border-amber-200 bg-white px-4 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-100"
										>
											All offers
										</Link>
									</div>
								</div>
							</div>
						) : null}

						<div className="bg-[#f8f9fa] border border-gray-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
							<div className="flex items-center gap-6">
								<div className="w-16 h-16 bg-[#0a4d3c] rounded-xl flex items-center justify-center shrink-0 shadow-inner text-white font-black">
									{initials(selectedStartup?.startup_name)}
								</div>
								<div>
									<h3 className="text-xl font-bold text-gray-900 mb-1.5">{selectedStartup?.startup_name || "Select a startup"}</h3>
									<div className="flex flex-wrap items-center gap-3">
										<span className="px-2 py-0.5 bg-white border border-gray-200 text-gray-600 text-[9px] font-bold rounded uppercase tracking-wider shadow-sm">
											{selectedStartup?.industry || "Industry"}
										</span>
										<span className="text-[11px] font-medium text-gray-400">
											{selectedStartup?.location || selectedStartup?.city || "Location not set"}
										</span>
									</div>
								</div>
							</div>

							<div className="bg-white border border-gray-100 rounded-xl p-4 flex gap-8 shadow-sm shrink-0">
								<div>
									<p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Funding Need</p>
									<p className="text-xl font-bold text-gray-900">{formatCurrency(selectedStartup?.funding_needed)}</p>
								</div>
								<div className="w-px h-auto bg-gray-100" />
								<div>
									<p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Projects</p>
									<p className="text-xl font-bold text-gray-900">{projects.length}</p>
								</div>
							</div>
						</div>

						<form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm mb-8">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
								<div>
									<label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Startup</label>
									<select
										value={selectedStartupId}
										onChange={(event) => setSelectedStartupId(event.target.value)}
										disabled={loading}
										className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 font-medium focus:border-[#0a4d3c]/30 focus:ring-2 focus:ring-[#0a4d3c]/10 transition outline-none"
									>
										<option value="">Select startup</option>
										{startups.map((startup) => (
											<option key={startup.startup_id} value={startup.startup_id}>
												{startup.startup_name}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Project</label>
									<select
										value={projectId}
										onChange={(event) => setProjectId(event.target.value)}
										className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 font-medium focus:border-[#0a4d3c]/30 focus:ring-2 focus:ring-[#0a4d3c]/10 transition outline-none"
									>
										<option value="">Use startup default project</option>
										{projects.map((project) => (
											<option key={project.project_id} value={project.project_id}>
												{project.project_title} ({project.status})
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Investment Amount (USD)</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">$</div>
										<input
											type="number"
											min="1"
											value={amount}
											onChange={(event) => setAmount(event.target.value)}
											className="w-full pl-8 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 font-medium focus:border-[#0a4d3c]/30 focus:ring-2 focus:ring-[#0a4d3c]/10 transition outline-none"
										/>
									</div>
								</div>

								<div>
									<label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Proposed Equity %</label>
									<div className="relative">
										<input
											type="number"
											min="0"
											max="100"
											step="0.01"
											value={equity}
											onChange={(event) => setEquity(event.target.value)}
											className="w-full pl-4 pr-8 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 font-medium focus:border-[#0a4d3c]/30 focus:ring-2 focus:ring-[#0a4d3c]/10 transition outline-none"
										/>
										<div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400 font-bold">%</div>
									</div>
									<p className="text-[10px] text-gray-400 mt-2">
										{impliedValuation ? `Implied valuation: ${formatCurrency(impliedValuation)}` : "Optional, included in the offer message."}
									</p>
								</div>
							</div>

							<div className="mb-6">
								<label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Conditions & Terms</label>
								<input
									type="text"
									value={terms}
									onChange={(event) => setTerms(event.target.value)}
									placeholder="e.g. Board seat, quarterly reporting, technical due diligence"
									className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:border-[#0a4d3c]/30 focus:ring-2 focus:ring-[#0a4d3c]/10 transition outline-none"
								/>
							</div>

							<div className="mb-10">
								<label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Message to Founder</label>
								<textarea
									rows="4"
									value={message}
									onChange={(event) => setMessage(event.target.value)}
									placeholder="Describe your interest, strategic value, and next steps."
									className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:border-[#0a4d3c]/30 focus:ring-2 focus:ring-[#0a4d3c]/10 transition outline-none resize-none"
								/>
							</div>

							<div className="flex justify-end items-center gap-4 border-t border-gray-100 pt-8">
								<Link href="/investor/offers" className="px-6 py-3 text-sm font-bold text-gray-600 hover:text-gray-900 transition">Cancel</Link>
								<button
									type="submit"
									disabled={submitting || loading}
									className="px-8 py-3 bg-[#0a4d3c] text-white text-sm font-bold rounded-xl hover:bg-[#07382b] transition shadow-md disabled:opacity-60"
								>
									{submitting ? "Sending..." : "Send Offer"}
								</button>
							</div>
						</form>
					</div>
				</main>
			</div>
		</div>
	);
}

export default function SendFundingOffer() {
	return (
		<Suspense fallback={<p className="p-8 text-gray-500">Loading...</p>}>
			<SendFundingOfferContent />
		</Suspense>
	);
}
