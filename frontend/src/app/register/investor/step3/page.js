"use client";

import Link from "next/link";
import { useRegFlow } from "@/components/register/RegFlowProvider";
import RegistrationStepForm from "@/components/register/RegistrationStepForm";

export default function InvestorRegistrationStep3() {
  const { fields } = useRegFlow();
  const f = fields || {};

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans text-gray-900 flex flex-col lg:flex-row">
      <div className="hidden lg:flex w-[40%] bg-[#061e16] relative overflow-hidden flex-col justify-between py-12 px-12">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#061e16]"></div>
          <div className="absolute top-[-10%] left-[10%] w-[150%] h-[30px] bg-[#008f64] opacity-30 transform -rotate-[55deg] blur-[2px]"></div>
          <div className="absolute top-[10%] left-[10%] w-[150%] h-[40px] bg-[#008f64] opacity-30 transform -rotate-[55deg] blur-[2px]"></div>
          <div className="absolute top-[30%] left-[0%] w-[150%] h-[20px] bg-[#008f64] opacity-30 transform -rotate-[55deg] blur-[2px]"></div>
          <div className="absolute top-[50%] left-[-10%] w-[150%] h-[60px] bg-[#008f64] opacity-20 transform -rotate-[55deg] blur-[4px]"></div>
          <div className="absolute top-[70%] left-[-20%] w-[150%] h-[25px] bg-[#008f64] opacity-40 transform -rotate-[55deg] blur-[2px]"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#061e16]/60 via-transparent to-[#061e16]/90"></div>
        </div>
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 mb-16">
            <div className="flex items-center gap-2"><img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" /><span className="font-bold text-lg text-white tracking-tight">StartupConnect</span></div>
          </Link>
          <h1 className="text-4xl lg:text-5xl font-light text-white mb-6 leading-tight">
            Build Ethiopia&apos;s next investment stories with real founder partnerships.
          </h1>
          <p className="text-[#10b981] text-sm leading-relaxed max-w-sm font-medium">
            Upload your investment documents so we can fast-track your approval and connect you to vetted opportunities.
          </p>
        </div>
        <div className="relative z-10">
          <p className="text-[#8ba39e] text-[10px] font-medium tracking-widest uppercase opacity-50">
            &copy; 2024 StartupConnect Ethiopia. All rights reserved.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-[60%] flex flex-col pt-10 pb-6 px-4 md:px-8 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto flex flex-col">
          <div className="w-full flex items-center gap-3 mb-6 pl-4">
            <Link href="/register/investor/step2" className="text-[#167b66] hover:text-[#0f5c4a] transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
            </Link>
            <span className="font-bold text-lg tracking-tight text-[#115b4c]">Investor Documents</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-[#115b4c] tracking-tight mb-2">Proof of Investment Capacity</h1>
            <p className="text-gray-500 mb-10 text-[15px]">Upload the documents needed to complete your investor profile and verify your account.</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Step 3 of 5</span>
              <div className="flex gap-1.5">
                <div className="h-1.5 w-6 bg-[#167b66] rounded-full"></div>
                <div className="h-1.5 w-6 bg-[#167b66] rounded-full"></div>
                <div className="h-1.5 w-6 bg-[#167b66] rounded-full"></div>
                <div className="h-1.5 w-6 bg-gray-200 rounded-full"></div>
                <div className="h-1.5 w-6 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_16px_40px_rgba(15,61,50,0.08)] border border-gray-100 p-8 md:p-10">
            <RegistrationStepForm nextHref="/register/investor/step4" className="flex flex-col gap-10">
              <section className="grid gap-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Document uploads</p>
                  <h2 className="text-lg font-bold text-[#0f3d32] mt-2">Upload documents to support your investor profile.</h2>
                </div>

                <div className="grid gap-6">
                  <label className="block text-sm font-bold text-[#0f3d32]">
                    Registration document or ID / Passport
                    <input
                      type="file"
                      name="registration_doc"
                      required
                      accept=".pdf,application/pdf"
                      data-file-kind="pdf"
                      className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150]"
                    />
                    <p className="text-[12px] text-gray-500 mt-2">
                      Upload a company registration document if you are investing through an entity.
                      If you are registering as an individual investor, upload a scanned PDF of your government-issued ID or passport.
                    </p>
                  </label>

                  <label className="block text-sm font-bold text-[#0f3d32]">
                    Trade license
                    <input
                      type="file"
                      name="trade_license"
                      required
                      accept=".pdf,application/pdf"
                      data-file-kind="pdf"
                      className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150]"
                    />
                  </label>

                  <label className="block text-sm font-bold text-[#0f3d32]">
                    TIN certificate
                    <input
                      type="file"
                      name="tin_certificate"
                      required
                      accept=".pdf,application/pdf"
                      data-file-kind="pdf"
                      className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150]"
                    />
                  </label>

                  <label className="block text-sm font-bold text-[#0f3d32]">
                    Short funding history summary
                    <textarea
                      name="investment_history_summary"
                      required
                      minLength={50}
                      maxLength={200}
                      rows="5"
                      defaultValue={f.investment_history_summary || ""}
                      placeholder="Briefly summarize your investment history, key sectors, and portfolio size..."
                      className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150] resize-none"
                    />
                    <p className="text-[10px] text-gray-500 mt-2">50–200 characters. This helps us match you with startups aligned to your experience.</p>
                  </label>
                </div>

                <label className="flex items-center gap-3 text-sm font-bold text-[#0f3d32]">
                  <input
                    type="checkbox"
                    name="investor_acknowledgement"
                    value="I confirm the documents are accurate"
                    required
                    defaultChecked={f.investor_acknowledgement === "I confirm the documents are accurate"}
                    className="h-4 w-4 rounded border-gray-300 text-[#136150] focus:ring-[#136150]"
                  />
                  I confirm these documents are accurate and that I am willing to provide additional verification if requested.
                </label>
              </section>

              <div className="flex justify-between items-center mt-6 pt-8 border-t border-gray-200">
                <Link href="/register/investor/step2" className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#136150] transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                  Back
                </Link>
                <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-[#0f3d32] px-8 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#0a2921]">
                  Continue to Review
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
              </div>
            </RegistrationStepForm>
          </div>
        </div>
      </div>
    </div>
  );
}
