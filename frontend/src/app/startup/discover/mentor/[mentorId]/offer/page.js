"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/startup/Sidebar";
import { getStartupProfile, createMentorshipRequest, getStartupOffers } from "@/lib/startupApi";
import { buildSentOfferLookup, getSentMentorOffer } from "@/lib/offerUtils";

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

export default function MentorOfferPage() {
  const params = useParams();
  const router = useRouter();
  const { mentorId } = params;
  
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    startup_name: "",
    industry: "",
    description: "",
    payment_offer: "",
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [existingOffer, setExistingOffer] = useState(null);

  useEffect(() => {
    fetchStartupProfile();
  }, []);

  async function fetchStartupProfile() {
    try {
      setLoading(true);
      const [response, offersData] = await Promise.all([
        getStartupProfile(),
        getStartupOffers().catch(() => ({ offers: [] })),
      ]);
      const lookup = buildSentOfferLookup(offersData.offers || []);
      setExistingOffer(getSentMentorOffer(lookup, mentorId));
      setStartup(response.startup);
      setFormData(prev => ({
        ...prev,
        startup_name: response.startup.startup_name || "",
        industry: response.startup.industry || "",
      }));
    } catch (err) {
      console.error("Failed to fetch startup profile:", err);
      setError("Failed to load startup profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setValidationErrors(prev => ({ ...prev, [name]: "" }));
  }

  function validateForm() {
    const errors = {};
    
    if (!formData.startup_name.trim()) {
      errors.startup_name = "Startup name is required";
    }
    
    if (!formData.industry) {
      errors.industry = "Industry is required";
    }
    
    if (!formData.description.trim()) {
      errors.description = "Description is required";
    } else if (formData.description.length < 50) {
      errors.description = "Description must be at least 50 characters";
    } else if (formData.description.length > 500) {
      errors.description = "Description must not exceed 500 characters";
    }
    
    if (!formData.payment_offer.trim()) {
      errors.payment_offer = "Payment offer is required";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      await createMentorshipRequest({
        mentor_id: parseInt(mentorId),
        subject: `Mentorship Request from ${formData.startup_name}`,
        message: `${formData.description}\n\nPayment Offer: $${formData.payment_offer}`,
      });
      
      setSuccess(true);
    } catch (err) {
      console.error("Failed to submit mentorship request:", err);
      if (err.status === 409) {
        setError(err.message || "You already have an active mentorship request with this mentor.");
        const offerId = err.data?.existing_offer?.id;
        if (offerId) {
          setExistingOffer({
            offerType: "mentorship",
            id: offerId,
            status: err.data?.existing_offer?.status,
          });
        }
      } else {
        setError("Failed to submit mentorship request. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7f9] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f3d32] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (existingOffer) {
    return (
      <div className="min-h-screen bg-[#f4f7f9] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Offer already sent</h2>
            <p className="text-gray-600 mb-6">
              You already have an active mentorship request with this mentor
              {existingOffer.status ? ` (${existingOffer.status})` : ""}.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={`/startup/offers/mentorship/${existingOffer.id}`}
                className="inline-flex items-center justify-center rounded-full bg-[#0f3d32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0b2a1d]"
              >
                View existing offer
              </Link>
              <Link
                href="/startup/discover"
                className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
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
      <div className="min-h-screen bg-[#f4f7f9] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="rounded-full bg-[#dcfce7] w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-[#166534]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Mentorship Request Sent!</h2>
            <p className="text-gray-600 mb-6">
              Your mentorship request has been submitted successfully. The mentor will review your request and get back to you soon.
            </p>
            <Link
              href="/startup/discover"
              className="inline-flex items-center justify-center rounded-full bg-[#0f3d32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0b2a1d]"
            >
              Back to Discover
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f9] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto">
        <header className="px-4 sm:px-8 py-8 bg-gradient-to-r from-[#0f3d32] via-[#115b4c] to-[#184f45] text-white sticky top-0 z-10 shadow-sm">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-[#b8f0d9]">Make an offer</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">Mentorship Offer</h1>
              <p className="mt-3 max-w-2xl text-sm text-[#d2f8e3]">
                Submit a mentorship request to this mentor with your startup details and offer.
              </p>
            </div>
            <Link
              href="/startup/discover"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              ← Back to discover
            </Link>
          </div>
        </header>

        <div className="px-4 sm:px-10 py-10 w-full max-w-[800px] mx-auto pb-24">
          {error && (
            <div className="mb-6 rounded-[28px] border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
              {error}
            </div>
          )}

          <div className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Startup Name
                </label>
                <input
                  type="text"
                  name="startup_name"
                  value={formData.startup_name}
                  onChange={handleChange}
                  placeholder="Enter your startup name"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm text-gray-900 outline-none transition focus:border-[#0f3d32] focus:ring-2 focus:ring-[#0f3d32]/20"
                />
                {validationErrors.startup_name && (
                  <p className="mt-2 text-xs text-red-600">{validationErrors.startup_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Industry
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm text-gray-900 outline-none transition focus:border-[#0f3d32] focus:ring-2 focus:ring-[#0f3d32]/20"
                >
                  <option value="">Select your industry</option>
                  {INDUSTRIES.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
                {validationErrors.industry && (
                  <p className="mt-2 text-xs text-red-600">{validationErrors.industry}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description of Mentorship Needed
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Describe what kind of mentorship you're looking for, specific areas where you need guidance, and what you hope to achieve..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm text-gray-900 outline-none transition focus:border-[#0f3d32] focus:ring-2 focus:ring-[#0f3d32]/20 resize-none"
                />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    Minimum 50 characters, maximum 500 characters
                  </p>
                  <p className="text-xs text-gray-500">
                    {formData.description.length}/500
                  </p>
                </div>
                {validationErrors.description && (
                  <p className="mt-2 text-xs text-red-600">{validationErrors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Payment Offer (USD)
                </label>
                <input
                  type="number"
                  name="payment_offer"
                  value={formData.payment_offer}
                  onChange={handleChange}
                  placeholder="Enter your payment offer"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm text-gray-900 outline-none transition focus:border-[#0f3d32] focus:ring-2 focus:ring-[#0f3d32]/20"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Enter the amount you're willing to pay for mentorship sessions
                </p>
                {validationErrors.payment_offer && (
                  <p className="mt-2 text-xs text-red-600">{validationErrors.payment_offer}</p>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center rounded-2xl bg-[#0f3d32] px-8 py-4 text-sm font-semibold text-white transition hover:bg-[#0b2a1d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Mentorship Request"}
                </button>
                <Link
                  href="/startup/discover"
                  className="inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-8 py-4 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
