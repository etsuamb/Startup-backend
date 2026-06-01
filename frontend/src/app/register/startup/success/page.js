import Link from "next/link";

export default function StartupRegistrationSuccess() {
  return (
    <div className="min-h-screen bg-[#f4f5f7] font-sans text-gray-900 flex flex-col relative">
      
      {/* Header */}
      <header className="py-4 px-6 md:px-12 flex justify-between items-center w-full bg-white shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0f3d32] rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.5 10.5L21 3m-7.5 7.5L9 15m4.5-4.5l3 3m-3-3L10.5 9m-4.5 4.5l-3 3m3-3L3 18.5m6-4.5l-3 3M19.5 4.5l-3 3"></path></svg>
          </div>
          <div className="flex flex-col">
             <span className="font-bold text-[#0f3d32] leading-tight text-lg">StartupConnect</span>
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Founder Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm font-bold">
          <Link href="/contact" className="text-gray-500 hover:text-gray-800 transition hidden sm:block">Need Help?</Link>
          <Link href="/login" className="text-[#0f3d32] hover:text-[#136150] transition">Go to Login</Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12 w-full max-w-4xl mx-auto">
        
        {/* Success Card */}
        <div className="w-full bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] px-8 py-16 sm:px-16 flex flex-col items-center text-center border border-gray-100">
          
          {/* Top Icon */}
          <div className="w-20 h-20 bg-[#cbe3d8] rounded-2xl flex items-center justify-center text-[#2d5849] mb-8 shadow-sm">
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
               <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Status Pill */}
          <div className="bg-[#e2f0ea] text-[#136150] px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-6">
            <div className="w-1.5 h-1.5 bg-[#136150] rounded-full"></div>
            Pending Approval
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Registration Submitted</h1>
          <p className="text-gray-600 mb-10 text-lg max-w-lg leading-relaxed">
            Your founder account has been submitted for admin verification. Your profile and uploaded documents are now under review.
          </p>

          {/* Alert Box */}
          <div className="bg-[#f8f9fa] rounded-xl p-6 w-full max-w-2xl flex items-start gap-4 mb-10 text-left border border-gray-100">
            <div className="text-[#0f3d32] shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              Your email is verified. Standard review time is 24-48 business hours. You will receive an automated notification via your registered email once your account has been approved and activated.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full mb-16">
            <Link href="/login" className="px-10 py-4 bg-[#0f3d32] hover:bg-[#0a2921] text-white font-bold rounded-lg shadow-md transition text-sm">
              Go to Login
            </Link>
            <Link href="/" className="px-10 py-4 bg-[#e9ecef] hover:bg-[#dee2e6] text-gray-800 font-bold rounded-lg transition text-sm">
              Back to Home
            </Link>
          </div>

          {/* Bottom Badges */}
          <div className="w-full border-t border-gray-100 pt-10 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4 max-w-2xl mx-auto">
              
              <div className="flex flex-col items-center text-center gap-2">
                <div className="text-[#0f3d32]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                </div>
                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Secure Verification</span>
              </div>

              <div className="flex flex-col items-center text-center gap-2">
                <div className="text-[#0f3d32]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Admin Reviewed</span>
              </div>

              <div className="flex flex-col items-center text-center gap-2">
                <div className="text-[#0f3d32]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Verified Platform</span>
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* Live Support Floating Badge */}
      <div className="absolute bottom-6 right-6 bg-white rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.05)] px-4 py-3 flex items-center gap-3 border border-gray-100 cursor-pointer hover:shadow-md transition">
        <div className="w-2.5 h-2.5 bg-[#8b4513] rounded-full relative">
           <div className="absolute inset-0 bg-[#8b4513] rounded-full animate-ping opacity-75"></div>
        </div>
        <span className="text-[10px] font-bold text-[#0f3d32]">Live Support Active</span>
      </div>

    </div>
  );
}
