"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/startup/Sidebar";
import StartupTopBar from "@/components/startup/StartupTopBar";
import { getStartupProfile, searchInvestors, searchMentors } from "@/lib/startupApi";

function initials(value) {
	return String(value || "?")
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();
}

function displayName(profile, type) {
	if (type === "investors") {
		return profile.organization_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Investor";
	}
	return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.professional_title || "Mentor";
}

function DiscoverCard({ profile, type }) {
	const name = displayName(profile, type);
	const isInvestor = type === "investors";
	const id = isInvestor ? profile.investor_id : profile.mentor_id;
	const href = `/startup/discover/${isInvestor ? "investor" : "mentor"}/${id}`;
	const location = profile.country || profile.city_location || profile.location_preference || "Ethiopia";
	const focus = isInvestor
		? profile.preferred_industry || profile.investment_stage
		: profile.expertise || profile.primary_industry;
	const description = profile.bio || profile.headline || profile.professional_title || "View the full profile to learn more.";

	return (
		<article className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md">
			<div className="flex items-center gap-3">
				<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0f3d32] text-sm font-black text-white">
					{initials(name)}
				</div>
				<div className="min-w-0">
					<h2 className="truncate text-lg font-black text-gray-900">{name}</h2>
					<p className="truncate text-xs font-medium text-gray-500">{location}</p>
				</div>
			</div>
			{focus ? (
				<p className="mt-5 inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
					{focus}
				</p>
			) : null}
			<p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-gray-600">{description}</p>
			<Link
				href={href}
				className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#0f3d32] px-4 text-sm font-black text-white transition hover:bg-[#0a2921]"
			>
				View Profile
			</Link>
		</article>
	);
}

export default function StartupDiscoverPage() {
	const [startup, setStartup] = useState(null);
	const [activeTab, setActiveTab] = useState("investors");
	const [search, setSearch] = useState("");
	const [appliedSearch, setAppliedSearch] = useState("");
	const [investors, setInvestors] = useState([]);
	const [mentors, setMentors] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const params = { search: appliedSearch || undefined, limit: 60 };
			const [investorData, mentorData, profileData] = await Promise.all([
				searchInvestors(params),
				searchMentors(params),
				getStartupProfile().catch(() => ({ startup: null })),
			]);
			setInvestors(investorData.investors || []);
			setMentors(mentorData.mentors || []);
			setStartup(profileData.startup || null);
		} catch (ex) {
			setError(ex.message || "Unable to load discovery profiles.");
		} finally {
			setLoading(false);
		}
	}, [appliedSearch]);

	useEffect(() => {
		const timer = setTimeout(() => load(), 0);
		return () => clearTimeout(timer);
	}, [load]);

	const visibleProfiles = useMemo(
		() => (activeTab === "investors" ? investors : mentors),
		[activeTab, investors, mentors],
	);

	function applySearch(event) {
		event?.preventDefault();
		setAppliedSearch(search.trim());
	}

	return (
		<div className="flex min-h-screen bg-[#f6f8f9] text-gray-900">
			<Sidebar />
			<main className="flex-grow overflow-y-auto">
				<StartupTopBar
					searchValue={search}
					onSearchChange={setSearch}
					onSearchSubmit={() => setAppliedSearch(search.trim())}
					searchPlaceholder="Search investors or mentors..."
					profileName={startup?.startup_name || "My Startup"}
					profileSubtitle="Discover"
					onRefresh={load}
					refreshing={loading}
				/>
				<div className="mx-auto w-full max-w-[1120px] px-5 py-10 sm:px-8">
					<h1 className="text-3xl font-black text-[#0f3d32]">Discover Investors and Mentors</h1>
					<p className="mt-2 text-sm text-gray-500">Search approved directory profiles and open the exact profile you want to review.</p>

					<form onSubmit={applySearch} className="mt-7 flex gap-3 sm:hidden">
						<input
							type="search"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search profiles..."
							className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0f3d32]"
						/>
						<button type="submit" className="rounded-xl bg-[#0f3d32] px-5 text-sm font-black text-white">Search</button>
					</form>

					<div className="mt-8 flex gap-7 border-b border-gray-200">
						{["investors", "mentors"].map((tab) => (
							<button
								key={tab}
								type="button"
								onClick={() => setActiveTab(tab)}
								className={`border-b-2 pb-3 text-sm font-black capitalize transition ${
									activeTab === tab ? "border-[#0f3d32] text-[#0f3d32]" : "border-transparent text-gray-400"
								}`}
							>
								{tab} ({tab === "investors" ? investors.length : mentors.length})
							</button>
						))}
					</div>

					{error ? <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</p> : null}
					{loading ? (
						<p className="mt-6 rounded-xl bg-white p-10 text-center text-sm text-gray-500">Loading profiles...</p>
					) : visibleProfiles.length ? (
						<div className="mt-6 grid gap-6 md:grid-cols-2">
							{visibleProfiles.map((profile) => (
								<DiscoverCard
									key={activeTab === "investors" ? profile.investor_id : profile.mentor_id}
									profile={profile}
									type={activeTab}
								/>
							))}
						</div>
					) : (
						<p className="mt-6 rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
							No approved profiles match this search.
						</p>
					)}
				</div>
			</main>
		</div>
	);
}
