"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/startup/Sidebar";
import StartupProfileMenu from "@/components/startup/StartupProfileMenu";
import { getInvestorRecommendations, getMentorRecommendations } from "@/lib/startupApi";
import { formatTicketRange } from "@/lib/discoverProfileUtils";
import ActorAvatar from "@/components/auth/ActorAvatar";

function formatMoney(value) {
  const amount = Number(value || 0);
  if (!amount) return "Not set";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function LoadingCard() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 h-4 w-24 animate-pulse rounded bg-gray-100" />
      <div className="mb-3 h-6 w-2/3 animate-pulse rounded bg-gray-100" />
      <div className="mb-2 h-3 w-full animate-pulse rounded bg-gray-100" />
      <div className="mb-6 h-3 w-5/6 animate-pulse rounded bg-gray-100" />
      <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
    </div>
  );
}

export default function StartupRecommendationsPage() {
  const [investorRecommendations, setInvestorRecommendations] = useState([]);
  const [mentorRecommendations, setMentorRecommendations] = useState([]);
  const [startupProfile, setStartupProfile] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRecommendations() {
    setLoading(true);
    setError("");
    try {
      const [investorData, mentorData] = await Promise.all([
        getInvestorRecommendations({ limit: 12 }),
        getMentorRecommendations(),
      ]);
      setInvestorRecommendations(Array.isArray(investorData?.recommendations) ? investorData.recommendations : []);
      setMentorRecommendations(Array.isArray(mentorData?.recommendations) ? mentorData.recommendations : []);
      setStartupProfile(investorData?.startup_profile || null);
    } catch (err) {
      setError(err?.message || "Unable to load recommendations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(loadRecommendations);
  }, []);

  const filteredInvestors = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return investorRecommendations;
    return investorRecommendations.filter((item) => {
      const investor = item.investor || {};
      return [
        investor.organization_name,
        investor.first_name,
        investor.last_name,
        investor.preferred_industry,
        investor.investment_stage,
        investor.investor_type,
        investor.country,
        investor.bio,
      ].some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [investorRecommendations, search]);

  return (
    <div className="flex min-h-screen bg-white font-sans text-gray-900">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 flex justify-end border-b border-gray-100 bg-white px-4 py-3 sm:px-8">
          <StartupProfileMenu />
        </header>
        <div className="px-4 py-8 md:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">AI Recommendations</h1>
              <p className="mt-2 text-sm text-gray-500">
                Investors ranked from your startup profile, project, industry, stage, funding need, and location.
              </p>
            </div>
            <button
              type="button"
              onClick={loadRecommendations}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#0a4d3c] px-5 text-sm font-bold text-white transition hover:bg-[#07382b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Refresh
            </button>
          </div>

          <div className="mb-6 grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search recommended investors..."
                className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#0a4d3c]/40 focus:ring-2 focus:ring-[#0a4d3c]/10"
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-600">
              {startupProfile?.industry ? <span className="rounded-full bg-white px-3 py-2">Industry: {startupProfile.industry}</span> : null}
              {startupProfile?.stage ? <span className="rounded-full bg-white px-3 py-2">Stage: {startupProfile.stage}</span> : null}
              {startupProfile?.funding_need ? <span className="rounded-full bg-white px-3 py-2">Need: {formatMoney(startupProfile.funding_need)}</span> : null}
            </div>
          </div>

          {error ? (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">{error}</div>
          ) : null}

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => <LoadingCard key={index} />)}
            </div>
          ) : null}

          {!loading && !error ? (
            <div className="space-y-8">
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Recommended Investors</h2>
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-400">{filteredInvestors.length} matches</span>
                </div>

                {filteredInvestors.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-white p-10 text-center">
                    <h3 className="text-lg font-bold text-gray-900">No investor recommendations found</h3>
                    <p className="mt-2 text-sm text-gray-500">Update your startup/project profile or clear the search to see more matches.</p>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {filteredInvestors.map((item) => {
                      const investor = item.investor || {};
                      const name = investor.organization_name || `${investor.first_name || ""} ${investor.last_name || ""}`.trim() || "Investor";
                      const reasons = Array.isArray(item.reasons) ? item.reasons : [];
                      return (
                        <article key={investor.investor_id || name} className="flex min-h-[330px] flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <span className="rounded-full bg-[#e9f7ef] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#0a4d3c]">
                              {investor.preferred_industry || investor.investor_type || "Investor"}
                            </span>
                            <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-white">
                              {item.match_percent || Math.round((item.score || 0) * 100)}% match
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <ActorAvatar role="investor" profileId={investor.investor_id} initials={name.slice(0, 2).toUpperCase()} className="h-11 w-11 shrink-0 rounded-xl" alt={name} />
                            <h3 className="text-xl font-bold text-gray-900">{name}</h3>
                          </div>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                            {investor.investment_stage || "Stage not set"}
                          </p>
                          <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600">
                            {investor.bio || item.reason}
                          </p>

                          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-lg bg-gray-50 p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Budget</p>
                              <p className="mt-1 font-bold text-gray-900">{formatTicketRange(investor, "investor")}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Location</p>
                              <p className="mt-1 truncate font-bold text-gray-900">{investor.location_preference || investor.country || "Not set"}</p>
                            </div>
                          </div>

                          <div className="mt-5 flex-1 space-y-2">
                            {(reasons.length ? reasons : [item.reason]).slice(0, 3).map((reason) => (
                              <div key={reason} className="flex gap-2 text-xs text-gray-600">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0a4d3c]" />
                                <span>{reason}</span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-6 grid grid-cols-2 gap-3">
                            <Link
                              href={`/startup/discover/investor/${investor.investor_id}`}
                              className="inline-flex h-11 items-center justify-center rounded-lg border border-[#0a4d3c] px-4 text-sm font-bold text-[#0a4d3c] transition hover:bg-[#e9f7ef]"
                            >
                              View
                            </Link>
                            <button
                              type="button"
                              disabled
                              className="inline-flex h-11 items-center justify-center rounded-lg bg-gray-300 px-4 text-sm font-bold text-white"
                            >
                              Later
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Mentor Recommendations</h2>
                    <p className="mt-1 text-sm text-gray-500">{mentorRecommendations.length} mentor matches are available from the existing mentor engine.</p>
                  </div>
                  <Link href="/startup/chat?kind=mentor" className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-bold text-[#0a4d3c] ring-1 ring-gray-200 transition hover:bg-gray-100">
                    Open Mentorship
                  </Link>
                </div>
              </section>
            </div>
          ) : null}
        </div>
        </div>
      </main>
    </div>
  );
}
