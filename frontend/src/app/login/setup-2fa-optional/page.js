"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sendEnable2FAOtp, setup2FA, enable2FA, getCurrentAccount } from "@/lib/authApi";
import { getToken } from "@/lib/authStorage";
import { routeAfterLogin } from "@/lib/accountGate";
import { userFacingError } from "@/lib/userFacingErrors";

/**
 * Optional 2FA setup after login. Users may skip or enable TOTP or email-based 2FA.
 */
export default function Setup2FAOptionalPage() {
	const router = useRouter();
	const [step, setStep] = useState("choice");
	const [method, setMethod] = useState(null);
	const [code, setCode] = useState("");
	const [backupCodes, setBackupCodes] = useState([]);
	const [otpauthUrl, setOtpauthUrl] = useState("");
	const [totpSecret, setTotpSecret] = useState("");
	const [err, setErr] = useState("");
	const [loading, setLoading] = useState(false);

	const continueToApp = useCallback(async () => {
		if (!getToken()) {
			router.replace("/login");
			return;
		}
		sessionStorage.removeItem("prompt_2fa_setup");
		setErr("");
		setLoading(true);
		try {
			const account = await getCurrentAccount();
			routeAfterLogin(router, account);
		} catch (ex) {
			setErr(userFacingError(ex, "Could not continue to your account. Please try again."));
		} finally {
			setLoading(false);
		}
	}, [router]);

	useEffect(() => {
		if (!getToken()) {
			router.replace("/login");
			return;
		}
		if (sessionStorage.getItem("prompt_2fa_setup") !== "true") {
			queueMicrotask(() => void continueToApp());
		}
	}, [continueToApp, router]);

	async function startEmailSetup() {
		setErr("");
		setLoading(true);
		setMethod("email");
		try {
			await sendEnable2FAOtp();
			setStep("verify");
		} catch (ex) {
			setErr(userFacingError(ex, "Could not send verification code. Try again."));
		} finally {
			setLoading(false);
		}
	}

	async function startAuthenticatorSetup() {
		setErr("");
		setLoading(true);
		setMethod("totp");
		try {
			const data = await setup2FA();
			setOtpauthUrl(data.otpauthUrl || "");
			setTotpSecret(data.secret || "");
			setStep("verify");
		} catch (ex) {
			setErr(userFacingError(ex, "Could not start setup. Try again."));
		} finally {
			setLoading(false);
		}
	}

	async function confirmSetup(e) {
		e.preventDefault();
		setErr("");
		setLoading(true);
		try {
			if (!code.trim()) {
				setErr("Please enter the verification code");
				setLoading(false);
				return;
			}
			const data = await enable2FA(method, code.trim());
			setBackupCodes(data.backupCodes || []);
			setCode("");
			setStep("backup");
		} catch (ex) {
			setErr(userFacingError(ex, "Code is invalid or expired. Try again."));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
			<div className="w-full max-w-md">
				{step === "choice" && (
					<div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
						<div className="mb-6 text-center">
							<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-full mb-4">
								<svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
								</svg>
							</div>
							<h1 className="text-2xl font-bold text-slate-900 mb-2">Secure Your Account (Optional)</h1>
							<p className="text-sm text-slate-500">
								Two-factor authentication is optional. Choose email codes or an authenticator app, or skip for now.
							</p>
						</div>

						{err ? (
							<div className="rounded-xl bg-red-50 border border-red-200 p-3 mb-4">
								<p className="text-sm text-red-700">{err}</p>
							</div>
						) : null}

						<div className="space-y-3 mb-6">
							<button
								type="button"
								onClick={startEmailSetup}
								disabled={loading}
								className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition"
							>
								Email verification code
							</button>
							<button
								type="button"
								onClick={startAuthenticatorSetup}
								disabled={loading}
								className="w-full px-4 py-3 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-900 font-bold rounded-xl transition"
							>
								Authenticator app (TOTP)
							</button>
						</div>

						<button
							type="button"
							onClick={continueToApp}
							className="w-full px-4 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition"
						>
							Skip for now
						</button>
					</div>
				)}

				{step === "verify" && (
					<div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
						<h2 className="text-2xl font-bold text-slate-900 mb-2">Enter Verification Code</h2>
						<p className="text-sm text-slate-500 mb-6">
							{method === "email"
								? "We sent a code to your email. Enter it below."
								: "Add this account in your authenticator app, then enter the 6-digit code."}
						</p>

						{method === "totp" && totpSecret ? (
							<div className="rounded-xl bg-slate-50 border border-slate-200 p-4 mb-4 text-sm">
								<p className="font-bold text-slate-800 mb-2">Manual setup key</p>
								<code className="text-xs font-mono break-all select-all">{totpSecret}</code>
								{otpauthUrl ? (
									<p className="text-xs text-slate-500 mt-2 break-all">{otpauthUrl}</p>
								) : null}
							</div>
						) : null}

						<form onSubmit={confirmSetup} className="space-y-4">
							{err ? (
								<div className="rounded-xl bg-red-50 border border-red-200 p-3">
									<p className="text-sm text-red-700">{err}</p>
								</div>
							) : null}

							<input
								type="text"
								value={code}
								onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
								placeholder="000000"
								className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-mono tracking-widest text-lg"
								maxLength={8}
								required
								disabled={loading}
								autoFocus
							/>

							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => {
										setStep("choice");
										setCode("");
										setErr("");
									}}
									disabled={loading}
									className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 disabled:opacity-50 transition"
								>
									Back
								</button>
								<button
									type="submit"
									disabled={loading}
									className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition"
								>
									{loading ? "Verifying…" : "Verify"}
								</button>
							</div>
						</form>
					</div>
				)}

				{step === "backup" && backupCodes.length > 0 && (
					<div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
						<h2 className="text-2xl font-bold text-slate-900 mb-2">Save Backup Codes</h2>
						<p className="text-sm text-slate-500 mb-6">
							Store these codes safely. Each can be used once if you lose access to your 2FA method.
						</p>

						<div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 max-h-48 overflow-y-auto">
							<ul className="grid grid-cols-2 gap-2 font-mono text-sm">
								{backupCodes.map((c) => (
									<li key={c} className="text-amber-900">
										{c}
									</li>
								))}
							</ul>
						</div>

						<button
							type="button"
							onClick={continueToApp}
							className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition"
						>
							Continue to dashboard
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
