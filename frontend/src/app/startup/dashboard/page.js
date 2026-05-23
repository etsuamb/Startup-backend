"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AiMentorWidget from "@/components/startup/AiMentorWidget";
import NotificationBell from "@/components/NotificationBell";
import Sidebar from "@/components/startup/Sidebar";
import { getDocuments, getMyProjects, getStartupProfile, getDashboardActivities, getDashboardFeedback, getDashboardEvents } from "@/lib/startupApi";

export default function StartupDashboard() {
  const [startup, setStartup] = useState(null);
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, projectsRes, documentsRes, activitiesRes, feedbackRes, eventsRes] = await Promise.all([
          getStartupProfile(),
          getMyProjects(),
          getDocuments(),
          getDashboardActivities(),
          getDashboardFeedback(),
          getDashboardEvents(),
        ]);
        setStartup(profileRes.startup ?? null);
        setProjects(projectsRes.projects ?? []);
        setDocuments(documentsRes.documents ?? []);
        setActivities(activitiesRes.activity ?? []);
        setFeedback(feedbackRes.feedback?.[0] ?? null);
        setEvents(eventsRes.events ?? []);
      } catch (err) {
        setError(err.message ?? "Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const projectCount = projects.length;
  const totalFundingNeeded = useMemo(() => Number(startup?.funding_needed ?? 0), [startup]);
  const amountRaised = useMemo(
    () => projects.reduce((sum, project) => sum + Number(project.amount_raised ?? 0), 0),
    [projects],
  );
  const progressPercent = useMemo(() => {
    if (!totalFundingNeeded) return 0;
    return Math.min(100, Math.round((amountRaised / totalFundingNeeded) * 100));
  }, [amountRaised, totalFundingNeeded]);
  const uploadedDocs = documents.length;
  const missingDocs = Math.max(0, 4 - uploadedDocs);
  const mentorName = feedback?.from_name ?? "Mentor";
  const mentorTitle = feedback?.source ?? "Feedback";
  const mentorInitials = mentorName
    .split(" ")
    .map((item) => item[0])
    .join("");
  const activity1Title = activities[0]?.headline ?? "No recent activity";
  const activity1Detail = activities[0]?.detail ?? "";
  const activity2Title = activities[1]?.headline ?? "";
  const activity2Detail = activities[1]?.detail ?? "";
  const activity3Title = activities[2]?.headline ?? "";
  const activity3Detail = activities[2]?.detail ?? "";
  const upcomingEvent = events[0] ?? null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center px-6 py-10 bg-white rounded-3xl shadow-sm border border-gray-100">
            <p className="text-sm font-bold text-gray-700">Loading your startup dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto">
        <header className="flex justify-between items-center px-8 py-5 bg-transparent w-full">
          <div className="relative w-64 max-w-md hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input type="text" placeholder="Search resources..." className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-full text-xs outline-none focus:ring-2 focus:ring-[#0f3d32]/20 shadow-sm transition" />
          </div>
          <div className="flex items-center gap-6 ml-auto">
            <NotificationBell />
            <Link href="/startup/settings" className="flex items-center gap-3 hover:opacity-80 transition">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-gray-900">{startup?.startup_name ?? "My Startup"}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-gray-200">
                <div className="w-full h-full bg-[#115b4c] text-white flex items-center justify-center font-bold text-[10px]">
                  {startup?.startup_name?.split(" ").map((item) => item[0]).slice(0, 2).join("") ?? "ST"}
                </div>
              </div>
            </Link>
          </div>
        </header>
        <div className="px-4 sm:px-8 pb-12 w-full max-w-[1200px] mx-auto">
          <div className="mb-8 mt-2">
            <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">Welcome back, {startup?.startup_name ?? "founder"}.</h1>
            <p className="text-xs text-gray-500 font-medium">Your venture is performing well. You have {missingDocs > 0 ? `${missingDocs} missing documents` : "no pending document tasks"}.</p>
          </div>
          {error && (
            <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900 text-sm">Startup Status</h3>
                <span className="bg-[#eaf4f1] text-[#0f3d32] text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">Updated today</span>
              </div>
              <div className="flex items-center justify-between mt-auto mb-2 relative">
                <div className="absolute top-1/2 left-[10%] right-[10%] h-[1px] bg-gray-100 -z-10 -translate-y-1/2 hidden sm:block"></div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-300">Profile</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-300">Growth</span>
                </div>
                <div className="flex flex-col items-center gap-2 relative">
                  <div className="w-14 h-14 rounded-xl bg-[#eaf4f1] border-2 border-[#0f3d32] flex flex-col items-center justify-center text-[#0f3d32] shadow-sm transform -translate-y-2">
                    <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <div className="w-4 h-4 bg-[#0f3d32] rounded-full absolute -bottom-2 text-white flex items-center justify-center">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#0f3d32]">{startup?.business_stage ?? "Active"}</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-300">Funded</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-300">Mentored</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Project Progress</h3>
              <div className="relative w-24 h-24 mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-gray-100" strokeDasharray="3, 3" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                  <path className="text-[#0f3d32]" strokeDasharray={`${progressPercent}, 100`} strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-[#0f3d32]">{progressPercent}%</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 font-medium mb-2">Funding progress for active projects.</p>
              <Link href="/startup/project" className="text-[10px] font-bold text-[#0f3d32] hover:underline flex items-center gap-1">
                View Projects
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </Link>
            </div>
            <div className="md:col-span-2 bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <h3 className="font-bold text-gray-900 text-sm mb-6">Funding Summary</h3>
              <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Required Funding</span>
                  <span className="text-xl font-bold text-gray-900">${totalFundingNeeded.toLocaleString()}</span>
                </div>
                <div className="w-full bg-[#f0f2f5] rounded-full h-1.5 flex overflow-hidden">
                  <div className="bg-[#0f3d32] h-full" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>
              <div className="flex gap-12">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase
                    tracking-widest mb-1">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                    Raised so far
                  </div>
                  <p className="text-lg font-bold text-gray-600">${amountRaised.toLocaleString()}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    <div className="w-1.5 h-1.5 bg-[#0f3d32] rounded-full"></div>
                    Active Projects
                  </div>
                  <p className="text-lg font-bold text-[#0f3d32]">{projectCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 flex flex-col gap-3">
              <h3 className="font-bold text-gray-900 text-sm mb-2">Documents Status</h3>
              <div className="bg-[#f2fbf7] border border-[#dcfce7] rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#dcfce7] text-[#0f3d32] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0f3d32]">{uploadedDocs} Uploaded</h4>
                    <p className="text-[9px] text-[#0f3d32]/60 uppercase tracking-widest font-bold">Verified Documents</p>
                  </div>
                </div>
                <div className="text-[#0f3d32]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                </div>
              </div>
              <div className="bg-[#fff5f5] border border-[#fed7d7] rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#fee2e2] text-red-600 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-red-600">{missingDocs} Missing</h4>
                    <p className="text-[9px] text-red-400 uppercase tracking-widest font-bold">Action Required</p>
                  </div>
                </div>
                <Link href="/startup/project/documents" className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-md transition">
                  Fix Now
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute -top-4 -right-2 text-[#f3f4f6] text-[100px] leading-none font-serif select-none pointer-events-none">&quot;</div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 relative z-10">Latest Feedback</h3>
              <p className="text-sm text-gray-800 font-medium italic mb-6 leading-relaxed relative z-10">{feedback?.body ?? "No feedback yet. Keep working on your startup!"}</p>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-8 h-8 rounded-full bg-[#1e293b] text-white flex items-center justify-center font-bold text-xs shrink-0">{mentorInitials}</div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{mentorName}</h4>
                  <p className="text-[10px] text-gray-500">{mentorTitle}</p>
                </div>
              </div>
            </div>
            <div className="bg-[#0f3d32] rounded-[20px] p-6 shadow-md text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#134d40] rounded-full blur-2xl"></div>
              <div className="relative z-10 flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-[#165042] rounded-xl flex items-center justify-center text-[#dcfce7]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>
                <span className="bg-[#165042] text-[#bdf0db] text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">Tomorrow</span>
              </div>
              <div className="relative z-10 mb-4">
                <h3 className="font-bold text-white text-sm mb-1.5 leading-tight">{upcomingEvent?.subject ?? upcomingEvent?.agenda ?? "No upcoming events"}</h3>
                <p className="text-[11px] text-[#8ba39e] leading-snug">{upcomingEvent?.mentor_name ? `with ${upcomingEvent.mentor_name}` : ""}</p>
              </div>
              <div className="relative z-10 flex justify-between items-center mt-auto">
                {upcomingEvent?.scheduled_at && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <svg className="w-4 h-4 text-[#bdf0db]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {new Date(upcomingEvent.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                )}
                {upcomingEvent?.join_link && (
                  <a href={upcomingEvent.join_link} target="_blank" rel="noopener noreferrer" className="bg-white hover:bg-gray-50 text-[#0f3d32] text-[11px] font-bold px-4 py-2 rounded-lg transition shadow-sm">Join Room</a>
                )}
              </div>
            </div>
            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 flex flex-col">
              <h3 className="font-bold text-gray-900 text-sm mb-5">Recent Activity</h3>
              <div className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center mt-0.5">
                    <div className="w-5 h-5 rounded-full border border-[#dcfce7] bg-[#f0fdf4] text-[#136150] flex items-center justify-center shrink-0"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg></div>
                    <div className="w-[1px] h-4 bg-gray-100 mt-1"></div>
                  </div>
                  <div className="pb-1">
                    <h4 className="text-[11px] font-bold text-gray-900">{activity1Title}</h4>
                    <p className="text-[9px] text-gray-400">{activity1Detail}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center mt-0.5">
                    <div className="w-5 h-5 rounded-full border border-gray-200 bg-white text-gray-400 flex items-center justify-center shrink-0"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg></div>
                    <div className="w-[1px] h-4 bg-gray-100 mt-1"></div>
                  </div>
                  <div className="pb-1">
                    <h4 className="text-[11px] font-bold text-gray-900">{activity2Title}</h4>
                    <p className="text-[9px] text-gray-400">{activity2Detail}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center mt-0.5">
                    <div className="w-5 h-5 rounded-full border border-gray-200 bg-white text-gray-400 flex items-center justify-center shrink-0"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg></div>
                  </div>
                  <div className="pb-1">
                    <h4 className="text-[11px] font-bold text-gray-900">{activity3Title}</h4>
                    <p className="text-[9px] text-gray-400">{activity3Detail}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full mt-12 mb-6">
            <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center mb-6">Quick Actions</h3>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
              <Link href="/startup/project/create" className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-600 group-hover:border-[#0f3d32] group-hover:text-[#0f3d32] group-hover:shadow-md transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4"></path></svg>
                </div>
                <span className="text-[9px] font-bold text-gray-600">Create Project</span>
              </Link>
              <Link href="/startup/project/documents" className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-600 group-hover:border-[#0f3d32] group-hover:text-[#0f3d32] group-hover:shadow-md transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                </div>
                <span className="text-[9px] font-bold text-gray-600">Upload Docs</span>
              </Link>
              <Link href="/startup/discover" className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-600 group-hover:border-[#0f3d32] group-hover:text-[#0f3d32] group-hover:shadow-md transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <span className="text-[9px] font-bold text-gray-600">Find Investors</span>
              </Link>
              <Link href="/startup/mentorship" className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-600 group-hover:border-[#0f3d32] group-hover:text-[#0f3d32] group-hover:shadow-md transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                </div>
                <span className="text-[9px] font-bold text-gray-600">Request Mentor</span>
              </Link>
              <Link href="/startup/chat" className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-600 group-hover:border-[#0f3d32] group-hover:text-[#0f3d32] group-hover:shadow-md transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                </div>
                <span className="text-[9px] font-bold text-gray-600">Update Progress</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <AiMentorWidget />
    </div>
  );
}
