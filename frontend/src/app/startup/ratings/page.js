"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/startup/Sidebar";
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

function RatingContent() {
  const { pending, loading: approvalLoading } = useStartupApproval();
  const searchParams = useSearchParams();
  const mentorIdFromUrl = searchParams.get("mentorId") || "";
  const [mentors, setMentors] = useState([]);
  const [selectedMentorId, setSelectedMentorId] = useState(mentorIdFromUrl);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [recentRatings, setRecentRatings] = useState([]);
  const [canRate, setCanRate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedMentorId) {
      setCanRate(false);
      return;
    }
    checkEligibility(selectedMentorId);
    const existing = recentRatings.find((r) => String(r.mentor_id) === String(selectedMentorId));
    if (existing) {
      setRating(existing.rating);
      setComment(existing.comment || "");
    } else {
      setRating(0);
      setComment("");
    }
  }, [selectedMentorId, recentRatings]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
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

      setMentors(unique);
      setRecentRatings(ratingsRes.reviews || []);

      if (!selectedMentorId && unique.length) {
        setSelectedMentorId(String(unique[0].mentor_id));
      }
    } catch (err) {
      setError(err.message || "Failed to load rating data.");
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
      setError("Select a mentor to rate.");
      return;
    }
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await createOrUpdateRating({
        mentor_id: parseInt(selectedMentorId, 10),
        rating,
        comment: comment.trim(),
      });
      setSuccess("Rating saved successfully.");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to submit rating.");
    } finally {
      setSaving(false);
    }
  }

  if (!approvalLoading && pending) {
    return (
      <div className="min-h-screen bg-[#f4f7f9] font-sans text-gray-900 flex">
        <Sidebar />
        <PendingApprovalBlock title="Ratings unavailable" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f9] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto">
        <header className="px-4 sm:px-8 py-8 bg-gradient-to-r from-[#0f3d32] via-[#115b4c] to-[#184f45] text-white sticky top-0 z-10 shadow-sm">
          <div className="max-w-[1200px] mx-auto">
            <p className="text-sm uppercase tracking-[0.32em] text-[#b8f0d9]">Mentor feedback</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Rate your mentors</h1>
            <p className="mt-3 max-w-2xl text-sm text-[#d2f8e3]">
              Share feedback after an accepted mentorship. Ratings help other startups choose the right mentor.
            </p>
          </div>
        </header>

        <div className="px-4 sm:px-10 py-10 w-full max-w-[1200px] mx-auto pb-24 grid gap-8 lg:grid-cols-[1fr_320px]">
          <form onSubmit={handleSubmit} className="rounded-[28px] border border-gray-100 bg-white p-8 shadow-sm">
            {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
            {success && <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{success}</div>}

            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Select mentor</label>
            <select
              value={selectedMentorId}
              onChange={(e) => setSelectedMentorId(e.target.value)}
              disabled={loading}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0f3d32] focus:ring-2 focus:ring-[#0f3d32]/20"
            >
              <option value="">{loading ? "Loading..." : "Choose a mentor"}</option>
              {mentors.map((mentor) => (
                <option key={mentor.mentor_id} value={mentor.mentor_id}>
                  {mentor.name} {mentor.subject ? `— ${mentor.subject}` : ""}
                </option>
              ))}
            </select>

            {!loading && mentors.length === 0 && (
              <p className="mt-4 text-sm text-gray-500">
                No accepted mentorships yet.{" "}
                <Link href="/startup/offers" className="font-semibold text-[#0f3d32] underline">
                  View offers
                </Link>
              </p>
            )}

            {selectedMentorId && !canRate && mentors.length > 0 && (
              <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-4">
                You can only rate mentors after an accepted mentorship relationship.
              </p>
            )}

            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Your rating</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-3xl transition ${star <= rating ? "text-amber-400" : "text-gray-300"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                placeholder="What went well? What could improve?"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#0f3d32] focus:ring-2 focus:ring-[#0f3d32]/20 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !selectedMentorId || !canRate}
              className="mt-8 rounded-2xl bg-[#0f3d32] px-8 py-4 text-sm font-bold text-white transition hover:bg-[#0b2a1d] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Submit rating"}
            </button>
          </form>

          <aside className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm h-fit">
            <h2 className="text-lg font-bold text-gray-900">Your ratings</h2>
            {recentRatings.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">No ratings submitted yet.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {recentRatings.map((item) => (
                  <li key={item.review_id} className="rounded-xl border border-gray-100 bg-[#f8fafc] p-4">
                    <p className="font-semibold text-gray-900">{item.mentor_name || "Mentor"}</p>
                    <p className="mt-1 text-sm text-amber-500">{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</p>
                    {item.comment && <p className="mt-2 text-sm text-gray-600">{item.comment}</p>}
                    <p className="mt-2 text-xs text-gray-400">{formatDate(item.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </aside>
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
