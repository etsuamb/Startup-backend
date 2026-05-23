"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AiMentorWidget from "@/components/startup/AiMentorWidget";
import Sidebar from "@/components/startup/Sidebar";
import ViewableFileTrigger from "@/components/startup/ViewableFileTrigger";
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
  const [showNotifications, setShowNotifications] = useState(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center px-6 py-10 bg-white rounded-3xl shadow-sm border border-gray-100">
            <p className="text-sm font-bold text-gray-700">Loading your startup dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto">
        <header className="flex justify-between items-center px-6 sm:px-8 py-5 bg-white border-b border-gray-100 w-full sticky top-0 z-10">
          <div className="relative w-full max-w-md hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#f6f8f9] border border-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-[#0f3d32]/20"
            />
          </div>
          <div className="flex items-center gap-5 ml-auto">
            <div className="relative">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 transition relative p-1"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {stats.newMessages > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-gray-500 text-sm">No notifications</p>
                    ) : (
                      notifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification.notification_id}
                          className={`p-4 border-b border-gray-50 ${!notification.is_read ? "bg-blue-50" : ""}`}
                        >
                          <h4 className="font-bold text-gray-900 text-xs mb-1">{notification.title}</h4>
                          <p className="text-gray-600 text-xs">{notification.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <Link href="/startup/settings" className="flex items-center gap-3 hover:opacity-80 transition">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-gray-900">{startup?.startup_name ?? "My Startup"}</span>
                <span className="text-xs text-gray-500">{accountLabel}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#115b4c] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {startup?.startup_name?.split(" ").map((w) => w[0]).slice(0, 2).join("") ?? "ST"}
              </div>
            </Link>
          </div>
        </header>

        <div className="px-4 sm:px-8 pb-12 w-full max-w-[1280px] mx-auto">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-6 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Welcome back, {startup?.startup_name ?? "founder"}.
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isApproved
                  ? "Here is an overview of your startup activity and progress."
                  : "Your account is pending admin approval. Some actions remain limited until you are approved."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Active Projects", value: stats.activeProjects },
              { label: "Pending Investments", value: stats.pendingInvestments },
              { label: "New Messages", value: stats.newMessages },
              { label: "Completed Projects", value: stats.completedProjects },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{item.label}</p>
                <p className="mt-2 text-3xl font-black text-[#0f3d32]">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Profile + Documents */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm relative">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-bold text-gray-900">Startup Profile</h3>
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                    isApproved ? "bg-[#dcfce7] text-[#166534]" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {isApproved ? "Approved" : "Pending"}
                </span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Founded by</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{founderName}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Stage</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{startup?.business_stage || "Not set"}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Location</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{location}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Team size</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{formatTeamSize(startup?.team_size)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Founder role</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{startup?.founder_role || "Not set"}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Funding raised</dt>
                  <dd className="mt-1 font-bold text-red-600">{formatCurrency(fundingRaised)}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-2">Documents</h3>
              <p className="text-sm text-gray-500 mb-4">
                {documents.length} uploaded profile document{documents.length === 1 ? "" : "s"}
              </p>
              {documents.length === 0 ? (
                <p className="text-sm text-gray-400 rounded-xl border border-dashed border-gray-200 p-6 text-center">
                  No documents uploaded yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {documents.slice(0, 6).map((doc) => (
                    <li
                      key={doc.document_id}
                      className="rounded-xl bg-[#f9fafb] border border-gray-100 px-4 py-3 hover:border-[#0f3d32]/30 hover:bg-[#f0faf7] transition"
                    >
                      <ViewableFileTrigger
                        filePath={doc.file_path}
                        fileName={doc.file_name}
                        fileType={doc.file_type}
                        description={doc.description}
                      />
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/startup/project/documents"
                className="mt-4 inline-block text-sm font-semibold text-[#0f3d32] hover:underline"
              >
                Manage documents
              </Link>
            </div>
          </div>

          {/* Funding + Mentorship */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-6">Funding Summary</h3>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-bold uppercase tracking-widest text-[10px] text-gray-400">Raised / Target</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(fundingRaised)} / {formatCurrency(fundingTarget)}
                </span>
              </div>
              <div className="w-full bg-[#f0f2f5] rounded-full h-2.5 mb-6 overflow-hidden">
                <div
                  className="bg-[#0f3d32] h-full rounded-full transition-all"
                  style={{ width: `${fundingProgress}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total rounds</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{investmentRounds}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Funding raised</p>
                  <p className="mt-1 text-xl font-bold text-[#0f3d32]">{formatCurrency(fundingRaised)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Average rating</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{averageRating ?? "—"}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#0f3d32] rounded-2xl p-6 shadow-md text-white flex flex-col justify-between min-h-[220px]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#b8f0d9]">Hired mentorship</p>
                {hiredMentorship ? (
                  <>
                    <h3 className="mt-3 text-xl font-bold">{hiredMentorship.name}</h3>
                    <p className="mt-1 text-sm text-[#d2f8e3]">{hiredMentorship.role}</p>
                  </>
                ) : (
                  <>
                    <h3 className="mt-3 text-lg font-bold">No active mentorship</h3>
                    <p className="mt-1 text-sm text-[#d2f8e3]">Find a mentor to get started.</p>
                  </>
                )}
              </div>
              <Link
                href={hiredMentorship ? "/startup/mentorship" : "/startup/discover"}
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-white text-[#0f3d32] text-sm font-bold px-5 py-2.5 hover:bg-gray-50 transition"
              >
                {hiredMentorship ? "View mentorship" : "Find mentor"}
              </Link>
            </div>
          </div>

          {/* Projects, Offers, Matches */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Recent Projects</h3>
              {recentProjects.length === 0 ? (
                <p className="text-sm text-gray-500">No projects yet.</p>
              ) : (
                <ul className="space-y-3">
                  {recentProjects.map((project) => (
                    <li key={project.project_id} className="text-sm">
                      <Link
                        href={`/startup/project/details/${project.project_id}`}
                        className="font-semibold text-gray-900 hover:text-[#0f3d32]"
                      >
                        {project.project_title}
                      </Link>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {project.status || "active"} — {formatCurrency(project.amount_raised)} funded
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/startup/project" className="mt-4 inline-block text-sm font-semibold text-[#0f3d32] hover:underline">
                View all projects
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Investment Offers</h3>
              {investmentOffersList.length === 0 ? (
                <p className="text-sm text-gray-500">No investment offers yet.</p>
              ) : (
                <ul className="space-y-3">
                  {investmentOffersList.map((offer) => (
                    <li key={offer.id} className="text-sm">
                      <Link
                        href={`/startup/offers/investment/${offer.id}`}
                        className="font-semibold text-gray-900 hover:text-[#0f3d32]"
                      >
                        {offer.company || `${offer.first_name} ${offer.last_name}`.trim()}
                      </Link>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {formatCurrency(offer.amount)}
                        {offer.status ? ` · ${offer.status}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/startup/offers" className="mt-4 inline-block text-sm font-semibold text-[#0f3d32] hover:underline">
                View all offers
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Recent matched mentors & investors</h3>
              {matchedList.length === 0 ? (
                <p className="text-sm text-gray-500">Complete your profile to see recommendations.</p>
              ) : (
                <ul className="space-y-3">
                  {matchedList.map((match) => (
                    <li key={`${match.href}-${match.name}`} className="flex items-center justify-between gap-2 text-sm">
                      <div className="min-w-0">
                        <Link href={match.href} className="font-semibold text-gray-900 hover:text-[#0f3d32] truncate block">
                          {match.name}
                        </Link>
                        <p className="text-xs text-gray-500 truncate">{match.subtitle}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#eaf4f1] text-[#0f3d32] text-xs font-bold px-2.5 py-1">
                        {match.match}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/startup/recommendations"
                className="mt-4 inline-block text-sm font-semibold text-[#0f3d32] hover:underline"
              >
                View recommendations
              </Link>
            </div>
          </div>

          {/* Recent activity */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-10">
            <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
            {activities.length === 0 ? (
              <p className="text-sm text-gray-500">No recent activity.</p>
            ) : (
              <ul className="space-y-3">
                {activities.slice(0, 6).map((item) => (
                  <li key={`${item.type}-${item.id}`} className="flex gap-3 text-sm">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-[#0f3d32] shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">{item.headline}</p>
                      {item.detail ? <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick actions */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-6">
              Quick Actions
            </h3>
            <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
              {[
                { label: "Invite Team", href: "/startup/settings", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
                { label: "Upload Doc", href: "/startup/project/documents", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
                { label: "Find Mentor", href: "/startup/discover", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
                { label: "Find Investor", href: "/startup/discover", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
                { label: "Create Project", href: "/startup/project/create", icon: "M12 4v16m8-8H4" },
              ].map((action) => (
                <Link key={action.label} href={action.href} className="flex flex-col items-center gap-2 group">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-600 group-hover:border-[#0f3d32] group-hover:text-[#0f3d32] transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={action.icon} />
                    </svg>
                  </div>
                  <span className="text-[11px] font-bold text-gray-600">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <AiMentorWidget />
    </div>
  );
}
