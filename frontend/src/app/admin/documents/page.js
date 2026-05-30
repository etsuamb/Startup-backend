"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Documents review lives on user detail pages; this route redirects to Projects. */
export default function AdminDocumentsRedirect() {
	const router = useRouter();
	useEffect(() => {
		router.replace("/admin/projects");
	}, [router]);
	return (
		<div className="max-w-7xl mx-auto py-20 text-center text-sm text-slate-500">
			Redirecting to Projects…
		</div>
	);
}
