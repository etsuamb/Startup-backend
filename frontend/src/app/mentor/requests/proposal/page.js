"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import NotificationBell from "@/components/NotificationBell";
import { fetchIncomingRequests, fetchStartupDetails, sendProposal } from "@/lib/mentorApi";

const focusAreas = [
	"Market Entry Strategy",
	"Scale-up Strategy",
	"Revenue Operations",
	"Regulatory Compliance",
	"Product Strategy",
	"Fundraising Readiness",
];

const durations = ["1 Month", "3 Months", "6 Months", "12 Months"];
const frequencies = ["Weekly", "Bi-weekly", "Monthly"];

function initials(name) {
	return String(name || "SC")
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();
}

function founderName(startup) {
	return startup?.founder_full_name || startup?.founder_name || "Founder";
}

function formatFee(value) {
	const amount = Number(value || 0);
	return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`;
}

function Icon({ path, className = "h-4 w-4" }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={path} />
		</svg>
	);
}

function buildProposalMessage(form) {
	const phaseLines = form.phases
		.map(
			(phase, index) =>
				`Phase ${index + 1}: ${phase.title.trim() || "[Missing phase title]"}\nFocus & activities: ${phase.activities}\nDeliverables: ${phase.deliverables}`,
		)
		.join("\n\n");

	return [
		`Proposal Title: ${form.subject}`,
		`Focus Area: ${form.focusArea}`,
		`Duration: ${form.duration}`,
		`Sessions Count: ${form.sessionsCount}`,
		`Frequency: ${form.frequency}`,
		`Format: ${form.format}`,
		`Mode: ${form.mode}`,
		`Start Date: ${form.startDate || "To be agreed"}`,
		`Optional Fee: ${formatFee(form.monthlyFee)} / month`,
		"",
		"Scope & Objectives:",
		form.scope,
		"",
		"Mentorship Plan:",
		phaseLines,
		"",
		"Terms:",
		`Mentor Code of Conduct: ${form.codeOfConduct ? "Accepted" : "Not accepted"}`,
		`Platform Service Agreement: ${form.platformAgreement ? "Accepted" : "Not accepted"}`,
	].join("\n");
}

function ProposalForm() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const startupId = searchParams.get("startupId");

	const [startup, setStartup] = useState(null);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [loadingStartup, setLoadingStartup] = useState(true);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [savedAt, setSavedAt] = useState("");
	const [existingProposal, setExistingProposal] = useState(null);
	const [form, setForm] = useState({
		subject: "",
		focusArea: "Market Entry Strategy",
		duration: "3 Months",
		sessionsCount: "12",
		frequency: "Weekly",
		format: "1:1 Session",
		mode: "In-person",
		startDate: "",
		monthlyFee: "0.00",
		scope: "",
		phases: [
			{
				title: "",
				activities: "",
				deliverables: "",
			},
			{
				title: "",
				activities: "",
				deliverables: "",
			},
		],
		codeOfConduct: true,
		platformAgreement: false,
	});

	useEffect(() => {
		let alive = true;
		if (!startupId) {
			// Reflect the missing URL parameter in the form state.
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setLoadingStartup(false);
			setError("Missing startup id.");
			return;
		}

		setLoadingStartup(true);
		Promise.all([fetchStartupDetails(startupId), fetchIncomingRequests().catch(() => [])])
			.then(([data, requestData]) => {
				if (!alive) return;
				const loadedStartup = data.startup;
				const requests = Array.isArray(requestData) ? requestData : requestData?.requests || [];
				const existing = requests.find((request) => {
					const status = String(request.status || "").toLowerCase();
					return String(request.startup_id) === String(startupId) && ["pending", "accepted"].includes(status);
				});
				setStartup(loadedStartup);
				setExistingProposal(existing || null);
				setForm((current) => ({
					...current,
					subject: current.subject || "",
				}));
			})
			.catch((ex) => {
				if (alive) setError(ex.message || "Failed to load startup.");
			})
			.finally(() => {
				if (alive) setLoadingStartup(false);
			});

		return () => {
			alive = false;
		};
	}, [startupId]);

	useEffect(() => {
		const now = new Date();
		// Track the latest local edit timestamp for the footer status.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setSavedAt(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
	}, [form]);

	const totalFee = useMemo(() => {
		const months = Number.parseInt(form.duration, 10) || 1;
		return Number(form.monthlyFee || 0) * months;
	}, [form.duration, form.monthlyFee]);

	const missingFields = useMemo(() => {
		const missing = [];
		const requiredFields = [
			["Proposal title", form.subject],
			["Focus area", form.focusArea],
			["Duration", form.duration],
			["Sessions count", form.sessionsCount],
			["Frequency", form.frequency],
			["Format", form.format],
			["Mode", form.mode],
			["Start date", form.startDate],
			["Monthly fee", form.monthlyFee],
			["Scope and objectives", form.scope],
		];

		requiredFields.forEach(([label, value]) => {
			if (String(value ?? "").trim() === "") missing.push(label);
		});

		if (Number(form.sessionsCount) <= 0) missing.push("Valid sessions count");
		if (Number(form.monthlyFee) < 0) missing.push("Valid monthly fee");

		form.phases.forEach((phase, index) => {
			const phaseNumber = index + 1;
			if (!phase.title.trim()) missing.push(`Phase ${phaseNumber} title`);
			if (!phase.activities.trim()) missing.push(`Phase ${phaseNumber} activities`);
			if (!phase.deliverables.trim()) missing.push(`Phase ${phaseNumber} deliverables`);
		});

		if (!form.codeOfConduct) missing.push("Mentor code of conduct");
		if (!form.platformAgreement) missing.push("Platform service agreement");
		return missing;
	}, [form]);

	const proposalComplete = missingFields.length === 0;

	function updateField(name, value) {
		setForm((current) => ({ ...current, [name]: value }));
	}

	function updatePhase(index, field, value) {
		setForm((current) => ({
			...current,
			phases: current.phases.map((phase, phaseIndex) =>
				phaseIndex === index ? { ...phase, [field]: value } : phase,
			),
		}));
	}

	function addPhase() {
		setForm((current) => ({
			...current,
			phases: [
				...current.phases,
				{
					title: "",
					activities: "",
					deliverables: "",
				},
			],
		}));
	}

	function showMissingFields() {
		setError(
			missingFields.length > 0
				? `Complete: ${missingFields.slice(0, 5).join(", ")}${missingFields.length > 5 ? "..." : ""}`
				: "Missing startup id.",
		);
	}

	function onPreview() {
		if (!proposalComplete) {
			showMissingFields();
			return;
		}
		setError("");
		setPreviewOpen(true);
	}

	async function onSubmit(event) {
		event.preventDefault();
		if (existingProposal) {
			setError(
				String(existingProposal.status).toLowerCase() === "accepted"
					? "This mentorship is already accepted. You cannot send another proposal."
					: "You already have a pending proposal with this startup.",
			);
			return;
		}

		if (!startupId || !proposalComplete) {
			showMissingFields();
			return;
		}

		setLoading(true);
		setError("");
		try {
			await sendProposal({
				startup_id: Number(startupId),
				subject: form.subject.trim(),
				message: buildProposalMessage(form),
				duration_weeks: Math.max(1, (Number.parseInt(form.duration, 10) || 1) * 4),
				hourly_rate: Number(form.monthlyFee || 0),
			});
			router.push(
				`/mentor/requests/proposal/success?startupId=${startupId}&subject=${encodeURIComponent(form.subject)}`,
			);
		} catch (ex) {
			setError(ex.message || "Failed to send proposal.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={onSubmit} className="min-h-full bg-[#fbfcfc] pb-24 text-[#061f1a]">
			<header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-gray-100 bg-white px-5 sm:px-8">
				<div className="flex min-w-0 items-center gap-6">
					<h1 className="shrink-0 text-sm font-black text-[#052b23]">Send Proposal</h1>
					<div className="relative hidden w-[360px] max-w-[42vw] md:block">
						<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-emerald-500">
							<Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
						</div>
						<input
							type="search"
							placeholder="Search startups..."
							className="h-11 w-full rounded-full border border-transparent bg-emerald-50 pl-11 pr-4 text-xs font-medium text-gray-700 outline-none transition focus:border-[#0b4a3c]/20 focus:bg-white focus:ring-2 focus:ring-[#0b4a3c]/10"
						/>
					</div>
				</div>
				<div className="flex items-center gap-4">
					<NotificationBell />
					<button type="button" className="hidden h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-50 hover:text-gray-700 sm:flex" aria-label="Settings">
						<Icon path="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.33.787.713 1.002.382.215.837.244 1.242.1l.85-.304a1.125 1.125 0 011.37.49l.546.947c.275.477.196 1.079-.197 1.464l-.646.635a1.125 1.125 0 000 1.604l.646.635c.393.385.472.987.197 1.464l-.546.947a1.125 1.125 0 01-1.37.49l-.85-.304a1.125 1.125 0 00-1.242.1 1.125 1.125 0 00-.713 1.002l-.149.894c-.09.542-.56.94-1.11.94h-1.093c-.55 0-1.02-.398-1.11-.94l-.149-.894a1.125 1.125 0 00-.713-1.002 1.125 1.125 0 00-1.242-.1l-.85.304a1.125 1.125 0 01-1.37-.49l-.546-.947a1.125 1.125 0 01.197-1.464l.646-.635a1.125 1.125 0 000-1.604l-.646-.635a1.125 1.125 0 01-.197-1.464l.546-.947a1.125 1.125 0 011.37-.49l.85.304c.405.145.86.115 1.242-.1.383-.215.643-.578.713-1.002l.149-.894zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</button>
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b4a3c] text-xs font-black text-white">
						M
					</div>
				</div>
			</header>

			<main className="mx-auto grid w-full max-w-[1040px] grid-cols-1 gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_352px] lg:px-8">
				<section className="min-w-0 space-y-6">
					<nav className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
						<Link href="/mentor/requests" className="hover:text-[#0b4a3c]">Requests</Link>
						<span>/</span>
						<Link href={startupId ? `/mentor/requests/profile?startupId=${startupId}` : "/mentor/requests"} className="hover:text-[#0b4a3c]">Startup Profile</Link>
						<span>/</span>
						<span className="font-black text-[#052b23]">Send Proposal</span>
					</nav>

					{error ? (
						<div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">{error}</div>
					) : null}
					{existingProposal ? (
						<div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-800">
							{String(existingProposal.status).toLowerCase() === "accepted"
								? "This mentorship is already accepted. Schedule sessions or message the startup instead of sending another proposal."
								: "You already have a pending proposal with this startup. Wait for the startup response before sending another one."}
						</div>
					) : null}

					<div className="rounded-2xl bg-[#0b4a3c] p-5 text-white">
						{loadingStartup ? (
							<p className="text-sm font-semibold text-emerald-100">Loading startup...</p>
						) : (
							<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
								<div className="flex min-w-0 items-center gap-4">
									<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white text-2xl font-black text-[#0b4a3c]">
										{initials(startup?.startup_name)}
									</div>
									<div className="min-w-0">
										<h2 className="truncate text-2xl font-black">{startup?.startup_name || "Startup"}</h2>
										<div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-emerald-100">
											<span>{founderName(startup)}</span>
											<span>{startup?.industry || "Industry"}</span>
											<span>{startup?.business_stage || "Growth Stage"}</span>
										</div>
									</div>
								</div>
								<span className="w-fit rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100">
									Request Status: Active
								</span>
							</div>
						)}
					</div>

					<section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-7">
						<div className="mb-7 flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#0b4a3c]">
								<Icon path="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5A3.375 3.375 0 0010.125 2.25H8.25m.75 12l2.25 2.25L15 12m-6.75 9h7.5A2.25 2.25 0 0018 18.75V9.75a2.25 2.25 0 00-.659-1.591l-5.5-5.5A2.25 2.25 0 0010.25 2H6a2.25 2.25 0 00-2.25 2.25v14.5A2.25 2.25 0 006 21z" />
							</div>
							<h2 className="text-lg font-black text-[#052b23]">Proposal Setup</h2>
						</div>

						<div className="space-y-6">
							<div>
								<label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Proposal Title</label>
								<input
									value={form.subject}
									onChange={(event) => updateField("subject", event.target.value)}
									required
									placeholder="e.g., Strategic Growth & Content Monetization Roadmap"
									className="h-12 w-full rounded-xl border border-transparent bg-gray-50 px-4 text-sm font-medium outline-none transition focus:border-[#0b4a3c]/20 focus:bg-white focus:ring-2 focus:ring-[#0b4a3c]/10"
								/>
							</div>

							<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
								<SelectField label="Focus Area" value={form.focusArea} options={focusAreas} onChange={(value) => updateField("focusArea", value)} />
								<SelectField label="Duration" value={form.duration} options={durations} onChange={(value) => updateField("duration", value)} />
								<div>
									<label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Sessions Count</label>
									<input
										type="number"
										min="1"
										value={form.sessionsCount}
										onChange={(event) => updateField("sessionsCount", event.target.value)}
										className="h-12 w-full rounded-xl border border-transparent bg-gray-50 px-4 text-sm font-medium outline-none transition focus:border-[#0b4a3c]/20 focus:bg-white focus:ring-2 focus:ring-[#0b4a3c]/10"
									/>
								</div>
								<SelectField label="Frequency" value={form.frequency} options={frequencies} onChange={(value) => updateField("frequency", value)} />
							</div>

							<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
								<Segmented label="Format" value={form.format} options={["1:1 Session", "Group"]} onChange={(value) => updateField("format", value)} />
								<Segmented label="Mode" value={form.mode} options={["Remote", "In-person"]} onChange={(value) => updateField("mode", value)} />
							</div>

							<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
								<div>
									<label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Start Date</label>
									<input
										type="date"
										value={form.startDate}
										onChange={(event) => updateField("startDate", event.target.value)}
										className="h-12 w-full rounded-xl border border-transparent bg-gray-50 px-4 text-sm font-medium outline-none transition focus:border-[#0b4a3c]/20 focus:bg-white focus:ring-2 focus:ring-[#0b4a3c]/10"
									/>
								</div>
								<div>
									<label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Optional Fee (ETB / Month)</label>
									<input
										type="number"
										min="0"
										step="0.01"
										value={form.monthlyFee}
										onChange={(event) => updateField("monthlyFee", event.target.value)}
										className="h-12 w-full rounded-xl border border-transparent bg-gray-50 px-4 text-sm font-medium outline-none transition focus:border-[#0b4a3c]/20 focus:bg-white focus:ring-2 focus:ring-[#0b4a3c]/10"
									/>
								</div>
							</div>

							<div>
								<label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Scope & Objectives</label>
								<textarea
									value={form.scope}
									onChange={(event) => updateField("scope", event.target.value)}
									rows={5}
									required
									placeholder="Define the boundaries and key goals of this engagement..."
									className="w-full resize-none rounded-xl border border-transparent bg-gray-50 px-4 py-4 text-sm font-medium outline-none transition focus:border-[#0b4a3c]/20 focus:bg-white focus:ring-2 focus:ring-[#0b4a3c]/10"
								/>
							</div>
						</div>
					</section>

					<section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-7">
						<div className="mb-7 flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#0b4a3c]">
								<Icon path="M9 6.75V15m6-6v8.25m.503-6.998l4.875-2.437A1.125 1.125 0 0122 8.822v8.356c0 .85-.893 1.404-1.653 1.024l-4.875-2.437m.031-5.513a3.375 3.375 0 00-3.006 0m3.006 0a3.375 3.375 0 013.006 0m-3.006 0v5.513m0 0a3.375 3.375 0 01-3.006 0m3.006 0a3.375 3.375 0 003.006 0M9 15.75a3.375 3.375 0 01-3.006 0m3.006 0a3.375 3.375 0 003.006 0M3.75 9.75l2.244 1.122m0 0a3.375 3.375 0 003.006 0m-3.006 0v5.513" />
							</div>
							<h2 className="text-lg font-black text-[#052b23]">Mentorship Plan</h2>
						</div>

						<div className="space-y-5">
							{form.phases.map((phase, index) => (
								<div key={index} className="border-l-2 border-[#0b4a3c] bg-gray-50 p-5">
									<div className="mb-4 flex items-center gap-3">
										<span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0b4a3c] text-[10px] font-black text-white">
											{String(index + 1).padStart(2, "0")}
										</span>
										<div className="min-w-0 flex-1">
											<label className="mb-1 block text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">
												Phase Title
											</label>
											<input
												value={phase.title}
												onChange={(event) => updatePhase(index, "title", event.target.value)}
												placeholder={`Enter phase ${index + 1} title`}
												className={`h-10 w-full rounded-lg border bg-white px-3 text-sm font-black uppercase tracking-[0.12em] text-[#0b4a3c] outline-none transition focus:border-[#0b4a3c]/30 ${
													!phase.title.trim() ? "border-amber-200" : "border-gray-200"
												}`}
											/>
										</div>
									</div>
									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<div>
											<label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">Focus & Activities</label>
											<textarea
												value={phase.activities}
												onChange={(event) => updatePhase(index, "activities", event.target.value)}
												rows={3}
												placeholder="Describe the planned activities..."
												className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#0b4a3c]/30"
											/>
										</div>
										<div>
											<label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">Deliverables</label>
											<textarea
												value={phase.deliverables}
												onChange={(event) => updatePhase(index, "deliverables", event.target.value)}
												rows={3}
												placeholder="List expected deliverables..."
												className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#0b4a3c]/30"
											/>
										</div>
									</div>
								</div>
							))}
							<button
								type="button"
								onClick={addPhase}
								className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white text-sm font-black text-[#0b4a3c] transition hover:bg-emerald-50"
							>
								<span className="text-xl leading-none">+</span>
								Add Milestone / Phase
							</button>
						</div>
					</section>

					<section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-7">
						<h2 className="mb-6 text-lg font-black text-[#052b23]">Terms & Agreement</h2>
						<div className="space-y-4">
							<Agreement
								checked={form.codeOfConduct}
								onChange={(value) => updateField("codeOfConduct", value)}
								title="Mentor Code of Conduct"
								body="I agree to maintain confidentiality and provide objective, professional guidance as per the StartupConnect Ethiopia guidelines."
							/>
							<Agreement
								checked={form.platformAgreement}
								onChange={(value) => updateField("platformAgreement", value)}
								title="Platform Service Agreement"
								body="I acknowledge that all transactions and agreements within this proposal are governed by the overarching Institutional Mentor Agreement."
							/>
						</div>
					</section>
				</section>

				<aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
					<section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
						<p className="mb-5 text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Startup Snapshot</p>
						<Snapshot label="Founded" value={startup?.founded_year || "2022"} />
						<Snapshot label="Location" value={startup?.city || startup?.location || "Addis Ababa, ET"} />
						<Snapshot label="Team Size" value={startup?.team_size ? `${startup.team_size} Employees` : "Not set"} />
						<Snapshot label="Current Revenue" value={startup?.funding_needed ? `$${Number(startup.funding_needed).toLocaleString()}` : "Not disclosed"} />
					</section>

					<section className="overflow-hidden rounded-2xl bg-[#0b4a3c] p-6 text-white shadow-sm">
						<p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Match Insight</p>
						<p className="text-sm font-semibold leading-6">
							The founder is looking for expertise in {form.focusArea.toLowerCase()}, which matches your verified mentor profile skills.
						</p>
						<div className="mt-5 flex flex-wrap gap-2">
							{["Media Policy", "SaaS Scaling", "Local Market"].map((tag) => (
								<span key={tag} className="rounded-md bg-white/10 px-3 py-2 text-[10px] font-black text-emerald-100">
									{tag}
								</span>
							))}
						</div>
					</section>

					<section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
						<p className="mb-5 text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Proposal Summary</p>
						<SummaryItem icon="M12 6v6l4 2" label="Engagement" value={`${form.duration} - ${form.frequency}`} />
						<SummaryItem icon="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0A5.971 5.971 0 006 18.72M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" label="Delivery Format" value={`${form.format} - ${form.mode}`} />
						<SummaryItem icon="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.172-.879-1.172-2.303 0-3.182 1.171-.879 3.07-.879 4.242 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" label="Total Estimated Fee" value={`${formatFee(totalFee)} ${totalFee === 0 ? "(Pro-bono noted)" : ""}`} />
					</section>

					<section className="rounded-2xl bg-gray-50 p-6">
						<p className="mb-5 text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Process Workflow</p>
						{[
							["1", "Proposal Sent", `Sent to ${startup?.startup_name || "startup"} for founder review.`],
							["2", "Review & Negotiate", "Adjustments if requested by founder."],
							["3", "Agreement Signed", "Official onboarding to your portfolio."],
						].map(([step, title, body], index) => (
							<div key={step} className="flex gap-4">
								<div className="flex flex-col items-center">
									<span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${index === 0 ? "bg-[#0b4a3c] text-white" : "bg-white text-gray-500 ring-1 ring-gray-200"}`}>
										{step}
									</span>
									{index < 2 ? <span className="h-10 w-px bg-gray-200" /> : null}
								</div>
								<div className="pb-4">
									<p className={`text-sm font-black ${index === 0 ? "text-[#052b23]" : "text-gray-400"}`}>{title}</p>
									<p className="mt-1 text-xs text-gray-500">{body}</p>
								</div>
							</div>
						))}
					</section>
				</aside>
			</main>

			<footer className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-5 py-3 backdrop-blur">
				<div className="mx-auto flex max-w-[1040px] items-center justify-between gap-4">
					<p className="hidden text-xs font-medium text-gray-400 sm:block">
						{proposalComplete
							? `Auto-saved at ${savedAt || "--:--"}`
							: `Missing: ${missingFields.slice(0, 3).join(", ")}${missingFields.length > 3 ? "..." : ""}`}
					</p>
					<div className="ml-auto flex items-center gap-3">
						<button type="button" className="hidden px-4 py-3 text-xs font-black text-gray-800 sm:inline-flex">
							Save Draft
						</button>
						<button
							type="button"
							onClick={onPreview}
							title={!proposalComplete ? `Missing: ${missingFields.join(", ")}` : "Preview proposal"}
							className="rounded-xl bg-gray-100 px-5 py-3 text-xs font-black text-gray-900 transition hover:bg-gray-200"
						>
							Preview Proposal
						</button>
						<button
							type="submit"
							disabled={loading || !startupId || !proposalComplete || Boolean(existingProposal)}
							title={!proposalComplete ? `Missing: ${missingFields.join(", ")}` : "Send proposal"}
							className="inline-flex items-center gap-3 rounded-xl bg-[#0b4a3c] px-6 py-3 text-xs font-black text-white shadow-lg transition hover:bg-[#07382d] disabled:cursor-not-allowed disabled:opacity-50"
						>
							{existingProposal ? "Already Sent" : loading ? "Sending..." : "Send Proposal"}
							<span aria-hidden="true">-&gt;</span>
						</button>
					</div>
				</div>
			</footer>

			{previewOpen ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
					<div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
						<div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
							<h2 className="text-lg font-black text-[#052b23]">Proposal Preview</h2>
							<button type="button" onClick={() => setPreviewOpen(false)} className="rounded-lg px-3 py-2 text-sm font-black text-gray-500 hover:bg-gray-50">
								Close
							</button>
						</div>
						<pre className="max-h-[60vh] whitespace-pre-wrap overflow-y-auto p-6 text-sm leading-6 text-gray-700">
							{buildProposalMessage(form)}
						</pre>
					</div>
				</div>
			) : null}
		</form>
	);
}

function SelectField({ label, value, options, onChange }) {
	return (
		<div>
			<label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">{label}</label>
			<select
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="h-12 w-full rounded-xl border border-transparent bg-gray-50 px-4 text-sm font-medium outline-none transition focus:border-[#0b4a3c]/20 focus:bg-white focus:ring-2 focus:ring-[#0b4a3c]/10"
			>
				{options.map((option) => (
					<option key={option} value={option}>
						{option}
					</option>
				))}
			</select>
		</div>
	);
}

function Segmented({ label, value, options, onChange }) {
	return (
		<div>
			<p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">{label}</p>
			<div className="grid grid-cols-2 gap-2">
				{options.map((option) => (
					<button
						key={option}
						type="button"
						onClick={() => onChange(option)}
						className={`h-11 rounded-xl text-sm font-black transition ${value === option ? "bg-[#0b4a3c] text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
					>
						{option}
					</button>
				))}
			</div>
		</div>
	);
}

function Agreement({ checked, onChange, title, body }) {
	return (
		<label className="flex cursor-pointer gap-4 rounded-xl border border-emerald-100 bg-emerald-50 p-5">
			<input
				type="checkbox"
				checked={checked}
				onChange={(event) => onChange(event.target.checked)}
				className="mt-1 h-4 w-4 rounded border-gray-300 accent-[#0b4a3c]"
			/>
			<span>
				<span className="block text-sm font-black text-[#052b23]">{title}</span>
				<span className="mt-2 block text-xs leading-6 text-[#0b4a3c]">{body}</span>
			</span>
		</label>
	);
}

function Snapshot({ label, value }) {
	return (
		<div className="flex items-center justify-between border-b border-gray-100 py-4 last:border-b-0">
			<span className="text-sm font-medium text-gray-500">{label}</span>
			<span className="text-sm font-black text-gray-950">{value}</span>
		</div>
	);
}

function SummaryItem({ icon, label, value }) {
	return (
		<div className="mb-5 flex gap-4 last:mb-0">
			<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#0b4a3c]">
				<Icon path={icon} />
			</div>
			<div>
				<p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{label}</p>
				<p className="mt-1 text-sm font-black text-[#052b23]">{value}</p>
			</div>
		</div>
	);
}

export default function MentorProposalPage() {
	return (
		<Suspense fallback={<p className="p-8 text-gray-500">Loading...</p>}>
			<ProposalForm />
		</Suspense>
	);
}
