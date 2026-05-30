"use client";

import { useRouter } from "next/navigation";

const sections = [
  {
    title: "Information We Collect",
    body: [
      "When you create an account, StartupConnect Ethiopia collects registration details such as your name, email address, phone number, role, password credentials, and profile information.",
      "Depending on your role, we may collect startup details, founder information, investor preferences, mentor expertise, uploaded verification documents, funding interests, project materials, messages, meeting activity, ratings, payment records, and support requests.",
    ],
  },
  {
    title: "How We Use Your Information",
    body: [
      "We use your information to create and secure your account, verify users, review applications, match startups with mentors or investors, process platform activity, support payments, send account notifications, and improve the quality of recommendations.",
      "Administrative users may review submitted profiles and documents for verification, moderation, fraud prevention, platform safety, and compliance with StartupConnect Ethiopia policies.",
    ],
  },
  {
    title: "Verification Documents",
    body: [
      "Documents such as IDs, business registrations, licenses, TIN certificates, certifications, pitch decks, and related files are used only for verification, review, compliance, and platform trust purposes.",
      "We restrict access to sensitive documents to authorized personnel and systems that need the information to operate or secure the platform.",
    ],
  },
  {
    title: "Sharing and Visibility",
    body: [
      "Some profile information may be visible to matched or approved users, such as a startup's industry, stage, location, project summary, mentor expertise, or investor preference areas.",
      "We do not sell personal information. We may share information with service providers that help us operate the platform, such as hosting, authentication, analytics, payment, communication, and security providers, subject to appropriate safeguards.",
    ],
  },
  {
    title: "Messages, Meetings, and Activity",
    body: [
      "Platform interactions, including messages, offers, meeting requests, support tickets, audit logs, and moderation activity, may be stored to provide the service, resolve disputes, prevent misuse, and improve safety.",
      "Users should not share unnecessary sensitive information in messages or documents unless it is required for the specific investment, mentorship, verification, or support process.",
    ],
  },
  {
    title: "Data Security",
    body: [
      "We use reasonable technical and organizational safeguards designed to protect account data, submitted documents, and platform activity from unauthorized access, loss, misuse, or alteration.",
      "No online service can guarantee absolute security. Users are responsible for keeping passwords confidential, using accurate contact information, and notifying us if they suspect unauthorized access.",
    ],
  },
  {
    title: "Retention and Deletion",
    body: [
      "We retain account, verification, transaction, and activity data for as long as needed to provide the service, meet legal or operational requirements, resolve disputes, maintain audit records, and protect the platform.",
      "You may request correction or deletion of certain personal data, subject to verification needs, legal obligations, security requirements, and legitimate platform records.",
    ],
  },
  {
    title: "Your Choices",
    body: [
      "You may update profile details through your account settings where available. You may also contact platform support to request help correcting inaccurate information or reviewing privacy-related concerns.",
      "If you stop using StartupConnect Ethiopia, some records may remain where necessary for security, compliance, dispute resolution, audit logs, or completed transactions.",
    ],
  },
];

export default function PrivacyPolicyPage() {
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
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Privacy Policy</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            This Privacy Policy explains how StartupConnect Ethiopia collects, uses, protects, and shares information
            from startups, investors, mentors, and administrators who use the platform. It is written for this
            application and the workflows inside it, including registration, verification, recommendations, mentorship,
            funding, messaging, meetings, documents, reports, and account settings.
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

          <div className="mt-10 rounded-xl bg-[#eef8f5] p-5 text-sm leading-7 text-[#0f3d32]">
            This page is intended to describe StartupConnect Ethiopia's platform privacy practices in clear language.
            If a separate signed agreement applies to a specific transaction, investment, mentorship engagement, or
            institutional program, that agreement may include additional privacy or confidentiality obligations.
          </div>
        </div>
      </main>
    </div>
  );
}
