"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchMentorResources,
  fetchMyStartups,
  shareResource,
} from "@/lib/mentorApi";
import {
  saveDraft,
  loadDraft,
  clearDraft,
  getDraftSavedAt,
  formatSavedTime,
} from "@/lib/formDraft";
import { openUploadedFileForView } from "@/lib/viewUploadedFile";

const DRAFT_KEY = "mentor_resources_share";

const RESOURCE_TYPES = [
  { value: "file", label: "Document" },
  { value: "link", label: "Link" },
  { value: "note", label: "Note" },
];

const CATEGORIES = [
  "Business Model",
  "Pitch",
  "Financial Model",
  "Marketing",
  "Operations",
  "Growth",
];

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function resourceStatus(resource) {
  if (resource.external_url) return "Downloadable";
  if (resource.file_name) return "Viewed";
  return "Sent";
}

function statusClass(status) {
  if (status === "Viewed") return "bg-emerald-50 text-emerald-700";
  if (status === "Downloadable") return "bg-cyan-50 text-cyan-700";
  return "bg-gray-100 text-gray-600";
}

function shortType(type) {
  if (type === "file") return "Resource";
  if (type === "link") return "Link";
  return "Note";
}

function bytes(value) {
  const size = Number(value || 0);
  if (!size) return "";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1,
  );
  return `${(size / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export default function MentorResourcesPage() {
  const searchParams = useSearchParams();
  const [resources, setResources] = useState([]);
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState(searchParams.get("search") || "");
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);
  const [showDraftNotice, setShowDraftNotice] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [form, setForm] = useState({
    mentorship_request_id: "",
    resource_title: "",
    resource_description: "",
    resource_type: "file",
    category: CATEGORIES[0],
    external_url: "",
    note: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError("");
      const [resourceData, startupData] = await Promise.all([
        fetchMentorResources(),
        fetchMyStartups(),
      ]);
      const loadedResources = Array.isArray(resourceData)
        ? resourceData
        : resourceData.resources || resourceData.requests || [];
      const loadedStartups = Array.isArray(startupData.startups)
        ? startupData.startups
        : [];
      setResources(loadedResources);
      setStartups(loadedStartups);

      // Load draft after data is loaded
      const savedDraft = loadDraft(DRAFT_KEY);
      if (savedDraft) {
        setForm((current) => ({
          mentorship_request_id:
            savedDraft.mentorship_request_id ||
            current.mentorship_request_id ||
            loadedStartups[0]?.mentorship_request_id ||
            "",
          resource_title: savedDraft.resource_title || "",
          resource_description: savedDraft.resource_description || "",
          resource_type: savedDraft.resource_type || "file",
          category: savedDraft.category || CATEGORIES[0],
          external_url: savedDraft.external_url || "",
          note: savedDraft.note || "",
        }));
        setShowDraftNotice(true);
        setTimeout(() => setShowDraftNotice(false), 4000);
      } else {
        setForm((current) => ({
          ...current,
          mentorship_request_id:
            current.mentorship_request_id ||
            loadedStartups[0]?.mentorship_request_id ||
            "",
        }));
      }
    } catch (ex) {
      setError(ex.message || "Failed to load resources.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load for this route.
    load();
  }, [load]);

  useEffect(() => {
    const search = searchParams.get("search") || "";
    queueMicrotask(() => setQuery(search));
  }, [searchParams]);

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.values(form).some((v) => v && String(v).trim())) {
        const draftData = { ...form };
        saveDraft(DRAFT_KEY, draftData);
        const savedAt = getDraftSavedAt(DRAFT_KEY);
        setDraftSavedAt(formatSavedTime(savedAt));
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [form]);

  const selectedStartup = useMemo(
    () =>
      startups.find(
        (startup) =>
          String(startup.mentorship_request_id) ===
          String(form.mentorship_request_id),
      ) || null,
    [startups, form.mentorship_request_id],
  );

  const previewResource = useMemo(() => {
    const latest = resources[0];
    return {
      title:
        form.resource_title || latest?.resource_title || "Resource preview",
      description:
        form.resource_description ||
        latest?.resource_description ||
        "A short description will appear here.",
      type: form.resource_type,
      startup:
        selectedStartup?.startup_name ||
        latest?.startup_name ||
        "Selected startup",
    };
  }, [
    form.resource_description,
    form.resource_title,
    form.resource_type,
    resources,
    selectedStartup,
  ]);

  const filteredResources = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return resources;
    return resources.filter((resource) =>
      [
        resource.resource_title,
        resource.resource_description,
        resource.startup_name,
        resource.resource_type,
        resource.file_name,
      ].some((value) => String(value || "").toLowerCase().includes(needle)),
    );
  }, [query, resources]);

  const quickResources = resources.slice(0, 4);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function changeResourceType(resourceType) {
    setForm((current) => ({
      ...current,
      resource_type: resourceType,
      external_url: resourceType === "link" ? current.external_url : "",
    }));
    if (resourceType !== "file") {
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function resetForm() {
    setForm((current) => ({
      mentorship_request_id: current.mentorship_request_id,
      resource_title: "",
      resource_description: "",
      resource_type: "file",
      category: CATEGORIES[0],
      external_url: "",
      note: "",
    }));
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!form.mentorship_request_id) {
      setError("Select a startup before sharing a resource.");
      return;
    }
    if (!form.resource_title.trim()) {
      setError("Resource title is required.");
      return;
    }
    if (form.resource_type === "file" && !file) {
      setError("Choose a document to upload.");
      return;
    }
    if (form.resource_type === "link" && !form.external_url.trim()) {
      setError("Resource link is required for a link resource.");
      return;
    }

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("mentorship_request_id", form.mentorship_request_id);
      fd.append("resource_title", form.resource_title.trim());
      fd.append(
        "resource_description",
        [
          form.resource_description,
          form.note ? `Mentor note: ${form.note}` : "",
          form.category ? `Category: ${form.category}` : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
      );
      fd.append("resource_type", form.resource_type);
      if (form.external_url.trim())
        fd.append("external_url", form.external_url.trim());
      if (file) fd.append("file", file);
      await shareResource(fd);
      clearDraft(DRAFT_KEY);
      setSuccess("Resource shared successfully.");
      resetForm();
      await load();
    } catch (ex) {
      setError(ex.message || "Share failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-full bg-[#f6f7f8]">
      <header className="flex h-[62px] items-center justify-between border-b border-gray-100 bg-white px-8">
        <div className="relative w-full max-w-[420px]">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search resources or startups..."
            className="h-10 w-full rounded-lg border-0 bg-gray-100 pl-11 pr-4 text-xs outline-none"
          />
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0"
            />
          </svg>
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              d="M10.3 4.3l.7-1.8h2l.7 1.8a8 8 0 012.2.9l1.8-.8 1.4 1.4-.8 1.8c.4.7.7 1.4.9 2.2l1.8.7v2l-1.8.7a8 8 0 01-.9 2.2l.8 1.8-1.4 1.4-1.8-.8a8 8 0 01-2.2.9l-.7 1.8h-2l-.7-1.8a8 8 0 01-2.2-.9l-1.8.8-1.4-1.4.8-1.8a8 8 0 01-.9-2.2l-1.8-.7v-2l1.8-.7c.2-.8.5-1.5.9-2.2l-.8-1.8 1.4-1.4 1.8.8a8 8 0 012.2-.9z"
            />
          </svg>
          <span className="text-xs font-black text-gray-900">
            StartupConnect Ethiopia
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1040px] px-6 py-8">
        <div className="mb-5">
          <h1 className="text-2xl font-black text-gray-950">
            Provide Learning Resources
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Share guides, templates, links, and documents to help startups
            improve their business.
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <label className="mb-3 flex items-center gap-2 text-xs font-black text-gray-800">
                <span className="text-[#073f32]">▲</span> Select Startup
              </label>
              <div className="grid gap-4 md:grid-cols-[1fr_280px]">
                <select
                  value={form.mentorship_request_id}
                  onChange={(event) =>
                    update("mentorship_request_id", event.target.value)
                  }
                  disabled={loading || startups.length === 0}
                  className="h-11 rounded-lg border border-[#073f32] bg-white px-3 text-sm outline-none"
                >
                  <option value="">
                    {loading ? "Loading startups..." : "Select startup"}
                  </option>
                  {startups.map((startup) => (
                    <option
                      key={startup.mentorship_request_id}
                      value={startup.mentorship_request_id}
                    >
                      {startup.startup_name}
                    </option>
                  ))}
                </select>
                <div className="rounded-lg bg-gray-50 p-3 text-xs">
                  <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase text-gray-400">
                    <span>Industry</span>
                    <span>Stage</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-gray-950">
                      {selectedStartup?.industry || "Not specified"}
                    </p>
                    <p className="font-black text-[#073f32]">
                      {selectedStartup?.business_stage || "Active"}
                    </p>
                  </div>
                  <p className="mt-2 font-semibold text-gray-600">
                    {selectedStartup?.subject ||
                      selectedStartup?.startup_tagline ||
                      "Accepted mentorship"}
                  </p>
                </div>
              </div>
            </section>

            <form
              onSubmit={submit}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <h2 className="mb-4 flex items-center gap-2 text-sm font-black">
                <span className="text-[#073f32]">△</span> Resource Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold text-gray-600">
                    Resource Title
                  </label>
                  <input
                    value={form.resource_title}
                    onChange={(event) =>
                      update("resource_title", event.target.value)
                    }
                    placeholder="e.g., Supply Chain Optimization Guide 2024"
                    className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#073f32]"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold text-gray-600">
                      Resource Type
                    </label>
                    <select
                      value={form.resource_type}
                      onChange={(event) =>
                        changeResourceType(event.target.value)
                      }
                      className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#073f32]"
                    >
                      {RESOURCE_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold text-gray-600">
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(event) =>
                        update("category", event.target.value)
                      }
                      className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#073f32]"
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {form.resource_type === "link" ? (
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold text-gray-600">
                      Resource Link
                    </label>
                    <input
                      type="url"
                      required
                      value={form.external_url}
                      onChange={(event) =>
                        update("external_url", event.target.value)
                      }
                      placeholder="https://example.com/resource"
                      className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#073f32]"
                    />
                  </div>
                ) : null}

                {form.resource_type === "file" ? (
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold text-gray-600">
                      Upload Document
                    </label>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex h-32 w-full flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-center text-xs text-gray-500"
                    >
                      <svg
                        className="mb-2 h-7 w-7 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                        />
                      </svg>
                      <span>
                        {file ? file.name : "Choose a file to upload"}
                      </span>
                      <span className="mt-1 text-[10px] text-gray-400">
                        PDF, DOCX, PPTX, PNG, JPG (Max 25MB)
                      </span>
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      className="hidden"
                      onChange={(event) =>
                        setFile(event.target.files?.[0] || null)
                      }
                    />
                  </div>
                ) : null}

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold text-gray-600">
                    Short Description
                  </label>
                  <textarea
                    value={form.resource_description}
                    onChange={(event) =>
                      update("resource_description", event.target.value)
                    }
                    placeholder="Briefly describe what this resource covers..."
                    className="h-20 w-full resize-none rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#073f32]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold text-gray-600">
                    Notes for Startup
                  </label>
                  <textarea
                    value={form.note}
                    onChange={(event) => update("note", event.target.value)}
                    placeholder="Personalized advice or specific sections to focus on..."
                    className="h-24 w-full resize-none rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#073f32]"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-xs font-bold text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saveDraft(DRAFT_KEY, form);
                    setShowDraftNotice(true);
                    const savedAt = getDraftSavedAt(DRAFT_KEY);
                    setDraftSavedAt(formatSavedTime(savedAt));
                    setTimeout(() => setShowDraftNotice(false), 2000);
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700"
                >
                  {showDraftNotice ? "✓ Draft saved" : "Save as Draft"}
                </button>
                <button
                  disabled={saving || startups.length === 0}
                  className="rounded-lg bg-[#073f32] px-5 py-2 text-xs font-black text-white disabled:opacity-50"
                >
                  {saving ? "Sharing..." : "Share Resource"}
                </button>
              </div>
            </form>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-black">
                  Previously Shared Resources
                </h2>
                <span className="text-xs font-black text-[#073f32]">
                  View All
                </span>
              </div>
              <div className="overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="py-2">Title</th>
                      <th className="py-2">Startup</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Date</th>
                      <th className="py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="py-6 text-gray-500">
                          Loading resources...
                        </td>
                      </tr>
                    ) : filteredResources.length ? (
                      filteredResources.slice(0, 5).map((resource) => {
                        const status = resourceStatus(resource);
                        return (
                          <tr key={resource.resource_id}>
                            <td className="py-3">
                              <p className="font-black text-gray-900">
                                {resource.resource_title}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {resource.file_name ||
                                  resource.external_url ||
                                  "Shared note"}
                              </p>
                            </td>
                            <td className="py-3 font-semibold text-gray-600">
                              {resource.startup_name || "Startup"}
                            </td>
                            <td className="py-3">
                              <span className="rounded bg-orange-50 px-2 py-1 text-[10px] font-black uppercase text-orange-700">
                                {shortType(resource.resource_type)}
                              </span>
                            </td>
                            <td className="py-3 text-gray-500">
                              {formatDate(resource.created_at)}
                            </td>
                            <td className="py-3 text-right">
                              {resource.file_path ? (
                                <button
                                  type="button"
                                  onClick={() => openUploadedFileForView({
                                    filePath: resource.file_path,
                                    fileName: resource.file_name,
                                    fileType: resource.file_type,
                                  })}
                                  className="rounded-lg bg-[#073f32] px-3 py-2 text-[10px] font-black uppercase text-white transition hover:bg-[#052d24]"
                                >
                                  View file
                                </button>
                              ) : resource.external_url ? (
                                <a
                                  href={resource.external_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-lg border border-gray-200 px-3 py-2 text-[10px] font-black uppercase text-[#073f32] transition hover:bg-gray-50"
                                >
                                  Open link
                                </a>
                              ) : (
                                <span
                                  className={`rounded px-2 py-1 text-[10px] font-black ${statusClass(status)}`}
                                >
                                  {status}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-6 text-gray-500">
                          No resources match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-xs font-black">Resource Preview</h2>
              <div className="rounded-lg bg-[#5f8276] p-3">
                <div className="h-16 rounded bg-white/25 p-2">
                  <div className="mb-2 h-8 rounded bg-white/30" />
                  <div className="grid grid-cols-3 gap-1">
                    <div className="h-2 rounded bg-white/30" />
                    <div className="h-2 rounded bg-white/30" />
                    <div className="h-2 rounded bg-white/30" />
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <span className="rounded bg-emerald-100 px-2 py-1 text-[9px] font-black uppercase text-[#073f32]">
                  {shortType(previewResource.type)}
                </span>
                <p className="mt-3 text-sm font-black text-gray-950">
                  {previewResource.title}
                </p>
                <p className="mt-1 line-clamp-3 text-xs leading-5 text-gray-500">
                  {previewResource.description}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-[10px] text-gray-400">
                  <span>{previewResource.startup}</span>
                  <span>
                    {file
                      ? bytes(file.size)
                      : form.external_url
                        ? "External link"
                        : "Ready"}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-xl bg-[#073f32] p-5 text-white shadow-sm">
              <h2 className="text-sm font-black">Quick Resources</h2>
              <p className="mt-1 text-xs text-white/70">
                Recently shared resources from your backend records.
              </p>
              <div className="mt-4 space-y-2">
                {quickResources.length ? (
                  quickResources.map((resource) => (
                    <div
                      key={resource.resource_id}
                      className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 text-xs font-black"
                    >
                      <span className="truncate">
                        {resource.resource_title}
                      </span>
                      <span className="ml-3 text-white/50">+</span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg bg-white/10 px-3 py-3 text-xs text-white/70">
                    Shared resources will appear here.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-orange-200 bg-orange-50 p-5 text-orange-900">
              <h2 className="text-xs font-black">Mentor Tip</h2>
              <p className="mt-2 text-xs leading-5">
                Adding a personalized note to each resource significantly
                increases the likelihood of the founder implementing the advice.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
