"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyEmailToken } from "@/lib/authApi";

function VerifyContent() {
	const params = useSearchParams();
	const token = params.get("token");
	const mode = params.get("mode");
	const [msg, setMsg] = useState("Verifying your email…");
	const [ok, setOk] = useState(false);

	useEffect(() => {
		if (!token) {
			queueMicrotask(() => setMsg("Missing verification token."));
			return;
		}
		verifyEmailToken(token, mode)
			.then((data) => {
				setOk(true);
				setMsg(data.message || "Email verified.");
			})
			.catch((ex) => setMsg(ex.message || "Verification failed"));
	}, [mode, token]);

	return (
		<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
			<div className="w-full max-w-md bg-white rounded-2xl border p-8 shadow-sm text-center">
				<h1 className="text-2xl font-bold mb-4">Email verification</h1>
				<p className={`text-sm mb-6 ${ok ? "text-green-700" : "text-gray-600"}`}>{msg}</p>
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
