"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/startup/Sidebar";
import StartupProfileMenu from "@/components/startup/StartupProfileMenu";
import { createProject, getProjectDetails, getStartupProfile, updateProject } from "@/lib/startupApi";
import { PendingApprovalBlock } from "@/components/startup/PendingApprovalNotice";
import { useStartupApproval } from "@/hooks/useStartupApproval";
import { saveDraft, loadDraft, clearDraft, getDraftSavedAt, formatSavedTime } from "@/lib/formDraft";
import { IndustrySelectWithOther } from "@/components/register/IndustryFields";

const DRAFT_KEY = "startup_project_create";

export default function StartupProjectCreate() {
  const router = useRouter();
  const [editProjectId, setEditProjectId] = useState(null);
  const isEditMode = Boolean(editProjectId);
  
  const [projectTitle, setProjectTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("");
  const [summary, setSummary] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [fundingGoal, setFundingGoal] = useState("");
  const [expectedImpact, setExpectedImpact] = useState("");
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showDraftNotice, setShowDraftNotice] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const { pending, loading: approvalLoading } = useStartupApproval();

  useEffect(() => {
    getStartupProfile()
      .then((data) => setProfile(data?.startup || data || null))
      .catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");

    if (editId) {
      // Restore route state on the initial client mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditProjectId(editId);
    } else {
      // Load draft if not in edit mode
      const savedDraft = loadDraft(DRAFT_KEY);
      if (savedDraft) {
        // Restore the locally saved form when starting a new project.
        setProjectTitle(savedDraft.projectTitle || "");
        setIndustry(savedDraft.industry || "");
        setStage(savedDraft.stage || "");
        setSummary(savedDraft.summary || "");
        setProblem(savedDraft.problem || "");
        setSolution(savedDraft.solution || "");
        setFundingGoal(savedDraft.fundingGoal || "");
        setExpectedImpact(savedDraft.expectedImpact || "");
        setDraftSavedAt(formatSavedTime(getDraftSavedAt(DRAFT_KEY)));
        setShowDraftNotice(true);
        setTimeout(() => setShowDraftNotice(false), 4000);
      }
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (isEditMode) return;
    const timer = setTimeout(() => {
      const draftData = {
        projectTitle,
        industry,
        stage,
        summary,
        problem,
        solution,
        fundingGoal,
        expectedImpact,
      };
      if (Object.values(draftData).some(v => v && String(v).trim())) {
        if (saveDraft(DRAFT_KEY, draftData)) {
          const savedAt = getDraftSavedAt(DRAFT_KEY);
          setDraftSavedAt(formatSavedTime(savedAt));
        }
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [projectTitle, industry, stage, summary, problem, solution, fundingGoal, expectedImpact, isEditMode]);

  useEffect(() => {
    async function loadProjectData() {
      if (!editProjectId) return;

      try {
        setLoading(true);
        const data = await getProjectDetails(editProjectId);
        const project = data.project || data;
        setProjectTitle(project.project_title || "");
        setIndustry(project.industry || "");
        setStage(project.lifecycle_stage || project.stage || "");
        setSummary(project.description || "");
        setProblem(project.problem_statement || "");
        setSolution(project.solution_statement || project.solution || "");
        setFundingGoal(project.funding_goal ? String(project.funding_goal) : "");
        setExpectedImpact(project.expected_impact || "");
        if (project.cover_photo_path) {
          setCoverPreviewUrl(`/${project.cover_photo_path}`);
        }
      } catch (err) {
        setError(err.message || "Failed to load project data.");
      } finally {
        setLoading(false);
      }
    }
    loadProjectData();
  }, [editProjectId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!projectTitle.trim() || !fundingGoal.trim()) {
      setError("Project name and required funding are required.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("project_title", projectTitle);
      formData.append("industry", industry);
      formData.append("lifecycle_stage", stage);
      formData.append("description", summary);
      formData.append("problem_statement", problem);
      formData.append("solution_statement", solution);
      formData.append("funding_goal", fundingGoal);
      formData.append("expected_impact", expectedImpact);
      if (coverPhoto) {
        formData.append("cover_photo", coverPhoto);
      }

      if (isEditMode) {
        await updateProject(editProjectId, formData);
        setShowSuccessPopup(true);
      } else {
        const response = await createProject(formData);
        clearDraft(DRAFT_KEY);
        const projectId = response.project_id || response.project?.project_id;
        setSuccess("Project created successfully. Redirecting to documents...");
        setTimeout(() => {
          if (projectId) {
            router.push(`/startup/project/documents?project=${projectId}`);
          } else {
            router.push("/startup/project/documents");
          }
        }, 1000);
      }
    } catch (err) {
      setError(err.message || (isEditMode ? "Failed to update project." : "Failed to create project."));
      if (isEditMode) setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  }

  function closePopup() {
    setShowSuccessPopup(false);
    setShowErrorPopup(false);
    router.push("/startup/project");
  }

  const founderName =
    profile?.founder_full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Founder";

  if (!approvalLoading && pending) {
    return (
      <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
        <Sidebar />
        <PendingApprovalBlock title="Project creation unavailable" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto">
        <header className="flex justify-between items-center px-8 py-5 bg-white border-b border-gray-100 w-full z-10 sticky top-0">
          <div className="relative w-full max-w-[400px] hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input type="text" placeholder="Search resources..." className="w-full pl-11 pr-4 py-2.5 bg-[#f3f4f6] border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0f3d32]/20 transition" />
          </div>

          <div className="flex items-center gap-6 ml-auto">
            <button className="text-gray-400 hover:text-gray-600 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </button>
            <button className="text-gray-400 hover:text-gray-600 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>

            <StartupProfileMenu profileSubtitle={founderName} />
          </div>
        </header>

        <div className="px-4 sm:px-10 py-10 w-full max-w-[1200px] mx-auto">
          <h1 className="text-[32px] font-bold text-[#0f3d32] mb-6 tracking-tight">{isEditMode ? "Edit Project" : "Create Startup Project"}</h1>

          {/* Stepper */}
          <div className="flex items-center gap-6 mb-10 border-b border-gray-200 pb-px">
            <div className="flex items-center gap-2 pb-4 border-b-2 border-[#0f3d32]">
              <div className="w-6 h-6 rounded-full bg-[#0f3d32] text-white flex items-center justify-center font-bold text-[10px]">
                1
              </div>
              <span className="text-xs font-bold text-[#0f3d32]">Step 1 Project Info</span>
            </div>

            {isEditMode && editProjectId ? (
              <Link
                href={`/startup/project/documents?project=${editProjectId}`}
                className="flex items-center gap-2 pb-4 border-b-2 border-transparent hover:border-[#0f3d32]/30 transition"
              >
                <div className="w-6 h-6 rounded-full bg-[#e2e8f0] text-gray-400 flex items-center justify-center font-bold text-[10px]">
                  2
                </div>
                <span className="text-xs font-bold text-gray-400">Step 2 Documents</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2 pb-4 border-b-2 border-transparent">
                <div className="w-6 h-6 rounded-full bg-[#e2e8f0] text-gray-400 flex items-center justify-center font-bold text-[10px]">
                  2
                </div>
                <span className="text-xs font-bold text-gray-400">Step 2 Documents</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column (Form) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-8 flex flex-col gap-6">
                {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
                {success && <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Project Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2">Project Name</label>
                    <input
                      type="text"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      placeholder="e.g. AgriTech Ethiopia Hub"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f3d32]/20 focus:border-[#0f3d32] transition text-sm text-gray-800 placeholder-gray-400"
                    />
                  </div>

                  {/* Industry & Stage */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <IndustrySelectWithOther
                      label="Industry"
                      value={industry}
                      onChange={setIndustry}
                      placeholder="Select Industry"
                      labelClassName="block text-xs font-bold text-gray-900"
                      selectClassName="mt-2 w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f3d32]/20 focus:border-[#0f3d32] transition text-sm text-gray-800 appearance-none"
                      inputClassName="mt-3 w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f3d32]/20 focus:border-[#0f3d32] transition text-sm text-gray-800"
                    />
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-2">Startup Stage</label>
                      <div className="relative">
                        <select
                          value={stage}
                          onChange={(e) => setStage(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f3d32]/20 focus:border-[#0f3d32] transition text-sm text-gray-800 appearance-none"
                        >
                          <option value="">Select Stage</option>
                          <option value="idea">Idea Stage</option>
                          <option value="prototype">Prototype</option>
                          <option value="mvp">MVP / Beta</option>
                          <option value="growth">Growth</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Short Summary */}
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2">Short Summary <span className="text-gray-400 font-normal">(50-200 characters)</span></label>
                    <input
                      type="text"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="A one-sentence elevator pitch"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f3d32]/20 focus:border-[#0f3d32] transition text-sm text-gray-800 placeholder-gray-400"
                      minLength={50}
                      maxLength={200}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">{summary.length}/200 characters</p>
                  </div>

                  {/* Problem Statement */}
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2">Problem Statement <span className="text-gray-400 font-normal">(100-500 characters)</span></label>
                    <textarea
                      rows="3"
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      placeholder="What specific problem are you solving in the Ethiopian market?"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f3d32]/20 focus:border-[#0f3d32] transition text-sm text-gray-800 placeholder-gray-400 resize-none"
                      minLength={100}
                      maxLength={500}
                    ></textarea>
                    <p className="text-[10px] text-gray-400 mt-1">{problem.length}/500 characters</p>
                  </div>

                  {/* Solution */}
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2">Solution <span className="text-gray-400 font-normal">(100-500 characters)</span></label>
                    <textarea
                      rows="3"
                      value={solution}
                      onChange={(e) => setSolution(e.target.value)}
                      placeholder="How does your startup solve this problem uniquely?"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f3d32]/20 focus:border-[#0f3d32] transition text-sm text-gray-800 placeholder-gray-400 resize-none"
                      minLength={100}
                      maxLength={500}
                    ></textarea>
                    <p className="text-[10px] text-gray-400 mt-1">{solution.length}/500 characters</p>
                  </div>

                  {/* Funding & Impact */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-2">Required Funding (USD)</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-4 text-gray-500 font-medium text-sm">$</span>
                        <input
                          type="text"
                          value={fundingGoal}
                          onChange={(e) => setFundingGoal(e.target.value.replace(/[^0-9]/g, ""))}
                          placeholder="50,000"
                          className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f3d32]/20 focus:border-[#0f3d32] transition text-sm text-gray-800 placeholder-gray-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-2">Expected Impact</label>
                      <input
                        type="text"
                        value={expectedImpact}
                        onChange={(e) => setExpectedImpact(e.target.value)}
                        placeholder="e.g. 500+ jobs created"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f3d32]/20 focus:border-[#0f3d32] transition text-sm text-gray-800 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        const draftData = {
                          projectTitle,
                          industry,
                          stage,
                          summary,
                          problem,
                          solution,
                          fundingGoal,
                          expectedImpact,
                        };
                        if (!saveDraft(DRAFT_KEY, draftData)) {
                          setError("Could not save your draft in this browser. Check browser storage permissions and try again.");
                          return;
                        }
                        setError(null);
                        setShowDraftNotice(true);
                        const savedAt = getDraftSavedAt(DRAFT_KEY);
                        setDraftSavedAt(formatSavedTime(savedAt));
                        setTimeout(() => setShowDraftNotice(false), 2000);
                      }}
                      disabled={isEditMode}
                      className="px-6 py-3.5 bg-white border border-[#0f3d32] text-[#0f3d32] font-bold rounded-lg hover:bg-gray-50 transition text-xs shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {showDraftNotice ? "Draft Saved" : "Save Draft"}
                    </button>
                    {draftSavedAt && !isEditMode && (
                      <span className="text-[10px] text-gray-500">Auto-saved {draftSavedAt}</span>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3.5 bg-[#0f3d32] hover:bg-[#0a2921] text-white font-bold rounded-lg transition shadow-md text-xs disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {loading ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Submit Edit" : "Continue to Documents")}
                    </button>
                    {!isEditMode && (
                      <button
                        type="button"
                        disabled
                        className="px-6 py-3.5 bg-white border border-gray-200 text-gray-300 font-bold rounded-lg text-xs ml-auto cursor-not-allowed"
                      >
                        Publish Project
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column (Preview Widget) */}
            <div className="flex flex-col gap-4">
              {/* Preview Card */}
              <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden sticky top-[100px]">
                {/* Header */}
                <div className="bg-[#0f3d32] px-5 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <svg className="w-4 h-4 text-[#a5d6a7]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    Investor Preview
                  </div>
                  <span className="bg-[#1a5144] text-[#a5d6a7] text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md">Draft Mode</span>
                </div>

                <div className="p-5">
                  {/* Image Placeholder */}
<label htmlFor="coverPhotoInput" className="relative w-full h-36 bg-[#f8fafc] border-2 border-dashed border-gray-200 rounded-xl mb-5 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-[#0f3d32] hover:text-[#0f3d32] transition group">
                      {coverPreviewUrl ? (
                        <img src={coverPreviewUrl} alt="Project cover preview" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <>
                          <svg className="w-6 h-6 mb-2 text-gray-300 group-hover:text-[#0f3d32] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                          <span className="text-[10px] font-bold">Click to upload cover photo</span>
                        </>
                      )}
                      <input
                        id="coverPhotoInput"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setCoverPhoto(file);
                          if (file) {
                            setCoverPreviewUrl(URL.createObjectURL(file));
                          } else {
                            setCoverPreviewUrl(null);
                          }
                        }}
                      />
                    </label>

                  {/* Title & Stage */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-[#0f3d32]">{projectTitle || "[Project Name]"}</h3>
                    <span className="bg-[#eaf4f1] text-[#136150] text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-[#cde5dd]">{stage || "[STAGE]"}</span>
                  </div>

                  <p className="text-xs text-gray-400 italic mb-6">{summary ? `"${summary}"` : "Your short summary will appear here..."}</p>

                  {/* Metrics */}
                  <div className="flex gap-8 mb-6 border-b border-gray-100 pb-5">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Target</p>
                      <p className="text-sm font-bold text-[#0f3d32]">${fundingGoal ? Number(fundingGoal).toLocaleString() : "0"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Impact</p>
                      <p className="text-sm font-bold text-[#0f3d32]">{expectedImpact || "TBD"}</p>
                    </div>
                  </div>

                  {/* Problem & Solution Outline */}
                  <h4 className="text-xs font-bold text-gray-900 mb-4">Problem & Solution</h4>

                  <div className="flex flex-col gap-3 mb-8">
                    {/* Problem Block */}
                    <div className="pl-3 border-l-2 border-red-200">
                      <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-1.5">The Problem</p>
                      <div className="w-full h-2 bg-gray-100 rounded-full mb-1"></div>
                      <div className="w-4/5 h-2 bg-gray-100 rounded-full"></div>
                    </div>

                    {/* Solution Block */}
                    <div className="pl-3 border-l-2 border-[#a5d6a7] mt-1">
                      <p className="text-[9px] font-bold text-[#136150] uppercase tracking-widest mb-1.5">The Solution</p>
                      <div className="w-full h-2 bg-gray-100 rounded-full mb-1"></div>
                      <div className="w-3/5 h-2 bg-gray-100 rounded-full"></div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex justify-center items-center gap-2 py-3 border-t border-gray-100 text-gray-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    <span className="text-xs font-bold">Express Interest</span>
                  </div>
                </div>
              </div>

              {/* Tip Card */}
              <div className="bg-[#e8f5e9] rounded-xl p-4 flex items-start gap-3 border border-[#c8e6c9]">
                <div className="text-[#0f3d32] shrink-0 mt-0.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm9-21H3v20h18V1zm-2 18H5V3h14v16z" />
                    <path d="M11 7h2v2h-2zm0 4h2v6h-2z" />
                  </svg>
                </div>
                <p className="text-[11px] font-bold text-[#0f3d32] leading-snug">
                  Tip: Startups with clear impact metrics and a strong problem statement receive 3x more investor interest.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Popup */}
        {showSuccessPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Project Updated Successfully!</h3>
                <p className="text-sm text-gray-600 mb-6">Your project has been updated and the changes are now saved.</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={closePopup}
                    className="px-6 py-3 bg-[#0f3d32] hover:bg-[#0a2921] text-white font-bold rounded-lg transition text-sm"
                  >
                    View My Projects
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Popup */}
        {showErrorPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Update Failed</h3>
                <p className="text-sm text-gray-600 mb-6">There was an error updating your project. Please try again.</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowErrorPopup(false)}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-lg transition text-sm"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
