"use client";
import { useState } from "react";
import Link from "next/link";
import StartupRegisterReviewClient from "@/components/register/StartupRegisterReviewClient";
import SubmitRegisterButton from "@/components/register/SubmitRegisterButton";

export default function StartupRegistrationStep4() {
  const [agreeAccuracy, setAgreeAccuracy] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const canSubmit = agreeAccuracy && agreeTerms;

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans text-gray-900 flex flex-col lg:flex-row pb-24">
      
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
            Join a prestigious network of industry leaders curating the future of Ethiopia's innovation ecosystem through high-impact mentorship.
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
          <div className="w-full flex items-center gap-3 mb-6 pl-4">
            <Link href="/register/startup/step3" className="text-[#167b66] hover:text-[#0f5c4a] transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
            </Link>
            <span className="font-bold text-lg tracking-tight text-[#115b4c]">
              Review & Submit
            </span>
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-[#115b4c] tracking-tight mb-2">Review & Submit</h1>
            <p className="text-sm text-gray-500">Double-check your application details before sending them for official verification.</p>
          </div>

          {/* Profile Status Banner */}
          <div className="w-full bg-[#e3f2f0] border border-[#c4e5df] rounded-xl p-5 mb-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#167b66] rounded-full flex items-center justify-center text-white border-[3px] border-[#a5d6cd]">
                <span className="font-bold text-sm">100%</span>
              </div>
              <div>
                <h3 className="font-bold text-[#115b4c] text-[15px]">Profile Complete</h3>
                <p className="text-sm text-[#0f5c4a] opacity-80 mt-0.5">All required fields have been successfully populated.</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-[#fef0db] text-[#d97736] px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-sm">
              <div className="w-1.5 h-1.5 bg-[#d97736] rounded-full"></div>
              READY FOR REVIEW
            </div>
          </div>

          <StartupRegisterReviewClient />

          {/* Final Acknowledgements */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#115b4c] mb-6">Final Acknowledgements</h2>
            <div className="flex flex-col gap-4">
              <label className="flex items-start gap-4 cursor-pointer">
                <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 rounded border border-gray-300 bg-white leading-none">
                  <input
                    type="checkbox"
                    checked={agreeAccuracy}
                    onChange={(e) => setAgreeAccuracy(e.target.checked)}
                    className="opacity-0 absolute w-full h-full cursor-pointer peer"
                    aria-label="Agree to accuracy declaration"
                  />
                  <div className={` ${agreeAccuracy ? "block" : "hidden"} text-[#167b66]`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-0.5">Accuracy Declaration</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">I certify that all information provided in this application is true and accurate to the best of my knowledge as of the date of submission.</p>
                </div>
              </label>

              <label className="flex items-start gap-4 cursor-pointer">
                <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 rounded border border-gray-300 bg-white leading-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="opacity-0 absolute w-full h-full cursor-pointer peer"
                    aria-label="Agree to terms and privacy policy"
                  />
                  <div className={` ${agreeTerms ? "block" : "hidden"} text-[#167b66]`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-0.5">Terms of Service & Privacy Policy</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    I have read and agree to StartupConnect Ethiopia{" "}
                    <Link href="/privacy-policy" className="text-[#167b66] hover:underline">Privacy Policy</Link>
                    {" "}and{" "}
                    <Link href="/terms-of-service" className="text-[#167b66] hover:underline">Terms of Use</Link>
                    {" "}regarding data processing and verification protocols.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Submission Action Box */}
          <div className="bg-[#0f5c4a] rounded-xl p-10 text-center flex flex-col items-center mb-16 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-3">Ready to Join the Ecosystem?</h2>
            <p className="text-sm text-[#87c5b7] mb-8 max-w-lg leading-relaxed">
              Once submitted, our administrators will review your application within <span className="font-bold text-white">3-5 business days</span>. You will receive an email notification upon approval.
            </p>
              <div className="flex items-center justify-center gap-4 mb-8">
              <SubmitRegisterButton
                nextPath="/register/startup/success"
                disabled={!canSubmit}
                className="px-8 py-3.5 bg-white text-[#0f5c4a] font-bold rounded-lg shadow-sm hover:bg-gray-50 transition flex justify-center items-center w-full sm:w-auto min-w-[200px]"
              >
                Submit for Verification
              </SubmitRegisterButton>
              <button className="px-8 py-3.5 bg-transparent border border-[#2b7866] text-white hover:bg-[#115b4c] font-bold rounded-lg transition w-full sm:w-auto">
                Cancel
              </button>
            </div>
            
            <div className="flex gap-6 items-center justify-center text-[#87c5b7] text-[10px] uppercase font-bold tracking-widest">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                Encrypted Connection
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                Secure form SSL TLS
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Data in Ethiopia
              </div>
            </div>
          </div>
          
          {/* Footer Sub-badges */}
          <div className="flex flex-col items-center pt-8 border-t border-gray-100">
            <div className="flex items-center gap-8 mb-6 text-gray-400 text-xs font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg>
                Secure Gateway
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                Data Hosted ET
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z"></path><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"></path></svg>
                MinT Approved
              </div>
            </div>
            <p className="text-[10px] text-gray-400 text-center max-w-xl leading-relaxed">
              StartupConnect Ethiopia is an initiative managed by the Ministry of Innovation and Technology (MinT). In short. Your data is protected by the Ethiopia Personal Data Protection Proclamation.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
