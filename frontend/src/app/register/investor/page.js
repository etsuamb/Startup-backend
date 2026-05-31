"use client";

import Link from "next/link";
import RegistrationStepForm from "@/components/register/RegistrationStepForm";
import { loadRegistrationAccountInfo } from "@/lib/registerAccountStorage";

export default function InvestorRegistration() {
  const accountInfo = loadRegistrationAccountInfo() || {};

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
            Invest in Ethiopia&apos;s next growth stories.
          </h1>
          <p className="text-[#10b981] text-sm leading-relaxed max-w-sm font-medium">
            Your account details were captured before actor selection. Continue to complete your investor profile.
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
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-[#115b4c] tracking-tight mb-2">Account Information</h1>
            <p className="text-gray-500 mb-10 text-[15px]">Your core investor account data is already stored from registration before actor selection.</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Step 1 of 5</span>
              <div className="flex gap-1.5">
                <div className="h-1.5 w-6 bg-[#167b66] rounded-full"></div>
                <div className="h-1.5 w-6 bg-gray-200 rounded-full"></div>
                <div className="h-1.5 w-6 bg-gray-200 rounded-full"></div>
                <div className="h-1.5 w-6 bg-gray-200 rounded-full"></div>
                <div className="h-1.5 w-6 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          </div>

          <RegistrationStepForm nextHref="/register/investor/step2" className="flex flex-col gap-6">
            <div className="bg-white rounded-3xl shadow-[0_16px_40px_rgba(15,61,50,0.08)] border border-gray-100 p-8 md:p-10">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-widest font-bold text-[#0f3d32] opacity-70">Account details</p>
                <h2 className="text-2xl font-extrabold text-[#115b4c] mt-4">Account details saved</h2>
                <p className="text-sm text-gray-500 mt-2">Continue to the investor profile section without re-entering your name, email, password, or phone number.</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Full legal name</p>
                  <p className="text-sm font-bold text-gray-800">{accountInfo.full_name || "Not available"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Email</p>
                  <p className="text-sm font-bold text-gray-800">{accountInfo.email || "Not available"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Phone number</p>
                  <p className="text-sm font-bold text-gray-800">{accountInfo.phone_number || "Not available"}</p>
                </div>
              </div>

              <div className="flex justify-end mt-10">
                <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-[#0f3d32] px-8 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#0a2921]">
                  Continue to Profile
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
              </div>
            </div>
          </RegistrationStepForm>
        </div>
      </div>
    </div>
  );
}
