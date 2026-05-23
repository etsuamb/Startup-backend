"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/startup/Sidebar";
import { searchInvestors, searchMentors, getStartupOffers } from "@/lib/startupApi";
import { buildSentOfferLookup } from "@/lib/offerUtils";
import DiscoverOfferButton from "@/components/startup/DiscoverOfferButton";

export default function StartupDiscoverPage() {
  const [investors, setInvestors] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [investorQuery, setInvestorQuery] = useState("");
  const [mentorQuery, setMentorQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offerLookup, setOfferLookup] = useState({ investors: new Map(), mentors: new Map() });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [investorData, mentorData, offersData] = await Promise.all([
          searchInvestors({ query: investorQuery }),
          searchMentors({ query: mentorQuery }),
          getStartupOffers().catch(() => ({ offers: [] })),
        ]);
        setInvestors(investorData.investors || []);
        setMentors(mentorData.mentors || []);
        setOfferLookup(buildSentOfferLookup(offersData.offers || []));
      } catch (err) {
        setError(err.message || "Unable to load discovery data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [investorQuery, mentorQuery]);

  async function handleSearch(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const [investorData, mentorData, offersData] = await Promise.all([
        searchInvestors({ query: investorQuery }),
        searchMentors({ query: mentorQuery }),
        getStartupOffers().catch(() => ({ offers: [] })),
      ]);
      setInvestors(investorData.investors || []);
      setMentors(mentorData.mentors || []);
      setOfferLookup(buildSentOfferLookup(offersData.offers || []));
    } catch (err) {
      setError(err.message || "Unable to refresh discovery data.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7f9] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto">
        <header className="px-4 sm:px-8 py-8 bg-gradient-to-r from-[#0f3d32] via-[#115b4c] to-[#184f45] text-white sticky top-0 z-10 shadow-sm">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#b8f0d9]">Startup discovery</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">Find the right investors & mentors</h1>
              <p className="mt-3 max-w-2xl text-sm text-[#d2f8e3]">Search tailored investors and mentors that match your startup stage, industry, and growth goals.</p>
            </div>
            <Link href="/startup/recommendations" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-[#0f3d32] shadow-lg shadow-[#0f3d32]/10 transition hover:bg-[#f0faf5]">
              View recommendations
            </Link>
          </div>
        </header>

        <div className="px-4 sm:px-10 py-10 w-full max-w-[1200px] mx-auto pb-24">
          <form onSubmit={handleSearch} className="grid gap-4 xl:grid-cols-[1.2fr_1.2fr_auto] items-end mb-10">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Investor search</span>
              <input
                value={investorQuery}
                onChange={(e) => setInvestorQuery(e.target.value)}
                placeholder="Search by focus, sector, or investor name"
                className="mt-3 w-full rounded-3xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#0f3d32] focus:ring-2 focus:ring-[#0f3d32]/20"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Mentor search</span>
              <input
                value={mentorQuery}
                onChange={(e) => setMentorQuery(e.target.value)}
                placeholder="Search by expertise, industry, or experience"
                className="mt-3 w-full rounded-3xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#0f3d32] focus:ring-2 focus:ring-[#0f3d32]/20"
              />
            </label>

            <button
              type="submit"
              className="inline-flex h-14 items-center justify-center rounded-3xl bg-[#0f3d32] px-8 text-sm font-bold text-white shadow-lg shadow-[#0f3d32]/20 transition hover:bg-[#0a2921]"
            >
              Search
            </button>
          </form>

          {error && (
            <div className="mb-6 rounded-[28px] border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-[30px] border border-gray-100 bg-white p-12 shadow-sm text-center text-gray-500">Loading discovery results…</div>
          ) : (
            <div className="grid gap-8">
              <section className="rounded-[32px] bg-white border border-gray-100 p-8 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-400">Investors</p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900">Investor matches</h2>
                    <p className="mt-2 text-sm text-gray-500">Explore investors who back startups like yours.</p>
                  </div>
                  <Link href="/startup/chat" className="inline-flex items-center gap-2 rounded-full border border-[#0f3d32] bg-[#f0faf5] px-5 py-3 text-sm font-semibold text-[#0f3d32] transition hover:bg-[#e1f4e7]">
                    Message investors
                  </Link>
                </div>

                {investors.length === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-gray-200 bg-[#fcfdfd] p-8 text-center text-sm text-gray-500">
                    No investors found. Try broader search terms like sector, location, or investment stage.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {investors.slice(0, 6).map((investor) => (
                      <div key={investor.investor_id} className="rounded-[28px] border border-gray-200 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {investor.organization_name || `${(investor.first_name || "").trim()} ${(investor.last_name || "").trim()}`.trim() || "Investor"}
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">{investor.industry || investor.sector || "Early-stage investment"}</p>
                          </div>
                          <div className="rounded-3xl bg-[#effaf4] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#0f3d32]">
                            Investor
                          </div>
                        </div>
                        <div className="mt-5 grid gap-2 text-sm text-gray-600">
                          {investor.location && <p><span className="font-semibold text-gray-800">Location:</span> {investor.location}</p>}
                          {investor.investment_range && <p><span className="font-semibold text-gray-800">Range:</span> {investor.investment_range}</p>}
                          {investor.experience && <p><span className="font-semibold text-gray-800">Experience:</span> {investor.experience}</p>}
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3">
                          <Link href={`/startup/discover/investor/${investor.investor_id}`} className="rounded-full border border-[#0f3d32] px-4 py-2 text-xs font-semibold text-[#0f3d32] transition hover:bg-[#0f3d32] hover:text-white">
                            View Details
                          </Link>
                          <DiscoverOfferButton
                            type="investment"
                            contactId={investor.investor_id}
                            offerLookup={offerLookup}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-[32px] bg-white border border-gray-100 p-8 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-400">Mentors</p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900">Mentor connections</h2>
                    <p className="mt-2 text-sm text-gray-500">Find mentors aligned with your industry, growth stage, and goals.</p>
                  </div>
                  <Link href="/startup/discover" className="inline-flex items-center gap-2 rounded-full border border-[#0f3d32] bg-[#f0faf5] px-5 py-3 text-sm font-semibold text-[#0f3d32] transition hover:bg-[#e1f4e7]">
                    Find mentors
                  </Link>
                </div>

                {mentors.length === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-gray-200 bg-[#fcfdfd] p-8 text-center text-sm text-gray-500">
                    No mentors found. Try searching for a different skill, experience level, or industry.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {mentors.slice(0, 6).map((mentor) => (
                      <div key={mentor.mentor_id} className="rounded-[28px] border border-gray-200 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{mentor.first_name || "Mentor"} {mentor.last_name || ""}</h3>
                            <p className="mt-2 text-sm text-gray-500">{mentor.expertise || mentor.industry || "Experienced founder or advisor"}</p>
                          </div>
                          <div className="rounded-3xl bg-[#eef7ff] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#1d4f8c]">
                            Mentor
                          </div>
                        </div>
                        <div className="mt-5 grid gap-2 text-sm text-gray-600">
                          {mentor.location && <p><span className="font-semibold text-gray-800">Location:</span> {mentor.location}</p>}
                          {mentor.company && <p><span className="font-semibold text-gray-800">Company:</span> {mentor.company}</p>}
                          {mentor.mentor_type && <p><span className="font-semibold text-gray-800">Type:</span> {mentor.mentor_type}</p>}
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3">
                          <Link href={`/startup/discover/mentor/${mentor.mentor_id}`} className="rounded-full border border-[#0f3d32] px-4 py-2 text-xs font-semibold text-[#0f3d32] transition hover:bg-[#0f3d32] hover:text-white">
                            View Details
                          </Link>
                          <DiscoverOfferButton
                            type="mentorship"
                            contactId={mentor.mentor_id}
                            offerLookup={offerLookup}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
