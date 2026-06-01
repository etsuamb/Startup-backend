"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StartupChatSidebar({ chatKind }) {
	const pathname = usePathname();
	const isInvestor = chatKind === "investor";
	const isMentor = chatKind === "mentor";

	const optionClass = (active) =>
		`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition ${
			active
				? "bg-[#0f3d32] text-white"
				: "bg-[#0a2921] text-[#8ba39e] hover:bg-[#114638] hover:text-white"
		}`;

	return (
		<aside className="hidden md:flex w-[260px] shrink-0 flex-col border-r border-[#0f3d32] bg-[#061e16] p-5">
			<Link href="/startup/dashboard" className="mb-6 flex items-center gap-3">
				<img
					src="/logo.png"
					alt="Startup Hub Logo"
					className="h-10 w-10 object-contain"
				/>
				<div className="min-w-0">
					<p className="truncate text-base font-bold text-white">Startup Hub</p>
					<p className="text-[10px] font-bold uppercase tracking-widest text-[#10b981]">
						Chat workspace
					</p>
				</div>
			</Link>

			<div className="rounded-2xl border border-[#0f3d32] bg-[#08271e] p-3">
				<p className="px-1 text-[10px] font-bold uppercase tracking-widest text-[#4d7066]">
					Chat
				</p>
				<div className="mt-2 space-y-2">
					<Link
						href="/startup/chat"
						className={optionClass(isInvestor || pathname === "/startup/chat")}
					>
						<span>Investor</span>
						<span className="text-[10px] opacity-80">Live</span>
					</Link>
					<Link
						href="/startup/mentorship"
						className={optionClass(
							isMentor || pathname === "/startup/mentorship",
						)}
					>
						<span>Mentor</span>
						<span className="text-[10px] opacity-80">Live</span>
					</Link>
				</div>
			</div>

			<div className="mt-4 space-y-2">
				<Link
					href="/startup/discover"
					className="flex items-center rounded-xl px-3 py-2 text-xs font-bold text-[#8ba39e] transition hover:bg-[#0a2921] hover:text-white"
				>
					Discover
				</Link>
				<Link
					href="/startup/settings"
					className="flex items-center rounded-xl px-3 py-2 text-xs font-bold text-[#8ba39e] transition hover:bg-[#0a2921] hover:text-white"
				>
					Settings
				</Link>
			</div>
		</aside>
	);
}
