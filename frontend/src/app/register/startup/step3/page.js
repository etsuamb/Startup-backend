import Link from "next/link";
import RegistrationStepForm from "@/components/register/RegistrationStepForm";

export default function StartupRegistrationStep3() {
	return (
		<div className="min-h-screen bg-[#fcfcfc] font-sans text-gray-900 flex flex-col lg:flex-row pb-24">
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
						<div className="flex items-center gap-2">
							<img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
							<span className="font-bold text-lg text-white tracking-tight">
								StartupConnect
							</span>
						</div>
					</Link>

					<h1 className="text-4xl lg:text-5xl font-light text-white mb-6 leading-tight">
						Empower the <br /> Next Generation <br /> of Ethiopian <br /> Founders
					</h1>
					<p className="text-[#10b981] text-sm leading-relaxed max-w-sm font-medium">
						Join a prestigious network of industry leaders curating the future of
						Ethiopia&apos;s innovation ecosystem through high-impact mentorship.
					</p>
				</div>

				<div className="relative z-10">
					<p className="text-[#8ba39e] text-[10px] font-medium tracking-widest uppercase opacity-50">
						&copy; 2024 StartupConnect Ethiopia. All rights reserved.
					</p>
				</div>
			</div>

			<div className="w-full lg:w-[60%] flex flex-col pt-10 pb-6 px-4 md:px-8 overflow-y-auto">
				<RegistrationStepForm
					nextHref="/register/startup/step4"
					className="w-full max-w-2xl mx-auto flex flex-col flex-1"
				>
					<div className="w-full flex items-center gap-3 mb-6 pl-4">
						<Link
							href="/register/startup/step2"
							className="text-[#167b66] hover:text-[#0f5c4a] transition"
						>
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M10 19l-7-7m0 0l7-7m-7 7h18"
								></path>
							</svg>
						</Link>
						<span className="font-bold text-lg tracking-tight text-[#115b4c]">
							Verification Documents
						</span>
					</div>

					<div className="w-full flex items-center justify-between mb-8">
						<span className="text-xs font-bold text-gray-500 tracking-wider uppercase">
							Step 3 of 4
						</span>
						<div className="flex gap-1.5">
							<div className="h-1.5 w-6 bg-gray-200 rounded-full"></div>
							<div className="h-1.5 w-6 bg-gray-200 rounded-full"></div>
							<div className="h-1.5 w-6 bg-[#167b66] rounded-full"></div>
							<div className="h-1.5 w-6 bg-gray-200 rounded-full"></div>
						</div>
					</div>

					<div className="w-full bg-[#e3f2f0] border border-[#c4e5df] rounded-xl p-5 mb-12 flex items-start gap-4">
						<div className="w-6 h-6 bg-[#115b4c] text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
							<span className="font-bold text-sm font-serif italic text-white">i</span>
						</div>
						<p className="text-sm text-[#0f5c4a] font-medium leading-relaxed">
							<span className="font-bold">Important:</span> Upload founder ID and business
							registration proof (required). Optional files help verification.
						</p>
					</div>

					<div className="w-full mb-8 flex flex-col gap-6">
						<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
							<h3 className="font-bold text-gray-900 text-[15px]">
								Founder or representative ID <span className="text-red-500">*</span>
							</h3>
							<p className="text-sm text-gray-500">
								Upload a clear image of a national ID, passport, or Kebele ID (JPG or PNG).
							</p>
							<input
								name="founder_id"
								type="file"
								required
								accept=".jpg,.jpeg,.png,image/jpeg,image/png"
								data-file-kind="image"
								className="text-sm"
							/>
						</div>

						<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
							<h3 className="font-bold text-gray-900 text-[15px]">
								Business registration proof <span className="text-red-500">*</span>
							</h3>
							<p className="text-sm text-gray-500">License or MoTI permit (PDF only).</p>
							<input
								name="business_registration_proof"
								type="file"
								required
								accept=".pdf,application/pdf"
								data-file-kind="pdf"
								className="text-sm"
							/>
						</div>

						<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
							<h3 className="font-bold text-gray-900 text-[15px]">
								Support or affiliation letter (optional)
							</h3>
							<input
								name="support_affiliation_letter"
								type="file"
								accept=".pdf,application/pdf"
								data-file-kind="pdf"
								className="text-sm"
							/>
						</div>

						<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
							<h3 className="font-bold text-gray-900 text-[15px]">TIN certificate (optional)</h3>
							<input
								name="tin_certificate"
								type="file"
								accept=".pdf,application/pdf"
								data-file-kind="pdf"
								className="text-sm"
							/>
						</div>
					</div>

					<div className="sticky bottom-0 bg-white border-t border-gray-100 py-4 flex justify-between items-center mt-auto shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
						<div>
							<span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">
								Step 3 of 4
							</span>
							<span className="text-sm font-bold text-[#115b4c]">Next: Final Review</span>
						</div>
						<button
							type="submit"
							className="px-8 py-3.5 bg-[#0f5c4a] hover:bg-[#0c4a3b] text-white font-bold rounded shadow-md transition text-sm flex items-center gap-2"
						>
							Continue to Review
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M14 5l7 7m0 0l-7 7m7-7H3"
								></path>
							</svg>
						</button>
					</div>
				</RegistrationStepForm>
			</div>
		</div>
	);
}
