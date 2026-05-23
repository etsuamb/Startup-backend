import { formatBytes, formatFolderLabel } from "@/lib/offerUtils";
import ViewableFileTrigger from "@/components/startup/ViewableFileTrigger";

export default function OfferDocumentFolders({ folders = [], compact = false }) {
  if (!folders.length) {
    return (
      <p className="text-sm text-gray-500">
        No documents shared by this {compact ? "contact" : "investor or mentor"} yet.
      </p>
    );
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {folders.map((folder) => (
        <div
          key={folder.folder}
          className={`rounded-2xl border border-gray-200 bg-white ${compact ? "p-4" : "p-5"}`}
        >
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-bold text-gray-900">{formatFolderLabel(folder.folder)}</h4>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
              {folder.documents.length} file{folder.documents.length === 1 ? "" : "s"}
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {folder.documents.map((doc) => (
              <li
                key={`${folder.folder}-${doc.id}-${doc.file_name}`}
                className="rounded-xl border border-gray-100 bg-[#f8fafc] px-3 py-2.5 hover:border-[#0f3d32]/25 hover:bg-[#f0faf7] transition"
              >
                <ViewableFileTrigger
                  filePath={doc.file_path}
                  fileName={doc.file_name}
                  fileType={doc.file_type}
                  className="!cursor-pointer"
                >
                  <span className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between w-full">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-gray-900">{doc.file_name}</span>
                      {doc.description ? (
                        <span className="mt-0.5 block truncate text-xs text-gray-500">{doc.description}</span>
                      ) : null}
                    </span>
                    <span className="text-xs font-medium text-[#0f3d32] sm:text-gray-500">
                      {[doc.file_type, formatBytes(doc.file_size_bytes), "View"].filter(Boolean).join(" • ")}
                    </span>
                  </span>
                </ViewableFileTrigger>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
