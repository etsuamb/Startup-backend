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
import AdminUcCoverage from "@/components/admin/AdminUcCoverage";

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

			<AdminUcCoverage />

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
				{[
					{
						label: "Total users",
						value: s.total_users,
						icon: "👥",
						color: "from-sky-500 to-blue-500",
					},
					{
						label: "Verified startups",
						value: s.total_startups,
						icon: "🚀",
						color: "from-emerald-500 to-teal-500",
					},
					{
						label: "Investors",
						value: s.total_investors,
						icon: "💼",
						color: "from-fuchsia-500 to-violet-500",
					},
					{
						label: "Mentors",
						value: s.total_mentors,
						icon: "🎓",
						color: "from-amber-500 to-orange-500",
					},
				].map((card) => (
					<div key={card.label} className="rounded-[28px] overflow-hidden bg-white shadow-sm border border-slate-200">
						<div className={`bg-gradient-to-r ${card.color} px-6 py-5 text-white`}>
							<div className="flex items-center justify-between gap-4">
								<div>
									<p className="text-xs uppercase tracking-[0.28em] opacity-80">{card.label}</p>
									<p className="mt-3 text-3xl font-semibold">{loading ? "—" : card.value ?? 0}</p>
								</div>
								<div className="text-4xl">{card.icon}</div>
							</div>
						</div>
						<div className="p-5 text-sm text-slate-600">
							<p>Key platform metric for admin review.</p>
						</div>
					</div>
				))}
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
				{[
					{
						label: "Verified users",
						value: s.total_verified_users,
						icon: "✓",
						color: "from-teal-500 to-cyan-500",
					},
					{
						label: "Platform fee revenue",
						value: loading
							? "—"
							: Number(s.revenue_from_platform_fees || 0).toLocaleString(undefined, {
									style: "currency",
									currency: "ETB",
									maximumFractionDigits: 0,
								}),
						icon: "💰",
						color: "from-lime-500 to-green-600",
					},
					{
						label: "Mentorship payments",
						value: s.total_mentorship_transactions,
						icon: "🎓",
						color: "from-pink-500 to-rose-500",
					},
					{
						label: "Investment payments",
						value: s.total_investment_transactions,
						icon: "📈",
						color: "from-indigo-500 to-blue-600",
					},
				].map((card) => (
					<div key={card.label} className="rounded-[28px] overflow-hidden bg-white shadow-sm border border-slate-200">
						<div className={`bg-gradient-to-r ${card.color} px-6 py-5 text-white`}>
							<div className="flex items-center justify-between gap-4">
								<div>
									<p className="text-xs uppercase tracking-[0.28em] opacity-80">{card.label}</p>
									<p className="mt-3 text-2xl font-semibold">{loading ? "—" : card.value ?? 0}</p>
								</div>
								<div className="text-3xl">{card.icon}</div>
							</div>
						</div>
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
						<Link
							href="/admin/users"
							className="block rounded-3xl border border-slate-200 px-5 py-4 hover:border-slate-300 hover:bg-slate-50 transition"
						>
							<p className="font-semibold text-slate-900">Review pending accounts</p>
							<p className="text-sm text-slate-500 mt-1">Approve new users and keep the verification queue moving.</p>
						</Link>
						<Link
							href="/admin/startups"
							className="block rounded-3xl border border-slate-200 px-5 py-4 hover:border-slate-300 hover:bg-slate-50 transition"
						>
							<p className="font-semibold text-slate-900">Manage startup listings</p>
							<p className="text-sm text-slate-500 mt-1">Validate and moderate startup profiles before publication.</p>
						</Link>
						<Link
							href="/admin/projects"
							className="block rounded-3xl border border-slate-200 px-5 py-4 hover:border-slate-300 hover:bg-slate-50 transition"
						>
							<p className="font-semibold text-slate-900">Review projects</p>
							<p className="text-sm text-slate-500 mt-1">Moderate startup fundraising posts and update status.</p>
						</Link>
						<Link
							href="/admin/mentorship"
							className="block rounded-3xl border border-slate-200 px-5 py-4 hover:border-slate-300 hover:bg-slate-50 transition"
						>
							<p className="font-semibold text-slate-900">Mentorship oversight</p>
							<p className="text-sm text-slate-500 mt-1">Sessions, reports, and mentorship payments.</p>
						</Link>
						<Link
							href="/admin/reports"
							className="block rounded-3xl border border-slate-200 px-5 py-4 hover:border-slate-300 hover:bg-slate-50 transition"
						>
							<p className="font-semibold text-slate-900">Open platform reports</p>
							<p className="text-sm text-slate-500 mt-1">KPI, financial, usage reports and CSV exports.</p>
						</Link>
						<Link
							href="/admin/investments"
							className="block rounded-3xl border border-slate-200 px-5 py-4 hover:border-slate-300 hover:bg-slate-50 transition"
						>
							<p className="font-semibold text-slate-900">Oversee investments</p>
							<p className="text-sm text-slate-500 mt-1">Approve or reject funding requests.</p>
						</Link>
						<Link
							href="/admin/payments"
							className="block rounded-3xl border border-slate-200 px-5 py-4 hover:border-slate-300 hover:bg-slate-50 transition"
						>
							<p className="font-semibold text-slate-900">Review payments</p>
							<p className="text-sm text-slate-500 mt-1">Monitor transactions and platform revenue.</p>
						</Link>
						<Link
							href="/admin/moderation"
							className="block rounded-3xl border border-slate-200 px-5 py-4 hover:border-slate-300 hover:bg-slate-50 transition"
						>
							<p className="font-semibold text-slate-900">Chat moderation</p>
							<p className="text-sm text-slate-500 mt-1">Review flagged messages and suspend offenders.</p>
						</Link>
						<Link
							href="/admin/activity"
							className="block rounded-3xl border border-slate-200 px-5 py-4 hover:border-slate-300 hover:bg-slate-50 transition"
						>
							<p className="font-semibold text-slate-900">System activity</p>
							<p className="text-sm text-slate-500 mt-1">Audit logs, login attempts, and security events.</p>
						</Link>
						<Link
							href="/admin/maintenance"
							className="block rounded-3xl border border-slate-200 px-5 py-4 hover:border-slate-300 hover:bg-slate-50 transition"
						>
							<p className="font-semibold text-slate-900">Check system maintenance</p>
							<p className="text-sm text-slate-500 mt-1">Review backend health and scheduled service status.</p>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

