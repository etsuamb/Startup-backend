"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRegFlow } from "@/components/register/RegFlowProvider";
import { loadRegistrationAccountInfo } from "@/lib/registerAccountStorage";
import SubmitRegisterButton from "@/components/register/SubmitRegisterButton";

export default function InvestorRegisterReviewClient() {
	const [accepted, setAccepted] = useState(false);
	const [accountInfo, setAccountInfo] = useState({});
	const { fields, files } = useRegFlow();
	const f = fields || {};
	const fl = files || {};

	useEffect(() => {
		const timeout = window.setTimeout(() => {
			setAccountInfo(loadRegistrationAccountInfo() || {});
		}, 0);
		return () => window.clearTimeout(timeout);
	}, []);

	const fullName = f.full_name || accountInfo.full_name || `${accountInfo.first_name || ""} ${accountInfo.last_name || ""}`.trim();
	const email = f.email || accountInfo.email;
	const phone = f.phone_number || accountInfo.phone_number;
	const preferredIndustries = Array.isArray(f.preferred_industry) ? f.preferred_industry.join(", ") : f.preferred_industry;

	return (
		<>
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

			<div className="grid sm:grid-cols-2 gap-6 pl-2 mt-8 pt-8 border-t border-gray-100">
				<div>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
						Investor type
					</p>
					<p className="text-sm font-bold text-gray-800">
						{f.investor_type || "—"}
					</p>
				</div>
				<div>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
						Preferred industries
					</p>
					<p className="text-sm font-bold text-gray-800">
						{preferredIndustries || "—"}
					</p>
				</div>
				<div>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
						Investment stage
					</p>
					<p className="text-sm font-bold text-gray-800">
						{f.investment_stage || "—"}
					</p>
				</div>
				<div>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
						Investment range (USD)
					</p>
					<p className="text-sm font-bold text-gray-800">
						{f.investment_range ? `${f.investment_range_min || "0"} - ${f.investment_range}` : "—"}
					</p>
				</div>
			</div>

			<div className="grid sm:grid-cols-2 gap-6 pl-2 mt-6">
				<div>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
						Location preference
					</p>
					<p className="text-sm font-bold text-gray-800">
						{f.location_preference || "—"}
					</p>
				</div>
				<div>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
						LinkedIn or website
					</p>
					<p className="text-sm font-bold text-gray-800 break-words">
						{f.linked_in_or_website || "—"}
					</p>
				</div>
			</div>

			<div className="mt-8 pt-8 border-t border-gray-100 pl-2">
				<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
					Short professional bio
				</p>
				<p className="text-sm font-medium text-gray-700">
					{f.bio || "—"}
				</p>
			</div>

			<div className="mt-8 pt-8 border-t border-gray-100 pl-2">
				<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
					Investment history summary
				</p>
				<p className="text-sm font-medium text-gray-700">
					{f.investment_history_summary || "—"}
				</p>
			</div>

			<div className="mt-8 pt-8 border-t border-gray-100 pl-2">
				<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">
					Documents
				</p>
				<ul className="text-xs text-gray-700 space-y-1">
					<li>Registration: {fl.registration_doc?.name || "—"}</li>
					<li>Trade license: {fl.trade_license?.name || "—"}</li>
					<li>TIN: {fl.tin_certificate?.name || "—"}</li>
				</ul>
			</div>

			<div className="mt-6 pl-2">
			<label className="flex items-start gap-3 cursor-pointer">
				<input
					type="checkbox"
					checked={accepted}
					onChange={(e) => setAccepted(e.target.checked)}
					className="mt-1 w-4 h-4 text-[#0f3d32] border-gray-300 rounded focus:ring-[#0f3d32]"
				/>
				<span className="text-[13px] text-gray-600 font-medium leading-snug">
					I confirm all information is accurate and authorize StartupConnect to review my investor profile.
				</span>
			</label>
		</div>

		<div className="flex justify-between items-center mt-8">
				<Link
					href="/register/investor/step3"
					className="flex items-center gap-2 text-sm font-bold text-gray-600 px-6 py-3 border border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-800 transition"
				>
					Back
				</Link>
				<SubmitRegisterButton
					nextPath="/register/investor/success"
			disabled={!accepted}
					className="px-8 py-3.5 bg-[#0f3d32] hover:bg-[#0a2921] text-white font-bold rounded shadow-xl shadow-[#0f3d32]/20 transition text-sm flex items-center gap-2"
				>
					Submit for Verification
				</SubmitRegisterButton>
			</div>
		</>
	);
}
