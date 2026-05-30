"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentAccount } from "@/lib/authApi";
import { getRole, getToken } from "@/lib/authStorage";
import {
	hasFullPlatformAccess,
	isSettingsPath,
	normalizeAuthUser,
	settingsPathForRole,
} from "@/lib/accountGate";

export default function AccountAccessGuard({ children, requiredRole }) {
	const router = useRouter();
	const pathname = usePathname();
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let alive = true;

		async function check() {
			const token = getToken();
			const role = getRole();
			if (!token || role !== requiredRole) {
				router.replace("/login");
				return;
			}
			if (role === "Admin") {
				if (alive) setReady(true);
				return;
			}

			try {
				const data = await getCurrentAccount();
				const user = normalizeAuthUser(data?.user);
				if (!alive) return;

				if (!hasFullPlatformAccess(user) && !isSettingsPath(pathname, role)) {
					router.replace(settingsPathForRole(role));
					return;
				}
				setReady(true);
			} catch {
				if (!alive) return;
				router.replace("/login");
			}
		}

		check();
		return () => {
			alive = false;
		};
	}, [pathname, requiredRole, router]);

	if (!ready) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] text-slate-500 text-sm">
				Loading…
			</div>
		);
	}

	return children;
}
