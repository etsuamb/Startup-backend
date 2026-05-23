"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/startup/Sidebar";
import { searchMentors, checkRatingEligibility, createOrUpdateRating, getMentorRatings, getStartupGivenRatings, getStartupOffers } from "@/lib/startupApi";
import { buildSentOfferLookup, getSentMentorOffer } from "@/lib/offerUtils";
import DiscoverOfferButton from "@/components/startup/DiscoverOfferButton";

export default function MentorDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { mentorId } = params;
  
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);

  // Rating states
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
  const [offerLookup, setOfferLookup] = useState({ investors: new Map(), mentors: new Map() });

  useEffect(() => {
    fetchMentorDetails();
    fetchRatingEligibility();
    fetchMentorRatings();
    fetchExistingRating();
  }, [mentorId]);

  async function fetchMentorDetails() {
    try {
      setLoading(true);
      setError(null);
      const [response, offersData] = await Promise.all([
        searchMentors({ query: "" }),
        getStartupOffers().catch(() => ({ offers: [] })),
      ]);
      setOfferLookup(buildSentOfferLookup(offersData.offers || []));
      const foundMentor = response.mentors?.find(m => m.mentor_id === parseInt(mentorId));
      if (foundMentor) {
        setMentor(foundMentor);
      } else {
        setError("Mentor not found");
      }
    } catch (err) {
      console.error("Failed to fetch mentor details:", err);
      setError("Failed to load mentor details. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchRatingEligibility() {
    try {
      const response = await checkRatingEligibility(mentorId);
      setCanRate(response.can_rate || false);
    } catch (err) {
      console.error("Failed to check rating eligibility:", err);
      setCanRate(false);
    }
  }

  async function fetchMentorRatings() {
    try {
      setLoadingRatings(true);
      const response = await getMentorRatings(mentorId);
      setMentorRatings(response.reviews || []);
    } catch (err) {
      console.error("Failed to fetch mentor ratings:", err);
      setMentorRatings([]);
    } finally {
      setLoadingRatings(false);
    }
  }

  async function fetchExistingRating() {
    try {
      const response = await getStartupGivenRatings();
      const rating = response.reviews?.find(r => r.mentor_id === parseInt(mentorId));
      if (rating) {
        setHasRated(true);
        setExistingRating(rating);
        setRating(rating.rating);
        setComment(rating.comment || "");
      }
    } catch (err) {
      console.error("Failed to fetch existing rating:", err);
    }
  }

  async function handleSubmitRating(e) {
    e.preventDefault();
    setRatingError(null);
    setRatingSuccess(null);

    if (rating === 0) {
      setRatingError("Please select a rating");
      return;
    }

    setSubmittingRating(true);
    try {
      const response = await createOrUpdateRating({
        mentor_id: parseInt(mentorId),
        rating: rating,
        comment: comment.trim()
      });
      
      setRatingSuccess(response.message || "Rating submitted successfully!");
      setHasRated(true);
      setExistingRating(response.review);
      setShowRatingModal(false);
      
      // Refresh ratings
      fetchMentorRatings();
      
      setTimeout(() => setRatingSuccess(null), 3000);
    } catch (err) {
      setRatingError(err.message || "Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  }

  const renderStars = (interactive = false, currentRating = rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : "button"}
            onClick={interactive ? () => setRating(star) : undefined}
            disabled={!interactive}
            className={`text-2xl transition-colors ${
              interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
            } ${star <= currentRating ? "text-yellow-400" : "text-gray-300"}`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const averageRating = mentorRatings.length > 0 
    ? (mentorRatings.reduce((sum, r) => sum + r.rating, 0) / mentorRatings.length).toFixed(1)
    : "0.0";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7f9] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f3d32] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading mentor details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="min-h-screen bg-[#f4f7f9] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || "Mentor not found"}</p>
            <Link
              href="/startup/discover"
              className="inline-flex items-center justify-center rounded-full bg-[#0f3d32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0b2a1d]"
            >
              Back to Discover
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f9] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto">
        <header className="px-4 sm:px-8 py-8 bg-gradient-to-r from-[#0f3d32] via-[#115b4c] to-[#184f45] text-white sticky top-0 z-10 shadow-sm">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-[#b8f0d9]">Mentor details</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">
                {mentor.first_name} {mentor.last_name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-[#d2f8e3]">
                {mentor.headline || mentor.expertise || "Experienced mentor ready to help your startup grow"}
              </p>
            </div>
            <Link
              href="/startup/discover"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              ← Back to discover
            </Link>
          </div>
        </header>

        <div className="px-4 sm:px-10 py-10 w-full max-w-[1200px] mx-auto pb-24">
          {ratingSuccess && (
            <div className="mb-6 rounded-3xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              {ratingSuccess}
            </div>
          )}

          <div className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="rounded-full bg-[#eef7ff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#1d4f8c]">
                    Mentor
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 text-xl">★</span>
                    <span className="text-lg font-bold text-gray-900">{averageRating}</span>
                    <span className="text-sm text-gray-500">({mentorRatings.length} reviews)</span>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {mentor.first_name} {mentor.last_name}
                </h2>
                <p className="mt-2 text-lg text-gray-600">
                  {mentor.headline || mentor.professional_title || mentor.company || "N/A"}
                </p>
              </div>
              {canRate && (
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#0f3d32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0b2a1d]"
                >
                  {hasRated ? "Update Rating" : "Rate Mentor"}
                </button>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="rounded-[24px] bg-[#f8fafc] p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Name</p>
                    <p className="mt-1 text-sm text-gray-900">{mentor.first_name} {mentor.last_name}</p>
                  </div>
                  {mentor.email && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Email</p>
                      <p className="mt-1 text-sm text-gray-900">{mentor.email}</p>
                    </div>
                  )}
                  {mentor.location && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Location</p>
                      <p className="mt-1 text-sm text-gray-900">{mentor.location}</p>
                    </div>
                  )}
                  {mentor.country && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Country</p>
                      <p className="mt-1 text-sm text-gray-900">{mentor.country}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] bg-[#f8fafc] p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mentorship Details</h3>
                <div className="space-y-3">
                  {mentor.professional_title && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Professional Title</p>
                      <p className="mt-1 text-sm text-gray-900">{mentor.professional_title}</p>
                    </div>
                  )}
                  {mentor.years_experience && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Years of Experience</p>
                      <p className="mt-1 text-sm text-gray-900">{mentor.years_experience} years</p>
                    </div>
                  )}
                  {mentor.primary_industry && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Primary Industry</p>
                      <p className="mt-1 text-sm text-gray-900">{mentor.primary_industry}</p>
                    </div>
                  )}
                  {mentor.session_pricing && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Session Pricing</p>
                      <p className="mt-1 text-sm text-gray-900">${mentor.session_pricing}/session</p>
                    </div>
                  )}
                  {mentor.mentoring_style && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Mentoring Style</p>
                      <p className="mt-1 text-sm text-gray-900">{mentor.mentoring_style}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {mentor.bio && (
              <div className="rounded-[24px] border border-gray-200 bg-[#f9fafb] p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About Mentor</h3>
                <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                  {mentor.bio}
                </p>
              </div>
            )}

            {mentor.expertise && (
              <div className="rounded-[24px] border border-gray-200 bg-[#f9fafb] p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas of Expertise</h3>
                <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                  {mentor.expertise}
                </p>
              </div>
            )}

            {hasRated && existingRating && (
              <div className="rounded-[24px] border border-gray-200 bg-[#f9fafb] p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Rating</h3>
                <div className="flex items-center gap-4 mb-3">
                  {renderStars(false, existingRating.rating)}
                  <span className="text-sm font-bold text-gray-900">{existingRating.rating}/5</span>
                </div>
                {existingRating.comment && (
                  <p className="text-sm text-gray-600">{existingRating.comment}</p>
                )}
              </div>
            )}

            {getSentMentorOffer(offerLookup, mentorId) && (
              <div className="rounded-[24px] border border-[#cfe8dc] bg-[#f0faf5] p-5 mb-8 text-sm text-[#0f3d32]">
                You already sent a mentorship request to this mentor. You can track it from your offers page.
              </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-gray-200">
              <div className="flex gap-3">
                <DiscoverOfferButton
                  type="mentorship"
                  contactId={mentorId}
                  offerLookup={offerLookup}
                  variant="primary"
                />
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h3>
            {loadingRatings ? (
              <div className="text-center text-gray-500 py-8">Loading reviews...</div>
            ) : mentorRatings.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No reviews yet</div>
            ) : (
              <div className="space-y-6">
                {mentorRatings.map((review) => (
                  <div key={review.review_id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0f3d32] text-white flex items-center justify-center font-bold text-sm">
                          {review.startup_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{review.startup_name || 'Anonymous Startup'}</p>
                          <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(false, review.rating)}
                        <span className="text-sm font-bold text-gray-900">{review.rating}/5</span>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {hasRated ? "Update Your Rating" : "Rate This Mentor"}
              </h3>
              <button
                onClick={() => setShowRatingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {ratingError && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {ratingError}
              </div>
            )}

            <form onSubmit={handleSubmitRating} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Your Rating
                </label>
                <div className="flex justify-center mb-4">
                  {renderStars(true)}
                </div>
                <p className="text-center text-sm text-gray-500">
                  {rating === 0 ? "Select a rating" : `${rating}/5 stars`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Comment (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:border-[#0f3d32] focus:ring-2 focus:ring-[#0f3d32]/20 resize-none"
                  placeholder="Share your experience with this mentor..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRating || rating === 0}
                  className="flex-1 inline-flex items-center justify-center rounded-2xl bg-[#0f3d32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0b2a1d] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingRating ? "Submitting..." : (hasRated ? "Update Rating" : "Submit Rating")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
