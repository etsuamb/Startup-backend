"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginRequest } from "@/lib/authApi";
import { setSession } from "@/lib/authStorage";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { routeAfterLogin, userFromLoginResponse } from "@/lib/accountGate";
import { userFacingError } from "@/lib/userFacingErrors";

export default function LoginForm() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
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

			const user = userFromLoginResponse(data);
			const twoFactorEnabled =
				data.twoFactorEnabled === true || user?.two_factor_enabled === true;
			if (!twoFactorEnabled && user?.role !== "Admin") {
				sessionStorage.setItem("prompt_2fa_setup", "true");
				router.push("/login/setup-2fa-optional");
				return;
			}

			routeAfterLogin(router, user);
		} catch (ex) {
			setErr(userFacingError(ex, "Sign-in failed. Check your email and password."));
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
					<label htmlFor="login-password" className="mb-2 block text-xs font-bold text-gray-700">
						Password
					</label>
					<div className="relative">
						<input
							id="login-password"
							type={showPassword ? "text" : "password"}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={8}
							autoComplete="current-password"
							placeholder="Enter your password"
							className="w-full rounded-xl border border-gray-200/90 bg-white/75 py-3.5 pl-4 pr-12 text-sm font-medium text-gray-800 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#167b66] focus:bg-white focus:ring-4 focus:ring-[#167b66]/10"
						/>
						<button
							type="button"
							onClick={() => setShowPassword((current) => !current)}
							className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 transition hover:text-gray-700"
							aria-label={showPassword ? "Hide password" : "Show password"}
						>
							{showPassword ? (
								<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M13.875 18.825A10.05 10.05 0 0112 19.5c-5.523 0-10-4.477-10-10 0-1.269.237-2.482.665-3.61m4.92 1.31a4 4 0 015.496 5.496m1.135 1.135A3.978 3.978 0 0016 12c0-2.21-1.79-4-4-4a3.978 3.978 0 00-2.85 1.165M15 15l4.5 4.5M4.5 4.5L9 9"
									/>
								</svg>
							) : (
								<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/>
								</svg>
							)}
						</button>
					</div>
					<div className="mt-2 flex justify-end">
						<Link
							href="/login/forgot-password"
							className="text-xs font-bold text-[#115b4c] transition hover:text-[#0c4a3b] hover:underline"
						>
							Forgot password?
						</Link>
					</div>
				</div>
				<button
					type="submit"
					disabled={loading}
					className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#115b4c] py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(15,92,74,0.2)] transition hover:-translate-y-0.5 hover:bg-[#0c4a3b] hover:shadow-[0_12px_24px_rgba(15,92,74,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
				>
					{loading ? "Signing in..." : "Sign in"}
				</button>
				{err ? (
					<p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
						{err}
					</p>
				) : null}

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
