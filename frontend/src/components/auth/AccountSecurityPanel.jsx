"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
	disable2FA,
	enable2FA,
	get2FAStatus,
	sendEnable2FAOtp,
	setup2FA,
} from "@/lib/authApi";

export default function AccountSecurityPanel({ showToast }) {
	const [loading, setLoading] = useState(true);
	const [enabled, setEnabled] = useState(false);
	const [method, setMethod] = useState(null);
	const [step, setStep] = useState("idle");
	const [setupMethod, setSetupMethod] = useState("totp");
	const [otpauthUrl, setOtpauthUrl] = useState("");
	const [secret, setSecret] = useState("");
	const [code, setCode] = useState("");
	const [backupCodes, setBackupCodes] = useState([]);
	const [disablePassword, setDisablePassword] = useState("");
	const [err, setErr] = useState("");

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const data = await get2FAStatus();
			setEnabled(!!data.enabled);
			setMethod(data.method);
		} catch {
			/* ignore */
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	async function startTotpSetup() {
		setErr("");
		setSetupMethod("totp");
		try {
			const data = await setup2FA();
			setSecret(data.secret || "");
			setOtpauthUrl(data.otpauthUrl || "");
			setStep("verify");
		} catch (ex) {
			showToast?.(ex.message || "Could not start 2FA setup", "error");
		}
	}

	async function startEmailSetup() {
		setErr("");
		setSetupMethod("email");
		try {
			await sendEnable2FAOtp();
			setStep("verify");
			showToast?.("Verification code sent to your email");
		} catch (ex) {
			showToast?.(ex.message || "Could not send code", "error");
		}
	}

	async function confirmEnable(e) {
		e.preventDefault();
		setErr("");
		if (!code.trim()) {
			setErr("Enter the verification code");
			return;
		}
		try {
			const data = await enable2FA(setupMethod, code.trim());
			setBackupCodes(data.backupCodes || []);
			setEnabled(true);
			setMethod(setupMethod);
			setStep("backup");
			setCode("");
			showToast?.("Two-factor authentication enabled");
		} catch (ex) {
			setErr(ex.message || "Invalid code");
		}
	}

	async function handleDisable() {
		try {
			await disable2FA(disablePassword, code || undefined);
			setEnabled(false);
			setMethod(null);
			setStep("idle");
			setDisablePassword("");
			setCode("");
			showToast?.("Two-factor authentication disabled");
		} catch (ex) {
			showToast?.(ex.message || "Could not disable 2FA", "error");
		}
	}

	if (loading) {
		return <p className="text-sm text-gray-500">Loading security settings…</p>;
	}

	return (
		<div className="space-y-4">
			<p className="text-xs text-gray-500">
				Use an authenticator app or email codes at login.{" "}
				<Link href="/login/forgot-password" className="text-[#0f5c4a] font-bold hover:underline">
					Forgot password?
				</Link>
			</p>

			{!enabled && step === "idle" && (
				<div className="flex flex-wrap gap-3">
					<button
						type="button"
						onClick={startTotpSetup}
						className="rounded-xl bg-[#0f3d32] px-4 py-2.5 text-sm font-bold text-white"
					>
						Authenticator app
					</button>
					<button
						type="button"
						onClick={startEmailSetup}
						className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700"
					>
						Email OTP
					</button>
				</div>
			)}

			{step === "verify" && (
				<form onSubmit={confirmEnable} className="space-y-4 max-w-md">
					{setupMethod === "totp" && secret && (
						<div className="rounded-xl bg-gray-50 border p-4 text-sm">
							<p className="font-bold mb-2">Scan in your authenticator app</p>
							{otpauthUrl ? (
								<p className="text-xs break-all text-gray-600 mb-2">{otpauthUrl}</p>
							) : null}
							<code className="text-xs font-mono select-all">{secret}</code>
						</div>
					)}
					<input
						value={code}
						onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
						placeholder="6-digit code"
						className="w-full rounded-xl border px-4 py-3 text-center tracking-widest font-mono"
						maxLength={8}
					/>
					{err ? <p className="text-xs text-red-600">{err}</p> : null}
					<div className="flex gap-2">
						<button type="button" onClick={() => setStep("idle")} className="flex-1 rounded-xl border py-2 text-sm font-bold">
							Cancel
						</button>
						<button type="submit" className="flex-1 rounded-xl bg-[#0f3d32] text-white py-2 text-sm font-bold">
							Enable
						</button>
					</div>
				</form>
			)}

			{step === "backup" && backupCodes.length > 0 && (
				<div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
					<p className="text-sm font-bold text-amber-900 mb-2">Save these backup codes</p>
					<ul className="grid grid-cols-2 gap-2 font-mono text-sm">
						{backupCodes.map((c) => (
							<li key={c}>{c}</li>
						))}
					</ul>
					<button type="button" onClick={() => setStep("idle")} className="mt-4 text-sm font-bold text-[#0f5c4a]">
						Done
					</button>
				</div>
			)}

			{enabled && step === "idle" && (
				<div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-3">
					<p className="text-sm font-bold text-emerald-900">
						2FA active ({method === "email" ? "Email" : "Authenticator"})
					</p>
					<input
						type="password"
						value={disablePassword}
						onChange={(e) => setDisablePassword(e.target.value)}
						placeholder="Your password to disable"
						className="w-full rounded-xl border px-4 py-2 text-sm"
					/>
					<input
						value={code}
						onChange={(e) => setCode(e.target.value)}
						placeholder="Optional current 2FA code"
						className="w-full rounded-xl border px-4 py-2 text-sm"
					/>
					<button type="button" onClick={handleDisable} className="text-sm font-bold text-red-700">
						Disable 2FA
					</button>
				</div>
			)}
		</div>
	);
}
