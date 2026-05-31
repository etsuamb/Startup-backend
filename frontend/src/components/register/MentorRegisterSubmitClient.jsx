"use client";

import { useState } from "react";
import Link from "next/link";
import { useRegFlow } from "@/components/register/RegFlowProvider";
import SubmitRegisterButton from "@/components/register/SubmitRegisterButton";

export default function MentorRegisterSubmitClient() {
	const [accepted, setAccepted] = useState(false);
	const { fields, files, setFile } = useRegFlow();
	const f = fields || {};
	const fl = files || {};

	return (
		<div className="flex flex-col gap-4 w-full mt-4">
			<div className="grid gap-4 md:grid-cols-2">
				<div className="px-1">
					<label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">
						Certification files (optional)
					</label>
					<input
						type="file"
						accept=".pdf,application/pdf"
						data-file-kind="pdf"
						multiple
						className="text-xs w-full"
						onChange={(e) => {
							const filesArray = Array.from(e.target.files || []);
							if (filesArray.length) setFile("certifications", filesArray);
						}}
					/>
				<p className="text-[10px] text-gray-500 mt-2">
					Optional documents help verify your mentorship experience during approval.
				</p>
			</div>
			<div className="px-1">
				<label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">
					Introduction video (optional)
				</label>
				<input
					type="file"
					accept="video/mp4,video/quicktime,video/webm"
					data-file-kind="video"
					className="text-xs w-full"
					onChange={(e) => {
					const file = e.target.files && e.target.files[0];
					if (file) setFile("intro_video", file);
					}}
				/>
				<p className="text-[10px] text-gray-500 mt-2">
					Introduce yourself with a short video to help founders understand your style.
				</p>
			</div>
		</div>

		<p className="text-[11px] text-gray-600 px-1">
			Review: {f.full_name || "—"} · {f.email || "—"} · {fl.certifications?.length
				? `${fl.certifications.length} certification file(s) selected`
				: "No certification files selected"}
		</p>

		<div className="flex justify-between items-center mt-2 pt-6 border-t border-gray-100">
			<Link
				href="/register/mentor/step2"
				className="text-xs font-bold text-[#0f3d32] hover:text-[#136150] transition flex items-center gap-1.5 px-2 py-2"
			>
				Back
			</Link>
			<SubmitRegisterButton
				nextPath="/register/mentor/success"
				disabled={!accepted}
				className="bg-[#0f3d32] hover:bg-[#0a2921] text-white text-xs font-bold py-3 px-8 rounded-full transition shadow-lg shadow-[#0f3d32]/20 flex items-center justify-center gap-2"
			>
				Submit registration
			</SubmitRegisterButton>
		</div>
	</div>
	);
}
