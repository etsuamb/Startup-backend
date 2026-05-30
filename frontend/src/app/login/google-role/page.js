"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { googleCompleteRole } from "@/lib/authApi";
import {
	clearRegistrationAccountInfo,
	saveRegistrationAccountInfo,
} from "@/lib/registerAccountStorage";

const ROLES = [
	{ id: "Startup", label: "Startup Founder", href: "/register/startup" },
	{ id: "Investor", label: "Investor", href: "/register/investor" },
	{ id: "Mentor", label: "Mentor", href: "/register/mentor" },
];

export default function GoogleRolePage() {
	const router = useRouter();
	const [signup, setSignup] = useState(null);
	const [loading, setLoading] = useState(false);
	const [err, setErr] = useState("");

	useEffect(() => {
		try {
			const raw = sessionStorage.getItem("google_signup");
			if (!raw) {
				router.replace("/login");
				return;
			}
			setSignup(JSON.parse(raw));
		} catch {
			router.replace("/login");
		}
	}, [router]);

	async function pickRole(role, href) {
		setErr("");
		setLoading(true);
		try {
			const data = await googleCompleteRole(signup.googleSignupToken, role);
			sessionStorage.removeItem("google_signup");
			if (data.googleSignupToken) {
				sessionStorage.setItem("google_profile_token", data.googleSignupToken);
			}
			clearRegistrationAccountInfo();
			saveRegistrationAccountInfo({
				first_name: data.user?.first_name || signup.profile?.firstName || "",
				last_name: data.user?.last_name || signup.profile?.lastName || "",
				full_name:
					`${data.user?.first_name || signup.profile?.firstName || ""} ${
						data.user?.last_name || signup.profile?.lastName || ""
					}`.trim(),
				email: data.user?.email || signup.profile?.email || "",
				phone_number: data.user?.phone_number || "",
			});
			router.push(href);
		} catch (ex) {
			setErr(ex.message || "Could not create account");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
			<div className="w-full max-w-lg bg-white rounded-2xl border p-8 shadow-sm">
				<h1 className="text-2xl font-bold mb-2">Choose your role</h1>
				<p className="text-sm text-gray-500 mb-6">
					Signed in as {signup?.profile?.email}. Select how you&apos;ll use StartupConnect, then complete
					your profile.
				</p>
				{err ? <p className="text-sm text-red-600 mb-4">{err}</p> : null}
				<div className="grid gap-3">
					{ROLES.map((r) => (
						<button
							key={r.id}
							type="button"
							disabled={loading}
							onClick={() => pickRole(r.id, r.href)}
							className="w-full py-4 rounded-xl border-2 border-[#0f5c4a] text-[#0f5c4a] font-bold hover:bg-[#0f5c4a] hover:text-white transition"
						>
							{r.label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
