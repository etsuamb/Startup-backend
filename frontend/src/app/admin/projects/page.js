"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	fetchAdminProject,
	fetchAdminProjects,
	flagProjectContent,
	removeProject,
	restoreProject,
	updateProjectStatus,
} from "@/lib/adminApi";

const PROJECT_STATUSES = ["draft", "active", "funded", "completed", "cancelled"];

const STATUS_STYLE = {
	draft: "bg-slate-100 text-slate-700",
	active: "bg-emerald-50 text-emerald-800",
	funded: "bg-sky-50 text-sky-800",
	completed: "bg-indigo-50 text-indigo-800",
	cancelled: "bg-red-50 text-red-700",
};

function formatMoney(value) {
	return `${Number(value || 0).toLocaleString()} ETB`;
}

function ProjectDetailModal({ projectId, onClose, onUpdated }) {
	const [loading, setLoading] = useState(true);
	const [project, setProject] = useState(null);
	const [error, setError] = useState("");
	const [msg, setMsg] = useState("");
	const [busy, setBusy] = useState(false);
	const [status, setStatus] = useState("active");
	const [note, setNote] = useState("");

	const load = useCallback(async () => {
		if (!projectId) return;
		setLoading(true);
		setError("");
		try {
			const data = await fetchAdminProject(projectId);
			setProject(data.project);
			setStatus(data.project?.status || "active");
		} catch (ex) {
			setError(ex.message || "Failed to load project");
		} finally {
			setLoading(false);
		}
	}, [projectId]);

	useEffect(() => {
		load();
	}, [load]);

	async function runAction(fn) {
		setBusy(true);
		setError("");
		setMsg("");
		try {
			await fn();
			setMsg("Updated successfully");
			await load();
			onUpdated?.();
		} catch (ex) {
			setError(ex.message || "Action failed");
		} finally {
			setBusy(false);
		}
	}

	if (!projectId) return null;
	const p = project;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="bg-white rounded-2xl max-w-2xl w-full border shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
				<div className="flex justify-between items-start px-6 py-5 border-b border-slate-100 bg-slate-50/80">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Project</p>
						<h2 className="text-xl font-bold text-slate-900 mt-1">{loading ? "Loading…" : p?.project_title || "Project"}</h2>
						{p ? (
							<p className="text-sm text-slate-500 mt-0.5">
								{p.startup_name} · {p.startup_email}
							</p>
						) : null}
					</div>
					<button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-white">
						Close
					</button>
				</div>

				<div className="flex-1 overflow-y-auto px-6 py-5">
					{error ? <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm p-3">{error}</div> : null}
					{msg ? <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-800 text-sm p-3">{msg}</div> : null}

					{loading ? (
						<p className="py-12 text-center text-sm text-slate-500">Loading project details…</p>
					) : p ? (
						<>
							<dl className="grid sm:grid-cols-2 gap-3 text-sm mb-6">
								<div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
									<dt className="text-xs text-slate-500 uppercase font-semibold">Status</dt>
									<dd className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLE[p.status] || STATUS_STYLE.active}`}>
										{p.status}
									</dd>
								</div>
								<div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
									<dt className="text-xs text-slate-500 uppercase font-semibold">Industry</dt>
									<dd className="mt-1 font-medium">{p.industry || p.startup_industry || "—"}</dd>
								</div>
								<div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
									<dt className="text-xs text-slate-500 uppercase font-semibold">Funding goal</dt>
									<dd className="mt-1 font-bold">{formatMoney(p.funding_goal)}</dd>
								</div>
								<div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
									<dt className="text-xs text-slate-500 uppercase font-semibold">Amount raised</dt>
									<dd className="mt-1 font-bold">{formatMoney(p.amount_raised)}</dd>
								</div>
								<div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
									<dt className="text-xs text-slate-500 uppercase font-semibold">Lifecycle stage</dt>
									<dd className="mt-1">{p.lifecycle_stage || "—"}</dd>
								</div>
								<div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
									<dt className="text-xs text-slate-500 uppercase font-semibold">Timeline</dt>
									<dd className="mt-1">
										{p.start_date ? new Date(p.start_date).toLocaleDateString() : "—"} –{" "}
										{p.end_date ? new Date(p.end_date).toLocaleDateString() : "—"}
									</dd>
								</div>
								<div className="rounded-xl bg-slate-50 p-3 border border-slate-100 sm:col-span-2">
									<dt className="text-xs text-slate-500 uppercase font-semibold">Founder</dt>
									<dd className="mt-1">
										{[p.founder_first_name, p.founder_last_name].filter(Boolean).join(" ") || "—"} ({p.startup_email})
									</dd>
								</div>
							</dl>

							{p.description ? (
								<div className="rounded-xl border border-slate-200 p-4 mb-4">
									<p className="text-xs font-bold text-slate-500 uppercase mb-2">Description</p>
									<p className="text-sm text-slate-700 whitespace-pre-wrap">{p.description}</p>
								</div>
							) : null}
							{p.problem_statement ? (
								<div className="rounded-xl border border-slate-200 p-4 mb-4">
									<p className="text-xs font-bold text-slate-500 uppercase mb-2">Problem</p>
									<p className="text-sm text-slate-700 whitespace-pre-wrap">{p.problem_statement}</p>
								</div>
							) : null}
							{p.solution_statement ? (
								<div className="rounded-xl border border-slate-200 p-4 mb-6">
									<p className="text-xs font-bold text-slate-500 uppercase mb-2">Solution</p>
									<p className="text-sm text-slate-700 whitespace-pre-wrap">{p.solution_statement}</p>
								</div>
							) : null}

							<div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-4">
								<h3 className="text-sm font-semibold text-slate-900">Admin actions</h3>
								<div>
									<label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Update status</label>
									<div className="flex flex-wrap gap-2 items-center">
										<select
											value={status}
											disabled={busy}
											onChange={(e) => setStatus(e.target.value)}
											className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
										>
											{PROJECT_STATUSES.map((s) => (
												<option key={s} value={s}>
													{s}
												</option>
											))}
										</select>
										<button
											type="button"
											disabled={busy || status === p.status}
											onClick={() => runAction(() => updateProjectStatus(projectId, status, note))}
											className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
										>
											Save status
										</button>
									</div>
								</div>
								<div>
									<label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Note (optional)</label>
									<input
										type="text"
										value={note}
										onChange={(e) => setNote(e.target.value)}
										className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
										placeholder="Reason for status change"
									/>
								</div>
								<div className="flex flex-wrap gap-2 pt-2 border-t border-emerald-100">
									<button
										type="button"
										disabled={busy}
										onClick={() => runAction(() => flagProjectContent(projectId, note || "Flagged by admin"))}
										className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-40"
									>
										Flag content
									</button>
									{p.status !== "cancelled" ? (
										<button
											type="button"
											disabled={busy}
											onClick={() => runAction(() => removeProject(projectId))}
											className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-40"
										>
											Remove project
										</button>
									) : (
										<button
											type="button"
											disabled={busy}
											onClick={() => runAction(() => restoreProject(projectId))}
											className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
										>
											Restore project
										</button>
									)}
									<Link
										href={`/admin/startups`}
										className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
									>
										Directory
									</Link>
								</div>
							</div>
						</>
					) : (
						<p className="text-sm text-slate-500">Project not found.</p>
					)}
				</div>
			</div>
		</div>
	);
}

export default function AdminProjectsPage() {
	const [projects, setProjects] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [selectedId, setSelectedId] = useState(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const data = await fetchAdminProjects({ limit: 200 });
			setProjects(data.projects || []);
		} catch (ex) {
			setError(ex.message || "Failed to load projects");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const filtered = useMemo(() => {
		let list = projects;
		if (statusFilter) list = list.filter((p) => p.status === statusFilter);
		const q = search.trim().toLowerCase();
		if (!q) return list;
		return list.filter((p) =>
			[p.project_title, p.startup_name, p.startup_email, p.industry, p.status]
				.filter(Boolean)
				.join(" ")
				.toLowerCase()
				.includes(q),
		);
	}, [projects, search, statusFilter]);

	return (
		<div className="max-w-7xl mx-auto pb-12">
			{selectedId ? (
				<ProjectDetailModal projectId={selectedId} onClose={() => setSelectedId(null)} onUpdated={load} />
			) : null}

			<section className="mb-8 rounded-[32px] bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8">
				<h1 className="text-3xl font-bold mb-2">Projects</h1>
				<p className="text-slate-300 text-sm max-w-2xl">
					Review startup fundraising projects, update status, flag content, or remove posts from the platform.
				</p>
			</section>

			{error ? <div className="mb-4 p-4 rounded-2xl bg-red-50 text-red-700 text-sm">{error}</div> : null}

			<div className="mb-4 flex flex-col sm:flex-row gap-3">
				<input
					type="search"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search projects or startups…"
					className="flex-1 max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
				/>
				<select
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value)}
					className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
				>
					<option value="">All statuses</option>
					{PROJECT_STATUSES.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>
			</div>

			<div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
				{loading ? (
					<p className="p-6 text-sm text-slate-500">Loading…</p>
				) : filtered.length === 0 ? (
					<p className="p-6 text-sm text-slate-500">No projects found.</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm min-w-[720px]">
							<thead className="bg-slate-50 text-xs uppercase text-slate-500 text-left">
								<tr>
									<th className="px-4 py-3 font-semibold">Project</th>
									<th className="px-4 py-3 font-semibold">Startup</th>
									<th className="px-4 py-3 font-semibold">Goal</th>
									<th className="px-4 py-3 font-semibold">Raised</th>
									<th className="px-4 py-3 font-semibold">Status</th>
									<th className="px-4 py-3 font-semibold">Created</th>
									<th className="px-4 py-3 font-semibold">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{filtered.map((p) => (
									<tr key={p.project_id} className="hover:bg-slate-50/60">
										<td className="px-4 py-3.5 font-medium text-slate-900">{p.project_title}</td>
										<td className="px-4 py-3.5">
											<p>{p.startup_name}</p>
											<p className="text-xs text-slate-500">{p.startup_email}</p>
										</td>
										<td className="px-4 py-3.5 tabular-nums">{formatMoney(p.funding_goal)}</td>
										<td className="px-4 py-3.5 tabular-nums">{formatMoney(p.amount_raised)}</td>
										<td className="px-4 py-3.5">
											<span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLE[p.status] || STATUS_STYLE.active}`}>
												{p.status}
											</span>
										</td>
										<td className="px-4 py-3.5 text-slate-500">
											{p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
										</td>
										<td className="px-4 py-3.5">
											<button
												type="button"
												onClick={() => setSelectedId(p.project_id)}
												className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-800 hover:bg-emerald-50/50"
											>
												View details
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{!loading && filtered.length > 0 ? (
				<p className="mt-3 text-xs text-slate-400">{filtered.length} project(s)</p>
			) : null}
		</div>
	);
}
