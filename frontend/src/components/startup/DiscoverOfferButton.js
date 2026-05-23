import Link from "next/link";
import { getSentInvestorOffer, getSentMentorOffer } from "@/lib/offerUtils";

export default function DiscoverOfferButton({
  type,
  contactId,
  offerLookup,
  variant = "card",
}) {
  const existingOffer =
    type === "investment"
      ? getSentInvestorOffer(offerLookup, contactId)
      : getSentMentorOffer(offerLookup, contactId);

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

  const href =
    type === "investment"
      ? `/startup/discover/investor/${contactId}/offer`
      : `/startup/discover/mentor/${contactId}/offer`;

  const className =
    variant === "primary"
      ? "inline-flex items-center justify-center rounded-2xl bg-[#0f3d32] px-8 py-4 text-sm font-semibold text-white transition hover:bg-[#0b2a1d]"
      : "rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-100";

  return (
    <Link href={href} className={className}>
      Make an Offer
    </Link>
  );
}
