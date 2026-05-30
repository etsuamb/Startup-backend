"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
	fetchDashboardInvestor,
	fetchDashboardMentor,
	fetchDashboardStartup,
	updateInvestorApproval,
	updateMentorApproval,
	updateStartupListing,
	updateStartupStatus,
} from "@/lib/adminApi";
import { formatFieldValue, profileFieldMap } from "@/lib/adminDisplay";

const STARTUP_STATUSES = ["Pending", "Active", "Funded", "Closed"];

const STATUS_STYLE = {
	Pending: "bg-amber-50 text-amber-800 ring-amber-200/80",
	Active: "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
	Funded: "bg-sky-50 text-sky-800 ring-sky-200/80",
	Closed: "bg-slate-100 text-slate-600 ring-slate-200/80",
};

const ROLE_LABEL = {
	startup: "Startup",
	mentor: "Mentor",
	investor: "Investor",
};

function ListedBadge({ listed }) {
	return listed ? (
		<span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200/80">
			<span className="h-2 w-2 rounded-full bg-emerald-500" />
			Listed
		</span>
	) : (
		<span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200/80">
			<span className="h-2 w-2 rounded-full bg-slate-400" />
			Hidden
		</span>
	);
}

function DetailRow({ label, value }) {
	return (
		<div className="py-2.5 border-b border-slate-100 last:border-0">
			<dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
			<dd className="mt-1 text-sm text-slate-900 break-words">{formatFieldValue(value)}</dd>
		</div>
	);
}

export default function AdminDirectoryDetailsModal({ row, onClose, onUpdated }) {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [detail, setDetail] = useState(null);
	const [note, setNote] = useState("");
	const [listed, setListed] = useState(false);
	const [startupStatus, setStartupStatus] = useState("Pending");

	const loadDetail = useCallback(async () => {
		if (!row) return;
		setLoading(true);
		setError("");
		try {
			if (row.kind === "startup") {
				const data = await fetchDashboardStartup(row.id);
				const s = data.startup || {};
				setDetail({ ...data, profile: s });
				setListed(Boolean(s.is_listed));
				setStartupStatus(s.status || s.admin_status || "Pending");
			} else if (row.kind === "mentor") {
				const data = await fetchDashboardMentor(row.id);
				const m = data.mentor || {};
				setDetail({ ...data, profile: m });
				setListed(Boolean(m.is_approved));
			} else {
				const data = await fetchDashboardInvestor(row.id);
				const i = data.investor || {};
				setDetail({ ...data, profile: i });
				setListed(Boolean(i.is_approved));
			}
		} catch (ex) {
			setError(ex.message || "Failed to load profile");
		} finally {
			setLoading(false);
		}
	}, [row]);

	useEffect(() => {
		loadDetail();
	}, [loadDetail]);

	const profile = detail?.profile || {};
	const roleKey = ROLE_LABEL[row?.kind] || "Startup";
	const fieldMap = profileFieldMap[roleKey] || [];

	const displayName = useMemo(() => {
		if (row?.kind === "startup") return profile.startup_name || row?.name;
		if (row?.kind === "investor") {
			return profile.organization_name || [profile.first_name, profile.last_name].filter(Boolean).join(" ");
		}
		return profile.professional_title || profile.headline || row?.name;
	}, [row, profile]);

	const focusArea = useMemo(() => {
		if (row?.kind === "startup") return profile.industry;
		if (row?.kind === "mentor") return profile.expertise || profile.primary_industry;
		return profile.preferred_industry;
	}, [row, profile]);

	const memberName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "—";
	const email = profile.email || profile.owner_email || "—";

	const accountReady =
		row?.kind === "startup"
			? Boolean(profile.is_approved) && profile.is_active !== false
			: Boolean(profile.user_approved) && profile.is_active !== false;

	async function saveVisibility(nextListed) {
		if (!row || !accountReady) return;
		setSaving(true);
		setError("");
		try {
			if (row.kind === "startup") {
				await updateStartupListing(row.id, nextListed, note);
			} else if (row.kind === "mentor") {
				await updateMentorApproval(row.id, nextListed, note);
			} else {
				await updateInvestorApproval(row.id, nextListed, note);
			}
			setListed(nextListed);
			setNote("");
			await loadDetail();
			onUpdated?.();
		} catch (ex) {
			setError(ex.message || "Could not update visibility");
		} finally {
			setSaving(false);
		}
	}

	async function saveStartupStatus(nextStatus) {
		if (!row || row.kind !== "startup" || !accountReady) return;
		setSaving(true);
		setError("");
		try {
			await updateStartupStatus(row.id, nextStatus, note);
			setStartupStatus(nextStatus);
			setListed(nextStatus === "Active" || nextStatus === "Funded");
			setNote("");
			await loadDetail();
			onUpdated?.();
		} catch (ex) {
			setError(ex.message || "Could not update status");
		} finally {
			setSaving(false);
		}
	}

	if (!row) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
			<div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-200 flex flex-col">
				<div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 bg-slate-50/80">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 capitalize">
							{row.kind} profile
						</p>
						<h2 className="text-xl font-bold text-slate-900 mt-1">{displayName || "Profile details"}</h2>
						<p className="text-sm text-slate-500 mt-0.5">{memberName} · {email}</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-white"
					>
						Close
					</button>
				</div>

				<div className="flex-1 overflow-y-auto px-6 py-5">
					{error ? (
						<div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
							{error}
						</div>
					) : null}

					{loading ? (
						<p className="py-12 text-center text-sm text-slate-500">Loading profile…</p>
					) : (
						<>
							<section className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="rounded-xl border border-slate-200 bg-white p-4">
									<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actor type</p>
									<p className="mt-1 text-sm font-semibold text-slate-900 capitalize">{row.kind}</p>
								</div>
								<div className="rounded-xl border border-slate-200 bg-white p-4">
									<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Focus area</p>
									<p className="mt-1 text-sm font-semibold text-slate-900">{formatFieldValue(focusArea)}</p>
								</div>
								<div className="rounded-xl border border-slate-200 bg-white p-4">
									<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visibility</p>
									<div className="mt-2">
										<ListedBadge listed={listed} />
									</div>
								</div>
								{row.kind === "startup" ? (
									<div className="rounded-xl border border-slate-200 bg-white p-4">
										<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
											Operational status
										</p>
										<span
											className={`mt-2 inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
												STATUS_STYLE[startupStatus] || STATUS_STYLE.Pending
											}`}
										>
											{startupStatus}
										</span>
									</div>
								) : null}
							</section>

							<section className="mb-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
								<h3 className="text-sm font-semibold text-slate-900 mb-3">Account</h3>
								<dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
									<DetailRow label="Member name" value={memberName} />
									<DetailRow label="Email" value={email} />
									<DetailRow label="Phone" value={profile.phone_number} />
									{row.kind === "investor" ? (
										<DetailRow label="Investor type" value={profile.investor_type} />
									) : null}
									{row.kind === "mentor" ? (
										<DetailRow label="Professional title" value={profile.professional_title} />
									) : null}
									{row.kind === "startup" ? (
										<DetailRow label="Business stage" value={profile.business_stage} />
									) : null}
								</dl>
							</section>

							<section className="mb-6 rounded-xl border border-slate-200 p-4">
								<h3 className="text-sm font-semibold text-slate-900 mb-3">Full profile</h3>
								<dl>
									{fieldMap.map(([key, label]) => (
										<DetailRow key={key} label={label} value={profile[key]} />
									))}
								</dl>
							</section>

							{row.kind === "startup" && detail?.projects?.length ? (
								<section className="mb-6 rounded-xl border border-slate-200 p-4">
									<h3 className="text-sm font-semibold text-slate-900 mb-2">
										Projects ({detail.projects.length})
									</h3>
									<ul className="space-y-2 text-sm text-slate-700">
										{detail.projects.slice(0, 5).map((p) => (
											<li key={p.project_id} className="flex justify-between gap-2 border-b border-slate-100 pb-2 last:border-0">
												<span className="font-medium truncate">{p.project_title}</span>
												<span className="text-xs text-slate-500 shrink-0">{p.status}</span>
											</li>
										))}
									</ul>
								</section>
							) : null}

							<section className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
								<h3 className="text-sm font-semibold text-slate-900 mb-3">Directory controls</h3>
								{!accountReady ? (
									<p className="text-sm text-amber-800">
										This account is not fully approved or is inactive. Approve the user on the Users page before listing publicly.
									</p>
								) : (
									<div className="space-y-4">
										<div>
											<label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
												Public visibility
											</label>
											<div className="flex flex-wrap gap-2">
												<button
													type="button"
													disabled={saving || listed}
													onClick={() => saveVisibility(true)}
													className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
												>
													List publicly
												</button>
												<button
													type="button"
													disabled={saving || !listed}
													onClick={() => saveVisibility(false)}
													className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
												>
													Hide from directory
												</button>
											</div>
										</div>

										{row.kind === "startup" ? (
											<div>
												<label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
													Operational status
												</label>
												<select
													value={startupStatus}
													disabled={saving}
													onChange={(e) => {
														const next = e.target.value;
														if (next !== startupStatus) saveStartupStatus(next);
													}}
													className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"
												>
													{STARTUP_STATUSES.map((st) => (
														<option key={st} value={st}>
															{st}
														</option>
													))}
												</select>
												<p className="mt-1.5 text-xs text-slate-500">
													Active and Funded statuses also list the startup in discover.
												</p>
											</div>
										) : null}

										<div>
											<label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
												Note (optional)
											</label>
											<input
												type="text"
												value={note}
												onChange={(e) => setNote(e.target.value)}
												placeholder="Reason or comment sent to the user"
												className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
											/>
										</div>
									</div>
								)}
							</section>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
