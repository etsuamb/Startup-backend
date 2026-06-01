"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalPageSkeleton } from "@/components/loading/PageSkeletons";
import { getRole, getToken } from "@/lib/authStorage";

export default function MentorAuthGuard({ children }) {
	const router = useRouter();
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let cancelled = false;
		const token = getToken();
		const role = getRole();
		if (!token || role !== "Mentor") {
			router.replace("/login");
			return;
		}
		queueMicrotask(() => {
			if (!cancelled) setReady(true);
		});
		return () => {
			cancelled = true;
		};
	}, [router]);

	if (!ready) return <PortalPageSkeleton includeShell />;

	return children;
}
