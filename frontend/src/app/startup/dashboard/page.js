"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AiMentorWidget from "@/components/startup/AiMentorWidget";
import Sidebar from "@/components/startup/Sidebar";
import StartupActionNotice from "@/components/startup/StartupActionNotice";
import StartupTopBar from "@/components/startup/StartupTopBar";
import ViewableFileTrigger from "@/components/startup/ViewableFileTrigger";
import { PortalContentSkeleton } from "@/components/loading/PageSkeletons";
import { isAccountGateError } from "@/lib/accountGate";
import {
  getDashboardActivities,
  getDocuments,
  getDashboardFeedback,
  getInvestorRecommendations,
  getMentorRecommendations,
  getMyProjects,
  getNotifications,
  getStartupDashboardStatus,
  getStartupFundingSummary,
  getStartupOffers,
  getStartupProfile,
} from "@/lib/startupApi";

function normalizeDocText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function startupDocumentTypeLabel(doc) {
  const description = normalizeDocText(doc?.description);
  const fileName = normalizeDocText(doc?.file_name);
  if (description.includes("founder") && description.includes("id")) return "Founder ID";
  if (description.includes("business registration") || description.includes("registration proof")) return "Business Registration";
  if (description.includes("support") || description.includes("affiliation")) return "Support Letter";
  if (description.includes("tin")) return "TIN Certificate";
  if (description.includes("proof of address") || description.includes("address")) return "Proof of Address";
  if (description.includes("logo") || fileName.includes("logo")) return "Company Logo";
  if (description.includes("pitch")) return "Pitch Deck";
  if (description.includes("business plan")) return "Business Plan";
  return doc?.description || "Startup Document";
}

function formatCurrency(value) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatTeamSize(size) {
  if (size == null || size === "") return "Not set";
  const n = Number(size);
  if (Number.isNaN(n)) return String(size);
  if (n <= 5) return "1–5";
  if (n <= 10) return "5–10";
  if (n <= 25) return "11–25";
  if (n <= 50) return "26–50";
  return `${n}+`;
}

function investorDisplayName(investor) {
  return (
    investor?.organization_name ||
    `${investor?.first_name || ""} ${investor?.last_name || ""}`.trim() ||
    "Investor"
  );
}

function mentorDisplayName(mentor) {
  return `${mentor?.first_name || ""} ${mentor?.last_name || ""}`.trim() || "Mentor";
}

function SectionCard({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export default function StartupDashboard() {
  const [startup, setStartup] = useState(null);
  const [dashboardStatus, setDashboardStatus] = useState(null);
  const [funding, setFunding] = useState(null);
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [offers, setOffers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [investorMatches, setInvestorMatches] = useState([]);
  const [mentorMatches, setMentorMatches] = useState([]);
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [
        profileRes,
        statusRes,
        fundingRes,
        projectsRes,
        documentsRes,
        offersRes,
        activitiesRes,
        notificationsRes,
        investorRecRes,
        mentorRecRes,
        feedbackRes,
      ] = await Promise.all([
        getStartupProfile(),
        getStartupDashboardStatus(),
        getStartupFundingSummary(),
        getMyProjects(),
        getDocuments(),
        getStartupOffers().catch(() => ({ offers: [] })),
        getDashboardActivities({ limit: 8 }),
        getNotifications(),
        getInvestorRecommendations({ limit: 3 }).catch(() => ({ recommendations: [] })),
        getMentorRecommendations().catch(() => ({ recommendations: [] })),
        getDashboardFeedback({ limit: 10 }).catch(() => ({ feedback: [] })),
      ]);

      setStartup(profileRes.startup ?? null);
      setDashboardStatus(statusRes);
      setFunding(fundingRes);
      setProjects(projectsRes.projects ?? []);
      setDocuments(documentsRes.documents ?? []);
      setOffers(offersRes.offers ?? []);
      setActivities(activitiesRes.activity ?? []);
      setNotifications(notificationsRes.notifications ?? []);
      setInvestorMatches(investorRecRes.recommendations ?? []);
      setMentorMatches(mentorRecRes.recommendations ?? []);
      setFeedbackItems(feedbackRes.feedback ?? []);
    } catch (err) {
      setError(err.message ?? "Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial dashboard data load.
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const activeProjects = projects.filter((p) =>
      ["active", "funded", "draft"].includes(String(p.status || "").toLowerCase()),
    ).length;
    const completedProjects = projects.filter(
      (p) => String(p.status || "").toLowerCase() === "completed",
    ).length;
    const pendingInvestments = offers.filter(
      (o) =>
        o.offerType === "investment" &&
        String(o.status || "").toLowerCase() === "pending",
    ).length;
    const newMessages = notifications.filter((n) => !n.is_read).length;

    return { activeProjects, completedProjects, pendingInvestments, newMessages };
  }, [projects, offers, notifications]);

  const fundingTarget = useMemo(() => {
    const profileTarget = Number(startup?.funding_needed) || 0;
    const summaryTarget = Number(funding?.required_funding) || 0;
    return profileTarget || summaryTarget || 0;
  }, [startup, funding]);

  const fundingRaised = useMemo(() => {
    const fromProjects = Number(funding?.amount_raised_in_projects) || 0;
    const received = Number(funding?.received_funding) || 0;
    return Math.max(fromProjects, received);
  }, [funding]);

  const fundingProgress = useMemo(() => {
    if (!fundingTarget) return 0;
    return Math.min(100, Math.round((fundingRaised / fundingTarget) * 100));
  }, [fundingRaised, fundingTarget]);

  const investmentRounds = useMemo(
    () =>
      offers.filter(
        (o) =>
          o.offerType === "investment" &&
          ["approved", "accepted"].includes(String(o.status || "").toLowerCase()),
      ).length,
    [offers],
  );

  const investmentOffersList = useMemo(
    () => offers.filter((o) => o.offerType === "investment").slice(0, 4),
    [offers],
  );

  const recentProjects = useMemo(() => projects.slice(0, 4), [projects]);

  const hiredMentorship = useMemo(() => {
    const acceptedOffer = offers.find(
      (o) =>
        o.offerType === "mentorship" &&
        ["accepted", "approved"].includes(String(o.status || "").toLowerCase()),
    );
    if (acceptedOffer) {
      return {
        name: `${acceptedOffer.first_name || ""} ${acceptedOffer.last_name || ""}`.trim(),
        role: acceptedOffer.expertise || acceptedOffer.professional_title || acceptedOffer.subject || "Mentor",
        mentorId: acceptedOffer.mentor_id,
      };
    }
    return null;
  }, [offers]);

  const averageRating = useMemo(() => {
    const ratings = feedbackItems
      .map((item) => Number(item.rating))
      .filter((n) => !Number.isNaN(n) && n > 0);
    if (!ratings.length) return null;
    return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
  }, [feedbackItems]);

  const matchedList = useMemo(() => {
    const investors = investorMatches.slice(0, 3).map((rec) => ({
      id: rec.investor?.investor_id,
      name: investorDisplayName(rec.investor),
      subtitle: rec.investor?.preferred_industry || rec.investor?.investment_stage || "Investor",
      match: rec.match_percent ?? Math.round((rec.score || 0) * 100),
      href: rec.investor?.investor_id
        ? `/startup/discover/investor/${rec.investor.investor_id}`
        : "/startup/discover",
    }));
    if (investors.length >= 3) return investors;
    const mentors = mentorMatches.slice(0, 3 - investors.length).map((rec) => ({
      id: rec.mentor?.mentor_id,
      name: mentorDisplayName(rec.mentor),
      subtitle: rec.mentor?.expertise || rec.mentor?.primary_industry || "Mentor",
      match: Math.round((rec.score || 0.8) * 100),
      href: rec.mentor?.mentor_id
        ? `/startup/discover/mentor/${rec.mentor.mentor_id}`
        : "/startup/discover",
    }));
    return [...investors, ...mentors].slice(0, 3);
  }, [investorMatches, mentorMatches]);

  const founderName =
    startup?.founder_full_name ||
    `${startup?.first_name || ""} ${startup?.last_name || ""}`.trim() ||
    "Founder";

  const location =
    startup?.location ||
    [startup?.city, startup?.region].filter(Boolean).join(", ") ||
    "Not set";

  const accountLabel = dashboardStatus?.status_label || "Active Startup";
  const isApproved = Boolean(startup?.is_approved);

  return (
    <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto">
        <StartupTopBar
          showSearch={false}
          profileName={startup?.startup_name ?? "My Startup"}
          profileSubtitle={accountLabel}
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
        />

        <div className="px-4 sm:px-8 py-8 w-full max-w-[1200px] mx-auto pb-24">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#0f3d32]">Startup · Dashboard</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">
                Welcome back, {startup?.startup_name ?? "founder"}.
              </h1>
              <p className="text-sm text-gray-500 mt-1.5">
                {isApproved
                  ? "Here is an overview of your startup activity and progress."
                  : "Your account is pending admin approval. Some actions remain limited until you are approved."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition disabled:opacity-50"
            >
              {refreshing || loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {error && isAccountGateError({ message: error }) ? (
            <StartupActionNotice
              className="mb-6"
              error={{ message: error }}
              actionHref="/startup/settings"
              actionLabel="Review account settings"
            />
          ) : error ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
               <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-red-800">{error}</span>
            </div>
          ) : null}

          {loading ? (
            <PortalContentSkeleton compact />
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
                {[
                  { label: "Active Projects", value: stats.activeProjects, icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", color: "bg-emerald-500" },
                  { label: "Pending Investments", value: stats.pendingInvestments, icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "bg-amber-500" },
                  { label: "New Messages", value: stats.newMessages, icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", color: "bg-blue-500" },
                  { label: "Completed Projects", value: stats.completedProjects, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "bg-purple-500" },
                ].map((item) => (
                  <div key={item.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className={`absolute top-0 left-0 w-full h-1 ${item.color} opacity-80`} />
                    <div className="flex justify-between items-start mb-2">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{item.label}</p>
                       <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400 group-hover:text-gray-600 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                          </svg>
                       </div>
                    </div>
                    <p className="mt-1 text-3xl font-black text-gray-900 tracking-tight group-hover:scale-105 transition-transform origin-left">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Profile + Documents */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <SectionCard className="relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Startup Profile</h3>
                      <p className="text-xs text-gray-500 mt-1">Overview of your company details</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${
                        isApproved ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isApproved ? "bg-emerald-500" : "bg-amber-500"}`} />
                      {isApproved ? "Approved" : "Pending"}
                    </span>
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 text-sm">
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Founded by</dt>
                      <dd className="mt-1.5 font-semibold text-gray-900">{founderName}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Stage</dt>
                      <dd className="mt-1.5 font-semibold text-gray-900">{startup?.business_stage || "Not set"}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Location</dt>
                      <dd className="mt-1.5 font-semibold text-gray-900">{location}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Team size</dt>
                      <dd className="mt-1.5 font-semibold text-gray-900">{formatTeamSize(startup?.team_size)}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Founder role</dt>
                      <dd className="mt-1.5 font-semibold text-gray-900">{startup?.founder_role || "Not set"}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Funding raised</dt>
                      <dd className="mt-1.5 font-bold text-[#0f3d32]">{formatCurrency(fundingRaised)}</dd>
                    </div>
                  </dl>
                </SectionCard>

                <SectionCard>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                       <h3 className="text-lg font-bold text-gray-900">Documents</h3>
                       <p className="text-xs text-gray-500 mt-1">
                          {documents.length} uploaded profile document{documents.length === 1 ? "" : "s"}
                       </p>
                    </div>
                    <Link
                      href="/startup/project/documents"
                      className="text-xs font-bold text-[#0f3d32] hover:text-[#0b2f26] bg-emerald-50 px-3 py-1.5 rounded-lg transition"
                    >
                      Manage
                    </Link>
                  </div>
                  
                  {documents.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
                      <p className="text-sm font-medium text-gray-500">No documents uploaded yet.</p>
                      <p className="text-xs text-gray-400 mt-1">Upload your startup verification or project documents.</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {documents.slice(0, 4).map((doc) => (
                        <li
                          key={doc.document_id}
                          className="rounded-xl bg-[#f8fafc] border border-gray-100 p-3 hover:border-[#0f3d32]/30 hover:bg-[#f0faf7] transition group"
                        >
                          <ViewableFileTrigger
                            documentId={doc.document_id}
                            filePath={doc.file_path}
                            fileName={doc.file_name}
                            fileType={doc.file_type}
                            description={`Type: ${startupDocumentTypeLabel(doc)}`}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>
              </div>

              {/* Funding + Mentorship */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <SectionCard className="lg:col-span-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Funding Summary</h3>
                  <div className="mb-2 flex justify-between items-end text-sm">
                    <span className="font-bold uppercase tracking-widest text-[10px] text-gray-500">Raised / Target</span>
                    <span className="font-black text-gray-900 text-lg">
                      {formatCurrency(fundingRaised)} <span className="text-gray-400 font-medium text-sm">/ {formatCurrency(fundingTarget)}</span>
                    </span>
                  </div>
                  <div className="w-full bg-[#f8fafc] border border-gray-100 rounded-full h-3 mb-8 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#0f3d32] to-[#1a6654] h-full rounded-full transition-all duration-1000 ease-out relative"
                      style={{ width: `${fundingProgress}%` }}
                    >
                       <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20 blur-sm -skew-x-12 animate-[shimmer_2s_infinite]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total rounds</p>
                      <p className="mt-1.5 text-2xl font-black text-gray-900">{investmentRounds}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Funding raised</p>
                      <p className="mt-1.5 text-2xl font-black text-[#0f3d32]">{formatCurrency(fundingRaised)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Average rating</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                         <span className="text-2xl font-black text-gray-900">{averageRating ?? "—"}</span>
                         {averageRating && <span className="text-amber-400 text-lg">★</span>}
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <div className="bg-gradient-to-br from-[#0f3d32] to-[#0a2921] rounded-2xl p-6 shadow-md text-white flex flex-col justify-between min-h-[240px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                       <svg className="w-5 h-5 text-[#b8f0d9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                       </svg>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-[#b8f0d9]">Mentorship</p>
                    </div>
                    
                    {hiredMentorship ? (
                      <>
                        <h3 className="text-2xl font-black leading-tight">{hiredMentorship.name}</h3>
                        <p className="mt-2 text-sm text-[#d2f8e3] font-medium">{hiredMentorship.role}</p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-bold">No active mentor</h3>
                        <p className="mt-2 text-sm text-[#d2f8e3]/80">Find a mentor to guide your startup&apos;s growth.</p>
                      </>
                    )}
                  </div>
                  <div className="relative z-10 mt-6 flex flex-col gap-2">
                    <Link
                      href={hiredMentorship ? "/startup/chat?kind=mentor" : "/startup/discover"}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-[#0f3d32] text-sm font-bold px-5 py-3 hover:bg-gray-50 transition shadow-sm"
                    >
                      {hiredMentorship ? "View mentorship" : "Find mentor"}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    {hiredMentorship ? (
                      <Link
                        href="/startup/mentorship-resources"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 text-white text-xs font-bold px-5 py-2.5 hover:bg-white/10 transition"
                      >
                        Mentor resources
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Projects, Offers, Matches */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <SectionCard>
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-bold text-gray-900">Recent Projects</h3>
                     <Link href="/startup/project" className="text-xs font-bold text-gray-400 hover:text-[#0f3d32] transition">View all</Link>
                  </div>
                  {recentProjects.length === 0 ? (
                    <div className="py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                       <p className="text-sm font-medium text-gray-500">No projects yet</p>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {recentProjects.map((project) => (
                        <li key={project.project_id} className="text-sm group">
                          <Link
                            href={`/startup/project/details/${project.project_id}`}
                            className="font-bold text-gray-900 group-hover:text-[#0f3d32] transition block truncate"
                          >
                            {project.project_title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                             <p className="text-gray-500 text-xs font-medium">
                               {project.status || "active"} <span className="mx-1 text-gray-300">•</span> {formatCurrency(project.amount_raised)} funded
                             </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>

                <SectionCard>
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-bold text-gray-900">Investment Offers</h3>
                     <Link href="/startup/offers" className="text-xs font-bold text-gray-400 hover:text-[#0f3d32] transition">View all</Link>
                  </div>
                  {investmentOffersList.length === 0 ? (
                    <div className="py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                       <p className="text-sm font-medium text-gray-500">No offers yet</p>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {investmentOffersList.map((offer) => (
                        <li key={offer.id} className="flex justify-between items-start gap-3 group">
                          <div className="min-w-0">
                            <Link
                              href={`/startup/offers/investment/${offer.id}`}
                              className="font-bold text-gray-900 group-hover:text-[#0f3d32] transition block truncate"
                            >
                              {offer.company || `${offer.first_name} ${offer.last_name}`.trim()}
                            </Link>
                            <p className="text-gray-500 text-xs font-medium mt-1">
                              {formatCurrency(offer.amount)}
                            </p>
                          </div>
                          {offer.status && (
                             <span className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                                {offer.status}
                             </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>

                <SectionCard>
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-bold text-gray-900">Top Matches</h3>
                     <Link href="/startup/recommendations" className="text-xs font-bold text-gray-400 hover:text-[#0f3d32] transition">View all</Link>
                  </div>
                  {matchedList.length === 0 ? (
                    <div className="py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                       <p className="text-sm font-medium text-gray-500">Complete profile to see matches</p>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {matchedList.map((match) => (
                        <li key={`${match.href}-${match.name}`} className="flex items-center justify-between gap-3 group">
                          <div className="min-w-0 flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                                <span className="text-indigo-700 font-bold text-xs">{match.name.charAt(0)}</span>
                             </div>
                             <div className="min-w-0">
                               <Link href={match.href} className="font-bold text-gray-900 group-hover:text-[#0f3d32] transition block truncate text-sm">
                                 {match.name}
                               </Link>
                               <p className="text-xs text-gray-500 font-medium truncate">{match.subtitle}</p>
                             </div>
                          </div>
                          <span className="shrink-0 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold px-2 py-1">
                            {match.match}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>
              </div>

              {/* Recent activity */}
              <SectionCard className="mb-10">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h3>
                {activities.length === 0 ? (
                  <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                     <p className="text-sm font-medium text-gray-500">No recent activity.</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute top-4 bottom-4 left-[15px] w-px bg-gray-100" />
                    <ul className="space-y-6 relative z-10">
                      {activities.slice(0, 6).map((item) => (
                        <li key={`${item.type}-${item.id}`} className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0 mt-0.5 z-10 text-gray-500">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                             </svg>
                          </div>
                          <div className="bg-[#f8fafc] rounded-xl border border-gray-100 p-4 flex-grow hover:border-[#0f3d32]/20 transition-colors">
                            <p className="font-bold text-gray-900 text-sm">{item.headline}</p>
                            {item.detail && <p className="text-xs text-gray-500 font-medium mt-1">{item.detail}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </SectionCard>

              {/* Quick actions */}
              <div className="border-t border-gray-200 pt-10">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-8">
                  Quick Actions
                </h3>
                <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
                  {[
                    { label: "Invite Team", href: "/startup/settings", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
                    { label: "Upload Doc", href: "/startup/project/documents", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
                    { label: "Find Mentor", href: "/startup/discover", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
                    { label: "Find Investor", href: "/startup/discover", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
                    { label: "Create Project", href: "/startup/project/create", icon: "M12 4v16m8-8H4" },
                  ].map((action) => (
                    <Link key={action.label} href={action.href} className="flex flex-col items-center gap-3 group">
                      <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-500 group-hover:border-[#0f3d32] group-hover:text-[#0f3d32] group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={action.icon} />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">{action.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <AiMentorWidget />
    </div>
  );
}
