"use client";

import { useState } from "react";
import Link from "next/link";
import { resendVerification } from "@/lib/authApi";

export default function ResendVerificationPage() {
	const [email, setEmail] = useState("");
	const [msg, setMsg] = useState("");
	const [loading, setLoading] = useState(false);

	async function onSubmit(e) {
		e.preventDefault();
		setLoading(true);
		try {
			const data = await resendVerification(email.trim());
			setMsg(data.message || "If that account exists, we sent a verification email.");
		} catch (ex) {
			setMsg(ex.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
			<div className="w-full max-w-md bg-white rounded-2xl border p-8 shadow-sm">
				<h1 className="text-2xl font-bold mb-2">Resend verification</h1>
				<form onSubmit={onSubmit} className="space-y-4 mt-6">
					<input
						type="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full rounded-xl border px-4 py-3"
						placeholder="you@example.com"
					/>
					<button type="submit" disabled={loading} className="w-full py-3 bg-[#0f5c4a] text-white font-bold rounded-xl">
						{loading ? "Sending…" : "Resend"}
					</button>
					{msg ? <p className="text-sm text-gray-600">{msg}</p> : null}
				</form>
				<Link href="/login" className="block text-center text-sm font-bold text-[#115b4c] mt-6">
					Back to login
				</Link>
			</div>
		</div>
	);
}
