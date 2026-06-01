"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/authStorage";
import { getStartupProfile } from "@/lib/startupApi";
import { resolveUploadedFileUrl } from "@/lib/viewUploadedFile";

function initials(value) {
	return String(value || "Startup")
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.map((word) => word[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

export default function StartupProfileMenu({
	profileName = "My Startup",
	profileSubtitle = "Startup account",
	showText = true,
}) {
	const router = useRouter();
	const [menuOpen, setMenuOpen] = useState(false);
	const [profile, setProfile] = useState(null);

	useEffect(() => {
		let ignore = false;
		getStartupProfile()
			.then((data) => {
				if (!ignore) setProfile(data?.startup || data || null);
			})
			.catch(() => {
				if (!ignore) setProfile(null);
			});
		return () => {
			ignore = true;
		};
	}, []);

	const name =
		profileName !== "My Startup"
			? profileName
			: profile?.startup_name || profileName;
	const subtitle =
		profileSubtitle !== "Startup account"
			? profileSubtitle
			: profile?.admin_status || profile?.status_label || profileSubtitle;
	const imageSrc = useMemo(
		() =>
			resolveUploadedFileUrl(
				profile?.logo_url ||
					profile?.logo_path ||
					profile?.profile_image_url ||
					profile?.profile_picture_url ||
					profile?.avatar_url,
			),
		[profile],
	);

	function handleLogout() {
		clearSession();
		router.push("/login");
	}

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setMenuOpen((open) => !open)}
				className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-gray-50"
				aria-label="Profile menu"
				aria-expanded={menuOpen}
			>
				{showText ? (
					<div className="hidden text-right sm:block">
						<p className="max-w-40 truncate text-sm font-bold text-gray-900">{name}</p>
						<p className="max-w-40 truncate text-xs text-gray-500">{subtitle}</p>
					</div>
				) : null}
				{imageSrc ? (
					<img
						src={imageSrc}
						alt={`${name} logo`}
						className="h-10 w-10 shrink-0 rounded-full border border-gray-100 object-cover"
					/>
				) : (
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f3d32] text-sm font-bold text-white">
						{initials(name)}
					</div>
				)}
			</button>

			{menuOpen ? (
				<div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border border-gray-100 bg-white py-2 shadow-lg">
					<Link
						href="/startup/settings"
						className="block px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
					>
						Settings
					</Link>
					<button
						type="button"
						onClick={handleLogout}
						className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
					>
						Log out
					</button>
				</div>
			) : null}
		</div>
	);
}
