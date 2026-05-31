"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRegFlow } from "./RegFlowProvider";
import { buildRegisterFormData } from "@/lib/buildRegisterFormData";
import { clearRegistrationAccountInfo } from "@/lib/registerAccountStorage";
import { registerMultipart } from "@/lib/api";

export default function SubmitRegisterButton({
	nextPath,
	className = "",
	children,
	disabled = false,
}) {
	const router = useRouter();
	const { role, fields, files, reset } = useRegFlow();
	const [err, setErr] = useState("");
	const [loading, setLoading] = useState(false);

	async function onClick() {
		if (disabled) return;
		setErr("");
		setLoading(true);
		try {
			const fd = buildRegisterFormData(role, fields, files);
			await registerMultipart(fd);
			sessionStorage.removeItem("google_profile_token");
			clearRegistrationAccountInfo();
			reset();
			router.push(nextPath);
		} catch (e) {
			setErr(e.message || "Registration failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex flex-col items-center gap-2">
			<button
				type="button"
				disabled={loading || disabled}
				onClick={onClick}
				className={`${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
			>
				{loading ? "Submitting…" : children}
			</button>
			{err ? (
				<p role="alert" className="max-w-md rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700">
					{err}
				</p>
			) : null}
		</div>
	);
}
