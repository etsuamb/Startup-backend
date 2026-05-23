"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/investor/Sidebar";
import { acceptInvestorFundingOffer, getInvestorFundingOffers } from "@/lib/investorApi";

function formatCurrency(value) {
  const amount = Number(value || 0);
  if (!amount) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusStyle(status = "") {
  const normalized = status.toLowerCase();
  if (["approved", "accepted"].includes(normalized)) {
    return "bg-green-50 text-green-700 border-green-100";
  }
  if (["rejected", "declined", "withdrawn"].includes(normalized)) {
    return "bg-red-50 text-red-700 border-red-100";
  }
  return "bg-yellow-50 text-yellow-700 border-yellow-100";
}

function stageStyle(stage = "") {
  const normalized = stage.toLowerCase();
  if (normalized.includes("series")) return "bg-green-100 text-green-700";
  if (normalized.includes("seed")) return "bg-orange-100 text-orange-700";
  return "bg-gray-100 text-gray-600";
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "FR";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function acceptButtonLabel(status, isAccepting) {
  if (isAccepting) return "Accepting...";
  const normalized = String(status || "pending").toLowerCase();
  if (normalized === "pending") return "Accept";
  if (["approved", "accepted"].includes(normalized)) return "Accepted";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default function FundingRequests() {
  const [offers, setOffers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [acceptingId, setAcceptingId] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadFundingOffers() {
      try {
        setLoading(true);
        setError("");
        const data = await getInvestorFundingOffers();
        if (!ignore) {
          const startupRequests = Array.isArray(data.funding_offers)
            ? data.funding_offers.filter((offer) => String(offer.initiated_by || "startup").toLowerCase() === "startup")
            : [];
          setOffers(startupRequests);
        }
      } catch (err) {
        if (!ignore) setError(err.message || "Failed to load funding requests.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadFundingOffers();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleAcceptOffer(offerId) {
    try {
      setAcceptingId(offerId);
      setActionError("");
      const data = await acceptInvestorFundingOffer(offerId);
      const updatedOffer = data.offer || {};
      setOffers((currentOffers) =>
        currentOffers.map((offer) =>
          offer.investment_request_id === offerId
            ? { ...offer, ...updatedOffer, status: updatedOffer.status || "approved" }
            : offer,
        ),
      );
    } catch (err) {
      setActionError(err.message || "Failed to accept funding request.");
    } finally {
      setAcceptingId(null);
    }
  }

  const filteredOffers = useMemo(() => {
    const term = search.trim().toLowerCase();
    const items = offers.filter((offer) => {
      const matchesSearch = !term || [
        offer.startup_name,
        offer.project_title,
        offer.industry,
        offer.proposal_message,
      ].some((value) => String(value || "").toLowerCase().includes(term));

      const matchesStatus = statusFilter === "all" || String(offer.status || "pending").toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return [...items].sort((a, b) => {
      if (sort === "amount") return Number(b.requested_amount || 0) - Number(a.requested_amount || 0);
      if (sort === "oldest") return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [offers, search, statusFilter, sort]);

  const stats = useMemo(() => {
    const total = offers.length;
    const pending = offers.filter((offer) => String(offer.status || "pending").toLowerCase() === "pending").length;
    const approved = offers.filter((offer) => ["approved", "accepted"].includes(String(offer.status || "").toLowerCase())).length;
    const capital = offers
      .filter((offer) => ["approved", "accepted"].includes(String(offer.status || "").toLowerCase()))
      .reduce((sum, offer) => sum + Number(offer.requested_amount || 0), 0);
    const requested = offers.reduce((sum, offer) => sum + Number(offer.requested_amount || 0), 0);
    const average = total ? requested / total : 0;
    return { total, pending, approved, capital, average };
  }, [offers]);

  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans text-gray-900 overflow-hidden">
      <Sidebar />

      <div className="flex-grow flex flex-col overflow-hidden bg-white">
        <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 px-6 lg:px-8 py-4 bg-white border-b border-gray-100 z-10 shrink-0">
          <div className="relative w-full max-w-[500px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Search funding requests..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm outline-none focus:border-[#0a4d3c]/30 focus:ring-2 focus:ring-[#0a4d3c]/10 transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <Link href="/investor/offers/new" className="px-5 py-2 bg-[#0a4d3c] text-white text-sm font-bold rounded-lg hover:bg-[#07382b] transition shadow-sm">
              Create Offer
            </Link>
            <div className="w-8 h-8 rounded-full bg-[#0a4d3c] text-white shrink-0 flex items-center justify-center text-xs font-black">
              IN
            </div>
          </div>
        </header>

        <main className="flex-grow flex flex-col overflow-y-auto bg-[#f8f9fa] relative">
          <div className="p-6 lg:p-10 max-w-[1200px] mx-auto flex flex-col w-full flex-grow">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Funding Requests</h1>
                <p className="text-gray-500 text-[15px]">Review investment requests sent by startups and accept the ones you want to fund.</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none hover:bg-gray-50 transition shadow-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none hover:bg-gray-50 transition shadow-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="amount">Amount</option>
                </select>
              </div>
            </div>

            {actionError && (
              <div className="mb-5 bg-red-50 border border-red-100 rounded-xl p-4 text-sm font-semibold text-red-700">
                {actionError}
              </div>
            )}

            {loading ? (
              <div className="bg-white border border-gray-100 rounded-xl p-10 text-center text-gray-500 font-semibold shadow-sm">
                Loading funding requests...
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-100 rounded-xl p-8 text-center shadow-sm">
                <p className="text-sm font-bold text-red-700 mb-4">{error}</p>
                <button onClick={() => window.location.reload()} className="px-5 py-2 bg-white border border-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-100 transition">
                  Retry
                </button>
              </div>
            ) : filteredOffers.length ? (
              <div className="flex flex-col gap-5 mb-12">
                {filteredOffers.map((offer) => {
                  const status = offer.status || "pending";
                  const isPending = String(status).toLowerCase() === "pending";
                  return (
                    <div key={offer.investment_request_id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition">
                      <div className="flex items-start gap-6 min-w-0">
                        <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center shrink-0 text-[#0a4d3c] font-black">
                          {initials(offer.startup_name)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-1">
                            <h3 className="text-[17px] font-bold text-gray-900">{offer.startup_name || "Startup"}</h3>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${stageStyle(offer.business_stage)}`}>
                              {offer.business_stage || "Stage not set"}
                            </span>
                            <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${statusStyle(status)}`}>
                              {status}
                            </span>
                          </div>
                          <h4 className="text-[13px] font-bold text-[#0a4d3c] mb-2">{offer.project_title || "Startup project"}</h4>
                          <p className="text-[13px] text-gray-500 mb-4 max-w-2xl line-clamp-2">
                            {offer.proposal_message || "No proposal message was added to this funding request."}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold">
                            <span className="flex items-center gap-1.5 text-gray-400">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              Submitted {formatDate(offer.created_at)}
                            </span>
                            {offer.industry && <span className="text-gray-400">{offer.industry}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-start md:items-end shrink-0 md:pl-6 md:border-l border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Requested Amount</p>
                        <p className="text-2xl font-bold text-gray-900 mb-6">{formatCurrency(offer.requested_amount)}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/investor/discover/profile?startupId=${offer.startup_id}`} className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50 transition">
                            View Startup
                          </Link>
                          <Link href={`/investor/messages?startupId=${offer.startup_id}`} className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50 transition">
                            Negotiate
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleAcceptOffer(offer.investment_request_id)}
                            disabled={!isPending || acceptingId === offer.investment_request_id}
                            className="px-4 py-2 bg-[#0a4d3c] text-white text-xs font-bold rounded-lg hover:bg-[#07382b] transition disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                          >
                            {acceptButtonLabel(status, acceptingId === offer.investment_request_id)}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-xl p-10 text-center shadow-sm mb-12">
                <h2 className="text-lg font-bold text-gray-900 mb-2">No startup requests found</h2>
                <p className="text-sm text-gray-500 mb-5">Startup-sent requests will appear here. Use Offers to manage proposals you sent.</p>
                <Link href="/investor/discover" className="inline-flex px-5 py-2.5 bg-[#0a4d3c] text-white text-xs font-bold rounded-lg hover:bg-[#07382b] transition">
                  Discover Startups
                </Link>
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Total Requests</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Pending Review</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Approved</p>
                <p className="text-3xl font-bold text-gray-900">{stats.approved}</p>
              </div>
              <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Avg. Request</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.average)}</p>
              </div>
            </div>
          </div>

          <footer className="mt-auto border-t border-gray-200 py-6 px-10 flex flex-col md:flex-row justify-between items-center text-[11px] text-gray-500 font-medium bg-white shrink-0">
            <div className="flex gap-6 mb-4 md:mb-0">
              <Link href="#" className="hover:text-gray-900 transition">Privacy Policy</Link>
              <Link href="#" className="hover:text-gray-900 transition">Investor Agreement</Link>
              <Link href="#" className="hover:text-gray-900 transition">Help Center</Link>
            </div>
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              System Status: Fully Operational
            </div>
            <div>© 2026 StartupConnect Investor Portal. All Rights Reserved.</div>
          </footer>
        </main>
      </div>
    </div>
  );
}
