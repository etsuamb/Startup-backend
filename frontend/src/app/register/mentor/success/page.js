import Link from "next/link";

export default function MentorApplicationSuccess() {
  return (
    <div className="flex min-h-screen font-sans bg-[#f7f9f8]">
      
      {/* Left Sidebar Panel */}
      <div className="hidden lg:flex flex-col w-[35%] bg-[#0a3a2e] text-white p-12 lg:p-16 relative overflow-hidden shrink-0">
        <div className="relative z-10 flex flex-col h-full">
          <div className="text-[22px] font-bold tracking-tight mb-20 leading-tight">
            <div className="flex items-center gap-2"><img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" /><span className="font-bold text-lg">StartupConnect</span></div>
          </div>
          
          <div className="mt-auto mb-auto">
            <h1 className="text-[48px] lg:text-[56px] font-bold leading-[1.1] mb-6 tracking-tight">
              Empower the<br/>Next<br/>Generation
            </h1>
            <p className="text-[17px] text-[#86b5a5] leading-relaxed max-w-md">
              Empowering the next generation of Ethiopian innovators through structured institutional mentorship.
            </p>
          </div>
        </div>
      </div>

      {/* Right Main Content Panel */}
      <div className="flex-grow flex flex-col relative overflow-y-auto">
        
        <div className="flex-grow flex items-center justify-center p-6 lg:p-12">
          
          {/* Main Success Card */}
          <div className="bg-white rounded-[32px] p-10 md:p-14 w-full max-w-[640px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center">
            
            {/* Top Success Icon */}
            <div className="w-20 h-20 bg-[#bdf0d4] rounded-full flex items-center justify-center mb-8">
               <div className="w-10 h-10 bg-[#0a3a2e] rounded-full flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
               </div>
            </div>

            {/* Headers */}
            <h2 className="text-[28px] font-bold text-gray-900 mb-3 text-center tracking-tight">
               Application Submitted Successfully
            </h2>
            <p className="text-[15px] text-gray-500 text-center mb-12 max-w-sm leading-relaxed">
               Your profile has been submitted and is currently under review by our institutional team.
            </p>

            {/* Progress Tracker */}
            <div className="w-full max-w-[480px] mb-12">
               <div className="relative flex justify-between items-center w-full">
                  {/* Background Line */}
                  <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 -z-10"></div>
                  {/* Progress Line */}
                  <div className="absolute left-4 w-1/2 top-1/2 -translate-y-1/2 h-0.5 bg-[#0a3a2e] -z-10"></div>

                  {/* Step 1: Submitted */}
                  <div className="flex flex-col items-center gap-3 bg-white px-2">
                     <div className="w-7 h-7 rounded-full bg-[#0a3a2e] text-white flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                     </div>
                     <span className="text-[11px] font-bold text-[#0a3a2e]">Submitted</span>
                  </div>

                  {/* Step 2: Under Review */}
                  <div className="flex flex-col items-center gap-3 bg-white px-2">
                     <div className="w-7 h-7 rounded-full bg-[#0a3a2e] flex items-center justify-center border-4 border-white shadow-sm">
                        <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                     </div>
                     <span className="text-[11px] font-bold text-gray-900">Under Review</span>
                  </div>

                  {/* Step 3: Approved */}
                  <div className="flex flex-col items-center gap-3 bg-white px-2">
                     <div className="w-7 h-7 rounded-full bg-[#e8ebee]"></div>
                     <span className="text-[11px] font-bold text-gray-400">Approved</span>
                  </div>
               </div>
            </div>

            {/* Data Summary Card */}
            <div className="w-full bg-[#f8f9fa] rounded-2xl p-8 mb-10">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-6 mb-8">
                  <div>
                     <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Name</span>
                     <span className="text-[15px] font-bold text-gray-900">Dawit Mekonnen</span>
                  </div>
                  <div>
                     <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email</span>
                     <span className="text-[15px] font-bold text-gray-900">dawit.m@startupconnect.et</span>
                  </div>
                  <div>
                     <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Expertise</span>
                     <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 bg-[#d5f0e1] text-[#0a3a2e] text-[11px] font-bold rounded-md">Scaling Ops</span>
                        <span className="px-2.5 py-1 bg-[#d5f0e1] text-[#0a3a2e] text-[11px] font-bold rounded-md">Venture Capital</span>
                        <span className="px-2.5 py-1 bg-[#d5f0e1] text-[#0a3a2e] text-[11px] font-bold rounded-md">Fintech</span>
                     </div>
                  </div>
                  <div>
                     <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Submission Date</span>
                     <span className="text-[15px] font-bold text-gray-900">October 24, 2024</span>
                  </div>
               </div>

               <div className="pt-5 border-t border-gray-200 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#0a3a2e] text-white flex items-center justify-center shrink-0 mt-0.5">
                     <span className="text-[10px] font-bold font-serif italic">i</span>
                  </div>
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                     Our team manually reviews every mentor profile to ensure the highest quality of mentorship. This process typically takes 48-72 hours.
                  </p>
               </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-3">
               <Link href="/login" className="w-full py-4 bg-[#0a3a2e] text-white text-[15px] font-bold rounded-xl text-center hover:bg-[#072a21] transition shadow-md">
                  Go to Sign In
               </Link>
               <button className="w-full py-4 bg-white border border-gray-300 text-gray-800 text-[15px] font-bold rounded-xl text-center hover:bg-gray-50 transition shadow-sm">
                  View Submission
               </button>
               <button className="w-full py-3 text-[#0a3a2e] text-[13px] font-bold text-center hover:underline transition mt-2">
                  Edit Submission
               </button>
            </div>

          </div>

        </div>

        {/* Bottom Footer */}
        <footer className="w-full px-12 py-8 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <span className="text-[13px] font-bold text-[#0a3a2e] tracking-widest uppercase">Mentor Portal</span>
            <div className="hidden md:block w-px h-4 bg-gray-300"></div>
            <span className="text-[13px] text-gray-500">© 2024 StartupConnect Ethiopia</span>
          </div>
          <div className="flex items-center gap-8 text-[12px] text-gray-500">
            <Link href="/privacy-policy" className="hover:text-gray-900 transition">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-gray-900 transition">Terms of Service</Link>
            <Link href="#" className="hover:text-gray-900 transition">Support</Link>
          </div>
        </footer>

      </div>
    </div>
  );
}
