import Link from "next/link";

export function PendingApprovalBanner({ className = "", reason = "admin_approval", message }) {
  const isEmail = reason === "email_verification";
  return (
    <div
      className={`rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm ${className}`}
    >
      <p className="font-semibold">{isEmail ? "Email verification required" : "Awaiting admin approval"}</p>
      <p className="mt-1 text-amber-800">
        {message ||
          (isEmail
            ? "Verify your email address before using startup features. Check your inbox for the verification link."
            : "Your account must be approved before you can send offers, create projects, message investors or mentors, view full profiles, or submit ratings.")}
      </p>
    </div>
  );
}

export function PendingApprovalBlock({ title = "Action unavailable", reason = "admin_approval", message }) {
  const isEmail = reason === "email_verification";
  return (
    <div className="min-h-screen bg-[#f4f7f9] font-sans text-gray-900 flex">
      <main className="flex-grow flex items-center justify-center p-8">
        <div className="max-w-lg w-full rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm text-center">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-3 text-sm text-gray-600">
            {message ||
              (isEmail
                ? "Your email address must be verified before you can use this feature. Check your inbox for the verification link."
                : "Your startup account is pending admin approval. You will be able to use this feature once an administrator approves your account.")}
          </p>
          <Link
            href={isEmail ? "/login" : "/startup/dashboard"}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#0f3d32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0b2a1d]"
          >
            {isEmail ? "Back to login" : "Back to dashboard"}
          </Link>
        </div>
      </main>
    </div>
  );
}
