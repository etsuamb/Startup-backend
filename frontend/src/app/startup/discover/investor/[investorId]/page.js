"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/startup/Sidebar";
import DiscoverProfileLayout from "@/components/startup/DiscoverProfileLayout";
import { PendingApprovalBlock } from "@/components/startup/PendingApprovalNotice";
import { useStartupApproval } from "@/hooks/useStartupApproval";
import {
  buildInvestorMatchChecks,
  findInvestorRecommendation,
  formatTicketRange,
  parseTagList,
} from "@/lib/discoverProfileUtils";
import {
  getDiscoverInvestor,
  getInvestorRecommendations,
  getStartupOffers,
  getStartupProfile,
  searchInvestors,
} from "@/lib/startupApi";
import { buildSentOfferLookup, getSentInvestorOffer } from "@/lib/offerUtils";

function investorDisplayName(investor) {
  return (
    investor.organization_name ||
    `${investor.first_name || ""} ${investor.last_name || ""}`.trim() ||
    "Investor"
  );
}

function buildInvestorProfile(investor) {
  const location =
    [investor.location_preference, investor.country].filter(Boolean).join(", ") ||
    investor.location ||
    null;

  const activeSince = investor.created_at
    ? new Date(investor.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  const portfolioCount = Number(investor.portfolio_size);
  const startupsFunded = Number.isFinite(portfolioCount) && portfolioCount > 0
    ? `${portfolioCount} ${portfolioCount === 1 ? "Company" : "Companies"}`
    : null;

  return {
    displayName: investorDisplayName(investor),
    isActive: investor.user_approved !== false && investor.investor_listed !== false,
    location,
    entityType: investor.investor_type || "Investor",
    bio:
      investor.bio ||
      `Focuses on supporting early-stage startups${investor.preferred_industry ? ` in ${investor.preferred_industry}` : ""}.`,
    ticketRange: formatTicketRange(investor, "investor"),
    fundingType: investor.investment_stage ? "Equity / Convertibles" : null,
    overview: [
      { label: "Organization Name", value: investorDisplayName(investor) },
      { label: "Investor Type", value: investor.investor_type },
      { label: "Primary Focus", value: investor.preferred_industry || investor.industry },
      {
        label: "HQ Location",
        value: investor.country
          ? `${investor.country}${investor.location_preference ? ` · ${investor.location_preference}` : ""}`
          : investor.location_preference,
      },
      { label: "Active Since", value: activeSince },
      { label: "Startups Funded", value: startupsFunded },
    ],
    detailPills: [
      { label: "Preferred Stage", value: investor.investment_stage || "—" },
      {
        label: "Typical Budget",
        value: formatTicketRange(investor, "investor") || investor.investment_range || "—",
      },
    ].filter((p) => p.value && p.value !== "—"),
    industryTags: parseTagList(investor.preferred_industry || investor.industry || investor.sector),
  };
}

export default function InvestorDetailsPage() {
  const params = useParams();
  const { investorId } = params;
  const [investor, setInvestor] = useState(null);
  const [privacy, setPrivacy] = useState(null);
  const [startup, setStartup] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offerLookup, setOfferLookup] = useState({ investors: new Map(), mentors: new Map() });
  const { pending, loading: approvalLoading } = useStartupApproval();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [detailRes, offersData, profileRes, recRes] = await Promise.all([
          getDiscoverInvestor(investorId).catch(() => null),
          getStartupOffers().catch(() => ({ offers: [] })),
          getStartupProfile().catch(() => null),
          getInvestorRecommendations({ limit: 50 }).catch(() => ({ recommendations: [] })),
        ]);
        setOfferLookup(buildSentOfferLookup(offersData.offers || []));
        setStartup(profileRes?.startup || profileRes || null);
        setRecommendations(recRes.recommendations || []);
        if (detailRes?.investor) {
          setInvestor(detailRes.investor);
          setPrivacy(detailRes.privacy || detailRes.investor.privacy || null);
        } else {
          const searchRes = await searchInvestors({ query: "" });
          const found = searchRes.investors?.find((i) => i.investor_id === parseInt(investorId, 10));
          if (found) {
            setInvestor(found);
            setPrivacy(found.privacy || null);
          } else setError("Investor not found");
        }
      } catch (err) {
        setError(err.message || "Failed to load investor details.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [investorId]);

  const recommendation = useMemo(
    () => findInvestorRecommendation(recommendations, investorId),
    [recommendations, investorId],
  );

  const profile = useMemo(() => (investor ? buildInvestorProfile(investor) : null), [investor]);

  const match = useMemo(() => {
    if (!investor) return { percent: 0, checks: [], blurb: "" };
    const rec = recommendation;
    const startupProfile = {
      industry: startup?.industry,
      stage: startup?.business_stage,
      funding_need: startup?.funding_needed,
      lifecycle_stage: startup?.business_stage,
    };
    return {
      percent: rec?.match_percent ?? Math.round((rec?.score ?? 0.5) * 100) ?? 72,
      checks: buildInvestorMatchChecks(investor, startupProfile, rec),
      blurb:
        rec?.reason ||
        `Strong alignment with your ${startup?.industry || "startup"} focus and funding goals.`,
    };
  }, [investor, recommendation, startup]);

  if (!approvalLoading && pending) {
    return (
      <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
        <Sidebar />
        <PendingApprovalBlock title="Investor details unavailable" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-sm text-gray-500">Loading investor profile…</p>
        </main>
      </div>
    );
  }

  if (error || !investor || !profile) {
    return (
      <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
        <Sidebar />
        <main className="flex-grow flex items-center justify-center">
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

  const sentOffer = getSentInvestorOffer(offerLookup, investorId);

  return (
    <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
      <Sidebar />
      <DiscoverProfileLayout
        kind="investor"
        contact={investor}
        profile={profile}
        match={match}
        portfolioItems={[]}
        offerLookup={offerLookup}
        contactId={investorId}
        startup={startup}
        privacy={privacy}
        footerExtra={
          sentOffer ? (
            <div className="rounded-2xl border border-[#cfe8dc] bg-[#f0faf5] p-5 text-sm text-[#0f3d32]">
              You already sent an investment request to this investor. Track it from your offers page.
            </div>
          ) : null
        }
      />
    </div>
  );
}
