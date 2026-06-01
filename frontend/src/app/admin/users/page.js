"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchPendingUsers } from "@/lib/adminApi";
import AdminAllUsersPanel from "@/components/admin/AdminAllUsersPanel";

const ROLE_STYLES = {
	Startup: "bg-orange-100 text-orange-700 border-orange-200",
	Investor: "bg-blue-100 text-blue-700 border-blue-200",
	Mentor: "bg-rose-100 text-rose-700 border-rose-200",
};

export default function VerifyUsersPage() {
	const [view, setView] = useState("pending");
	const [users, setUsers] = useState([]);
	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

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

	return (
		<div className="max-w-7xl mx-auto pb-12">
			<section className="mb-8 rounded-[32px] bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 shadow-lg">
				<h1 className="text-3xl md:text-4xl font-bold mb-2">User management</h1>
				<p className="text-slate-300 max-w-2xl">
					Review pending registrations or search all platform users. Open a user to review their profile, documents, and approve or reject.
				</p>
			</section>

			<div className="flex flex-wrap gap-2 mb-8">
				<button
					type="button"
					onClick={() => setView("pending")}
					className={`px-4 py-2 rounded-full text-xs font-bold border transition ${
						view === "pending" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200"
					}`}
				>
					Pending verification
				</button>
				<button
					type="button"
					onClick={() => setView("all")}
					className={`px-4 py-2 rounded-full text-xs font-bold border transition ${
						view === "all" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200"
					}`}
				>
					All users
				</button>
			</div>

			{view === "all" ? <AdminAllUsersPanel /> : null}

			{view === "pending" && error ? (
				<div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-700 text-sm font-medium border border-red-100">
					{error}
				</div>
			) : null}

			{view === "pending" ? (
				<>
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
						<div className="relative flex-1 md:max-w-md">
							<svg className="absolute left-4 top-3 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
							<input
								type="text"
								placeholder="Search by name or email..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="w-full pl-12 pr-4 py-3 border border-slate-200 bg-white rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
							/>
						</div>
						<div className="text-sm text-slate-600 font-medium">
							{filtered.length} of {users.length} users
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
										? "bg-emerald-600 text-white border-emerald-600 shadow-md"
										: "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
								}`}
							>
								{r === "all" ? "All Roles" : r} ({users.filter((u) => roleFilter === "all" || u.role === r).length})
							</button>
						))}
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
