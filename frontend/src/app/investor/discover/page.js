"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/investor/Sidebar";
import { INDUSTRY_OPTIONS } from "@/components/register/IndustryFields";
import ActorAvatar from "@/components/auth/ActorAvatar";
import {
	getInvestorProfile,
	getInvestorStartups,
	searchInvestorStartups,
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

function StartupIcon({ startup }) {
	const industry = String(startup.industry || "").toLowerCase();
	const iconPath = industry.includes("fin")
		? "M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
		: industry.includes("health")
			? "M20 6h-4V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2zM12 10v8m4-4H8"
			: industry.includes("agri")
				? "M12 21C7 16 4 12 4 8a4 4 0 014-4c4 0 8 4 8 8 0 4-2 7-4 9zM8 12c2 0 5-2 8-7"
				: "M13 10V3L4 14h7v7l9-11h-7z";

	return (
		<div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center z-10 border border-gray-100 group-hover:scale-110 transition-transform">
			<svg className="w-6 h-6 text-[#0a4d3c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath} />
			</svg>
		</div>
	);
}

function StartupCard({ startup, viewMode }) {
	const profileHref = `/investor/discover/profile?startupId=${startup.startup_id}`;
	const stage = startup.business_stage || "Stage not set";
	const location = startup.location || startup.city || startup.region || "Location not set";

	if (viewMode === "list") {
		return (
			<div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col lg:flex-row gap-5 lg:items-center">
				<div className="w-full lg:w-20 h-20 bg-[#0d3328] rounded-xl flex items-center justify-center shrink-0">
					<ActorAvatar role="startup" profileId={startup.startup_id} initials={initials(startup.startup_name)} className="h-12 w-12 rounded-xl text-sm font-black" alt={startup.startup_name} />
				</div>
				<div className="flex-grow min-w-0">
					<h3 className="text-lg font-bold text-gray-900 truncate">{startup.startup_name}</h3>
					<p className="text-sm text-gray-500 mt-1 line-clamp-2">{startup.description || startup.startup_tagline || "No description provided yet."}</p>
					<div className="flex flex-wrap gap-2 mt-3">
						{startup.industry && <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase">{startup.industry}</span>}
						<span className="px-2 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold rounded uppercase">{stage}</span>
						<span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase">{location}</span>
					</div>
				</div>
				<div className="lg:text-right shrink-0">
					<p className="text-xs font-medium text-gray-400">Funding Needed</p>
					<p className="text-2xl font-bold text-[#0a4d3c] mb-4">{formatCurrency(startup.funding_needed)}</p>
					<Link href={profileHref} className="inline-flex px-5 py-2.5 bg-[#0a4d3c] text-white text-sm font-bold rounded-lg hover:bg-[#07382b] transition">
						View Profile
					</Link>
					<Link href={`/investor/offers/new?startupId=${startup.startup_id}`} className="inline-flex px-5 py-2.5 mt-2 lg:ml-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition">
						Send Offer
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group">
			<div className="h-40 bg-[#0d3328] relative flex items-center justify-center overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
				<div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,#34d399,transparent_30%),radial-gradient(circle_at_70%_60%,#0ea5e9,transparent_32%)]" />
				<div className="absolute left-6 -bottom-5">
					<StartupIcon startup={startup} />
				</div>
				<div className="absolute left-6 top-6 text-white">
					<div className="text-xs uppercase tracking-widest font-black text-white/70">{startup.industry || "Startup"}</div>
					<div className="mt-1 text-2xl font-black">{initials(startup.startup_name)}</div>
				</div>
			</div>

			<div className="p-6 pt-10 flex-grow flex flex-col">
				<h3 className="text-xl font-bold text-gray-900 mb-3">{startup.startup_name}</h3>

				<div className="flex flex-wrap gap-2 mb-4">
					{startup.industry && <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase">{startup.industry}</span>}
					<span className="px-2 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold rounded uppercase">{stage}</span>
					<span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase">{location}</span>
				</div>

				<p className="text-sm text-gray-500 mb-6 flex-grow leading-relaxed line-clamp-3">
					{startup.description || startup.startup_tagline || "No description provided yet."}
				</p>

				<div className="flex justify-between items-end mb-6">
					<p className="text-xs font-medium text-gray-400">Funding Needed</p>
					<p className="text-2xl font-bold text-[#0a4d3c]">{formatCurrency(startup.funding_needed)}</p>
				</div>

				<Link href={profileHref} className="w-full py-3 bg-[#0a4d3c] text-white text-sm font-bold rounded-lg hover:bg-[#07382b] transition flex justify-center items-center gap-2">
					View Profile
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
					</svg>
				</Link>
				<Link href={`/investor/offers/new?startupId=${startup.startup_id}`} className="w-full mt-3 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition flex justify-center items-center gap-2">
					Send Offer
				</Link>
			</div>
		</div>
	);
}

const STAGE_OPTIONS = ["Idea Stage", "Pre-Seed", "Seed", "Early Growth", "Growth", "Series A"];

export default function InvestorDiscover() {
	const [viewMode, setViewMode] = useState("grid");
	const [profile, setProfile] = useState(null);
	const [startups, setStartups] = useState([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [filters, setFilters] = useState({
		search: "",
		industry: "",
		stage: "",
		location: "",
	});

	const limit = 6;

	async function loadStartups(nextPage = page, nextFilters = filters) {
		setLoading(true);
		setError("");
		try {
			const hasFilters = Object.values(nextFilters).some(Boolean);
			const params = { ...nextFilters, page: nextPage, limit };
			const data = hasFilters
				? await searchInvestorStartups(params)
				: await getInvestorStartups({ page: nextPage, limit });

			setStartups(data.startups || []);
			setTotal(data.total || 0);
			setPage(data.page || nextPage);
		} catch (err) {
			setError(err.message || "Unable to load startup discovery.");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		let alive = true;

		async function init() {
			try {
				const profileRes = await getInvestorProfile();
				if (alive) setProfile(profileRes.investor || null);
			} catch {
				// Discovery will show the auth/approval error if the account is blocked.
			}
			if (alive) await loadStartups(1, filters);
		}

		init();
		return () => {
			alive = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => {
			loadStartups(1, filters);
		}, 350);

		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filters.search]);

	const totalPages = Math.max(1, Math.ceil(total / limit));
	const profileName = useMemo(
		() =>
			profile?.organization_name ||
			`${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
			"Investor",
		[profile],
	);
	const industryOptions = useMemo(() => {
		const fromResults = startups.map((startup) => startup.industry).filter(Boolean);
		return Array.from(new Set([...INDUSTRY_OPTIONS, ...fromResults])).sort();
	}, [startups]);
	const stageOptions = useMemo(() => {
		const fromResults = startups.map((startup) => startup.business_stage).filter(Boolean);
		return Array.from(new Set([...STAGE_OPTIONS, ...fromResults])).sort();
	}, [startups]);

	function updateFilter(key, value) {
		setFilters((current) => ({ ...current, [key]: value }));
	}

	function applyFilters() {
		loadStartups(1, filters);
	}

	function changePage(nextPage) {
		const safePage = Math.min(totalPages, Math.max(1, nextPage));
		loadStartups(safePage, filters);
	}

	return (
		<div className="flex h-screen bg-[#f8f9fa] font-sans text-gray-900 overflow-hidden">
			<Sidebar />

			<div className="flex-grow flex flex-col overflow-hidden bg-white">
				<header className="flex justify-between items-center px-8 py-4 bg-white border-b border-gray-100 z-10 shrink-0">
					<div className="relative w-full max-w-[500px]">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>
						<input
							type="text"
							value={filters.search}
							onChange={(event) => updateFilter("search", event.target.value)}
							placeholder="Search startups, founders, or industries..."
							className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm outline-none focus:border-[#0a4d3c]/30 focus:ring-2 focus:ring-[#0a4d3c]/10 transition"
						/>
					</div>

					<div className="flex items-center gap-5">
						<div className="w-px h-6 bg-gray-200" />
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-full bg-[#0a4d3c] text-white shrink-0 flex items-center justify-center text-xs font-bold">
								{initials(profileName)}
							</div>
							<div className="flex flex-col">
								<span className="text-sm font-bold text-gray-900 leading-tight">{profileName}</span>
								<span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{profile?.investor_type || "Investor"}</span>
							</div>
						</div>
					</div>
				</header>

				<main className="flex-grow overflow-y-auto p-10 bg-white">
					<div className="max-w-[1200px] mx-auto flex flex-col min-h-full">
						<div className="flex justify-between items-end mb-8">
							<div>
								<h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">Browse Startups</h1>
								<p className="text-gray-500 text-[15px]">Discover high-potential investment opportunities in Ethiopia.</p>
							</div>
							<div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
								<button
									onClick={() => setViewMode("grid")}
									className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition ${viewMode === "grid" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
								>
									Grid
								</button>
								<button
									onClick={() => setViewMode("list")}
									className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition ${viewMode === "list" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
								>
									List
								</button>
							</div>
						</div>

						<div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 flex flex-wrap lg:flex-nowrap gap-6 items-end shadow-sm">
							<div className="flex-1 min-w-[200px]">
								<label className="block text-xs font-bold text-gray-700 mb-2">Industry</label>
								<select
									value={filters.industry}
									onChange={(event) => updateFilter("industry", event.target.value)}
									className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0a4d3c]/20 focus:border-[#0a4d3c]"
								>
									<option value="">All Industries</option>
									{industryOptions.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</select>
							</div>

							<div className="flex-1 min-w-[200px]">
								<label className="block text-xs font-bold text-gray-700 mb-2">Stage</label>
								<select
									value={filters.stage}
									onChange={(event) => updateFilter("stage", event.target.value)}
									className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0a4d3c]/20 focus:border-[#0a4d3c]"
								>
									<option value="">All Stages</option>
									{stageOptions.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</select>
							</div>

							<div className="flex-1 min-w-[200px]">
								<label className="block text-xs font-bold text-gray-700 mb-2">Location</label>
								<input
									value={filters.location}
									onChange={(event) => updateFilter("location", event.target.value)}
									placeholder="City or region"
									className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0a4d3c]/20 focus:border-[#0a4d3c]"
								/>
							</div>

							<button onClick={applyFilters} className="w-full lg:w-auto px-8 py-3 bg-[#0a4d3c] text-white text-sm font-bold rounded-lg hover:bg-[#07382b] transition shadow-sm">
								Apply Filters
							</button>
						</div>

						{error ? (
							<div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
								{error}
							</div>
						) : null}

						{loading ? (
							<div className="rounded-xl border border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500">Loading startups...</div>
						) : startups.length === 0 ? (
							<div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500">
								No startups found. Try adjusting your filters.
							</div>
						) : (
							<div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12" : "flex flex-col gap-4 mb-12"}>
								{startups.map((startup) => (
									<StartupCard key={startup.startup_id} startup={startup} viewMode={viewMode} />
								))}
							</div>
						)}

						<div className="flex justify-between items-center py-6 border-t border-gray-200 mt-auto">
							<p className="text-sm text-gray-500 font-medium">
								Showing {startups.length} of {total} startups
							</p>

							<div className="flex gap-2">
								<button
									onClick={() => changePage(page - 1)}
									disabled={page <= 1 || loading}
									className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition disabled:opacity-40"
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
									</svg>
								</button>
								<span className="px-4 h-10 flex items-center justify-center rounded-lg bg-[#0a4d3c] text-white text-sm font-bold shadow-sm">
									{page} / {totalPages}
								</span>
								<button
									onClick={() => changePage(page + 1)}
									disabled={page >= totalPages || loading}
									className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition disabled:opacity-40"
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
									</svg>
								</button>
							</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
