"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentAccount, resendVerification } from "@/lib/authApi";
import { hasFullPlatformAccess, normalizeAuthUser } from "@/lib/accountGate";

export default function AccountAccessBanner() {
	const [user, setUser] = useState(null);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [sending, setSending] = useState(false);

	useEffect(() => {
		let alive = true;
		getCurrentAccount()
			.then((data) => {
				if (alive) {
					setUser(normalizeAuthUser(data?.user) || null);
					setError("");
				}
			})
			.catch((err) => {
				if (alive) setError(err.message || "Unable to load account access status.");
			});
		return () => {
			alive = false;
		};
	}, []);

	if (error) {
		return <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>;
	}
	if (!user || hasFullPlatformAccess(user)) return null;

	const needsEmail = user.email_verified === false;

	async function onResend() {
		setMessage("");
		setError("");
		setSending(true);
		try {
			const data = await resendVerification(user.email);
			setMessage(data?.message || "Verification email sent.");
		} catch (err) {
			setError(err.message || "Could not send verification email.");
		} finally {
			setSending(false);
		}
	}

	return (
		<div
			className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
				needsEmail
					? "border-amber-200 bg-amber-50 text-amber-950"
					: "border-blue-200 bg-blue-50 text-blue-950"
			}`}
		>
			<p className="font-semibold">
				{needsEmail ? "Verify your email to unlock the platform" : "Waiting for admin approval"}
			</p>
			<p className="mt-1 text-[13px] opacity-90">
				{needsEmail
					? "Use a real email you control below. Until it is verified, only account settings are available."
					: "Your email is verified. An administrator must approve your account before you can use the rest of the site."}
			</p>
			{needsEmail ? (
				<div className="mt-3 flex flex-wrap items-center gap-3">
					<button
						type="button"
						onClick={onResend}
						disabled={sending}
						className="rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
					>
						{sending ? "Sending…" : "Resend verification email"}
					</button>
					<Link href="/verify-email/resend" className="text-xs font-semibold underline">
						Change email on file
					</Link>
				</div>
			) : null}
			{message ? <p className="mt-2 text-xs">{message}</p> : null}
		</div>
	);
}
