"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/startup/Sidebar";
import StartupApplicationLayout from "@/components/startup/StartupApplicationLayout";
import { PendingApprovalBlock } from "@/components/startup/PendingApprovalNotice";
import { useStartupApproval } from "@/hooks/useStartupApproval";
import { buildMentorshipMessage } from "@/lib/applicationFormUtils";
import {
  createMentorshipRequest,
  getDocuments,
  getMyProjects,
  getStartupOffers,
  getStartupProfile,
  searchMentors,
} from "@/lib/startupApi";
import { buildSentOfferLookup, getSentMentorOffer } from "@/lib/offerUtils";

export default function MentorOfferPage() {
  const params = useParams();
  const { mentorId } = params;

  const [mentor, setMentor] = useState(null);
  const [startup, setStartup] = useState(null);
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [existingOffer, setExistingOffer] = useState(null);
  const { pending, loading: approvalLoading } = useStartupApproval();

  const [formData, setFormData] = useState({
    startup_name: "",
    industry: "",
    project_id: "",
    payment_offer: "",
    use_of_funds: "",
    milestones: "",
    message: "",
  });
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, [mentorId]);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const [startupRes, projectsRes, docsRes, searchRes, offersData] = await Promise.all([
        getStartupProfile(),
        getMyProjects().catch(() => ({ projects: [] })),
        getDocuments().catch(() => ({ documents: [] })),
        searchMentors({ query: "" }),
        getStartupOffers().catch(() => ({ offers: [] })),
      ]);

      const lookup = buildSentOfferLookup(offersData.offers || []);
      setExistingOffer(getSentMentorOffer(lookup, mentorId));

      const found = searchRes.mentors?.find((m) => m.mentor_id === parseInt(mentorId, 10));
      if (!found) {
        setError("Mentor not found.");
        return;
      }

      setMentor(found);
      const s = startupRes.startup || startupRes;
      setStartup(s);
      setProjects(projectsRes.projects || []);
      setDocuments(docsRes.documents || []);

      const firstProject = (projectsRes.projects || [])[0];
      setFormData({
        startup_name: s.startup_name || "",
        industry: s.industry || "",
        project_id: firstProject ? String(firstProject.project_id) : "",
        payment_offer: found.session_pricing ? String(found.session_pricing) : "",
        use_of_funds: "",
        milestones: "",
        message: "",
      });
    } catch (err) {
      setError(err.message || "Failed to load application data.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(name, value) {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validateForm() {
    const errors = {};
    const payment = parseFloat(formData.payment_offer);
    if (!Number.isFinite(payment) || payment <= 0) {
      errors.payment_offer = "Enter a valid payment offer";
    }
    if (!formData.use_of_funds.trim()) {
      errors.use_of_funds = "Describe your mentorship goals";
    } else if (formData.use_of_funds.trim().length < 30) {
      errors.use_of_funds = "Please provide at least 30 characters";
    }
    const body = buildMentorshipMessage({
      goals: formData.use_of_funds,
      milestones: formData.milestones,
      message: formData.message,
      paymentOffer: formData.payment_offer,
    });
    if (body.length < 50) {
      errors.use_of_funds = "Add more detail about your goals and expectations";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    const startupName = formData.startup_name || startup?.startup_name || "Startup";
    const messageBody = buildMentorshipMessage({
      goals: formData.use_of_funds,
      milestones: formData.milestones,
      message: formData.message,
      paymentOffer: formData.payment_offer,
    });

    try {
      setSubmitting(true);
      setError(null);
      await createMentorshipRequest({
        mentor_id: parseInt(mentorId, 10),
        subject: `Mentorship request from ${startupName}`,
        message: messageBody,
      });
      setSuccess(true);
    } catch (err) {
      if (err.status === 409) {
        setError(err.message || "You already have an active request with this mentor.");
        const offerId = err.data?.existing_offer?.id;
        if (offerId) {
          setExistingOffer({
            offerType: "mentorship",
            id: offerId,
            status: err.data?.existing_offer?.status,
          });
        }
      } else {
        setError(err.message || "Failed to submit request. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const documentsHref = formData.project_id
    ? `/startup/project/documents?project=${formData.project_id}`
    : "/startup/project/documents";

  if (!approvalLoading && pending) {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900 flex">
        <Sidebar />
        <PendingApprovalBlock title="Mentorship applications unavailable" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-sm text-gray-500">Loading application…</p>
        </main>
      </div>
    );
  }

  if (existingOffer) {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Request already sent</h2>
            <p className="text-gray-600 mb-6">
              You already have an active mentorship request with this mentor
              {existingOffer.status ? ` (${existingOffer.status})` : ""}.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={`/startup/offers/mentorship/${existingOffer.id}`}
                className="inline-flex items-center justify-center rounded-xl bg-[#0f3d32] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a2921]"
              >
                View request
              </Link>
              <Link
                href="/startup/discover"
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                Back to Discover
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="rounded-full bg-[#dcfce7] w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-[#166534]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Request submitted</h2>
            <p className="text-gray-600 mb-6">
              Your mentorship request was sent successfully. The mentor will review it soon.
            </p>
            <Link
              href="/startup/discover"
              className="inline-flex items-center justify-center rounded-xl bg-[#0f3d32] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a2921]"
            >
              Back to Discover
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || "Mentor not found"}</p>
            <Link href="/startup/discover" className="text-sm font-bold text-[#0f3d32] hover:underline">
              Back to Discover
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto min-h-0">
        <StartupApplicationLayout
          kind="mentorship"
          contact={mentor}
          startup={startup}
          projects={projects}
          documents={documents}
          formData={formData}
          validationErrors={validationErrors}
          onChange={handleChange}
          onSubmit={handleSubmit}
          submitting={submitting}
          error={error}
          changeContactHref={`/startup/discover/mentor/${mentorId}`}
          documentsUploadHref={documentsHref}
        />
      </main>
    </div>
  );
}
