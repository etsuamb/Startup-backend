"use client";

import { usePathname, useRouter } from "next/navigation";

const BACK_ROUTES = {
  "/about": "/",
  "/blog": "/",
  "/contact": "/",
  "/events": "/",
  "/faq": "/",
  "/login/forgot-password": "/login",
  "/login/google-role": "/login",
  "/login/verify-2fa": "/login",
  "/reset-password": "/login",
  "/verify-email": "/login",
  "/verify-email/resend": "/login",
  "/register/role": "/register",
  "/register/startup": "/register/role",
  "/register/investor": "/register/role",
  "/register/mentor": "/register/role",
  "/investor/discover/gebeya": "/investor/discover",
  "/investor/discover/gebeya/offer": "/investor/discover/gebeya",
  "/investor/discover/profile": "/investor/discover",
  "/investor/offers/new": "/investor/offers",
  "/investor/payment/completed": "/investor/payment",
  "/investor/payments/checkout": "/investor/payments",
  "/investor/payments/success": "/investor/payments",
  "/mentor/requests/proposal": "/mentor/requests",
  "/startup/payment/completed": "/startup/payment",
  "/startup/project/create": "/startup/project",
  "/startup/project/documents": "/startup/project/create",
};

function getFallbackHref(pathname) {
  if (BACK_ROUTES[pathname]) return BACK_ROUTES[pathname];
  if (pathname.startsWith("/startup/project/details/")) return "/startup/project";
  if (pathname.startsWith("/startup/offers/")) return "/startup/offers";
  return null;
}

function isPortalRoute(pathname) {
  return (
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/investor/") ||
    pathname.startsWith("/mentor/") ||
    pathname.startsWith("/startup/")
  );
}

export default function BackNavigationButton() {
  const pathname = usePathname();
  const router = useRouter();
  const fallbackHref = getFallbackHref(pathname);

  if (!fallbackHref) return null;

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }

  const positionClass = isPortalRoute(pathname)
    ? "left-4 top-20 lg:left-[17rem] lg:top-24"
    : "left-4 top-20";

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Go back"
      title="Go back"
      className={`fixed z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white/95 text-gray-600 shadow-sm backdrop-blur transition hover:border-[#136150]/40 hover:bg-white hover:text-[#0f3d32] focus:outline-none focus:ring-2 focus:ring-[#136150]/30 ${positionClass}`}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </button>
  );
}
