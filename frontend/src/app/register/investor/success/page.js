"use client";
import Link from "next/link";

export default function InvestorRegistrationSuccess() {
  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans text-gray-900 flex flex-col lg:flex-row">
      
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

      {/* Main Content Form Side */}
      <div className="w-full lg:w-[60%] flex flex-col pt-10 pb-6 px-4 md:px-8 overflow-y-auto justify-center items-center">
        <div className="w-full max-w-[850px] bg-white rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 p-12 lg:p-16 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-700">
          
          {/* Success Icon */}
          <div className="w-24 h-24 bg-[#eaf4f1] rounded-3xl flex items-center justify-center text-[#0f3d32] mb-8 shadow-inner border border-[#0f3d32]/10 relative">
             <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.952 11.952 0 01-9.618 3.07L3 7c0 5.148 2.214 9.774 5.765 13.041a1.996 1.996 0 002.47 0C14.786 16.774 17 12.148 17 7l-.382-.986z"></path></svg>
             <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                <div className="w-6 h-6 bg-[#0f3d32] rounded-full flex items-center justify-center text-white">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
             </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#e2e8f0] text-gray-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-gray-200">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
            Pending Approval
          </div>

          <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 tracking-tight">Registration Submitted</h1>
          <p className="text-lg text-gray-500 font-medium max-w-2xl mb-12 leading-relaxed">
            Your investor account has been submitted for admin verification. Your profile and uploaded documents are <span className="text-gray-900 font-bold">now under review</span>.
          </p>

          {/* Info Box */}
          <div className="w-full max-w-xl bg-gray-50 border border-gray-100 rounded-3xl p-8 flex items-start gap-5 text-left mb-12">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#0f3d32] shrink-0 border border-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              Your email is verified. Standard review time is <span className="text-gray-900 font-bold">24-48 business hours</span>. You will receive an automated notification via your registered email once your account has been approved and activated.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Link href="/login" className="flex-grow px-8 py-4 bg-[#0f3d32] text-white rounded-2xl text-base font-bold hover:bg-[#0a2921] transition shadow-lg shadow-[#0f3d32]/20 text-center">
              Go to Login
            </Link>
            <Link href="/" className="flex-grow px-8 py-4 bg-[#f1f5f9] text-gray-600 rounded-2xl text-base font-bold hover:bg-[#e2e8f0] transition text-center">
              Back to Home
            </Link>
          </div>

          {/* Footer Highlights */}
          <div className="mt-16 pt-12 border-t border-gray-100 w-full grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { id: 'secure', label: 'SECURE VERIFICATION', icon: 'shield' },
               { id: 'admin', label: 'ADMIN REVIEWED', icon: 'check' },
               { id: 'verified', label: 'VERIFIED PLATFORM', icon: 'badge' }
             ].map((item) => (
               <div key={item.id} className="flex flex-col items-center gap-3">
                  <div className="text-gray-400">
                    {item.icon === 'shield' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.952 11.952 0 01-9.618 3.07L3 7c0 5.148 2.214 9.774 5.765 13.041a1.996 1.996 0 002.47 0C14.786 16.774 17 12.148 17 7l-.382-.986z"></path></svg>}
                    {item.icon === 'check' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>}
                    {item.icon === 'badge' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>}
                  </div>
                  <span className="text-[10px] font-black text-gray-400 tracking-[0.2em]">{item.label}</span>
               </div>
             ))}
          </div>

        </div>
      </div>

    </div>
  );
}
