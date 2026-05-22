"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginRequest } from "@/lib/api";
import { setSession } from "@/lib/authStorage";

export default function LoginForm() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [err, setErr] = useState("");
	const [loading, setLoading] = useState(false);

	async function onSubmit(e) {
		e.preventDefault();
		setErr("");
		setLoading(true);
		try {
			const data = await loginRequest(email.trim(), password);
			setSession({
				token: data.token,
				refreshToken: data.refreshToken,
				role: data.user?.role,
				userName: `${data.user?.first_name || ""} ${data.user?.last_name || ""}`.trim(),
			});
			const r = data.user?.role;
			if (r === "Startup") router.push("/startup/dashboard");
			else if (r === "Investor") router.push("/investor/dashboard");
			else if (r === "Mentor") router.push("/mentor/dashboard");
			else if (r === "Admin") router.push("/admin/dashboard");
			else router.push("/");
		} catch (ex) {
			setErr(ex.message || "Login failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-50 p-8 mb-8">
			<form className="flex flex-col gap-5" onSubmit={onSubmit}>
				{err ? (
					<p className="text-sm text-red-600 font-medium">{err}</p>
				) : null}
				<div>
					<label className="block text-xs font-bold text-gray-700 mb-2">
						Email
					</label>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						autoComplete="email"
						placeholder="you@example.com"
						className="w-full pl-4 pr-4 py-3.5 bg-[#f8f9fa] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#115b4c] transition text-sm text-gray-800 placeholder-gray-400 font-medium"
					/>
				</div>
				<div>
					<label className="block text-xs font-bold text-gray-700 mb-2">
						Password
					</label>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						minLength={8}
						autoComplete="current-password"
						placeholder="••••••••"
						className="w-full pl-4 pr-4 py-3.5 bg-[#f8f9fa] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#115b4c] transition text-[15px] tracking-widest text-gray-800 placeholder-gray-400 font-medium"
					/>
				</div>
				<button
					type="submit"
					disabled={loading}
					className="w-full py-4 bg-[#0f5c4a] hover:bg-[#0c4a3b] text-white font-bold rounded-xl shadow-[0_4px_14px_rgba(15,92,74,0.3)] transition text-[15px] flex items-center justify-center gap-2 mt-2"
				>
					{loading ? "Signing in…" : "Log In"}
				</button>
				<div className="text-center mt-6">
					<p className="text-[13px] text-gray-500">
						Don&apos;t have an account?{" "}
						<Link
							href="/register/startup"
							className="font-bold text-[#115b4c] hover:underline"
						>
							Register
						</Link>
					</p>
				</div>
			</form>
		</div>
	);
}
