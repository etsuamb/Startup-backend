"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginRequest } from "@/lib/authApi";
import { setSession } from "@/lib/authStorage";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { routeAfterLogin, userFromLoginResponse } from "@/lib/accountGate";

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

			if (data.requires2FA) {
				sessionStorage.setItem(
					"pending_2fa",
					JSON.stringify({
						pendingToken: data.pendingToken,
						twoFactorMethod: data.twoFactorMethod,
					}),
				);
				router.push("/login/verify-2fa");
				return;
			}

			setSession({
				token: data.token,
				refreshToken: data.refreshToken,
				role: data.user?.role,
				userName: `${data.user?.first_name || ""} ${data.user?.last_name || ""}`.trim(),
			});
			routeAfterLogin(router, userFromLoginResponse(data));
		} catch (ex) {
			if (ex.data?.code === "USE_GOOGLE_LOGIN") {
				setErr("This account uses Google Sign-In. Use the Google button below.");
			} else {
				setErr(ex.message || "Login failed");
			}
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="mb-7">
			<form className="flex flex-col gap-4" onSubmit={onSubmit}>
				<div>
					<label className="mb-2 block text-xs font-bold text-gray-700">Email address</label>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						autoComplete="email"
						placeholder="you@example.com"
						className="w-full rounded-xl border border-gray-200/90 bg-white/75 px-4 py-3.5 text-sm font-medium text-gray-800 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#167b66] focus:bg-white focus:ring-4 focus:ring-[#167b66]/10"
					/>
				</div>
				<div>
					<div className="mb-2 flex items-center justify-between">
						<label className="block text-xs font-bold text-gray-700">Password</label>
						<Link href="/login/forgot-password" className="text-xs font-bold text-[#115b4c] transition hover:text-[#0c4a3b] hover:underline">
							Forgot password?
						</Link>
					</div>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						minLength={8}
						autoComplete="current-password"
						placeholder="Enter your password"
						className="w-full rounded-xl border border-gray-200/90 bg-white/75 px-4 py-3.5 text-sm font-medium text-gray-800 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#167b66] focus:bg-white focus:ring-4 focus:ring-[#167b66]/10"
					/>
				</div>
				<button
					type="submit"
					disabled={loading}
					className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#115b4c] py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(15,92,74,0.2)] transition hover:-translate-y-0.5 hover:bg-[#0c4a3b] hover:shadow-[0_12px_24px_rgba(15,92,74,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
				>
					{loading ? "Signing in..." : "Sign in"}
				</button>
				{err ? <p role="alert" className="text-sm font-medium text-red-600">{err}</p> : null}

				<div className="relative my-2">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-gray-200" />
					</div>
					<div className="relative flex justify-center">
						<span className="bg-[#f7faf9] px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">or continue with</span>
					</div>
				</div>

				<GoogleSignInButton onError={setErr} />

				<div className="mt-3 text-center">
					<p className="text-[13px] text-gray-500">
						Don&apos;t have an account?{" "}
						<Link href="/register" className="font-bold text-[#115b4c] hover:underline">
							Register
						</Link>
					</p>
					<p className="mt-2 text-[12px] text-gray-400">
						<Link href="/verify-email/resend" className="hover:underline">
							Resend verification email
						</Link>
					</p>
				</div>
			</form>
		</div>
	);
}
