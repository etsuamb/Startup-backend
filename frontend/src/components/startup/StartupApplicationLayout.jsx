"use client";

import Link from "next/link";
import StartupProfileMenu from "@/components/startup/StartupProfileMenu";
import ViewableFileTrigger from "@/components/startup/ViewableFileTrigger";
import {
  buildDocumentSlotRows,
  contactLocation,
  contactRangeLabel,
  contactTags,
  formatAmountInput,
  founderDisplayName,
  investorDisplayName,
  isContactActive,
  mentorDisplayName,
  requiredDocumentsMet,
} from "@/lib/applicationFormUtils";

const inputClass =
  "w-full bg-[#f8fafc] border border-gray-100 rounded-xl px-4 py-3 text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#0f3d32]/10 focus:border-[#0f3d32]/30 transition";
const labelClass = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2";

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
        <input
          type="text"
          placeholder="Search..."
          readOnly
          className="w-full pl-11 pr-4 py-2.5 bg-[#f8fafc] border-none rounded-xl text-sm outline-none"
        />
      </div>
      <div className="flex items-center gap-4 sm:gap-6 ml-auto">
        <button type="button" className="text-gray-400 hover:text-gray-600 transition relative" aria-label="Notifications">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        <button type="button" className="text-gray-400 hover:text-gray-600 transition hidden sm:block" aria-label="Help">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <StartupProfileMenu profileName={company} profileSubtitle={`Founder, ${founder}`} />
      </div>
    </header>
  );
}

function SelectedContactCard({ kind, contact, changeHref }) {
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
            {location && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {location}
              </span>
            )}
            {range && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {kind === "investment" ? `Range: ${range}` : range}
              </span>
            )}
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
        href={changeHref}
        className="text-[10px] font-bold text-gray-400 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-center shrink-0"
      >
        Change {kind === "investment" ? "Investor" : "Mentor"}
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

function AttachedDocuments({ documents, projectId, uploadHref }) {
  const rows = buildDocumentSlotRows(documents, projectId);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#0f3d32]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">Attached Documents</h2>
        </div>
        <Link href={uploadHref} className="text-[10px] font-bold text-[#0f3d32] uppercase tracking-wider hover:underline">
          Manage uploads
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div
            key={row.key}
            className={`flex items-center justify-between p-4 rounded-xl border gap-3 ${
              row.uploaded ? "border-gray-50 bg-[#f8fafc]" : "border-dashed border-gray-200 bg-white"
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
                    <span className="block text-[11px] font-bold text-gray-900 leading-tight">{row.label}</span>
                    <span className="block text-[10px] text-[#0f3d32] font-medium tracking-tight truncate mt-0.5 hover:underline">
                      {row.doc.file_name}
                    </span>
                  </span>
                </ViewableFileTrigger>
              ) : (
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-gray-900 leading-tight">{row.label}</h4>
                  <p className="text-[10px] text-gray-400 font-medium tracking-tight">
                    {row.required ? "Required for review" : "Optional"}
                  </p>
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

function ApplicationSummary({ kind, startup, formData, projects, documentsReady }) {
  const selectedProject = projects.find((p) => String(p.project_id) === String(formData.project_id));
  const amountLabel =
    kind === "investment"
      ? formatAmountInput(formData.investment_amount)
      : formatAmountInput(formData.payment_offer);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">Application Summary</h3>
        <span className="text-[10px] font-bold text-[#0f3d32] uppercase tracking-wider">Live preview</span>
      </div>
      <div className="flex flex-col gap-5">
        <div>
          <p className={labelClass}>Startup Name</p>
          <p className="text-xs font-bold text-gray-700">{formData.startup_name || startup?.startup_name || "—"}</p>
        </div>
        {kind === "investment" && (
          <div>
            <p className={labelClass}>Project</p>
            <p className="text-xs font-bold text-gray-700">{selectedProject?.project_title || "—"}</p>
          </div>
        )}
        <div>
          <p className={labelClass}>Industry</p>
          <p className="text-xs font-bold text-gray-700">{formData.industry || startup?.industry || "—"}</p>
        </div>
        <div>
          <p className={labelClass}>{kind === "investment" ? "Requested Amount" : "Payment Offer"}</p>
          <p className="text-xs font-bold text-gray-700">{amountLabel}</p>
        </div>
        <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Documents</p>
          <span
            className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${
              documentsReady ? "bg-[#f0fdf4] text-[#16a34a]" : "bg-gray-100 text-gray-500"
            }`}
          >
            {documentsReady ? "Ready" : "Incomplete"}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {'investment'|'mentorship'} props.kind
 * @param {object} props.contact
 * @param {object} props.startup
 * @param {Array} [props.projects]
 * @param {Array} props.documents
 * @param {object} props.formData
 * @param {object} props.validationErrors
 * @param {Function} props.onChange
 * @param {Function} props.onSubmit
 * @param {boolean} props.submitting
 * @param {string} [props.error]
 * @param {string} props.changeContactHref
 * @param {string} props.documentsUploadHref
 * @param {string} [props.discoverHref]
 */
export default function StartupApplicationLayout({
  kind,
  contact,
  startup,
  projects = [],
  documents,
  formData,
  validationErrors,
  onChange,
  onSubmit,
  submitting,
  error,
  changeContactHref,
  documentsUploadHref,
  discoverHref = "/startup/discover",
}) {
  const isInvestment = kind === "investment";
  const title = isInvestment ? "Apply for Investment" : "Request Mentorship";
  const subtitle = isInvestment
    ? "Submit your funding request to the selected investor."
    : "Submit your mentorship request to the selected mentor.";

  const docsReady = isInvestment
    ? requiredDocumentsMet(documents, formData.project_id)
    : buildDocumentSlotRows(documents, formData.project_id).some((r) => r.uploaded);
  const showDocWarning = isInvestment && !requiredDocumentsMet(documents, formData.project_id);

  function handleFieldChange(e) {
    const { name, value } = e.target;
    onChange(name, value);
  }

  return (
    <>
      <PageHeader startup={startup} />

      <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-4">
        <h1 className="text-2xl font-bold text-[#0f3d32] mb-1">{title}</h1>
        <p className="text-xs text-gray-400 font-medium tracking-tight">{subtitle}</p>
      </div>

      {error && (
        <div className="mx-4 sm:mx-8 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="px-4 sm:px-8 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <SelectedContactCard kind={kind} contact={contact} changeHref={changeContactHref} />

          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6 sm:mb-8">
              <svg className="w-4 h-4 text-[#0f3d32]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h2 className="text-sm font-bold text-gray-900 tracking-tight">Application Form</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {isInvestment && (
                <div>
                  <label htmlFor="project_id" className={labelClass}>
                    Select Startup Project
                  </label>
                  <select
                    id="project_id"
                    name="project_id"
                    value={formData.project_id}
                    onChange={handleFieldChange}
                    className={inputClass}
                  >
                    <option value="">Choose a project</option>
                    {projects.map((project) => (
                      <option key={project.project_id} value={project.project_id}>
                        {project.project_title}
                        {project.funding_goal ? ` — $${Number(project.funding_goal).toLocaleString()}` : ""}
                      </option>
                    ))}
                  </select>
                  {projects.length === 0 && (
                    <p className="mt-2 text-[10px] text-gray-500">
                      No projects yet.{" "}
                      <Link href="/startup/project/create" className="text-[#0f3d32] font-bold hover:underline">
                        Create a project
                      </Link>
                    </p>
                  )}
                  {validationErrors.project_id && (
                    <p className="mt-1 text-[10px] text-red-600 font-medium">{validationErrors.project_id}</p>
                  )}
                </div>
              )}
              <div className={isInvestment ? "" : "md:col-span-2"}>
                <label htmlFor={isInvestment ? "investment_amount" : "payment_offer"} className={labelClass}>
                  {isInvestment ? "Funding Amount Requested ($)" : "Payment Offer ($)"}
                </label>
                <input
                  id={isInvestment ? "investment_amount" : "payment_offer"}
                  type="number"
                  name={isInvestment ? "investment_amount" : "payment_offer"}
                  value={isInvestment ? formData.investment_amount : formData.payment_offer}
                  onChange={handleFieldChange}
                  placeholder={isInvestment ? "e.g. 500,000" : "e.g. 150"}
                  min="0"
                  step="0.01"
                  className={inputClass}
                />
                {validationErrors[isInvestment ? "investment_amount" : "payment_offer"] && (
                  <p className="mt-1 text-[10px] text-red-600 font-medium">
                    {validationErrors[isInvestment ? "investment_amount" : "payment_offer"]}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="use_of_funds" className={labelClass}>
                {isInvestment ? "Use of Funds" : "Mentorship Goals"}
              </label>
              <textarea
                id="use_of_funds"
                name="use_of_funds"
                value={formData.use_of_funds}
                onChange={handleFieldChange}
                rows={3}
                placeholder={
                  isInvestment
                    ? "Describe how the investment will be utilized..."
                    : "Describe what guidance you need from this mentor..."
                }
                className={`${inputClass} resize-none`}
              />
              {validationErrors.use_of_funds && (
                <p className="mt-1 text-[10px] text-red-600 font-medium">{validationErrors.use_of_funds}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="milestones" className={labelClass}>
                {isInvestment ? "Expected Milestones" : "Expected Outcomes"}
              </label>
              <textarea
                id="milestones"
                name="milestones"
                value={formData.milestones}
                onChange={handleFieldChange}
                rows={3}
                placeholder={
                  isInvestment
                    ? "What key goals will be achieved with this funding?"
                    : "What outcomes do you hope to achieve through mentorship?"
                }
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label htmlFor="message" className={labelClass}>
                {isInvestment ? "Message to Investor" : "Message to Mentor"}
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleFieldChange}
                rows={3}
                placeholder={
                  isInvestment
                    ? "Personal note or introduction to the investor..."
                    : "Personal note or introduction to the mentor..."
                }
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          <AttachedDocuments
            documents={documents}
            projectId={formData.project_id}
            uploadHref={documentsUploadHref}
          />

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
            {showDocWarning ? (
              <div className="flex items-center gap-3 text-red-500">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-[10px] font-bold tracking-tight">
                  Please upload required documents before submitting
                </p>
              </div>
            ) : (
              <div className="hidden sm:block" />
            )}
            <div className="flex items-center gap-3 sm:gap-4 justify-end">
              <Link
                href={discoverHref}
                className="bg-white border border-gray-200 text-gray-600 px-6 sm:px-8 py-3 rounded-xl text-xs font-bold hover:bg-gray-50 transition shadow-sm text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || (isInvestment && !docsReady)}
                className="bg-[#0f3d32] text-white px-6 sm:px-8 py-3 rounded-xl text-xs font-bold hover:bg-[#0a2921] transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting…" : isInvestment ? "Submit Application" : "Submit Request"}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24">
          <ApplicationSummary
            kind={kind}
            startup={startup}
            formData={formData}
            projects={projects}
            documentsReady={docsReady}
          />
          <div className="bg-[#eaf4f1] rounded-2xl p-5 border border-[#0f3d32]/5 flex gap-4">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm text-[#0f3d32]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-[10px] text-[#0f3d32] font-bold leading-relaxed">
              {isInvestment
                ? "Pro tip: Complete applications with clear milestones and uploaded financials have a higher chance of receiving investor interest."
                : "Pro tip: Mentors respond best to specific goals, realistic payment offers, and a concise introduction about your startup."}
            </p>
          </div>
        </div>
      </form>
    </>
  );
}
