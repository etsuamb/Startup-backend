"use client";

import { useCallback, useEffect, useState } from "react";
import {
	createInvestmentDispute,
	fetchInvestment,
	fetchInvestmentDisputes,
	fetchInvestmentRequest,
	fetchInvestmentRequests,
	fetchInvestments,
	resolveInvestmentDispute,
	updateInvestmentRequestStatus,
	verifyInvestment,
	verifyInvestmentRequest,
} from "@/lib/adminApi";
import AdminTabs from "@/components/admin/AdminTabs";

const STATUSES = ["pending", "approved", "rejected", "withdrawn"];

function DetailRow({ label, value }) {
	return (
		<div className="flex justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
			<dt className="text-slate-500 shrink-0">{label}</dt>
			<dd className="text-right font-medium text-slate-900 break-words">{value ?? "—"}</dd>
		</div>
	);
}

function InvestmentDetailModal({ type, id, initialRecord, onClose, onUpdated }) {
	const [loading, setLoading] = useState(true);
	const [record, setRecord] = useState(null);
	const [error, setError] = useState("");
	const [msg, setMsg] = useState("");
	const [busy, setBusy] = useState(false);
	const [comment, setComment] = useState("");
	const [disputeReason, setDisputeReason] = useState("");
	const [resolutionNotes, setResolutionNotes] = useState("");

	const load = useCallback(async () => {
		if (!id) return;
		setLoading(true);
		setError("");
		try {
			if (type === "request") {
				const data = await fetchInvestmentRequest(id);
				setRecord(data.investment_request);
			} else if (type === "investment") {
				const data = await fetchInvestment(id);
				setRecord(data.investment);
			} else if (type === "dispute") {
				setRecord(initialRecord || null);
			} else {
				setRecord(null);
			}
		} catch (ex) {
			setError(ex.message || "Failed to load details");
		} finally {
			setLoading(false);
		}
	}, [type, id, initialRecord]);

	useEffect(() => {
		queueMicrotask(load);
	}, [load]);

	async function run(fn) {
		setBusy(true);
		setError("");
		setMsg("");
		try {
			await fn();
			setMsg("Saved");
			await load();
			onUpdated?.();
		} catch (ex) {
			setError(ex.message || "Action failed");
		} finally {
			setBusy(false);
		}
	}

	if (!id) return null;
	const r = record;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="bg-white rounded-2xl max-w-lg w-full border shadow-xl max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-start px-6 py-5 border-b border-slate-100">
					<div>
						<p className="text-xs font-semibold uppercase text-emerald-700">
							{type === "request" ? "Funding request" : type === "investment" ? "Investment" : "Dispute"}
						</p>
						<h2 className="text-lg font-bold text-slate-900 mt-1">#{id}</h2>
					</div>
					<button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
						×
					</button>
				</div>

				<div className="px-6 py-5">
					{error ? <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm p-3">{error}</div> : null}
					{msg ? <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-800 text-sm p-3">{msg}</div> : null}

					{loading ? (
						<p className="py-8 text-center text-sm text-slate-500">Loading…</p>
					) : r ? (
						<>
							<dl className="text-sm mb-6">
								{type === "request" || type === "investment" ? (
									<>
										<DetailRow label="Startup" value={r.startup_name} />
										<DetailRow label="Investor" value={r.investor_organization || [r.investor_first_name, r.investor_last_name].filter(Boolean).join(" ")} />
										<DetailRow label="Project" value={r.project_title} />
										<DetailRow
											label="Amount"
											value={`${Number(r.requested_amount ?? r.amount ?? 0).toLocaleString()} ETB`}
										/>
										<DetailRow label="Status" value={r.status || r.request_status} />
										<DetailRow
											label="Admin verified"
											value={
												r.admin_verified || r.request_admin_verified
													? "Yes"
													: "No"
											}
										/>
										<DetailRow
											label="Startup contact"
											value={`${r.startup_contact_first || r.startup_first_name || ""} ${r.startup_contact_last || r.startup_last_name || ""}`.trim() || r.startup_email}
										/>
										<DetailRow label="Investor email" value={r.investor_email} />
										<DetailRow
											label="Created"
											value={r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
										/>
										{r.notes || r.message ? (
											<DetailRow label="Notes" value={r.notes || r.message} />
										) : null}
									</>
								) : (
									<>
										<DetailRow label="Startup" value={r.startup_name} />
										<DetailRow label="Investor org" value={r.organization_name} />
										<DetailRow label="Reason" value={r.reason} />
										<DetailRow label="Status" value={r.status} />
										<DetailRow
											label="Amount"
											value={r.requested_amount != null ? `${Number(r.requested_amount).toLocaleString()} ETB` : "—"}
										/>
										<DetailRow
											label="Opened"
											value={r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
										/>
										{r.resolution_notes ? <DetailRow label="Resolution" value={r.resolution_notes} /> : null}
									</>
								)}
							</dl>

							{type === "request" ? (
								<div className="space-y-4 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
									<p className="text-sm font-semibold text-slate-900">Actions</p>
									<textarea
										value={comment}
										onChange={(e) => setComment(e.target.value)}
										placeholder="Optional note for the startup and investor"
										className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm min-h-[72px]"
									/>
									<div className="flex flex-wrap gap-2">
										{r.status === "pending" ? (
											<>
												<button
													type="button"
													disabled={busy}
													onClick={() => run(() => updateInvestmentRequestStatus(id, "approved", comment))}
													className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
												>
													Approve
												</button>
												<button
													type="button"
													disabled={busy}
													onClick={() => run(() => updateInvestmentRequestStatus(id, "rejected", comment))}
													className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
												>
													Reject
												</button>
												<button
													type="button"
													disabled={busy}
													onClick={() => run(() => updateInvestmentRequestStatus(id, "withdrawn", comment))}
													className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40"
												>
													Withdraw
												</button>
											</>
										) : null}
										{!r.admin_verified ? (
											<button
												type="button"
												disabled={busy}
												onClick={() => run(() => verifyInvestmentRequest(id))}
												className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-800 disabled:opacity-40"
											>
												Verify legitimacy
											</button>
										) : null}
									</div>
									<div className="pt-3 border-t border-emerald-100">
										<label className="block text-xs font-semibold text-slate-600 mb-2">Open dispute</label>
										<input
											type="text"
											value={disputeReason}
											onChange={(e) => setDisputeReason(e.target.value)}
											placeholder="Reason for dispute"
											className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-2"
										/>
										<button
											type="button"
											disabled={busy || !disputeReason.trim()}
											onClick={() =>
												run(async () => {
													await createInvestmentDispute({
														investment_request_id: id,
														reason: disputeReason.trim(),
													});
													setDisputeReason("");
												})
											}
											className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-900 disabled:opacity-40"
										>
											Open dispute
										</button>
									</div>
								</div>
							) : null}

							{type === "investment" ? (
								<div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
									{!r.admin_verified ? (
										<button
											type="button"
											disabled={busy}
											onClick={() => run(() => verifyInvestment(id))}
											className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
										>
											Verify legitimacy
										</button>
									) : (
										<p className="text-sm text-emerald-800 font-medium">Verified by admin</p>
									)}
								</div>
							) : null}

							{type === "dispute" && r.status === "open" ? (
								<div className="space-y-3 rounded-xl border border-slate-200 p-4">
									<textarea
										value={resolutionNotes}
										onChange={(e) => setResolutionNotes(e.target.value)}
										placeholder="Resolution notes (optional)"
										className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm min-h-[72px]"
									/>
									<div className="flex gap-2">
										<button
											type="button"
											disabled={busy}
											onClick={() =>
												run(() => resolveInvestmentDispute(id, "resolved", resolutionNotes))
											}
											className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
										>
											Resolve
										</button>
										<button
											type="button"
											disabled={busy}
											onClick={() =>
												run(() => resolveInvestmentDispute(id, "dismissed", resolutionNotes))
											}
											className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40"
										>
											Dismiss
										</button>
									</div>
								</div>
							) : null}
						</>
					) : (
						<p className="text-sm text-slate-500">Record not found.</p>
					)}
				</div>
			</div>
		</div>
	);
}

export default function AdminInvestmentsPage() {
	const [tab, setTab] = useState("requests");
	const [requests, setRequests] = useState([]);
	const [investments, setInvestments] = useState([]);
	const [disputes, setDisputes] = useState([]);
	const [disputesError, setDisputesError] = useState("");
	const [filter, setFilter] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [msg, setMsg] = useState("");
	const [detail, setDetail] = useState(null);

	useEffect(() => {
		queueMicrotask(() => {
			const requestId = new URLSearchParams(window.location.search).get("requestId");
			if (requestId) setDetail({ type: "request", id: requestId });
		});
	}, []);

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		setDisputesError("");
		try {
			const [reqData, invData] = await Promise.all([
				fetchInvestmentRequests(),
				fetchInvestments({ limit: 100 }),
			]);
			setRequests(reqData.investment_requests || []);
			setInvestments(invData.investments || []);
			try {
				const dispData = await fetchInvestmentDisputes();
				setDisputes(dispData.disputes || []);
			} catch (ex) {
				setDisputes([]);
				setDisputesError(ex.message || "Could not load disputes");
			}
		} catch (ex) {
			setError(ex.message || "Failed to load investments");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		queueMicrotask(load);
	}, [load]);

	const filteredRequests = filter ? requests.filter((r) => r.status === filter) : requests;

	return (
		<div className="max-w-7xl mx-auto pb-12">
			{detail ? (
				<InvestmentDetailModal
					type={detail.type}
					id={detail.id}
					initialRecord={detail.record}
					onClose={() => setDetail(null)}
					onUpdated={() => {
						load();
						setMsg("Updated");
					}}
				/>
			) : null}

			<section className="mb-8 rounded-[32px] bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8">
				<h1 className="text-3xl font-bold mb-2">Investment oversight</h1>
				<p className="text-slate-300 text-sm">
					Track funding requests, verify legitimacy, review investment history, and resolve disputes.
				</p>
			</section>

			{error ? <div className="mb-4 p-4 rounded-2xl bg-red-50 text-red-700 text-sm">{error}</div> : null}
			{disputesError ? (
				<div className="mb-4 p-4 rounded-2xl bg-amber-50 text-amber-900 text-sm">{disputesError}</div>
			) : null}
			{msg ? <div className="mb-4 p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-sm">{msg}</div> : null}

			<AdminTabs
				tabs={[
					{ id: "requests", label: `Funding requests (${requests.length})` },
					{ id: "investments", label: `History (${investments.length})` },
					{ id: "disputes", label: `Disputes (${disputes.length})` },
				]}
				active={tab}
				onChange={setTab}
			/>

			{tab === "requests" ? (
				<>
					<select
						value={filter}
						onChange={(e) => setFilter(e.target.value)}
						className="mb-4 px-4 py-2 border rounded-xl text-sm bg-white"
					>
						<option value="">All statuses</option>
						{STATUSES.map((s) => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</select>
					<div className="bg-white rounded-2xl border border-slate-100 overflow-x-auto shadow-sm">
						{loading ? (
							<p className="p-6 text-sm text-slate-500">Loading…</p>
						) : (
							<table className="w-full text-sm min-w-[720px]">
								<thead className="bg-slate-50 text-xs uppercase text-slate-500 text-left">
									<tr>
										<th className="px-4 py-3">Startup</th>
										<th className="px-4 py-3">Investor</th>
										<th className="px-4 py-3">Project</th>
										<th className="px-4 py-3">Amount</th>
										<th className="px-4 py-3">Status</th>
										<th className="px-4 py-3">Verified</th>
										<th className="px-4 py-3">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredRequests.map((r) => (
										<tr key={r.investment_request_id} className="hover:bg-slate-50/60">
											<td className="px-4 py-3">{r.startup_name}</td>
											<td className="px-4 py-3">{r.investor_organization || "—"}</td>
											<td className="px-4 py-3">{r.project_title}</td>
											<td className="px-4 py-3 font-semibold tabular-nums">
												{Number(r.requested_amount || 0).toLocaleString()} ETB
											</td>
											<td className="px-4 py-3 capitalize">{r.status}</td>
											<td className="px-4 py-3">{r.admin_verified ? "Yes" : "No"}</td>
											<td className="px-4 py-3">
												<button
													type="button"
													onClick={() =>
														setDetail({ type: "request", id: r.investment_request_id })
													}
													className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
												>
													View details
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</>
			) : tab === "disputes" ? (
				<div className="bg-white rounded-2xl border overflow-x-auto shadow-sm">
					<table className="w-full text-sm min-w-[640px]">
						<thead className="bg-slate-50 text-xs uppercase text-left text-slate-500">
							<tr>
								<th className="px-4 py-3">Startup</th>
								<th className="px-4 py-3">Investor</th>
								<th className="px-4 py-3">Reason</th>
								<th className="px-4 py-3">Status</th>
								<th className="px-4 py-3">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{disputes.length === 0 ? (
								<tr>
									<td colSpan={5} className="px-4 py-8 text-center text-slate-500">
										No disputes recorded.
									</td>
								</tr>
							) : (
								disputes.map((d) => (
									<tr key={d.dispute_id} className="hover:bg-slate-50/60">
										<td className="px-4 py-3">{d.startup_name || "—"}</td>
										<td className="px-4 py-3">{d.organization_name || "—"}</td>
										<td className="px-4 py-3 max-w-[200px] truncate">{d.reason}</td>
										<td className="px-4 py-3 capitalize">{d.status}</td>
										<td className="px-4 py-3">
											<button
												type="button"
												onClick={() => setDetail({ type: "dispute", id: d.dispute_id, record: d })}
												className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
											>
												View details
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			) : (
				<div className="bg-white rounded-2xl border border-slate-100 overflow-x-auto shadow-sm">
					{loading ? (
						<p className="p-6 text-sm text-slate-500">Loading…</p>
					) : (
						<table className="w-full text-sm min-w-[720px]">
							<thead className="bg-slate-50 text-xs uppercase text-slate-500 text-left">
								<tr>
									<th className="px-4 py-3">Project</th>
									<th className="px-4 py-3">Startup</th>
									<th className="px-4 py-3">Investor</th>
									<th className="px-4 py-3">Amount</th>
									<th className="px-4 py-3">Status</th>
									<th className="px-4 py-3">Date</th>
									<th className="px-4 py-3">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{investments.map((inv) => (
									<tr key={inv.investment_id} className="hover:bg-slate-50/60">
										<td className="px-4 py-3">{inv.project_title}</td>
										<td className="px-4 py-3">{inv.startup_first_name}</td>
										<td className="px-4 py-3">{inv.investor_first_name}</td>
										<td className="px-4 py-3 font-semibold tabular-nums">
											{Number(inv.amount || 0).toLocaleString()} ETB
										</td>
										<td className="px-4 py-3 capitalize">
											{inv.status}
											{inv.admin_verified ? " ✓" : ""}
										</td>
										<td className="px-4 py-3 text-slate-500">
											{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "—"}
										</td>
										<td className="px-4 py-3">
											<button
												type="button"
												onClick={() => setDetail({ type: "investment", id: inv.investment_id })}
												className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
											>
												View details
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			)}
		</div>
	);
}
