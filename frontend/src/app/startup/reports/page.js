"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/startup/Sidebar";
import {
  getDashboardActivities,
  getDocuments,
  getMyProjects,
  getStartupFundingSummary,
  getStartupOffers,
  getStartupProfile,
} from "@/lib/startupApi";

function formatMoney(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(amount % 1000000 ? 1 : 0)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(amount % 1000 ? 1 : 0)}K`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function downloadReport(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function Icon({ path, className = "h-4 w-4" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={path} />
    </svg>
  );
}

function MetricCard({ icon, label, value, note, tone = "green" }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-sky-50 text-sky-700",
    gray: "bg-gray-100 text-gray-500",
  };
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-md ${tones[tone]}`}>
          <Icon path={icon} className="h-4 w-4" />
        </div>
        {note ? <span className="text-[10px] font-bold text-emerald-600">{note}</span> : null}
      </div>
      <p className="mt-4 text-[9px] font-black uppercase tracking-[0.14em] text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-black text-gray-950">{value}</p>
    </div>
  );
}

function ChecklistItem({ label, checked }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
      <span className={`flex h-4 w-4 items-center justify-center rounded ${checked ? "bg-[#0f7a5c] text-white" : "border border-gray-300 bg-white text-transparent"}`}>
        <Icon path="M5 13l4 4L19 7" className="h-3 w-3" />
      </span>
      {label}
    </div>
  );
}

function InsightItem({ title, body }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <span className="h-2 w-2 rounded-full bg-[#0f7a5c]" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-black text-gray-950">{title}</p>
        <p className="mt-1 truncate text-xs text-gray-500">{body}</p>
      </div>
      <Icon path="M9 5l7 7-7 7" className="h-3.5 w-3.5 text-gray-400" />
    </div>
  );
}

function ReadinessRing({ value }) {
  return (
    <div className="relative mx-auto grid h-36 w-36 place-items-center rounded-full bg-gray-100">
      <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#0f7a5c ${value * 3.6}deg, transparent 0deg)` }} />
      <div className="relative grid h-28 w-28 place-items-center rounded-full bg-white">
        <div className="text-center">
          <p className="text-4xl font-black leading-none text-[#062f26]">{value}%</p>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-gray-500">Optimized</p>
        </div>
      </div>
    </div>
  );
}

export default function StartupReportsPage() {
  const [startup, setStartup] = useState(null);
  const [funding, setFunding] = useState(null);
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [offers, setOffers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [reportType, setReportType] = useState("readiness");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function loadReports() {
      setLoading(true);
      setError("");
      try {
        const [profileRes, fundingRes, projectsRes, documentsRes, offersRes, activitiesRes] = await Promise.all([
          getStartupProfile(),
          getStartupFundingSummary().catch(() => null),
          getMyProjects().catch(() => ({ projects: [] })),
          getDocuments().catch(() => ({ documents: [] })),
          getStartupOffers().catch(() => ({ offers: [] })),
          getDashboardActivities({ limit: 8 }).catch(() => ({ activity: [] })),
        ]);
        if (!alive) return;
        setStartup(profileRes.startup || null);
        setFunding(fundingRes || null);
        setProjects(projectsRes.projects || []);
        setDocuments(documentsRes.documents || []);
        setOffers(offersRes.offers || []);
        setActivities(activitiesRes.activity || []);
      } catch (err) {
        if (alive) setError(err.message || "Unable to load startup reports.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadReports();
    return () => {
      alive = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const fundingTarget = Number(startup?.funding_needed || funding?.required_funding || 0);
    const raised = Math.max(Number(funding?.amount_raised_in_projects || 0), Number(funding?.received_funding || 0));
    const pendingOffers = offers.filter((offer) => String(offer.status || "").toLowerCase() === "pending");
    const highValueOffers = offers.filter((offer) => Number(offer.amount || offer.investment_amount || 0) >= 100000);
    const readiness = Math.min(100, Math.round(((documents.length >= 4 ? 30 : documents.length * 7) + (projects.length ? 25 : 0) + (offers.length ? 20 : 0) + (fundingTarget ? 25 : 0))));
    return {
      fundingTarget,
      raised,
      progress: fundingTarget ? Math.min(100, Math.round((raised / fundingTarget) * 100)) : 0,
      pendingOffers: pendingOffers.length,
      highValueOffers: highValueOffers.length,
      readiness,
      pipelineValue: offers.reduce((sum, offer) => sum + Number(offer.amount || offer.investment_amount || 0), 0),
    };
  }, [documents.length, funding, offers, projects.length, startup]);

  const reportText = useMemo(() => {
    return [
      "StartupConnect Startup Report",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      `Startup: ${startup?.startup_name || "Not provided"}`,
      `Industry: ${startup?.industry || "Not provided"}`,
      `Funding Target: ${formatMoney(metrics.fundingTarget)}`,
      `Raised: ${formatMoney(metrics.raised)}`,
      `Readiness: ${metrics.readiness}%`,
      `Projects: ${projects.length}`,
      `Documents: ${documents.length}`,
      `Pending Offers: ${metrics.pendingOffers}`,
      "",
      "Recent Activity:",
      ...(activities.length ? activities.map((item) => `- ${item.title || item.activity_type || "Activity"}: ${item.description || item.message || ""}`) : ["- No recent activity"]),
    ].join("\n");
  }, [activities, documents.length, metrics, projects.length, startup]);

  return (
    <div className="flex min-h-screen bg-[#f4f7f6] font-sans text-gray-900">
      <Sidebar />
      <main className="min-w-0 flex-grow overflow-y-auto p-6 pt-24">
        <div className="mx-auto grid max-w-[1180px] gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="min-w-0 space-y-5">
            <div className="relative overflow-hidden rounded-lg bg-[#073f32] p-8 text-white shadow-sm">
              <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_55%)]" />
              <div className="relative max-w-xl">
                <span className="rounded bg-[#7bf4a8] px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#073f32]">Report Studio</span>
                <h1 className="mt-5 text-3xl font-black tracking-tight">Generate a board-ready report</h1>
                <p className="mt-3 text-sm leading-6 text-emerald-50/80">
                  Aggregate real-time funding, project, document, and offer updates into one professional report.
                </p>
                <button
                  type="button"
                  onClick={() => downloadReport(`startup-report-${Date.now()}.txt`, reportText)}
                  disabled={loading}
                  className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-[#7bf4a8] px-5 text-sm font-black text-[#073f32] transition hover:bg-[#9cffbd] disabled:opacity-50"
                >
                  <Icon path="M13 10V3L4 14h7v7l9-11h-7z" />
                  Generate Report
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 rounded-lg bg-white p-1 shadow-sm">
              {[["readiness", "Investor Readiness / Operations"], ["pipeline", "Portfolio / Pipeline"]].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setReportType(key)}
                  className={`h-9 rounded-md text-xs font-black transition ${reportType === key ? "bg-[#f4f7f6] text-gray-950 shadow-sm" : "text-gray-500"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 9v1" label="Funding Target" value={loading ? "..." : formatMoney(metrics.fundingTarget)} note="+12%" />
              <MetricCard icon="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6" label="Active Projects" value={loading ? "..." : projects.length} note="On track" tone="blue" />
              <MetricCard icon="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125" label="Documents" value={loading ? "..." : documents.length} note={`${metrics.pendingOffers} pending`} tone="gray" />
              <MetricCard icon="M13 10V3L4 14h7v7l9-11h-7z" label="Offer Pipeline" value={loading ? "..." : formatMoney(metrics.pipelineValue)} note={`${metrics.highValueOffers} high-value`} />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-950">Designed Insights</h2>
                <button type="button" className="text-xs font-black text-[#0f7a5c]">View all</button>
              </div>
              <div className="space-y-3">
                <InsightItem title="Funding velocity has increased by 18%" body="Investor engagement is at an all-time high this quarter." />
                <InsightItem title="Document readiness is improving" body={`${documents.length} diligence file${documents.length === 1 ? "" : "s"} are currently available.`} />
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-black text-gray-950">Investor Readiness</h2>
              <div className="mt-6">
                <ReadinessRing value={loading ? 0 : metrics.readiness} />
              </div>
              <div className="my-5 h-px bg-gray-200" />
              <div className="space-y-2">
                {["High Quality", "Live Data", "Verified Sync"].map((item) => (
                  <span key={item} className="inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-[#0f7a5c]">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-black text-gray-950">Report Contents</h2>
              <div className="space-y-3">
                <ChecklistItem label="Executive Summary" checked />
                <ChecklistItem label="Financial Projections" checked />
                <ChecklistItem label="KPI Dashboards" checked />
                <ChecklistItem label="Founder Backgrounds" checked={false} />
                <ChecklistItem label="Appendix Documents" checked={false} />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-black text-gray-950">Live Preview</h2>
                <span className="text-gray-300">•••</span>
              </div>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-gray-100 bg-[#f8fafc] p-4 text-[11px] leading-5 text-gray-600">
                {loading ? "Loading report data..." : reportText}
              </pre>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
