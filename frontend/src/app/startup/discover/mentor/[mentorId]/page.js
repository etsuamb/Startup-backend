"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/startup/Sidebar";
import { searchMentors } from "@/lib/startupApi";

export default function MentorDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { mentorId } = params;
  
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);

  useEffect(() => {
    fetchMentorDetails();
  }, [mentorId]);

  async function fetchMentorDetails() {
    try {
      setLoading(true);
      setError(null);
      const response = await searchMentors({ query: "" });
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
          <div className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="rounded-full bg-[#eef7ff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#1d4f8c]">
                    Mentor
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {mentor.first_name} {mentor.last_name}
                </h2>
                <p className="mt-2 text-lg text-gray-600">
                  {mentor.headline || mentor.professional_title || mentor.company || "N/A"}
                </p>
              </div>
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

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-gray-200">
              <div className="flex gap-3">
                <Link
                  href={`/startup/discover/mentor/${mentorId}/offer`}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#0f3d32] px-8 py-4 text-sm font-semibold text-white transition hover:bg-[#0b2a1d]"
                >
                  Make an Offer
                </Link>
                <Link
                  href="/startup/mentorship"
                  className="inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-8 py-4 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                >
                  Request Mentorship
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
