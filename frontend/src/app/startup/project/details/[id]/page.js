"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/startup/Sidebar";
import { getProjectDetails } from "@/lib/startupApi";

export default function ProjectDetails() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id;

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProject() {
      if (!projectId) {
        setError("Project not found.");
        setLoading(false);
        return;
      }

      try {
        const data = await getProjectDetails(projectId);
        setProject(data.project || data);
      } catch (err) {
        setError(err.message || "Unable to load project details.");
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center px-6 py-10 bg-white rounded-3xl shadow-sm border border-gray-100">
            <p className="text-sm font-bold text-gray-700">Loading project details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center px-6 py-10 bg-white rounded-3xl shadow-sm border border-red-200">
            <p className="text-sm font-bold text-red-700">{error}</p>
            <Link
              href="/startup/project"
              className="inline-block mt-4 px-6 py-3 bg-[#0f3d32] text-white rounded-lg text-sm font-bold"
            >
              Back to Projects
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto">
        <header className="flex justify-between items-center px-8 py-5 bg-white border-b border-gray-100 w-full z-10 sticky top-0">
          <div>
            <h1 className="text-3xl font-bold text-[#0f3d32] tracking-tight">Project Details</h1>
            <p className="text-sm text-gray-500 mt-1">View and manage your project information</p>
          </div>
          <Link
            href="/startup/project"
            className="px-6 py-3 bg-white border border-[#0f3d32] text-[#0f3d32] font-bold rounded-lg hover:bg-gray-50 transition text-sm shadow-sm"
          >
            Back to My Projects
          </Link>
        </header>

        <div className="px-4 sm:px-10 py-10 w-full max-w-[1200px] mx-auto pb-24">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="relative h-72 bg-slate-100">
              {project.cover_photo_path ? (
                <img
                  src={`/${project.cover_photo_path}`}
                  alt={`${project.project_title} cover`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm uppercase tracking-[0.2em] text-gray-400 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">
                  Project cover image will appear here
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-6">
                <p className="text-xs text-white/80">
                  {project.industry || "Industry TBD"} · {project.lifecycle_stage || "Stage TBD"}
                </p>
              </div>
            </div>
            <div className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8 pb-6 border-b border-gray-100">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">{project.project_title}</h2>
                  <div className="flex flex-wrap gap-3">
                    <span className="bg-[#eaf4f1] text-[#136150] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded border border-[#cde5dd]">
                      {project.industry || "Not specified"}
                    </span>
                    <span className="bg-[#f0f9ff] text-[#0c4a6e] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded border border-[#bae6fd]">
                      {project.lifecycle_stage || "Not specified"}
                    </span>
                    <span className="bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded border border-gray-200">
                      {project.status || "Draft"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/startup/project/create?edit=${projectId}`)}
                  className="px-6 py-3 bg-[#0f3d32] hover:bg-[#0a2921] text-white font-bold rounded-lg transition text-sm shadow-md"
                >
                  Edit Project
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-widest">Short Summary</h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{project.description || "No summary provided"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-widest">Problem Statement</h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{project.problem_statement || "No problem statement provided"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-widest">Solution</h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{project.solution_statement || "No solution provided"}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-widest">Funding Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Funding Goal</span>
                        <span className="font-bold text-gray-900">${Number(project.funding_goal || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Amount Raised</span>
                        <span className="font-bold text-[#0f3d32]">${Number(project.amount_raised || 0).toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-[#0f3d32] h-2 rounded-full"
                          style={{ width: `${project.funding_goal ? Math.min(100, (Number(project.amount_raised || 0) / Number(project.funding_goal)) * 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-widest">Expected Impact</h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{project.expected_impact || "Not specified"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-widest">Timeline</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Start Date</span>
                        <span className="font-medium text-gray-900">{project.start_date || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">End Date</span>
                        <span className="font-medium text-gray-900">{project.end_date || "Not specified"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-100">
                <Link
                  href={`/startup/project/documents?project=${projectId}`}
                  className="px-6 py-3 bg-[#0f3d32] hover:bg-[#0a2921] text-white font-bold rounded-lg transition text-sm shadow-md"
                >
                  Upload Documents
                </Link>
                <button
                  onClick={() => router.push(`/startup/project/create?edit=${projectId}`)}
                  className="px-6 py-3 bg-white border border-[#0f3d32] text-[#0f3d32] font-bold rounded-lg hover:bg-gray-50 transition text-sm"
                >
                  Edit Project
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
