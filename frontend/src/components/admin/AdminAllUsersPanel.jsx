"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
	deleteUser,
	fetchUser,
	fetchUserAuditLogs,
	searchUsers,
	updateUserStatus,
} from "@/lib/adminApi";
import { formatFieldValue, profileFieldMap } from "@/lib/adminDisplay";
import AdminActionModal from "@/components/admin/AdminActionModal";

function accountStatus(user) {
	if (user.rejected_at || !user.is_active) return "rejected";
	if (user.is_approved) return "approved";
	return "pending";
}

function statusBadge(user) {
	const status = accountStatus(user);
	if (status === "approved") {
		return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Approved</span>;
	}
	if (status === "rejected") {
		return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Rejected</span>;
	}
	return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Pending approval</span>;
}

function ProfileDetails({ profile, role }) {
	if (!profile) {
		return <p className="text-sm text-slate-500">No profile record for this role.</p>;
	}
	const fields = profileFieldMap[role] || [];
	return (
		<div className="grid gap-2 sm:grid-cols-2 max-h-56 overflow-y-auto">
			{fields.slice(0, 12).map(([key, label]) => (
				<div key={key} className="rounded-lg bg-slate-50 p-2 border border-slate-100">
					<p className="text-[10px] uppercase text-slate-400 font-semibold">{label}</p>
					<p className="text-xs text-slate-800 mt-0.5">{formatFieldValue(profile[key])}</p>
				</div>
			))}
		</div>
	);
}

export default function AdminAllUsersPanel() {
	const [users, setUsers] = useState([]);
	const [q, setQ] = useState("");
	const [role, setRole] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [selectedId, setSelectedId] = useState(null);
	const [detail, setDetail] = useState(null);
	const [auditLogs, setAuditLogs] = useState([]);
	const [actionLoading, setActionLoading] = useState(false);
	const [actionModal, setActionModal] = useState(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const data = await searchUsers({ q: q.trim() || undefined, role: role || undefined, limit: 100 });
			setUsers(data.users || []);
		} catch (ex) {
			setError(ex.message || "Failed to load users");
		} finally {
			setLoading(false);
		}
	}, [q, role]);

	useEffect(() => {
		const t = setTimeout(load, 300);
		return () => clearTimeout(t);
	}, [load]);

	async function openDetail(userId) {
		setSelectedId(userId);
		setDetail(null);
		setAuditLogs([]);
		setError("");
		try {
			const [data, audit] = await Promise.all([
				fetchUser(userId),
				fetchUserAuditLogs(userId, { limit: 30 }),
			]);
			setDetail(data);
			setAuditLogs(audit.logs || []);
		} catch (ex) {
			setError(ex.message || "Failed to load user");
		}
	}

	async function runAction(fn, { clearSelection = false } = {}) {
		if (!selectedId) return;
		setActionLoading(true);
		setError("");
		try {
			await fn();
			await load();
			if (clearSelection) {
				setSelectedId(null);
				setDetail(null);
				setAuditLogs([]);
			} else {
				await openDetail(selectedId);
			}
		} catch (ex) {
			setError(ex.message || "Action failed");
		} finally {
			setActionLoading(false);
		}
	}

	function changeStatus(status) {
		if (!selectedId || status === accountStatus(detail?.user || {})) return;
		if (status === "rejected") {
			setActionModal({ type: "reject" });
			return;
		}
		runAction(() => updateUserStatus(selectedId, status));
	}

	return (
		<div className="space-y-6">
			{actionModal?.type === "reject" ? (
				<AdminActionModal
					open
					title="Reject account?"
					message="The user will lose access and their profile will be removed from public directories."
					confirmLabel="Reject account"
					variant="prompt"
					inputLabel="Reason"
					inputType="textarea"
					placeholder="Explain why this account is being rejected"
					isDangerous
					isLoading={actionLoading}
					onCancel={() => setActionModal(null)}
					onConfirm={(reason) => {
						setActionModal(null);
						runAction(() => updateUserStatus(selectedId, "rejected", reason));
					}}
				/>
			) : null}
			{actionModal?.type === "delete" ? (
				<AdminActionModal
					open
					title="Permanently delete user?"
					message="This permanently removes the user and related account data. This action cannot be undone. Type DELETE to continue."
					confirmLabel="Delete permanently"
					variant="prompt"
					inputLabel="Confirmation"
					placeholder="DELETE"
					isDangerous
					isLoading={actionLoading}
					onCancel={() => setActionModal(null)}
					onConfirm={(value) => {
						if (String(value || "").trim() !== "DELETE") {
							setError("Type DELETE exactly to permanently delete this user.");
							return;
						}
						setActionModal(null);
						runAction(() => deleteUser(selectedId, { hard: true }), { clearSelection: true });
					}}
				/>
			) : null}
			<div className="flex flex-col md:flex-row gap-4">
				<input
					type="search"
					placeholder="Search name or email…"
					value={q}
					onChange={(e) => setQ(e.target.value)}
					className="flex-1 px-4 py-3 border border-slate-200 rounded-2xl text-sm"
				/>
				<select
					value={role}
					onChange={(e) => setRole(e.target.value)}
					className="px-4 py-3 border border-slate-200 rounded-2xl text-sm bg-white"
				>
					<option value="">All roles</option>
					<option value="Startup">Startup</option>
					<option value="Investor">Investor</option>
					<option value="Mentor">Mentor</option>
					<option value="Admin">Admin</option>
				</select>
			</div>

			{error ? (
				<div className="p-4 rounded-2xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
			) : null}

			<div className="grid lg:grid-cols-2 gap-6">
				<div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
					{loading ? (
						<p className="p-6 text-sm text-slate-500">Loading users…</p>
					) : users.length === 0 ? (
						<p className="p-6 text-sm text-slate-500">No users found.</p>
					) : (
						<ul className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
							{users.map((u) => (
								<li key={u.user_id}>
									<button
										type="button"
										onClick={() => openDetail(u.user_id)}
										className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition ${
											selectedId === u.user_id ? "bg-emerald-50" : ""
										}`}
									>
										<div className="flex items-center justify-between gap-2">
											<div>
												<p className="font-semibold text-slate-900 text-sm">
													{u.first_name} {u.last_name}
												</p>
												<p className="text-xs text-slate-500">{u.email}</p>
											</div>
											<div className="text-right shrink-0">
												<p className="text-[10px] font-bold text-slate-400 uppercase">{u.role}</p>
												{statusBadge(u)}
											</div>
										</div>
									</button>
								</li>
							))}
						</ul>
					)}
				</div>

				<div className="bg-white rounded-2xl border border-slate-100 p-6 min-h-[320px]">
					{!selectedId ? (
						<p className="text-sm text-slate-500">Select a user to review profile and manage account.</p>
					) : !detail ? (
						<p className="text-sm text-slate-500">Loading profile…</p>
					) : (
						<div className="space-y-4">
							<div>
								<h3 className="text-lg font-bold text-slate-900">
									{detail.user.first_name} {detail.user.last_name}
								</h3>
								<p className="text-sm text-slate-600">{detail.user.email}</p>
								<p className="text-xs text-slate-400 mt-1">
									{detail.user.role} · ID {detail.user.user_id}
									{detail.user.phone_number ? ` · ${detail.user.phone_number}` : ""}
								</p>
								<div className="mt-2">{statusBadge(detail.user)}</div>
							</div>

							<div>
								<p className="text-xs font-bold text-slate-500 uppercase mb-2">Profile</p>
								<ProfileDetails profile={detail.profile} role={detail.user.role} />
							</div>

							<div className="flex flex-wrap gap-2">
								{detail.user.role !== "Admin" ? (
									<label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
										Status
										<select
											value={accountStatus(detail.user)}
											onChange={(event) => changeStatus(event.target.value)}
											disabled={actionLoading}
											className="bg-transparent text-xs font-bold text-slate-800 outline-none disabled:opacity-50"
										>
											<option value="pending">Pending approval</option>
											<option value="approved">Approved</option>
											<option value="rejected">Rejected</option>
										</select>
									</label>
								) : null}
								<Link
									href={`/admin/users/${detail.user.user_id}`}
									className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
								>
									Full page view
								</Link>
								<button
									type="button"
									disabled={actionLoading}
									onClick={() => setActionModal({ type: "delete" })}
									className="px-3 py-2 rounded-xl border border-red-200 bg-white text-red-700 text-xs font-bold hover:bg-red-50 disabled:opacity-50"
								>
									Delete user
								</button>
							</div>

							{auditLogs.length > 0 ? (
								<div className="rounded-xl border border-slate-100 p-3 max-h-36 overflow-y-auto">
									<p className="text-xs font-bold text-slate-500 uppercase mb-2">User activity audit</p>
									<ul className="text-xs text-slate-600 space-y-1">
										{auditLogs.map((log) => (
											<li key={log.audit_log_id}>
												<span className="font-semibold">{log.action?.replace(/_/g, " ")}</span> ·{" "}
												{log.created_at ? new Date(log.created_at).toLocaleString() : ""}
											</li>
										))}
									</ul>
								</div>
							) : null}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
