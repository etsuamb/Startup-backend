"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/authApi";

function ResetForm() {
	const params = useSearchParams();
	const token = params.get("token") || "";
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [msg, setMsg] = useState("");
	const [err, setErr] = useState("");
	const [loading, setLoading] = useState(false);

	async function onSubmit(e) {
		e.preventDefault();
		setErr("");
		setMsg("");
		setLoading(true);
		try {
			const data = await resetPassword(token, newPassword, confirmPassword);
			setMsg(data.message || "Password reset. You can sign in now.");
		} catch (ex) {
			setErr(ex.message || "Reset failed");
		} finally {
			setLoading(false);
		}
	}

	if (!token) {
		return <p className="text-sm text-red-600">Invalid reset link.</p>;
	}

	return (
		<form onSubmit={onSubmit} className="space-y-4">
			{err ? <p className="text-sm text-red-600">{err}</p> : null}
			{msg ? <p className="text-sm text-green-700">{msg}</p> : null}
			<input
				type="password"
				required
				minLength={8}
				value={newPassword}
				onChange={(e) => setNewPassword(e.target.value)}
				placeholder="New password"
				className="w-full rounded-xl border px-4 py-3"
			/>
			<input
				type="password"
				required
				minLength={8}
				value={confirmPassword}
				onChange={(e) => setConfirmPassword(e.target.value)}
				placeholder="Confirm password"
				className="w-full rounded-xl border px-4 py-3"
			/>
			<button type="submit" disabled={loading} className="w-full py-3 bg-[#0f5c4a] text-white font-bold rounded-xl">
				{loading ? "Saving…" : "Reset password"}
			</button>
			<Link href="/login" className="block text-center text-sm font-bold text-[#115b4c]">
				Sign in
			</Link>
		</form>
	);
}

export default function ResetPasswordPage() {
	return (
		<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
			<div className="w-full max-w-md bg-white rounded-2xl border p-8 shadow-sm">
				<h1 className="text-2xl font-bold mb-6">Reset password</h1>
				<Suspense>
					<ResetForm />
				</Suspense>
			</div>
		</div>
	);
}
