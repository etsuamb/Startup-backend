"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/startup/Sidebar";
import StartupTopBar from "@/components/startup/StartupTopBar";
import {
  checkRatingEligibility,
  createOrUpdateRating,
  getStartupGivenRatings,
  getStartupOffers,
} from "@/lib/startupApi";
import { PendingApprovalBlock } from "@/components/startup/PendingApprovalNotice";
import { useStartupApproval } from "@/hooks/useStartupApproval";

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-4 py-3 text-sm outline-none transition-colors focus:border-[#0f3d32] focus:ring-2 focus:ring-[#0f3d32]/10 focus:bg-white";

function SectionCard({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Toast({ message, type, onClose }) {
  if (!message) return null;
  const isSuccess = type === "success";
  if (!isSuccess) {
    return (
      <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        {message}
      </p>
    );
  }
  return (
    <div
      className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl bg-[#0f3d32] px-5 py-3.5 text-sm font-semibold text-white shadow-lg animate-in slide-in-from-right"
    >
      {(
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {message}
    </div>
  );
}

function StarIcon({ filled, half, className = "" }) {
  return (
    <svg 
      className={`w-10 h-10 transition-colors duration-200 ${className}`} 
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor" 
      strokeWidth={filled ? "0" : "1.5"}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function RatingContent() {
  const { pending, loading: approvalLoading } = useStartupApproval();
  const searchParams = useSearchParams();
  const mentorIdFromUrl = searchParams.get("mentorId") || "";
  const [mentors, setMentors] = useState([]);
  const [selectedMentorId, setSelectedMentorId] = useState(mentorIdFromUrl);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [recentRatings, setRecentRatings] = useState([]);
  const [canRate, setCanRate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: null, type: null });
  const selectedCanRate = Boolean(selectedMentorId && canRate);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    if (type !== "error") {
      setTimeout(() => setToast({ message: null, type: null }), 3500);
    }
  };

  function applyExistingRating(mentorId, ratings = recentRatings) {
    const existing = ratings.find((r) => String(r.mentor_id) === String(mentorId));
    if (existing) {
      setRating(existing.rating);
      setComment(existing.comment || "");
    } else {
      setRating(0);
      setComment("");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedMentorId) {
      return;
    }
    checkEligibility(selectedMentorId);
  }, [selectedMentorId]);

  async function loadData() {
    try {
      setLoading(true);
      const [offersRes, ratingsRes] = await Promise.all([
        getStartupOffers(),
        getStartupGivenRatings(),
      ]);

      const acceptedMentors = (offersRes.offers || [])
        .filter((o) => o.offerType === "mentorship" && ["accepted", "approved"].includes(o.status))
        .map((o) => ({
          mentor_id: o.mentor_id,
          name: `${o.first_name || ""} ${o.last_name || ""}`.trim() || "Mentor",
          subject: o.subject,
        }));

      const unique = [];
      const seen = new Set();
      for (const mentor of acceptedMentors) {
        if (!mentor.mentor_id || seen.has(mentor.mentor_id)) continue;
        seen.add(mentor.mentor_id);
        unique.push(mentor);
      }

      const reviews = ratingsRes.reviews || [];
      const nextSelectedMentorId = selectedMentorId || (unique.length ? String(unique[0].mentor_id) : "");

      setMentors(unique);
      setRecentRatings(reviews);

      if (!selectedMentorId && unique.length) {
        setSelectedMentorId(nextSelectedMentorId);
      }
      if (nextSelectedMentorId) applyExistingRating(nextSelectedMentorId, reviews);
    } catch (err) {
      showToast(err.message || "Failed to load rating data.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function checkEligibility(mentorId) {
    try {
      const res = await checkRatingEligibility(mentorId);
      setCanRate(Boolean(res.can_rate));
    } catch {
      setCanRate(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedMentorId) {
      showToast("Select a mentor to rate.", "error");
      return;
    }
    if (rating === 0) {
      showToast("Please select a star rating.", "error");
      return;
    }

    try {
      setSaving(true);
      await createOrUpdateRating({
        mentor_id: parseInt(selectedMentorId, 10),
        rating,
        comment: comment.trim(),
      });
      showToast("Rating saved successfully.");
      await loadData();
    } catch (err) {
      showToast(err.message || "Failed to submit rating.", "error");
    } finally {
      setSaving(false);
    }
  }

  const ratingCounts = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: recentRatings.filter(r => r.rating === stars).length
  }));
  const totalRatings = recentRatings.length;

  if (!approvalLoading && pending) {
    return (
      <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
        <Sidebar />
        <PendingApprovalBlock title="Ratings unavailable" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
      <Sidebar />
      <Toast message={toast.message} type={toast.type} />
      
      <main className="flex-grow flex flex-col overflow-y-auto">
        <StartupTopBar searchPlaceholder="Search mentors..." />

        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-8 py-8 pb-24">
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#0f3d32]">Startup · Feedback</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">Rate your mentors</h1>
            <p className="mt-1.5 text-sm text-gray-500 max-w-2xl">
              Share feedback after an accepted mentorship. Ratings help other startups choose the right mentor for their growth journey.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <SectionCard>
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Select Mentor</h2>
                  <p className="text-sm text-gray-500 mt-1">Choose an accepted mentor to leave feedback for.</p>
                </div>
                
                {loading ? (
                  <div className="py-10 text-center">
                    <div className="w-8 h-8 rounded-full border-2 border-[#0f3d32] border-t-transparent animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">Loading mentors...</p>
                  </div>
                ) : mentors.length === 0 ? (
                  <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-sm font-medium text-gray-500">No accepted mentorships yet.</p>
                    <Link href="/startup/offers" className="mt-2 inline-block text-sm font-bold text-[#0f3d32] hover:text-[#0b2f26]">
                      View offers →
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {mentors.map((mentor) => {
                      const isSelected = selectedMentorId === String(mentor.mentor_id);
                      return (
                        <label 
                          key={mentor.mentor_id}
                          className={`relative flex cursor-pointer rounded-xl border p-4 focus:outline-none transition-all duration-200 ${
                            isSelected 
                              ? 'border-[#0f3d32] bg-[#f0faf7] shadow-sm ring-1 ring-[#0f3d32]' 
                              : 'border-gray-200 bg-white hover:border-[#0f3d32]/30 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="mentor"
                            value={mentor.mentor_id}
                            checked={isSelected}
                            onChange={(e) => {
                              setCanRate(false);
                              applyExistingRating(e.target.value);
                              setSelectedMentorId(e.target.value);
                            }}
                            className="sr-only"
                          />
                          <div className="flex w-full items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${isSelected ? 'bg-[#0f3d32] text-white' : 'bg-gray-100 text-gray-600'}`}>
                                {mentor.name.charAt(0)}
                              </div>
                              <div className="min-w-0 text-sm">
                                <p className={`font-bold truncate ${isSelected ? 'text-[#0f3d32]' : 'text-gray-900'}`}>{mentor.name}</p>
                                <p className={`truncate font-medium mt-0.5 ${isSelected ? 'text-[#0f3d32]/70' : 'text-gray-500'}`}>{mentor.subject || "General Mentorship"}</p>
                              </div>
                            </div>
                            {isSelected && (
                              <svg className="h-5 w-5 text-[#0f3d32] shrink-0 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
                
                {selectedMentorId && !selectedCanRate && mentors.length > 0 && (
                  <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
                    <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">Rating currently unavailable</h4>
                      <p className="text-xs text-amber-800 mt-1">You can only rate mentors after an accepted mentorship relationship has begun.</p>
                    </div>
                  </div>
                )}
              </SectionCard>

              <SectionCard className={!selectedCanRate ? "opacity-50 pointer-events-none" : ""}>
                <div className="mb-8 text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">How was your experience?</h2>
                  <p className="text-sm text-gray-500">Tap a star to rate {mentors.find(m => String(m.mentor_id) === selectedMentorId)?.name || "the mentor"}</p>
                </div>
                
                <div className="flex justify-center gap-2 mb-8">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      disabled={!selectedCanRate}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className={`transition-transform duration-200 focus:outline-none focus:scale-110 active:scale-95 ${
                        star <= (hoverRating || rating) ? 'text-amber-400 scale-110' : 'text-gray-200'
                      }`}
                    >
                      <StarIcon filled={star <= (hoverRating || rating)} />
                    </button>
                  ))}
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Add a written review</label>
                    <span className="text-xs font-bold text-gray-400">{comment.length}/500</span>
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, 500))}
                    rows={4}
                    disabled={!selectedCanRate}
                    placeholder="What went well? What could improve? (Optional)"
                    className={`${inputClass} resize-none disabled:bg-gray-50 disabled:text-gray-400`}
                  />
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving || !selectedCanRate || rating === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0f3d32] px-8 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0b2f26] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving Review...</>
                    ) : (
                      <>Submit Review</>
                    )}
                  </button>
                </div>
              </SectionCard>
            </form>

            <aside className="space-y-6">
              <SectionCard className="!p-0 overflow-hidden sticky top-28">
                <div className="border-b border-gray-100 px-6 sm:px-8 py-5 bg-gray-50/50">
                    <h2 className="text-sm font-bold text-gray-900">Your Rating History</h2>
                </div>
                
                {/* Rating Distribution */}
                {totalRatings > 0 && (
                  <div className="px-6 sm:px-8 py-5 border-b border-gray-100 bg-white">
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-3xl font-black text-gray-900">
                        {(recentRatings.reduce((acc, r) => acc + r.rating, 0) / totalRatings).toFixed(1)}
                      </span>
                      <span className="text-sm font-bold text-gray-500">avg from {totalRatings} review{totalRatings !== 1 ? 's' : ''}</span>
                    </div>
                    
                    <div className="space-y-2">
                      {ratingCounts.map(({ stars, count }) => (
                        <div key={stars} className="flex items-center gap-3 text-xs">
                          <span className="w-3 font-bold text-gray-500 text-right">{stars}</span>
                          <span className="text-amber-400 text-[10px]">★</span>
                          <div className="flex-grow h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-400 rounded-full" 
                              style={{ width: `${totalRatings > 0 ? (count / totalRatings) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="w-4 font-medium text-gray-400">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                  {recentRatings.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 bg-white">
                      <p className="text-sm font-medium">No ratings submitted yet.</p>
                      <p className="text-xs text-gray-400 mt-1">Your reviews will appear here.</p>
                    </div>
                  ) : (
                    recentRatings.map((item) => (
                      <div key={item.review_id} className="p-6 bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-gray-900 text-sm">{item.mentor_name || "Mentor"}</p>
                          <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                            {formatDate(item.created_at)}
                          </p>
                        </div>
                        <div className="flex gap-0.5 mb-2 text-sm">
                          {[1, 2, 3, 4, 5].map(star => (
                             <span key={star} className={star <= item.rating ? "text-amber-400" : "text-gray-200"}>★</span>
                          ))}
                        </div>
                        {item.comment && (
                          <p className="text-sm text-gray-600 leading-relaxed mt-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            &quot;{item.comment}&quot;
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function StartupRatingsPage() {
  return (
    <Suspense fallback={null}>
      <RatingContent />
    </Suspense>
  );
}
