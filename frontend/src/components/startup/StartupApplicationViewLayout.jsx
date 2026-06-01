"use client";

import Link from "next/link";
import StartupProfileMenu from "@/components/startup/StartupProfileMenu";
import ViewableFileTrigger from "@/components/startup/ViewableFileTrigger";
import OfferDocumentFolders from "@/components/startup/OfferDocumentFolders";
import {
  buildDocumentSlotRows,
  contactLocation,
  contactRangeLabel,
  contactTags,
  formatAmountInput,
  formatApplicationStatus,
  founderDisplayName,
  investorDisplayName,
  isContactActive,
  mentorDisplayName,
  offerToContact,
  statusBadgeClass,
} from "@/lib/applicationFormUtils";

const labelClass = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2";
const valueClass = "w-full bg-[#f8fafc] border border-gray-100 rounded-xl px-4 py-3 text-xs font-medium text-gray-900 whitespace-pre-wrap";
const valueEmptyClass = "text-gray-400 italic";

function PageHeader({ startup }) {
  const founder = founderDisplayName(startup);
  const company = startup?.startup_name || "My Startup";

  return (
    <header className="flex justify-between items-center px-4 sm:px-8 py-5 bg-white border-b border-gray-100 w-full z-10 sticky top-0 shrink-0">
      <div className="relative w-full max-w-[400px] hidden sm:block">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input type="text" placeholder="Search..." readOnly className="w-full pl-11 pr-4 py-2.5 bg-[#f8fafc] border-none rounded-xl text-sm outline-none" />
      </div>
      <div className="flex items-center gap-4 sm:gap-6 ml-auto">
        <StartupProfileMenu profileName={company} profileSubtitle={`Founder, ${founder}`} />
      </div>
    </header>
  );
}

function ReadOnlyField({ label, value, emptyText = "Not provided" }) {
  const hasValue = value != null && String(value).trim() !== "";
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <div className={`${valueClass} ${!hasValue ? valueEmptyClass : ""}`}>
        {hasValue ? value : emptyText}
      </div>
    </div>
  );
}

function ContactCard({ kind, offer, profileHref }) {
  const contact = offerToContact(offer, kind);
  const name = kind === "investment" ? investorDisplayName(contact) : mentorDisplayName(contact);
  const active = isContactActive(contact, kind);
  const location = contactLocation(contact, kind);
  const range = contactRangeLabel(contact, kind);
  const tags = contactTags(contact, kind);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 bg-[#eaf4f1] rounded-xl flex items-center justify-center text-[#0f3d32] shrink-0 border border-gray-50">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h3 className="text-sm font-bold text-gray-900 truncate">{name}</h3>
            <span
              className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                active ? "bg-[#f0fdf4] text-[#16a34a]" : "bg-gray-100 text-gray-500"
              }`}
            >
              {active ? "Active" : "Pending"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-400 text-[10px] font-medium">
            {location && <span>{location}</span>}
            {range && <span>{kind === "investment" ? `Range: ${range}` : range}</span>}
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <span key={tag} className="text-[9px] font-bold uppercase tracking-wide text-[#0f3d32] bg-[#eaf4f1] px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <Link
        href={profileHref}
        className="text-[10px] font-bold text-[#0f3d32] border border-[#0f3d32]/20 px-4 py-2 rounded-lg hover:bg-[#f0faf7] transition text-center shrink-0"
      >
        View profile
      </Link>
    </div>
  );
}

function DocumentStatusBadge({ status }) {
  if (status === "uploaded") {
    return (
      <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1 shrink-0">
        <span className="w-1 h-1 bg-green-500 rounded-full" />
        Uploaded
      </span>
    );
  }
  if (status === "pending") {
    return <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest shrink-0">Pending</span>;
  }
  return <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest shrink-0">Optional</span>;
}

function SubmittedDocuments({ documents, projectId }) {
  const rows = buildDocumentSlotRows(documents, projectId);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-4 h-4 text-[#0f3d32]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        <h2 className="text-sm font-bold text-gray-900 tracking-tight">Attached Documents</h2>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div
            key={row.key}
            className={`flex items-center justify-between p-4 rounded-xl border gap-3 ${
              row.uploaded ? "border-gray-50 bg-[#f8fafc]" : "border-dashed border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-grow">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  row.uploaded ? "bg-[#eaf4f1] text-[#0f3d32]" : "bg-gray-50 text-gray-300"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              {row.uploaded && row.doc ? (
                <ViewableFileTrigger
                  filePath={row.doc.file_path}
                  fileName={row.doc.file_name}
                  fileType={row.doc.file_type}
                  showBadge={false}
                  className="min-w-0 flex-grow !cursor-pointer"
                >
                  <span className="block min-w-0 text-left">
                    <span className="block text-[11px] font-bold text-gray-900">{row.label}</span>
                    <span className="block text-[10px] text-[#0f3d32] font-medium truncate mt-0.5 hover:underline">
                      {row.doc.file_name}
                    </span>
                  </span>
                </ViewableFileTrigger>
              ) : (
                <div>
                  <h4 className="text-[11px] font-bold text-gray-900">{row.label}</h4>
                  <p className="text-[10px] text-gray-400">{row.required ? "Not uploaded" : "Optional"}</p>
                </div>
              )}
            </div>
            <DocumentStatusBadge status={row.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplicationSummary({ kind, offer, parsed, startup }) {
  const isInvestment = kind === "investment";
  const amount = isInvestment
    ? formatAmountInput(offer.amount)
    : formatAmountInput(parsed.paymentOffer || offer.amount);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">Application Summary</h3>
        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${statusBadgeClass(offer.status)}`}>
          {formatApplicationStatus(offer.status)}
        </span>
      </div>
      <div className="flex flex-col gap-5">
        <div>
          <p className={labelClass}>Startup Name</p>
          <p className="text-xs font-bold text-gray-700">{offer.startup_name || startup?.startup_name || "—"}</p>
        </div>
        {isInvestment && offer.project_title && (
          <div>
            <p className={labelClass}>Project</p>
            <p className="text-xs font-bold text-gray-700">{offer.project_title}</p>
          </div>
        )}
        <div>
          <p className={labelClass}>Industry</p>
          <p className="text-xs font-bold text-gray-700">
            {offer.project_industry || offer.startup_industry || startup?.industry || "—"}
          </p>
        </div>
        <div>
          <p className={labelClass}>{isInvestment ? "Requested Amount" : "Payment Offer"}</p>
          <p className="text-xs font-bold text-gray-700">{amount}</p>
        </div>
        <div>
          <p className={labelClass}>Submitted</p>
          <p className="text-xs font-bold text-gray-700">
            {offer.created_at
              ? new Date(offer.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>
        <div className="pt-4 border-t border-gray-50">
          <p className={labelClass}>Direction</p>
          <p className="text-xs font-bold text-gray-700 mt-1">{offer.source_label || "—"}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Read-only application view matching the apply form layout.
 */
export default function StartupApplicationViewLayout({
  kind,
  offer,
  startup,
  documents = [],
  parsed,
  profileHref,
  offersListHref = "/startup/offers",
  footer,
}) {
  const isInvestment = kind === "investment";
  const isSentByStartup = offer.source_direction === "sent";
  const title = isInvestment
    ? isSentByStartup
      ? "View Application"
      : "Investment Offer"
    : isSentByStartup
      ? "View Mentorship Request"
      : "Mentorship Offer";
  const subtitle = isSentByStartup
    ? "Review what you submitted in this application."
    : "Review this offer from the other party.";

  const projectId = offer.project_id || null;
  const showStructuredForm = isSentByStartup || parsed.useOfFunds || parsed.milestones || parsed.message;

  return (
    <>
      <PageHeader startup={startup} />

      <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f3d32] mb-1">{title}</h1>
          <p className="text-xs text-gray-400 font-medium tracking-tight">{subtitle}</p>
        </div>
        <Link
          href={offersListHref}
          className="text-[10px] font-bold text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition shrink-0"
        >
          ← All offers
        </Link>
      </div>

      <div className="px-4 sm:px-8 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <ContactCard kind={kind} offer={offer} profileHref={profileHref} />

          {showStructuredForm ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6 sm:mb-8">
                <svg className="w-4 h-4 text-[#0f3d32]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-sm font-bold text-gray-900 tracking-tight">Application Form</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {isInvestment && (
                  <ReadOnlyField label="Startup Project" value={offer.project_title} />
                )}
                <ReadOnlyField
                  label={isInvestment ? "Funding Amount Requested ($)" : "Payment Offer ($)"}
                  value={
                    isInvestment
                      ? formatAmountInput(offer.amount)
                      : formatAmountInput(parsed.paymentOffer || offer.amount)
                  }
                />
              </div>

              <div className="space-y-6">
                <ReadOnlyField
                  label={isInvestment ? "Use of Funds" : "Mentorship Goals"}
                  value={parsed.useOfFunds}
                />
                <ReadOnlyField
                  label={isInvestment ? "Expected Milestones" : "Expected Outcomes"}
                  value={parsed.milestones}
                />
                <ReadOnlyField
                  label={isInvestment ? "Message to Investor" : "Message to Mentor"}
                  value={parsed.message}
                />
                {!isInvestment && offer.subject && (
                  <ReadOnlyField label="Subject" value={offer.subject} />
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-4">
                {isInvestment ? "Investment proposal" : "Mentorship message"}
              </h2>
              <p className={`${valueClass} min-h-[80px]`}>{parsed.raw || offer.message || "No message provided"}</p>
            </div>
          )}

          {isSentByStartup && <SubmittedDocuments documents={documents} projectId={projectId} />}

          {(offer.document_folders?.length > 0 || offer.document_count > 0) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-4">
                {isInvestment ? "Documents from investor" : "Documents from mentor"}
              </h2>
              <OfferDocumentFolders folders={offer.document_folders || []} compact />
            </div>
          )}

          {footer ? <div className="mt-2">{footer}</div> : null}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24">
          <ApplicationSummary kind={kind} offer={offer} parsed={parsed} startup={startup} />
          <div className="bg-[#eaf4f1] rounded-2xl p-5 border border-[#0f3d32]/5 flex gap-4">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm text-[#0f3d32]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-[10px] text-[#0f3d32] font-bold leading-relaxed">
              {offer.status === "pending" && offer.source_direction === "incoming"
                ? "This offer is waiting for your response. Accept or reject when you have reviewed the details."
                : ["accepted", "approved"].includes(String(offer.status || "").toLowerCase())
                  ? isInvestment
                    ? "Your application was accepted. Continue the conversation from Messages."
                    : "Mentorship is active. You can message your mentor and complete payment when ready."
                  : offer.status === "rejected"
                    ? "This application was declined. You can submit a new request to other partners from Discover."
                    : "Track status updates here as the investor or mentor reviews your submission."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
