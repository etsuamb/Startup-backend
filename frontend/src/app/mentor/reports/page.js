"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { fetchMentorReports, fetchMentorSessions } from "@/lib/mentorApi";


/* ─── Helpers ─────────────────────────────────────────────── */
function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d)
    ? "—"
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
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

/* ─── Stat Card ───────────────────────────────────────────── */
function StatCard({ label, value, icon, accent }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.5)", boxShadow: "0 4px 24px 0 rgba(10,77,60,0.07)" }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: accent }}
      />
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

/* ─── Report Card ─────────────────────────────────────────── */
function ReportCard({ report, selected, onClick }) {
  const rc = ratingColor(report.progress_rating);
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl p-5 transition-all duration-200 group"
      style={{
        background: selected ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.72)",
        backdropFilter: "blur(14px)",
        border: selected ? "1.5px solid #10b981" : "1px solid rgba(255,255,255,0.5)",
        boxShadow: selected
          ? "0 4px 24px 0 rgba(16,185,129,0.12)"
          : "0 2px 12px 0 rgba(10,77,60,0.06)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #0a4d3c, #10b981)" }}
        >
          {initials(report.startup_name)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[13px] text-gray-900 truncate leading-tight">
            {report.report_title || "Session Report"}
          </h3>
          <p className="text-[11px] text-gray-500 truncate">{report.startup_name}</p>
        </div>
        {report.progress_rating && (
          <span
            className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${rc.bg} ${rc.text}`}
          >
            {report.progress_rating}/5
          </span>
        )}
      </div>
      <p className="mt-3 text-[12px] text-gray-600 line-clamp-2 leading-relaxed">
        {report.summary || "Auto-generated session report."}
      </p>
      <p className="mt-2 text-[11px] text-gray-400">{formatDate(report.created_at)}</p>
    </button>
  );
}

/* ─── Chip ────────────────────────────────────────────────── */
function Chip({ children, color }) {
  return (
    <span
      className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full"
      style={{ background: `${color}15`, color }}
    >
      {children}
    </span>
  );
}

/* ─── Progress Trend Chart ───────────────────────────────── */
function ProgressTrendChart({ reports }) {
  const chartData = useMemo(() => {
    const monthlyData = {};
    reports.forEach((r) => {
      if (r.progress_rating && r.created_at) {
        const date = new Date(r.created_at);
        const key = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        if (!monthlyData[key]) {
          monthlyData[key] = { total: 0, count: 0 };
        }
        monthlyData[key].total += Number(r.progress_rating);
        monthlyData[key].count += 1;
      }
    });
    
    const sorted = Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(-6)
      .map(([month, data]) => ({
        month,
        average: (data.total / data.count).toFixed(1),
        count: data.count,
      }));
    
    return sorted;
  }, [reports]);
  
  const maxRating = 5;
  
  if (chartData.length === 0) {
    return (
      <div
        className="rounded-2xl p-6 text-center"
        style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.5)" }}
      >
        <p className="text-sm text-gray-500">No rating data available for chart</p>
      </div>
    );
  }
  
  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.6)" }}
    >
      <h3 className="text-[13px] font-black uppercase tracking-wider text-[#0a4d3c] mb-4">Progress Trend (Last 6 Months)</h3>
      <div className="flex items-end gap-2 h-32">
        {chartData.map((d, i) => {
          const height = (d.average / maxRating) * 100;
          const rc = ratingColor(d.average);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full h-full flex items-end">
                <div
                  className="w-full rounded-t-lg transition-all duration-500"
                  style={{
                    height: `${height}%`,
                    background: `linear-gradient(180deg, ${rc.bar} 0%, ${rc.bar}88 100%)`,
                    minHeight: "4px",
                  }}
                />
              </div>
              <div className="text-[10px] font-bold text-gray-600 text-center">
                <div>{d.month}</div>
                <div className="text-[9px] text-gray-400">{d.count} report{d.count !== 1 ? "s" : ""}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Detail Panel ────────────────────────────────────────── */
function ReportDetail({ report }) {
  const rc = ratingColor(report.progress_rating);
  const actionItems = parseList(report.action_items);
  const nextSteps = parseList(report.next_steps);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.6)",
        boxShadow: "0 8px 40px 0 rgba(10,77,60,0.10)",
      }}
    >
      {/* Header */}
      <div
        className="px-7 py-6"
        style={{ background: "linear-gradient(135deg, #0a4d3c 0%, #0d6b54 100%)" }}
      >
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
            <button
              type="button"
              onClick={handleExportPDF}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              title="Export report"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {report.progress_rating && (
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
        )}
      </div>

      {/* Body */}
      <div className="p-7 space-y-7">
        {/* Summary */}
        {report.summary && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full bg-[#10b981]" />
              <h3 className="text-[13px] font-black uppercase tracking-wider text-[#0a4d3c]">Executive Summary</h3>
            </div>
            <p className="text-[14px] text-gray-700 leading-relaxed">{report.summary}</p>
          </div>
        )}

        {/* Action Items */}
        {actionItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full bg-[#f59e0b]" />
              <h3 className="text-[13px] font-black uppercase tracking-wider text-[#0a4d3c]">Action Items</h3>
            </div>
            <ul className="space-y-2">
              {actionItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[13px] text-gray-700 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Steps */}
        {nextSteps.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full bg-[#6366f1]" />
              <h3 className="text-[13px] font-black uppercase tracking-wider text-[#0a4d3c]">Next Steps</h3>
            </div>
            <ul className="space-y-2">
              {nextSteps.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <span className="text-[13px] text-gray-700 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Two-column row */}
        {(report.startup_feedback || report.mentor_notes) && (
          <div className="grid md:grid-cols-2 gap-4">
            {report.startup_feedback && (
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}
              >
                <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700 mb-2">Founder Feedback</p>
                <p className="text-[13px] text-gray-700 leading-relaxed">{report.startup_feedback}</p>
              </div>
            )}
            {report.mentor_notes && (
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}
              >
                <p className="text-[11px] font-black uppercase tracking-widest text-indigo-700 mb-2">Mentor Notes</p>
                <p className="text-[13px] text-gray-700 leading-relaxed">{report.mentor_notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────── */
export default function MentorReportsPage() {
  const [reports, setReports] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedStartup, setSelectedStartup] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([fetchMentorReports(), fetchMentorSessions()]);
      const loadedReports = Array.isArray(r) ? r : r.reports || [];
      const loadedSessions = Array.isArray(s) ? s : s.sessions || [];
      setReports(loadedReports);
      setSessions(loadedSessions);
      if (loadedReports.length) setSelectedId(loadedReports[0].report_id);
    } catch (e) {
      setError(e.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let result = reports;
    
    // Text search
    const needle = query.trim().toLowerCase();
    if (needle) {
      result = result.filter((r) =>
        [r.report_title, r.summary, r.startup_name].some((v) =>
          String(v || "").toLowerCase().includes(needle)
        )
      );
    }
    
    // Date range filter
    if (dateRange.start) {
      result = result.filter((r) => new Date(r.created_at) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      result = result.filter((r) => new Date(r.created_at) <= new Date(dateRange.end));
    }
    
    // Startup filter
    if (selectedStartup) {
      result = result.filter((r) => r.startup_id === Number(selectedStartup));
    }
    
    // Rating filter
    if (ratingFilter) {
      result = result.filter((r) => Number(r.progress_rating) === Number(ratingFilter));
    }
    
    return result;
  }, [query, reports, dateRange, selectedStartup, ratingFilter]);

  const uniqueStartups = useMemo(() => {
    const startups = new Map();
    // Add startups from reports
    reports.forEach((r) => {
      if (r.startup_id && r.startup_name) {
        startups.set(r.startup_id, r.startup_name);
      }
    });
    // Add startups from sessions
    sessions.forEach((s) => {
      if (s.startup_id && s.startup_name && !startups.has(s.startup_id)) {
        startups.set(s.startup_id, s.startup_name);
      }
    });
    return Array.from(startups.entries()).map(([id, name]) => ({ id, name }));
  }, [reports, sessions]);

  const handleExportPDF = () => {
    const report = selected;
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

FOUNDER FEEDBACK
----------------
${report.startup_feedback || "No feedback provided."}

MENTOR NOTES
------------
${report.mentor_notes || "No notes provided."}
    `;
    
    const blob = new Blob([printContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mentorship-report-${report.report_id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Real-time updates with polling
  useEffect(() => {
    const interval = setInterval(() => {
      load();
    }, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [load]);

  const selected = useMemo(
    () => reports.find((r) => r.report_id === selectedId) || reports[0] || null,
    [reports, selectedId]
  );

  const stats = useMemo(() => {
    const avg =
      reports.reduce((sum, r) => sum + Number(r.progress_rating || 0), 0) /
      (reports.length || 1);
    
    // Count unique startups from both reports and sessions
    const reportStartups = new Set(reports.map((r) => r.startup_id).filter(Boolean));
    const sessionStartups = new Set(sessions.map((s) => s.startup_id).filter(Boolean));
    const allStartups = new Set([...reportStartups, ...sessionStartups]);
    const uniqueStartupsCount = allStartups.size;
    
    const pending = sessions.filter(
      (s) => !reports.some((r) => Number(r.mentorship_session_id) === Number(s.mentorship_session_id))
    ).length;
    const thisMonth = reports.filter((r) => {
      const d = new Date(r.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return { total: reports.length, average: avg.toFixed(1), uniqueStartups: uniqueStartupsCount, pending, thisMonth };
  }, [reports, sessions]);

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "linear-gradient(135deg, #e8f5ef 0%, #ddeef7 50%, #e8f0fa 100%)" }}
    >
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 py-4 border-b"
          style={{
            background: "rgba(255,255,255,0.80)",
            backdropFilter: "blur(14px)",
            borderColor: "rgba(10,77,60,0.08)",
          }}
        >
          <div>
            <h1 className="text-xl font-black text-[#0a4d3c] leading-none">Reports</h1>
            <p className="text-[12px] text-gray-400 mt-0.5">Auto-generated mentorship session reports</p>
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
              placeholder="Search reports…"
              className="w-full rounded-xl border pl-9 pr-4 py-2 text-sm outline-none transition"
              style={{
                background: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(10,77,60,0.12)",
                color: "#111",
              }}
              onFocus={(e) => (e.target.style.border = "1.5px solid #10b981")}
              onBlur={(e) => (e.target.style.border = "1px solid rgba(10,77,60,0.12)")}
            />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#0a4d3c]">From:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="rounded-lg border px-3 py-1.5 text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(10,77,60,0.12)" }}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#0a4d3c]">To:</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="rounded-lg border px-3 py-1.5 text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(10,77,60,0.12)" }}
              />
            </div>
            <select
              value={selectedStartup}
              onChange={(e) => setSelectedStartup(e.target.value)}
              className="rounded-lg border px-3 py-1.5 text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(10,77,60,0.12)" }}
            >
              <option value="">All Startups</option>
              {uniqueStartups.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="rounded-lg border px-3 py-1.5 text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(10,77,60,0.12)" }}
            >
              <option value="">All Ratings</option>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{r} Stars</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => { setDateRange({ start: "", end: "" }); setSelectedStartup(""); setRatingFilter(""); }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#0a4d3c] transition"
              style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(10,77,60,0.12)" }}
            >
              Clear Filters
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              label="Total Reports"
              value={stats.total}
              accent="#10b981"
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
            />
            <StatCard
              label="Avg Rating"
              value={`${stats.average}/5`}
              accent="#f59e0b"
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />}
            />
            <StatCard
              label="Startups"
              value={stats.uniqueStartups}
              accent="#6366f1"
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />}
            />
            <StatCard
              label="This Month"
              value={stats.thisMonth}
              accent="#8b5cf6"
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
            />
          </div>

          {/* Progress Trend Chart */}
          <ProgressTrendChart reports={reports} />

          {/* Split layout: list + detail */}
          <div className="flex gap-5 items-start">
            {/* Report list */}
            <div className="w-72 shrink-0 flex flex-col gap-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#0a4d3c] px-1">
                {filtered.length} Report{filtered.length !== 1 ? "s" : ""}
              </p>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-28 rounded-2xl animate-pulse"
                      style={{ background: "rgba(255,255,255,0.5)" }}
                    />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div
                  className="rounded-2xl p-6 text-center"
                  style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.5)" }}
                >
                  <p className="text-sm text-gray-500">No reports found</p>
                </div>
              ) : (
                filtered.map((r) => (
                  <ReportCard
                    key={r.report_id}
                    report={r}
                    selected={selected?.report_id === r.report_id}
                    onClick={() => setSelectedId(r.report_id)}
                  />
                ))
              )}
            </div>

            {/* Detail panel */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div
                  className="h-80 rounded-2xl animate-pulse"
                  style={{ background: "rgba(255,255,255,0.6)" }}
                />
              ) : selected ? (
                <ReportDetail report={selected} onExport={handleExportPDF} />
              ) : (
                <div
                  className="rounded-2xl p-12 text-center"
                  style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.5)" }}
                >
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 text-sm">Select a report to view details</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
