"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fileDisplayKind } from "@/lib/viewUploadedFile";

function FileViewerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawUrl = searchParams.get("url") || "";
  const fileName = searchParams.get("name") || "Document";
  const fileType = searchParams.get("type") || "";

  const safeUrl = useMemo(() => {
    if (!rawUrl.startsWith("/uploads/")) return null;
    if (rawUrl.includes("..")) return null;
    return rawUrl;
  }, [rawUrl]);

  const kind = fileDisplayKind(fileName, fileType);

  if (!safeUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f8f9] p-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-900">Invalid or unavailable file link.</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-4 text-sm font-bold text-[#0f3d32] hover:underline"
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
          <img src={safeUrl} alt={fileName} className="max-w-full max-h-[calc(100vh-80px)] object-contain rounded-lg shadow-2xl" />
        )}
        {kind === "video" && (
          <video
            src={safeUrl}
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
            <audio src={safeUrl} controls className="w-full" />
          </div>
        )}
        {(kind === "pdf" || kind === "other") && (
          <iframe
            title={fileName}
            src={kind === "pdf" ? safeUrl : safeUrl}
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
