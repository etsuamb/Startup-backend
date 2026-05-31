"use client";
import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Sidebar from "@/components/startup/Sidebar";
import { getStartupOffers, updateOfferStatus } from "@/lib/startupApi";
import { formatFolderLabel } from "@/lib/offerUtils";

// ─── Icons ───────────────────────────────────────────────────────────────────
function IconCheck() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconX() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconRefresh({ spinning }) {
  return (
    <svg
      className={`w-4 h-4 ${spinning ? "animate-spin" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
function IconInvestment() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconMentorship() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatAmount(amount) {
  if (!amount) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDate(dateString);
}

function getStatusConfig(status = "") {
  switch (status.toLowerCase()) {
    case "pending":
      return { label: "Pending", bg: "bg-amber-100 text-amber-800", dot: "bg-amber-500" };
    case "approved":
    case "accepted":
      return { label: "Accepted", bg: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" };
    case "rejected":
      return { label: "Rejected", bg: "bg-red-100 text-red-800", dot: "bg-red-500" };
    case "withdrawn":
    case "cancelled":
      return { label: "Withdrawn", bg: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
    default:
      return { label: status || "Unknown", bg: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
  }
}

function getOfferName(offer) {
  return `${offer.first_name || ""} ${offer.last_name || ""}`.trim() || "Unknown contact";
}

function getOfferSubtitle(offer) {
  return offer.company || offer.headline || offer.professional_title || offer.project_title || "";
}

function isIncoming(offer) {
  return offer.source_direction === "incoming";
}

function isPending(offer) {
  return offer.status === "pending";
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent = false, highlight }) {
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-1 shadow-sm ${accent ? "bg-[#0f3d32] border-[#0a2c24]" : "bg-white border-gray-100"}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${accent ? "text-[#b8f0d9]" : "text-gray-400"}`}>{label}</p>
      <p className={`text-3xl font-black mt-1 ${accent ? "text-white" : highlight || "text-gray-900"}`}>{value}</p>
    </div>
  );
}

// ─── Filter Tab ───────────────────────────────────────────────────────────────
function FilterTab({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
        active
          ? "bg-[#0f3d32] text-white shadow-sm"
          : "bg-white text-gray-600 border border-gray-200 hover:border-[#0f3d32]/30 hover:text-[#0f3d32]"
      }`}
    >
      {label}
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
          active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// ─── Offer Card ───────────────────────────────────────────────────────────────
function OfferCard({ offer, onAccept, onReject, actionLoading }) {
  const status = getStatusConfig(offer.status);
  const incoming = isIncoming(offer);
  const pending = isPending(offer);
  const isInvestment = offer.offerType === "investment";
  const amount = isInvestment ? formatAmount(offer.amount) : null;
  const name = getOfferName(offer);
  const subtitle = getOfferSubtitle(offer);
  const message = offer.message || offer.terms || "";

  // Direction badge colors
  const directionConfig = incoming
    ? isInvestment
      ? { label: "Investor → You", bg: "bg-blue-50 text-blue-700 border border-blue-200" }
      : { label: "Mentor → You", bg: "bg-violet-50 text-violet-700 border border-violet-200" }
    : isInvestment
    ? { label: "You → Investor", bg: "bg-emerald-50 text-emerald-700 border border-emerald-200" }
    : { label: "You → Mentor", bg: "bg-amber-50 text-amber-700 border border-amber-200" };

  // Left accent border color
  const borderAccent = incoming
    ? isInvestment ? "border-l-blue-400" : "border-l-violet-400"
    : isInvestment ? "border-l-emerald-400" : "border-l-amber-400";

  const typeIcon = isInvestment
    ? <IconInvestment />
    : <IconMentorship />;

  const typeIconBg = isInvestment
    ? incoming ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
    : incoming ? "bg-violet-100 text-violet-700" : "bg-amber-100 text-amber-700";

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${borderAccent} shadow-sm hover:shadow-md transition-shadow overflow-hidden`}>
      {/* Card Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          {/* Icon + Name */}
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeIconBg}`}>
              {typeIcon}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-gray-900 leading-tight">{name}</h3>
              {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>

          {/* Status badge */}
          <div className="shrink-0 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${status.bg}`}>{status.label}</span>
          </div>
        </div>

        {/* Direction + Type badges */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${directionConfig.bg}`}>
            {directionConfig.label}
          </span>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 capitalize">
            {offer.type || (isInvestment ? "Investment" : "Mentorship")}
          </span>
          {offer.preferred_industry && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500">
              {offer.preferred_industry}
            </span>
          )}
          {offer.expertise && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500">
              {offer.expertise}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="px-5 pb-4 border-t border-gray-50">
        {/* Amount or mentorship label */}
        <div className="mt-4 flex items-center justify-between">
          {isInvestment ? (
            amount ? (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Amount</p>
                <p className="mt-1 text-xl font-black text-[#0f3d32]">{amount}</p>
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Amount</p>
                <p className="mt-1 text-sm font-semibold text-gray-400">Not specified</p>
              </div>
            )
          ) : (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Type</p>
              <p className="mt-1 text-sm font-bold text-violet-700">Mentorship Request</p>
            </div>
          )}

          {/* Project */}
          {offer.project_title && (
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Project</p>
              <p className="mt-1 text-sm font-semibold text-gray-700 truncate max-w-[160px]">{offer.project_title}</p>
            </div>
          )}
          {offer.subject && (
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Subject</p>
              <p className="mt-1 text-sm font-semibold text-gray-700 truncate max-w-[160px]">{offer.subject}</p>
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Message</p>
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{message}</p>
          </div>
        )}

        {/* Documents */}
        {offer.document_count > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <p className="text-xs text-gray-500 font-medium">
              {offer.document_count} file{offer.document_count !== 1 ? "s" : ""}
              {offer.document_folders?.length
                ? ` · ${offer.document_folders.map((f) => formatFolderLabel(f.folder)).join(", ")}`
                : ""}
            </p>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className={`px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-3 ${incoming && pending ? "bg-gray-50/60" : ""}`}>
        {/* Time */}
        <div className="flex items-center gap-1.5 text-gray-400">
          <IconClock />
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-gray-500">{timeAgo(offer.created_at)}</span>
            <span className="text-[10px] text-gray-400">{formatDate(offer.created_at)} · {formatTime(offer.created_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Accept/Deny only for incoming pending offers */}
          {incoming && pending && (
            <>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onReject(offer); }}
                disabled={actionLoading === offer.id}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
              >
                <IconX />
                Deny
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onAccept(offer); }}
                disabled={actionLoading === offer.id}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f3d32] px-3 py-2 text-xs font-bold text-white hover:bg-[#0b2f26] transition disabled:opacity-50"
              >
                <IconCheck />
                {actionLoading === offer.id ? "..." : "Accept"}
              </button>
            </>
          )}

          {/* View Details link */}
          <Link
            href={`/startup/offers/${offer.offerType}/${offer.id}`}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:border-[#0f3d32]/30 hover:text-[#0f3d32] transition"
          >
            View
            <IconArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StartupOffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // offer id being actioned
  const [toast, setToast] = useState(null); // { message, type: "success"|"error" }

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  async function fetchOffers(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const response = await getStartupOffers();
      setOffers(response.offers || []);
    } catch (err) {
      console.error("Failed to fetch offers:", err);
      setError("Failed to load offers. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    queueMicrotask(fetchOffers);
  }, []);

  async function handleAccept(offer) {
    setActionLoading(offer.id);
    try {
      await updateOfferStatus(offer.offerType, offer.id, "accepted");
      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id && o.offerType === offer.offerType ? { ...o, status: "accepted" } : o))
      );
      showToast("Offer accepted successfully!", "success");
    } catch (err) {
      setError(err.message || "Failed to accept offer. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(offer) {
    setActionLoading(offer.id);
    try {
      await updateOfferStatus(offer.offerType, offer.id, "rejected");
      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id && o.offerType === offer.offerType ? { ...o, status: "rejected" } : o))
      );
      showToast("Offer declined.", "success");
    } catch (err) {
      setError(err.message || "Failed to decline offer. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  const counts = useMemo(
    () => ({
      total: offers.length,
      pending: offers.filter((o) => o.status === "pending").length,
      accepted: offers.filter((o) => ["accepted", "approved"].includes(o.status)).length,
      rejected: offers.filter((o) => o.status === "rejected").length,
      incomingPending: offers.filter((o) => o.source_direction === "incoming" && o.status === "pending").length,
      startupInvestors: offers.filter((o) => o.offerType === "investment" && o.source_direction === "sent").length,
      startupMentors: offers.filter((o) => o.offerType === "mentorship" && o.source_direction === "sent").length,
      investorOffers: offers.filter((o) => o.offerType === "investment" && o.source_direction === "incoming").length,
      mentorOffers: offers.filter((o) => o.offerType === "mentorship" && o.source_direction === "incoming").length,
    }),
    [offers]
  );

  const filteredOffers = useMemo(() => {
    switch (filter) {
      case "incoming":
        return offers.filter((o) => o.source_direction === "incoming");
      case "outgoing":
        return offers.filter((o) => o.source_direction === "sent");
      case "pending":
        return offers.filter((o) => o.status === "pending");
      case "accepted":
        return offers.filter((o) => ["accepted", "approved"].includes(o.status));
      case "investment":
        return offers.filter((o) => o.offerType === "investment");
      case "mentorship":
        return offers.filter((o) => o.offerType === "mentorship");
      default:
        return offers;
    }
  }, [filter, offers]);

  const filters = [
    { key: "all", label: "All", count: counts.total },
    { key: "incoming", label: "Incoming", count: counts.investorOffers + counts.mentorOffers },
    { key: "outgoing", label: "Outgoing", count: counts.startupInvestors + counts.startupMentors },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "accepted", label: "Accepted", count: counts.accepted },
    { key: "investment", label: "Investment", count: counts.startupInvestors + counts.investorOffers },
    { key: "mentorship", label: "Mentorship", count: counts.startupMentors + counts.mentorOffers },
  ];

  return (
    <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
      <Sidebar />

      {/* Toast */}
      {toast && toast.type === "success" && (
        <div
          className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl bg-[#0f3d32] px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition-all"
        >
          <IconCheck />
          {toast.message}
        </div>
      )}

      <main className="flex-grow overflow-y-auto">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-8 py-8">

          {/* ── Page Header ── */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#0f3d32]">Startup · Offers</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">Offers & Requests</h1>
              <p className="mt-1.5 text-sm text-gray-500 max-w-lg">
                Manage investment and mentorship offers. Accept or decline incoming requests directly from this page.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/startup/discover"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:border-[#0f3d32]/30 hover:text-[#0f3d32] transition"
              >
                Discover
              </Link>
              <button
                type="button"
                onClick={() => fetchOffers(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60 transition"
              >
                <IconRefresh spinning={refreshing} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Offers" value={counts.total} />
            <StatCard label="Pending" value={counts.pending} highlight="text-amber-600" />
            <StatCard label="Accepted" value={counts.accepted} highlight="text-emerald-700" />
            <StatCard
              label="Action Required"
              value={counts.incomingPending}
              accent
            />
          </div>

          {/* ── Action Required Banner ── */}
          {counts.incomingPending > 0 && (
            <div className="mb-6 flex items-center gap-4 rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-amber-900">
                  {counts.incomingPending} incoming offer{counts.incomingPending !== 1 ? "s" : ""} awaiting your response
                </p>
                <p className="text-xs text-amber-700 mt-0.5">Review and accept or decline offers sent to your startup.</p>
              </div>
              <button
                type="button"
                onClick={() => setFilter("incoming")}
                className="shrink-0 rounded-xl bg-amber-700 px-4 py-2 text-xs font-bold text-white hover:bg-amber-800 transition"
              >
                View Incoming
              </button>
            </div>
          )}

          {/* ── Filters + List ── */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">

            {/* Filter Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Offer Activity</h2>
                  <p className="mt-0.5 text-sm text-gray-500">{filteredOffers.length} record{filteredOffers.length !== 1 ? "s" : ""} in this view</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.map((item) => (
                    <FilterTab
                      key={item.key}
                      label={item.label}
                      count={item.count}
                      active={filter === item.key}
                      onClick={() => setFilter(item.key)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="px-6 py-16 text-center">
                <div className="inline-flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-[#0f3d32] border-t-transparent animate-spin" />
                  <p className="text-sm font-semibold text-gray-500">Loading offers...</p>
                </div>
              </div>
            ) : error ? (
              <div className="px-6 py-16 text-center">
                <p className="text-sm font-semibold text-red-600 mb-3">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchOffers()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0f3d32] px-4 py-2 text-sm font-bold text-white hover:bg-[#0b2f26] transition"
                >
                  Try again
                </button>
              </div>
            ) : filteredOffers.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-gray-700">No offers found</p>
                <p className="mt-1 text-sm text-gray-400">There are no offers matching this filter yet.</p>
                {filter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0f3d32] hover:underline"
                  >
                    View all offers
                  </button>
                )}
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredOffers.map((offer) => (
                  <OfferCard
                    key={`${offer.offerType}-${offer.id}`}
                    offer={offer}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
