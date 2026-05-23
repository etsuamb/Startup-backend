"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/startup/Sidebar";
import { getOfferDetails, updateOfferStatus } from "@/lib/startupApi";
import OfferDocumentFolders from "@/components/startup/OfferDocumentFolders";
import { PendingApprovalBanner } from "@/components/startup/PendingApprovalNotice";
import { useStartupApproval } from "@/hooks/useStartupApproval";

export default function OfferDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { offerType, offerId } = params;
  
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);
  const [updating, setUpdating] = useState(false);
  const { approved, pending, loading: approvalLoading } = useStartupApproval();

  useEffect(() => {
    fetchOfferDetails();
  }, [offerType, offerId]);

  async function fetchOfferDetails() {
    try {
      setLoading(true);
      setError(null);
      const response = await getOfferDetails(offerType, offerId);
      setOffer(response.offer);
    } catch (err) {
      console.error("Failed to fetch offer details:", err);
      setError("Failed to load offer details. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action) {
    try {
      setUpdating(true);
      setActionError(null);
      await updateOfferStatus(offerType, offerId, action);
      setShowConfirmDialog(null);
      await fetchOfferDetails();
    } catch (err) {
      console.error("Failed to update offer:", err);
      setActionError(err.message || err.data?.error || "Failed to update offer. Please try again.");
    } finally {
      setUpdating(false);
    }
  }

  function formatAmount(amount) {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(dateString) {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function getStatusColor(status) {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-[#fef3c7] text-[#92400e]";
      case "approved":
      case "accepted":
        return "bg-[#dcfce7] text-[#166534]";
      case "rejected":
        return "bg-[#fee2e2] text-[#991b1b]";
      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  function formatStatus(status) {
    if (status === "approved") return "accepted";
    return status || "unknown";
  }

  function getDirectionColor() {
    if (isInvestment && offer.source_direction === "incoming") {
      return "bg-blue-50 text-blue-700";
    }
    if (!isInvestment) {
      return "bg-purple-50 text-purple-700";
    }
    return "bg-gray-100 text-gray-700";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7f9] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f3d32] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading offer details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-[#f4f7f9] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || "Offer not found"}</p>
            <Link
              href="/startup/offers"
              className="inline-flex items-center justify-center rounded-full bg-[#0f3d32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0b2a1d]"
            >
              Back to Offers
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isInvestment = offerType === "investment";
  const canAction =
    approved && offer.source_direction === "incoming" && offer.status === "pending";
  const isAcceptedMentorship =
    !isInvestment && ["accepted", "approved"].includes(String(offer.status || "").toLowerCase());

  return (
    <div className="min-h-screen bg-[#f4f7f9] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto">
        <header className="px-4 sm:px-8 py-8 bg-gradient-to-r from-[#0f3d32] via-[#115b4c] to-[#184f45] text-white sticky top-0 z-10 shadow-sm">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-[#b8f0d9]">Offer details</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">
                {isInvestment ? "Investment" : "Mentorship"} Offer
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-[#d2f8e3]">
                Review whether this is an incoming offer or a request your startup already sent.
              </p>
            </div>
            <Link
              href="/startup/offers"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              ← Back to all offers
            </Link>
          </div>
        </header>

        <div className="px-4 sm:px-10 py-10 w-full max-w-[1200px] mx-auto pb-24">
          <div className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="rounded-full bg-[#ecfdf3] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#0f3d32]">
                    {offer.type}
                  </span>
                  <span className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${getDirectionColor()}`}>
                    {offer.source_label || (offer.source_direction === "incoming" ? "Incoming" : "Sent by startup")}
                  </span>
                  <span className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] ${getStatusColor(offer.status)}`}>
                    {formatStatus(offer.status)}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {offer.first_name} {offer.last_name}
                </h2>
                <p className="mt-2 text-lg text-gray-600">
                  {offer.company || offer.headline || offer.professional_title || "N/A"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Received on</p>
                <p className="mt-2 text-base font-semibold text-gray-900">{formatDate(offer.created_at)}</p>
              </div>
            </div>

            {isInvestment && offer.amount && (
              <div className="rounded-[24px] bg-gradient-to-r from-[#0f3d32] to-[#115b4c] p-8 mb-8 text-white">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b8f0d9] mb-2">Investment Amount</p>
                <p className="text-5xl font-black">{formatAmount(offer.amount)}</p>
                {offer.project_title && (
                  <p className="mt-4 text-[#d2f8e3]">For project: {offer.project_title}</p>
                )}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="rounded-[24px] bg-[#f8fafc] p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Name</p>
                    <p className="mt-1 text-sm text-gray-900">{offer.first_name} {offer.last_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Email</p>
                    <p className="mt-1 text-sm text-gray-900">{offer.email || "N/A"}</p>
                  </div>
                  {offer.phone_number && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Phone</p>
                      <p className="mt-1 text-sm text-gray-900">{offer.phone_number}</p>
                    </div>
                  )}
                  {offer.location_preference && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Location</p>
                      <p className="mt-1 text-sm text-gray-900">{offer.location_preference}</p>
                    </div>
                  )}
                  {offer.country && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Country</p>
                      <p className="mt-1 text-sm text-gray-900">{offer.country}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] bg-[#f8fafc] p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {isInvestment ? "Investment Details" : "Mentorship Details"}
                </h3>
                <div className="space-y-3">
                  {isInvestment ? (
                    <>
                      {offer.investment_budget && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Investment Budget</p>
                          <p className="mt-1 text-sm text-gray-900">{formatAmount(offer.investment_budget)}</p>
                        </div>
                      )}
                      {offer.preferred_industry && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Preferred Industry</p>
                          <p className="mt-1 text-sm text-gray-900">{offer.preferred_industry}</p>
                        </div>
                      )}
                      {offer.investment_stage && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Investment Stage</p>
                          <p className="mt-1 text-sm text-gray-900">{offer.investment_stage}</p>
                        </div>
                      )}
                      {offer.investor_type && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Investor Type</p>
                          <p className="mt-1 text-sm text-gray-900">{offer.investor_type}</p>
                        </div>
                      )}
                      {offer.portfolio_size && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Portfolio Size</p>
                          <p className="mt-1 text-sm text-gray-900">{offer.portfolio_size} companies</p>
                        </div>
                      )}
                      {offer.project_description && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Project Description</p>
                          <p className="mt-1 text-sm text-gray-900">{offer.project_description}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {offer.professional_title && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Professional Title</p>
                          <p className="mt-1 text-sm text-gray-900">{offer.professional_title}</p>
                        </div>
                      )}
                      {offer.years_experience && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Years of Experience</p>
                          <p className="mt-1 text-sm text-gray-900">{offer.years_experience} years</p>
                        </div>
                      )}
                      {offer.primary_industry && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Primary Industry</p>
                          <p className="mt-1 text-sm text-gray-900">{offer.primary_industry}</p>
                        </div>
                      )}
                      {offer.secondary_industry && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Secondary Industry</p>
                          <p className="mt-1 text-sm text-gray-900">{offer.secondary_industry}</p>
                        </div>
                      )}
                      {offer.session_pricing && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Session Pricing</p>
                          <p className="mt-1 text-sm text-gray-900">{formatAmount(offer.session_pricing)}</p>
                        </div>
                      )}
                      {offer.mentoring_style && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Mentoring Style</p>
                          <p className="mt-1 text-sm text-gray-900">{offer.mentoring_style}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-gray-200 bg-[#f9fafb] p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {isInvestment ? "Investment Proposal" : "Mentorship Message"}
              </h3>
              {!isInvestment && offer.subject && (
                <p className="mb-3 text-sm font-semibold text-gray-900">Subject: {offer.subject}</p>
              )}
              <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                {offer.message || offer.proposal_message || "No message provided"}
              </p>
            </div>

            {offer.bio && (
              <div className="rounded-[24px] border border-gray-200 bg-[#f9fafb] p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About {isInvestment ? "Investor" : "Mentor"}</h3>
                <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                  {offer.bio}
                </p>
              </div>
            )}

            {!isInvestment && offer.expertise && (
              <div className="rounded-[24px] border border-gray-200 bg-[#f9fafb] p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas of Expertise</h3>
                <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                  {offer.expertise}
                </p>
              </div>
            )}

            {!isInvestment && offer.notable_startups_mentored && (
              <div className="rounded-[24px] border border-gray-200 bg-[#f9fafb] p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notable Startups Mentored</h3>
                <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                  {offer.notable_startups_mentored}
                </p>
              </div>
            )}

            {!isInvestment && offer.key_achievement && (
              <div className="rounded-[24px] border border-gray-200 bg-[#f9fafb] p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Achievement</h3>
                <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                  {offer.key_achievement}
                </p>
              </div>
            )}

            <div className="rounded-[24px] border border-gray-200 bg-[#f9fafb] p-6 mb-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isInvestment ? "Investor" : "Mentor"} documents
                </h3>
                {offer.document_count > 0 && (
                  <span className="text-sm font-semibold text-gray-500">
                    {offer.document_count} file{offer.document_count === 1 ? "" : "s"} across{" "}
                    {offer.document_folders?.length || 0} folder
                    {(offer.document_folders?.length || 0) === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              <OfferDocumentFolders folders={offer.document_folders || []} />
            </div>

            {isAcceptedMentorship && (
              <div className="rounded-[24px] border border-[#cfe8dc] bg-[#f0faf5] p-6 mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#0f3d32]">Mentorship is active</h3>
                  <p className="mt-1 text-sm text-gray-600">Pay your mentor and leave a rating when you are ready.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/startup/payment"
                    className="inline-flex items-center justify-center rounded-2xl bg-[#0f3d32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0b2a1d]"
                  >
                    Pay mentor
                  </Link>
                  <Link
                    href={`/startup/ratings?mentorId=${offer.mentor_id}`}
                    className="inline-flex items-center justify-center rounded-2xl border border-[#0f3d32] bg-white px-6 py-3 text-sm font-semibold text-[#0f3d32] transition hover:bg-[#f0faf5]"
                  >
                    Rate mentor
                  </Link>
                </div>
              </div>
            )}

            {!approvalLoading && pending && (
              <PendingApprovalBanner className="mb-6" />
            )}

            {actionError && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {actionError}
              </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-gray-200">
              <div className="flex gap-3">
                {canAction && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowConfirmDialog("accept")}
                      disabled={updating}
                      className="inline-flex items-center justify-center rounded-2xl bg-[#0f3d32] px-8 py-4 text-sm font-semibold text-white transition hover:bg-[#0b2a1d] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updating ? "Processing..." : "Accept Offer"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmDialog("reject")}
                      disabled={updating}
                      className="inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-8 py-4 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updating ? "Processing..." : "Reject Offer"}
                    </button>
                  </>
                )}
              </div>
              <div className="rounded-3xl bg-[#eafdf3] px-6 py-4 text-sm text-[#0f3d32]">
                {canAction
                  ? isInvestment
                    ? "This investment offer is waiting for your response."
                    : "This mentorship proposal is waiting for your response."
                  : offer.source_direction === "sent"
                  ? "Your startup sent this request. The investor or mentor must respond to it."
                  : ["accepted", "approved"].includes(offer.status)
                  ? isInvestment
                    ? "You have accepted this investment offer. Next steps can be arranged through chat."
                    : "This mentorship offer is active. You can message and call your mentor from Mentor Chat."
                  : offer.status === "rejected"
                  ? "This offer was rejected. You can revisit the details any time."
                  : "This offer has been processed."}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {showConfirmDialog === "accept" ? "Accept Offer" : "Reject Offer"}
            </h3>
            <p className="text-gray-600 mb-6">
              {showConfirmDialog === "accept"
                ? `Are you sure you want to accept this ${isInvestment ? "investment" : "mentorship"} offer from ${offer.first_name} ${offer.last_name}?`
                : `Are you sure you want to reject this ${isInvestment ? "investment" : "mentorship"} offer from ${offer.first_name} ${offer.last_name}? This action cannot be undone.`}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(null)}
                disabled={updating}
                className="inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction(showConfirmDialog)}
                disabled={updating}
                className={`inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  showConfirmDialog === "accept"
                    ? "bg-[#0f3d32] hover:bg-[#0b2a1d]"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {updating ? "Processing..." : showConfirmDialog === "accept" ? "Yes, Accept" : "Yes, Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
