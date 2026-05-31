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

const STAT_CARDS = [
	{ label: "Total users", valueKey: "total_users", accent: "border-l-[#006054]" },
	{ label: "Verified startups", valueKey: "total_startups", accent: "border-l-[#0f766e]" },
	{ label: "Investors", valueKey: "total_investors", accent: "border-l-[#134e4a]" },
	{ label: "Mentors", valueKey: "total_mentors", accent: "border-l-[#115e59]" },
];

const METRIC_CARDS = [
	{ label: "Verified users", valueKey: "total_verified_users", accent: "border-l-[#047857]" },
	{
		label: "Platform fee revenue",
		valueKey: "revenue_from_platform_fees",
		format: "currency",
		accent: "border-l-[#065f46]",
	},
	{ label: "Mentorship payments", valueKey: "total_mentorship_transactions", accent: "border-l-[#0d9488]" },
	{ label: "Investment payments", valueKey: "total_investment_transactions", accent: "border-l-[#14b8a6]" },
];

const ACTION_LINKS = [
	{
		href: "/admin/users",
		title: "Review pending accounts",
		description: "Approve new users and keep the verification queue moving.",
	},
	{
		href: "/admin/startups",
		title: "Manage startup listings",
		description: "Validate and moderate startup profiles before publication.",
	},
	{
		href: "/admin/projects",
		title: "Review projects",
		description: "Moderate startup fundraising posts and update status.",
	},
	{
		href: "/admin/mentorship",
		title: "Mentorship oversight",
		description: "Sessions, reports, and mentorship payments.",
	},
	{
		href: "/admin/reports",
		title: "Open platform reports",
		description: "KPI, financial, usage reports and CSV exports.",
	},
	{
		href: "/admin/investments",
		title: "Oversee investments",
		description: "Approve or reject funding requests.",
	},
	{
		href: "/admin/payments",
		title: "Review payments",
		description: "Monitor transactions and platform revenue.",
	},
	{
		href: "/admin/moderation",
		title: "Chat moderation",
		description: "Review flagged messages and suspend offenders.",
	},
	{
		href: "/admin/activity",
		title: "System activity",
		description: "Audit logs, login attempts, and security events.",
	},
	{
		href: "/admin/maintenance",
		title: "Check system maintenance",
		description: "Review backend health and scheduled service status.",
	},
];

const ACTION_PAGE_SIZE = 4;

function formatCardValue(card, stats, loading) {
	if (loading) return "—";
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
				if (!cancelled) setError(ex.message || "Failed to load dashboard");
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const s = stats || {};
	const actionTotalPages = Math.max(1, Math.ceil(ACTION_LINKS.length / ACTION_PAGE_SIZE));
	const visibleActionLinks = ACTION_LINKS.slice(
		actionPage * ACTION_PAGE_SIZE,
		actionPage * ACTION_PAGE_SIZE + ACTION_PAGE_SIZE,
	);

	return (
		<div className="max-w-7xl mx-auto pb-12">
			{error ? (
				<div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-700 text-sm font-medium border border-red-100 shadow-sm">
					{error}
				</div>
			) : null}

			<section className="mb-8 rounded-[32px] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-[0_20px_60px_rgba(15,23,42,0.2)] overflow-hidden">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-8 md:p-10">
					<div>
						<p className="text-sm uppercase tracking-[0.28em] text-slate-300 mb-4">Admin overview</p>
						<h1 className="text-3xl md:text-4xl font-semibold leading-tight">StartupConnect Ethiopia</h1>
						<p className="mt-4 text-slate-300 max-w-2xl text-sm md:text-base leading-7">
							Monitor platform growth, review pending applications, and keep the startup ecosystem running smoothly with one central dashboard.
						</p>
					</div>
					<div className="flex flex-col justify-between gap-4 rounded-[28px] bg-slate-950/80 border border-slate-700 p-6">
						<div>
							<p className="text-xs uppercase tracking-[0.28em] text-slate-400">Current status</p>
							<p className="mt-2 text-lg font-semibold text-white">{dbOk ? "Healthy" : "Attention needed"}</p>
						</div>
						<span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${dbOk ? "bg-emerald-500/15 text-emerald-200" : "bg-amber-500/15 text-amber-200"}`}>
							{dbOk ? "Database connected" : "Database unavailable"}
						</span>
						<div className="rounded-3xl bg-slate-900/90 p-4">
							<p className="text-xs uppercase tracking-[0.28em] text-slate-500">Last updated</p>
							<p className="mt-2 text-base font-semibold text-white">
								{new Date().toLocaleString(undefined, {
									weekday: "short",
									month: "short",
									day: "numeric",
									hour: "numeric",
									minute: "2-digit",
								})}
							</p>
						</div>
					</div>
				</div>
			</section>

			<div className="mb-6">
				<AdminTabs
					tabs={[
						{ id: "system", label: "Statistics overview" },
						{ id: "users", label: "User analytics" },
						{ id: "startups", label: "Startup analytics" },
						{ id: "investments", label: "Investment analytics" },
						{ id: "engagement", label: "Engagement" },
					]}
					active={analyticsTab}
					onChange={setAnalyticsTab}
				/>
				{analyticsTab === "startups" && startupStats?.by_status ? (
					<div className="bg-white rounded-2xl border p-4 flex flex-wrap gap-4">
						{startupStats.by_status.map((r) => (
							<div key={r.status}>
								<span className="text-xs text-slate-500">{r.status}</span>
								<p className="font-bold">{r.count}</p>
							</div>
						))}
					</div>
				) : null}
				{analyticsTab === "investments" && fundingStats ? (
					<div className="bg-white rounded-2xl border p-4 text-sm text-slate-600">
						<p>Total requests: {fundingStats.total_requests ?? fundingStats.total_funding_requests ?? "—"}</p>
						<p>Approved: {fundingStats.approved ?? "—"} · Pending: {fundingStats.pending ?? "—"}</p>
					</div>
				) : null}
				{analyticsTab === "engagement" && engagement ? (
					<div className="bg-white rounded-2xl border p-4 text-sm">
						<p>Active users (recent): {engagement.active_users ?? engagement.total_active ?? "—"}</p>
					</div>
				) : null}
				{analyticsTab === "users" && stats ? (
					<div className="bg-white rounded-2xl border p-4 text-sm grid sm:grid-cols-2 gap-2">
						<p>Total users: {stats.total_users}</p>
						<p>Verified: {stats.total_verified_users}</p>
						<p>Pending approval: {stats.pending_users}</p>
						<p>Active: {stats.active_users}</p>
					</div>
				) : null}
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
				{STAT_CARDS.map((card) => (
					<div
						key={card.label}
						className={`rounded-2xl border border-slate-200 border-l-4 ${card.accent} bg-white shadow-sm p-6`}
					>
						<p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">{card.label}</p>
						<p className="mt-3 text-3xl font-bold text-slate-900">{formatCardValue(card, s, loading)}</p>
					</div>
				))}
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
				{METRIC_CARDS.map((card) => (
					<div
						key={card.label}
						className={`rounded-2xl border border-slate-200 border-l-4 ${card.accent} bg-white shadow-sm p-6`}
					>
						<p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">{card.label}</p>
						<p className="mt-3 text-2xl font-bold text-slate-900">{formatCardValue(card, s, loading)}</p>
					</div>
				))}
			</div>

			<div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.45fr_0.95fr] mb-8">
				<div className="rounded-[32px] bg-white border border-slate-200 shadow-sm p-8">
					<div className="flex items-center justify-between gap-4 mb-8">
						<div>
							<p className="text-xs uppercase tracking-[0.28em] text-slate-400">Platform pulse</p>
							<h2 className="mt-3 text-2xl font-semibold text-slate-900">Approval and interaction overview</h2>
						</div>
						<span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-700">Operational</span>
					</div>

					<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
						<div className="rounded-3xl bg-slate-50 p-6 border border-slate-100">
							<p className="text-sm font-semibold text-slate-900">Pending verifications</p>
							<p className="mt-4 text-4xl font-bold text-slate-900">{loading ? "—" : pendingCount}</p>
							<p className="mt-2 text-sm text-slate-500">Startups, investors and mentors awaiting approval.</p>
						</div>
						<div className="rounded-3xl bg-slate-50 p-6 border border-slate-100">
							<p className="text-sm font-semibold text-slate-900">Active user volume</p>
							<p className="mt-4 text-4xl font-bold text-slate-900">{loading ? "—" : s.active_users ?? 0}</p>
							<p className="mt-2 text-sm text-slate-500">Verified accounts currently active on the platform.</p>
						</div>
						<div className="rounded-3xl bg-slate-50 p-6 border border-slate-100">
							<p className="text-sm font-semibold text-slate-900">Projects listed</p>
							<p className="mt-4 text-4xl font-bold text-slate-900">{loading ? "—" : s.total_projects ?? 0}</p>
							<p className="mt-2 text-sm text-slate-500">Startup initiatives currently available for review.</p>
						</div>
						<div className="rounded-3xl bg-slate-50 p-6 border border-slate-100">
							<p className="text-sm font-semibold text-slate-900">Funding requests</p>
							<p className="mt-4 text-4xl font-bold text-slate-900">{loading ? "—" : s.total_funding_requests ?? 0}</p>
							<p className="mt-2 text-sm text-slate-500">Submitted funding opportunities from startups.</p>
						</div>
					</div>
				</div>

				<div className="rounded-[32px] bg-white border border-slate-200 shadow-sm p-8">
					<div className="flex items-center justify-between gap-4 mb-6">
						<div>
							<p className="text-xs uppercase tracking-[0.28em] text-slate-400">Action center</p>
							<h2 className="mt-3 text-2xl font-semibold text-slate-900">Admin controls</h2>
						</div>
						<span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">Priority</span>
					</div>
					<div className="space-y-4">
						{visibleActionLinks.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className="block rounded-2xl border border-slate-200 px-5 py-4 hover:border-[#006054]/30 hover:bg-[#f0fdf4] transition"
							>
								<p className="font-semibold text-slate-900">{item.title}</p>
								<p className="text-sm text-slate-500 mt-1">{item.description}</p>
							</Link>
						))}
					</div>
					<div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
						<p className="text-xs text-slate-500">
							Page {actionPage + 1} of {actionTotalPages}
						</p>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setActionPage((p) => Math.max(0, p - 1))}
								disabled={actionPage === 0}
								className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
							>
								Previous
							</button>
							<button
								type="button"
								onClick={() => setActionPage((p) => Math.min(actionTotalPages - 1, p + 1))}
								disabled={actionPage >= actionTotalPages - 1}
								className="rounded-lg bg-[#006054] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#004d43] disabled:opacity-40 disabled:cursor-not-allowed"
							>
								Next
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

