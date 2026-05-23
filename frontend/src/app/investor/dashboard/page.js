"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AiMentorWidget from "@/components/investor/AiMentorWidget";
import Sidebar from "@/components/investor/Sidebar";
import {
	getInvestorFundingOffers,
	getInvestorPortfolio,
	getInvestorProfile,
	getInvestorRecommendations,
	getInvestorStartups,
	searchInvestorStartups,
} from "@/lib/investorApi";

function formatCurrency(value) {
	const amount = Number(value || 0);
	if (!amount) return "$0";
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: amount >= 1000 ? 0 : 2,
	}).format(amount);
}

function initials(name) {
	return String(name || "Investor")
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();
}

function startupName(startup) {
	return startup?.startup_name || startup?.project_title || "Startup";
}

function StatCard({ label, value, note, tone = "emerald", iconPath }) {
	const tones = {
		emerald: "bg-emerald-50 text-emerald-600",
		blue: "bg-blue-50 text-blue-600",
		amber: "bg-amber-50 text-amber-600",
		violet: "bg-violet-50 text-violet-600",
	};

	return (
		<div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between min-h-[150px]">
			<div className="flex justify-between items-start mb-6">
				<div className={`w-10 h-10 rounded-full flex items-center justify-center ${tones[tone]}`}>
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath} />
					</svg>
				</div>
				{note ? (
					<span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
						{note}
					</span>
				) : null}
			</div>
			<div>
				<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
				<h3 className="text-3xl font-bold text-gray-900">{value}</h3>
			</div>
		</div>
	);
}

function EmptyState({ children }) {
	return (
		<div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
			{children}
		</div>
	);
}

export default function InvestorDashboard() {
	const [profile, setProfile] = useState(null);
	const [portfolio, setPortfolio] = useState(null);
	const [recommendations, setRecommendations] = useState([]);
	const [fundingOffers, setFundingOffers] = useState([]);
	const [startups, setStartups] = useState([]);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [searching, setSearching] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		let alive = true;

		async function loadDashboard() {
			setLoading(true);
			setError("");
			try {
				const [profileRes, portfolioRes, recommendationsRes, offersRes, startupsRes] =
					await Promise.all([
						getInvestorProfile(),
						getInvestorPortfolio(),
						getInvestorRecommendations({ limit: 4 }),
						getInvestorFundingOffers(),
						getInvestorStartups({ limit: 6 }),
					]);

				if (!alive) return;
				setProfile(profileRes.investor || null);
				setPortfolio(portfolioRes || null);
				setRecommendations(recommendationsRes.recommendations || []);
				setFundingOffers(offersRes.funding_offers || []);
				setStartups(startupsRes.startups || []);
			} catch (err) {
				if (!alive) return;
				setError(err.message || "Unable to load investor dashboard.");
			} finally {
				if (alive) setLoading(false);
			}
		}

		loadDashboard();
		return () => {
			alive = false;
		};
	}, []);

	useEffect(() => {
		let alive = true;
		const timer = setTimeout(async () => {
			if (!search.trim()) {
				setSearching(false);
				return;
			}

			setSearching(true);
			try {
				const data = await searchInvestorStartups({ search, limit: 6 });
				if (alive) setStartups(data.startups || []);
			} catch (err) {
				if (alive) setError(err.message || "Unable to search startups.");
			} finally {
				if (alive) setSearching(false);
			}
		}, 350);

		return () => {
			alive = false;
			clearTimeout(timer);
		};
	}, [search]);

	const profileName = useMemo(() => {
		if (!profile) return "Investor";
		return (
			profile.organization_name ||
			`${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
			"Investor"
		);
	}, [profile]);

	const recommendedStartups = useMemo(() => {
		const fromRecommendations = recommendations.map((item) => ({
			...(item.startup || item),
			reason: item.reason,
			score: item.score,
		}));
		return fromRecommendations.length ? fromRecommendations : startups.slice(0, 4);
	}, [recommendations, startups]);

	const pendingOffers = fundingOffers.filter((offer) => offer.status === "pending");
	const totalValue = portfolio?.total_value || 0;
	const totalInvestments = portfolio?.total_investments || 0;
	const activeStartups = portfolio?.startups?.length || totalInvestments;

	return (
		<div className="flex h-screen bg-[#f8f9fa] font-sans text-gray-900 overflow-hidden">
			<Sidebar />

			<div className="flex-grow flex flex-col overflow-hidden">
				<main className="flex-grow overflow-y-auto p-8 pt-24">
					<div className="flex justify-between items-end mb-8">
						<div>
							<h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Investor Dashboard</h1>
							<p className="text-gray-500 text-sm">
								{loading ? "Loading your investor activity..." : `Welcome back, ${profileName}.`}
							</p>
						</div>
						<div className="flex gap-3">
							<Link href="/investor/discover" className="px-5 py-2.5 bg-[#0a4d3c] hover:bg-[#07382b] text-white text-sm font-semibold rounded-lg transition shadow-sm">
								Browse Startups
							</Link>
							<Link href="/investor/offers" className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition shadow-sm">
								View Offers
							</Link>
						</div>
					</div>

					{error ? (
						<div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
							{error}
						</div>
					) : null}

					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
						<StatCard
							label="Total Investments"
							value={loading ? "..." : formatCurrency(totalValue)}
							note={`${totalInvestments} closed`}
							iconPath="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 9v1m9-5a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
						<StatCard
							label="Active Startups"
							value={loading ? "..." : activeStartups}
							note={`${startups.length} visible`}
							tone="blue"
							iconPath="M13 10V3L4 14h7v7l9-11h-7z"
						/>
						<StatCard
							label="Pending Offers"
							value={loading ? "..." : pendingOffers.length}
							note={`${fundingOffers.length} total`}
							tone="amber"
							iconPath="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
						<StatCard
							label="Recommendations"
							value={loading ? "..." : recommendedStartups.length}
							note="Live"
							tone="violet"
							iconPath="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L3.077 10.1c-.783-.57-.38-1.81.588-1.81H8.58a1 1 0 00.95-.69l1.519-4.674z"
						/>
					</div>

					<div className="flex flex-col xl:flex-row gap-8 mb-10">
						<section className="flex-[2] flex flex-col">
							<div className="flex justify-between items-center mb-5">
								<div>
									<h2 className="text-xl font-bold text-gray-900">Recommended Startups</h2>
									{searching ? <p className="text-xs text-gray-500 mt-1">Searching...</p> : null}
								</div>
								<Link href="/investor/recommendations" className="text-sm font-bold text-[#0a4d3c] hover:underline">
									View Recommendations
								</Link>
							</div>

							{loading ? (
								<EmptyState>Loading recommended startups...</EmptyState>
							) : recommendedStartups.length === 0 ? (
								<EmptyState>No startup recommendations are available yet.</EmptyState>
							) : (
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
									{recommendedStartups.slice(0, 4).map((startup, index) => (
										<div key={startup.startup_id || startup.project_id || index} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
											<div className="h-28 bg-[#0d3328] relative overflow-hidden flex items-center justify-center">
												<div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />
												<div className="absolute left-4 bottom-4 flex items-center gap-2 text-white font-bold">
													<div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#0a4d3c] text-xs">
														{initials(startupName(startup))}
													</div>
													{startupName(startup)}
												</div>
											</div>
											<div className="p-5 flex-grow flex flex-col">
												<div className="flex flex-wrap gap-2 mb-3">
													{startup.industry ? <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase">{startup.industry}</span> : null}
													{startup.business_stage ? <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase">{startup.business_stage}</span> : null}
												</div>
												<p className="text-sm text-gray-600 flex-grow mb-6 line-clamp-3">
													{startup.reason || startup.description || startup.startup_tagline || "Startup profile details are being prepared."}
												</p>
												<div className="flex justify-between items-center border-t border-gray-100 pt-4">
													<p className="text-sm text-gray-500">
														Seeking: <span className="font-bold text-gray-900">{formatCurrency(startup.funding_needed || startup.funding_goal)}</span>
													</p>
													<Link href={`/investor/discover/profile?startupId=${startup.startup_id || ""}`} className="text-sm font-bold text-gray-900 hover:text-[#0a4d3c] transition">
														Analyze
													</Link>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</section>

						<aside className="flex-[1] flex flex-col min-w-[300px]">
							<div className="mb-6">
								<div className="flex justify-between items-center mb-5">
									<h2 className="text-xl font-bold text-gray-900">Funding Offers</h2>
									<Link href="/investor/offers" className="text-sm font-bold text-[#0a4d3c] hover:underline">
										View All
									</Link>
								</div>
								<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
									{loading ? (
										<p className="text-sm text-gray-500">Loading offers...</p>
									) : fundingOffers.length === 0 ? (
										<p className="text-sm text-gray-500">No funding offers sent yet.</p>
									) : (
										fundingOffers.slice(0, 4).map((offer) => (
											<div key={offer.investment_request_id} className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-b-0 last:pb-0">
												<div className="flex items-center gap-3">
													<div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
														{initials(offer.startup_name)}
													</div>
													<div>
														<h4 className="text-sm font-bold text-gray-900">{offer.startup_name || "Startup"}</h4>
														<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{offer.status}</p>
													</div>
												</div>
												<div className="text-right">
													<div className="text-sm font-bold text-[#0a4d3c]">{formatCurrency(offer.requested_amount)}</div>
													<div className="text-[10px] text-gray-400">{offer.project_title || offer.business_stage || "Offer"}</div>
												</div>
											</div>
										))
									)}
								</div>
							</div>

							<div className="bg-[#092a2a] rounded-xl shadow-sm p-6 text-white flex-grow flex flex-col justify-center relative overflow-hidden">
								<div className="relative z-10">
									<h3 className="text-lg font-bold mb-2">Portfolio Insights</h3>
									<p className="text-sm text-gray-300 mb-6 leading-relaxed">
										Your live portfolio currently tracks {totalInvestments} completed investment{totalInvestments === 1 ? "" : "s"}.
									</p>

									<div className="space-y-4">
										{(portfolio?.startups || []).slice(0, 2).map((item, index) => (
											<div key={item.investment_id || index}>
												<div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5">
													<span>{item.startup_name || `Investment ${index + 1}`}</span>
													<span>{formatCurrency(item.amount)}</span>
												</div>
												<div className="w-full bg-[#114545] rounded-full h-1.5">
													<div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${Math.max(12, Math.min(100, totalValue ? (Number(item.amount || 0) / Number(totalValue)) * 100 : 0))}%` }} />
												</div>
											</div>
										))}
										{!portfolio?.startups?.length ? (
											<p className="text-sm text-gray-300">Completed investments will appear here once offers are approved and closed.</p>
										) : null}
									</div>
								</div>
							</div>
						</aside>
					</div>

					<section>
						<div className="flex items-center gap-4 mb-5">
							<h2 className="text-xl font-bold text-gray-900">Visible Startups</h2>
							<span className="px-3 py-1 bg-[#0a4d3c] text-white text-[10px] font-bold rounded-full">From API</span>
						</div>
						<div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-10">
							<div className="grid grid-cols-4 px-6 py-4 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
								<div>Startup</div>
								<div>Industry</div>
								<div>Stage</div>
								<div className="text-right">Funding Needed</div>
							</div>

							{loading ? (
								<div className="px-6 py-5 text-sm text-gray-500">Loading startups...</div>
							) : startups.length === 0 ? (
								<div className="px-6 py-5 text-sm text-gray-500">No visible startups found.</div>
							) : (
								<div className="divide-y divide-gray-100">
									{startups.slice(0, 6).map((startup) => (
										<div key={startup.startup_id} className="grid grid-cols-4 items-center px-6 py-4 hover:bg-gray-50 transition">
											<div className="flex items-center gap-3 min-w-0">
												<div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
													{initials(startup.startup_name)}
												</div>
												<div className="min-w-0">
													<h4 className="text-sm font-bold text-gray-900 truncate">{startup.startup_name}</h4>
													<p className="text-xs text-gray-500 truncate">{startup.location || startup.city || "Location not set"}</p>
												</div>
											</div>
											<div className="text-sm font-semibold text-gray-700 truncate pr-4">{startup.industry || "Not specified"}</div>
											<div className="text-sm text-gray-500 truncate pr-4">{startup.business_stage || "Not specified"}</div>
											<div className="text-right text-sm font-bold text-[#0a4d3c]">{formatCurrency(startup.funding_needed)}</div>
										</div>
									))}
								</div>
							)}
						</div>
					</section>
				</main>
			</div>

			<AiMentorWidget />
		</div>
	);
}
