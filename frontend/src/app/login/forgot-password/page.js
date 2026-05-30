"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/authApi";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [msg, setMsg] = useState("");
	const [err, setErr] = useState("");
	const [loading, setLoading] = useState(false);

	async function onSubmit(e) {
		e.preventDefault();
		setErr("");
		setMsg("");
		setLoading(true);
		try {
			const data = await forgotPassword(email.trim());
			setMsg(data.message || "Check your email for reset instructions.");
		} catch (ex) {
			setErr(ex.message || "Request failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
			<div className="w-full max-w-md bg-white rounded-2xl border p-8 shadow-sm">
				<h1 className="text-2xl font-bold mb-2">Forgot password</h1>
				<p className="text-sm text-gray-500 mb-6">We&apos;ll email you a secure reset link.</p>
				<form onSubmit={onSubmit} className="space-y-4">
					{err ? <p className="text-sm text-red-600">{err}</p> : null}
					{msg ? <p className="text-sm text-green-700">{msg}</p> : null}
					<input
						type="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="you@example.com"
						className="w-full rounded-xl border px-4 py-3"
					/>
					<button
						type="submit"
						disabled={loading}
						className="w-full py-3 bg-[#0f5c4a] text-white font-bold rounded-xl"
					>
						{loading ? "Sending…" : "Send reset link"}
					</button>
				</form>
				<Link href="/login" className="block text-center text-sm font-bold text-[#115b4c] mt-6">
					Back to login
				</Link>
			</div>
		</div>
	);
}
