"use client";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/startup/Sidebar";
import { getStartupOffers } from "@/lib/startupApi";
import { formatFolderLabel } from "@/lib/offerUtils";

export default function StartupOffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  async function fetchOffers() {
    try {
      setLoading(true);
      setError(null);
      const response = await getStartupOffers();
      setOffers(response.offers || []);
    } catch (err) {
      console.error("Failed to fetch offers:", err);
      setError("Failed to load offers. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const filteredOffers = useMemo(() => {
    if (filter === "startup-investor") {
      return offers.filter((offer) => offer.offerType === "investment" && offer.source_direction === "sent");
    }
    if (filter === "startup-mentor") {
      return offers.filter((offer) => offer.offerType === "mentorship" && offer.source_direction === "sent");
    }
    if (filter === "investor") {
      return offers.filter((offer) => offer.offerType === "investment" && offer.source_direction === "incoming");
    }
    if (filter === "mentor") {
      return offers.filter((offer) => offer.offerType === "mentorship" && offer.source_direction === "incoming");
    }
    return offers;
  }, [filter, offers]);

  const counts = useMemo(
    () => ({
      total: offers.length,
      pending: offers.filter((offer) => offer.status === "pending").length,
      accepted: offers.filter((offer) => ["accepted", "approved"].includes(offer.status)).length,
      rejected: offers.filter((offer) => offer.status === "rejected").length,
      startupInvestors: offers.filter((offer) => offer.offerType === "investment" && offer.source_direction === "sent").length,
      startupMentors: offers.filter((offer) => offer.offerType === "mentorship" && offer.source_direction === "sent").length,
      investorOffers: offers.filter((offer) => offer.offerType === "investment" && offer.source_direction === "incoming").length,
      mentorOffers: offers.filter((offer) => offer.offerType === "mentorship" && offer.source_direction === "incoming").length,
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

  function getStatusColor(status = "") {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "approved":
      case "accepted":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      case "withdrawn":
      case "cancelled":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  }

  function formatStatus(status) {
    if (status === "approved") return "accepted";
    return status || "unknown";
  }

  function getDirectionColor(offer) {
    if (offer.offerType === "investment" && offer.source_direction === "incoming") {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    if (offer.offerType === "mentorship" && offer.source_direction === "incoming") {
      return "bg-violet-50 text-violet-700 border-violet-200";
    }
    if (offer.offerType === "investment") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (offer.offerType === "mentorship") {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-gray-50 text-gray-700 border-gray-200";
  }

  function getRowStyle(offer) {
    if (offer.offerType === "investment" && offer.source_direction === "incoming") {
      return "border-l-blue-500 bg-blue-50/45 hover:bg-blue-50";
    }
    if (offer.offerType === "mentorship" && offer.source_direction === "incoming") {
      return "border-l-violet-500 bg-violet-50/45 hover:bg-violet-50";
    }
    if (offer.offerType === "investment") {
      return "border-l-emerald-500 bg-emerald-50/45 hover:bg-emerald-50";
    }
    if (offer.offerType === "mentorship") {
      return "border-l-amber-500 bg-amber-50/45 hover:bg-amber-50";
    }
    return "border-l-gray-300 bg-white hover:bg-gray-50";
  }

  function getDirectionLabel(offer) {
    if (offer.offerType === "investment" && offer.source_direction === "incoming") {
      return "Investor sent to startup";
    }
    if (offer.offerType === "mentorship" && offer.source_direction === "incoming") {
      return "Mentor sent to startup";
    }
    if (offer.offerType === "investment") {
      return "Startup sent to investor";
    }
    if (offer.offerType === "mentorship") {
      return "Startup sent to mentor";
    }
    return offer.source_label || "Offer activity";
  }

  function getOfferName(offer) {
    return `${offer.first_name || ""} ${offer.last_name || ""}`.trim() || "Unknown contact";
  }

  function getOfferSubtitle(offer) {
    return offer.company || offer.headline || offer.professional_title || offer.project_title || "No organization details";
  }

  const filters = [
    { key: "all", label: "All", count: counts.total },
    { key: "startup-investor", label: "Startup to investors", count: counts.startupInvestors },
    { key: "startup-mentor", label: "Startup to mentors", count: counts.startupMentors },
    { key: "investor", label: "Investors to startup", count: counts.investorOffers },
    { key: "mentor", label: "Mentors to startup", count: counts.mentorOffers },
  ];

  return (
    <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow overflow-y-auto">
        <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-8 py-8">
          <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0f3d32]">Startup offers</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">Offers and requests</h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-500">
                Separate requests sent by your startup from offers sent by investors and mentors.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/startup/discover"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                Discovery
              </Link>
              <Link
                href="/startup/mentorship"
                className="inline-flex items-center justify-center rounded-lg bg-[#0f3d32] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b2f26]"
              >
                Mentor Chat
              </Link>
            </div>
          </header>

          <section className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total</p>
              <p className="mt-1 text-2xl font-bold text-gray-950">{counts.total}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pending</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">{counts.pending}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Resolved</p>
              <p className="mt-1 text-2xl font-bold text-[#0f3d32]">{counts.accepted + counts.rejected}</p>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-950">Offer activity</h2>
                  <p className="mt-1 text-sm text-gray-500">{filteredOffers.length} records in this view</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFilter(item.key)}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        filter === item.key
                          ? "bg-[#0f3d32] text-white"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {item.label} <span className={filter === item.key ? "text-white/75" : "text-gray-400"}>{item.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="px-5 py-12 text-center text-sm text-gray-500">Loading offers...</div>
            ) : error ? (
              <div className="px-5 py-12 text-center text-sm text-red-600">{error}</div>
            ) : filteredOffers.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-semibold text-gray-700">No records found</p>
                <p className="mt-1 text-sm text-gray-500">This filter has no real offers or requests yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredOffers.map((offer) => (
                  <Link
                    key={`${offer.offerType}-${offer.id}`}
                    href={`/startup/offers/${offer.offerType}/${offer.id}`}
                    className={`grid gap-5 border-l-4 px-6 py-5 transition lg:grid-cols-[1.25fr_1fr_auto] lg:items-center ${getRowStyle(offer)}`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-[#0f3d32]">
                          {offer.type}
                        </span>
                        <span className={`rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${getDirectionColor(offer)}`}>
                          {getDirectionLabel(offer)}
                        </span>
                        <span className={`rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${getStatusColor(offer.status)}`}>
                          {formatStatus(offer.status)}
                        </span>
                      </div>
                      <h3 className="mt-3 truncate text-base font-bold text-gray-950">{getOfferName(offer)}</h3>
                      <p className="mt-1 truncate text-sm text-gray-500">{getOfferSubtitle(offer)}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                        {offer.offerType === "investment" && offer.project_title && (
                          <span className="rounded-md bg-white/80 px-2 py-1">Project: {offer.project_title}</span>
                        )}
                        {offer.offerType === "mentorship" && offer.subject && (
                          <span className="rounded-md bg-white/80 px-2 py-1">{offer.subject}</span>
                        )}
                        {offer.preferred_industry && (
                          <span className="rounded-md bg-white/80 px-2 py-1">{offer.preferred_industry}</span>
                        )}
                        {offer.expertise && (
                          <span className="rounded-md bg-white/80 px-2 py-1">{offer.expertise}</span>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0">
                      {offer.offerType === "investment" ? (
                        <p className="text-sm font-bold text-[#0f3d32]">{formatAmount(offer.amount)}</p>
                      ) : (
                        <p className="text-sm font-bold text-violet-700">Mentorship request</p>
                      )}
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                        {offer.message || offer.terms || "No message provided"}
                      </p>
                      {offer.document_count > 0 && (
                        <p className="mt-2 text-xs font-semibold text-gray-600">
                          {offer.document_count} shared file{offer.document_count === 1 ? "" : "s"}
                          {offer.document_folders?.length
                            ? ` in ${offer.document_folders.map((folder) => formatFolderLabel(folder.folder)).join(", ")}`
                            : ""}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-4 lg:justify-end">
                      <p className="text-sm text-gray-500">{formatDate(offer.created_at)}</p>
                      <span className="text-sm font-bold text-[#0f3d32]">View</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
