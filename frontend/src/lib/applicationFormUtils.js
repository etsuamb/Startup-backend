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
    const uploaded = Boolean(doc?.file_path && !String(doc.file_path).startsWith("db://"));
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
  const price = formatMoney(contact?.session_pricing);
  return price ? `${price} / session` : null;
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
