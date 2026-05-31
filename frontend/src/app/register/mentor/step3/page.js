import Link from "next/link";
import RegistrationStepForm from "@/components/register/RegistrationStepForm";

export default function MentorRegistrationDocuments() {
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
            Strengthen your profile with supporting documents.
          </h1>
          <p className="text-[#10b981] text-sm leading-relaxed max-w-sm font-medium">
            Upload your ID for verification and optionally add certifications and introduction video to enhance your profile.
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
            <Link href="/register/mentor/step2" className="text-[#167b66] hover:text-[#0f5c4a] transition text-sm font-bold">
              Back to profile
            </Link>
            <span className="text-sm text-gray-400">/ Document upload</span>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_16px_40px_rgba(15,61,50,0.08)] border border-gray-100 p-8 md:p-10">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-widest font-bold text-[#0f3d32] opacity-70">Step 3 of 4</p>
              <h1 className="text-3xl font-extrabold text-[#115b4c] mt-4 mb-2">Upload documents</h1>
              <p className="text-sm text-gray-500">Upload your ID for verification. Video and certifications are optional but help strengthen your profile.</p>
            </div>

            <RegistrationStepForm nextHref="/register/mentor/step4" className="space-y-6">
              <div className="rounded-3xl border border-dashed border-[#167b66] bg-[#f0faf8] p-8">
                <div className="grid gap-6">
                  {/* ID Upload - MANDATORY */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-shrink-0 w-6 h-6 bg-[#dc2626] rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-white font-bold text-xs">*</span>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-[#0f3d32] mb-1">
                          Government-issued ID (Mandatory)
                        </label>
                        <p className="text-xs text-gray-500 mb-4">
                          Upload a clear copy of your ID (passport, national ID, or driver&apos;s license). This is required for verification.
                        </p>
                        <input
                          type="file"
                          name="mentor_id"
                          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                          data-file-kind="image"
                          required
                          className="text-xs w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0f3d32] file:text-white hover:file:bg-[#0a2921]"
                        />
                        <p className="text-[10px] text-gray-400 mt-2">Accepted formats: JPG, PNG (Max 10MB)</p>
                      </div>
                    </div>
                  </div>

                  {/* Certification Files - OPTIONAL */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-shrink-0 w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-gray-600 font-bold text-xs">○</span>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-[#0f3d32] mb-1">
                          Certification documents (Optional)
                        </label>
                        <p className="text-xs text-gray-500 mb-4">
                          Upload certificates, credentials, or qualifications that validate your expertise (e.g., PMP, CFA, MBA, industry certifications).
                        </p>
                        <input
                          type="file"
                          name="certifications"
                          accept=".pdf,application/pdf"
                          data-file-kind="pdf"
                          multiple
                          className="text-xs w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#167b66] file:text-white hover:file:bg-[#115b4c]"
                        />
                        <p className="text-[10px] text-gray-400 mt-2">PDF documents only. You can upload multiple files. Max 10MB each.</p>
                      </div>
                    </div>
                  </div>

                  {/* Introduction Video - OPTIONAL */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-shrink-0 w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-gray-600 font-bold text-xs">○</span>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-[#0f3d32] mb-1">
                          Introduction video (Optional)
                        </label>
                        <p className="text-xs text-gray-500 mb-4">
                          Record a short 30-60 second video introducing yourself, your mentoring approach, and what you bring to founders. This helps build trust with founders before they connect with you.
                        </p>
                        <input
                          type="file"
                          name="intro_video"
                          accept="video/mp4,video/quicktime,video/webm"
                          data-file-kind="video"
                          className="text-xs w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#167b66] file:text-white hover:file:bg-[#115b4c]"
                        />
                        <p className="text-[10px] text-gray-400 mt-2">Accepted formats: MP4, MOV, WebM (Max 50MB, 1 min recommended)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <Link
                  href="/register/mentor/step2"
                  className="text-sm font-bold text-gray-600 hover:text-[#136150] transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                  </svg>
                  Back
                </Link>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#0f3d32] px-8 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#0a2921]"
                >
                  Continue to Review
                </button>
              </div>
            </RegistrationStepForm>
          </div>
        </div>
      </div>
    </div>
  );
}
