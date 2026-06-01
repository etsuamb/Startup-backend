"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/startup/Sidebar";
import StartupActionNotice from "@/components/startup/StartupActionNotice";
import StartupTopBar from "@/components/startup/StartupTopBar";
import { isAccountGateError } from "@/lib/accountGate";
import {
  deleteProject,
  getDocuments,
  getMyProjects,
  getStartupOffers,
  getStartupProfile,
} from "@/lib/startupApi";

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "published", label: "Published" },
  { id: "under_review", label: "Under Review" },
  { id: "rejected", label: "Rejected" },
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "title", label: "Title (A–Z)" },
];

const COVER_THEMES = [
  { bg: "bg-[#ecfdf3]", icon: "text-[#0f3d32]", ring: "ring-[#bbf7d0]" },
  { bg: "bg-[#eff6ff]", icon: "text-[#1d4ed8]", ring: "ring-[#bfdbfe]" },
  { bg: "bg-[#fef9c3]", icon: "text-[#a16207]", ring: "ring-[#fde68a]" },
  { bg: "bg-[#f3e8ff]", icon: "text-[#7c3aed]", ring: "ring-[#e9d5ff]" },
];

function fmtMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(x);
}

function normalizeStatus(status) {
  return String(status || "draft").toLowerCase();
}

function displayStatus(status) {
  const s = normalizeStatus(status);
  if (s === "draft") return { label: "DRAFT", tone: "text-red-600" };
  if (s === "cancelled") return { label: "REJECTED", tone: "text-red-600" };
  if (s === "active" || s === "funded") return { label: "PUBLISHED", tone: "text-[#16a34a]" };
  if (s === "completed") return { label: "PUBLISHED", tone: "text-[#16a34a]" };
  return { label: s.toUpperCase(), tone: "text-amber-600" };
}

function timeAgo(dateString) {
  if (!dateString) return "—";
  const then = new Date(dateString).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Date.now() - then;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  return `${months} months ago`;
}

function projectFilterBucket(project, inquiryByTitle, pendingByTitle) {
  const s = normalizeStatus(project.status);
  const title = project.project_title || "";
  const hasPendingInquiry = (inquiryByTitle.get(title) || 0) > 0;
  const hasPendingApplication = (pendingByTitle.get(title) || 0) > 0;

  if (s === "cancelled") return "rejected";
  if (s === "draft") return "draft";
  if (hasPendingInquiry || hasPendingApplication) return "under_review";
  if (["active", "funded", "completed"].includes(s)) return "published";
  return "draft";
}

function ProjectCover({ project, themeIndex }) {
  const theme = COVER_THEMES[themeIndex % COVER_THEMES.length];
  if (project.cover_photo_path) {
    return (
      <div className="w-full sm:w-36 md:w-44 h-36 sm:h-auto shrink-0 bg-gray-100">
        <img
          src={`/${project.cover_photo_path}`}
          alt=""
          className="w-full h-full object-cover min-h-[144px]"
        />
      </div>
    );
  }
  return (
    <div
      className={`w-full sm:w-36 md:w-44 h-36 sm:h-auto shrink-0 flex items-center justify-center ${theme.bg} ring-1 ${theme.ring} min-h-[144px]`}
    >
      <svg className={`w-12 h-12 ${theme.icon} opacity-80`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    </div>
  );
}

export default function StartupProjectsListing() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [offers, setOffers] = useState([]);
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [deletingProjectId, setDeletingProjectId] = useState(null);

  const loadProjects = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [projectsData, docsData, offersData, profileData] = await Promise.all([
        getMyProjects(),
        getDocuments().catch(() => ({ documents: [] })),
        getStartupOffers().catch(() => ({ offers: [] })),
        getStartupProfile().catch(() => ({ startup: null })),
      ]);

      setProjects(projectsData.projects || []);
      setDocuments(docsData.documents || []);
      setOffers(offersData.offers || []);
      setStartup(profileData.startup || null);
    } catch (err) {
      setError(err.message || "Unable to load projects.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  async function handleDeleteProject(project) {
    const title = project.project_title || "this project";
    if (!window.confirm(`Delete "${title}"? This action cannot be undone.`)) return;

    try {
      setDeletingProjectId(project.project_id);
      setError(null);
      await deleteProject(project.project_id);
      await loadProjects(true);
    } catch (err) {
      setError(err.message || "Could not delete project.");
    } finally {
      setDeletingProjectId(null);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load the startup's projects when this page opens.
    loadProjects();
  }, [loadProjects]);

  const docsByProject = useMemo(() => {
    const map = new Map();
    for (const doc of documents) {
      const key = doc.project_id ?? "general";
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [documents]);

  const investmentOffers = useMemo(
    () => offers.filter((o) => o.offerType === "investment"),
    [offers],
  );

  const inquiryByTitle = useMemo(() => {
    const map = new Map();
    for (const offer of investmentOffers) {
      const title = offer.project_title;
      if (!title) continue;
      map.set(title, (map.get(title) || 0) + 1);
    }
    return map;
  }, [investmentOffers]);

  const pendingByTitle = useMemo(() => {
    const map = new Map();
    for (const offer of investmentOffers) {
      if (String(offer.status || "").toLowerCase() !== "pending") continue;
      const title = offer.project_title;
      if (!title) continue;
      map.set(title, (map.get(title) || 0) + 1);
    }
    return map;
  }, [investmentOffers]);

  const stats = useMemo(() => {
    const total = projects.length;
    const drafts = projects.filter((p) => normalizeStatus(p.status) === "draft").length;
    const published = projects.filter((p) =>
      ["active", "funded", "completed"].includes(normalizeStatus(p.status)),
    ).length;
    const applications = investmentOffers.filter(
      (o) =>
        String(o.status || "").toLowerCase() === "pending" &&
        o.source_direction === "sent",
    ).length;

    return { total, drafts, published, applications };
  }, [projects, investmentOffers]);

  const filteredProjects = useMemo(() => {
    let list = [...projects];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          (p.project_title || "").toLowerCase().includes(q) ||
          (p.industry || "").toLowerCase().includes(q) ||
          (p.lifecycle_stage || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q),
      );
    }

    if (activeFilter !== "all") {
      list = list.filter(
        (p) => projectFilterBucket(p, inquiryByTitle, pendingByTitle) === activeFilter,
      );
    }

    list.sort((a, b) => {
      if (sortBy === "title") {
        return (a.project_title || "").localeCompare(b.project_title || "");
      }
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return sortBy === "oldest" ? aTime - bTime : bTime - aTime;
    });

    return list;
  }, [projects, searchQuery, activeFilter, sortBy, inquiryByTitle, pendingByTitle]);

  const founderLabel =
    startup?.founder_role ||
    startup?.founder_full_name ||
    `${startup?.first_name || ""} ${startup?.last_name || ""}`.trim() ||
    "Company Founder";

  return (
    <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto">
        <StartupTopBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search projects, industries, investors..."
          profileName={startup?.startup_name || "My Startup"}
          profileSubtitle={founderLabel}
          refreshing={refreshing}
          onRefresh={() => loadProjects(true)}
        />

        <div className="px-4 sm:px-8 py-8 w-full max-w-[1280px] mx-auto pb-24">
          {/* Page header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Projects</h1>
              <p className="text-sm text-gray-500 mt-1 max-w-xl">
                Manage your startup projects, funding requests, documents, and progress updates.
              </p>
            </div>
            <Link
              href="/startup/project/create"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0f3d32] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#0a2921] transition shrink-0"
            >
              <span className="text-lg leading-none">+</span>
              Create New Project
            </Link>
          </div>

          {error && isAccountGateError({ message: error }) && (
            <StartupActionNotice className="mb-6" error={{ message: error }} />
          )}

          {error && !isAccountGateError({ message: error }) && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* Mobile search */}
          <div className="sm:hidden mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0f3d32]/20"
            />
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total Projects",
                value: stats.total,
                iconBg: "bg-[#eff6ff]",
                iconColor: "text-[#3b82f6]",
                icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
              },
              {
                label: "Published",
                value: stats.published,
                iconBg: "bg-[#f0fdf4]",
                iconColor: "text-[#22c55e]",
                icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
              },
              {
                label: "Drafts",
                value: stats.drafts,
                iconBg: "bg-[#f3f4f6]",
                iconColor: "text-gray-500",
                icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
              },
              {
                label: "Applications",
                value: stats.applications,
                iconBg: "bg-[#ecfdf3]",
                iconColor: "text-[#0f3d32]",
                icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{card.label}</p>
                  <p className="mt-1 text-3xl font-black text-gray-900">{loading ? "—" : card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                  <svg className={`w-6 h-6 ${card.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={card.icon} />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {/* Filters + sort */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex flex-wrap gap-2">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                    activeFilter === tab.id
                      ? "bg-[#0f3d32] text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#0f3d32]/20"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-gray-500 shadow-sm">
              Loading projects...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
              <p className="text-lg font-semibold text-gray-900 mb-2">
                {projects.length === 0 ? "No projects yet" : "No projects match your filters"}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                {projects.length === 0
                  ? "Add your first project to begin tracking funding, documents, and updates."
                  : "Try a different filter or search term."}
              </p>
              {projects.length === 0 && (
                <Link
                  href="/startup/project/create"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#0f3d32] text-white rounded-xl font-bold hover:bg-[#0a2921] transition"
                >
                  Create your first project
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {filteredProjects.map((project, index) => {
                const goal = Number(project.funding_goal) || 0;
                const raised = Number(project.amount_raised) || 0;
                const progress = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
                const status = displayStatus(project.status);
                const title = project.project_title || "Untitled project";
                const inquiries = inquiryByTitle.get(title) || 0;
                const docCount =
                  (docsByProject.get(project.project_id) || 0) +
                  (docsByProject.get("general") || 0);
                const missingDocs = normalizeStatus(project.status) === "draft" && docCount === 0;
                const isFeatured =
                  normalizeStatus(project.status) === "funded" ||
                  (goal > 0 && raised / goal >= 0.5);
                const isComplete = normalizeStatus(project.status) === "completed";
                const underReview =
                  projectFilterBucket(project, inquiryByTitle, pendingByTitle) === "under_review";

                return (
                  <article
                    key={project.project_id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row"
                  >
                    <ProjectCover project={project} themeIndex={index} />

                    <div className="flex-grow p-5 sm:p-6 flex flex-col min-w-0">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                        <div className="min-w-0">
                          <h2 className="text-xl font-bold text-gray-900 truncate">{title}</h2>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {project.industry && (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
                                {project.industry}
                              </span>
                            )}
                            {project.lifecycle_stage && (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md">
                                {project.lifecycle_stage}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-xs font-bold uppercase tracking-widest ${status.tone}`}>
                            {underReview && normalizeStatus(project.status) !== "cancelled"
                              ? "UNDER REVIEW"
                              : status.label}
                          </p>
                          {missingDocs && (
                            <p className="mt-1 text-[10px] font-semibold text-red-600 flex items-center justify-end gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                              Missing documents
                            </p>
                          )}
                          {!missingDocs && isFeatured && !isComplete && (
                            <p className="mt-1 text-[10px] font-semibold text-[#16a34a] flex items-center justify-end gap-1">
                              ★ Featured
                            </p>
                          )}
                          {isComplete && (
                            <p className="mt-1 text-[10px] font-semibold text-[#16a34a] flex items-center justify-end gap-1">
                              ✓ Complete
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5 border-t border-gray-100 pt-5">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                            Funding goal
                          </p>
                          <p className="text-sm font-bold text-gray-900">{fmtMoney(goal)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                            Progress
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[60px]">
                              <div
                                className="bg-[#0f3d32] h-full rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-gray-900">{progress}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                            Last updated
                          </p>
                          <p className="text-sm font-bold text-gray-900">{timeAgo(project.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                            Inquiries
                          </p>
                          <p className="text-sm font-bold text-gray-900">
                            {inquiries} Investor{inquiries === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => router.push(`/startup/project/create?edit=${project.project_id}`)}
                          className="text-sm font-semibold text-gray-600 hover:text-[#0f3d32] transition"
                        >
                          Edit Project
                        </button>
                        <Link
                          href={`/startup/project/details/${project.project_id}`}
                          className="text-sm font-semibold text-gray-600 hover:text-[#0f3d32] transition"
                        >
                          View Details
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(project)}
                          disabled={deletingProjectId === project.project_id}
                          className="text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-wait disabled:opacity-60"
                        >
                          {deletingProjectId === project.project_id ? "Deleting..." : "Delete Project"}
                        </button>
                        {missingDocs && (
                          <Link
                            href={`/startup/project/documents?project=${project.project_id}`}
                            className="ml-auto inline-flex items-center justify-center px-5 py-2.5 bg-[#0f3d32] text-white text-sm font-bold rounded-xl hover:bg-[#0a2921] transition"
                          >
                            Continue Documents
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Footer CTA */}
          <div className="mt-14 text-center rounded-2xl border border-gray-100 bg-white p-10 shadow-sm">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[#eaf4f1] text-[#0f3d32] flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Have a new vision?</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Get started with a single project today. Launch your startup idea and track funding in one place.
            </p>
            <Link
              href="/startup/project/create"
              className="mt-6 inline-flex items-center justify-center px-8 py-3 bg-[#0f3d32] text-white rounded-xl text-sm font-bold hover:bg-[#0a2921] transition shadow-sm"
            >
              Start Onboarding
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
