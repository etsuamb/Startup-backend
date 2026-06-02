"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
	approveUser,
	fetchPendingUser,
	openAdminDocument,
	rejectUser,
} from "@/lib/adminApi";
import {
	buildProfileSections,
	formatFileSize,
	normalizePendingUserResponse,
} from "@/lib/pendingUserDetail";
import AdminActionModal from "@/components/admin/AdminActionModal";

const ROLE_STYLES = {
	Startup: "bg-orange-100 text-orange-700 border-orange-200",
	Investor: "bg-blue-100 text-blue-700 border-blue-200",
	Mentor: "bg-rose-100 text-rose-700 border-rose-200",
};

function DetailSection({ title, children }) {
	return (
		<section className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
			<div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80">
				<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h3>
			</div>
			<div className="p-6">{children}</div>
		</section>
	);
}

function DetailGrid({ items }) {
	return (
		<dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
			{items.map((item) => (
				<div key={item.label} className={item.multiline ? "sm:col-span-2" : ""}>
					<dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
						{item.label}
					</dt>
					<dd
						className={`text-sm text-slate-800 ${
							item.multiline ? "whitespace-pre-wrap leading-relaxed font-medium" : "font-semibold"
						}`}
					>
						{item.value}
					</dd>
				</div>
			))}
		</dl>
	);
}

function DocumentCard({ doc, onView, loadingId }) {
	const typeLabel = doc.document_type || doc.description || "Document";
	const isLoading = loadingId === doc.document_id;

	return (
		<div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-emerald-200 hover:bg-emerald-50/30 transition">
			<div className="w-12 h-12 rounded-xl bg-[#0a4d3c]/10 border border-[#0a4d3c]/20 flex items-center justify-center text-[10px] font-black text-[#0a4d3c] shrink-0">
				DOC
			</div>
			<div className="flex-1 min-w-0">
				<p className="font-bold text-slate-900 text-sm truncate">{typeLabel}</p>
				<p className="text-xs text-slate-500 truncate mt-0.5">{doc.file_name || "Uploaded file"}</p>
				<p className="text-[10px] text-slate-400 mt-1">
					{formatFileSize(doc.file_size_bytes)}
					{doc.file_size_bytes && doc.created_at ? " · " : ""}
					{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ""}
				</p>
			</div>
			<button
				type="button"
				onClick={() => onView(doc)}
				disabled={isLoading}
				className="shrink-0 px-4 py-2 rounded-xl bg-[#0a4d3c] text-white text-xs font-bold hover:bg-[#07382b] disabled:opacity-60 transition"
			>
				{isLoading ? "Opening…" : "View file"}
			</button>
		</div>
	);
}

export default function PendingUserDetailPage({ userId }) {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [user, setUser] = useState(null);
	const [profile, setProfile] = useState(null);
	const [documents, setDocuments] = useState([]);
	const [rejectReason, setRejectReason] = useState("");
	const [showRejectForm, setShowRejectForm] = useState(false);
	const [confirmAction, setConfirmAction] = useState(null);
	const [processing, setProcessing] = useState(false);
	const [docLoadingId, setDocLoadingId] = useState(null);
	const [docError, setDocError] = useState("");

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const raw = await fetchPendingUser(userId);
			const normalized = normalizePendingUserResponse(raw);
			setUser(normalized.user);
			setProfile(normalized.profile);
			setDocuments(normalized.documents);
		} catch (ex) {
			setError(ex.message || "Failed to load user details");
		} finally {
			setLoading(false);
		}
	}, [userId]);

	useEffect(() => {
		load();
	}, [load]);

	async function handleViewDocument(doc) {
		setDocError("");
		setDocLoadingId(doc.document_id);
		try {
			await openAdminDocument(doc.document_id, {
				isMentorDocument: Boolean(doc.is_mentor_document),
			});
		} catch (ex) {
			setDocError(ex.message || "Could not open document");
		} finally {
			setDocLoadingId(null);
		}
	}

	async function handleApprove() {
		setProcessing(true);
		setError("");
		try {
			await approveUser(userId, "");
			router.push("/admin/users");
			router.refresh();
		} catch (ex) {
			setError(ex.message || "Approve failed");
		} finally {
			setProcessing(false);
			setConfirmAction(null);
		}
	}

	async function handleReject() {
		setProcessing(true);
		setError("");
		try {
			await rejectUser(userId, rejectReason);
			router.push("/admin/users");
			router.refresh();
		} catch (ex) {
			setError(ex.message || "Reject failed");
		} finally {
			setProcessing(false);
			setConfirmAction(null);
		}
	}

	const fullName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "";
	const sections = buildProfileSections(user, profile);
	const approvalBlocked = Boolean(user && !user.email_verified && user.provider_type !== "google");

	if (loading) {
		return (
			<div className="max-w-6xl mx-auto py-16 text-center">
				<p className="text-slate-500 text-sm">Loading application details…</p>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="max-w-6xl mx-auto">
				<Link
					href="/admin/users"
					className="inline-flex items-center gap-2 text-sm font-bold text-[#0a4d3c] hover:text-[#07382b] mb-6"
				>
					← Back to pending users
				</Link>
				<div className="rounded-2xl bg-red-50 border border-red-100 p-6 text-red-700">
					{error || "User not found"}
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto pb-28">
			{confirmAction === "approve" ? (
				<AdminActionModal
					open
					title="Approve user?"
					message={`Approve ${fullName}? They will gain access to the platform.`}
					onConfirm={handleApprove}
					onCancel={() => setConfirmAction(null)}
					isLoading={processing}
					confirmLabel="Yes, approve"
					cancelLabel="Cancel"
				/>
			) : null}
			{confirmAction === "reject" ? (
				<AdminActionModal
					open
					title="Reject user?"
					message={`Reject ${fullName}?${rejectReason ? ` Reason: ${rejectReason}` : " No reason provided."}`}
					onConfirm={handleReject}
					onCancel={() => setConfirmAction(null)}
					isLoading={processing}
					confirmLabel="Yes, reject"
					cancelLabel="Go back"
					isDangerous
				/>
			) : null}

			{/* Top bar */}
			<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
				<Link
					href="/admin/users"
					className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 shadow-sm transition"
				>
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
					Back to list
				</Link>
				<span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
					Pending review
				</span>
			</div>

			{approvalBlocked ? (
				<div className="mb-6 p-4 rounded-2xl bg-amber-50 text-amber-800 text-sm font-medium border border-amber-100">
					This application cannot be approved until the user verifies their email address.
				</div>
			) : null}

			{error ? (
				<div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-700 text-sm font-medium border border-red-100">
					{error}
				</div>
			) : null}

			{/* Hero */}
			<header className="rounded-2xl bg-[#0a4d3c] text-white p-8 mb-8 shadow-sm border border-[#07382b]/20">
				<div className="flex flex-col md:flex-row md:items-center gap-6">
					<div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-xl font-black">
						{String(user.role || "User").slice(0, 2).toUpperCase()}
					</div>
					<div className="flex-1 min-w-0">
						<h1 className="text-3xl font-bold tracking-tight">{fullName || "Unnamed applicant"}</h1>
						<p className="text-white/80 mt-1">{user.email}</p>
						<div className="flex flex-wrap items-center gap-3 mt-4">
							<span
								className={`px-3 py-1 rounded-full text-xs font-bold border ${
									ROLE_STYLES[user.role] || "bg-slate-100 text-slate-600 border-slate-200"
								}`}
							>
								{user.role}
							</span>
							{user.phone_number ? (
								<span className="text-sm text-white/80">{user.phone_number}</span>
							) : null}
							{user.created_at ? (
								<span className="text-sm text-white/70">
									Applied {new Date(user.created_at).toLocaleDateString()}
								</span>
							) : null}
						</div>
					</div>
				</div>
			</header>

			<div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
				{/* Profile columns */}
				<div className="xl:col-span-2 space-y-6">
					{sections.map((section) => (
						<DetailSection key={section.id} title={section.title}>
							<DetailGrid items={section.items} />
						</DetailSection>
					))}

					{sections.length <= 1 && !profile ? (
						<div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm">
							No role-specific profile data was found for this application.
						</div>
					) : null}
				</div>

				{/* Sidebar: documents + actions */}
				<div className="space-y-6">
					<DetailSection title="Uploaded documents">
						{docError ? (
							<p className="text-sm text-red-600 mb-4 font-medium">{docError}</p>
						) : null}
						{documents.length === 0 ? (
							<p className="text-sm text-slate-500">No documents uploaded.</p>
						) : (
							<div className="space-y-3">
								{documents.map((doc) => (
									<DocumentCard
										key={`${doc.document_id}-${doc.file_name}`}
										doc={doc}
										onView={handleViewDocument}
										loadingId={docLoadingId}
									/>
								))}
							</div>
						)}
					</DetailSection>

					<div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-6 sticky top-4">
						<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">
							Review decision
						</h3>
						<p className="text-xs text-slate-500 mb-5 leading-relaxed">
							Use <strong className="text-slate-700">Back to list</strong> above to return without approving or rejecting.
						</p>

						{showRejectForm ? (
							<div className="mb-4">
								<label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
									Rejection reason (optional)
								</label>
								<textarea
									value={rejectReason}
									onChange={(e) => setRejectReason(e.target.value)}
									placeholder="Explain why this application is rejected…"
									rows={3}
									className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
								/>
							</div>
						) : null}

						<div className="flex flex-col gap-3">
							<button
								type="button"
								onClick={() => {
									if (!showRejectForm) {
										setShowRejectForm(true);
										return;
									}
									setConfirmAction("reject");
								}}
								className="w-full py-3 rounded-2xl border border-red-200 text-red-700 font-bold text-sm hover:bg-red-50 transition"
							>
								{showRejectForm ? "Confirm reject" : "Reject application"}
							</button>
							<button
								type="button"
								onClick={() => setConfirmAction("approve")}
								disabled={approvalBlocked}
								className={`w-full py-3 rounded-2xl text-white font-bold text-sm transition ${
									approvalBlocked
										? "bg-slate-300 cursor-not-allowed"
										: "bg-[#0a4d3c] hover:bg-[#07382b] shadow-md shadow-[#0a4d3c]/20"
								}`}
							>
								Approve application
							</button>
							<Link
								href="/admin/users"
								className="w-full py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition text-center block"
							>
								Cancel — back to list
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
