"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/startup/Sidebar";
import { PendingApprovalBlock } from "@/components/startup/PendingApprovalNotice";
import { useStartupApproval } from "@/hooks/useStartupApproval";
import {
  deleteDocument,
  getDocuments,
  getMyProjects,
  getProjectDetails,
  getStartupProfile,
  publishProject,
  uploadDocument,
} from "@/lib/startupApi";
import { openUploadedFileForView } from "@/lib/viewUploadedFile";

const MANDATORY_SLOTS = [
  {
    key: "pitch_deck",
    title: "Pitch Deck",
    label: "Pitch deck",
    hint: "PDF only, max 10MB",
    accept: ".pdf,application/pdf",
    icon: "upload",
  },
  {
    key: "business_plan",
    title: "Business Plan",
    label: "Business plan",
    hint: "PDF only, max 20MB",
    accept: ".pdf,application/pdf",
    icon: "doc",
  },
  {
    key: "financial_doc",
    title: "Financial Doc",
    label: "Financial doc",
    hint: "Excel/PDF, max 10MB",
    accept: ".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    icon: "sheet",
  },
  {
    key: "demo_video",
    title: "Demo Video",
    label: "Demo video",
    hint: "MP4 only, max 50MB",
    accept: ".mp4,video/mp4",
    icon: "video",
  },
];

const MAX_BYTES = {
  pitch_deck: 10 * 1024 * 1024,
  business_plan: 20 * 1024 * 1024,
  financial_doc: 10 * 1024 * 1024,
  demo_video: 50 * 1024 * 1024,
};

function normalizeLabel(value) {
  return String(value || "").trim().toLowerCase();
}

function findDocForSlot(documents, slot) {
  const label = normalizeLabel(slot.label);
  const key = normalizeLabel(slot.key.replace(/_/g, " "));
  return documents.find((d) => {
    const desc = normalizeLabel(d.description);
    return desc === label || desc === key || desc.includes(key);
  });
}

function fileTypeLabel(doc) {
  const name = (doc.file_name || "").toLowerCase();
  if (name.endsWith(".mp4")) return "MP4";
  if (name.endsWith(".pdf")) return "PDF";
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "Excel";
  const mime = String(doc.file_type || "").toLowerCase();
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("video")) return "MP4";
  if (mime.includes("spreadsheet") || mime.includes("excel")) return "Excel";
  return "FILE";
}

function statusBadge(doc) {
  const v = String(doc.verification_status || "pending").toLowerCase();
  if (v === "verified") {
    return { text: "Verified", className: "text-[#16a34a] bg-[#ecfdf3] border-[#bbf7d0]" };
  }
  if (v === "rejected") {
    return { text: "Rejected", className: "text-red-600 bg-red-50 border-red-200" };
  }
  return { text: "Uploaded", className: "text-[#0f3d32] bg-[#eaf4f1] border-[#cde5dd]" };
}

function clientValidateFile(file, slotKey) {
  const name = (file.name || "").toLowerCase();
  const max = MAX_BYTES[slotKey] || 10 * 1024 * 1024;
  if (file.size > max) {
    const mb = Math.round(max / (1024 * 1024));
    return `File exceeds the ${mb}MB limit.`;
  }
  if (slotKey === "demo_video") {
    if (!name.endsWith(".mp4") && file.type !== "video/mp4") {
      return "Upload failed: file must be .mp4";
    }
  } else if (slotKey === "financial_doc") {
    const ok =
      name.endsWith(".pdf") ||
      name.endsWith(".xls") ||
      name.endsWith(".xlsx") ||
      file.type.includes("pdf") ||
      file.type.includes("excel") ||
      file.type.includes("spreadsheet");
    if (!ok) return "Invalid format. Use PDF or Excel.";
  } else if (!name.endsWith(".pdf") && file.type !== "application/pdf") {
    return "Invalid format. PDF only.";
  }
  return null;
}

function SlotIcon({ type, className = "w-8 h-8" }) {
  if (type === "video") {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    );
  }
  if (type === "sheet") {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  if (type === "doc") {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

export default function StartupProjectDocuments() {
  const router = useRouter();
  const fileInputs = useRef({});
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [project, setProject] = useState(null);
  const [profile, setProfile] = useState(null);
  const [projectDocuments, setProjectDocuments] = useState([]);
  const [extraDescription, setExtraDescription] = useState("");
  const [extraFile, setExtraFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [formatAlert, setFormatAlert] = useState(null);
  const [cardErrors, setCardErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showExtraForm, setShowExtraForm] = useState(false);
  const { pending, loading: approvalLoading } = useStartupApproval();

  const loadDocuments = useCallback(async (projectId) => {
    const data = await getDocuments(projectId ? { project_id: projectId } : {});
    const docs = (data.documents || []).filter((d) => d.project_id);
    if (projectId) {
      return docs.filter((d) => String(d.project_id) === String(projectId));
    }
    return docs;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("project");
    if (projectId) setCurrentProjectId(projectId);
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        let projectId = currentProjectId;
        const [profileData, projectsData] = await Promise.all([
          getStartupProfile().catch(() => null),
          getMyProjects(),
        ]);
        setProfile(profileData?.startup || profileData || null);

        if (!projectId) {
          const projects = projectsData.projects || [];
          const draft = projects.find((p) => String(p.status || "").toLowerCase() === "draft");
          projectId = draft?.project_id || projects[0]?.project_id;
          if (projectId) setCurrentProjectId(String(projectId));
        }

        if (!projectId) {
          setProjectDocuments([]);
          setProject(null);
          return;
        }

        const [docs, projectData] = await Promise.all([
          loadDocuments(projectId),
          getProjectDetails(projectId).catch(() => null),
        ]);
        setProjectDocuments(docs);
        setProject(projectData?.project || projectData || null);
      } catch (err) {
        setError(err.message || "Unable to load project documents.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentProjectId, loadDocuments]);

  const mandatoryUploaded = useMemo(() => {
    return MANDATORY_SLOTS.filter((slot) => findDocForSlot(projectDocuments, slot)).length;
  }, [projectDocuments]);

  const canPublish = mandatoryUploaded === MANDATORY_SLOTS.length && currentProjectId;

  async function refreshDocs() {
    if (!currentProjectId) return;
    const docs = await loadDocuments(currentProjectId);
    setProjectDocuments(docs);
  }

  async function handleSlotUpload(slot, file) {
    if (!file || !currentProjectId) return;
    setFormatAlert(null);
    setSuccess(null);

    const clientErr = clientValidateFile(file, slot.key);
    if (clientErr) {
      setCardErrors((prev) => ({ ...prev, [slot.key]: clientErr }));
      setFormatAlert(
        "Please ensure all files are in PDF or MP4 format as specified in the document requirements.",
      );
      return;
    }

    setCardErrors((prev) => {
      const next = { ...prev };
      delete next[slot.key];
      return next;
    });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("project_id", currentProjectId);
    formData.append("document_category", slot.key);
    formData.append("description", slot.label);

    setUploadingKey(slot.key);
    try {
      await uploadDocument(formData);
      await refreshDocs();
      setFormatAlert(null);
      setSuccess(`${slot.title} uploaded successfully.`);
    } catch (err) {
      const msg = err.message || "Upload failed.";
      setCardErrors((prev) => ({ ...prev, [slot.key]: msg }));
      setFormatAlert(
        "Please ensure all files are in PDF or MP4 format as specified in the document requirements.",
      );
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleExtraUpload(event) {
    event.preventDefault();
    if (!extraFile || !currentProjectId) {
      setError("Choose a file and ensure a project exists.");
      return;
    }
    setError(null);
    setSuccess(null);
    const formData = new FormData();
    formData.append("file", extraFile);
    formData.append("project_id", currentProjectId);
    if (extraDescription.trim()) formData.append("description", extraDescription.trim());

    setUploadingKey("extra");
    try {
      await uploadDocument(formData);
      setExtraFile(null);
      setExtraDescription("");
      await refreshDocs();
      setSuccess("Additional document uploaded.");
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleDelete(documentId) {
    if (!window.confirm("Remove this document?")) return;
    try {
      await deleteDocument(documentId);
      await refreshDocs();
      setSuccess("Document removed.");
    } catch (err) {
      setError(err.message || "Could not delete document.");
    }
  }

  async function handlePublish() {
    if (!currentProjectId) return;
    setPublishing(true);
    setError(null);
    try {
      await publishProject(currentProjectId);
      setShowSuccessPopup(true);
    } catch (err) {
      setError(err.message || "Could not publish project. Upload all mandatory documents first.");
    } finally {
      setPublishing(false);
    }
  }

  function closePopup() {
    setShowSuccessPopup(false);
    router.push("/startup/project");
  }

  const founderName =
    profile?.founder_full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Founder";
  const founderInitials = founderName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const backToInfoHref = currentProjectId
    ? `/startup/project/create?edit=${currentProjectId}`
    : "/startup/project/create";

  const tableDocs = [...projectDocuments].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );

  const pageTitle =
    project?.project_title && String(project.status || "").toLowerCase() !== "draft"
      ? project.project_title
      : "Create Startup Project";

  const projectStatus = String(project?.status || "draft").toLowerCase();

  if (!approvalLoading && pending) {
    return (
      <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
        <Sidebar />
        <PendingApprovalBlock title="Document upload unavailable" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto">
        <header className="flex justify-between items-center px-8 py-5 bg-white border-b border-gray-100 w-full z-10 sticky top-0">
          <div className="relative w-full max-w-[400px] hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search resources..."
              className="w-full pl-11 pr-4 py-2.5 bg-[#f3f4f6] border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0f3d32]/20 transition"
            />
          </div>
          <div className="flex items-center gap-6 ml-auto">
            <button type="button" className="text-gray-400 hover:text-gray-600 transition" aria-label="Notifications">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button type="button" className="text-gray-400 hover:text-gray-600 transition" aria-label="Help">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-gray-900">{founderName}</span>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Founder</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#1e293b] text-white overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs shadow-sm border border-gray-200">
                {founderInitials}
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-10 py-10 w-full max-w-[1200px] mx-auto pb-28">
          <h1 className="text-[32px] font-bold text-[#0f3d32] mb-8 tracking-tight text-center sm:text-left">
            {pageTitle}
          </h1>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-6 sm:gap-12 mb-10">
            <Link href={backToInfoHref} className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-full bg-[#0f3d32] text-white flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-bold text-[#0f3d32] group-hover:underline">Step 1 Project Info</span>
            </Link>
            <div className="hidden sm:block w-12 lg:w-20 h-px bg-[#0f3d32]/25" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0f3d32] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                2
              </div>
              <span className="text-sm font-bold text-[#0f3d32]">Step 2 Documents</span>
            </div>
          </div>

          {project?.project_title && (
            <p className="text-sm text-gray-500 mb-6 -mt-4 text-center sm:text-left">
              {project.project_title}
              {projectStatus === "draft" ? " · Draft" : ""}
            </p>
          )}

          {!currentProjectId && !loading && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No project found.{" "}
              <Link href="/startup/project/create" className="font-bold underline">
                Create a project
              </Link>{" "}
              first, then return here to upload documents.
            </div>
          )}

          {formatAlert && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 flex gap-3 items-start">
              <span className="text-red-500 shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-bold text-red-800">Invalid Format Detected</p>
                <p className="text-sm text-red-700 mt-0.5">{formatAlert}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}
          {success && (
            <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{success}</div>
          )}

          {/* Upload cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
            {MANDATORY_SLOTS.map((slot) => {
              const doc = findDocForSlot(projectDocuments, slot);
              const cardErr = cardErrors[slot.key];
              const isError = Boolean(cardErr);
              const isUploaded = Boolean(doc) && !isError;
              const isUploading = uploadingKey === slot.key;

              return (
                <div
                  key={slot.key}
                  className={`rounded-2xl border bg-white p-5 flex flex-col min-h-[220px] shadow-sm ${
                    isError ? "border-red-300 ring-1 ring-red-100" : "border-gray-100"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      isError
                        ? "bg-red-50 text-red-500"
                        : isUploaded
                          ? "bg-[#ecfdf3] text-[#16a34a]"
                          : "bg-[#f1f5f9] text-gray-400"
                    }`}
                  >
                    <SlotIcon type={slot.icon} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{slot.title}</h3>
                  <p className="text-[11px] text-gray-400 mb-4">{slot.hint}</p>

                  <div className="mt-auto">
                    {isError ? (
                      <div className="mb-3">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                          Invalid Format
                        </span>
                        <p className="text-[11px] text-red-600 mt-2 leading-snug">{cardErr}</p>
                      </div>
                    ) : isUploaded ? (
                      <div className="flex items-center gap-1.5 text-[#16a34a] text-xs font-bold mb-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Uploaded
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-gray-400 mb-3">Missing</p>
                    )}

                    <input
                      ref={(el) => {
                        fileInputs.current[slot.key] = el;
                      }}
                      type="file"
                      accept={slot.accept}
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleSlotUpload(slot, f);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      disabled={!currentProjectId || isUploading}
                      onClick={() => fileInputs.current[slot.key]?.click()}
                      className={`w-full py-2.5 rounded-lg text-xs font-bold transition disabled:opacity-50 ${
                        isUploaded
                          ? "bg-white border border-[#0f3d32] text-[#0f3d32] hover:bg-gray-50"
                          : "bg-[#0f3d32] hover:bg-[#0a2921] text-white"
                      }`}
                    >
                      {isUploading ? "Uploading…" : isUploaded ? "Replace" : "Upload"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Uploaded table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Successfully Uploaded Documents</h2>
              <p className="text-xs font-bold text-gray-500">
                {mandatoryUploaded}/{MANDATORY_SLOTS.length} Mandatory Documents Uploaded
              </p>
            </div>

            {loading ? (
              <p className="px-6 py-10 text-sm text-gray-500">Loading documents…</p>
            ) : tableDocs.length === 0 ? (
              <p className="px-6 py-10 text-sm text-gray-500">No documents uploaded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                      <th className="px-6 py-3">Document Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Upload Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableDocs.map((doc) => {
                      const badge = statusBadge(doc);
                      const canView = Boolean(doc.file_path && !String(doc.file_path).startsWith("db://"));
                      return (
                        <tr key={doc.document_id} className="border-b border-gray-50 hover:bg-[#fafafa]">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            <button
                              type="button"
                              disabled={!canView}
                              onClick={() =>
                                openUploadedFileForView({
                                  filePath: doc.file_path,
                                  fileName: doc.file_name,
                                  fileType: doc.file_type,
                                })
                              }
                              className={`text-left truncate max-w-[220px] ${
                                canView ? "text-[#0f3d32] hover:underline" : "text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              {doc.file_name}
                            </button>
                          </td>
                          <td className="px-4 py-4 text-gray-600">{fileTypeLabel(doc)}</td>
                          <td className="px-4 py-4 text-gray-600">
                            {doc.created_at
                              ? new Date(doc.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "—"}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badge.className}`}
                            >
                              {badge.text === "Verified" && (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              {badge.text}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                disabled={!canView}
                                onClick={() =>
                                  openUploadedFileForView({
                                    filePath: doc.file_path,
                                    fileName: doc.file_name,
                                    fileType: doc.file_type,
                                  })
                                }
                                className={`p-2 rounded-lg transition ${
                                  !canView
                                    ? "text-gray-200 cursor-not-allowed"
                                    : "text-gray-400 hover:text-[#0f3d32] hover:bg-[#f1f5f9]"
                                }`}
                                title="View"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(doc.document_id)}
                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Optional extra uploads (legacy flow) */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowExtraForm((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition"
            >
              <span className="text-sm font-bold text-gray-700">Additional documents (optional)</span>
              <svg
                className={`w-4 h-4 text-gray-400 transition ${showExtraForm ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showExtraForm && (
              <form onSubmit={handleExtraUpload} className="px-6 pb-6 pt-2 border-t border-gray-100 space-y-4">
                <p className="text-xs text-gray-500">
                  Upload supporting files with a custom label (stored in the same project folder).
                </p>
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-2">Description</label>
                  <input
                    type="text"
                    value={extraDescription}
                    onChange={(e) => setExtraDescription(e.target.value)}
                    placeholder="e.g. Market research, cap table"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-2">File</label>
                  <input
                    type="file"
                    onChange={(e) => setExtraFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-700"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!extraFile || uploadingKey === "extra"}
                  className="px-6 py-3 bg-[#0f3d32] text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  {uploadingKey === "extra" ? "Uploading…" : "Upload additional file"}
                </button>
              </form>
            )}
          </div>

          {/* Footer actions */}
          <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/95 backdrop-blur border-t border-gray-100 px-4 sm:px-10 py-4 flex flex-wrap items-center justify-between gap-4 z-20">
            <Link
              href={backToInfoHref}
              className="px-6 py-3.5 bg-white border border-[#0f3d32] text-[#0f3d32] font-bold rounded-lg hover:bg-gray-50 transition text-sm shadow-sm"
            >
              Back to Project Info
            </Link>
            <div className="flex items-center gap-4 ml-auto">
              <span className="text-[11px] text-gray-400 font-medium italic hidden sm:block">
                Auto saving progress…
              </span>
              <button
                type="button"
                onClick={handlePublish}
                disabled={!canPublish || publishing || projectStatus === "active"}
                className="px-8 py-3.5 bg-[#0f3d32] hover:bg-[#0a2921] text-white font-bold rounded-lg transition shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {projectStatus === "active"
                  ? "Published"
                  : publishing
                    ? "Publishing…"
                    : "Publish Project"}
              </button>
            </div>
          </div>
        </div>

        {showSuccessPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Project Published!</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Your project is now live for investors. All mandatory documents are on file.
                </p>
                <button
                  onClick={closePopup}
                  className="px-6 py-3 bg-[#0f3d32] hover:bg-[#0a2921] text-white font-bold rounded-lg transition text-sm"
                >
                  View My Projects
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
