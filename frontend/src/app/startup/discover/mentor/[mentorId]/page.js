"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/startup/Sidebar";
import DiscoverProfileLayout from "@/components/startup/DiscoverProfileLayout";
import { PendingApprovalBlock } from "@/components/startup/PendingApprovalNotice";
import { useStartupApproval } from "@/hooks/useStartupApproval";
import {
  buildMentorMatchChecks,
  findMentorRecommendation,
  formatTicketRange,
  parseMentoredList,
  parseTagList,
} from "@/lib/discoverProfileUtils";
import {
  checkRatingEligibility,
  createOrUpdateRating,
  getDiscoverMentor,
  getMentorRatings,
  getMentorRecommendations,
  getStartupGivenRatings,
  getStartupOffers,
  getStartupProfile,
  searchMentors,
} from "@/lib/startupApi";
import { buildSentOfferLookup, getSentMentorOffer } from "@/lib/offerUtils";

function mentorDisplayName(mentor) {
  return `${mentor.first_name || ""} ${mentor.last_name || ""}`.trim() || "Mentor";
}

function buildMentorProfile(mentor) {
  const location =
    mentor.city_location ||
    mentor.location ||
    [mentor.city, mentor.country].filter(Boolean).join(", ") ||
    mentor.country ||
    null;

  const activeSince = mentor.created_at
    ? new Date(mentor.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  const mentoredCount = parseMentoredList(mentor.notable_startups_mentored).length;

  return {
    displayName: mentorDisplayName(mentor),
    isActive: mentor.user_approved !== false && mentor.mentor_listed !== false,
    location,
    entityType: mentor.professional_title || mentor.mentor_type || "Mentor",
    bio:
      mentor.professional_bio ||
      mentor.bio ||
      mentor.headline ||
      `Experienced mentor supporting founders in ${mentor.primary_industry || "your industry"}.`,
    ticketRange: formatTicketRange(mentor, "mentor"),
    fundingType: null,
    overview: [
      { label: "Full Name", value: mentorDisplayName(mentor) },
      { label: "Professional Title", value: mentor.professional_title || mentor.headline },
      { label: "Organization", value: mentor.current_organization || mentor.company },
      { label: "Primary Industry", value: mentor.primary_industry },
      { label: "Location", value: location },
      { label: "Active Since", value: activeSince },
      {
        label: "Startups Mentored",
        value: mentoredCount > 0 ? `${mentoredCount}+ listed` : mentor.key_achievement ? "See portfolio" : null,
      },
    ],
    detailPills: [
      { label: "Years Experience", value: mentor.years_experience ? `${mentor.years_experience} years` : null },
      { label: "Mentoring Style", value: mentor.mentoring_style || "—" },
      { label: "Session Pricing", value: formatTicketRange(mentor, "mentor") || "—" },
      { label: "Availability", value: mentor.availability_preference || mentor.session_frequency || "—" },
    ].filter((p) => p.value && p.value !== "—"),
    industryTags: parseTagList(mentor.expertise || mentor.primary_industry),
  };
}

export default function MentorDetailsPage() {
  const params = useParams();
  const { mentorId } = params;
  const [mentor, setMentor] = useState(null);
  const [privacy, setPrivacy] = useState(null);
  const [startup, setStartup] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offerLookup, setOfferLookup] = useState({ investors: new Map(), mentors: new Map() });
  const { pending, loading: approvalLoading } = useStartupApproval();

  const [canRate, setCanRate] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [existingRating, setExistingRating] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState(null);
  const [ratingSuccess, setRatingSuccess] = useState(null);
  const [mentorRatings, setMentorRatings] = useState([]);
  const [loadingRatings, setLoadingRatings] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [detailRes, offersData, profileRes, recRes] = await Promise.all([
          getDiscoverMentor(mentorId).catch(() => null),
          getStartupOffers().catch(() => ({ offers: [] })),
          getStartupProfile().catch(() => null),
          getMentorRecommendations().catch(() => ({ recommendations: [] })),
        ]);
        setOfferLookup(buildSentOfferLookup(offersData.offers || []));
        setStartup(profileRes?.startup || profileRes || null);
        setRecommendations(recRes.recommendations || []);
        if (detailRes?.mentor) {
          setMentor(detailRes.mentor);
          setPrivacy(detailRes.privacy || detailRes.mentor.privacy || null);
        } else {
          const searchRes = await searchMentors({ query: "" });
          const found = searchRes.mentors?.find((m) => m.mentor_id === parseInt(mentorId, 10));
          if (found) {
            setMentor(found);
            setPrivacy(found.privacy || null);
          } else setError("Mentor not found");
        }
      } catch (err) {
        setError(err.message || "Failed to load mentor details.");
      } finally {
        setLoading(false);
      }
    }
    load();
    fetchRatingEligibility();
    fetchMentorRatings();
    fetchExistingRating();
  }, [mentorId]);

  async function fetchRatingEligibility() {
    try {
      const response = await checkRatingEligibility(mentorId);
      setCanRate(response.can_rate || false);
    } catch {
      setCanRate(false);
    }
  }

  async function fetchMentorRatings() {
    try {
      setLoadingRatings(true);
      const response = await getMentorRatings(mentorId);
      setMentorRatings(response.reviews || []);
    } catch {
      setMentorRatings([]);
    } finally {
      setLoadingRatings(false);
    }
  }

  async function fetchExistingRating() {
    try {
      const response = await getStartupGivenRatings();
      const row = response.reviews?.find((r) => r.mentor_id === parseInt(mentorId, 10));
      if (row) {
        setHasRated(true);
        setExistingRating(row);
        setRating(row.rating);
        setComment(row.comment || "");
      }
    } catch {
      /* ignore */
    }
  }

  async function handleSubmitRating(e) {
    e.preventDefault();
    setRatingError(null);
    if (rating === 0) {
      setRatingError("Please select a rating");
      return;
    }
    setSubmittingRating(true);
    try {
      const response = await createOrUpdateRating({
        mentor_id: parseInt(mentorId, 10),
        rating,
        comment: comment.trim(),
      });
      setRatingSuccess(response.message || "Rating submitted successfully!");
      setHasRated(true);
      setExistingRating(response.review);
      setShowRatingModal(false);
      fetchMentorRatings();
      setTimeout(() => setRatingSuccess(null), 3000);
    } catch (err) {
      setRatingError(err.message || "Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  }

  function renderStars(interactive = false, currentRating = rating) {
    return (
      <div className="flex gap-1 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={interactive ? () => setRating(star) : undefined}
            disabled={!interactive}
            className={`text-2xl ${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} ${
              star <= currentRating ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    );
  }

  const recommendation = useMemo(
    () => findMentorRecommendation(recommendations, mentorId),
    [recommendations, mentorId],
  );

  const profile = useMemo(() => (mentor ? buildMentorProfile(mentor) : null), [mentor]);

  const portfolioItems = useMemo(() => {
    if (!mentor) return [];
    return parseMentoredList(mentor.notable_startups_mentored).map((item) => ({
      ...item,
      subtitle: mentor.primary_industry
        ? `${String(mentor.primary_industry).toUpperCase()} · MENTOR`
        : "MENTORSHIP",
    }));
  }, [mentor]);

  const match = useMemo(() => {
    if (!mentor) return { percent: 0, checks: [], blurb: "" };
    const rec = recommendation;
    return {
      percent: rec?.match_percent ?? Math.round((rec?.score ?? 0.75) * 100),
      checks: buildMentorMatchChecks(mentor, { industry: startup?.industry }, rec),
      blurb:
        rec?.reason ||
        `This mentor's expertise aligns with your ${startup?.industry || "startup"} journey.`,
    };
  }, [mentor, recommendation, startup]);

  const averageRating =
    mentorRatings.length > 0
      ? (mentorRatings.reduce((sum, r) => sum + r.rating, 0) / mentorRatings.length).toFixed(1)
      : null;

  if (!approvalLoading && pending) {
    return (
      <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
        <Sidebar />
        <PendingApprovalBlock title="Mentor details unavailable" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-sm text-gray-500">Loading mentor profile…</p>
        </main>
      </div>
    );
  }

  if (error || !mentor || !profile) {
    return (
      <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || "Mentor not found"}</p>
            <Link href="/startup/discover" className="text-sm font-bold text-[#0f3d32] hover:underline">
              Back to Discover
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const sentOffer = getSentMentorOffer(offerLookup, mentorId);

  return (
    <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
      <Sidebar />
      <DiscoverProfileLayout
        kind="mentor"
        contact={mentor}
        profile={profile}
        match={match}
        portfolioItems={portfolioItems}
        offerLookup={offerLookup}
        contactId={mentorId}
        startup={startup}
        privacy={privacy}
        footerExtra={
          <>
            {ratingSuccess && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {ratingSuccess}
              </div>
            )}
            {averageRating && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Community rating</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {averageRating}{" "}
                    <span className="text-sm font-medium text-gray-500">/ 5 ({mentorRatings.length} reviews)</span>
                  </p>
                </div>
                {canRate && (
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(true)}
                    className="px-5 py-2.5 rounded-lg bg-[#0f3d32] text-white text-sm font-bold hover:bg-[#0a2921]"
                  >
                    {hasRated ? "Update rating" : "Rate mentor"}
                  </button>
                )}
              </section>
            )}
            {hasRated && existingRating && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Your rating</h3>
                <div className="flex items-center gap-3 mb-2">{renderStars(false, existingRating.rating)}</div>
                {existingRating.comment && (
                  <p className="text-sm text-gray-600">{existingRating.comment}</p>
                )}
              </section>
            )}
            {sentOffer && (
              <div className="rounded-2xl border border-[#cfe8dc] bg-[#f0faf5] p-5 text-sm text-[#0f3d32]">
                You already sent a mentorship request to this mentor. Track it from your offers page.
              </div>
            )}
          </>
        }
        belowMain={
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <h3 className="text-sm font-bold text-gray-900 mb-6">Reviews</h3>
            {loadingRatings ? (
              <p className="text-sm text-gray-500">Loading reviews…</p>
            ) : mentorRatings.length === 0 ? (
              <p className="text-sm text-gray-500">No reviews yet.</p>
            ) : (
              <ul className="space-y-6">
                {mentorRatings.map((review) => (
                  <li key={review.review_id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="font-semibold text-gray-900">{review.startup_name || "Startup"}</p>
                      <div className="flex items-center gap-2">
                        {renderStars(false, review.rating)}
                        <span className="text-sm font-bold">{review.rating}/5</span>
                      </div>
                    </div>
                    {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      {review.created_at ? new Date(review.created_at).toLocaleDateString() : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        }
      />

      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {hasRated ? "Update your rating" : "Rate this mentor"}
              </h3>
              <button type="button" onClick={() => setShowRatingModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {ratingError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {ratingError}
              </div>
            )}
            <form onSubmit={handleSubmitRating} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">Your rating</label>
                {renderStars(true)}
                <p className="text-center text-sm text-gray-500 mt-2">
                  {rating === 0 ? "Select a rating" : `${rating}/5 stars`}
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Comment (optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:border-[#0f3d32] resize-none"
                  placeholder="Share your experience with this mentor…"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-bold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRating || rating === 0}
                  className="flex-1 rounded-xl bg-[#0f3d32] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {submittingRating ? "Submitting…" : hasRated ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
