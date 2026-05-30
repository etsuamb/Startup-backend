"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetchBlob } from "@/lib/api";
import {
approveUser,
fetchPendingUsers,
fetchPendingUser,
rejectUser,
} from "@/lib/adminApi";

const ROLE_STYLES = {
Startup: "bg-orange-100 text-orange-700 border-orange-200",
Investor: "bg-blue-100 text-blue-700 border-blue-200",
Mentor: "bg-rose-100 text-rose-700 border-rose-200",
};

const ROLE_ICONS = {
Startup: "🚀",
Investor: "💼",
Mentor: "🎓",
};

function ConfirmDialog({ title, message, onConfirm, onCancel, isLoading, confirmText = "Confirm", cancelText = "Cancel", isDangerous = false }) {
return (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
<div className="bg-white rounded-[28px] shadow-2xl max-w-md w-full p-8 border border-slate-200">
<h2 className="text-2xl font-bold text-slate-900 mb-3">{title}</h2>
<p className="text-slate-600 mb-8 leading-relaxed">{message}</p>
<div className="flex gap-3">
<button
onClick={onCancel}
disabled={isLoading}
className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50 transition"
>
{cancelText}
</button>
<button
onClick={onConfirm}
disabled={isLoading}
className={`flex-1 px-4 py-3 rounded-2xl text-white font-semibold transition disabled:opacity-50 ${
isDangerous
? "bg-red-600 hover:bg-red-700"
: "bg-emerald-600 hover:bg-emerald-700"
}`}
>
{isLoading ? "…" : confirmText}
</button>
</div>
</div>
</div>
);
}

const profileFieldMap = {
Startup: [
["founder_full_name", "Founder / Representative"],
["startup_name", "Startup Name"],
["industry", "Industry"],
["startup_tagline", "Tagline"],
["business_stage", "Business Stage"],
["startup_type", "Startup Type"],
["founded_year", "Founded Year"],
["region", "Region"],
["city", "City"],
["team_size", "Team Size"],
["founder_role", "Founder Role"],
["location", "Location"],
["website", "Website"],
["description", "Description"],
],
Investor: [
["investor_type", "Investor Type"],
["organization_name", "Organization"],
["preferred_industry", "Preferred Industry"],
["investment_stage", "Investment Stage"],
["investment_budget", "Investment Budget"],
["location_preference", "Location Preference"],
["linked_in_or_website", "LinkedIn / Website"],
["bio", "Bio"],
["personal_verification", "Personal Verification"],
],
Mentor: [
["headline", "Headline"],
["expertise", "Expertise"],
["years_experience", "Years of Experience"],
["hourly_rate", "Hourly Rate"],
["country", "Country"],
["bio", "Bio"],
["professional_title", "Professional Title"],
["languages", "Languages"],
["linkedin_or_portfolio", "LinkedIn / Portfolio"],
["certification_credentials", "Certifications"],
["availability_preference", "Availability Preference"],
["session_pricing", "Session Pricing"],
["current_organization", "Current Organization"],
["current_title", "Current Title"],
["primary_industry", "Primary Industry"],
["secondary_industry", "Secondary Industry"],
["city_location", "City / Location"],
["mentor_platform", "Platform"],
["session_frequency", "Session Frequency"],
["required_time_slots", "Required Time Slots"],
["mentoring_style", "Mentoring Style"],
["notable_startups_mentored", "Notable Startups Mentored"],
["key_achievement", "Key Achievement"],
],
};

function formatFieldValue(value) {
if (value === null || value === undefined || value === "") return "Not provided";
if (Array.isArray(value)) return value.length ? value.join(", ") : "Not provided";
if (typeof value === "object") return JSON.stringify(value);
return String(value);
}

function renderProfileDetails(profile, role) {
if (!profile) return null;
const fields = profileFieldMap[role] || [];
return (
<div className="space-y-4">
<div className="flex items-center justify-between gap-4">
<div>
<p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold mb-2">Registration details</p>
<p className="text-slate-600 text-sm max-w-2xl">Review profile and registration fields submitted by the applicant.</p>
</div>
</div>
<div className="grid gap-4 sm:grid-cols-2">
{fields.map(([key, label]) => (
<div key={key} className="rounded-3xl bg-slate-50 p-4 border border-slate-200">
<p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold mb-2">{label}</p>
<p className="text-slate-900 text-sm leading-relaxed">{formatFieldValue(profile[key])}</p>
</div>
))}
</div>
</div>
);
}

function renderDocumentsSection(documents, openDocument) {
if (!documents || documents.length === 0) return null;
return (
<div className="space-y-4">
<p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Uploaded Documents</p>
<div className="space-y-3 bg-slate-50 rounded-3xl p-4 border border-slate-200">
{documents.map((doc, idx) => (
<div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white rounded-3xl border border-slate-100">
<div>
<p className="font-semibold text-slate-900">{doc.file_name || `Document ${idx + 1}`}</p>
<p className="text-xs text-slate-500 mt-1">
{doc.document_type ? `${doc.document_type} • ` : ""}
{doc.file_size_bytes ? `${(doc.file_size_bytes / 1024 / 1024).toFixed(2)} MB` : "Unknown size"}
{doc.created_at ? ` • ${new Date(doc.created_at).toLocaleDateString()}` : ""}
</p>
</div>
<button
onClick={() => openDocument(doc)}
className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
>
View document
</button>
</div>
))}
</div>
</div>
);
}

export default function VerifyUsersPage() {
const [users, setUsers] = useState([]);
const [search, setSearch] = useState("");
const [roleFilter, setRoleFilter] = useState("all");
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [selectedUser, setSelectedUser] = useState(null);
const [userDetail, setUserDetail] = useState(null);
const [loadingDetail, setLoadingDetail] = useState(false);
const [confirmAction, setConfirmAction] = useState(null);
const [rejectReason, setRejectReason] = useState("");
const [actionLoading, setActionLoading] = useState(false);

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

async function openUserDetail(userId) {
setLoadingDetail(true);
setError("");
try {
const detail = await fetchPendingUser(userId);
setUserDetail(detail);
setSelectedUser(userId);
} catch (ex) {
setError(ex.message || "Failed to load user details");
} finally {
setLoadingDetail(false);
}
}

async function handleApprove(userId) {
setActionLoading(true);
try {
await approveUser(userId, "");
setUsers((prev) => prev.filter((u) => u.user_id !== userId));
setSelectedUser(null);
setUserDetail(null);
setConfirmAction(null);
setRejectReason("");
} catch (ex) {
setError(ex.message || "Approve failed");
} finally {
setActionLoading(false);
}
}

async function handleReject(userId, reason) {
setActionLoading(true);
try {
await rejectUser(userId, reason);
setUsers((prev) => prev.filter((u) => u.user_id !== userId));
setSelectedUser(null);
setUserDetail(null);
setConfirmAction(null);
setRejectReason("");
} catch (ex) {
setError(ex.message || "Reject failed");
} finally {
setActionLoading(false);
}
}

async function handleConfirmAction() {
if (!confirmAction || !userDetail) return;
const userId = userDetail.user.user_id;
if (confirmAction.type === "approve") {
await handleApprove(userId);
} else if (confirmAction.type === "reject") {
await handleReject(userId, rejectReason);
}
}

async function openDocument(doc) {
	if (!userDetail) return;
	const route = doc.is_mentor_document
		? `/admin/mentor-documents/${doc.document_id}`
		: `/admin/documents/${doc.document_id}`;
	try {
		const { blob, contentType } = await apiFetchBlob(route);
		const objectUrl = window.URL.createObjectURL(new Blob([blob], { type: contentType }));
		window.open(objectUrl, "_blank", "noopener,noreferrer");
	} catch (ex) {
		setError(ex.message || "Unable to open document");
	}
}

return (
<div className="max-w-7xl mx-auto pb-12">
<section className="mb-8 rounded-[32px] bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 shadow-lg">
<h1 className="text-3xl md:text-4xl font-bold mb-2">User Verification Center</h1>
<p className="text-slate-300 max-w-2xl">Review and approve pending user registrations with a dedicated page for each application.</p>
</section>

{error ? (
<div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-700 text-sm font-medium border border-red-100">
{error}
</div>
) : null}

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

{selectedUser ? (
<div className="space-y-6">
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
<button
type="button"
onClick={() => {
setSelectedUser(null);
setUserDetail(null);
setConfirmAction(null);
setRejectReason("");
}}
className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
>
<span>←</span> Back to pending users
</button>
<div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
<span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
Pending user review
</div>
</div>

<div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8">
{loadingDetail ? (
<div className="py-20 text-center">
<p className="text-slate-500">Loading user details…</p>
</div>
) : userDetail ? (
<>
<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
<div className="flex items-center gap-4">
<div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-3xl">
{ROLE_ICONS[userDetail.user.role] || "👤"}
</div>
<div>
<p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold mb-2">{userDetail.user.role}</p>
<h2 className="text-3xl font-bold text-slate-900">{userDetail.user.first_name} {userDetail.user.last_name}</h2>
<p className="text-slate-500 mt-1">{userDetail.user.email}</p>
</div>
</div>
<div className="grid gap-3 sm:grid-cols-2">
<div className="rounded-3xl bg-slate-50 p-4 border border-slate-200">
<p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold mb-2">Applied</p>
<p className="text-slate-900">{userDetail.user.created_at ? new Date(userDetail.user.created_at).toLocaleDateString() : "Unknown"}</p>
</div>
<div className="rounded-3xl bg-slate-50 p-4 border border-slate-200">
<p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold mb-2">Phone</p>
<p className="text-slate-900">{userDetail.user.phone_number || "Not provided"}</p>
</div>
</div>
</div>

<div className="grid gap-6 lg:grid-cols-2">
<div className="rounded-3xl bg-slate-50 p-6 border border-slate-200">
<p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold mb-3">Account details</p>
<div className="space-y-4 text-sm text-slate-700">
<div className="flex justify-between gap-4">
<span className="font-medium text-slate-600">Email</span>
<span>{userDetail.user.email}</span>
</div>
<div className="flex justify-between gap-4">
<span className="font-medium text-slate-600">Role</span>
<span>{userDetail.user.role}</span>
</div>
<div className="flex justify-between gap-4">
<span className="font-medium text-slate-600">Review status</span>
<span className="text-amber-700 font-semibold">Pending</span>
</div>
</div>
</div>
<div className="rounded-3xl bg-slate-50 p-6 border border-slate-200">
<p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold mb-3">Verification status</p>
<div className="space-y-4 text-sm text-slate-700">
<div className="flex justify-between gap-4">
<span className="font-medium text-slate-600">Email verified</span>
<span>{userDetail.user.email_verified ? "Yes" : "No"}</span>
</div>
<div className="flex justify-between gap-4">
<span className="font-medium text-slate-600">Approval</span>
<span>{userDetail.user.is_approved ? "Approved" : "Pending"}</span>
</div>
</div>
</div>
</div>

{renderProfileDetails(userDetail.profile, userDetail.user.role)}
{renderDocumentsSection(userDetail.documents, openDocument)}

<div className="mt-6 rounded-[32px] bg-slate-50 p-6 border border-slate-200">
<div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
<div className="space-y-3">
<p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Actions</p>
<p className="text-sm text-slate-600">
{!userDetail.user.email_verified && userDetail.user.provider_type !== "google"
? "This application cannot be approved until the user verifies their email address."
: "Approve or reject this application once you have reviewed all submitted information."}
</p>
</div>
<div className="flex flex-col gap-3 sm:flex-row">
<button
type="button"
onClick={() => setConfirmAction({ type: "reject" })}
className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
>
Reject
</button>
<button
type="button"
onClick={() => setConfirmAction({ type: "approve" })}
disabled={!userDetail.user.email_verified && userDetail.user.provider_type !== "google"}
className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
!userDetail.user.email_verified && userDetail.user.provider_type !== "google"
? "bg-slate-300 cursor-not-allowed"
: "bg-emerald-600 hover:bg-emerald-700"
}`}
>
Approve
</button>
</div>
</div>
{confirmAction?.type === "reject" && (
<div className="mt-4">
<label className="block text-sm font-semibold text-slate-900 mb-3">Rejection reason (optional)</label>
<textarea
value={rejectReason}
onChange={(e) => setRejectReason(e.target.value)}
placeholder="Provide a reason for rejection..."
className="w-full rounded-2xl border border-slate-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
rows="3"
/>
</div>
)}
</div>
</>
) : (
<div className="py-20 text-center text-slate-500">User details are unavailable.</div>
)}
</div>
</div>
) : loading ? (
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
<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-2xl">
{ROLE_ICONS[u.role] || "👤"}
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

<div className="flex gap-3">
<button
type="button"
onClick={() => openUserDetail(u.user_id)}
className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition bg-slate-50/50"
>
View Details
</button>
</div>
</div>
))}
</div>
)}

{confirmAction && userDetail ? (
<ConfirmDialog
title={confirmAction.type === "approve" ? "Approve user?" : "Reject user?"}
message={
confirmAction.type === "approve"
? `Are you sure you want to approve ${userDetail.user.first_name} ${userDetail.user.last_name}? This will grant platform access.`
: `Are you sure you want to reject ${userDetail.user.first_name} ${userDetail.user.last_name}?${rejectReason ? ` Reason: ${rejectReason}` : ""}`
}
onConfirm={handleConfirmAction}
onCancel={() => setConfirmAction(null)}
isLoading={actionLoading}
confirmText={confirmAction.type === "approve" ? "Yes, approve" : "Yes, reject"}
cancelText="Cancel"
isDangerous={confirmAction.type === "reject"}
/>
) : null}
</div>
);
}
