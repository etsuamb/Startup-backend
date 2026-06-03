"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fileDisplayKind, fetchDocumentBlob } from "@/lib/viewUploadedFile";
import { getToken } from "@/lib/authStorage";

function FileViewerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawUrl = searchParams.get("url") || "";
  const documentId = searchParams.get("documentId") || "";
  const fileName = searchParams.get("name") || "Document";
  const fileType = searchParams.get("type") || "";

  const [blobUrl, setBlobUrl] = useState(null);
  const [resolvedType, setResolvedType] = useState(fileType);
  const [loading, setLoading] = useState(Boolean(documentId));
  const [error, setError] = useState("");
  const [isStartup, setIsStartup] = useState(false);

  useEffect(() => {
    try {
      const token = getToken();
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setIsStartup(payload.role === "Startup");
      }
    } catch (e) {}
  }, []);

  const safeUrl = useMemo(() => {
    if (!rawUrl.startsWith("/uploads/")) return null;
    if (rawUrl.includes("..")) return null;
    return rawUrl;
  }, [rawUrl]);

  useEffect(() => {
    if (!documentId) return undefined;

    let objectUrl;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const { blob, contentType } = await fetchDocumentBlob(documentId);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        if (contentType) setResolvedType(contentType);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load document.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId]);

  const previewUrl = documentId ? blobUrl : safeUrl;
  const kind = fileDisplayKind(fileName, resolvedType || fileType);

  if (documentId && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f8f9] p-6">
        <p className="text-sm text-gray-500">Loading preview…</p>
      </div>
    );
  }

  if (error || !previewUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f8f9] p-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-900">
            {error || "Invalid or unavailable file link."}
          </p>
          {error === "File missing on server" ? (
            <p className="mt-2 text-xs leading-5 text-gray-500">
              This older upload is no longer available. Upload a replacement document to continue.
            </p>
          ) : null}
          {isStartup && (
            <button
              type="button"
              onClick={() => router.push("/startup/project/documents")}
              className="mt-5 rounded-lg bg-[#0f3d32] px-4 py-2 text-sm font-bold text-white hover:bg-[#0a2921]"
            >
              Replace file
            </button>
          )}
          <button
            type="button"
            onClick={() => router.back()}
            className={`${isStartup ? "ml-4" : ""} mt-4 text-sm font-bold text-[#0f3d32] hover:underline`}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a1a]">
      <header className="shrink-0 flex items-center justify-between gap-4 bg-[#0f3d32] text-white px-4 sm:px-6 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Preview</p>
          <h1 className="text-sm font-bold truncate">{fileName}</h1>
        </div>
        <button
          type="button"
          onClick={() => window.close()}
          className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-white text-[#0f3d32] hover:bg-gray-100"
        >
          Close
        </button>
      </header>

      <div className="flex-grow flex items-center justify-center p-2 sm:p-4 overflow-auto">
        {kind === "image" && (
          <img
            src={previewUrl}
            alt={fileName}
            className="max-w-full max-h-[calc(100vh-80px)] object-contain rounded-lg shadow-2xl"
          />
        )}
        {kind === "video" && (
          <video
            src={previewUrl}
            controls
            playsInline
            className="max-w-full max-h-[calc(100vh-80px)] rounded-lg shadow-2xl bg-black"
          >
            <track kind="captions" />
          </video>
        )}
        {kind === "audio" && (
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl text-center">
            <p className="text-sm font-bold text-gray-900 mb-4">{fileName}</p>
            <audio src={previewUrl} controls className="w-full" />
          </div>
        )}
        {(kind === "pdf" || kind === "other") && (
          <iframe
            title={fileName}
            src={previewUrl}
            className="w-full h-[calc(100vh-72px)] max-w-6xl bg-white rounded-lg shadow-2xl border-0"
          />
        )}
      </div>
    </div>
  );
}

export default function ViewFilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f6f8f9] text-sm text-gray-500">
          Loading preview…
        </div>
      }
    >
      <FileViewerContent />
    </Suspense>
  );
}
