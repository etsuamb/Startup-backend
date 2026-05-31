"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/investor/Sidebar";
import {
  createInvestorMeeting,
  downloadInvestorMeetingCalendar,
  getInvestorFundingOffers,
  getInvestorMeetings,
  getInvestorStartups,
  updateInvestorMeeting,
} from "@/lib/investorApi";

function formatCurrency(value) {
  const amount = Number(value || 0);
  if (!amount) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(value) {
  if (!value) return "Not scheduled";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not scheduled";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusStyles(status) {
  if (status === "confirmed") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "pending") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-gray-50 text-gray-600 border-gray-100";
}

function MeetingsContent() {
  const searchParams = useSearchParams();
  const startupIdFromUrl = searchParams.get("startupId") || "";
  const focusedMeetingId = searchParams.get("meetingId") || "";
  const [startups, setStartups] = useState([]);
  const [offers, setOffers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedStartupId, setSelectedStartupId] = useState(startupIdFromUrl);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [topic, setTopic] = useState("Investment follow-up");
  const [meetingLink, setMeetingLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadMeetingsData() {
      try {
        setLoading(true);
        setError("");
        const [startupData, offerData, meetingData] = await Promise.all([
          getInvestorStartups({ limit: 100 }),
          getInvestorFundingOffers(),
          getInvestorMeetings(),
        ]);
        if (ignore) return;
        const loadedStartups = Array.isArray(startupData.startups) ? startupData.startups : [];
        const loadedOffers = Array.isArray(offerData.funding_offers) ? offerData.funding_offers : [];
        const loadedMeetings = Array.isArray(meetingData.meetings) ? meetingData.meetings : [];
        setStartups(loadedStartups);
        setOffers(loadedOffers);
        setMeetings(loadedMeetings);
        if (!startupIdFromUrl && loadedStartups[0]?.startup_id) {
          setSelectedStartupId(String(loadedStartups[0].startup_id));
        }
      } catch (err) {
        if (!ignore) setError(err.message || "Failed to load meeting data.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadMeetingsData();
    return () => {
      ignore = true;
    };
  }, [startupIdFromUrl]);

  const selectedStartup = useMemo(
    () => startups.find((startup) => String(startup.startup_id) === String(selectedStartupId)),
    [selectedStartupId, startups],
  );

  const relatedOffer = useMemo(() => {
    const candidates = offers.filter((offer) => String(offer.startup_id) === String(selectedStartupId));
    return candidates.find((offer) => ["approved", "accepted"].includes(String(offer.status || "").toLowerCase()))
      || candidates[0]
      || null;
  }, [offers, selectedStartupId]);

  const upcomingMeetings = useMemo(() => (
    [...meetings].sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
  ), [meetings]);

  async function handleSchedule(event) {
    event.preventDefault();
    if (!selectedStartup || !meetingDate || !meetingTime) {
      setError("Select a startup, date, and time before scheduling.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await createInvestorMeeting({
        startup_id: selectedStartup.startup_id,
        scheduled_at: new Date(`${meetingDate}T${meetingTime}`).toISOString(),
        topic,
        meeting_link: meetingLink,
        duration_minutes: 30,
      });
      const meetingData = await getInvestorMeetings();
      setMeetings(Array.isArray(meetingData.meetings) ? meetingData.meetings : []);
      setMeetingDate("");
      setMeetingTime("");
      setTopic("Investment follow-up");
      setMeetingLink("");
    } catch (err) {
      setError(err.message || "Failed to schedule meeting.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(meetingId, status) {
    try {
      setError("");
      const data = await updateInvestorMeeting(meetingId, { status });
      setMeetings((current) => current.map((meeting) => (
        meeting.investor_meeting_id === meetingId ? { ...meeting, ...data.meeting } : meeting
      )));
    } catch (err) {
      setError(err.message || "Failed to update meeting.");
    }
  }

  async function handleCalendar(meetingId) {
    try {
      setError("");
      await downloadInvestorMeetingCalendar(meetingId);
    } catch (err) {
      setError(err.message || "Failed to download calendar file.");
    }
  }

  return (
    <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden">
      <Sidebar />

      <div className="flex-grow flex flex-col overflow-hidden bg-white">
        <main className="flex-grow overflow-y-auto bg-white">
          <div className="px-6 lg:px-10 pt-24 pb-10 max-w-[1200px] mx-auto">
            <div className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Investor Meetings</h1>
                <p className="mt-2 text-sm text-gray-500">Schedule startup calls after an offer or active investment discussion.</p>
              </div>
              <Link href="/investor/messages" className="self-start lg:self-auto rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition">
                Back to Messages
              </Link>
            </div>

            {error ? (
              <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
              <form onSubmit={handleSchedule} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Schedule a Meeting</h2>
                  <p className="mt-1 text-sm text-gray-500">Create a meeting entry and share the link through chat.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Startup</label>
                    <select
                      value={selectedStartupId}
                      onChange={(event) => setSelectedStartupId(event.target.value)}
                      disabled={loading}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#0a4d3c]/50 focus:ring-4 focus:ring-[#0a4d3c]/10"
                    >
                      <option value="">{loading ? "Loading startups..." : "Select startup"}</option>
                      {startups.map((startup) => (
                        <option key={startup.startup_id} value={startup.startup_id}>
                          {startup.startup_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Date</label>
                    <input
                      type="date"
                      value={meetingDate}
                      onChange={(event) => setMeetingDate(event.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#0a4d3c]/50 focus:ring-4 focus:ring-[#0a4d3c]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Time</label>
                    <input
                      type="time"
                      value={meetingTime}
                      onChange={(event) => setMeetingTime(event.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#0a4d3c]/50 focus:ring-4 focus:ring-[#0a4d3c]/10"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Topic</label>
                    <input
                      value={topic}
                      onChange={(event) => setTopic(event.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#0a4d3c]/50 focus:ring-4 focus:ring-[#0a4d3c]/10"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Meeting Link</label>
                    <input
                      value={meetingLink}
                      onChange={(event) => setMeetingLink(event.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#0a4d3c]/50 focus:ring-4 focus:ring-[#0a4d3c]/10"
                    />
                  </div>
                </div>

                {selectedStartup ? (
                  <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{selectedStartup.startup_name}</p>
                        <p className="mt-1 text-xs font-medium text-gray-500">{selectedStartup.industry || "Industry not set"} / {selectedStartup.business_stage || "Stage not set"}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Offer</p>
                        <p className="text-sm font-bold text-[#0a4d3c]">{relatedOffer ? formatCurrency(relatedOffer.requested_amount) : "No offer yet"}</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading || saving || !selectedStartupId}
                  className="mt-6 w-full rounded-xl bg-[#0a3a2e] px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#072a21] disabled:bg-gray-300 disabled:shadow-none"
                >
                  {saving ? "Scheduling..." : "Schedule Meeting"}
                </button>
              </form>

              <aside className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Upcoming</h2>
                  <span className="rounded-full bg-[#e8fbf0] px-3 py-1 text-xs font-bold text-[#0a4d3c]">{upcomingMeetings.length}</span>
                </div>

                <div className="space-y-4">
                  {upcomingMeetings.length ? upcomingMeetings.map((meeting) => (
                    <div
                      key={meeting.investor_meeting_id}
                      className={`rounded-xl border bg-gray-50 p-4 ${
                        String(meeting.investor_meeting_id) === focusedMeetingId
                          ? "border-emerald-500 ring-2 ring-emerald-200"
                          : "border-gray-100"
                      }`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{meeting.startup_name}</p>
                          <p className="mt-1 text-xs text-gray-500">{meeting.topic}</p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${statusStyles(meeting.status)}`}>
                          {meeting.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#0a4d3c]">{formatDateTime(meeting.scheduled_at)}</p>
                      {meeting.meeting_link ? (
                        <a href={meeting.meeting_link} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-bold text-gray-700 hover:text-[#0a4d3c]">
                          Open meeting link
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleCalendar(meeting.investor_meeting_id)}
                        className="mt-3 block text-xs font-bold text-[#0a4d3c] hover:text-[#072a21]"
                      >
                        Download .ics
                      </button>
                      {meeting.status !== "cancelled" ? (
                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleStatus(meeting.investor_meeting_id, "confirmed")}
                            className="rounded-lg border border-emerald-100 bg-white px-3 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatus(meeting.investor_meeting_id, "cancelled")}
                            className="rounded-lg border border-red-100 bg-white px-3 py-1.5 text-[11px] font-bold text-red-700 hover:bg-red-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )) : (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                      No meetings scheduled yet.
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function InvestorMeetingsPage() {
  return (
    <Suspense fallback={<p className="p-8 text-gray-500">Loading...</p>}>
      <MeetingsContent />
    </Suspense>
  );
}
