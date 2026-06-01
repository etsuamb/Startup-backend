"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/startup/Sidebar";
import StartupApplicationViewLayout from "@/components/startup/StartupApplicationViewLayout";
import { PendingApprovalBanner } from "@/components/startup/PendingApprovalNotice";
import { useStartupApproval } from "@/hooks/useStartupApproval";
import { parseApplicationMessage } from "@/lib/applicationFormUtils";
import { getDocuments, getOfferDetails, getStartupProfile, updateOfferStatus } from "@/lib/startupApi";

export default function OfferDetailsPage() {
  const params = useParams();
  const { offerType, offerId } = params;

  const [offer, setOffer] = useState(null);
  const [startup, setStartup] = useState(null);
  const [documents, setDocuments] = useState([]);
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
      const [offerRes, profileRes, docsRes] = await Promise.all([
        getOfferDetails(offerType, offerId),
        getStartupProfile().catch(() => null),
        getDocuments().catch(() => ({ documents: [] })),
      ]);
      setOffer(offerRes.offer);
      setStartup(profileRes?.startup || profileRes || null);
      setDocuments(docsRes.documents || []);
    } catch (err) {
      console.error("Failed to fetch offer details:", err);
      setError("Failed to load application details. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action) {
    try {
      setUpdating(true);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-sm text-gray-500">Loading application…</p>
        </main>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || "Application not found"}</p>
            <Link
              href="/startup/offers"
              className="inline-flex items-center justify-center rounded-xl bg-[#0f3d32] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a2921]"
            >
              Back to Offers
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isInvestment = offerType === "investment";
  const kind = isInvestment ? "investment" : "mentorship";
  const parsed = parseApplicationMessage(offer.message || offer.proposal_message, kind);
  const canAction = approved && offer.source_direction === "incoming" && offer.status === "pending";
  const isAcceptedMentorship =
    !isInvestment && ["accepted", "approved"].includes(String(offer.status || "").toLowerCase());

  const profileHref = isInvestment
    ? `/startup/discover/investor/${offer.investor_id}`
    : `/startup/discover/mentor/${offer.mentor_id}`;

  const footer = (
    <>
      {isAcceptedMentorship && (
        <div className="rounded-2xl border border-[#cfe8dc] bg-[#f0faf5] p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0f3d32]">Mentorship is active</h3>
            <p className="mt-1 text-xs text-gray-600">Pay your mentor and leave a rating when you are ready.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/startup/payment"
              className="inline-flex items-center justify-center rounded-xl bg-[#0f3d32] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0a2921]"
            >
              Pay mentor
            </Link>
            <Link
              href={`/startup/ratings?mentorId=${offer.mentor_id}`}
              className="inline-flex items-center justify-center rounded-xl border border-[#0f3d32] bg-white px-5 py-2.5 text-xs font-bold text-[#0f3d32] hover:bg-[#f0faf5]"
            >
              Rate mentor
            </Link>
          </div>
        </div>
      )}

      {!approvalLoading && pending && <PendingApprovalBanner className="mb-0" />}

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{actionError}</div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div className="flex flex-wrap gap-3">
          {canAction && (
            <>
              <button
                type="button"
                onClick={() => setShowConfirmDialog("accept")}
                disabled={updating}
                className="inline-flex items-center justify-center rounded-xl bg-[#0f3d32] px-6 py-3 text-xs font-bold text-white hover:bg-[#0a2921] disabled:opacity-50"
              >
                {updating ? "Processing…" : "Accept offer"}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmDialog("reject")}
                disabled={updating}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Reject offer
              </button>
            </>
          )}
          {isInvestment && offer.source_direction === "sent" && (
            <Link
              href={`/startup/discover/investor/${offer.investor_id}/offer`}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-6 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              New application
            </Link>
          )}
          {!isInvestment && offer.source_direction === "sent" && offer.status === "pending" && (
            <Link
              href={`/startup/discover/mentor/${offer.mentor_id}/offer`}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-6 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              New request
            </Link>
          )}
        </div>
        <Link
          href={isInvestment ? "/startup/chat?kind=investor" : "/startup/chat?kind=mentor"}
          className="text-xs font-bold text-[#0f3d32] hover:underline text-right"
        >
          Open {isInvestment ? "investor" : "mentor"} chat →
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto min-h-0">
        <StartupApplicationViewLayout
          kind={kind}
          offer={offer}
          startup={startup}
          documents={documents}
          parsed={parsed}
          profileHref={profileHref}
          footer={footer}
        />
      </main>

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {showConfirmDialog === "accept" ? "Accept offer" : "Reject offer"}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {showConfirmDialog === "accept"
                ? `Accept this ${isInvestment ? "investment" : "mentorship"} offer?`
                : `Reject this offer? This cannot be undone.`}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(null)}
                disabled={updating}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction(showConfirmDialog)}
                disabled={updating}
                className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 ${
                  showConfirmDialog === "accept" ? "bg-[#0f3d32] hover:bg-[#0a2921]" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {updating ? "Processing…" : showConfirmDialog === "accept" ? "Yes, accept" : "Yes, reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
