"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import NotificationBell from "@/components/NotificationBell";
import { browseStartups, fetchIncomingRequests } from "@/lib/mentorApi";

function initials(name) {
	return String(name || "SC")
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();
}

function formatMoney(value) {
	const amount = Number(value || 0);
	if (!amount) return "Not disclosed";
	return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function startupLocation(startup) {
	return startup.city || startup.region || startup.location || "Ethiopia";
}

function Icon({ path, className = "h-4 w-4" }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={path} />
		</svg>
	);
}

export default function MentorStartupsPage() {
	const searchParams = useSearchParams();
	const initialSearch = searchParams.get("search") || "";
	const [startups, setStartups] = useState([]);
	const [search, setSearch] = useState(initialSearch);
	const [appliedSearch, setAppliedSearch] = useState(initialSearch);
	const [industry, setIndustry] = useState("");
	const [stage, setStage] = useState("");
	const [location, setLocation] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [total, setTotal] = useState(0);
	const [activeRequests, setActiveRequests] = useState([]);

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const [data, requestData] = await Promise.all([
				browseStartups({
					search: appliedSearch || undefined,
					industry: industry || undefined,
					stage: stage || undefined,
					location: location || undefined,
					limit: 60,
				}),
				fetchIncomingRequests().catch(() => []),
			]);
			const requests = Array.isArray(requestData) ? requestData : requestData?.requests || [];
			setStartups(data.startups || []);
			setTotal(Number(data.total || data.startups?.length || 0));
			setActiveRequests(
				requests.filter((request) => ["pending", "accepted"].includes(String(request.status || "").toLowerCase())),
			);
		} catch (ex) {
			setError(ex.message || "Failed to load startups.");
		} finally {
			setLoading(false);
		}
	}, [appliedSearch, industry, location, stage]);

	useEffect(() => {
		// Load startup discovery and active mentorship state when filters change.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		load();
	}, [load]);

	useEffect(() => {
		const querySearch = searchParams.get("search") || "";
		// Keep the page filters synchronized with the shared mentor header search.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setSearch(querySearch);
		setAppliedSearch(querySearch);
	}, [searchParams]);

	const filterOptions = useMemo(() => {
		const unique = (fn) => Array.from(new Set(startups.map(fn).filter(Boolean))).sort();
		return {
			industries: unique((startup) => startup.industry),
			stages: unique((startup) => startup.business_stage),
			locations: unique(startupLocation),
		};
	}, [startups]);

	const activeRequestByStartup = useMemo(() => {
		return new Map(activeRequests.map((request) => [String(request.startup_id), request]));
	}, [activeRequests]);

	function applyFilters(event) {
		event.preventDefault();
		setAppliedSearch(search.trim());
	}

	return (
		<div className="min-h-full bg-[#fbfcfc] text-[#061f1a]">
			<header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-gray-100 bg-white px-5 sm:px-8">
				<form onSubmit={applyFilters} className="relative w-full max-w-[460px]">
					<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
						<Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" className="h-5 w-5" />
					</div>
					<input
						type="search"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Search startups, founders, or industries..."
						className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-12 pr-4 text-sm font-medium text-gray-700 outline-none transition focus:border-[#0b4a3c]/30 focus:ring-2 focus:ring-[#0b4a3c]/10"
					/>
				</form>

				<div className="flex items-center gap-4">
					<NotificationBell />
					<button type="button" className="hidden h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-50 hover:text-gray-700 sm:flex" aria-label="Settings">
						<Icon path="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.33.787.713 1.002.382.215.837.244 1.242.1l.85-.304a1.125 1.125 0 011.37.49l.546.947c.275.477.196 1.079-.197 1.464l-.646.635a1.125 1.125 0 000 1.604l.646.635c.393.385.472.987.197 1.464l-.546.947a1.125 1.125 0 01-1.37.49l-.85-.304a1.125 1.125 0 00-1.242.1 1.125 1.125 0 00-.713 1.002l-.149.894c-.09.542-.56.94-1.11.94h-1.093c-.55 0-1.02-.398-1.11-.94l-.149-.894a1.125 1.125 0 00-.713-1.002 1.125 1.125 0 00-1.242-.1l-.85.304a1.125 1.125 0 01-1.37-.49l-.546-.947a1.125 1.125 0 01.197-1.464l.646-.635a1.125 1.125 0 000-1.604l-.646-.635a1.125 1.125 0 01-.197-1.464l.546-.947a1.125 1.125 0 011.37-.49l.85.304c.405.145.86.115 1.242-.1.383-.215.643-.578.713-1.002l.149-.894zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</button>
					<div className="hidden text-right sm:block">
						<p className="text-xs font-black text-gray-950">Mentor Portal</p>
						<p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Startup Discovery</p>
					</div>
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b4a3c] text-xs font-black text-white">
						M
					</div>
				</div>
			</header>

			<main className="mx-auto w-full max-w-[1120px] px-5 py-6 lg:px-8">
				<div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h1 className="text-2xl font-black text-[#052b23]">Discover Startups</h1>
						<p className="mt-1 text-sm text-gray-500">Browse all approved startups and send mentorship proposals.</p>
					</div>
					<p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">
						{loading ? "Loading" : `${total} startups`}
					</p>
				</div>

				{error ? (
					<div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">{error}</div>
				) : null}

				<form onSubmit={applyFilters} className="mb-8 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
					<div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
						<FilterSelect label="Industry" value={industry} onChange={setIndustry} emptyLabel="All Industries" options={filterOptions.industries} />
						<FilterSelect label="Stage" value={stage} onChange={setStage} emptyLabel="All Stages" options={filterOptions.stages} />
						<FilterSelect label="Location" value={location} onChange={setLocation} emptyLabel="All Locations" options={filterOptions.locations} />
						<button
							type="submit"
							className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0b4a3c] px-6 text-sm font-black text-white transition hover:bg-[#07382d]"
						>
							<Icon path="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 20.5v-6.068a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
							Apply Filters
						</button>
					</div>
				</form>

				{loading ? (
					<div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
						{[1, 2, 3].map((item) => (
							<div key={item} className="h-[420px] animate-pulse rounded-xl border border-gray-100 bg-white shadow-sm">
								<div className="h-36 rounded-t-xl bg-gray-100" />
								<div className="space-y-4 p-6">
									<div className="h-5 w-2/3 rounded bg-gray-100" />
									<div className="h-4 w-full rounded bg-gray-100" />
									<div className="h-4 w-3/4 rounded bg-gray-100" />
								</div>
							</div>
						))}
					</div>
				) : startups.length === 0 ? (
					<div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
						No startups match these filters.
					</div>
				) : (
					<div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
						{startups.map((startup, index) => (
							<StartupCard key={startup.startup_id} startup={startup} tone={index % 3} activeRequest={activeRequestByStartup.get(String(startup.startup_id))} />
						))}
					</div>
				)}
			</main>
		</div>
	);
}

function FilterSelect({ label, value, onChange, emptyLabel, options }) {
	return (
		<label>
			<span className="mb-2 block text-xs font-black text-gray-800">{label}</span>
			<select
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 outline-none transition focus:border-[#0b4a3c]/30 focus:ring-2 focus:ring-[#0b4a3c]/10"
			>
				<option value="">{emptyLabel}</option>
				{options.map((option) => (
					<option key={option} value={option}>
						{option}
					</option>
				))}
			</select>
		</label>
	);
}

function StartupCard({ startup, tone, activeRequest }) {
	const gradients = [
		"from-[#0d5a3f] to-[#073b2f]",
		"from-[#092b38] to-[#061b25]",
		"from-gray-200 to-gray-500",
	];
	const accent = ["text-emerald-600", "text-blue-600", "text-red-500"][tone];
	const tags = [startup.industry, startup.business_stage, startupLocation(startup)].filter(Boolean).slice(0, 3);
	const description = startup.startup_tagline || startup.description || "Startup profile available for mentor review.";

	return (
		<article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
			<div className={`relative h-36 bg-gradient-to-br ${gradients[tone]}`}>
				<div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(30deg, currentColor 12%, transparent 12.5%, transparent 87%, currentColor 87.5%, currentColor), linear-gradient(150deg, currentColor 12%, transparent 12.5%, transparent 87%, currentColor 87.5%, currentColor)", backgroundSize: "48px 84px" }} />
				<div className="absolute -bottom-6 left-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-sm font-black shadow-sm">
					<span className={accent}>{initials(startup.startup_name)}</span>
				</div>
			</div>
			<div className="p-6 pt-10">
				<h2 className="text-xl font-black text-gray-950">{startup.startup_name}</h2>
				<div className="mt-3 flex flex-wrap gap-2">
					{tags.map((tag) => (
						<span key={tag} className="rounded bg-gray-100 px-2 py-1 text-[10px] font-black uppercase text-gray-700">
							{tag}
						</span>
					))}
				</div>
				<p className="mt-5 line-clamp-2 min-h-[48px] text-sm leading-6 text-gray-600">
					{description}
				</p>
				<div className="mt-6 flex items-end justify-between">
					<div>
						<p className="text-xs font-medium text-gray-400">Funding Needed</p>
						<p className="mt-1 text-2xl font-black text-[#0b4a3c]">{formatMoney(startup.funding_needed)}</p>
					</div>
				</div>
				<div className="mt-6 grid grid-cols-1 gap-3">
					<Link
						href={`/mentor/requests/profile?startupId=${startup.startup_id}`}
						className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0b4a3c] text-sm font-black text-white transition hover:bg-[#07382d]"
					>
						View Profile
						<span aria-hidden="true">-&gt;</span>
					</Link>
					{activeRequest && String(activeRequest.status).toLowerCase() === "accepted" ? (
						<div className="grid grid-cols-2 gap-2">
							<Link
								href={`/mentor/messages?startupId=${startup.startup_id}`}
								className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-black text-gray-700 transition hover:bg-gray-50"
							>
								Message
							</Link>
							<Link
								href={`/mentor/sessions?startupId=${startup.startup_id}`}
								className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-black text-gray-700 transition hover:bg-gray-50"
							>
								Schedule
							</Link>
						</div>
					) : activeRequest ? (
						<button
							type="button"
							disabled
							className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs font-black text-gray-400"
						>
							Proposal Pending
						</button>
					) : (
						<Link
							href={`/mentor/requests/proposal?startupId=${startup.startup_id}`}
							className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-black text-gray-700 transition hover:bg-gray-50"
						>
							Send Proposal
						</Link>
					)}
				</div>
			</div>
		</article>
	);
}
