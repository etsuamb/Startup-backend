"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import RegistrationStepForm from "@/components/register/RegistrationStepForm";
import { loadRegistrationAccountInfo } from "@/lib/registerAccountStorage";
import { saveDraft, loadDraft, clearDraft } from "@/lib/formDraft";

const DRAFT_KEY = "register_startup_step1";

export default function StartupRegistrationStep1() {
  const accountInfo = loadRegistrationAccountInfo() || {};
  const [showDraftNotice, setShowDraftNotice] = useState(false);

  useEffect(() => {
    const savedDraft = loadDraft(DRAFT_KEY);
    if (!savedDraft) return;

    const showNoticeTimer = setTimeout(() => setShowDraftNotice(true), 0);
    const hideNoticeTimer = setTimeout(() => setShowDraftNotice(false), 4000);

    return () => {
      clearTimeout(showNoticeTimer);
      clearTimeout(hideNoticeTimer);
    };
  }, []);

  const handleSaveDraft = () => {
    saveDraft(DRAFT_KEY, { accountInfo });
    setShowDraftNotice(true);
    setTimeout(() => setShowDraftNotice(false), 2000);
  };

  const handleContinue = () => {
    clearDraft(DRAFT_KEY);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col lg:flex-row">
      
      {/* Left Sidebar (Dark Green graphic) */}
      <div className="hidden lg:flex w-[40%] bg-[#061e16] relative overflow-hidden flex-col justify-between py-12 px-12">
        {/* Abstract Green Light Beams / Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#061e16]"></div>
          {/* Faux light beams using rotated divs */}
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
            Empower the <br/> Next Generation <br/> of Ethiopian <br/> Founders
          </h1>
          <p className="text-[#10b981] text-sm leading-relaxed max-w-sm font-medium">
            Join a prestigious network of industry leaders curating the future of Ethiopia&apos;s innovation ecosystem through high-impact mentorship.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-[#8ba39e] text-[10px] font-medium tracking-widest uppercase opacity-50">
            &copy; 2024 StartupConnect Ethiopia. All rights reserved.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full lg:w-[60%] flex flex-col pt-10 pb-6 px-4 md:px-8 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto flex flex-col">
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-[#115b4c] tracking-tight mb-2">Account Information</h1>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Step 1 of 4</span>
                <div className="flex gap-1.5">
                  <div className="h-1.5 w-6 bg-[#167b66] rounded-full"></div>
                  <div className="h-1.5 w-6 bg-gray-200 rounded-full"></div>
                  <div className="h-1.5 w-6 bg-gray-200 rounded-full"></div>
                  <div className="h-1.5 w-6 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            </div>

            <RegistrationStepForm nextHref="/register/startup/step2" className="flex flex-col gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-[#115b4c] mb-3">Account details saved</h3>
                <p className="text-sm text-gray-600 mb-5">
                  Your name, email, password, and phone number have already been collected on the initial registration screen. Continue to build your startup profile.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Registered name</p>
                    <p className="text-sm font-medium text-gray-900">{accountInfo.full_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Email</p>
                    <p className="text-sm font-medium text-gray-900">{accountInfo.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{accountInfo.phone_number || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-8">
                <button
                  type="submit"
                  onClick={handleContinue}
                  className="px-8 py-3.5 bg-[#0f5c4a] hover:bg-[#0c4a3b] text-white font-bold rounded shadow-md transition text-sm text-center inline-block"
                >
                  Continue to Step 2
                </button>
                <button 
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-8 py-3.5 bg-white border border-gray-200 text-[#167b66] font-bold rounded hover:bg-gray-50 transition text-sm"
                >
                  {showDraftNotice ? "✓ Draft saved" : "Save as Draft"}
                </button>
              </div>
            </RegistrationStepForm>
          </div>
      </div>
    </div>
  );
}
