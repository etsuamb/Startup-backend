"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/startup/Sidebar";
import StartupActionNotice from "@/components/startup/StartupActionNotice";
import StartupTopBar from "@/components/startup/StartupTopBar";
import {
  getStartupOffers,
  getStartupProfile,
  searchInvestors,
  searchMentors,
} from "@/lib/startupApi";
import { buildSentOfferLookup } from "@/lib/offerUtils";
import { isAccountGateError } from "@/lib/accountGate";
import DiscoverOfferButton from "@/components/startup/DiscoverOfferButton";
import { PendingApprovalBanner } from "@/components/startup/PendingApprovalNotice";
import { useStartupApproval } from "@/hooks/useStartupApproval";

function initials(name) {
  if (!name) return "??";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function fmtBudget(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

function investorName(investor) {
  return (
    investor.organization_name ||
    `${(investor.first_name || "").trim()} ${(investor.last_name || "").trim()}`.trim() ||
    "Investor"
  );
}

function mentorName(mentor) {
  return `${mentor.first_name || ""} ${mentor.last_name || ""}`.trim() || "Mentor";
}

function investorTags(investor) {
  const tags = [];
  if (investor.investor_type) tags.push(investor.investor_type);
  if (investor.investment_stage) tags.push(investor.investment_stage);
  if (tags.length === 0 && investor.preferred_industry) tags.push("STRATEGIC");
  return tags.slice(0, 3).map((t) => String(t).toUpperCase());
}

function isInvestorActive(investor) {
  return investor.user_approved !== false && investor.investor_listed !== false;
}

function isMentorActive(mentor) {
  return mentor.user_approved !== false && mentor.mentor_listed !== false;
}

function InvestorCard({ investor, offerLookup, approved }) {
  const name = investorName(investor);
  const location = investor.country || investor.location_preference || investor.location || "Ethiopia";
  const active = isInvestorActive(investor);
  const tags = investorTags(investor);
  const amount = investor.investment_budget || investor.investment_range;
  const sector = investor.preferred_industry || investor.industry || investor.sector || "—";
  const description =
    investor.bio ||
    investor.experience ||
    `Focuses on ${sector !== "—" ? sector : "early-stage"} opportunities across the region.`;

  return (
    <article className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-[#0f3d32] text-white flex items-center justify-center font-bold text-sm shrink-0">
            {initials(name)}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">{name}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {location}
            </p>
          </div>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-widest shrink-0 ${
            active ? "text-[#16a34a]" : "text-gray-400"
          }`}
        >
          {active ? "Active" : "Pending"}
        </span>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-bold uppercase tracking-wide text-[#1d4ed8] bg-[#eff6ff] px-2.5 py-1 rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Investment amount</p>
          <p className="mt-1 text-xl font-bold text-[#0f3d32]">{fmtBudget(amount)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Sector</p>
          <p className="mt-1 text-sm font-bold text-gray-900 line-clamp-2">{sector}</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 mb-5 flex-grow">{description}</p>

      <DiscoverOfferButton
        type="investment"
        contactId={investor.investor_id}
        offerLookup={offerLookup}
        variant="discover"
        disabled={!approved}
      />
    </article>
  );
}

function MentorCard({ mentor, offerLookup, approved }) {
  const name = mentorName(mentor);
  const location = mentor.location || mentor.country || mentor.city_location || "Ethiopia";
  const active = isMentorActive(mentor);
  const tags = [mentor.expertise, mentor.primary_industry, mentor.mentor_type]
    .filter(Boolean)
    .slice(0, 3)
    .map((t) => String(t).toUpperCase());
  const rate = mentor.hourly_rate || mentor.session_pricing;
  const sector = mentor.primary_industry || mentor.expertise || "—";
  const description =
    mentor.bio ||
    mentor.headline ||
    `Experienced mentor in ${sector !== "—" ? sector : "startup growth"}.`;

  return (
    <article className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-[#1d4ed8] text-white flex items-center justify-center font-bold text-sm shrink-0">
            {initials(name)}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">{name}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {location}
            </p>
          </div>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-widest shrink-0 ${
            active ? "text-[#16a34a]" : "text-gray-400"
          }`}
        >
          {active ? "Active" : "Pending"}
        </span>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-bold uppercase tracking-wide text-[#1d4ed8] bg-[#eff6ff] px-2.5 py-1 rounded-md"
            >
              {tag.length > 24 ? `${tag.slice(0, 22)}…` : tag}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Session / rate</p>
          <p className="mt-1 text-xl font-bold text-[#0f3d32]">{rate ? fmtBudget(rate) : "—"}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Expertise</p>
          <p className="mt-1 text-sm font-bold text-gray-900 line-clamp-2">{sector}</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 mb-5 flex-grow">{description}</p>

      <DiscoverOfferButton
        type="mentorship"
        contactId={mentor.mentor_id}
        offerLookup={offerLookup}
        variant="discover"
        disabled={!approved}
      />
    </article>
  );
}

export default function StartupDiscoverPage() {
  const [investors, setInvestors] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [startup, setStartup] = useState(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [activeTab, setActiveTab] = useState("investors");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [expertise, setExpertise] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [offerLookup, setOfferLookup] = useState({ investors: new Map(), mentors: new Map() });
  const { approved, pending, reason, message: approvalMessage, loading: approvalLoading } = useStartupApproval();

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const search = globalSearch.trim() || undefined;
      const investorParams = {
        search,
        industry: industry || undefined,
        country: location || undefined,
      };
      const mentorParams = {
        search,
        country: location || undefined,
        expertise: expertise || industry || undefined,
      };

      if (role) {
        investorParams.search = investorParams.search
          ? `${investorParams.search} ${role}`
          : role;
        mentorParams.search = mentorParams.search ? `${mentorParams.search} ${role}` : role;
      }

      const [investorData, mentorData, offersData, profileData] = await Promise.all([
        searchInvestors(investorParams),
        searchMentors(mentorParams),
        getStartupOffers().catch(() => ({ offers: [] })),
        getStartupProfile().catch(() => ({ startup: null })),
      ]);

      setInvestors(investorData.investors || []);
      setMentors(mentorData.mentors || []);
      setOfferLookup(buildSentOfferLookup(offersData.offers || []));
      setStartup(profileData.startup || null);
    } catch (err) {
      setError(err.message || "Unable to load discovery data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [globalSearch, industry, location, expertise, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const industryOptions = useMemo(() => {
    const set = new Set();
    investors.forEach((i) => i.preferred_industry && set.add(i.preferred_industry));
    mentors.forEach((m) => {
      if (m.primary_industry) set.add(m.primary_industry);
      if (m.expertise) set.add(m.expertise);
    });
    return Array.from(set).sort();
  }, [investors, mentors]);

  const locationOptions = useMemo(() => {
    const set = new Set();
    investors.forEach((i) => i.country && set.add(i.country));
    mentors.forEach((m) => {
      if (m.country) set.add(m.country);
      if (m.location) set.add(m.location);
    });
    return Array.from(set).sort();
  }, [investors, mentors]);

  const founderName =
    startup?.founder_full_name ||
    `${startup?.first_name || ""} ${startup?.last_name || ""}`.trim() ||
    "Founder";

  const founderTitle = [startup?.founder_role, startup?.startup_name].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto">
        <StartupTopBar
          searchValue={globalSearch}
          onSearchChange={setGlobalSearch}
          onSearchSubmit={() => loadData(true)}
          searchPlaceholder="Search investors, mentors, industries..."
          profileName={startup?.startup_name || founderName}
          profileSubtitle={founderTitle || "Startup founder"}
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
        />

        <div className="px-4 sm:px-8 py-10 w-full max-w-[1100px] mx-auto pb-24">
          {/* Page title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0f3d32] tracking-tight">
              Discover Investors and Mentors
            </h1>
            <p className="mt-3 text-sm text-gray-500 max-w-2xl mx-auto">
              Connect with Ethiopia&apos;s leading investment firms and industry experts to scale your startup.
            </p>
          </div>

          {/* Mobile search */}
          <div className="sm:hidden mb-6">
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search for opportunities..."
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0f3d32]/20"
            />
          </div>

          {/* Filters */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadData(true);
            }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
          >
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">
                Industry
              </span>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#0f3d32]/20"
              >
                <option value="">All Industries</option>
                {industryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">
                Location
              </span>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#0f3d32]/20"
              >
                <option value="">All Locations</option>
                {locationOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">
                Subject / Expertise
              </span>
              <input
                type="text"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                placeholder="Any type"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#0f3d32]/20"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">
                Role
              </span>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="All"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#0f3d32]/20"
              />
            </label>
          </form>

          <div className="flex items-center justify-between gap-4 mb-6 border-b border-gray-200">
            <div className="flex gap-8">
              <button
                type="button"
                onClick={() => setActiveTab("investors")}
                className={`pb-3 text-sm font-bold transition border-b-2 -mb-px ${
                  activeTab === "investors"
                    ? "text-[#0f3d32] border-[#0f3d32]"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                Investors
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("mentors")}
                className={`pb-3 text-sm font-bold transition border-b-2 -mb-px ${
                  activeTab === "mentors"
                    ? "text-[#0f3d32] border-[#0f3d32]"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                Mentors
              </button>
            </div>
            <Link
              href="/startup/recommendations"
              className="hidden sm:inline text-sm font-semibold text-[#0f3d32] hover:underline shrink-0"
            >
              AI Recommendations
            </Link>
          </div>

          {!approvalLoading && pending && (
            <PendingApprovalBanner className="mb-6" reason={reason} message={approvalMessage} />
          )}

          {error && isAccountGateError({ message: error }) && (
            <StartupActionNotice className="mb-6" error={{ message: error }} />
          )}

          {error && !isAccountGateError({ message: error }) && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-gray-500 shadow-sm">
              Loading discovery results…
            </div>
          ) : activeTab === "investors" ? (
            investors.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
                No investors found. Try broader search terms like sector, location, or investment stage.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {investors.map((investor) => (
                  <InvestorCard
                    key={investor.investor_id}
                    investor={investor}
                    offerLookup={offerLookup}
                    approved={approved}
                  />
                ))}
              </div>
            )
          ) : mentors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
              No mentors found. Try searching for a different skill, experience level, or industry.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {mentors.map((mentor) => (
                <MentorCard
                  key={mentor.mentor_id}
                  mentor={mentor}
                  offerLookup={offerLookup}
                  approved={approved}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
