"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
	deleteUser,
	fetchUser,
	fetchUserAuditLogs,
	restoreUser,
	runExistingUserAutomation,
	runUserAutomation,
	searchUsers,
	unsuspendUser,
} from "@/lib/adminApi";
import { formatFieldValue, profileFieldMap } from "@/lib/adminDisplay";
import AdminActionModal from "@/components/admin/AdminActionModal";

function statusBadge(user) {
	if (!user.is_active) {
		return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Suspended</span>;
	}
	if (user.is_approved) {
		return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Approved</span>;
	}
	if (user.automation_status === "ai_recommends_approval" || user.automation_status === "auto_approved") {
		return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">AI says approve{user.automation_score != null ? ` ${user.automation_score}` : ""}</span>;
	}
	if (user.automation_status === "ai_recommends_rejection" || user.automation_status === "auto_rejected") {
		return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700">AI says reject{user.automation_score != null ? ` ${user.automation_score}` : ""}</span>;
	}
	if (user.automation_status === "rule_recommends_approval") {
		return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">Rule says approve{user.automation_score != null ? ` ${user.automation_score}` : ""}</span>;
	}
	if (user.automation_status === "rule_recommends_rejection") {
		return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700">Rule says reject{user.automation_score != null ? ` ${user.automation_score}` : ""}</span>;
	}
	return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Pending</span>;
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

function AutomationReview({ user }) {
	if (!user?.automation_status && !user?.ai_review) return null;
	const ai = user.ai_review || {};
	const concerns = Array.isArray(ai.concerns) ? ai.concerns : [];
	const positives = Array.isArray(ai.positive_signals) ? ai.positive_signals : [];
	return (
		<div className="rounded-xl border border-slate-100 p-3 bg-slate-50/60">
			<p className="text-xs font-bold text-slate-500 uppercase mb-2">Automation review</p>
			<div className="grid grid-cols-2 gap-2 mb-3">
				<div className="rounded-lg bg-white p-2 border border-slate-100">
					<p className="text-[10px] uppercase text-slate-400 font-semibold">Decision</p>
					<p className="text-xs font-bold text-slate-800">{user.automation_status || "Not run"}</p>
				</div>
				<div className="rounded-lg bg-white p-2 border border-slate-100">
					<p className="text-[10px] uppercase text-slate-400 font-semibold">Score</p>
					<p className="text-xs font-bold text-slate-800">{user.automation_score ?? "N/A"}</p>
				</div>
				<div className="rounded-lg bg-white p-2 border border-slate-100">
					<p className="text-[10px] uppercase text-slate-400 font-semibold">AI recommendation</p>
					<p className="text-xs font-bold text-slate-800">{user.ai_recommendation || ai.recommendation || "N/A"}</p>
				</div>
				<div className="rounded-lg bg-white p-2 border border-slate-100">
					<p className="text-[10px] uppercase text-slate-400 font-semibold">AI risk</p>
					<p className="text-xs font-bold text-slate-800">{user.ai_risk_level || ai.risk_level || "N/A"}</p>
				</div>
			</div>
			{ai.summary ? <p className="text-xs text-slate-700 mb-2">{ai.summary}</p> : null}
			{concerns.length ? (
				<p className="text-xs text-red-700 mb-1">
					<span className="font-bold">Concerns:</span> {concerns.join("; ")}
				</p>
			) : null}
			{positives.length ? (
				<p className="text-xs text-emerald-700">
					<span className="font-bold">Positive signals:</span> {positives.join("; ")}
				</p>
			) : null}
			{user.rejection_reason ? (
				<p className="text-xs text-red-700 mt-2">
					<span className="font-bold">Rejection reason:</span> {user.rejection_reason}
				</p>
			) : null}
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
	const [reviewLoading, setReviewLoading] = useState(false);
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

	async function runAction(fn) {
		if (!selectedId) return;
		setActionLoading(true);
		setError("");
		try {
			await fn();
			await load();
			await openDetail(selectedId);
		} catch (ex) {
			setError(ex.message || "Action failed");
		} finally {
			setActionLoading(false);
		}
	}

	async function reviewSelectedUser() {
		if (!selectedId) return;
		setReviewLoading(true);
		setError("");
		try {
			await runUserAutomation(selectedId, { reviewOnly: true });
			await load();
			await openDetail(selectedId);
		} catch (ex) {
			setError(ex.message || "AI review failed");
		} finally {
			setReviewLoading(false);
		}
	}

	async function reviewExistingUsers() {
		setReviewLoading(true);
		setError("");
		try {
			await runExistingUserAutomation({
				includeApproved: true,
				onlyWithoutReview: false,
				role: ["Startup", "Investor", "Mentor"].includes(role) ? role : undefined,
				limit: 100,
			});
			await load();
			if (selectedId) await openDetail(selectedId);
		} catch (ex) {
			setError(ex.message || "Failed to review existing users");
		} finally {
			setReviewLoading(false);
		}
	}

	return (
		<div className="space-y-6">
			{actionModal?.type === "deactivate" ? (
				<AdminActionModal
					open
					title="Deactivate account?"
					message="This user will be deactivated and lose access until restored."
					confirmLabel="Deactivate"
					isDangerous
					isLoading={actionLoading}
					onCancel={() => setActionModal(null)}
					onConfirm={() => {
						setActionModal(null);
						runAction(() => deleteUser(selectedId, { hard: false }));
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
				<button
					type="button"
					disabled={reviewLoading}
					onClick={reviewExistingUsers}
					className="px-4 py-3 rounded-2xl bg-[#0a4d3c] text-white text-sm font-bold hover:bg-[#083f31] disabled:opacity-50"
				>
					{reviewLoading ? "Reviewing..." : "AI review existing users"}
				</button>
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

							<AutomationReview user={detail.user} />

							<div className="flex flex-wrap gap-2">
								<Link
									href={`/admin/users/${detail.user.user_id}`}
									className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
								>
									Full page view
								</Link>
								<button
									type="button"
									disabled={reviewLoading}
									onClick={reviewSelectedUser}
									className="px-3 py-2 rounded-xl bg-[#0a4d3c] text-white text-xs font-bold hover:bg-[#083f31] disabled:opacity-50"
								>
									{reviewLoading ? "Reviewing..." : "Run AI review"}
								</button>
								{!detail.user.is_active ? (
									<>
										<button
											type="button"
											disabled={actionLoading}
											onClick={() => runAction(() => unsuspendUser(selectedId))}
											className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
										>
											Unsuspend
										</button>
										<button
											type="button"
											disabled={actionLoading}
											onClick={() => runAction(() => restoreUser(selectedId))}
											className="px-3 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 disabled:opacity-50"
										>
											Restore
										</button>
									</>
								) : null}
								<button
									type="button"
									disabled={actionLoading}
									onClick={() => setActionModal({ type: "deactivate" })}
									className="px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50"
								>
									Deactivate
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
