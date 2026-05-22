"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/investor/Sidebar";
import {
  getInvestorFundingOffers,
  withdrawInvestorFundingOffer,
} from "@/lib/investorApi";

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

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "OF";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function statusLabel(status = "pending") {
  const normalized = String(status || "pending").toLowerCase();
  if (["approved", "accepted"].includes(normalized)) return "Accepted";
  if (normalized === "withdrawn") return "Cancelled";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function statusClass(status = "pending") {
  const normalized = String(status || "pending").toLowerCase();
  if (["approved", "accepted"].includes(normalized)) return "bg-green-50 text-green-700 border-green-100";
  if (["rejected", "withdrawn"].includes(normalized)) return "bg-red-50 text-red-700 border-red-100";
  return "bg-yellow-50 text-yellow-700 border-yellow-100";
}

function avatarClass(industry = "") {
  const normalized = industry.toLowerCase();
  if (normalized.includes("fin")) return "bg-blue-100 text-blue-700";
  if (normalized.includes("agri")) return "bg-green-100 text-green-700";
  if (normalized.includes("health")) return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
}

const tabs = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
  { key: "withdrawn", label: "Cancelled" },
];

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [withdrawingId, setWithdrawingId] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadOffers() {
      try {
        setLoading(true);
        setError("");
        const data = await getInvestorFundingOffers();
        if (!ignore) setOffers(Array.isArray(data.funding_offers) ? data.funding_offers : []);
      } catch (err) {
        if (!ignore) setError(err.message || "Failed to load investment offers.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadOffers();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleWithdrawOffer(offerId) {
    try {
      setWithdrawingId(offerId);
      setActionError("");
      const data = await withdrawInvestorFundingOffer(offerId);
      const updatedOffer = data.offer || {};
      setOffers((currentOffers) =>
        currentOffers.map((offer) =>
          offer.investment_request_id === offerId
            ? { ...offer, ...updatedOffer, status: updatedOffer.status || "withdrawn" }
            : offer,
        ),
      );
    } catch (err) {
      setActionError(err.message || "Failed to cancel offer.");
    } finally {
      setWithdrawingId(null);
    }
  }

  const filteredOffers = useMemo(() => {
    const term = search.trim().toLowerCase();
    const items = offers.filter((offer) => {
      const status = String(offer.status || "pending").toLowerCase();
      const matchesTab = activeTab === "all"
        || (activeTab === "approved"
          ? ["approved", "accepted"].includes(status)
          : status === activeTab);
      const matchesSearch = !term || [
        offer.startup_name,
        offer.project_title,
        offer.industry,
        offer.proposal_message,
      ].some((value) => String(value || "").toLowerCase().includes(term));
      return matchesTab && matchesSearch;
    });

    return [...items].sort((a, b) => {
      if (sort === "amount") return Number(b.requested_amount || 0) - Number(a.requested_amount || 0);
      if (sort === "oldest") return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [activeTab, offers, search, sort]);

  const stats = useMemo(() => {
    const accepted = offers.filter((offer) => ["approved", "accepted"].includes(String(offer.status || "").toLowerCase()));
    const pending = offers.filter((offer) => String(offer.status || "pending").toLowerCase() === "pending");
    const totalCommitted = accepted.reduce((sum, offer) => sum + Number(offer.requested_amount || 0), 0);
    const totalOffered = offers.reduce((sum, offer) => sum + Number(offer.requested_amount || 0), 0);
    const conversion = offers.length ? Math.round((accepted.length / offers.length) * 1000) / 10 : 0;
    const average = offers.length ? totalOffered / offers.length : 0;
    return {
      total: offers.length,
      accepted: accepted.length,
      pending: pending.length,
      totalCommitted,
      conversion,
      average,
    };
  }, [offers]);

  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans text-gray-900 overflow-hidden">
      <Sidebar />

      <div className="flex-grow flex flex-col overflow-hidden bg-[#f8f9fa]">
        <header className="flex justify-between items-center px-6 lg:px-10 py-5 bg-[#f8f9fa] z-10 shrink-0">
          <div className="text-lg font-bold text-[#0a4d3c]">Investor Portal</div>
        </header>

        <main className="flex-grow flex flex-col overflow-y-auto">
          <div className="p-6 lg:p-8 max-w-[1100px] w-full mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">Investment Offers</h1>
              <p className="text-gray-500 text-[15px]">Manage and track your submitted investment proposals.</p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <label htmlFor="offer-status-filter" className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Status
                </label>
                <select
                  id="offer-status-filter"
                  value={activeTab}
                  onChange={(event) => setActiveTab(event.target.value)}
                  className="min-w-36 px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none hover:bg-gray-50 focus:border-[#0a4d3c]/30 focus:ring-2 focus:ring-[#0a4d3c]/10 transition shadow-sm"
                >
                  {tabs.map((tab) => (
                    <option key={tab.key} value={tab.key}>
                      {tab.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Filter startups..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0a4d3c]/30 focus:ring-2 focus:ring-[#0a4d3c]/10 transition shadow-sm"
                  />
                </div>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none hover:bg-gray-50 transition shadow-sm"
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

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-8 overflow-hidden">
              {loading ? (
                <div className="p-10 text-center text-gray-500 font-semibold">Loading investment offers...</div>
              ) : error ? (
                <div className="p-10 text-center">
                  <p className="text-sm font-bold text-red-700 mb-4">{error}</p>
                  <button onClick={() => window.location.reload()} className="px-5 py-2 bg-white border border-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-50 transition">
                    Retry
                  </button>
                </div>
              ) : filteredOffers.length ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-[11px] font-bold text-gray-500 tracking-wider">
                          <th className="px-6 py-4">Startup</th>
                          <th className="px-6 py-4">Project</th>
                          <th className="px-6 py-4">Investment Amount</th>
                          <th className="px-6 py-4">Date Sent</th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredOffers.map((offer) => {
                          const status = String(offer.status || "pending").toLowerCase();
                          const canCancel = status === "pending";
                          return (
                            <tr key={offer.investment_request_id} className="hover:bg-gray-50 transition">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[13px] font-bold ${avatarClass(offer.industry)}`}>
                                    {initials(offer.startup_name)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-900">{offer.startup_name || "Startup"}</p>
                                    <p className="text-xs text-gray-500">{offer.industry || "Industry not set"} - {offer.business_stage || "Stage not set"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 max-w-[280px]">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <p className="text-sm font-bold text-[#0a4d3c]">{offer.project_title || "Startup project"}</p>
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border text-[10px] font-bold rounded-full ${statusClass(status)}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                    {statusLabel(status)}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2">
                                  {offer.proposal_message || "No proposal message was added."}
                                </p>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-600">{formatCurrency(offer.requested_amount)}</td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-600">{formatDate(offer.created_at)}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <Link href={`/investor/discover/profile?startupId=${offer.startup_id}`} className="px-4 py-2 border border-gray-200 text-gray-600 bg-white text-xs font-bold rounded-lg hover:bg-gray-50 transition shadow-sm">
                                    View
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => handleWithdrawOffer(offer.investment_request_id)}
                                    disabled={!canCancel || withdrawingId === offer.investment_request_id}
                                    className="px-4 py-2 border border-red-200 text-red-600 bg-white text-xs font-bold rounded-lg hover:bg-red-50 transition shadow-sm disabled:border-gray-200 disabled:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                                  >
                                    {withdrawingId === offer.investment_request_id ? "Cancelling..." : canCancel ? "Cancel Offer" : "Closed"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-white">
                    <p className="text-sm text-gray-500 font-medium">
                      Showing {filteredOffers.length} of {offers.length} offers
                    </p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      {stats.pending} pending / {stats.accepted} accepted
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-10 text-center">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">No offers found</h2>
                  <p className="text-sm text-gray-500 mb-5">Create a new offer or change your filters.</p>
                  <Link href="/investor/discover" className="inline-flex px-5 py-2.5 bg-[#0a4d3c] text-white text-xs font-bold rounded-lg hover:bg-[#07382b] transition">
                    Discover Startups
                  </Link>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm lg:col-span-2">
                <h3 className="text-[17px] font-bold text-gray-900 mb-8 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#d1f4e0] flex items-center justify-center text-[#0a4d3c]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                  </div>
                  Pipeline Health
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Total Offers</p>
                    <p className="text-3xl font-bold text-gray-900 mb-2">{stats.total}</p>
                    <p className="text-xs font-bold text-[#0a4d3c]">{stats.pending} pending</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Total Committed</p>
                    <p className="text-3xl font-bold text-gray-900 mb-3">{formatCurrency(stats.totalCommitted)}</p>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#0a4d3c] rounded-full" style={{ width: `${Math.min(100, stats.conversion)}%` }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Conversion Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mb-2">{stats.conversion}%</p>
                    <p className="text-xs font-bold text-[#0a4d3c]">Accepted offers</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Average Deal Size</p>
                    <p className="text-3xl font-bold text-gray-900 mb-2">{formatCurrency(stats.average)}</p>
                    <p className="text-[11px] font-medium text-gray-500">per investment offer</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#0a3a2e] rounded-xl p-8 shadow-md flex flex-col justify-center text-white relative overflow-hidden lg:col-span-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-8 -mb-8" />
                <div className="relative z-10">
                  <h3 className="text-[22px] font-bold mb-3 tracking-tight">New Proposal?</h3>
                  <p className="text-green-50 text-[13px] opacity-80 leading-relaxed mb-8">
                    Send a new investment proposal to an approved startup.
                  </p>
                  <Link href="/investor/offers/new" className="w-full py-3.5 bg-white text-[#0a3a2e] text-sm font-bold rounded-lg hover:bg-gray-50 transition shadow-sm flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Create New Offer
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
