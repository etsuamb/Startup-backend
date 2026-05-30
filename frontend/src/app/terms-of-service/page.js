"use client";

import { useRouter } from "next/navigation";

const sections = [
  {
    title: "Use of the Platform",
    body: [
      "StartupConnect Ethiopia provides a digital platform for startups, investors, mentors, and administrators to manage registration, verification, discovery, recommendations, mentorship, funding interest, meetings, documents, messages, reports, and related ecosystem activity.",
      "You agree to use the platform only for lawful, honest, and professional purposes connected to startup ecosystem participation, mentorship, investment exploration, support, and collaboration.",
    ],
  },
  {
    title: "Account Registration",
    body: [
      "You must provide accurate, current, and complete information during registration. This includes account details, role-specific profile data, uploaded verification documents, and any information submitted for review.",
      "You are responsible for keeping your login credentials secure and for all activity that occurs under your account. Notify the platform team if you believe your account has been compromised.",
    ],
  },
  {
    title: "Role Responsibilities",
    body: [
      "Startups are responsible for submitting truthful founder, company, project, funding, stage, document, and contact information. Investors are responsible for submitting accurate investment profile and verification information. Mentors are responsible for accurately describing expertise, availability, credentials, and mentoring experience.",
      "Users must not impersonate another person or organization, submit forged documents, misrepresent funding capacity, make misleading claims, or use the platform to harass, spam, exploit, or defraud others.",
    ],
  },
  {
    title: "Verification and Approval",
    body: [
      "StartupConnect Ethiopia may review, approve, reject, suspend, or request additional information for accounts, documents, projects, offers, and platform activity. Verification is intended to improve trust, but it is not a guarantee of business performance, investment outcome, legal compliance, or user conduct.",
      "The platform may restrict access to certain features until registration and verification steps are complete.",
    ],
  },
  {
    title: "Mentorship, Investment, and Offers",
    body: [
      "Mentorship connections, meeting requests, funding discussions, investment offers, and related communications are user-driven interactions. Users should perform their own due diligence before entering any agreement or transaction.",
      "Unless separately stated in writing, StartupConnect Ethiopia does not provide legal, financial, tax, investment, or professional advice and does not guarantee that a startup will receive funding or that an investor or mentor relationship will produce a specific result.",
    ],
  },
  {
    title: "Documents and Content",
    body: [
      "You retain responsibility for the documents, profile information, messages, proposals, reports, and other content you submit. You grant StartupConnect Ethiopia permission to store, process, display, and use submitted content as needed to operate and secure the platform.",
      "Do not upload content that violates another person's rights, contains malware, includes unlawful material, or contains confidential information you are not authorized to share.",
    ],
  },
  {
    title: "Payments and Transactions",
    body: [
      "Where payment, checkout, investment, or offer features are available, users are responsible for reviewing amounts, terms, counterparties, and transaction details before proceeding.",
      "Additional payment provider terms may apply. Platform records may be used for transaction history, support, reporting, compliance, and dispute review.",
    ],
  },
  {
    title: "Suspension or Termination",
    body: [
      "We may suspend or terminate access if a user violates these terms, submits false information, abuses platform features, creates security risk, or engages in conduct that harms other users or StartupConnect Ethiopia.",
      "Users may stop using the platform at any time, but some records may be retained as described in the Privacy Policy for verification, security, compliance, audit, or dispute purposes.",
    ],
  },
  {
    title: "Changes to the Service",
    body: [
      "StartupConnect Ethiopia may update features, eligibility rules, verification requirements, workflows, pricing, integrations, or these terms as the platform evolves.",
      "Continued use of the platform after updates means you accept the updated terms, unless a separate written agreement says otherwise.",
    ],
  },
];

export default function TermsOfServicePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-900">
      <main className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/register"))}
          className="mb-8 text-sm font-bold text-[#0f5c4a] hover:underline"
        >
          Back
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <p className="text-xs font-bold uppercase tracking-widest text-[#167b66]">StartupConnect Ethiopia</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Terms of Service</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            These Terms of Service govern your access to and use of StartupConnect Ethiopia. By creating an account,
            submitting registration information, uploading documents, or using any platform feature, you agree to these
            terms and to the Privacy Policy.
          </p>

          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-black text-[#0f3d32]">{section.title}</h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-slate-700">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-xl bg-[#fff7ed] p-5 text-sm leading-7 text-[#7c3f12]">
            These terms are written for the StartupConnect Ethiopia platform experience. Any separate signed investment,
            mentorship, partnership, payment, or institutional agreement may include additional obligations between the
            relevant parties.
          </div>
        </div>
      </main>
    </div>
  );
}
