"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchPendingUsers, runPendingUserAutomation } from "@/lib/adminApi";
import AdminAllUsersPanel from "@/components/admin/AdminAllUsersPanel";

const ROLE_STYLES = {
	Startup: "bg-orange-100 text-orange-700 border-orange-200",
	Investor: "bg-blue-100 text-blue-700 border-blue-200",
	Mentor: "bg-rose-100 text-rose-700 border-rose-200",
};

function aiBadge(user) {
	if (
		user.automation_status === "ai_recommends_approval" ||
		user.automation_status === "auto_approved"
	) {
		return "AI says approve";
	}
	if (
		user.automation_status === "ai_recommends_rejection" ||
		user.automation_status === "auto_rejected"
	) {
		return "AI says reject";
	}
	if (user.ai_recommendation === "approve") {
		return "AI says approve";
	}
	if (user.ai_recommendation === "reject") {
		return "AI says reject";
	}
	if (user.automation_status === "rule_recommends_approval") {
		return "Rule says approve";
	}
	if (user.automation_status === "rule_recommends_rejection") {
		return "Rule says reject";
	}
	return null;
}

export default function VerifyUsersPage() {
	const [view, setView] = useState("pending");
	const [users, setUsers] = useState([]);
	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [automationLoading, setAutomationLoading] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const data = await fetchPendingUsers();
			setUsers(data.pending || []);
		} catch (ex) {
			setError(ex.message || "Failed to load pending users");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return users.filter((u) => {
			if (roleFilter !== "all" && u.role !== roleFilter) return false;
			if (!q) return true;
			const name = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
			return name.includes(q) || (u.email || "").toLowerCase().includes(q);
		});
	}, [users, search, roleFilter]);

	const aiStats = useMemo(() => {
		return users.reduce(
			(acc, user) => {
				const badge = aiBadge(user);
				if (badge === "AI says approve") acc.approve += 1;
				else if (badge === "AI says reject") acc.reject += 1;
				else acc.notReviewed += 1;
				return acc;
			},
			{ approve: 0, reject: 0, notReviewed: 0 },
		);
	}, [users]);

	return (
		<div className="max-w-7xl mx-auto pb-12">
			<section className="mb-8 rounded-2xl bg-[#0a4d3c] text-white p-8 border border-[#07382b]/20 shadow-sm">
				<h1 className="text-3xl md:text-4xl font-bold mb-2">User management</h1>
				<p className="text-white/80 max-w-2xl">
					Review pending registrations or search all platform users. Open a user to review their profile, documents, and approve or reject.
				</p>
			</section>

			<div className="flex flex-wrap gap-2 mb-8">
				<button
					type="button"
					onClick={() => setView("pending")}
					className={`px-4 py-2 rounded-full text-xs font-bold border transition ${
						view === "pending" ? "bg-[#0a4d3c] text-white border-[#0a4d3c]" : "bg-white text-gray-600 border-gray-200"
					}`}
				>
					Pending verification
				</button>
				<button
					type="button"
					onClick={() => setView("all")}
					className={`px-4 py-2 rounded-full text-xs font-bold border transition ${
						view === "all" ? "bg-[#0a4d3c] text-white border-[#0a4d3c]" : "bg-white text-gray-600 border-gray-200"
					}`}
				>
					All users
				</button>
			</div>

			{view === "all" ? <AdminAllUsersPanel /> : null}

			{view === "pending" ? (
				<>
					{error ? (
						<div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-700 text-sm font-medium border border-red-100">
							{error}
						</div>
					) : null}

					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
						<div className="flex flex-wrap gap-2">
				<button
					type="button"
					onClick={async () => {
						setAutomationLoading(true);
						setError("");
						try {
							await runPendingUserAutomation();
							await load();
						} catch (ex) {
							setError(ex.message || "Failed to apply AI automation");
						} finally {
							setAutomationLoading(false);
						}
					}}
					disabled={automationLoading}
					className={`px-4 py-2 rounded-full text-xs font-bold border transition ${
						automationLoading
							? "bg-slate-200 text-slate-500 border-slate-200"
							: "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
						}`}
				>
					{automationLoading ? "Applying AI automation…" : "Apply AI automation to pending users"}
				</button>
						</div>

						<div className="flex flex-col sm:flex-row sm:items-center gap-3">
							<input
								type="search"
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder="Search pending users"
								className="w-full sm:w-72 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 outline-none focus:border-[#0a4d3c] focus:ring-2 focus:ring-[#0a4d3c]/10"
							/>
							<p className="text-xs font-semibold text-slate-500 whitespace-nowrap">
								{filtered.length} of {users.length} users
							</p>
						</div>
					</div>

					<div className="flex flex-wrap gap-2 mb-8">
						{["all", "Startup", "Investor", "Mentor"].map((r) => (
							<button
								key={r}
								type="button"
								onClick={() => setRoleFilter(r)}
								className={`px-4 py-2 rounded-full text-xs font-bold border transition ${
									roleFilter === r
										? "bg-[#0a4d3c] text-white border-[#0a4d3c] shadow-md"
										: "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
								}`}
							>
								{r === "all" ? "All Roles" : r} ({users.filter((u) => roleFilter === "all" || u.role === r).length})
							</button>
						))}
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
						<div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
							<p className="text-[10px] font-bold uppercase text-emerald-600">AI says approve</p>
							<p className="text-2xl font-black text-emerald-800 mt-1">{aiStats.approve}</p>
						</div>
						<div className="rounded-2xl border border-red-100 bg-red-50 p-4">
							<p className="text-[10px] font-bold uppercase text-red-600">AI says reject</p>
							<p className="text-2xl font-black text-red-800 mt-1">{aiStats.reject}</p>
						</div>
						<div className="rounded-2xl border border-slate-100 bg-white p-4">
							<p className="text-[10px] font-bold uppercase text-slate-500">Not AI reviewed</p>
							<p className="text-2xl font-black text-slate-800 mt-1">{aiStats.notReviewed}</p>
						</div>
					</div>

					{loading ? (
						<div className="text-center py-12">
							<p className="text-slate-500 text-sm">Loading pending users…</p>
						</div>
					) : filtered.length === 0 ? (
						<div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm">
							<p className="text-slate-600 font-medium text-lg">No pending users match your filters.</p>
							<p className="text-slate-500 text-sm mt-2">All users have been reviewed or no users are waiting for verification.</p>
						</div>
					) : (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{filtered.map((u) => (
								<div
									key={u.user_id}
									className="bg-white rounded-[28px] p-6 border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden"
								>
									<div className="flex items-start justify-between gap-4 mb-4">
										<div className="flex items-center gap-4">
											<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-sm font-black text-slate-600">
												{String(u.role || "User").slice(0, 2).toUpperCase()}
											</div>
											<div>
												<h3 className="font-bold text-slate-900 text-lg">
													{u.first_name} {u.last_name}
												</h3>
												<p className="text-sm text-slate-500">{u.email}</p>
												{aiBadge(u) ? (
													<span className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold ${
														aiBadge(u) === "AI says approve" || aiBadge(u) === "Rule says approve"
															? "bg-emerald-50 text-emerald-700"
															: aiBadge(u) === "AI says reject" || aiBadge(u) === "Rule says reject"
																? "bg-red-50 text-red-700"
																: "bg-slate-100 text-slate-600"
													}`}>
														{aiBadge(u)}{u.automation_score != null ? ` · score ${u.automation_score}` : ""}
													</span>
												) : (
													<span className="inline-flex mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
														Not AI reviewed
													</span>
												)}
											</div>
										</div>
										<div
											className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
												ROLE_STYLES[u.role] || "bg-slate-100 text-slate-600 border-slate-200"
											}`}
										>
											{u.role}
										</div>
									</div>

									<div className="text-xs text-slate-500 mb-6 px-0.5">
										Applied {u.created_at ? new Date(u.created_at).toLocaleDateString() : "date unknown"}
									</div>

									<Link
										href={`/admin/users/${u.user_id}`}
										className="block w-full py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 text-emerald-800 font-bold text-sm hover:bg-emerald-50 transition text-center"
									>
										View details
									</Link>
								</div>
							))}
						</div>
					)}
				</>
			) : null}
		</div>
	);
}
