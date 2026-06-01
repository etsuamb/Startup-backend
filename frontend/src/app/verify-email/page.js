"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyEmailToken } from "@/lib/authApi";
import { userFacingError } from "@/lib/userFacingErrors";

function VerifyContent() {
	const params = useSearchParams();
	const token = params.get("token");
	const mode = params.get("mode");
	const [msg, setMsg] = useState("Verifying your email…");
	const [ok, setOk] = useState(false);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		if (!token) {
			queueMicrotask(() => {
				setFailed(true);
				setMsg("This verification link is incomplete. Request a new link and try again.");
			});
			return;
		}
		verifyEmailToken(token, mode)
			.then((data) => {
				setOk(true);
				setFailed(false);
				setMsg(data.message || "Email verified.");
			})
			.catch((ex) => {
				setFailed(true);
				setMsg(userFacingError(ex, "This verification link is invalid or has expired. Request a new link and try again."));
			});
	}, [mode, token]);

	return (
		<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
			<div className="w-full max-w-md bg-white rounded-2xl border p-8 shadow-sm text-center">
				<h1 className="text-2xl font-bold mb-4">Email verification</h1>
				<p
					role={failed ? "alert" : "status"}
					className={`mb-6 rounded-xl border px-4 py-3 text-sm font-semibold ${
						ok
							? "border-green-200 bg-green-50 text-green-700"
							: failed
								? "border-red-200 bg-red-50 text-red-700"
								: "border-gray-200 bg-gray-50 text-gray-600"
					}`}
				>
					{msg}
				</p>
				<Link href={mode === "registration" ? "/register" : "/login"} className="text-sm font-bold text-[#115b4c]">
					{mode === "registration" ? "Return to registration" : "Continue to login"}
				</Link>
			</div>
		</div>
	);
}

export default function VerifyEmailPage() {
	return (
		<Suspense>
			<VerifyContent />
		</Suspense>
	);
}
