"use client";

import { useEffect, useState } from "react";
import { useRegFlow } from "@/components/register/RegFlowProvider";
import { loadRegistrationAccountInfo } from "@/lib/registerAccountStorage";

export default function StartupRegisterReviewClient() {
	const [accountInfo, setAccountInfo] = useState({});
	const { fields, files } = useRegFlow();
	const f = fields || {};
	const fl = files || {};

	useEffect(() => {
		setAccountInfo(loadRegistrationAccountInfo() || {});
	}, []);

	const fullName = f.founder_full_name || accountInfo.full_name || `${accountInfo.first_name || ""} ${accountInfo.last_name || ""}`.trim();
	const email = f.email || accountInfo.email;
	const phone = f.phone_number || accountInfo.phone_number;

	return (
		<>
			<div className="bg-white rounded-xl p-5 border border-gray-100 grid grid-cols-2 gap-y-6 gap-x-8">
				<div>
					<h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
						Full name
					</h4>
					<p className="text-sm font-medium text-gray-900">
						{fullName || "—"}
					</p>
				</div>
				<div>
					<h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
						Email
					</h4>
					<p className="text-sm font-medium text-gray-900">{email || "—"}</p>
				</div>
				<div>
					<h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
						Phone
					</h4>
					<p className="text-sm font-medium text-gray-900">
						{phone || "—"}
					</p>
				</div>
				<div>
					<h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
						Founder role
					</h4>
					<p className="text-sm font-medium text-gray-900">
						{f.founder_role || "—"}
					</p>
				</div>
			</div>

			<div className="bg-white rounded-xl p-5 border border-gray-100 grid grid-cols-2 gap-y-6 gap-x-8 mt-6">
				<div className="col-span-2">
					<h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
						Startup name
					</h4>
					<p className="text-[15px] font-bold text-gray-900">
						{f.startup_name || "—"}
					</p>
				</div>
				<div>
					<h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
						Industry
					</h4>
					<p className="text-sm font-medium text-gray-900">{f.industry || "—"}</p>
				</div>
				<div>
					<h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
						Stage / type
					</h4>
					<p className="text-sm font-medium text-gray-900">
						{f.business_stage || "—"} · {f.startup_type || "—"}
					</p>
				</div>
				<div className="col-span-2">
					<h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
						Tagline
					</h4>
					<p className="text-sm font-medium text-gray-700">
						{f.startup_tagline || "—"}
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
				<div className="bg-white rounded-xl p-4 border border-gray-100">
					<h4 className="text-xs font-bold text-[#115b4c] mb-1">Founder ID</h4>
					<p className="text-[10px] text-gray-500">
						{fl.founder_id?.name || "Missing"}
					</p>
				</div>
				<div className="bg-white rounded-xl p-4 border border-gray-100">
					<h4 className="text-xs font-bold text-[#115b4c] mb-1">
						Business registration
					</h4>
					<p className="text-[10px] text-gray-500">
						{fl.business_registration_proof?.name || "Missing"}
					</p>
				</div>
				<div className="bg-white rounded-xl p-4 border border-gray-100">
					<h4 className="text-xs font-bold text-[#115b4c] mb-1">TIN (optional)</h4>
					<p className="text-[10px] text-gray-500">
						{fl.tin_certificate?.name || "—"}
					</p>
				</div>
			</div>

		</>
	);
}
