"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRegFlow } from "@/components/register/RegFlowProvider";
import RegistrationStepForm from "@/components/register/RegistrationStepForm";
import ProfilePictureField from "@/components/register/ProfilePictureField";
import { CustomIndustryInput, INDUSTRY_OPTIONS } from "@/components/register/IndustryFields";

export default function InvestorRegistrationStep2() {
  const { fields } = useRegFlow();
  const f = fields || {};
  const selectedIndustries = useMemo(
    () => Array.isArray(f.preferred_industry)
      ? f.preferred_industry
      : (f.preferred_industry ? [f.preferred_industry] : []),
    [f.preferred_industry],
  );
  const customIndustry = selectedIndustries
    .filter((industry) => !INDUSTRY_OPTIONS.includes(industry))
    .join(", ");

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
            Empower the <br /> Next Generation <br /> of Ethiopian <br /> Founders
          </h1>
          <p className="text-[#10b981] text-sm leading-relaxed max-w-sm font-medium">
            Share your investment preferences so we can introduce you to the most relevant founders and startups.
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
            <Link href="/register/investor" className="text-[#167b66] hover:text-[#0f5c4a] transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
            </Link>
            <span className="font-bold text-lg tracking-tight text-[#115b4c]">Investor Profile</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-[#115b4c] tracking-tight mb-2">Investor Type and Profile</h1>
            <p className="text-gray-500 mb-10 text-[15px]">Tell us about your investment background and preferences to match you with relevant Ethiopian startups.</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Step 2 of 5</span>
              <div className="flex gap-1.5">
                <div className="h-1.5 w-6 bg-[#167b66] rounded-full"></div>
                <div className="h-1.5 w-6 bg-[#167b66] rounded-full"></div>
                <div className="h-1.5 w-6 bg-gray-200 rounded-full"></div>
                <div className="h-1.5 w-6 bg-gray-200 rounded-full"></div>
                <div className="h-1.5 w-6 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_16px_40px_rgba(15,61,50,0.08)] border border-gray-100 p-8 md:p-10">
            <RegistrationStepForm nextHref="/register/investor/step3" className="flex flex-col gap-10">
              <ProfilePictureField />
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Investor type</p>
                    <h2 className="text-lg font-bold text-[#0f3d32] mt-3">Choose the description that best fits your investment role.</h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    "Individual",
                    "Angel Investor",
                    "Venture Capital",
                    "Investment Company",
                    "Corporate Investor",
                    "Diaspora",
                    "Family Office",
                    "Private Equity",
                  ].map((option) => (
                    <label key={option} className="cursor-pointer">
                      <input
                        type="radio"
                        name="investor_type"
                        value={option}
                        className="peer sr-only"
                        defaultChecked={(f.investor_type || "Individual") === option}
                        required
                      />
                      <div className="rounded-3xl border border-gray-200 bg-white p-4 transition hover:border-[#136150] hover:bg-[#f0f7f5] peer-checked:border-[#0f3d32] peer-checked:bg-[#ecf8f2]">
                        <div className="mb-3 text-[#136150]">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        </div>
                        <div className="text-sm font-bold text-gray-800">{option}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Investment preferences</p>
                    <h2 className="text-lg font-bold text-[#0f3d32] mt-3">Select the sectors and terms you prefer.</h2>
                  </div>
                </div>

                <div className="grid gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Preferred industries</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {INDUSTRY_OPTIONS.map((sector) => (
                        <label key={sector} className="flex items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 cursor-pointer hover:border-[#136150] transition">
                          <input type="checkbox" name="preferred_industry" value={sector} defaultChecked={selectedIndustries.includes(sector)} className="text-[#136150] border-gray-300 rounded focus:ring-[#136150]" />
                          {sector}
                        </label>
                      ))}
                    </div>
                    <div className="mt-4">
                      <CustomIndustryInput name="preferred_industry" defaultValue={customIndustry} />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">Startup stage</label>
                      <div className="relative">
                        <select name="investment_stage" required defaultValue={f.investment_stage || ""} className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150]">
                          <option value="">Select stage</option>
                          <option value="Idea Stage">Idea Stage</option>
                          <option value="Pre-Seed">Pre-Seed</option>
                          <option value="Seed">Seed</option>
                          <option value="Early Growth">Early Growth</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">Investment range (USD)</label>
                      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                        <input type="number" name="investment_range_min" min="0" required defaultValue={f.investment_range_min || ""} placeholder="Minimum" className="w-full min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150]" />
                        <input type="number" name="investment_range" min={f.investment_range_min || "0"} required defaultValue={f.investment_range || ""} placeholder="Maximum" className="w-full min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150]" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">Location preference</label>
                      <div className="relative">
                        <select name="location_preference" required defaultValue={f.location_preference || ""} className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150]">
                          <option value="">Select location</option>
                          <option value="Addis Ababa">Addis Ababa</option>
                          <option value="Dire Dawa">Dire Dawa</option>
                          <option value="Harari">Harari</option>
                          <option value="Oromia">Oromia</option>
                          <option value="Amhara">Amhara</option>
                          <option value="SNNPR">SNNPR (Southern Nations)</option>
                          <option value="Gambela">Gambela</option>
                          <option value="Benishangul-Gumuz">Benishangul-Gumuz</option>
                          <option value="Somali">Somali</option>
                          <option value="Afar">Afar</option>
                          <option value="Tigray">Tigray</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">LinkedIn or Website</label>
                      <input
                        name="linked_in_or_website"
                        type="url"
                        required
                        defaultValue={f.linked_in_or_website || ""}
                        placeholder="https://linkedin.com/in/..."
                        pattern="https?://.+"
                        title="Please provide a valid URL starting with http:// or https://"
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">Short professional bio</label>
                      <textarea
                        name="bio"
                        required
                        defaultValue={f.bio || ""}
                        minLength={50}
                        maxLength={300}
                        rows="5"
                        placeholder="Briefly describe your investment philosophy and previous experience..."
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150] resize-none"
                      />
                      <p className="text-[10px] text-gray-500 mt-2">50–300 characters</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center gap-2 text-sm font-bold text-[#0f3d32]">
                      <input
                        name="personal_verification"
                        type="checkbox"
                        value="Verified Investor"
                        required
                        defaultChecked={f.personal_verification === "Verified Investor"}
                        className="h-4 w-4 rounded border-gray-300 text-[#136150] focus:ring-[#136150]"
                      />
                      I confirm that I am an accredited investor and the information provided is accurate.
                    </label>
                  </div>
                </div>
              </section>

              <div className="flex justify-between items-center mt-6 pt-8 border-t border-gray-200">
                <Link href="/register/investor" className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#136150] transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                  Back
                </Link>
                <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-[#0f3d32] px-8 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#0a2921]">
                  Continue to Documents
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
