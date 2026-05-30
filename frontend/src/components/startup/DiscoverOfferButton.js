import Link from "next/link";
import { getSentInvestorOffer, getSentMentorOffer } from "@/lib/offerUtils";

export default function DiscoverOfferButton({
  type,
  contactId,
  offerLookup,
  variant = "card",
  disabled = false,
  disabledReason = "Complete email verification and admin approval before using this action.",
  profileHref,
}) {
  const existingOffer =
    type === "investment"
      ? getSentInvestorOffer(offerLookup, contactId)
      : getSentMentorOffer(offerLookup, contactId);

  const offerHref =
    type === "investment"
      ? `/startup/discover/investor/${contactId}/offer`
      : `/startup/discover/mentor/${contactId}/offer`;

  const defaultProfileHref =
    type === "investment"
      ? `/startup/discover/investor/${contactId}`
      : `/startup/discover/mentor/${contactId}`;

  const viewHref = profileHref || defaultProfileHref;

  if (variant === "discover") {
    if (existingOffer) {
      return (
        <div className="grid grid-cols-2 gap-3">
          {approvedViewLink(disabled, viewHref, "View Profile")}
          <Link
            href={`/startup/offers/${existingOffer.offerType}/${existingOffer.id}`}
            className="inline-flex items-center justify-center rounded-lg bg-[#0f3d32] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0a2921] transition text-center"
          >
            View application
          </Link>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3">
        {approvedViewLink(disabled, viewHref, "View Profile")}
        {disabled ? (
          <span
            className="inline-flex items-center justify-center rounded-lg bg-amber-100 px-4 py-2.5 text-sm font-bold text-amber-800 cursor-not-allowed text-center"
            title={disabledReason}
          >
            Approval needed
          </span>
        ) : (
          <Link
            href={offerHref}
            className="inline-flex items-center justify-center rounded-lg bg-[#0f3d32] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0a2921] transition text-center"
          >
            Apply
          </Link>
        )}
      </div>
    );
  }

  if (existingOffer) {
    const href = `/startup/offers/${existingOffer.offerType}/${existingOffer.id}`;
    const className =
      variant === "primary"
        ? "inline-flex items-center justify-center rounded-2xl border border-[#0f3d32] bg-[#f0faf5] px-8 py-4 text-sm font-semibold text-[#0f3d32] transition hover:bg-[#e1f4e7]"
        : "rounded-full border border-[#0f3d32] bg-[#f0faf5] px-4 py-2 text-xs font-semibold text-[#0f3d32] transition hover:bg-[#e1f4e7]";

    return (
      <Link href={href} className={className}>
        Offer sent — view status
      </Link>
    );
  }

  const className =
    variant === "primary"
      ? "inline-flex items-center justify-center rounded-2xl bg-[#0f3d32] px-8 py-4 text-sm font-semibold text-white transition hover:bg-[#0b2a1d]"
      : "rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-100";

  if (disabled) {
    return (
      <span
        className={`${className} cursor-not-allowed opacity-50`}
        title={disabledReason}
      >
        Approval needed
      </span>
    );
  }

  return (
    <Link href={offerHref} className={className}>
      Make an Offer
    </Link>
  );
}

function approvedViewLink(disabled, href, label) {
  if (disabled) {
    return (
      <span className="inline-flex items-center justify-center rounded-lg border-2 border-amber-200 px-4 py-2.5 text-sm font-bold text-amber-700 cursor-not-allowed text-center">
        Locked
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-lg border-2 border-[#0f3d32] px-4 py-2.5 text-sm font-bold text-[#0f3d32] hover:bg-[#f0faf5] transition text-center"
    >
      {label}
    </Link>
  );
}
