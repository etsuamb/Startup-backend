"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SidebarCollapseButton, { SidebarMobileToggle } from "@/components/SidebarCollapseButton";
import { useSidebarCollapse } from "@/hooks/useSidebarCollapse";

const NAV_SECTIONS = [
  {
    label: "Main",
    links: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/mentor/dashboard",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        ),
      },
      {
        id: "requests",
        label: "Requests",
        href: "/mentor/requests",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        ),
      },
      {
        id: "startups",
        label: "Discover",
        href: "/mentor/startups",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        ),
      },
      {
        id: "sessions",
        label: "Sessions",
        href: "/mentor/sessions",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        ),
      },
    ],
  },
  {
    label: "Communication",
    links: [
      {
        id: "connections",
        label: "Connections",
        href: "/mentor/connections",
        icon: (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72M12 15.75a6 6 0 00-6 6m6-6a6 6 0 016 6m-6-6a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
        ),
      },
      {
        id: "messages",
        label: "Messages",
        href: "/mentor/messages",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        ),
      },
    ],
  },
  {
    label: "Resources",
    links: [
      {
        id: "resources",
        label: "Resources",
        href: "/mentor/resources",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        ),
      },
      {
        id: "reports",
        label: "Reports",
        href: "/mentor/reports",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        ),
      },
    ],
  },
];

export default function MentorSidebar() {
  const pathname = usePathname();
  const { collapsed, mobileOpen, toggleCollapsed, toggleMobile, closeMobile } = useSidebarCollapse(pathname);

  return (
    <>
      <SidebarMobileToggle open={mobileOpen} onToggle={toggleMobile} />
      {mobileOpen && <button type="button" aria-label="Close sidebar" onClick={closeMobile} className="fixed inset-0 z-[70] bg-black/40 md:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-[80] flex w-[248px] flex-col bg-[#07251f] border-r border-[#123b32] shrink-0 h-screen overflow-y-auto transition-transform duration-200 md:sticky md:top-0 md:z-auto md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "md:w-[72px]" : "md:w-[248px]"}`}>
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-b from-[#0a3028] via-[#07251f] to-[#061e1a]">
        <div className="absolute -top-24 -right-20 h-56 w-56 rounded-full bg-[#10b981]/10 blur-3xl" />
        <div className="absolute bottom-20 -left-24 h-48 w-48 rounded-full bg-[#10b981]/5 blur-3xl" />
      </div>

      {/* Logo */}
      <div className={`relative z-10 flex items-center ${collapsed ? "justify-center p-4" : "justify-between p-5 pb-4"}`}>
        {(!collapsed || mobileOpen) && <Link href="/mentor/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#10b981]/15 ring-1 ring-inset ring-[#10b981]/25 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#34d399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-[15px] tracking-tight leading-tight">StartupConnect</span>
            <span className="text-[9px] font-bold text-[#10b981] uppercase tracking-widest leading-tight">Mentor Dashboard</span>
          </div>
        </Link>}
        <SidebarCollapseButton collapsed={collapsed} onToggle={toggleCollapsed} />
      </div>

      {/* Navigation sections */}
      <div className={`flex flex-col gap-4 ${collapsed ? "px-2" : "px-3"} py-3 relative z-10 flex-1`}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className={`${collapsed && !mobileOpen ? "sr-only" : ""} text-[9px] font-bold text-[#3d6b5f] uppercase tracking-widest px-3 mb-1.5`}>
              {section.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.links.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/mentor/dashboard" && pathname?.startsWith(link.href));
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    title={collapsed ? link.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 relative overflow-hidden ${
                      isActive
                        ? "bg-white/10 text-white shadow-sm ring-1 ring-inset ring-white/5"
                        : "text-[#8fb8ad] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {link.icon}
                    </svg>
                    {(!collapsed || mobileOpen) && (link.name || link.label)}
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#10b981] rounded-l-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      </aside>
    </>
  );
}
