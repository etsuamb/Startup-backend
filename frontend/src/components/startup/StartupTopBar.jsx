"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import { clearSession } from "@/lib/authStorage";

function initials(value) {
	const text = String(value || "Startup").trim();
	return text
		.split(/\s+/)
		.filter(Boolean)
		.map((word) => word[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

export default function StartupTopBar({
	searchValue = "",
	onSearchChange,
	onSearchSubmit,
	searchPlaceholder = "Search startup workspace...",
	profileName = "My Startup",
	profileSubtitle = "Startup account",
	refreshing = false,
	onRefresh,
}) {
	const router = useRouter();
	const [menuOpen, setMenuOpen] = useState(false);
	const avatar = useMemo(() => initials(profileName), [profileName]);

	function handleSearchSubmit(event) {
		event.preventDefault();
		if (onSearchSubmit) onSearchSubmit(searchValue);
	}

	function handleLogout() {
		clearSession();
		router.push("/login");
	}

	return (
		<header className="sticky top-0 z-30 border-b border-gray-100 bg-white px-4 py-4 shadow-sm sm:px-8">
			<div className="flex items-center gap-4">
				<form onSubmit={handleSearchSubmit} className="relative hidden w-full max-w-xl sm:block">
					<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
						<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
						</svg>
					</div>
					<input
						type="search"
						value={searchValue}
						onChange={(event) => onSearchChange?.(event.target.value)}
						placeholder={searchPlaceholder}
						className="h-11 w-full rounded-full border border-gray-100 bg-[#f6f8f9] pl-10 pr-4 text-sm outline-none transition focus:border-[#0f3d32] focus:bg-white focus:ring-2 focus:ring-[#0f3d32]/10"
					/>
				</form>

				<div className="ml-auto flex items-center gap-2 sm:gap-3">
					{onRefresh && (
						<button
							type="button"
							onClick={onRefresh}
							disabled={refreshing}
							className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-50 hover:text-[#0f3d32] disabled:opacity-50"
							aria-label="Refresh"
							title="Refresh"
						>
							<svg className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.58m15.36 2A8 8 0 0 0 4.58 9m0 0H9m11 11v-5h-.58m0 0a8 8 0 0 1-15.36-2m15.36 2H15" />
							</svg>
						</button>
					)}

					<NotificationBell />

					<div className="relative">
						<button
							type="button"
							onClick={() => setMenuOpen((open) => !open)}
							className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-gray-50"
							aria-label="Profile menu"
							aria-expanded={menuOpen}
						>
							<div className="hidden text-right sm:block">
								<p className="max-w-40 truncate text-sm font-bold text-gray-900">{profileName}</p>
								<p className="max-w-40 truncate text-xs text-gray-500">{profileSubtitle}</p>
							</div>
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f3d32] text-sm font-bold text-white">
								{avatar}
							</div>
						</button>

						{menuOpen && (
							<div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white py-2 shadow-lg">
								<Link href="/startup/settings" className="block px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
									Profile and settings
								</Link>
								<Link href="/startup/dashboard" className="block px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
									Dashboard
								</Link>
								<button
									type="button"
									onClick={handleLogout}
									className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
								>
									Sign out
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
