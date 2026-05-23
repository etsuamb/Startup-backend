/** Resolve a stored upload path to a browser URL (via Next /uploads rewrite). */
export function resolveUploadedFileUrl(filePath) {
  if (!filePath || String(filePath).startsWith("db://")) return null;
  const normalized = String(filePath).replace(/\\/g, "/").replace(/^\/+/, "");
  return `/${normalized}`;
}

export function fileDisplayKind(fileName, fileType) {
  const name = String(fileName || "").toLowerCase();
  const mime = String(fileType || "").toLowerCase();
  if (mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/.test(name)) return "image";
  if (mime.startsWith("video/") || name.endsWith(".mp4") || name.endsWith(".webm")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  return "other";
}

export function fileTypeBadge(fileName, fileType) {
  const kind = fileDisplayKind(fileName, fileType);
  if (kind === "pdf") return "PDF";
  if (kind === "image") return "IMG";
  if (kind === "video") return "MP4";
  if (kind === "audio") return "AUDIO";
  const name = String(fileName || "").toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "XLS";
  return "FILE";
}

/** Open file in the in-app viewer (new tab) — view only, no forced download. */
export function openUploadedFileForView({ filePath, fileName, fileType } = {}) {
  const url = resolveUploadedFileUrl(filePath);
  if (!url) {
    if (typeof window !== "undefined") {
      window.alert("This file cannot be previewed.");
    }
    return false;
  }
  const params = new URLSearchParams({
    url,
    name: fileName || "Document",
    type: fileType || "",
  });
  window.open(`/startup/view-file?${params.toString()}`, "_blank", "noopener,noreferrer");
  return true;
}
