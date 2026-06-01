"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalPageSkeleton } from "@/components/loading/PageSkeletons";
import { clearSession, getRole, getToken, setSession } from "@/lib/authStorage";
import { getCurrentAccount } from "@/lib/authApi";

export default function AdminAuthGuard({ children }) {
	const router = useRouter();
	const [ready, setReady] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		let cancelled = false;

		async function verifyAdminSession() {
			const token = getToken();
			const role = getRole();
			if (!token || role !== "Admin") {
				router.replace("/login");
				return;
			}
			try {
				const data = await getCurrentAccount();
				const user = data?.user;
				if (user?.role !== "Admin") {
					clearSession();
					router.replace("/login");
					return;
				}
				setSession({
					token,
					role: "Admin",
					userName: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || "Admin",
				});
				if (!cancelled) setReady(true);
			} catch (ex) {
				if (!cancelled) {
					setError(ex.message || "Unable to verify admin session.");
					setReady(false);
				}
			}
		}

		verifyAdminSession();
		return () => {
			cancelled = true;
		};
	}, [router]);

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-6 text-center">
				<div className="max-w-md rounded-2xl border border-red-100 bg-white p-6 text-sm text-slate-700 shadow-sm">
					<p className="font-bold text-red-700">Admin access could not be verified.</p>
					<p className="mt-2">{error}</p>
					<button type="button" onClick={() => router.replace("/login")} className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white">
						Go to login
					</button>
				</div>
			</div>
		);
	}

	if (!ready) return <PortalPageSkeleton includeShell />;

	return children;
}
