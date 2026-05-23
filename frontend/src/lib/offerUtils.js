const INACTIVE_STATUSES = new Set(["rejected", "withdrawn", "cancelled"]);

export function isActiveSentOffer(offer) {
  if (!offer || offer.source_direction !== "sent") return false;
  return !INACTIVE_STATUSES.has(String(offer.status || "").toLowerCase());
}

export function buildSentOfferLookup(offers = []) {
  const investors = new Map();
  const mentors = new Map();

  for (const offer of offers) {
    if (!isActiveSentOffer(offer)) continue;

    if (offer.offerType === "investment" && offer.investor_id != null) {
      investors.set(Number(offer.investor_id), offer);
    }
    if (offer.offerType === "mentorship" && offer.mentor_id != null) {
      mentors.set(Number(offer.mentor_id), offer);
    }
  }

  return { investors, mentors };
}

export function getSentInvestorOffer(lookup, investorId) {
  return lookup.investors.get(Number(investorId)) || null;
}

export function getSentMentorOffer(lookup, mentorId) {
  return lookup.mentors.get(Number(mentorId)) || null;
}

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let size = Number(bytes);
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function formatFolderLabel(folderName) {
  if (!folderName) return "Documents";
  return folderName
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
