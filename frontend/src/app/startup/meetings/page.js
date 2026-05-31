"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/startup/Sidebar";
import StartupTopBar from "@/components/startup/StartupTopBar";
import {
  createStartupSession,
  downloadStartupSessionCalendar,
  getStartupSessions,
  getStartupOffers,
  updateStartupSession,
} from "@/lib/startupApi";

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
  if (status === "confirmed" || status === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "pending" || status === "scheduled") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-gray-50 text-gray-600 border-gray-100";
}

function typeStyles(type) {
  const normalized = normalizeSessionType(type);
  if (normalized === "mentor") return "bg-indigo-50 text-indigo-700 border-indigo-100";
  if (normalized === "investor") return "bg-blue-50 text-blue-700 border-blue-100";
  return "bg-gray-50 text-gray-600 border-gray-100";
}

function normalizeSessionType(type) {
  if (type === "mentorship") return "mentor";
  if (type === "investment") return "investor";
  return type;
}

function formatSessionType(type) {
  const normalized = normalizeSessionType(type);
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "Contact";
}

function MeetingsContent() {
  const searchParams = useSearchParams();
  const focusedMeetingId = searchParams.get("meetingId") || "";
  const [offers, setOffers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedOfferId, setSelectedOfferId] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [topic, setTopic] = useState("Catch-up Session");
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
        const [offerData, meetingData] = await Promise.all([
          getStartupOffers(),
          getStartupSessions(),
        ]);
        if (ignore) return;
        
        const loadedOffers = Array.isArray(offerData.offers) ? offerData.offers : [];
        const activeOffers = loadedOffers.filter(o => ["accepted", "approved"].includes(o.status?.toLowerCase()));
        
        const loadedMeetings = Array.isArray(meetingData.sessions) ? meetingData.sessions : [];
        
        setOffers(activeOffers);
        setMeetings(loadedMeetings);
        setSelectedOfferId((current) => current || (
          activeOffers.length > 0 ? `${activeOffers[0].offerType}_${activeOffers[0].id}` : ""
        ));
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
  }, []);

  const selectedOffer = useMemo(() => {
    if (!selectedOfferId) return null;
    const [type, id] = selectedOfferId.split("_");
    return offers.find(o => o.offerType === type && String(o.id) === id) || null;
  }, [selectedOfferId, offers]);

  const upcomingMeetings = useMemo(() => (
    [...meetings].sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
  ), [meetings]);

  async function handleSchedule(event) {
    event.preventDefault();
    if (!selectedOffer || !meetingDate || !meetingTime) {
      setError("Select a contact, date, and time before scheduling.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await createStartupSession({
        type: normalizeSessionType(selectedOffer.offerType),
        request_id: selectedOffer.id,
        scheduled_at: new Date(`${meetingDate}T${meetingTime}`).toISOString(),
        topic,
        meeting_link: meetingLink,
      });
      const meetingData = await getStartupSessions();
      setMeetings(Array.isArray(meetingData.sessions) ? meetingData.sessions : []);
      setMeetingDate("");
      setMeetingTime("");
      setTopic("Catch-up Session");
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
      await updateStartupSession(meetingId, { status });
      const meetingData = await getStartupSessions();
      setMeetings(Array.isArray(meetingData.sessions) ? meetingData.sessions : []);
    } catch (err) {
      setError(err.message || "Failed to update meeting.");
    }
  }

  async function handleCalendar(sessionId) {
    try {
      setError("");
      await downloadStartupSessionCalendar(sessionId);
    } catch (err) {
      setError(err.message || "Failed to download calendar file.");
    }
  }

  return (
    <div className="flex h-screen bg-[#f6f8f9] font-sans text-gray-900 overflow-hidden">
      <Sidebar />

      <div className="flex-grow flex flex-col overflow-y-auto">
        <StartupTopBar searchPlaceholder="Search meetings..." />

        <main className="w-full max-w-[1200px] mx-auto px-4 sm:px-8 py-8 pb-24">
          <div className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#0f3d32]">Startup · Meetings</p>
              <h1 className="mt-2 text-3xl font-black text-gray-900 tracking-tight">Session Schedule</h1>
              <p className="mt-1.5 text-sm text-gray-500 max-w-2xl">Manage your upcoming meetings with mentors and investors.</p>
            </div>
            <Link href="/startup/dashboard" className="self-start lg:self-auto rounded-xl border border-gray-200 bg-white shadow-sm px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition">
              Back to Dashboard
            </Link>
          </div>

          {error ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-red-800">{error}</span>
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            <form onSubmit={handleSchedule} className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">Schedule a Meeting</h2>
                <p className="mt-1 text-sm text-gray-500">Book a session with your accepted mentors or investors.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Select Contact</label>
                  <select
                    value={selectedOfferId}
                    onChange={(event) => setSelectedOfferId(event.target.value)}
                    disabled={loading || offers.length === 0}
                    className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:border-[#0f3d32] focus:bg-white focus:ring-2 focus:ring-[#0f3d32]/10 disabled:opacity-60"
                  >
                    <option value="">{loading ? "Loading..." : offers.length === 0 ? "No accepted mentors/investors" : "Select contact"}</option>
                    {offers.map((offer) => {
                       const sessionType = normalizeSessionType(offer.offerType);
                       const name = sessionType === 'mentor' ? `${offer.first_name || ""} ${offer.last_name || ""}`.trim() : offer.company || `${offer.first_name || ""} ${offer.last_name || ""}`.trim();
                       return (
                         <option key={`${offer.offerType}_${offer.id}`} value={`${offer.offerType}_${offer.id}`}>
                           {name} ({formatSessionType(offer.offerType)})
                         </option>
                       );
                    })}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Date</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(event) => setMeetingDate(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:border-[#0f3d32] focus:bg-white focus:ring-2 focus:ring-[#0f3d32]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Time</label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={(event) => setMeetingTime(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:border-[#0f3d32] focus:bg-white focus:ring-2 focus:ring-[#0f3d32]/10"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Topic</label>
                  <input
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:border-[#0f3d32] focus:bg-white focus:ring-2 focus:ring-[#0f3d32]/10"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Meeting Link (Optional)</label>
                  <input
                    value={meetingLink}
                    onChange={(event) => setMeetingLink(event.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:border-[#0f3d32] focus:bg-white focus:ring-2 focus:ring-[#0f3d32]/10"
                  />
                </div>
              </div>

              {selectedOffer ? (
                <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                     <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${typeStyles(selectedOffer.offerType)}`}>
                        {formatSessionType(selectedOffer.offerType)}
                     </span>
                     <p className="text-sm font-bold text-gray-900">
                        {normalizeSessionType(selectedOffer.offerType) === 'mentor' ? `${selectedOffer.first_name || ""} ${selectedOffer.last_name || ""}`.trim() : selectedOffer.company || `${selectedOffer.first_name || ""} ${selectedOffer.last_name || ""}`.trim()}
                     </p>
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading || saving || !selectedOfferId}
                className="mt-6 w-full rounded-xl bg-[#0f3d32] px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0b2f26] disabled:bg-gray-300 disabled:shadow-none"
              >
                {saving ? (
                   <><span className="inline-block w-4 h-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin align-middle" /> Scheduling...</>
                ) : (
                   "Schedule Meeting"
                )}
              </button>
            </form>

            <aside className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sticky top-28 h-fit max-h-[calc(100vh-140px)] flex flex-col">
              <div className="mb-5 flex items-center justify-between shrink-0">
                <h2 className="text-lg font-bold text-gray-900">Upcoming</h2>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">{upcomingMeetings.length}</span>
              </div>

              <div className="space-y-4 overflow-y-auto pr-2 pb-2">
                {upcomingMeetings.length ? upcomingMeetings.map((meeting) => (
                  <div
                    key={meeting.unique_id}
                    className={`rounded-xl border bg-[#f8fafc] p-4 transition-colors ${
                      String(meeting.unique_id) === focusedMeetingId
                        ? "border-emerald-500 ring-2 ring-emerald-200"
                        : "border-gray-100 hover:border-[#0f3d32]/20"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{meeting.actor_name}</p>
                        <p className="mt-1 text-xs text-gray-500">{meeting.topic}</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusStyles(meeting.status)}`}>
                        {meeting.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-md border ${typeStyles(meeting.type)}`}>
                            {meeting.type}
                        </span>
                        <p className="text-xs font-bold text-[#0f3d32]">{formatDateTime(meeting.scheduled_at)}</p>
                    </div>
                    {meeting.meeting_link ? (
                      <a href={meeting.meeting_link} target="_blank" rel="noreferrer" className="inline-flex text-xs font-bold text-[#0f3d32] hover:text-[#0b2f26] mb-3">
                        Open meeting link <span className="ml-1">→</span>
                      </a>
                    ) : null}
                    
                    <button
                      type="button"
                      onClick={() => handleCalendar(meeting.unique_id)}
                      className="mb-3 block text-xs font-bold text-[#0f3d32] hover:text-[#0b2f26]"
                    >
                      Download .ics
                    </button>

                    {meeting.status === "scheduled" || meeting.status === "pending" ? (
                      <div className="pt-3 border-t border-gray-100 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatus(meeting.unique_id, meeting.type === "mentor" ? "completed" : "confirmed")}
                          className="flex-1 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatus(meeting.unique_id, "cancelled")}
                          className="flex-1 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors"
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
        </main>
      </div>
    </div>
  );
}

export default function StartupMeetingsPage() {
  return (
    <Suspense fallback={
       <div className="flex h-screen items-center justify-center bg-[#f6f8f9]">
           <div className="w-10 h-10 border-4 border-[#0f3d32] border-t-transparent rounded-full animate-spin"></div>
       </div>
    }>
      <MeetingsContent />
    </Suspense>
  );
}
