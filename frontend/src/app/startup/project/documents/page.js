"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/startup/Sidebar";
import { getDocuments, uploadDocument, getMyProjects } from "@/lib/startupApi";

export default function StartupProjectDocuments() {
  const router = useRouter();
  const [currentProjectId, setCurrentProjectId] = useState(null);
  
  const [projectDocuments, setProjectDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("project");
    if (projectId) {
      setCurrentProjectId(projectId);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [docsData, projectsData] = await Promise.all([
          getDocuments(),
          getMyProjects()
        ]);
        // Filter out startup registration documents (those without project_id)
        const projectDocs = (docsData.documents || []).filter(
          (doc) => doc.project_id && (!currentProjectId || String(doc.project_id) === currentProjectId)
        );
        setProjectDocuments(projectDocs);
        setProjects(projectsData.projects || []);
      } catch (err) {
        setError(err.message || "Unable to load data.");
      }
    }
    loadData();
  }, [currentProjectId]);

  async function handleUpload(event) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!file) {
      setError("Please choose a document to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (description) formData.append("description", description);
    // If we have a current project ID, associate the document with it
    if (currentProjectId) {
      formData.append("project_id", currentProjectId);
    } else if (projects.length > 0) {
      // Use the most recent project if no specific project ID
      formData.append("project_id", projects[0].project_id);
    }

    setLoading(true);
    try {
      await uploadDocument(formData);
      setSuccess("Document uploaded successfully.");
      setFile(null);
      setDescription("");
      const data = await getDocuments();
      const projectDocs = (data.documents || []).filter(
        (doc) => doc.project_id && (!currentProjectId || String(doc.project_id) === currentProjectId)
      );
      setProjectDocuments(projectDocs);
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVideoUpload(event) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!videoFile) {
      setError("Please choose a video file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", videoFile);
    formData.append("description", "Project video");
    // If we have a current project ID, associate the video with it
    if (currentProjectId) {
      formData.append("project_id", currentProjectId);
    } else if (projects.length > 0) {
      // Use the most recent project if no specific project ID
      formData.append("project_id", projects[0].project_id);
    }

    setLoading(true);
    try {
      await uploadDocument(formData);
      setSuccess("Video uploaded successfully.");
      setVideoFile(null);
      const data = await getDocuments();
      const projectDocs = (data.documents || []).filter(
        (doc) => doc.project_id && (!currentProjectId || String(doc.project_id) === currentProjectId)
      );
      setProjectDocuments(projectDocs);
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleCreateProject() {
    setError(null);
    if (projectDocuments.length === 0) {
      setError("Upload at least one document before creating your project.");
      return;
    }
    setShowSuccessPopup(true);
  }

  function closePopup() {
    setShowSuccessPopup(false);
    router.push("/startup/project");
  }

  return (
    <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto">
        <header className="flex justify-between items-center px-8 py-5 bg-white border-b border-gray-100 sticky top-0 z-10">
          <div>
            <h1 className="text-3xl font-bold text-[#0f3d32] tracking-tight">Project Documents</h1>
            <p className="text-sm text-gray-500 mt-1">Upload required files and keep all startup documents accessible in one place.</p>
          </div>
        </header>

        <div className="px-4 sm:px-10 py-10 w-full max-w-[1000px] mx-auto pb-24">
          {error && <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          {success && <div className="mb-6 rounded-3xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{success}</div>}

          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-[30px] border border-gray-100 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Upload a document</h2>
              <form onSubmit={handleUpload} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Document <span className="text-red-500">*</span></label>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-700"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload project documents (PDF, PNG, JPG)</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Project Video (Optional - MP4)</label>
                  <input
                    type="file"
                    accept="video/mp4,video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-700"
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload a project video (MP4 format recommended)</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Description (optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:border-[#0f3d32] focus:ring-2 focus:ring-[#0f3d32]/20"
                    placeholder="Example: Pitch deck, financial model, or supporting document"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-2xl bg-[#0f3d32] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a2921] transition disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? "Uploading…" : "Upload Document"}
                  </button>
                  {videoFile && (
                    <button
                      type="button"
                      onClick={handleVideoUpload}
                      disabled={loading}
                      className="inline-flex items-center justify-center rounded-2xl bg-[#0f3d32] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a2921] transition disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? "Uploading…" : "Upload Video"}
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="rounded-[30px] border border-gray-100 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Project Documents</h2>
              {projectDocuments.length === 0 ? (
                <p className="text-sm text-gray-500">No project documents uploaded yet. Upload at least one document to create your project.</p>
              ) : (
                <div className="space-y-4">
                  {projectDocuments.map((doc) => (
                    <div key={doc.document_id} className="rounded-3xl border border-gray-100 bg-[#f8fafc] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-gray-900">{doc.file_name}</p>
                          <p className="text-xs text-gray-500 mt-1">{doc.description || "No description"}</p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{doc.file_type || "FILE"}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                        <span>{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "Unknown date"}</span>
                        <span>{doc.file_size_bytes ? `${(doc.file_size_bytes / 1024).toFixed(1)} KB` : "Unknown size"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-200 mt-8">
            <Link href="/startup/project" className="px-8 py-3.5 bg-white border border-[#0f3d32] text-[#0f3d32] font-bold rounded-lg hover:bg-gray-50 transition text-sm shadow-sm">
              Back to My Projects
            </Link>
            <div className="flex items-center gap-4 ml-auto">
              <span className="text-[11px] text-gray-400 font-medium italic hidden sm:block">Auto-saving progress...</span>
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={handleCreateProject}
                  disabled={projectDocuments.length === 0}
                  className="px-8 py-3.5 bg-[#0f3d32] hover:bg-[#0a2921] text-white font-bold rounded-lg transition shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Project
                </button>
                {projectDocuments.length === 0 && (
                  <span className="text-[11px] text-gray-400 italic">Upload at least one document to finish project creation.</span>
                )}
              </div>
              <Link href="/startup/project/create" className="px-8 py-3.5 bg-white border border-[#0f3d32] text-[#0f3d32] font-bold rounded-lg hover:bg-gray-50 transition text-sm shadow-sm">
                + Create Another Project
              </Link>
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
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Project Created Successfully!</h3>
                  <p className="text-sm text-gray-600 mb-6">Your project has been created and is now visible to investors.</p>
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
        </div>
      </main>
    </div>
  );
}
