"use client";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/startup/Sidebar";
import { getStartupOffers } from "@/lib/startupApi";

export default function StartupOffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOffers();
  }, [filter]);

  async function fetchOffers() {
    try {
      setLoading(true);
      setError(null);
      const params = filter === "all" ? {} : { type: filter };
      const response = await getStartupOffers(params);
      setOffers(response.offers || []);
    } catch (err) {
      console.error("Failed to fetch offers:", err);
      setError("Failed to load offers. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const counts = useMemo(
    () => ({
      total: offers.length,
      pending: offers.filter((offer) => offer.status === "pending").length,
      accepted: offers.filter((offer) => offer.status === "accepted").length,
      rejected: offers.filter((offer) => offer.status === "rejected").length,
    }),
    [offers],
  );

  function formatAmount(amount) {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  }

  function getStatusColor(status) {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-[#fef3c7] text-[#92400e]";
      case "accepted":
        return "bg-[#dcfce7] text-[#166534]";
      case "rejected":
        return "bg-[#fee2e2] text-[#991b1b]";
      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7f9] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto">
        <header className="px-4 sm:px-8 py-8 bg-gradient-to-r from-[#0f3d32] via-[#115b4c] to-[#184f45] text-white sticky top-0 z-10 shadow-sm">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-[#b8f0d9]">Startup offers</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">Offers from investors & mentors</h1>
              <p className="mt-3 max-w-2xl text-sm text-[#d2f8e3]">
                Review offers, inspect the details, and accept or reject with confidence.
              </p>
            </div>
            <div className="inline-flex flex-wrap gap-3">
              <Link
                href="/startup/discover"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Back to discovery
              </Link>
              <Link
                href="/startup/mentorship"
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0f3d32] transition hover:bg-[#f0faf5]"
              >
                Manage mentorship
              </Link>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-10 py-10 w-full max-w-[1400px] mx-auto pb-24">
          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-500">Total offers</p>
                <p className="mt-3 text-4xl font-bold text-gray-900">{counts.total}</p>
              </div>
              <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-500">Pending</p>
                <p className="mt-3 text-4xl font-bold text-[#d97706]">{counts.pending}</p>
              </div>
              <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-500">Resolved</p>
                <p className="mt-3 text-4xl font-bold text-[#0f3d32]">{counts.accepted + counts.rejected}</p>
              </div>
            </div>

            <div className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-400">Offer queue</p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900">Review incoming investor and mentor offers</h2>
                </div>
                <div className="flex gap-2">
                  {["all", "investor", "mentor"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                        filter === f
                          ? "bg-[#0f3d32] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading offers...</div>
              ) : error ? (
                <div className="text-center py-12 text-red-500">{error}</div>
              ) : offers.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-gray-300 bg-[#fcfdfd] p-10 text-center text-sm text-gray-600">
                  No offers available yet.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {offers.map((offer) => (
                    <Link
                      key={`${offer.offerType}-${offer.id}`}
                      href={`/startup/offers/${offer.offerType}/${offer.id}`}
                      className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-[#0f3d32] transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#ecfdf3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0f3d32]">
                            {offer.type}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${getStatusColor(offer.status)}`}>
                            {offer.status}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {offer.first_name} {offer.last_name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">
                        {offer.company || offer.headline || offer.professional_title || "N/A"}
                      </p>
                      
                      {offer.offerType === "investment" && offer.amount && (
                        <p className="text-2xl font-bold text-[#0f3d32] mb-2">
                          {formatAmount(offer.amount)}
                        </p>
                      )}
                      
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {offer.message || offer.terms || "No message provided"}
                      </p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          {formatDate(offer.created_at)}
                        </p>
                        <span className="text-sm font-semibold text-[#0f3d32] group-hover:underline">
                          View details →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
