"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/startup/Sidebar";
import { searchInvestors, getStartupOffers } from "@/lib/startupApi";
import { buildSentOfferLookup, getSentInvestorOffer } from "@/lib/offerUtils";
import DiscoverOfferButton from "@/components/startup/DiscoverOfferButton";

export default function InvestorDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { investorId } = params;
  
  const [investor, setInvestor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offerLookup, setOfferLookup] = useState({ investors: new Map(), mentors: new Map() });

  useEffect(() => {
    fetchInvestorDetails();
  }, [investorId]);

  async function fetchInvestorDetails() {
    try {
      setLoading(true);
      setError(null);
      const [response, offersData] = await Promise.all([
        searchInvestors({ query: "" }),
        getStartupOffers().catch(() => ({ offers: [] })),
      ]);
      setOfferLookup(buildSentOfferLookup(offersData.offers || []));
      const foundInvestor = response.investors?.find(i => i.investor_id === parseInt(investorId));
      if (foundInvestor) {
        setInvestor(foundInvestor);
      } else {
        setError("Investor not found");
      }
    } catch (err) {
      console.error("Failed to fetch investor details:", err);
      setError("Failed to load investor details. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7f9] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f3d32] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading investor details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !investor) {
    return (
      <div className="min-h-screen bg-[#f4f7f9] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || "Investor not found"}</p>
            <Link
              href="/startup/discover"
              className="inline-flex items-center justify-center rounded-full bg-[#0f3d32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0b2a1d]"
            >
              Back to Discover
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f9] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto">
        <header className="px-4 sm:px-8 py-8 bg-gradient-to-r from-[#0f3d32] via-[#115b4c] to-[#184f45] text-white sticky top-0 z-10 shadow-sm">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-[#b8f0d9]">Investor details</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">
                {investor.organization_name || `${investor.first_name} ${investor.last_name}`}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-[#d2f8e3]">
                {investor.industry || investor.sector || "Investor focused on supporting innovative startups"}
              </p>
            </div>
            <Link
              href="/startup/discover"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              ← Back to discover
            </Link>
          </div>
        </header>

        <div className="px-4 sm:px-10 py-10 w-full max-w-[1200px] mx-auto pb-24">
          <div className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="rounded-full bg-[#effaf4] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#0f3d32]">
                    Investor
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {investor.organization_name || `${investor.first_name} ${investor.last_name}`}
                </h2>
                <p className="mt-2 text-lg text-gray-600">
                  {investor.industry || investor.sector || "N/A"}
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="rounded-[24px] bg-[#f8fafc] p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Name</p>
                    <p className="mt-1 text-sm text-gray-900">{investor.organization_name || `${investor.first_name} ${investor.last_name}`}</p>
                  </div>
                  {investor.email && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Email</p>
                      <p className="mt-1 text-sm text-gray-900">{investor.email}</p>
                    </div>
                  )}
                  {investor.location && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Location</p>
                      <p className="mt-1 text-sm text-gray-900">{investor.location}</p>
                    </div>
                  )}
                  {investor.country && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Country</p>
                      <p className="mt-1 text-sm text-gray-900">{investor.country}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] bg-[#f8fafc] p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Details</h3>
                <div className="space-y-3">
                  {investor.investor_type && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Investor Type</p>
                      <p className="mt-1 text-sm text-gray-900">{investor.investor_type}</p>
                    </div>
                  )}
                  {investor.investment_budget && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Investment Budget</p>
                      <p className="mt-1 text-sm text-gray-900">${investor.investment_budget}</p>
                    </div>
                  )}
                  {investor.investment_range && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Investment Range</p>
                      <p className="mt-1 text-sm text-gray-900">{investor.investment_range}</p>
                    </div>
                  )}
                  {investor.preferred_industry && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Preferred Industry</p>
                      <p className="mt-1 text-sm text-gray-900">{investor.preferred_industry}</p>
                    </div>
                  )}
                  {investor.investment_stage && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Investment Stage</p>
                      <p className="mt-1 text-sm text-gray-900">{investor.investment_stage}</p>
                    </div>
                  )}
                  {investor.portfolio_size && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Portfolio Size</p>
                      <p className="mt-1 text-sm text-gray-900">{investor.portfolio_size} companies</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {investor.bio && (
              <div className="rounded-[24px] border border-gray-200 bg-[#f9fafb] p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About Investor</h3>
                <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                  {investor.bio}
                </p>
              </div>
            )}

            {getSentInvestorOffer(offerLookup, investorId) && (
              <div className="rounded-[24px] border border-[#cfe8dc] bg-[#f0faf5] p-5 mb-8 text-sm text-[#0f3d32]">
                You already sent an investment request to this investor. You can track it from your offers page.
              </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-gray-200">
              <div className="flex gap-3">
                <DiscoverOfferButton
                  type="investment"
                  contactId={investorId}
                  offerLookup={offerLookup}
                  variant="primary"
                />
                <Link
                  href="/startup/chat"
                  className="inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-8 py-4 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                >
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
