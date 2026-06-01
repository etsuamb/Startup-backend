"use client";

import Link from "next/link";
import ActorAvatar from "@/components/auth/ActorAvatar";

function initials(value) {
	return String(value || "?")
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();
}

export default function ConnectionsPage({ title = "Connections", subtitle, connections, loading, error, emptyText }) {
	return (
		<main className="min-w-0 flex-1 overflow-y-auto bg-[#f7f9fa] px-4 py-7 sm:px-8">
			<div className="mx-auto max-w-6xl">
				<header className="mb-7">
					<h1 className="text-2xl font-black text-gray-950">{title}</h1>
					<p className="mt-2 text-sm text-gray-500">{subtitle}</p>
				</header>

				{error ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
				{loading ? <p className="text-sm text-gray-500">Loading connections...</p> : null}
				{!loading && !error && connections.length === 0 ? (
					<div className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">{emptyText}</div>
				) : null}

				{!loading && connections.length ? (
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						{connections.map((connection) => (
							<article key={`${connection.role}-${connection.id}`} className="flex min-w-0 flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
								<div className="flex items-center gap-3">
									<ActorAvatar role={connection.role} profileId={connection.id} initials={initials(connection.name)} className="h-12 w-12 shrink-0 rounded-xl text-sm" alt={connection.name} />
									<div className="min-w-0">
										<h2 className="truncate text-base font-black text-gray-950">{connection.name}</h2>
										<p className="mt-1 truncate text-xs font-semibold uppercase text-gray-400">{connection.label}</p>
									</div>
								</div>
								<p className="mt-5 line-clamp-3 min-h-[60px] text-sm leading-5 text-gray-600">{connection.description || "Connected profile"}</p>
								<div className="mt-5 grid grid-cols-2 gap-3">
									<Link href={connection.viewHref} className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 px-3 text-xs font-black text-gray-700 transition hover:bg-gray-50">
										View
									</Link>
									<Link href={connection.chatHref} className="inline-flex h-10 items-center justify-center rounded-lg bg-[#0f3d32] px-3 text-xs font-black text-white transition hover:bg-[#0a2921]">
										Message
									</Link>
								</div>
							</article>
						))}
					</div>
				) : null}
			</div>
		</main>
	);
}
