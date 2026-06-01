"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/investor/Sidebar";
import ActorAvatar from "@/components/auth/ActorAvatar";
import { getInvestorRecommendations } from "@/lib/investorApi";

function formatMoney(value) {
  const amount = Number(value || 0);
  if (!amount) return "Not set";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatBudgetRange(preferences) {
  const maximum = formatMoney(preferences?.investment_budget);
  if (maximum === "Not set") return maximum;
  const minimum = formatMoney(preferences?.investment_budget_min);
  return `${minimum === "Not set" ? "$0" : minimum} - ${maximum}`;
}

function RecommendationSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5 h-4 w-24 animate-pulse rounded bg-gray-100" />
      <div className="mb-3 h-6 w-2/3 animate-pulse rounded bg-gray-100" />
      <div className="mb-2 h-3 w-full animate-pulse rounded bg-gray-100" />
      <div className="mb-6 h-3 w-5/6 animate-pulse rounded bg-gray-100" />
      <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
    </div>
  );
}

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRecommendations() {
    setLoading(true);
    setError("");
    try {
      const data = await getInvestorRecommendations({ limit: 12 });
      setRecommendations(Array.isArray(data?.recommendations) ? data.recommendations : []);
      setPreferences(data?.investor_preferences || null);
    } catch (err) {
      setError(err?.message || "Could not load recommendations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(loadRecommendations);
  }, []);

  const filteredRecommendations = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return recommendations;
    return recommendations.filter((item) => {
      const startup = item.startup || {};
      const project = item.project || {};
      return [
        startup.startup_name,
        startup.industry,
        startup.business_stage,
        startup.location,
        startup.description,
        project.project_title,
        project.industry,
      ].some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [recommendations, search]);

  return (
    <div className="flex min-h-screen bg-white font-sans text-gray-900">
      <Sidebar />

      <main className="flex-1 overflow-y-auto px-4 pb-10 pt-24 md:ml-0 md:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">AI Recommendations</h1>
              <p className="mt-2 text-sm text-gray-500">
                Startups ranked from your investor profile, preferred industry, stage, budget, and project details.
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
                placeholder="Search recommended startups..."
                className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#0a4d3c]/40 focus:ring-2 focus:ring-[#0a4d3c]/10"
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-600">
              {preferences?.preferred_industry ? <span className="rounded-full bg-white px-3 py-2">Industry: {preferences.preferred_industry}</span> : null}
              {preferences?.investment_stage ? <span className="rounded-full bg-white px-3 py-2">Stage: {preferences.investment_stage}</span> : null}
              {preferences?.investment_budget ? <span className="rounded-full bg-white px-3 py-2">Budget: {formatBudgetRange(preferences)}</span> : null}
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">{error}</div>
          ) : null}

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => <RecommendationSkeleton key={index} />)}
            </div>
          ) : null}

          {!loading && !error && filteredRecommendations.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-10 text-center">
              <h2 className="text-lg font-bold text-gray-900">No recommendations found</h2>
              <p className="mt-2 text-sm text-gray-500">Update your investor profile or clear the search to see more matches.</p>
            </div>
          ) : null}

          {!loading && !error && filteredRecommendations.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredRecommendations.map((item) => {
                const startup = item.startup || {};
                const project = item.project || {};
                const reasons = Array.isArray(item.reasons) ? item.reasons : [];
                const profileHref = `/investor/discover/profile?startupId=${startup.startup_id}`;

                return (
                  <article key={`${startup.startup_id}-${project.project_id || "startup"}`} className="flex min-h-[320px] flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <span className="rounded-full bg-[#e9f7ef] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#0a4d3c]">
                        {project.industry || startup.industry || "Startup"}
                      </span>
                      <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-white">
                        {item.match_percent || Math.round((item.score || 0) * 100)}% match
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <ActorAvatar role="startup" profileId={startup.startup_id} initials={(startup.startup_name || "S").slice(0, 2).toUpperCase()} className="h-11 w-11 shrink-0 rounded-xl" alt={startup.startup_name || "Startup"} />
                      <h2 className="text-xl font-bold text-gray-900">{startup.startup_name || "Startup"}</h2>
                    </div>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {project.lifecycle_stage || startup.business_stage || "Stage not set"}
                    </p>
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600">
                      {project.description || startup.description || item.reason}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Funding</p>
                        <p className="mt-1 font-bold text-gray-900">{formatMoney(project.funding_goal || startup.funding_needed)}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Location</p>
                        <p className="mt-1 truncate font-bold text-gray-900">{startup.location || "Not set"}</p>
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

                    <Link
                      href={profileHref}
                      className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[#0a4d3c] px-4 text-sm font-bold text-white transition hover:bg-[#07382b]"
                    >
                      View Profile
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
