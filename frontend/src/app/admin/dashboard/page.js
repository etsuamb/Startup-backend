"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
	fetchEngagementAnalytics,
	fetchFundingAnalytics,
	fetchMaintenanceStatus,
	fetchPendingUsers,
	fetchStartupAnalytics,
	fetchSystemAnalytics,
} from "@/lib/adminApi";
import AdminTabs from "@/components/admin/AdminTabs";
import { useAdminLocale } from "@/components/admin/AdminLocaleProvider";

const STAT_CARDS = [
	{ labelKey: "dashboard.totalUsers", valueKey: "total_users", icon: "users", tone: "emerald" },
	{ labelKey: "dashboard.verifiedStartups", valueKey: "total_startups", icon: "startup", tone: "teal" },
	{ labelKey: "dashboard.investors", valueKey: "total_investors", icon: "investor", tone: "cyan" },
	{ labelKey: "dashboard.mentors", valueKey: "total_mentors", icon: "mentor", tone: "amber" },
];

const METRIC_CARDS = [
	{ labelKey: "dashboard.verifiedUsers", valueKey: "total_verified_users", icon: "verified" },
	{
		labelKey: "dashboard.platformFeeRevenue",
		valueKey: "revenue_from_platform_fees",
		format: "currency",
		icon: "revenue",
	},
	{ labelKey: "dashboard.mentorshipPayments", valueKey: "total_mentorship_transactions", icon: "payment" },
	{ labelKey: "dashboard.investmentPayments", valueKey: "total_investment_transactions", icon: "growth" },
];

const ACTION_LINKS = [
	{
		href: "/admin/users",
		titleKey: "dashboard.reviewPendingAccounts",
		descriptionKey: "dashboard.reviewPendingAccountsHelp",
	},
	{
		href: "/admin/startups",
		titleKey: "dashboard.manageStartupListings",
		descriptionKey: "dashboard.manageStartupListingsHelp",
	},
	{
		href: "/admin/projects",
		titleKey: "dashboard.reviewProjects",
		descriptionKey: "dashboard.reviewProjectsHelp",
	},
	{
		href: "/admin/mentorship",
		titleKey: "dashboard.mentorshipOversight",
		descriptionKey: "dashboard.mentorshipOversightHelp",
	},
	{
		href: "/admin/reports",
		titleKey: "dashboard.openPlatformReports",
		descriptionKey: "dashboard.openPlatformReportsHelp",
	},
	{
		href: "/admin/investments",
		titleKey: "dashboard.overseeInvestments",
		descriptionKey: "dashboard.overseeInvestmentsHelp",
	},
	{
		href: "/admin/payments",
		titleKey: "dashboard.reviewPayments",
		descriptionKey: "dashboard.reviewPaymentsHelp",
	},
	{
		href: "/admin/moderation",
		titleKey: "dashboard.chatModeration",
		descriptionKey: "dashboard.chatModerationHelp",
	},
	{
		href: "/admin/activity",
		titleKey: "dashboard.systemActivity",
		descriptionKey: "dashboard.systemActivityHelp",
	},
	{
		href: "/admin/maintenance",
		titleKey: "dashboard.checkMaintenance",
		descriptionKey: "dashboard.checkMaintenanceHelp",
	},
];

const ACTION_PAGE_SIZE = 4;

const ICON_PATHS = {
	users: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m7-10a4 4 0 100-8 4 4 0 000 8zm13 10v-2a4 4 0 00-3-3.87m-4-10a4 4 0 010 7.75",
	startup: "M13 10V3L4 14h7v7l9-11h-7z",
	investor: "M12 8c-1.66 0-3 .9-3 2s1.34 2 3 2 3 .9 3 2-1.34 2-3 2m0-8c1.11 0 2.08.4 2.6 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.4-2.6-1m11.6-3a9 9 0 11-18 0 9 9 0 0118 0z",
	mentor: "M12 6.25v13m0-13C10.83 5.48 9.25 5 7.5 5S4.17 5.48 3 6.25v13C4.17 18.48 5.75 18 7.5 18s3.33.48 4.5 1.25m0-13C13.17 5.48 14.75 5 16.5 5s3.33.48 4.5 1.25v13C19.83 18.48 18.25 18 16.5 18s-3.33.48-4.5 1.25",
	verified: "M9 12l2 2 4-4m5.62-4.02A11.96 11.96 0 0112 2.94a11.96 11.96 0 01-8.62 3.04A12.02 12.02 0 003 9c0 5.59 3.82 10.29 9 11.62 5.18-1.33 9-6.03 9-11.62 0-1.04-.13-2.05-.38-3.02z",
	revenue: "M12 8c-1.66 0-3 .9-3 2s1.34 2 3 2 3 .9 3 2-1.34 2-3 2m0-8c1.11 0 2.08.4 2.6 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.4-2.6-1m11.6-3a9 9 0 11-18 0 9 9 0 0118 0z",
	payment: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
	growth: "M7 17l4-4 3 3 5-6m0 0h-4m4 0v4",
};

const TONE_CLASSES = {
	emerald: "bg-emerald-50 text-emerald-700",
	teal: "bg-teal-50 text-teal-700",
	cyan: "bg-cyan-50 text-cyan-700",
	amber: "bg-amber-50 text-amber-700",
};

function DashboardIcon({ name, className = "h-5 w-5" }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={ICON_PATHS[name]} />
		</svg>
	);
}

function formatCardValue(card, stats, loading) {
	if (loading) return "...";
	const raw = stats?.[card.valueKey];
	if (card.format === "currency") {
		return Number(raw || 0).toLocaleString(undefined, {
			style: "currency",
			currency: "ETB",
			maximumFractionDigits: 0,
		});
	}
	return raw ?? 0;
}

export default function AdminDashboard() {
	const { dateLocale, t } = useAdminLocale();
	const [stats, setStats] = useState(null);
	const [startupStats, setStartupStats] = useState(null);
	const [fundingStats, setFundingStats] = useState(null);
	const [engagement, setEngagement] = useState(null);
	const [analyticsTab, setAnalyticsTab] = useState("system");
	const [pendingCount, setPendingCount] = useState(0);
	const [dbOk, setDbOk] = useState(true);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);
	const [actionPage, setActionPage] = useState(0);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const [analytics, pending, maintenance, startups, funding, engage] = await Promise.all([
					fetchSystemAnalytics(),
					fetchPendingUsers(),
					fetchMaintenanceStatus(),
					fetchStartupAnalytics(),
					fetchFundingAnalytics(),
					fetchEngagementAnalytics(),
				]);
				if (cancelled) return;
				setStats(analytics.system);
				setStartupStats(startups);
				setFundingStats(funding);
				setEngagement(engage);
				setPendingCount(pending.pending?.length ?? 0);
				setDbOk(maintenance.database === "ok");
			} catch (ex) {
				if (!cancelled) setError(ex.message || t("dashboard.loadError"));
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [t]);

	const s = stats || {};
	const actionTotalPages = Math.max(1, Math.ceil(ACTION_LINKS.length / ACTION_PAGE_SIZE));
	const visibleActionLinks = ACTION_LINKS.slice(
		actionPage * ACTION_PAGE_SIZE,
		actionPage * ACTION_PAGE_SIZE + ACTION_PAGE_SIZE,
	);

	return (
		<div className="mx-auto max-w-7xl pb-10">
			{error ? (
				<div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-700 shadow-sm">
					{error}
				</div>
			) : null}

			<section className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
				<div>
					<p className="text-xs font-bold uppercase tracking-[0.22em] text-[#007c6a]">{t("dashboard.adminOverview")}</p>
					<h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">StartupConnect Ethiopia</h1>
					<p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{t("dashboard.intro")}</p>
				</div>
				<div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
					<span className={`flex h-10 w-10 items-center justify-center rounded-xl ${dbOk ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
						<DashboardIcon name="verified" />
					</span>
					<div>
						<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{t("dashboard.currentStatus")}</p>
						<p className="mt-1 text-sm font-bold text-slate-800">{dbOk ? t("dashboard.databaseConnected") : t("dashboard.databaseUnavailable")}</p>
					</div>
					<span className={`ml-2 h-2.5 w-2.5 rounded-full ${dbOk ? "bg-emerald-500" : "bg-amber-500"}`} />
				</div>
			</section>

			<section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{STAT_CARDS.map((card) => (
					<div key={card.labelKey} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-xs font-semibold text-slate-500">{t(card.labelKey)}</p>
								<p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{formatCardValue(card, s, loading)}</p>
							</div>
							<span className={`flex h-10 w-10 items-center justify-center rounded-xl ${TONE_CLASSES[card.tone]}`}>
								<DashboardIcon name={card.icon} />
							</span>
						</div>
					</div>
				))}
			</section>

			<section className="mb-7 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
				<div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{t("dashboard.statisticsOverview")}</p>
						<p className="mt-1 text-sm text-slate-500">
							{t("dashboard.lastUpdated")}:{" "}
							{new Date().toLocaleString(dateLocale, {
								weekday: "short",
								month: "short",
								day: "numeric",
								hour: "numeric",
								minute: "2-digit",
							})}
						</p>
					</div>
					<span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${dbOk ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
						<span className={`h-2 w-2 rounded-full ${dbOk ? "bg-emerald-500" : "bg-amber-500"}`} />
						{dbOk ? t("dashboard.healthy") : t("dashboard.attentionNeeded")}
					</span>
				</div>

				<div className="pt-5">
					<AdminTabs
						tabs={[
							{ id: "system", label: t("dashboard.statisticsOverview") },
							{ id: "users", label: t("dashboard.userAnalytics") },
							{ id: "startups", label: t("dashboard.startupAnalytics") },
							{ id: "investments", label: t("dashboard.investmentAnalytics") },
							{ id: "engagement", label: t("dashboard.engagement") },
						]}
						active={analyticsTab}
						onChange={setAnalyticsTab}
					/>

					{analyticsTab === "system" ? (
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
							{METRIC_CARDS.map((card) => (
								<div key={card.labelKey} className="rounded-xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-100">
									<div className="flex items-center gap-2 text-[#007c6a]">
										<DashboardIcon name={card.icon} className="h-4 w-4" />
										<p className="text-xs font-semibold text-slate-500">{t(card.labelKey)}</p>
									</div>
									<p className="mt-3 text-xl font-bold tracking-tight text-slate-900">{formatCardValue(card, s, loading)}</p>
								</div>
							))}
						</div>
					) : null}
					{analyticsTab === "startups" && startupStats?.by_status ? (
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
							{startupStats.by_status.map((row) => (
								<div key={row.status} className="rounded-xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-100">
									<p className="text-xs font-semibold text-slate-500">{row.status}</p>
									<p className="mt-2 text-2xl font-bold text-slate-900">{row.count}</p>
								</div>
							))}
						</div>
					) : null}
					{analyticsTab === "investments" && fundingStats ? (
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
							<AnalyticsValue label={t("dashboard.totalRequests")} value={fundingStats.total_requests ?? fundingStats.total_funding_requests ?? "..."} />
							<AnalyticsValue label={t("dashboard.approved")} value={fundingStats.approved ?? "..."} />
							<AnalyticsValue label={t("dashboard.pending")} value={fundingStats.pending ?? "..."} />
						</div>
					) : null}
					{analyticsTab === "engagement" && engagement ? (
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
							<AnalyticsValue label={t("dashboard.activeUsersRecent")} value={engagement.active_users ?? engagement.total_active ?? "..."} />
						</div>
					) : null}
					{analyticsTab === "users" && stats ? (
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
							<AnalyticsValue label={t("dashboard.totalUsers")} value={stats.total_users} />
							<AnalyticsValue label={t("dashboard.verified")} value={stats.total_verified_users} />
							<AnalyticsValue label={t("dashboard.pendingApproval")} value={stats.pending_users} />
							<AnalyticsValue label={t("dashboard.active")} value={stats.active_users} />
						</div>
					) : null}
				</div>
			</section>

			<div className="grid grid-cols-1 gap-7 xl:grid-cols-[1.2fr_0.8fr]">
				<section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
					<div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
						<div>
							<p className="text-xs font-bold uppercase tracking-[0.2em] text-[#007c6a]">{t("dashboard.platformPulse")}</p>
							<h2 className="mt-2 text-lg font-bold text-slate-900">{t("dashboard.approvalOverview")}</h2>
						</div>
						<span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{t("dashboard.operational")}</span>
					</div>

					<div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
						<PulseCard label={t("dashboard.pendingVerifications")} value={loading ? "..." : pendingCount} help={t("dashboard.pendingVerificationsHelp")} />
						<PulseCard label={t("dashboard.activeUserVolume")} value={loading ? "..." : s.active_users ?? 0} help={t("dashboard.activeUserVolumeHelp")} />
						<PulseCard label={t("dashboard.projectsListed")} value={loading ? "..." : s.total_projects ?? 0} help={t("dashboard.projectsListedHelp")} />
						<PulseCard label={t("dashboard.fundingRequests")} value={loading ? "..." : s.total_funding_requests ?? 0} help={t("dashboard.fundingRequestsHelp")} />
					</div>
				</section>

				<section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
					<div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
						<div>
							<p className="text-xs font-bold uppercase tracking-[0.2em] text-[#007c6a]">{t("dashboard.actionCenter")}</p>
							<h2 className="mt-2 text-lg font-bold text-slate-900">{t("dashboard.adminControls")}</h2>
						</div>
						<span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{t("dashboard.priority")}</span>
					</div>

					<div className="mt-3 divide-y divide-slate-100">
						{visibleActionLinks.map((item) => (
							<Link key={item.href} href={item.href} className="group flex items-center justify-between gap-4 py-3.5">
								<div>
									<p className="text-sm font-bold text-slate-800 transition group-hover:text-[#007c6a]">{t(item.titleKey)}</p>
									<p className="mt-1 text-xs leading-5 text-slate-500">{t(item.descriptionKey)}</p>
								</div>
								<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition group-hover:bg-emerald-50 group-hover:text-[#007c6a]">
									<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
									</svg>
								</span>
							</Link>
						))}
					</div>

					<div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-4">
						<p className="text-xs text-slate-500">{t("dashboard.page", { current: actionPage + 1, total: actionTotalPages })}</p>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setActionPage((page) => Math.max(0, page - 1))}
								disabled={actionPage === 0}
								className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
							>
								{t("dashboard.previous")}
							</button>
							<button
								type="button"
								onClick={() => setActionPage((page) => Math.min(actionTotalPages - 1, page + 1))}
								disabled={actionPage >= actionTotalPages - 1}
								className="rounded-lg bg-[#007c6a] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#006457] disabled:cursor-not-allowed disabled:opacity-40"
							>
								{t("dashboard.next")}
							</button>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}

function AnalyticsValue({ label, value }) {
	return (
		<div className="rounded-xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-100">
			<p className="text-xs font-semibold text-slate-500">{label}</p>
			<p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
		</div>
	);
}

function PulseCard({ label, value, help }) {
	return (
		<div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
			<p className="text-xs font-bold text-slate-600">{label}</p>
			<p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
			<p className="mt-2 text-xs leading-5 text-slate-500">{help}</p>
		</div>
	);
}
