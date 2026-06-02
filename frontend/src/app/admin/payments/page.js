"use client";

import { useCallback, useEffect, useState } from "react";
import {
	fetchPaymentById,
	fetchPaymentStats,
	fetchPayments,
	fetchSuspiciousPayments,
	flagPayment,
	recordChargeback,
	releaseEscrowPayment,
	refundPayment,
	runPaymentFraudScan,
	updatePaymentDisputeStatus,
} from "@/lib/adminApi";
import AdminTabs from "@/components/admin/AdminTabs";
import AdminActionModal from "@/components/admin/AdminActionModal";

const TABS = [
	{ id: "all", label: "All transactions" },
	{ id: "suspicious", label: "Suspicious / chargebacks" },
];

function PaymentDetailModal({ payment, onClose, onAction }) {
	const [promptModal, setPromptModal] = useState(null);

	if (!payment) return null;
	const p = payment;
	const fraudFlags = Array.isArray(p.fraud_flags) ? p.fraud_flags : [];

	function openNotesModal({ title, inputLabel, onSubmit }) {
		setPromptModal({ title, inputLabel, onSubmit });
	}

	return (
		<>
			{promptModal ? (
				<AdminActionModal
					open
					variant="prompt"
					title={promptModal.title}
					inputLabel={promptModal.inputLabel}
					inputType="textarea"
					placeholder="Optional notes…"
					confirmLabel="Continue"
					onCancel={() => setPromptModal(null)}
					onConfirm={(notes) => {
						const submit = promptModal.onSubmit;
						setPromptModal(null);
						onAction(() => submit(notes || ""));
					}}
				/>
			) : null}
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="bg-white rounded-2xl max-w-lg w-full p-6 border shadow-xl max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-start mb-4">
					<h2 className="text-lg font-bold text-slate-900">Payment #{p.payment_id}</h2>
					<button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
						×
					</button>
				</div>
				<dl className="space-y-3 text-sm">
					<div className="flex justify-between gap-4">
						<dt className="text-slate-500">From</dt>
						<dd className="text-right font-medium">{p.from_first_name || p.from_email} ({p.from_email})</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="text-slate-500">To</dt>
						<dd className="text-right font-medium">{p.to_first_name || p.to_email} ({p.to_email})</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="text-slate-500">Amount</dt>
						<dd className="font-bold">{Number(p.amount).toLocaleString()} {p.currency || "ETB"}</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="text-slate-500">Platform fee</dt>
						<dd>{Number(p.platform_fee || 0).toLocaleString()} ETB</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="text-slate-500">Status</dt>
						<dd className="capitalize font-medium">{p.status}</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="text-slate-500">Escrow</dt>
						<dd className="capitalize font-medium">{String(p.escrow_status || "not_applicable").replace(/_/g, " ")}</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="text-slate-500">Risk score</dt>
						<dd className="font-bold">{p.risk_score || 0}/100</dd>
					</div>
					{fraudFlags.length ? (
						<div>
							<dt className="text-slate-500 mb-1">Fraud flags</dt>
							<dd className="flex flex-wrap gap-2">
								{fraudFlags.map((flag) => (
									<span key={flag.code || flag.label} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
										{flag.label || flag.code}
									</span>
								))}
							</dd>
						</div>
					) : null}
					<div className="flex justify-between gap-4">
						<dt className="text-slate-500">Reference</dt>
						<dd>{p.reference_type || "—"} #{p.reference_id || "—"}</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="text-slate-500">Method</dt>
						<dd>{p.payment_method || "—"}</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="text-slate-500">Transaction ref</dt>
						<dd className="font-mono text-xs">{p.transaction_reference || "—"}</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="text-slate-500">Created</dt>
						<dd>{p.created_at ? new Date(p.created_at).toLocaleString() : "—"}</dd>
					</div>
					{p.admin_notes ? (
						<div>
							<dt className="text-slate-500 mb-1">Admin notes</dt>
							<dd className="rounded-lg bg-slate-50 p-3 text-slate-700">{p.admin_notes}</dd>
						</div>
					) : null}
				</dl>
				<div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
					{p.status === "completed" ? (
						<button
							type="button"
							onClick={() =>
								openNotesModal({
									title: "Refund payment",
									inputLabel: "Refund notes",
									onSubmit: (notes) => refundPayment(p.payment_id, notes),
								})
							}
							className="px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
						>
							Refund
						</button>
					) : null}
					{p.status === "completed" && ["held", "authorized"].includes(p.escrow_status) ? (
						<button
							type="button"
							onClick={() =>
								openNotesModal({
									title: "Release escrow",
									inputLabel: "Escrow release notes",
									onSubmit: (notes) => releaseEscrowPayment(p.payment_id, notes),
								})
							}
							className="px-3 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold"
						>
							Release escrow
						</button>
					) : null}
					<button
						type="button"
						onClick={() =>
							openNotesModal({
								title: p.is_suspicious ? "Unflag payment" : "Flag as suspicious",
								inputLabel: "Flag notes",
								onSubmit: (notes) => flagPayment(p.payment_id, !p.is_suspicious, notes),
							})
						}
						className="px-3 py-2 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold"
					>
						{p.is_suspicious ? "Unflag" : "Flag suspicious"}
					</button>
					<button
						type="button"
						onClick={() =>
							openNotesModal({
								title: "Record chargeback",
								inputLabel: "Chargeback notes",
								onSubmit: (notes) => recordChargeback(p.payment_id, notes),
							})
						}
						className="px-3 py-2 rounded-xl bg-red-100 text-red-700 text-xs font-bold"
					>
						Record chargeback
					</button>
					<button
						type="button"
						onClick={() =>
							openNotesModal({
								title: "Provider refund pending",
								inputLabel: "Provider refund notes",
								onSubmit: (notes) =>
									updatePaymentDisputeStatus(p.payment_id, {
										type: "refund",
										status: "provider_pending",
										notes,
									}),
							})
						}
						className="px-3 py-2 rounded-xl bg-blue-100 text-blue-800 text-xs font-bold"
					>
						Provider refund pending
					</button>
					<button
						type="button"
						onClick={() =>
							openNotesModal({
								title: "Chargeback review",
								inputLabel: "Chargeback review notes",
								onSubmit: (notes) =>
									updatePaymentDisputeStatus(p.payment_id, {
										type: "chargeback",
										status: "under_review",
										notes,
									}),
							})
						}
						className="px-3 py-2 rounded-xl bg-red-50 text-red-800 text-xs font-bold"
					>
						Chargeback review
					</button>
				</div>
			</div>
		</div>
		</>
	);
}

export default function AdminPaymentsPage() {
	const [view, setView] = useState("all");
	const [payments, setPayments] = useState([]);
	const [stats, setStats] = useState(null);
	const [status, setStatus] = useState("");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [msg, setMsg] = useState("");
	const [selectedPayment, setSelectedPayment] = useState(null);
	const [detailLoading, setDetailLoading] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const st = await fetchPaymentStats();
			setStats(st.stats || null);
			if (view === "suspicious") {
				const data = await fetchSuspiciousPayments();
				setPayments(data.payments || []);
				setTotalPages(1);
			} else {
				const list = await fetchPayments({ status: status || undefined, page, limit: 25 });
				setPayments(list.payments || []);
				setTotalPages(list.totalPages || 1);
			}
		} catch (ex) {
			setError(ex.message || "Failed to load payments");
		} finally {
			setLoading(false);
		}
	}, [status, page, view]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		load();
	}, [load]);

	async function openDetail(paymentId) {
		setDetailLoading(true);
		setError("");
		try {
			const data = await fetchPaymentById(paymentId);
			setSelectedPayment(data.payment);
		} catch (ex) {
			setError(ex.message || "Failed to load payment details");
		} finally {
			setDetailLoading(false);
		}
	}

	async function runAction(fn) {
		setMsg("");
		try {
			await fn();
			setMsg("Action completed");
			setSelectedPayment(null);
			await load();
		} catch (ex) {
			setError(ex.message || "Action failed");
		}
	}

	const s = stats || {};

	return (
		<div className="max-w-7xl mx-auto pb-12">
			<section className="mb-8 rounded-2xl bg-[#0a4d3c] text-white p-8 border border-[#07382b]/20">
				<h1 className="text-3xl font-bold mb-2">Payment management</h1>
				<p className="text-white/80 text-sm">
					Review transactions, open payment details, process refunds, and flag suspicious activity.
				</p>
			</section>

			{error ? <div className="mb-4 p-4 rounded-2xl bg-red-50 text-red-700 text-sm">{error}</div> : null}
			{msg ? <div className="mb-4 p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-sm">{msg}</div> : null}

			<div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
				<div className="bg-white rounded-2xl p-5 border">
					<p className="text-xs font-bold text-slate-400 uppercase">Total transactions</p>
					<p className="text-2xl font-black mt-1">{s.total_transactions ?? "—"}</p>
				</div>
				<div className="bg-white rounded-2xl p-5 border">
					<p className="text-xs font-bold text-slate-400 uppercase">Successful</p>
					<p className="text-2xl font-black text-emerald-700 mt-1">{s.successful_transactions ?? "—"}</p>
				</div>
				<div className="bg-white rounded-2xl p-5 border">
					<p className="text-xs font-bold text-slate-400 uppercase">Volume (ETB)</p>
					<p className="text-2xl font-black mt-1">{Number(s.total_volume || 0).toLocaleString()}</p>
				</div>
				<div className="bg-white rounded-2xl p-5 border">
					<p className="text-xs font-bold text-slate-400 uppercase">Platform revenue</p>
					<p className="text-2xl font-black mt-1">{Number(s.total_revenue || 0).toLocaleString()}</p>
				</div>
				<div className="bg-white rounded-2xl p-5 border">
					<p className="text-xs font-bold text-slate-400 uppercase">Escrow held</p>
					<p className="text-2xl font-black text-blue-700 mt-1">{s.escrow_held ?? "0"}</p>
				</div>
				<div className="bg-white rounded-2xl p-5 border">
					<p className="text-xs font-bold text-slate-400 uppercase">Suspicious</p>
					<p className="text-2xl font-black text-amber-700 mt-1">{s.suspicious_transactions ?? "0"}</p>
				</div>
			</div>

			<AdminTabs tabs={TABS} active={view} onChange={(id) => { setView(id); setPage(1); }} />
			<div className="mb-4">
				<button
					type="button"
					onClick={() => runAction(runPaymentFraudScan)}
					className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800"
				>
					Run fraud scan
				</button>
				<span className="ml-3 text-xs text-slate-500">Average risk score: {s.avg_risk_score ?? 0}/100</span>
			</div>

			{view === "all" ? (
				<select
					value={status}
					onChange={(e) => { setStatus(e.target.value); setPage(1); }}
					className="px-4 py-2 border rounded-xl text-sm bg-white mb-4"
				>
					<option value="">All statuses</option>
					<option value="completed">Completed</option>
					<option value="pending">Pending</option>
					<option value="failed">Failed</option>
					<option value="refunded">Refunded</option>
				</select>
			) : null}

			<div className="bg-white rounded-2xl border overflow-x-auto">
				{loading ? (
					<p className="p-6 text-sm text-slate-500">Loading…</p>
				) : (
					<table className="w-full text-sm">
						<thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
							<tr>
								<th className="px-4 py-3">ID</th>
								<th className="px-4 py-3">Parties</th>
								<th className="px-4 py-3">Amount</th>
								<th className="px-4 py-3">Status</th>
								<th className="px-4 py-3">Escrow</th>
								<th className="px-4 py-3">Flags</th>
								<th className="px-4 py-3">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{payments.map((p) => (
								<tr key={p.payment_id}>
									<td className="px-4 py-3 font-mono text-xs">{p.payment_id}</td>
									<td className="px-4 py-3 text-xs">
										{p.from_first_name || p.from_email} → {p.to_first_name || p.to_email}
									</td>
									<td className="px-4 py-3 font-semibold">{p.amount} {p.currency || "ETB"}</td>
									<td className="px-4 py-3">{p.status}</td>
									<td className="px-4 py-3 text-xs capitalize">{String(p.escrow_status || "not_applicable").replace(/_/g, " ")} - risk {p.risk_score || 0}</td>
									<td className="px-4 py-3 text-xs">
										{p.is_suspicious ? <span className="text-amber-700 font-bold">Suspicious</span> : null}
										{p.chargeback_status ? <span className="text-red-700 font-bold ml-1">Chargeback</span> : null}
										{p.refund_status ? <span className="text-slate-600 ml-1">Refunded</span> : null}
										{Array.isArray(p.fraud_flags) && p.fraud_flags.length ? <span className="text-amber-700 font-bold ml-1">Flags: {p.fraud_flags.length}</span> : null}
									</td>
									<td className="px-4 py-3">
										<button
											type="button"
											disabled={detailLoading}
											onClick={() => openDetail(p.payment_id)}
											className="text-xs font-bold text-emerald-700 hover:underline mr-3"
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

			{view === "all" && totalPages > 1 ? (
				<div className="flex justify-center gap-2 mt-4">
					<button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 rounded-xl border text-sm font-bold disabled:opacity-40">Previous</button>
					<span className="px-4 py-2 text-sm">Page {page} of {totalPages}</span>
					<button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-xl border text-sm font-bold disabled:opacity-40">Next</button>
				</div>
			) : null}

			<PaymentDetailModal
				payment={selectedPayment}
				onClose={() => setSelectedPayment(null)}
				onAction={runAction}
			/>
		</div>
	);
}
