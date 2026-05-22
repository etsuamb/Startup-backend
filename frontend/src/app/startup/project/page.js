"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/startup/Sidebar";
import { getMyProjects } from "@/lib/startupApi";

export default function StartupProjectsListing() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await getMyProjects();
        setProjects(data.projects || []);
      } catch (err) {
        setError(err.message || "Unable to load projects.");
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  const totalProjects = projects.length;
  const totalFundingNeeded = useMemo(
    () => projects.reduce((sum, project) => sum + Number(project.funding_goal || 0), 0),
    [projects],
  );
  const totalRaised = useMemo(
    () => projects.reduce((sum, project) => sum + Number(project.amount_raised || 0), 0),
    [projects],
  );
  const activeProjects = projects.filter((project) => project.status && project.status !== "Draft").length;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto relative">
        <header className="flex flex-col gap-6 px-8 py-6 bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Projects</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your startup projects, funding requests, documents, and progress updates.</p>
            </div>
            <Link href="/startup/project/create" className="inline-flex items-center gap-2 px-5 py-3 bg-[#0f3d32] text-white rounded-2xl text-sm font-bold shadow-sm hover:bg-[#0a2921] transition">
              <span>+ Create New Project</span>
            </Link>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="rounded-[20px] bg-white border border-gray-100 p-5 shadow-sm flex-1 min-w-[180px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900">{loading ? "..." : totalProjects}</p>
            </div>
            <div className="rounded-[20px] bg-white border border-gray-100 p-5 shadow-sm flex-1 min-w-[180px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Funding Goal</p>
              <p className="text-3xl font-bold text-gray-900">${totalFundingNeeded.toLocaleString()}</p>
            </div>
            <div className="rounded-[20px] bg-white border border-gray-100 p-5 shadow-sm flex-1 min-w-[180px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Raised</p>
              <p className="text-3xl font-bold text-gray-900">${totalRaised.toLocaleString()}</p>
            </div>
            <div className="rounded-[20px] bg-white border border-gray-100 p-5 shadow-sm flex-1 min-w-[180px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Active Projects</p>
              <p className="text-3xl font-bold text-gray-900">{activeProjects}</p>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-10 py-8 w-full max-w-[1200px] mx-auto pb-24">
          {loading ? (
            <div className="rounded-3xl border border-gray-100 bg-white p-10 shadow-sm text-center text-gray-500">Loading projects...</div>
          ) : error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center text-red-700">{error}</div>
          ) : projects.length === 0 ? (
            <div className="rounded-[30px] border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
              <p className="text-lg font-semibold text-gray-900 mb-3">No projects yet</p>
              <p className="text-sm text-gray-500 mb-6">Add your first project to begin tracking funding, documents, and updates.</p>
              <Link href="/startup/project/create" className="inline-flex items-center justify-center px-6 py-3 bg-[#0f3d32] text-white rounded-2xl font-bold hover:bg-[#0a2921] transition">Create your first project</Link>
            </div>
          ) : (
            <div className="space-y-6">
              {projects.map((project) => (
                <div key={project.project_id} className="rounded-[30px] border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <div className="relative h-56 bg-slate-100 overflow-hidden">
                    {project.cover_photo_path ? (
                      <img
                        src={`/${project.cover_photo_path}`}
                        alt={`${project.project_title} cover`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm uppercase tracking-[0.2em] text-gray-400 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">
                        No cover image yet
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <div className="text-[10px] text-white/80 uppercase tracking-[0.22em]">
                        {project.industry || "Industry TBD"}
                      </div>
                      <div className="mt-1 text-xs text-white/90">{project.lifecycle_stage || "Stage TBD"}</div>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-900">{project.project_title}</h2>
                        <p className="text-sm text-gray-500 mt-2">{project.description || "No description provided yet."}</p>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-gray-700">
                        {project.status ? project.status : "Draft"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Funding Goal</p>
                        <p className="font-semibold text-gray-900">${Number(project.funding_goal || 0).toLocaleString()}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Raised</p>
                        <p className="font-semibold text-gray-900">${Number(project.amount_raised || 0).toLocaleString()}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Timeline</p>
                        <p className="font-semibold text-gray-900">{project.start_date || "TBD"} – {project.end_date || "TBD"}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => router.push(`/startup/project/create?edit=${project.project_id}`)}
                        className="rounded-2xl border border-gray-200 px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-700 hover:bg-gray-50 transition"
                      >
                        Edit Project
                      </button>
                      <Link href={`/startup/project/details/${project.project_id}`} className="rounded-2xl bg-[#0f3d32] px-5 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#0a2921] transition">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
