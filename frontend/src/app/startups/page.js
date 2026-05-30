"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function BrowseStartups() {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("");
  const [startups, setStartups] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = 12;

  const industryOptions = [
    "Agriculture",
    "Agro-processing",
    "Construction",
    "Education",
    "Energy",
    "Environment and Water",
    "Finance and Insurance",
    "Food and Beverage",
    "Health and Wellness",
    "ICT / Technology",
    "Logistics and Transportation",
    "Manufacturing",
    "Media and Entertainment",
    "Mining and Extractives",
    "Professional Services",
    "Real Estate",
    "Retail and Consumer Goods",
    "Tourism and Hospitality",
    "Textiles and Apparel",
  ];

  const stageOptions = ["Idea Stage", "Pre-Seed", "Seed", "Early Growth"];

  const fetchStartups = async (opts = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (opts.q !== undefined ? opts.q : query)
        params.set("q", opts.q !== undefined ? opts.q : query);
      if (opts.industry !== undefined ? opts.industry : industry)
        params.set(
          "industry",
          opts.industry !== undefined ? opts.industry : industry,
        );
      if (opts.stage !== undefined ? opts.stage : stage)
        params.set("stage", opts.stage !== undefined ? opts.stage : stage);
      params.set("page", opts.page || page);
      params.set("limit", opts.limit || limit);

      const res = await fetch(
        `/api-backend/startups/search?${params.toString()}`,
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setStartups(data.startups || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } catch (err) {
      console.error("Failed to fetch startups", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load is intentional and safe for this public page.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStartups({ page: 1 });
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-[#f8fafc]">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 group cursor-pointer"
            >
              <img
                src="/logo.png"
                alt="StartupConnect Logo"
                className="w-10 h-10 object-contain"
              />
              <div className="flex flex-col -gap-1">
                <span className="font-bold text-xl text-gray-900 tracking-tight leading-tight">
                  StartupConnect
                </span>
                <span className="text-sm text-primary tracking-wide leading-tight">
                  Ethiopia
                </span>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link
              href="/"
              className="text-gray-500 hover:text-primary transition-colors"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-gray-500 hover:text-primary transition-colors"
            >
              About
            </Link>
            <Link
              href="/startups"
              className="text-primary transition-colors border-b-2 border-primary pb-1"
            >
              Browse Startups
            </Link>
            <Link
              href="/contact"
              className="text-gray-500 hover:text-primary transition-colors"
            >
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-primary transition-colors px-4 py-2 border border-primary text-primary rounded-md"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-colors px-4 py-2 rounded-md shadow-sm"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Title Section */}
        <section className="pt-16 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
            Browse Startups
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Discover innovative Ethiopian startups across different industries
            and stages.
          </p>
        </section>

        {/* Filters Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-10">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              fetchStartups({ q: query.trim(), industry, stage, page: 1 });
            }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      fetchStartups({ q: e.target.value.trim(), page: 1 });
                  }}
                  placeholder="Search startups by name or keyword..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => {
                    setIndustry(e.target.value);
                    fetchStartups({ industry: e.target.value, page: 1 });
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white text-gray-600 appearance-none"
                >
                  <option value="">All Industries</option>
                  {industryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stage
                </label>
                <select
                  value={stage}
                  onChange={(e) => {
                    setStage(e.target.value);
                    fetchStartups({ stage: e.target.value, page: 1 });
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white text-gray-600 appearance-none"
                >
                  <option value="">All Stages</option>
                  {stageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-medium text-gray-700">
                Active Filters:
              </span>
              {query || industry || stage ? (
                <div className="flex flex-wrap gap-2">
                  {query ? <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">Search: {query}</span> : null}
                  {industry ? <span className="rounded bg-green-50 px-2 py-1 text-xs font-semibold text-primary">Industry: {industry}</span> : null}
                  {stage ? <span className="rounded bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700">Stage: {stage}</span> : null}
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setIndustry("");
                      setStage("");
                      fetchStartups({ q: "", industry: "", stage: "", page: 1 });
                    }}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <span className="text-sm text-gray-500 italic">None</span>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-primary px-5 py-2 text-sm font-bold text-white transition hover:bg-primary-dark"
              >
                Apply Search
              </button>
            </div>
          </form>
        </section>

        {/* Startups Grid */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16">
          <div className="grid md:grid-cols-3 gap-8">
            {loading && (
              <div className="col-span-3 text-center">Loading...</div>
            )}
            {!loading && startups.length === 0 && (
              <div className="col-span-3 text-center text-gray-500">
                No startups found. Try adjusting your filters.
              </div>
            )}
            {startups.map((s) => (
              <div
                key={s.startup_id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition"
              >
                <div className="h-48 bg-gray-200 w-full relative">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-200">
                    Image
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow items-center text-center">
                  <h3 className="text-xl font-bold mb-2 self-start text-left w-full">
                    {s.startup_name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 flex-grow self-start text-left w-full">
                    {s.description}
                  </p>
                  <div className="flex gap-2 w-full mb-4">
                    {s.industry && (
                      <span className="px-2 py-1 bg-green-50 text-primary text-xs font-semibold rounded-md border border-green-100">
                        {s.industry}
                      </span>
                    )}
                    {s.business_stage && (
                      <span className="px-2 py-1 bg-orange-50 text-orange-600 text-xs font-semibold rounded-md border border-orange-100">
                        {s.business_stage}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center w-full text-xs text-gray-500 mb-6">
                    <svg
                      className="w-4 h-4 mr-1 pb-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      ></path>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      ></path>
                    </svg>
                    {s.location || "—"}
                  </div>
                  <Link
                    href="/register"
                    className="px-6 py-2 border border-gray-200 text-primary font-medium rounded hover:bg-green-50 transition w-full max-w-[200px] text-center"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-12 flex justify-center items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => fetchStartups({ page: page - 1 })}
              className="h-10 rounded-md border border-gray-200 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="h-10 min-w-24 rounded-md bg-primary px-4 py-2 text-center text-sm font-bold text-white">
              {page} / {Math.max(1, Math.ceil(total / limit))}
            </span>
            <button
              type="button"
              disabled={page >= Math.max(1, Math.ceil(total / limit)) || loading}
              onClick={() => fetchStartups({ page: page + 1 })}
              className="h-10 rounded-md border border-gray-200 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </section>

        {/* Call to Action Banner */}
        <section className="py-20 bg-[#167b66] text-center px-4">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Have a startup idea?
            </h2>
            <p className="text-green-50 mb-8 text-lg opacity-90 max-w-xl">
              Showcase it to investors and mentors across Ethiopia.
            </p>
            <Link
              href="/register"
              className="px-8 py-3 bg-white text-primary font-bold rounded-md hover:bg-gray-100 transition shadow-lg w-auto inline-block text-center"
            >
              Create Startup Profile
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-gray-800">
          <div className="col-span-1">
            <h3 className="text-white text-xl font-bold mb-4">
              StartupConnect Ethiopia
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Connecting innovators with investors and mentors across Ethiopia.
            </p>
            <div className="flex gap-4">
              {/* Social icons */}
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 cursor-pointer transition">
                <span className="text-xs">FB</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 cursor-pointer transition">
                <span className="text-xs">TW</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 cursor-pointer transition">
                <span className="text-xs">IN</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="/startups" className="hover:text-white transition">
                  Browse Startups
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">For Users</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/register" className="hover:text-white transition">
                  Join as Startup
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition">
                  Join as Investor
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition">
                  Join as Mentor
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/blog" className="hover:text-white transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-white transition">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-white transition"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="hover:text-white transition"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="text-center text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} StartupConnect Ethiopia. All
            rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
