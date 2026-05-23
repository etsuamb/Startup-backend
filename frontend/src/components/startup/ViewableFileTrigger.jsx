"use client";

import { openUploadedFileForView, fileTypeBadge } from "@/lib/viewUploadedFile";

/**
 * Clickable row/button to preview an uploaded file (no download attribute).
 */
export default function ViewableFileTrigger({
  filePath,
  fileName,
  fileType,
  description,
  className = "",
  showBadge = true,
  children,
}) {
  const canView = Boolean(filePath && !String(filePath).startsWith("db://"));

  function handleClick() {
    if (!canView) return;
    openUploadedFileForView({ filePath, fileName, fileType });
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
      disabled={!canView}
      title={canView ? "Tap to view" : "Preview unavailable"}
      className={`w-full text-left transition ${
        canView ? "cursor-pointer hover:opacity-90" : "cursor-not-allowed opacity-60"
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
          {canView && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0f3d32] shrink-0">
              View
            </span>
          )}
        </span>
      )}
    </button>
  );
}
