"use client";

import Link from "next/link";
import { useState } from "react";
import StartupProfileMenu from "@/components/startup/StartupProfileMenu";
import { getSentInvestorOffer, getSentMentorOffer } from "@/lib/offerUtils";
import { initials } from "@/lib/discoverProfileUtils";
import { isSensitiveVisible, privacyMessage } from "@/lib/profilePrivacy";
import ActorAvatar from "@/components/auth/ActorAvatar";

function CheckIcon({ matched }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
        matched ? "bg-[#dcfce7] text-[#16a34a]" : "bg-gray-100 text-gray-400"
      }`}
    >
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {matched ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        )}
      </svg>
    </span>
  );
}

function OverviewRow({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

/**
 * @param {object} props
 * @param {'investor'|'mentor'} props.kind
 * @param {object} props.contact - raw investor or mentor from API
 * @param {object} props.profile - normalized display fields
 * @param {object} props.match - { percent, checks, blurb }
 * @param {Array} props.portfolioItems
 * @param {object} props.offerLookup
 * @param {string|number} props.contactId
 * @param {object} props.startup - for header display
 * @param {object} [props.privacy] - API privacy meta
 * @param {React.ReactNode} [props.footerExtra]
 * @param {React.ReactNode} [props.belowMain]
 */
export default function DiscoverProfileLayout({
  kind,
  contact,
  profile,
  match,
  portfolioItems = [],
  offerLookup,
  contactId,
  startup,
  privacy: privacyProp,
  footerExtra,
  belowMain,
}) {
  const [messageNotice, setMessageNotice] = useState("");
  const privacy = privacyProp || contact?.privacy;
  const sensitiveVisible = isSensitiveVisible({ privacy: privacy });
  const sentOffer =
    kind === "investor"
      ? getSentInvestorOffer(offerLookup, contactId)
      : getSentMentorOffer(offerLookup, contactId);

  const offerHref =
    kind === "investor"
      ? `/startup/discover/investor/${contactId}/offer`
      : `/startup/discover/mentor/${contactId}/offer`;

  const messageHref =
    kind === "investor"
      ? `/startup/chat?investorId=${encodeURIComponent(String(contactId))}`
      : `/startup/chat?kind=mentor&mentorId=${encodeURIComponent(String(contactId))}`;
  const canMessage = ["approved", "accepted"].includes(String(sentOffer?.status || "").toLowerCase());
  const lockedMessage =
    kind === "investor"
      ? "Messaging unlocks after an investment offer or request is accepted. Apply for investment first, then wait for acceptance."
      : "Messaging unlocks after a mentorship request is accepted. Request mentorship first, then wait for acceptance.";

  const founderName =
    startup?.founder_full_name ||
    [startup?.first_name, startup?.last_name].filter(Boolean).join(" ") ||
    startup?.startup_name ||
    "Founder";

  return (
    <div className="flex-grow flex flex-col overflow-y-auto bg-[#f6f8f9] min-h-0">
      <header className="flex justify-between items-center px-4 sm:px-8 py-4 bg-white border-b border-gray-100 sticky top-0 z-10 shrink-0">
        <div className="relative w-full max-w-md hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search investors, startups..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#f3f4f6] border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0f3d32]/20"
            readOnly
          />
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <StartupProfileMenu
            profileName={startup?.startup_name || "My Startup"}
            profileSubtitle={founderName}
          />
        </div>
      </header>

      <div className="px-4 sm:px-8 py-6 w-full max-w-[1280px] mx-auto pb-24 flex-grow">
        <Link
          href="/startup/discover"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0f3d32] hover:underline mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Discover
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero card */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6">
                <ActorAvatar role={kind} profileId={contactId} initials={initials(profile.displayName)} className="h-16 w-16 shrink-0 rounded-xl text-lg shadow-sm" alt={profile.displayName} />
                <div className="flex-grow min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{profile.displayName}</h1>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${
                        profile.isActive ? "bg-[#dcfce7] text-[#16a34a]" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {profile.isActive ? "Active" : "Pending"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    {profile.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {profile.location}
                      </span>
                    )}
                    {profile.entityType && (
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {profile.entityType}
                      </span>
                    )}
                  </div>
                  {profile.bio && (
                    <p className="text-sm leading-relaxed text-gray-600">{profile.bio}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:items-end shrink-0">
                  {sentOffer ? (
                    <Link
                      href={`/startup/offers/${sentOffer.offerType}/${sentOffer.id}`}
                      className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-[#0f3d32] text-white text-sm font-bold hover:bg-[#0a2921] transition whitespace-nowrap"
                    >
                      View application
                    </Link>
                  ) : (
                    <Link
                      href={offerHref}
                      className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-[#0f3d32] text-white text-sm font-bold hover:bg-[#0a2921] transition whitespace-nowrap"
                    >
                      {kind === "investor" ? "Apply for investment" : "Request mentorship"}
                    </Link>
                  )}
                  {canMessage ? (
                    <Link
                      href={messageHref}
                      className="inline-flex items-center justify-center px-5 py-3 rounded-lg border-2 border-[#0f3d32] text-[#0f3d32] text-sm font-bold hover:bg-[#f0faf7] transition whitespace-nowrap"
                    >
                      {kind === "investor" ? "Message investor" : "Message mentor"}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMessageNotice(lockedMessage)}
                      className="inline-flex items-center justify-center px-5 py-3 rounded-lg border-2 border-amber-200 bg-amber-50 text-amber-800 text-sm font-bold hover:bg-amber-100 transition whitespace-nowrap"
                    >
                      Message locked
                    </button>
                  )}
                </div>
              </div>
            </section>

            {messageNotice && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold mb-1">You are not connected yet</p>
                    <p className="text-amber-800/90 leading-relaxed">{messageNotice}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMessageNotice("")}
                    className="text-xs font-bold text-amber-900 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              </section>
            )}

            {!sensitiveVisible && privacy && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                <p className="font-semibold mb-1">Protected contact information</p>
                <p className="text-amber-800/90 leading-relaxed">{privacyMessage({ privacy })}</p>
              </section>
            )}

            {sensitiveVisible && (contact?.email || contact?.phone_number) && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4">
                  Verified contact
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {contact.email && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email</p>
                      <p className="mt-1 font-semibold text-gray-900 break-all">{contact.email}</p>
                    </div>
                  )}
                  {contact.phone_number && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Phone</p>
                      <p className="mt-1 font-semibold text-gray-900">{contact.phone_number}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Overview */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-6">
                {kind === "investor" ? "Investor Overview" : "Mentor Overview"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                {profile.overview.map((row) => (
                  <OverviewRow key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            </section>

            {/* Details */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-6">
                {kind === "investor" ? "Investment Details" : "Mentorship Details"}
              </h2>

              {profile.ticketRange && (
                <div className="rounded-xl border border-gray-100 bg-[#f9fafb] p-4 mb-4 flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[#0f3d32] shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      {kind === "investor" ? "Ticket Range" : "Session Pricing"}
                    </p>
                    <p className="mt-1 text-sm font-bold text-gray-900">{profile.ticketRange}</p>
                  </div>
                  {profile.fundingType && (
                    <div className="ml-auto text-right hidden sm:block">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Funding Type</p>
                      <p className="mt-1 text-sm font-bold text-gray-900">{profile.fundingType}</p>
                    </div>
                  )}
                </div>
              )}

              {profile.fundingType && !profile.ticketRange && (
                <div className="mb-4">
                  <OverviewRow label="Funding Type" value={profile.fundingType} />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {profile.detailPills.map((pill) => (
                  <div key={pill.label} className="rounded-xl border border-gray-100 bg-[#f9fafb] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{pill.label}</p>
                    <p className="mt-1 text-sm font-bold text-gray-900">{pill.value}</p>
                  </div>
                ))}
              </div>

              {profile.industryTags.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                    Target Industries
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.industryTags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-bold uppercase tracking-wider text-[#0f3d32] bg-[#eaf4f1] border border-[#cde5dd] px-3 py-1.5 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {footerExtra}
            {belowMain}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-sm font-bold text-gray-900">Startup Match</h2>
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-5">
                {match.blurb ||
                  `This ${kind === "investor" ? "investor" : "mentor"} aligns with your startup profile and current project focus.`}
              </p>
              <ul className="space-y-3 mb-6">
                {match.checks.map((item) => (
                  <li key={item.label} className="flex items-start gap-3 text-sm text-gray-700">
                    <CheckIcon matched={item.matched} />
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
              <div className="relative pt-2">
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0f3d32] rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, match.percent || 0))}%` }}
                  />
                </div>
                <p className="text-center text-[10px] font-bold uppercase tracking-widest text-[#0f3d32] mt-3">
                  {match.percent ?? 0}% Match Score
                </p>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900">
                  {kind === "investor" ? "Portfolio" : "Mentored Startups"}
                </h2>
                {portfolioItems.length > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Recent</span>
                )}
              </div>
              {portfolioItems.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {kind === "investor"
                    ? contact.portfolio_size
                      ? `${contact.portfolio_size} companies in portfolio (details on request).`
                      : "No portfolio companies listed yet."
                    : "No mentored startups listed yet."}
                </p>
              ) : (
                <ul className="space-y-4">
                  {portfolioItems.map((item) => (
                    <li key={item.name} className="flex gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#f3f4f6] flex items-center justify-center text-xs font-bold text-[#0f3d32] shrink-0">
                        {initials(item.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900">{item.name}</p>
                        {item.subtitle && (
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">
                            {item.subtitle}
                          </p>
                        )}
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-1 leading-snug">{item.description}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
