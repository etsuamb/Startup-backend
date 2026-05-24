"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import NotificationBell from "@/components/NotificationBell";
import {
	fetchIncomingRequests,
	fetchMentorDashboard,
	fetchMentorSessions,
	scheduleSession,
	updateSession,
} from "@/lib/mentorApi";

const TODAY_INPUT = new Date().toISOString().slice(0, 10);

function Icon({ path, className = "h-4 w-4" }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={path} />
		</svg>
	);
}

function initials(name) {
	return String(name || "M")
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();
}

function formatDate(value) {
	if (!value) return "No date";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "No date";
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTimeRange(session) {
	const start = new Date(session.scheduled_at);
	if (Number.isNaN(start.getTime())) return "Time not set";
	const end = new Date(start.getTime() + Number(session.duration_minutes || 60) * 60000);
	const options = { hour: "2-digit", minute: "2-digit" };
	return `${start.toLocaleTimeString("en-US", options)} - ${end.toLocaleTimeString("en-US", options)}`;
}

function statusClass(status) {
	const value = String(status || "scheduled").toLowerCase();
	if (value === "completed") return "bg-gray-200 text-gray-700";
	if (value === "cancelled" || value === "no_show") return "bg-red-100 text-red-700";
	if (value === "pending") return "bg-amber-100 text-amber-800";
	return "bg-emerald-100 text-emerald-700";
}

function requestStartupId(request) {
	return request?.startup_id || request?.startupId || request?.startup?.startup_id;
}

function selectedRequestCopy(request) {
	if (!request) {
		return {
			startup: "Select a startup",
			industry: "-",
			stage: "-",
			goal: "Choose an accepted mentorship request to schedule a session.",
		};
	}

	return {
		startup: request.startup_name || "Startup",
		industry: request.industry || "General",
		stage: request.business_stage || request.stage || "Accepted",
		goal: request.subject || request.focus_area || "Mentorship session",
	};
}

function MentorSessionsContent() {
	const searchParams = useSearchParams();
	const startupIdFromUrl = searchParams.get("startupId");

	const [profile, setProfile] = useState(null);
	const [sessions, setSessions] = useState([]);
	const [requests, setRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [form, setForm] = useState({
		mentorship_request_id: "",
		title: "",
		session_type: "Video Call",
		date: "",
		start_time: "",
		end_time: "",
		meeting_link: "",
		agenda: "",
	});

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const [sessionData, requestData, dashboardData] = await Promise.all([
				fetchMentorSessions(),
				fetchIncomingRequests(),
				fetchMentorDashboard().catch(() => null),
			]);
			const loadedSessions = Array.isArray(sessionData) ? sessionData : sessionData.sessions || [];
			const loadedRequests = Array.isArray(requestData) ? requestData : requestData.requests || [];
			setSessions(loadedSessions);
			setRequests(loadedRequests);
			setProfile(dashboardData?.profile || null);
		} catch (ex) {
			setError(ex.message || "Failed to load sessions.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		// The page needs to hydrate from backend state when it opens.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		load();
	}, [load]);

	const acceptedRequests = useMemo(() => {
		return requests.filter((request) => String(request.status || "").toLowerCase() === "accepted");
	}, [requests]);

	useEffect(() => {
		if (!acceptedRequests.length || form.mentorship_request_id) return;
		const fromUrl = startupIdFromUrl
			? acceptedRequests.find((request) => String(requestStartupId(request)) === String(startupIdFromUrl))
			: null;
		const selected = fromUrl || acceptedRequests[0];
		// Auto-select the first accepted startup so mentors can schedule without typing IDs.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setForm((current) => ({
			...current,
			mentorship_request_id: String(selected.mentorship_request_id),
			title: current.title || selected.subject || "",
			agenda: current.agenda || selected.message || "",
		}));
	}, [acceptedRequests, form.mentorship_request_id, startupIdFromUrl]);

	const selectedRequest = useMemo(() => {
		return acceptedRequests.find((request) => String(request.mentorship_request_id) === String(form.mentorship_request_id)) || null;
	}, [acceptedRequests, form.mentorship_request_id]);

	const selectedCopy = selectedRequestCopy(selectedRequest);

	const upcomingSessions = useMemo(() => {
		return sessions
			.filter((session) => {
				const when = new Date(session.scheduled_at).getTime();
				return !Number.isNaN(when) && String(session.status || "scheduled").toLowerCase() !== "cancelled";
			})
			.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
			.slice(0, 5);
	}, [sessions]);

	const summaryDateTime = useMemo(() => {
		if (!form.date || !form.start_time) return "Date and time not set";
		const date = new Date(`${form.date}T${form.start_time}`);
		if (Number.isNaN(date.getTime())) return "Date and time not set";
		return `${formatDate(date)} | ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} (GMT+3)`;
	}, [form.date, form.start_time]);

	function updateField(key, value) {
		setForm((current) => ({ ...current, [key]: value }));
	}

	function durationMinutes() {
		if (!form.start_time || !form.end_time) return 60;
		const [startHour, startMinute] = form.start_time.split(":").map(Number);
		const [endHour, endMinute] = form.end_time.split(":").map(Number);
		const start = startHour * 60 + startMinute;
		const end = endHour * 60 + endMinute;
		return Math.max(15, end - start || 60);
	}

	async function onSchedule(event) {
		event.preventDefault();
		setError("");
		setSuccess("");

		if (!form.mentorship_request_id) {
			setError("Select an accepted startup mentorship request first.");
			return;
		}
		if (!form.date || !form.start_time) {
			setError("Select a date and start time.");
			return;
		}

		setSubmitting(true);
		try {
			const scheduledAt = new Date(`${form.date}T${form.start_time}`);
			await scheduleSession({
				mentorship_request_id: Number(form.mentorship_request_id),
				scheduled_at: scheduledAt.toISOString(),
				duration_minutes: durationMinutes(),
				meeting_link: form.meeting_link || undefined,
				notes: [
					form.title ? `Title: ${form.title}` : null,
					form.session_type ? `Type: ${form.session_type}` : null,
					form.agenda ? `Agenda: ${form.agenda}` : null,
				].filter(Boolean).join("\n"),
			});
			setSuccess("Mentorship session scheduled successfully.");
			setForm((current) => ({
				...current,
				title: "",
				date: "",
				start_time: "",
				end_time: "",
				meeting_link: "",
				agenda: "",
			}));
			await load();
		} catch (ex) {
			setError(ex.message || "Schedule failed.");
		} finally {
			setSubmitting(false);
		}
	}

	async function markComplete(sessionId) {
		setError("");
		try {
			await updateSession(sessionId, { status: "completed" });
			await load();
		} catch (ex) {
			setError(ex.message || "Update failed.");
		}
	}

	const mentorName = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Mentor" : "Mentor";
	const mentorTitle = profile?.headline || profile?.professional_title || "Lead Mentor";

	return (
		<div className="min-h-full bg-[#fbfcfc] text-[#061f1a]">
			<header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-gray-100 bg-white px-5 sm:px-8">
				<div className="relative w-full max-w-[460px]">
					<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
						<Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
					</div>
					<input
						type="search"
						placeholder="Search startups, sessions..."
						className="h-10 w-full rounded-lg border border-transparent bg-[#f2f4f5] pl-11 pr-4 text-xs font-medium text-gray-700 outline-none transition focus:border-[#0b4a3c]/20 focus:bg-white focus:ring-2 focus:ring-[#0b4a3c]/10"
					/>
				</div>
				<div className="flex items-center gap-4">
					<NotificationBell />
					<button type="button" className="hidden h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-50 hover:text-gray-700 sm:flex" aria-label="Settings">
						<Icon path="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.33.787.713 1.002.382.215.837.244 1.242.1l.85-.304a1.125 1.125 0 011.37.49l.546.947c.275.477.196 1.079-.197 1.464l-.646.635a1.125 1.125 0 000 1.604l.646.635c.393.385.472.987.197 1.464l-.546.947a1.125 1.125 0 01-1.37.49l-.85-.304a1.125 1.125 0 00-1.242.1 1.125 1.125 0 00-.713 1.002l-.149.894c-.09.542-.56.94-1.11.94h-1.093c-.55 0-1.02-.398-1.11-.94l-.149-.894a1.125 1.125 0 00-.713-1.002 1.125 1.125 0 00-1.242-.1l-.85.304a1.125 1.125 0 01-1.37-.49l-.546-.947a1.125 1.125 0 01.197-1.464l.646-.635a1.125 1.125 0 000-1.604l-.646-.635a1.125 1.125 0 01-.197-1.464l.546-.947a1.125 1.125 0 011.37-.49l.85.304c.405.145.86.115 1.242-.1.383-.215.643-.578.713-1.002l.149-.894zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</button>
					<div className="hidden border-l border-gray-200 pl-5 text-right sm:block">
						<p className="text-xs font-black text-gray-950">{mentorName}</p>
						<p className="text-[10px] font-black text-gray-500">{mentorTitle}</p>
					</div>
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b4a3c] text-xs font-black text-white">
						{initials(mentorName)}
					</div>
				</div>
			</header>

			<main className="mx-auto grid w-full max-w-[1120px] grid-cols-1 gap-7 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_326px] lg:px-8">
				<section className="min-w-0">
					<div className="mb-7">
						<h1 className="text-3xl font-black tracking-tight text-[#052b23]">Schedule Mentorship Session</h1>
						<p className="mt-3 text-sm text-gray-500">Set a date and time for an upcoming mentorship session with a startup.</p>
					</div>

					{error ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">{error}</div> : null}
					{success ? <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-[#0b4a3c]">{success}</div> : null}

					<form onSubmit={onSchedule} className="space-y-6">
						<section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
							<h2 className="mb-5 flex items-center gap-3 text-base font-black text-gray-950">
								<Icon path="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" className="h-5 w-5" />
								Select Startup
							</h2>
							<select
								value={form.mentorship_request_id}
								onChange={(event) => {
									const request = acceptedRequests.find((item) => String(item.mentorship_request_id) === event.target.value);
									setForm((current) => ({
										...current,
										mentorship_request_id: event.target.value,
										title: request?.subject || current.title,
										agenda: request?.message || current.agenda,
									}));
								}}
								disabled={loading || acceptedRequests.length === 0}
								className="mb-5 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 outline-none transition focus:border-[#0b4a3c]/30 focus:ring-2 focus:ring-[#0b4a3c]/10 disabled:bg-gray-100"
							>
								<option value="">{loading ? "Loading startups..." : "Select accepted startup"}</option>
								{acceptedRequests.map((request) => (
									<option key={request.mentorship_request_id} value={request.mentorship_request_id}>
										{request.startup_name || "Startup"} - {request.subject || "Mentorship"}
									</option>
								))}
							</select>
							<div className="rounded-xl bg-[#f3f5f4] p-5">
								<div className="grid grid-cols-1 gap-5 text-sm sm:grid-cols-3">
									<div>
										<p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Startup Name</p>
										<p className="font-black text-gray-950">{selectedCopy.startup}</p>
									</div>
									<div>
										<p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Industry</p>
										<p className="font-black text-gray-950">{selectedCopy.industry}</p>
									</div>
									<div>
										<p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Stage</p>
										<p className="font-black text-gray-950">{selectedCopy.stage}</p>
									</div>
								</div>
								<div className="mt-5">
									<p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Primary Goal</p>
									<p className="font-black text-gray-950">{selectedCopy.goal}</p>
								</div>
							</div>
						</section>

						<section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
							<h2 className="mb-6 flex items-center gap-3 text-base font-black text-gray-950">
								<Icon path="M6.75 3v2.25M17.25 3v2.25M3 8.25h18M5.25 5.25h13.5A2.25 2.25 0 0121 7.5v10.25A2.25 2.25 0 0118.75 20H5.25A2.25 2.25 0 013 17.75V7.5a2.25 2.25 0 012.25-2.25z" className="h-5 w-5" />
								Session Details
							</h2>
							<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
								<label>
									<span className="mb-2 block text-xs font-medium text-gray-700">Session Title</span>
									<input
										value={form.title}
										onChange={(event) => updateField("title", event.target.value)}
										placeholder="e.g., Supply Chain Strategy Review"
										className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-[#0b4a3c]/30 focus:ring-2 focus:ring-[#0b4a3c]/10"
									/>
								</label>
								<label>
									<span className="mb-2 block text-xs font-medium text-gray-700">Session Type</span>
									<select
										value={form.session_type}
										onChange={(event) => updateField("session_type", event.target.value)}
										className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-[#0b4a3c]/30 focus:ring-2 focus:ring-[#0b4a3c]/10"
									>
										<option>Video Call</option>
										<option>Phone Call</option>
										<option>In-person</option>
										<option>Workshop</option>
									</select>
								</label>
							</div>
							<div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
								<label>
									<span className="mb-2 block text-xs font-medium text-gray-700">Date</span>
									<input
										type="date"
										value={form.date}
										onChange={(event) => updateField("date", event.target.value)}
										min={TODAY_INPUT}
										className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-[#0b4a3c]/30 focus:ring-2 focus:ring-[#0b4a3c]/10"
									/>
								</label>
								<label>
									<span className="mb-2 block text-xs font-medium text-gray-700">Start Time</span>
									<input
										type="time"
										value={form.start_time}
										onChange={(event) => updateField("start_time", event.target.value)}
										className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-[#0b4a3c]/30 focus:ring-2 focus:ring-[#0b4a3c]/10"
									/>
								</label>
								<label>
									<span className="mb-2 block text-xs font-medium text-gray-700">End Time</span>
									<input
										type="time"
										value={form.end_time}
										onChange={(event) => updateField("end_time", event.target.value)}
										className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-[#0b4a3c]/30 focus:ring-2 focus:ring-[#0b4a3c]/10"
									/>
								</label>
							</div>
							<div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
								<label>
									<span className="mb-2 block text-xs font-medium text-gray-700">Time Zone</span>
									<input
										value="Addis Ababa (GMT+3)"
										readOnly
										className="h-12 w-full rounded-xl border border-transparent bg-[#f2f4f3] px-4 text-sm font-medium text-gray-700"
									/>
								</label>
								<label>
									<span className="mb-2 block text-xs font-medium text-gray-700">Meeting Link</span>
									<input
										type="url"
										value={form.meeting_link}
										onChange={(event) => updateField("meeting_link", event.target.value)}
										placeholder="https://zoom.us/j/..."
										className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-[#0b4a3c]/30 focus:ring-2 focus:ring-[#0b4a3c]/10"
									/>
								</label>
							</div>
							<label className="mt-5 block">
								<span className="mb-2 block text-xs font-medium text-gray-700">Session Agenda</span>
								<textarea
									value={form.agenda}
									onChange={(event) => updateField("agenda", event.target.value)}
									placeholder="List the topics to be discussed..."
									rows={5}
									className="w-full resize-none rounded-xl border border-[#0b4a3c] bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[#0b4a3c]/10"
								/>
							</label>
						</section>

						<section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
							<div className="mb-5 flex items-center justify-between">
								<h2 className="flex items-center gap-2 text-base font-black text-gray-950">
									<Icon path="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									Your Weekly Availability
								</h2>
								<Link href="/mentor/settings" className="flex items-center gap-2 text-xs font-black text-[#0b4a3c]">
									<Icon path="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
									Modify
								</Link>
							</div>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_132px]">
								<div className="rounded-xl bg-[#f2f4f3] p-4">
									<p className="text-xs font-black text-gray-950">Monday</p>
									<p className="mt-2 text-xs font-medium text-gray-600">10:00 AM - 12:00 PM</p>
								</div>
								<div className="rounded-xl bg-[#f2f4f3] p-4">
									<p className="text-xs font-black text-gray-950">Wednesday</p>
									<p className="mt-2 text-xs font-medium text-gray-600">02:00 PM - 04:00 PM</p>
								</div>
								<button type="button" className="h-full min-h-[56px] rounded-xl bg-[#0b4a3c] text-xs font-black text-white">
									Check Availability
								</button>
							</div>
						</section>

						<section className="rounded-2xl border border-gray-200 bg-[#f3f6f8] p-6 shadow-sm">
							<p className="mb-5 text-[10px] font-black uppercase tracking-[0.18em] text-gray-700">Summary Preview</p>
							<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
								<SummaryItem icon="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" label="Startup" value={selectedCopy.startup} />
								<SummaryItem icon="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" label="Date & Time" value={summaryDateTime} />
								<SummaryItem icon="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" label="Type" value={form.session_type} />
								<SummaryItem icon="M9 12.75L11.25 15 15 9.75m-6.75-6h7.5A2.25 2.25 0 0118 6v12a2.25 2.25 0 01-2.25 2.25h-7.5A2.25 2.25 0 016 18V6a2.25 2.25 0 012.25-2.25z" label="Agenda Preview" value={form.agenda || "No agenda added yet."} />
							</div>
						</section>

						<div className="flex flex-wrap items-center gap-3">
							<button type="submit" disabled={submitting || acceptedRequests.length === 0} className="h-11 rounded-xl bg-[#0b4a3c] px-6 text-sm font-black text-white transition hover:bg-[#07382d] disabled:cursor-not-allowed disabled:bg-gray-300">
								{submitting ? "Scheduling..." : "Schedule Session"}
							</button>
							<button type="button" onClick={() => setSuccess("Draft saved locally for this session.")} className="h-11 rounded-xl border border-gray-200 bg-white px-6 text-sm font-black text-gray-700 transition hover:bg-gray-50">
								Save as Draft
							</button>
							<button type="button" onClick={() => setForm((current) => ({ ...current, title: "", date: "", start_time: "", end_time: "", meeting_link: "", agenda: "" }))} className="h-11 px-4 text-sm font-black text-gray-500 transition hover:text-gray-900">
								Cancel
							</button>
						</div>
					</form>
				</section>

				<aside className="space-y-7 lg:pt-[87px]">
					<section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
						<div className="mb-5 flex items-center justify-between">
							<h2 className="text-base font-black text-gray-950">Upcoming Sessions</h2>
							<Link href="/mentor/dashboard" className="text-xs font-black text-[#0b4a3c]">View All</Link>
						</div>
						<div className="space-y-4">
							{loading ? (
								<p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Loading sessions...</p>
							) : upcomingSessions.length ? upcomingSessions.map((session) => (
								<div key={session.mentorship_session_id} className="rounded-xl bg-[#f3f5f6] p-4">
									<div className="mb-3 flex items-start justify-between gap-3">
										<p className="font-black text-gray-950">{session.startup_name || "Startup"}</p>
										<span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${statusClass(session.status)}`}>
											{session.status || "scheduled"}
										</span>
									</div>
									<p className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
										<Icon path="M6.75 3v2.25M17.25 3v2.25M3 8.25h18M5.25 5.25h13.5A2.25 2.25 0 0121 7.5v10.25A2.25 2.25 0 0118.75 20H5.25A2.25 2.25 0 013 17.75V7.5a2.25 2.25 0 012.25-2.25z" />
										{formatDate(session.scheduled_at)}
									</p>
									<p className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-500">
										<Icon path="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
										{formatTimeRange(session)}
									</p>
									{String(session.status || "").toLowerCase() === "scheduled" ? (
										<button type="button" onClick={() => markComplete(session.mentorship_session_id)} className="text-xs font-black text-[#0b4a3c]">
											Mark completed
										</button>
									) : null}
								</div>
							)) : (
								<p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">No upcoming sessions.</p>
							)}
						</div>
					</section>

					<section className="rounded-2xl bg-[#063529] p-6 text-white shadow-sm">
						<p className="text-base font-black">Mentor Toolkit</p>
						<p className="mt-2 text-xs font-medium leading-5 text-white/75">Download new resources for startup scaling.</p>
					</section>
				</aside>
			</main>
		</div>
	);
}

function SummaryItem({ icon, label, value }) {
	return (
		<div className="flex min-w-0 items-center gap-3">
			<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#0b4a3c] ring-1 ring-gray-200">
				<Icon path={icon} />
			</div>
			<div className="min-w-0">
				<p className="text-[10px] font-black text-gray-500">{label}</p>
				<p className="truncate text-xs font-black text-gray-950">{value}</p>
			</div>
		</div>
	);
}

export default function MentorSessionsPage() {
	return (
		<Suspense fallback={<p className="p-8 text-gray-500">Loading...</p>}>
			<MentorSessionsContent />
		</Suspense>
	);
}
