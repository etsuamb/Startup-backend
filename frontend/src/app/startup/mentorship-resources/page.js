"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/startup/Sidebar";
import { getMentorshipResources } from "@/lib/startupApi";
import { openUploadedFileForView, resolveUploadedFileUrl } from "@/lib/viewUploadedFile";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function mentorName(resource) {
  const first = resource.mentor_first_name || "";
  const last = resource.mentor_last_name || "";
  const full = `${first} ${last}`.trim();
  return full || resource.headline || "Your mentor";
}

function typeLabel(type) {
  if (type === "file") return "Document";
  if (type === "link") return "Link";
  return "Note";
}

function typeBadgeClass(type) {
  if (type === "file") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (type === "link") return "bg-sky-50 text-sky-700 border-sky-100";
  return "bg-amber-50 text-amber-800 border-amber-100";
}

function bytes(value) {
  const size = Number(value || 0);
  if (!size) return "";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  return `${(size / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function ResourceCard({ resource, selected, onSelect }) {
  const mentor = mentorName(resource);
  return (
    <button
      type="button"
      onClick={() => onSelect(resource)}
      className={`w-full text-left rounded-2xl border p-5 transition-all ${
        selected
          ? "border-[#10b981] bg-emerald-50/40 shadow-md"
          : "border-gray-100 bg-white hover:border-[#10b981]/40 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#061e16] text-white flex items-center justify-center font-black text-sm shrink-0">
          {mentor.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 truncate">{resource.resource_title}</h3>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${typeBadgeClass(resource.resource_type)}`}>
              {typeLabel(resource.resource_type)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">From {mentor}</p>
          <p className="text-xs text-gray-400 mt-2">{formatDate(resource.created_at)}</p>
        </div>
      </div>
    </button>
  );
}

function ResourceDetail({ resource }) {
  const mentor = mentorName(resource);
  const fileUrl = resolveUploadedFileUrl(resource.file_path);

  function openFile() {
    if (resource.file_path) {
      openUploadedFileForView({
        filePath: resource.file_path,
        fileName: resource.file_name,
        fileType: resource.file_type,
      });
    }
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-5 bg-gradient-to-br from-[#061e16] to-[#0f3d32] text-white">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Shared by your mentor</p>
        <h2 className="text-xl font-black mt-1 leading-tight">{resource.resource_title}</h2>
        <p className="text-sm text-emerald-100/90 mt-1">{mentor}</p>
        <p className="text-xs text-white/60 mt-3">Shared on {formatDate(resource.created_at)}</p>
      </div>
      <div className="p-6 space-y-5">
        {resource.resource_description ? (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{resource.resource_description}</p>
          </div>
        ) : null}

        {resource.external_url ? (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">External link</p>
            <a
              href={resource.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#0a4d3c] hover:underline break-all"
            >
              Open resource
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        ) : null}

        {resource.file_name ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Attached file</p>
              <p className="font-bold text-gray-900 truncate">{resource.file_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {[resource.file_type, bytes(resource.file_size_bytes)].filter(Boolean).join(" · ")}
              </p>
            </div>
            {fileUrl ? (
              <button
                type="button"
                onClick={openFile}
                className="shrink-0 rounded-xl bg-[#061e16] px-4 py-2.5 text-xs font-black text-white hover:bg-[#0f3d32] transition"
              >
                View file
              </button>
            ) : (
              <span className="text-xs text-gray-400">Preview unavailable</span>
            )}
          </div>
        ) : null}

        {!resource.resource_description && !resource.external_url && !resource.file_name ? (
          <p className="text-sm text-gray-500">No additional details were provided with this resource.</p>
        ) : null}
      </div>
    </div>
  );
}

export default function StartupMentorshipResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMentorshipResources();
      const list = Array.isArray(data) ? data : data.resources || data.requests || [];
      setResources(list);
      if (list.length) setSelectedId(list[0].resource_id);
    } catch (e) {
      setError(e.message || "Failed to load mentor resources.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (typeFilter && r.resource_type !== typeFilter) return false;
      if (!needle) return true;
      return [r.resource_title, r.resource_description, mentorName(r), r.file_name]
        .some((v) => String(v || "").toLowerCase().includes(needle));
    });
  }, [resources, query, typeFilter]);

  const selected = useMemo(
    () => filtered.find((r) => r.resource_id === selectedId) || filtered[0] || null,
    [filtered, selectedId],
  );

  const stats = useMemo(() => {
    const mentors = new Set(resources.map((r) => mentorName(r)));
    return {
      total: resources.length,
      files: resources.filter((r) => r.resource_type === "file").length,
      links: resources.filter((r) => r.resource_type === "link").length,
      mentors: mentors.size,
    };
  }, [resources]);

  return (
    <div className="min-h-screen flex bg-[#f4f7f6]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#061e16]">Mentor Resources</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Guides, documents, and links shared by your mentors
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/startup/chat?kind=mentor"
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Mentor chat
              </Link>
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="rounded-xl bg-[#061e16] px-4 py-2 text-xs font-black text-white disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total resources", value: stats.total },
              { label: "Documents", value: stats.files },
              { label: "Links", value: stats.links },
              { label: "Mentors", value: stats.mentors },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{item.label}</p>
                <p className="text-2xl font-black text-[#061e16] mt-1">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search resources…"
                className="w-full h-10 rounded-xl border border-gray-200 bg-white pl-4 pr-4 text-sm outline-none focus:border-[#10b981]"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none"
            >
              <option value="">All types</option>
              <option value="file">Documents</option>
              <option value="link">Links</option>
              <option value="note">Notes</option>
            </select>
          </div>

          <div className="flex flex-col lg:flex-row gap-5 items-start">
            <div className="w-full lg:w-[360px] shrink-0 space-y-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#061e16] px-1">
                {filtered.length} resource{filtered.length !== 1 ? "s" : ""}
              </p>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-2xl bg-white animate-pulse border border-gray-100" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
                  <p className="text-sm font-bold text-gray-700">No resources yet</p>
                  <p className="text-xs text-gray-500 mt-2 max-w-xs mx-auto">
                    When your mentor shares guides, files, or links, they will appear here.
                  </p>
                  <Link
                    href="/startup/discover"
                    className="inline-block mt-4 text-xs font-black text-[#0a4d3c] hover:underline"
                  >
                    Find a mentor →
                  </Link>
                </div>
              ) : (
                filtered.map((resource) => (
                  <ResourceCard
                    key={resource.resource_id}
                    resource={resource}
                    selected={selected?.resource_id === resource.resource_id}
                    onSelect={(r) => setSelectedId(r.resource_id)}
                  />
                ))
              )}
            </div>

            <div className="flex-1 min-w-0 w-full">
              {loading ? (
                <div className="h-80 rounded-2xl bg-white animate-pulse border border-gray-100" />
              ) : selected ? (
                <ResourceDetail resource={selected} />
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
                  <p className="text-sm text-gray-500">Select a resource to view details</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
