"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/startup/Sidebar";
import StartupApplicationLayout from "@/components/startup/StartupApplicationLayout";
import { PendingApprovalBlock } from "@/components/startup/PendingApprovalNotice";
import { useStartupApproval } from "@/hooks/useStartupApproval";
import {
  buildInvestmentProposalMessage,
  requiredDocumentsMet,
} from "@/lib/applicationFormUtils";
import {
  createInvestmentRequest,
  getDocuments,
  getMyProjects,
  getStartupOffers,
  getStartupProfile,
  searchInvestors,
} from "@/lib/startupApi";
import { buildSentOfferLookup, getSentInvestorOffer } from "@/lib/offerUtils";

const INDUSTRIES = [
  "Agriculture",
  "Agro-processing",
  "Construction",
  "Education",
  "Energy",
  "Environment and Water",
  "Finance and Insurance",
  "Food and Beverage",
  "Health and Wellness",
  "ICT / Technology",
  "Logistics and Transportation",
  "Manufacturing",
  "Media and Entertainment",
  "Mining and Extractives",
  "Professional Services",
  "Real Estate",
  "Retail and Consumer Goods",
  "Tourism and Hospitality",
  "Textiles and Apparel",
];

export default function InvestorOfferPage() {
  const params = useParams();
  const { investorId } = params;

  const [investor, setInvestor] = useState(null);
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
    investment_amount: "",
    use_of_funds: "",
    milestones: "",
    message: "",
  });
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, [investorId]);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const [startupRes, projectsRes, docsRes, searchRes, offersData] = await Promise.all([
        getStartupProfile(),
        getMyProjects(),
        getDocuments().catch(() => ({ documents: [] })),
        searchInvestors({ query: "" }),
        getStartupOffers().catch(() => ({ offers: [] })),
      ]);

      const lookup = buildSentOfferLookup(offersData.offers || []);
      setExistingOffer(getSentInvestorOffer(lookup, investorId));

      const found = searchRes.investors?.find((i) => i.investor_id === parseInt(investorId, 10));
      if (!found) {
        setError("Investor not found.");
        return;
      }

      setInvestor(found);
      const s = startupRes.startup || startupRes;
      setStartup(s);
      setProjects(projectsRes.projects || []);
      setDocuments(docsRes.documents || []);

      const firstProject = (projectsRes.projects || [])[0];
      setFormData({
        startup_name: s.startup_name || "",
        industry: s.industry || "",
        project_id: firstProject ? String(firstProject.project_id) : "",
        investment_amount: s.funding_needed ? String(s.funding_needed) : "",
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
    if (!formData.project_id) errors.project_id = "Select a project";
    const amount = parseFloat(formData.investment_amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.investment_amount = "Enter a valid funding amount";
    }
    if (!formData.use_of_funds.trim()) {
      errors.use_of_funds = "Describe how funds will be used";
    } else if (formData.use_of_funds.trim().length < 30) {
      errors.use_of_funds = "Please provide at least 30 characters";
    }
    const proposal = buildInvestmentProposalMessage(formData);
    if (proposal.length < 50) {
      errors.use_of_funds = "Add more detail across use of funds, milestones, or message";
    }
    if (!requiredDocumentsMet(documents, formData.project_id)) {
      errors.documents = "Upload required documents first";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError(null);
      
      await createInvestmentRequest({
        investor_id: parseInt(investorId, 10),
        project_id: parseInt(formData.project_id, 10),
        requested_amount: parseFloat(formData.investment_amount),
        proposal_message: buildInvestmentProposalMessage(formData),
      });
      setSuccess(true);
    } catch (err) {
      if (err.status === 409) {
        const existing = err.data?.existing_offer || err.data?.offer;
        const offerId = existing?.id || existing?.investment_request_id;
        if (offerId) {
          setExistingOffer({
            offerType: "investment",
            id: offerId,
            status: existing?.status,
          });
          setError(null);
        } else {
          setError(err.message || "You already have an active request with this investor.");
        }
      } else {
        setError(err.message || "Failed to submit application. Please try again.");
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
        <PendingApprovalBlock title="Investment applications unavailable" />
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Application already sent</h2>
            <p className="text-gray-600 mb-6">
              You already have an active investment request with this investor
              {existingOffer.status ? ` (${existingOffer.status})` : ""}.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={`/startup/offers/investment/${existingOffer.id}`}
                className="inline-flex items-center justify-center rounded-xl bg-[#0f3d32] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a2921]"
              >
                View application
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Application submitted</h2>
            <p className="text-gray-600 mb-6">
              Your investment request was sent successfully. The investor will review your application soon.
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

  if (!investor) {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || "Investor not found"}</p>
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
      <main className="flex-grow overflow-y-auto">
        <StartupApplicationLayout
          kind="investment"
          contact={investor}
          startup={startup}
          projects={projects}
          documents={documents}
          formData={formData}
          validationErrors={validationErrors}
          onChange={handleChange}
          onSubmit={handleSubmit}
          submitting={submitting}
          error={error}
          changeContactHref="/startup/discover"
          documentsUploadHref={documentsHref}
          discoverHref="/startup/discover"
        />
      </main>
    </div>
  );
}
