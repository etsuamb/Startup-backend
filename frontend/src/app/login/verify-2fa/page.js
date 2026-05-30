"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { verifyLogin2FA } from "@/lib/authApi";
import { setSession } from "@/lib/authStorage";

export default function Verify2FAPage() {
	const router = useRouter();
	const [pendingToken, setPendingToken] = useState("");
	const [method, setMethod] = useState("totp");
	const [code, setCode] = useState("");
	const [backupCode, setBackupCode] = useState("");
	const [useBackup, setUseBackup] = useState(false);
	const [err, setErr] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		try {
			const raw = sessionStorage.getItem("pending_2fa");
			if (!raw) {
				router.replace("/login");
				return;
			}
			const parsed = JSON.parse(raw);
			setPendingToken(parsed.pendingToken || "");
			setMethod(parsed.twoFactorMethod || "totp");
		} catch {
			router.replace("/login");
		}
	}, [router]);

	async function onSubmit(e) {
		e.preventDefault();
		setErr("");
		setLoading(true);
		try {
			const data = await verifyLogin2FA(
				pendingToken,
				useBackup ? undefined : code,
				useBackup ? backupCode : undefined,
			);
			sessionStorage.removeItem("pending_2fa");
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
			setErr(ex.message || "Verification failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
			<div className="w-full max-w-md bg-white rounded-2xl border p-8 shadow-sm">
				<h1 className="text-2xl font-bold mb-2">Two-factor authentication</h1>
				<p className="text-sm text-gray-500 mb-6">
					{method === "email"
						? "Enter the code we sent to your email."
						: "Enter the code from your authenticator app."}
				</p>
				<form onSubmit={onSubmit} className="space-y-4">
					{err ? <p className="text-sm text-red-600">{err}</p> : null}
					{!useBackup ? (
						<input
							value={code}
							onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
							className="w-full rounded-xl border px-4 py-3 text-center font-mono tracking-widest"
							placeholder="000000"
							maxLength={8}
							required
						/>
					) : (
						<input
							value={backupCode}
							onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
							className="w-full rounded-xl border px-4 py-3 font-mono"
							placeholder="Backup code"
							required
						/>
					)}
					<button type="submit" disabled={loading} className="w-full py-3 bg-[#0f5c4a] text-white font-bold rounded-xl">
						{loading ? "Verifying…" : "Verify"}
					</button>
					<button
						type="button"
						onClick={() => setUseBackup((v) => !v)}
						className="w-full text-sm font-bold text-[#115b4c]"
					>
						{useBackup ? "Use authenticator / email code" : "Use a backup code"}
					</button>
				</form>
				<Link href="/login" className="block text-center text-sm text-gray-500 mt-6">
					Back to login
				</Link>
			</div>
		</div>
	);
}
