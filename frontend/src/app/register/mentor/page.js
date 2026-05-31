"use client";

import Link from "next/link";
import RegistrationStepForm from "@/components/register/RegistrationStepForm";
import { loadRegistrationAccountInfo } from "@/lib/registerAccountStorage";

export default function MentorRegistration() {
  const accountInfo = loadRegistrationAccountInfo() || {};
  const hasAccountInfo = Boolean(accountInfo.full_name || accountInfo.email || accountInfo.phone_number);

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
          <Link href="/" className="flex items-center gap-2 mb-14">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg text-white tracking-tight">StartupConnect</span>
          </Link>
          <h1 className="text-4xl lg:text-5xl font-light text-white mb-6 leading-tight">
            Mentor startups shaping Ethiopia&apos;s next chapter.
          </h1>
          <p className="text-[#10b981] text-sm leading-relaxed max-w-sm font-medium">
            Create a profile, highlight your experience, and help founders build stronger businesses.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-[#8ba39e] text-[10px] font-medium tracking-widest uppercase opacity-50">
            &copy; 2024 StartupConnect Ethiopia. All rights reserved.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-[60%] flex flex-col pt-10 pb-8 px-4 md:px-10 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/register" className="text-[#167b66] hover:text-[#0f5c4a] transition text-sm font-bold">
              Back to registration
            </Link>
            <span className="text-sm text-gray-400">/ Mentor sign-up</span>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_16px_40px_rgba(15,61,50,0.08)] border border-gray-100 p-8 md:p-10">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-widest font-bold text-[#0f3d32] opacity-70">Step 1 of 3</p>
              <h1 className="text-3xl font-extrabold text-[#115b4c] mt-4 mb-2">Mentor account details</h1>
              <p className="text-sm text-gray-500">Your mentor account data was captured before actor selection. Continue to complete your mentor profile.</p>
            </div>

            {hasAccountInfo ? (
              <RegistrationStepForm nextHref="/register/mentor/step2" className="space-y-6">
                <div className="grid gap-6">
                  <div className="rounded-3xl border border-gray-200 bg-[#f7faf7] p-6">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Full legal name</p>
                    <p className="text-sm font-bold text-gray-800">{accountInfo.full_name || "Not available"}</p>
                  </div>
                  <div className="rounded-3xl border border-gray-200 bg-[#f7faf7] p-6">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Work email address</p>
                    <p className="text-sm font-bold text-gray-800">{accountInfo.email || "Not available"}</p>
                  </div>
                  <div className="rounded-3xl border border-gray-200 bg-[#f7faf7] p-6">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Phone number</p>
                    <p className="text-sm font-bold text-gray-800">{accountInfo.phone_number || "Not available"}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <span className="text-xs text-gray-500">Your account credentials are preserved from the registration step.</span>
                  <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-[#0f3d32] px-8 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#0a2921]">
                    Continue to Professional
                  </button>
                </div>
              </RegistrationStepForm>
            ) : (
              <div className="rounded-3xl border border-gray-200 bg-[#f7faf7] p-8 text-center">
                <p className="text-sm text-gray-600 mb-6">No saved account information was found. Please start by creating an account first.</p>
                <Link href="/register" className="inline-flex items-center justify-center rounded-2xl bg-[#0f3d32] px-8 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#0a2921]">
                  Start account registration
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
