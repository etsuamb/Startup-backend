"use client";

import { openUploadedFileForView, fileTypeBadge, canPreviewDocument } from "@/lib/viewUploadedFile";

/**
 * Clickable row/button to preview an uploaded file (no download attribute).
 */
export default function ViewableFileTrigger({
  documentId,
  filePath,
  fileName,
  fileType,
  fileAvailable,
  description,
  className = "",
  showBadge = true,
  children,
}) {
  const canView = canPreviewDocument({ documentId, filePath, fileAvailable });

  function handleClick() {
    if (!canView) {
      window.location.assign("/startup/project/documents");
      return;
    }
    openUploadedFileForView({ documentId, filePath, fileName, fileType });
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      title={canView ? "Tap to view" : "Upload a replacement file"}
      className={`w-full text-left transition ${
        canView ? "cursor-pointer hover:opacity-90" : "cursor-pointer opacity-70 hover:opacity-100"
      } ${className}`}
    >
      {children ?? (
        <span className="flex items-center gap-3 min-w-0">
          {showBadge && (
            <span className="w-8 h-8 rounded-lg bg-[#eaf4f1] text-[#0f3d32] flex items-center justify-center text-[10px] font-bold shrink-0">
              {fileTypeBadge(fileName, fileType)}
            </span>
          )}
          <span className="min-w-0 flex-grow">
            <span className="block text-sm font-medium text-gray-800 truncate group-hover:text-[#0f3d32]">
              {fileName || "Document"}
            </span>
            {description ? (
              <span className="block text-xs text-gray-500 truncate mt-0.5">{description}</span>
            ) : null}
          </span>
          {canView ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0f3d32] shrink-0">
              View
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 shrink-0">
              Replace
            </span>
          )}
        </span>
      )}
    </button>
  );
}
