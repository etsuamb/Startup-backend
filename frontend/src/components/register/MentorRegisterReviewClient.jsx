"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRegFlow } from "@/components/register/RegFlowProvider";
import { loadRegistrationAccountInfo } from "@/lib/registerAccountStorage";
import SubmitRegisterButton from "@/components/register/SubmitRegisterButton";

export default function MentorRegisterReviewClient() {
	const [acceptedAccuracy, setAcceptedAccuracy] = useState(false);
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const [accountInfo, setAccountInfo] = useState({});
	const { fields, files } = useRegFlow();
	const f = fields || {};
	const fl = files || {};

	useEffect(() => {
		setAccountInfo(loadRegistrationAccountInfo() || {});
	}, []);

	const fullName = f.full_name || accountInfo.full_name || `${accountInfo.first_name || ""} ${accountInfo.last_name || ""}`.trim();
	const email = f.email || accountInfo.email;
	const phone = f.phone_number || accountInfo.phone_number;

	const canSubmit = acceptedAccuracy && acceptedTerms;

	return (
		<>
			{/* Account Information */}
			<div className="grid sm:grid-cols-2 gap-6 pl-2">
				<div>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
						Full legal name
					</p>
					<p className="text-sm font-bold text-gray-800">
						{fullName || "—"}
					</p>
				</div>
				<div>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
						Work email
					</p>
					<p className="text-sm font-bold text-gray-800">{email || "—"}</p>
				</div>
				<div>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
						Phone
					</p>
					<p className="text-sm font-bold text-gray-800">
						{phone || "—"}
					</p>
				</div>
			</div>

			{/* Professional Information */}
			<div className="grid sm:grid-cols-2 gap-6 pl-2 mt-8 pt-8 border-t border-gray-100">
				<div>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
						Professional title
					</p>
					<p className="text-sm font-bold text-gray-800">
						{f.professional_title || "—"}
					</p>
				</div>
				<div>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
						Years of experience
					</p>
					<p className="text-sm font-bold text-gray-800">
						{f.year_of_experience ? `${f.year_of_experience} year(s)` : "—"}
					</p>
				</div>
				<div>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
						Language(s)
					</p>
					<p className="text-sm font-bold text-gray-800">
						{f.language || "—"}
					</p>
				</div>
				<div>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
						Expertise area
					</p>
					<p className="text-sm font-bold text-gray-800">
						{f.expertise_area || "—"}
					</p>
				</div>
			</div>

			{/* Bio and Organization */}
			<div className="mt-8 pt-8 border-t border-gray-100 pl-2">
				<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
					Professional bio
				</p>
				<p className="text-sm font-medium text-gray-700">
					{f.professional_bio || "—"}
				</p>
			</div>

			<div className="grid sm:grid-cols-2 gap-6 pl-2 mt-8 pt-8 border-t border-gray-100">
				<div>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
						Current organization
					</p>
					<p className="text-sm font-bold text-gray-800">
						{f.current_organization || "—"}
					</p>
				</div>
				<div>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
						Current title
					</p>
					<p className="text-sm font-bold text-gray-800">
						{f.current_title || "—"}
					</p>
				</div>
			</div>

			{/* Industry and Location */}
			<div className="grid sm:grid-cols-2 gap-6 pl-2 mt-6">
				<div>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
						Primary industry
					</p>
					<p className="text-sm font-bold text-gray-800">
						{f.primary_industry || "—"}
					</p>
				</div>
				<div>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
						Secondary industry
					</p>
					<p className="text-sm font-bold text-gray-800">
						{f.secondary_industry || "—"}
					</p>
				</div>
				<div>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
						City / Location
					</p>
					<p className="text-sm font-bold text-gray-800">
						{f.city_location || "—"}
					</p>
				</div>
				<div>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
						Platform preference
					</p>
					<p className="text-sm font-bold text-gray-800">
						{f.mentor_platform || "—"}
					</p>
				</div>
			</div>

			{/* LinkedIn and Availability */}
			<div className="mt-8 pt-8 border-t border-gray-100 pl-2">
				<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
					LinkedIn or portfolio
				</p>
				<p className="text-sm font-medium text-gray-700 break-all">
					{f.linkedin_portfolio || "—"}
				</p>
			</div>

			<div className="grid sm:grid-cols-2 gap-6 pl-2 mt-8 pt-8 border-t border-gray-100">
				<div>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
						Availability preference
					</p>
					<p className="text-sm font-bold text-gray-800">
						{f.availability_preference || "—"}
					</p>
				</div>
				<div>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
						Session pricing (ETB)
					</p>
					<p className="text-sm font-bold text-gray-800">
						{f.session_pricing || "—"}
					</p>
				</div>
			</div>

			{/* Mentoring Details */}
			<div className="mt-8 pt-8 border-t border-gray-100 pl-2">
				<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
					Session frequency
				</p>
				<p className="text-sm font-medium text-gray-700">
					{f.session_frequency || "—"}
				</p>
			</div>

			<div className="mt-6 pl-2">
				<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
					Mentoring style
				</p>
				<p className="text-sm font-medium text-gray-700">
					{f.mentoring_style || "—"}
				</p>
			</div>

			<div className="mt-6 pl-2">
				<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
					Notable startups mentored
				</p>
				<p className="text-sm font-medium text-gray-700">
					{f.notable_startups_mentored || "—"}
				</p>
			</div>

			<div className="mt-6 pl-2">
				<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
					Key achievement
				</p>
				<p className="text-sm font-medium text-gray-700">
					{f.key_achievement || "—"}
				</p>
			</div>

			{/* Startup Stage Focus */}
			<div className="mt-8 pt-8 border-t border-gray-100 pl-2">
				<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">
					Startup stage focus
				</p>
				<div className="text-sm text-gray-700 space-y-1">
					{f.startup_stage ? (
						Array.isArray(f.startup_stage) ? (
							f.startup_stage.length > 0 ? (
								f.startup_stage.map((stage, idx) => (
									<p key={idx}>• {stage}</p>
								))
							) : (
								<p>—</p>
							)
						) : (
							<p>• {f.startup_stage}</p>
						)
					) : (
						<p>—</p>
					)}
				</div>
			</div>

			{/* Documents */}
			<div className="mt-8 pt-8 border-t border-gray-100 pl-2">
				<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">
					Documents
				</p>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="bg-[#f7faf7] rounded-2xl p-4 border border-gray-100">
						<h4 className="text-xs font-bold text-[#115b4c] mb-1">Government ID</h4>
						<p className="text-[10px] text-gray-600">
							{fl.mentor_id?.name ? (
								<>
									<svg className="w-4 h-4 text-green-600 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
									</svg>
									{fl.mentor_id.name}
								</>
							) : (
								"Not uploaded"
							)}
						</p>
					</div>
					<div className="bg-[#f7faf7] rounded-2xl p-4 border border-gray-100">
						<h4 className="text-xs font-bold text-[#115b4c] mb-1">Certifications</h4>
						<p className="text-[10px] text-gray-600">
							{fl.certifications?.length ? (
								<>
									<svg className="w-4 h-4 text-green-600 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
									</svg>
									{fl.certifications.length} file(s)
								</>
							) : (
								"Optional - not uploaded"
							)}
						</p>
					</div>
					<div className="bg-[#f7faf7] rounded-2xl p-4 border border-gray-100">
						<h4 className="text-xs font-bold text-[#115b4c] mb-1">Intro Video</h4>
						<p className="text-[10px] text-gray-600">
							{fl.intro_video?.name ? (
								<>
									<svg className="w-4 h-4 text-green-600 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
									</svg>
									{fl.intro_video.name}
								</>
							) : (
								"Optional - not uploaded"
							)}
						</p>
					</div>
				</div>
			</div>

			{/* Final Acknowledgements */}
			<div className="mt-12 pt-8 border-t border-gray-100">
				<h2 className="text-xl font-bold text-[#115b4c] mb-6">Final Acknowledgements</h2>
				<div className="flex flex-col gap-4">
					<label className="flex items-start gap-4 cursor-pointer">
						<div className="relative flex items-center justify-center w-5 h-5 mt-0.5 rounded border border-gray-300 bg-white leading-none">
							<input
								type="checkbox"
								checked={acceptedAccuracy}
								onChange={(e) => setAcceptedAccuracy(e.target.checked)}
								className="opacity-0 absolute w-full h-full cursor-pointer peer"
								aria-label="Agree to accuracy declaration"
							/>
							<div className={`${acceptedAccuracy ? "block" : "hidden"} text-[#167b66]`}>
								<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
								</svg>
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
								checked={acceptedTerms}
								onChange={(e) => setAcceptedTerms(e.target.checked)}
								className="opacity-0 absolute w-full h-full cursor-pointer peer"
								aria-label="Agree to terms and privacy policy"
							/>
							<div className={`${acceptedTerms ? "block" : "hidden"} text-[#167b66]`}>
								<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
								</svg>
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

			{/* Submit Section */}
			<div className="flex justify-between items-center mt-8 pt-8 border-t border-gray-100">
				<Link
					href="/register/mentor/step3"
					className="flex items-center gap-2 text-sm font-bold text-gray-600 px-6 py-3 border border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-800 transition"
				>
					Back
				</Link>
				<SubmitRegisterButton
					nextPath="/register/mentor/success"
					disabled={!canSubmit}
					className="px-8 py-3.5 bg-[#0f3d32] hover:bg-[#0a2921] text-white font-bold rounded shadow-xl shadow-[#0f3d32]/20 transition text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Submit registration
				</SubmitRegisterButton>
			</div>
		</>
	);
}
