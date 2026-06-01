import { formatMoney, formatTicketRange } from "@/lib/discoverProfileUtils";

export const APPLICATION_DOC_SLOTS = [
  { key: "pitch_deck", label: "Pitch Deck", required: true },
  { key: "business_plan", label: "Business Plan", required: true },
  { key: "financial_doc", label: "Financial Statement", required: true },
  { key: "demo_video", label: "Demo Video", required: false },
];

function normalizeLabel(value) {
  return String(value || "").trim().toLowerCase().replace(/_/g, " ");
}

export function findDocForSlot(documents, slot) {
  const label = normalizeLabel(slot.label);
  const key = normalizeLabel(slot.key);
  return documents.find((d) => {
    const desc = normalizeLabel(d.description);
    const category = normalizeLabel(d.document_category);
    return desc === label || desc === key || category === key || desc.includes(key);
  });
}

export function resolveApplicationDocuments(documents, projectId) {
  const pid = projectId ? Number(projectId) : null;
  if (!pid) {
    return (documents || []).filter((d) => !d.project_id);
  }
  return (documents || []).filter((d) => !d.project_id || Number(d.project_id) === pid);
}

export function buildDocumentSlotRows(documents, projectId) {
  const scoped = resolveApplicationDocuments(documents, projectId);
  return APPLICATION_DOC_SLOTS.map((slot) => {
    const doc = findDocForSlot(scoped, slot);
    const uploaded = Boolean(doc?.file_path);
    return {
      ...slot,
      doc,
      uploaded,
      status: uploaded ? "uploaded" : slot.required ? "pending" : "optional",
    };
  });
}

export function requiredDocumentsMet(documents, projectId) {
  const rows = buildDocumentSlotRows(documents, projectId);
  return rows.filter((r) => r.required).every((r) => r.uploaded);
}

export function investorDisplayName(investor) {
  return (
    investor?.organization_name ||
    `${investor?.first_name || ""} ${investor?.last_name || ""}`.trim() ||
    "Investor"
  );
}

export function mentorDisplayName(mentor) {
  return `${mentor?.first_name || ""} ${mentor?.last_name || ""}`.trim() || "Mentor";
}

export function contactLocation(contact, kind) {
  if (kind === "investment") {
    return (
      contact?.country ||
      contact?.location_preference ||
      contact?.location ||
      null
    );
  }
  return (
    contact?.city_location ||
    contact?.location ||
    contact?.country ||
    null
  );
}

export function contactRangeLabel(contact, kind) {
  if (kind === "investment") {
    return formatTicketRange(contact, "investor");
  }
  return formatTicketRange(contact, "mentor");
}

export function contactTags(contact, kind) {
  if (kind === "investment") {
    return [contact?.investment_stage, contact?.investor_type, contact?.preferred_industry]
      .filter(Boolean)
      .slice(0, 2);
  }
  return [contact?.professional_title, contact?.primary_industry, contact?.mentor_type]
    .filter(Boolean)
    .slice(0, 2);
}

export function isContactActive(contact, kind) {
  if (kind === "investment") {
    return contact?.user_approved !== false && contact?.investor_listed !== false;
  }
  return contact?.user_approved !== false && contact?.mentor_listed !== false;
}

export function formatAmountInput(value) {
  const n = Number(String(value || "").replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function buildInvestmentProposalMessage({ useOfFunds, milestones, message }) {
  const parts = [];
  if (useOfFunds?.trim()) {
    parts.push(`Use of funds:\n${useOfFunds.trim()}`);
  }
  if (milestones?.trim()) {
    parts.push(`Expected milestones:\n${milestones.trim()}`);
  }
  if (message?.trim()) {
    parts.push(`Message to investor:\n${message.trim()}`);
  }
  return parts.join("\n\n");
}

export function buildMentorshipMessage({ goals, milestones, message, paymentOffer }) {
  const parts = [];
  if (goals?.trim()) {
    parts.push(`Mentorship goals:\n${goals.trim()}`);
  }
  if (milestones?.trim()) {
    parts.push(`Expected outcomes:\n${milestones.trim()}`);
  }
  if (message?.trim()) {
    parts.push(`Message to mentor:\n${message.trim()}`);
  }
  if (paymentOffer) {
    parts.push(`Payment offer: $${paymentOffer}`);
  }
  return parts.join("\n\n");
}

export function founderDisplayName(startup) {
  return (
    startup?.founder_full_name ||
    [startup?.first_name, startup?.last_name].filter(Boolean).join(" ") ||
    "Founder"
  );
}

function extractSection(text, labels) {
  if (!text) return "";
  const normalized = String(text);
  for (const label of labels) {
    const pattern = new RegExp(`${label}\\s*:\\s*`, "i");
    const match = normalized.match(pattern);
    if (!match) continue;
    const start = match.index + match[0].length;
    const rest = normalized.slice(start);
    const nextHeader = rest.search(/\n(?:Use of funds|Expected milestones|Expected outcomes|Mentorship goals|Message to investor|Message to mentor|Payment offer)\s*:/i);
    const body = (nextHeader >= 0 ? rest.slice(0, nextHeader) : rest).trim();
    if (body) return body;
  }
  return "";
}

/** Parse structured application body saved in proposal_message or mentorship message. */
export function parseApplicationMessage(rawMessage, kind) {
  const text = String(rawMessage || "").trim();
  if (!text) {
    return {
      useOfFunds: "",
      milestones: "",
      message: "",
      paymentOffer: "",
      raw: "",
    };
  }

  if (kind === "investment") {
    const useOfFunds = extractSection(text, ["Use of funds"]);
    const milestones = extractSection(text, ["Expected milestones"]);
    const message = extractSection(text, ["Message to investor"]);
    const structured = useOfFunds || milestones || message;
    return {
      useOfFunds: useOfFunds || (!structured ? text : ""),
      milestones,
      message,
      paymentOffer: "",
      raw: text,
    };
  }

  const useOfFunds = extractSection(text, ["Mentorship goals"]);
  const milestones = extractSection(text, ["Expected outcomes"]);
  const message = extractSection(text, ["Message to mentor"]);
  const paymentMatch = text.match(/Payment offer:\s*\$?([\d,.]+)/i);
  const paymentOffer = paymentMatch ? paymentMatch[1].replace(/,/g, "") : "";
  const structured = useOfFunds || milestones || message || paymentOffer;

  return {
    useOfFunds: useOfFunds || (!structured ? text : ""),
    milestones,
    message,
    paymentOffer,
    raw: text,
  };
}

export function formatApplicationStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s === "approved") return "Accepted";
  if (s === "pending") return "Pending";
  if (s === "rejected") return "Rejected";
  if (s === "cancelled") return "Cancelled";
  return status ? String(status).charAt(0).toUpperCase() + String(status).slice(1) : "Unknown";
}

export function statusBadgeClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "bg-gray-100 text-gray-600";
  if (s === "approved" || s === "accepted") return "bg-[#f0fdf4] text-[#16a34a]";
  if (s === "rejected") return "bg-red-50 text-red-700";
  return "bg-gray-100 text-gray-500";
}

export function offerToContact(offer, kind) {
  if (kind === "investment") {
    return {
      organization_name: offer.company,
      first_name: offer.first_name,
      last_name: offer.last_name,
      country: offer.country,
      location_preference: offer.location_preference,
      investment_stage: offer.investment_stage,
      investor_type: offer.investor_type,
      preferred_industry: offer.preferred_industry,
      investment_budget: offer.investment_budget,
      user_approved: true,
      investor_listed: true,
    };
  }
  return {
    first_name: offer.first_name,
    last_name: offer.last_name,
    country: offer.country,
    professional_title: offer.professional_title,
    primary_industry: offer.primary_industry,
    mentor_type: offer.headline,
    session_pricing: offer.session_pricing,
    user_approved: true,
    mentor_listed: true,
  };
}
