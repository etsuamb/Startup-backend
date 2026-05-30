"use client";

import Link from "next/link";

const SECTIONS = [
	{
		title: "User management",
		links: [
			{ href: "/admin/users", label: "Approve / reject / search users" },
			{ href: "/admin/projects", label: "Review projects" },
		],
	},
	{
		title: "Startup moderation",
		links: [{ href: "/admin/startups", label: "Listings directory" }],
	},
	{
		title: "Content moderation",
		links: [{ href: "/admin/moderation", label: "Chat & project content" }],
	},
	{
		title: "Investments & payments",
		links: [
			{ href: "/admin/investments", label: "Investment oversight" },
			{ href: "/admin/payments", label: "Payments & refunds" },
		],
	},
	{
		title: "Monitoring & reports",
		links: [
			{ href: "/admin/activity", label: "Logs & fraud" },
			{ href: "/admin/reports", label: "Reports & exports" },
		],
	},
	{
		title: "Maintenance",
		links: [
			{ href: "/admin/maintenance", label: "DB, backup, categories" },
			{ href: "/admin/settings", label: "Admin settings" },
		],
	},
];

export default function AdminUcCoverage() {
	return (
		<div className="rounded-[28px] bg-white border border-slate-200 p-6 mb-8">
			<p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold mb-4">Admin capabilities (UC 1–12)</p>
			<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{SECTIONS.map((s) => (
					<div key={s.title}>
						<h3 className="text-sm font-bold text-slate-900 mb-2">{s.title}</h3>
						<ul className="space-y-1">
							{s.links.map((l) => (
								<li key={l.href}>
									<Link href={l.href} className="text-xs text-emerald-700 font-semibold hover:underline">
										{l.label}
									</Link>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
		</div>
	);
}
