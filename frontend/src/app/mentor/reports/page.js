"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchMentorReports,
  fetchMentorSessions,
  fetchMentorResources,
  fetchIncomingRequests,
  fetchMyStartups,
} from "@/lib/mentorApi";

/* ─── Helpers ─────────────────────────────────────────────── */
function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[1][0]).toUpperCase();
}

function parseList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    return value
      .split(/\n|,/)
      .map((i) => i.trim())
      .filter(Boolean);
  }
  return [];
}

function ratingColor(v) {
  const n = Number(v || 0);
  if (n >= 4) return { bar: "#10b981", text: "text-emerald-600", bg: "bg-emerald-50" };
  if (n >= 3) return { bar: "#f59e0b", text: "text-amber-600", bg: "bg-amber-50" };
  return { bar: "#ef4444", text: "text-red-600", bg: "bg-red-50" };
}

const ACTIVITY_TYPES = {
  report: { label: "Session Report", color: "#10b981", bg: "bg-emerald-50 text-emerald-700" },
  session: { label: "Session", color: "#6366f1", bg: "bg-indigo-50 text-indigo-700" },
  resource: { label: "Resource Shared", color: "#0ea5e9", bg: "bg-sky-50 text-sky-700" },
  request: { label: "Mentorship Request", color: "#f59e0b", bg: "bg-amber-50 text-amber-800" },
};

function buildMentorActivities({ reports, sessions, resources, requests }) {
  const items = [];

  reports.forEach((r) => {
    items.push({
      id: `report-${r.report_id}`,
      type: "report",
      date: r.created_at,
      startup_id: r.startup_id,
      startup_name: r.startup_name,
      title: r.report_title || "Session Report",
      subtitle: r.summary
        ? String(r.summary).slice(0, 100)
        : `Progress rating ${r.progress_rating || "—"}/5`,
      data: r,
    });
  });

  sessions.forEach((s) => {
    items.push({
      id: `session-${s.mentorship_session_id}`,
      type: "session",
      date: s.scheduled_at || s.updated_at || s.created_at,
      startup_id: s.startup_id,
      startup_name: s.startup_name,
      title: s.session_title || s.title || s.subject || "Mentorship Session",
      subtitle: `Status: ${(s.status || "scheduled").replace(/_/g, " ")}`,
      data: s,
    });
  });

  resources.forEach((r) => {
    items.push({
      id: `resource-${r.resource_id}`,
      type: "resource",
      date: r.created_at,
      startup_id: r.startup_id,
      startup_name: r.startup_name,
      title: r.resource_title || "Shared resource",
      subtitle: `${r.resource_type || "resource"}${r.file_name ? ` · ${r.file_name}` : ""}`,
      data: r,
    });
  });

  requests.forEach((r) => {
    items.push({
      id: `request-${r.mentorship_request_id}`,
      type: "request",
      date: r.updated_at || r.created_at,
      startup_id: r.startup_id,
      startup_name: r.startup_name,
      title: r.subject || "Mentorship request",
      subtitle: `Status: ${r.status || "pending"}`,
      data: r,
    });
  });

  return items.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function endOfDay(dateStr) {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
}

/* ─── Stat Card ───────────────────────────────────────────── */
function StatCard({ label, value, icon, accent }) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">

      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: accent }} />
      <div className="flex items-center gap-4 p-5 pl-6">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${accent}18` }}
        >
          <svg className="w-5 h-5" fill="none" stroke={accent} viewBox="0 0 24 24" strokeWidth="2">
            {icon}
          </svg>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
          <p className="text-2xl font-black text-[#0a4d3c] leading-none mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Activity Card ─────────────────────────────────────────── */
function ActivityCard({ activity, selected, onClick }) {
  const meta = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.request;
  const rc = activity.type === "report" ? ratingColor(activity.data?.progress_rating) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl p-4 transition-all duration-200"
      style={{
        background: selected ? "#ecfdf5" : "#ffffff",
        border: selected ? "1.5px solid #10b981" : "1px solid #e5e7eb",
        boxShadow: selected
          ? "0 10px 24px 0 rgba(16,185,129,0.18)"
          : "0 1px 2px 0 rgba(15,23,42,0.06)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
          style={{ background: `linear-gradient(135deg, #0a4d3c, ${meta.color})` }}
        >
          {initials(activity.startup_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${meta.bg}`}>
              {meta.label}
            </span>
            {rc && activity.data?.progress_rating ? (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rc.bg} ${rc.text}`}>
                {activity.data.progress_rating}/5
              </span>
            ) : null}
          </div>
          <h3 className="font-bold text-[13px] text-gray-900 truncate leading-tight mt-1">
            {activity.title}
          </h3>
          <p className="text-[11px] text-gray-500 truncate">{activity.startup_name}</p>
        </div>
      </div>
      <p className="mt-2 text-[12px] text-gray-600 line-clamp-2 leading-relaxed">{activity.subtitle}</p>
      <p className="mt-2 text-[11px] text-gray-400">{formatDateTime(activity.date)}</p>
    </button>
  );
}

/* ─── Activity Detail (non-report) ──────────────────────────── */
function ActivityDetail({ activity }) {
  const meta = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.request;
  const d = activity.data || {};

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
      <div className="px-7 py-6" style={{ background: "linear-gradient(135deg, #0a4d3c 0%, #0d6b54 100%)" }}>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${meta.bg}`}>
          {meta.label}
        </span>
        <h2 className="text-xl font-black text-white leading-tight mt-3">{activity.title}</h2>
        <p className="text-sm text-emerald-200 mt-1">{activity.startup_name}</p>
        <p className="text-xs text-white/60 mt-2">{formatDateTime(activity.date)}</p>
      </div>
      <div className="p-7 space-y-4 text-[14px] text-gray-700">
        {activity.type === "session" && (
          <>
            <DetailRow label="Status" value={(d.status || "scheduled").replace(/_/g, " ")} />
            <DetailRow label="Scheduled" value={formatDateTime(d.scheduled_at)} />
            {d.meeting_link ? <DetailRow label="Meeting link" value={d.meeting_link} link /> : null}
            {d.notes ? <DetailRow label="Notes" value={d.notes} multiline /> : null}
          </>
        )}
        {activity.type === "resource" && (
          <>
            <DetailRow label="Type" value={d.resource_type || "—"} />
            {d.resource_description ? (
              <DetailRow label="Description" value={d.resource_description} multiline />
            ) : null}
            {d.external_url ? <DetailRow label="Link" value={d.external_url} link /> : null}
            {d.file_name ? <DetailRow label="File" value={d.file_name} /> : null}
          </>
        )}
        {activity.type === "request" && (
          <>
            <DetailRow label="Status" value={d.status || "pending"} />
            {d.message ? <DetailRow label="Message" value={d.message} multiline /> : null}
            <DetailRow label="Requested" value={formatDateTime(d.created_at)} />
          </>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value, multiline, link }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-wider text-[#0a4d3c] mb-1">{label}</p>
      {link ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-emerald-700 hover:underline break-all"
        >
          {value}
        </a>
      ) : (
        <p className={`text-sm leading-relaxed ${multiline ? "whitespace-pre-wrap" : ""}`}>{value}</p>
      )}
    </div>
  );
}

/* ─── Report Detail ─────────────────────────────────────────── */
function ReportDetail({ report, onExport }) {
  const rc = ratingColor(report.progress_rating);
  const actionItems = parseList(report.action_items);
  const nextSteps = parseList(report.next_steps);

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
      <div className="px-7 py-6" style={{ background: "linear-gradient(135deg, #0a4d3c 0%, #0d6b54 100%)" }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white font-black text-lg border border-white/20">
              {initials(report.startup_name)}
            </div>
            <div>
              <h2 className="text-xl font-black text-white leading-tight">
                {report.report_title || "Session Report"}
              </h2>
              <p className="text-sm text-emerald-200 mt-0.5">{report.startup_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Generated</p>
              <p className="text-sm font-bold text-white">{formatDate(report.created_at)}</p>
            </div>
            {onExport ? (
              <button
                type="button"
                onClick={onExport}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                title="Export report"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
        {report.progress_rating ? (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-bold text-emerald-200 uppercase tracking-widest">Progress Rating</p>
              <p className="text-[13px] font-black text-white">{report.progress_rating}/5</p>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(Number(report.progress_rating) / 5) * 100}%`,
                  background: rc.bar,
                }}
              />
            </div>
          </div>
        ) : null}
      </div>
      <div className="p-7 space-y-7">
        {report.summary ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full bg-[#10b981]" />
              <h3 className="text-[13px] font-black uppercase tracking-wider text-[#0a4d3c]">Executive Summary</h3>
            </div>
            <p className="text-[14px] text-gray-700 leading-relaxed">{report.summary}</p>
          </div>
        ) : null}
        {actionItems.length > 0 ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full bg-[#f59e0b]" />
              <h3 className="text-[13px] font-black uppercase tracking-wider text-[#0a4d3c]">Action Items</h3>
            </div>
            <ul className="space-y-2">
              {actionItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px] text-gray-700">
                  <span className="text-amber-600 font-bold">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {nextSteps.length > 0 ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full bg-[#6366f1]" />
              <h3 className="text-[13px] font-black uppercase tracking-wider text-[#0a4d3c]">Next Steps</h3>
            </div>
            <ul className="space-y-2">
              {nextSteps.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px] text-gray-700">
                  <span className="text-indigo-600 font-bold">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {(report.startup_feedback || report.mentor_notes) && (
          <div className="grid md:grid-cols-2 gap-4">
            {report.startup_feedback ? (
              <div className="rounded-xl p-4 bg-emerald-50/80 border border-emerald-100">
                <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700 mb-2">Founder Feedback</p>
                <p className="text-[13px] text-gray-700 leading-relaxed">{report.startup_feedback}</p>
              </div>
            ) : null}
            {report.mentor_notes ? (
              <div className="rounded-xl p-4 bg-indigo-50/80 border border-indigo-100">
                <p className="text-[11px] font-black uppercase tracking-widest text-indigo-700 mb-2">Mentor Notes</p>
                <p className="text-[13px] text-gray-700 leading-relaxed">{report.mentor_notes}</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────── */
export default function MentorReportsPage() {
  const searchParams = useSearchParams();
  const [reports, setReports] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [resources, setResources] = useState([]);
  const [requests, setRequests] = useState([]);
  const [connectedStartups, setConnectedStartups] = useState([]);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedStartup, setSelectedStartup] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [reportsRes, sessionsRes, resourcesRes, requestsRes, startupsRes] = await Promise.all([
        fetchMentorReports().catch(() => ({ reports: [] })),
        fetchMentorSessions().catch(() => ({ sessions: [] })),
        fetchMentorResources().catch(() => []),
        fetchIncomingRequests().catch(() => []),
        fetchMyStartups().catch(() => ({ startups: [] })),
      ]);

      const loadedReports = Array.isArray(reportsRes) ? reportsRes : reportsRes.reports || [];
      const loadedSessions = Array.isArray(sessionsRes) ? sessionsRes : sessionsRes.sessions || [];
      const loadedResources = Array.isArray(resourcesRes) ? resourcesRes : resourcesRes.resources || resourcesRes.requests || [];
      const loadedRequests = Array.isArray(requestsRes) ? requestsRes : requestsRes.requests || [];
      const loadedStartups = Array.isArray(startupsRes?.startups) ? startupsRes.startups : [];

      setReports(loadedReports);
      setSessions(loadedSessions);
      setResources(loadedResources);
      setRequests(loadedRequests);
      setConnectedStartups(loadedStartups);

      const activities = buildMentorActivities({
        reports: loadedReports,
        sessions: loadedSessions,
        resources: loadedResources,
        requests: loadedRequests,
      });
      if (activities.length) setSelectedActivityId(activities[0].id);
    } catch (e) {
      setError(e.message || "Failed to load mentorship activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  useEffect(() => {
    const search = searchParams.get("search") || "";
    queueMicrotask(() => setQuery(search));
  }, [searchParams]);

  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const activities = useMemo(
    () => buildMentorActivities({ reports, sessions, resources, requests }),
    [reports, sessions, resources, requests],
  );

  const uniqueStartups = useMemo(() => {
    const map = new Map();
    connectedStartups.forEach((s) => {
      if (s.startup_id) map.set(s.startup_id, s.startup_name);
    });
    activities.forEach((a) => {
      if (a.startup_id && a.startup_name) map.set(a.startup_id, a.startup_name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [connectedStartups, activities]);

  const filtered = useMemo(() => {
    let result = activities;
    const needle = query.trim().toLowerCase();
    if (needle) {
      result = result.filter((a) =>
        [a.title, a.subtitle, a.startup_name].some((v) =>
          String(v || "").toLowerCase().includes(needle),
        ),
      );
    }
    if (dateRange.start) {
      result = result.filter((a) => new Date(a.date) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      result = result.filter((a) => new Date(a.date) <= endOfDay(dateRange.end));
    }
    if (selectedStartup) {
      result = result.filter((a) => String(a.startup_id) === String(selectedStartup));
    }
    if (typeFilter) {
      result = result.filter((a) => a.type === typeFilter);
    }
    return result;
  }, [activities, query, dateRange, selectedStartup, typeFilter]);

  const selectedActivity = useMemo(
    () => filtered.find((a) => a.id === selectedActivityId) || filtered[0] || null,
    [filtered, selectedActivityId],
  );

  const stats = useMemo(() => {
    const avg =
      reports.reduce((sum, r) => sum + Number(r.progress_rating || 0), 0) / (reports.length || 1);
    const startupIds = new Set();
    connectedStartups.forEach((s) => s.startup_id && startupIds.add(s.startup_id));
    activities.forEach((a) => a.startup_id && startupIds.add(a.startup_id));
    const thisMonth = activities.filter((a) => {
      const d = new Date(a.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return {
      totalActivities: activities.length,
      reports: reports.length,
      sessions: sessions.length,
      resources: resources.length,
      uniqueStartups: startupIds.size,
      average: reports.length ? avg.toFixed(1) : "—",
      thisMonth,
    };
  }, [activities, reports, sessions, resources, connectedStartups]);

  const handleExportPDF = useCallback(() => {
    const report = selectedActivity?.type === "report" ? selectedActivity.data : null;
    if (!report) return;
    const printContent = `
MENTORSHIP REPORT
=================

Title: ${report.report_title || "Session Report"}
Startup: ${report.startup_name}
Date: ${formatDate(report.created_at)}
Progress Rating: ${report.progress_rating || "N/A"}/5

EXECUTIVE SUMMARY
------------------
${report.summary || "No summary provided."}

ACTION ITEMS
------------
${parseList(report.action_items).map((item, i) => `${i + 1}. ${item}`).join("\n") || "No action items."}

NEXT STEPS
----------
${parseList(report.next_steps).map((item, i) => `${i + 1}. ${item}`).join("\n") || "No next steps."}
    `;
    const blob = new Blob([printContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mentorship-report-${report.report_id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedActivity]);

  return (
    <div
      className="min-h-screen flex bg-[#fbfcfc]"
    >
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-100 bg-white"
        >
          <div>
            <h1 className="text-xl font-black text-[#052b23] leading-none">Activity & Reports</h1>
            <p className="text-[12px] text-gray-400 mt-0.5">
              Sessions, resources, requests, and mentorship reports in one place
            </p>
          </div>
          <div className="relative flex-1 max-w-xs">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search activity…"
              className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm outline-none transition"
            />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto space-y-6">
          {error ? (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">{error}</div>
          ) : null}

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#052b23]">From:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#052b23]">To:</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none"
              />
            </div>
            <select
              value={selectedStartup}
              onChange={(e) => setSelectedStartup(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none"
            >
              <option value="">All startups</option>
              {uniqueStartups.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none"
            >
              <option value="">All activity</option>
              <option value="report">Reports</option>
              <option value="session">Sessions</option>
              <option value="resource">Resources</option>
              <option value="request">Requests</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setDateRange({ start: "", end: "" });
                setSelectedStartup("");
                setTypeFilter("");
                setQuery("");
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700"
            >
              Clear filters
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              label="Total Activity"
              value={stats.totalActivities}
              accent="#10b981"
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />}
            />
            <StatCard
              label="Connected Startups"
              value={stats.uniqueStartups}
              accent="#6366f1"
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />}
            />
            <StatCard
              label="Reports"
              value={stats.reports}
              accent="#0ea5e9"
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
            />
            <StatCard
              label="Sessions"
              value={stats.sessions}
              accent="#8b5cf6"
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
            />
            <StatCard
              label="Resources"
              value={stats.resources}
              accent="#f59e0b"
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />}
            />
            <StatCard
              label="This Month"
              value={stats.thisMonth}
              accent="#ec4899"
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
            />
          </div>

          <div className="flex gap-5 items-start">
            <div className="w-80 shrink-0 flex flex-col gap-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#052b23] px-1 sticky top-0 bg-transparent">
                {filtered.length} activit{filtered.length === 1 ? "y" : "ies"}
              </p>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-28 rounded-2xl animate-pulse bg-white/50" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div
                  className="rounded-2xl p-6 text-center"
                  style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.5)" }}
                >
                  <p className="text-sm font-bold text-gray-600">No activity yet</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Connect with startups, schedule sessions, share resources, or complete sessions to generate reports.
                  </p>
                </div>
              ) : (
                filtered.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    selected={selectedActivity?.id === activity.id}
                    onClick={() => setSelectedActivityId(activity.id)}
                  />
                ))
              )}
            </div>

            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="h-96 rounded-2xl animate-pulse bg-white/60" />
              ) : selectedActivity ? (
                selectedActivity.type === "report" ? (
                  <ReportDetail report={selectedActivity.data} onExport={handleExportPDF} />
                ) : (
                  <ActivityDetail activity={selectedActivity} />
                )
              ) : (
                <div
                  className="rounded-2xl p-12 text-center"
                  style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.5)" }}
                >
                  <p className="text-gray-500 text-sm">Select an activity to view details</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
