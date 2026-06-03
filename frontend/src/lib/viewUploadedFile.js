import { API_BASE } from "./config";
import { getToken } from "./authStorage";

/** Resolve a stored upload path to a browser URL (via Next /uploads rewrite). */
export function resolveUploadedFileUrl(filePath) {
  if (!filePath || String(filePath).startsWith("db://")) return null;
  if (/^https?:\/\//i.test(String(filePath))) return String(filePath);
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

export function canPreviewDocument({ documentId, filePath, fileAvailable } = {}) {
  if (fileAvailable === false) return false;
  if (documentId) return true;
  return Boolean(filePath && !String(filePath).startsWith("db://"));
}

/** Open file in the in-app viewer (new tab) — view only, no forced download. */
export function openUploadedFileForView({ documentId, filePath, fileName, fileType } = {}) {
  if (documentId) {
    const params = new URLSearchParams({
      documentId: String(documentId),
      name: fileName || "Document",
      type: fileType || "",
    });
    window.open(`/view-file?${params.toString()}`, "_blank", "noopener,noreferrer");
    return true;
  }

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
  window.open(`/view-file?${params.toString()}`, "_blank", "noopener,noreferrer");
  return true;
}

/** Fetch document bytes from API (for DB-stored registration files). */
export async function fetchDocumentBlob(documentId) {
  const id = Number(documentId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid document id");
  }
  const token = getToken();
  const headers = { Accept: "*/*" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${API_BASE}/startups/documents/${id}/file`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    let message = res.statusText || "Could not load file";
    try {
      const data = await res.json();
      message = data?.error || data?.message || message;
    } catch {
      /* binary or empty body */
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  return {
    blob,
    contentType: res.headers.get("Content-Type") || blob.type || "application/octet-stream",
  };
}
