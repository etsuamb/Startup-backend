"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SidebarCollapseButton, { SidebarMobileToggle } from "@/components/SidebarCollapseButton";
import { useSidebarCollapse } from "@/hooks/useSidebarCollapse";

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed, mobileOpen, toggleCollapsed, toggleMobile, closeMobile } = useSidebarCollapse(pathname);

  const primaryLinks = [
    {
      name: "Dashboard",
      href: "/startup/dashboard",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
    },
    {
      name: "My Project",
      href: "/startup/project",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
    },
    {
      name: "Discover",
      href: "/startup/discover",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
    },
    {
      name: "Offers",
      href: "/startup/offers",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M4 6h16M4 12h4M4 18h4"></path>
    },
    {
      name: "Mentor Payments",
      href: "/startup/payment",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    },
    {
      name: "Meetings",
      href: "/startup/meetings",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
    },
    {
      name: "Mentor Resources",
      href: "/startup/mentorship-resources",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
    },
    {
      name: "Rate Mentors",
      href: "/startup/ratings",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
    },
    {
      name: "Reports",
      href: "/startup/reports",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 8.414V19a2 2 0 01-2 2z"></path>
    },
    {
      name: "AI Recommendations",
      href: "/startup/recommendations",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
    }
  ];

  const networkLinks = [
    {
      name: "Connections",
      href: "/startup/connections",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72M12 15.75a6 6 0 00-6 6m6-6a6 6 0 016 6m-6-6a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z"></path>
    },
    {
      name: "Messages",
      href: "/startup/chat",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
    }
  ];

  // The sidebar container uses bg-[#061e16] and the faux light beams from the registration layout.
  return (
    <>
      <SidebarMobileToggle open={mobileOpen} onToggle={toggleMobile} />
      {mobileOpen && <button type="button" aria-label="Close sidebar" onClick={closeMobile} className="fixed inset-0 z-[70] bg-black/40 md:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-[80] flex w-[260px] flex-col bg-[#061e16] border-r border-[#0f3d32] shrink-0 h-screen overflow-y-auto transition-transform duration-200 md:sticky md:top-0 md:z-auto md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "md:w-[72px]" : "md:w-[260px]"}`}>
      {/* Abstract Green Light Beams / Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#061e16]"></div>
        {/* Faux light beams using rotated divs */}
        <div className="absolute top-[-10%] left-[10%] w-[150%] h-[30px] bg-[#008f64] opacity-30 transform -rotate-[55deg] blur-[2px]"></div>
        <div className="absolute top-[10%] left-[10%] w-[150%] h-[40px] bg-[#008f64] opacity-30 transform -rotate-[55deg] blur-[2px]"></div>
        <div className="absolute top-[30%] left-[0%] w-[150%] h-[20px] bg-[#008f64] opacity-30 transform -rotate-[55deg] blur-[2px]"></div>
        <div className="absolute top-[50%] left-[-10%] w-[150%] h-[60px] bg-[#008f64] opacity-20 transform -rotate-[55deg] blur-[4px]"></div>
        <div className="absolute top-[70%] left-[-20%] w-[150%] h-[25px] bg-[#008f64] opacity-40 transform -rotate-[55deg] blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#061e16]/60 via-transparent to-[#061e16]/90"></div>
      </div>

      {/* Logo */}
      <div className={`relative z-10 flex items-center ${collapsed ? "justify-center p-4" : "justify-between p-6 pb-2"}`}>
        {(!collapsed || mobileOpen) && <Link href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Startup Hub Logo" className="w-10 h-10 object-contain" />
          <div className="flex flex-col">
            <span className="font-bold text-white text-lg tracking-tight leading-tight">Startup Hub</span>
            <span className="text-[9px] font-bold text-[#10b981] uppercase tracking-widest leading-tight">Entrepreneur Portal</span>
          </div>
        </Link>}
        <SidebarCollapseButton collapsed={collapsed} onToggle={toggleCollapsed} />
      </div>

      {/* Primary Nav */}
      <div className={`${collapsed ? "px-2" : "px-4"} py-4 flex flex-col gap-1 mt-4 relative z-10`}>
        {primaryLinks.map((link) => {
          // Check if link is active (exact match or subpath if it's not dashboard)
          const isActive = pathname === link.href || (link.href !== "/startup/dashboard" && pathname?.startsWith(link.href));
          return (
            <Link
              key={link.name}
              href={link.href}
              title={collapsed ? link.name : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition relative overflow-hidden group ${isActive
                  ? "bg-[#0f3d32] text-white"
                  : "text-[#8ba39e] hover:text-white hover:bg-[#0a2921]"
                }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {link.icon}
              </svg>
              {(!collapsed || mobileOpen) && link.name}
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#10b981] rounded-l-full"></div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Network Nav */}
      <div className={`${collapsed ? "px-2" : "px-4"} py-2 mt-2 flex flex-col gap-1 relative z-10`}>
        <p className={`${collapsed && !mobileOpen ? "sr-only" : ""} text-[10px] font-bold text-[#4d7066] uppercase tracking-widest px-4 mb-2`}>Network</p>
        {networkLinks.map((link) => {
          const isActive = pathname === link.href || (pathname?.startsWith(link.href) && link.href !== "#");
          return (
            <Link
              key={link.name}
              href={link.href}
              title={collapsed ? link.name : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition relative overflow-hidden group ${isActive
                  ? "bg-[#0f3d32] text-white"
                  : "text-[#8ba39e] hover:text-white hover:bg-[#0a2921]"
                }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {link.icon}
              </svg>
              {(!collapsed || mobileOpen) && link.name}
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#10b981] rounded-l-full"></div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Area: Settings and User */}
      <div className={`mt-auto pt-4 ${collapsed ? "px-2" : "px-4"} pb-6 relative z-10`}>
        <div className="flex flex-col gap-1 pt-4 border-t border-[#0f3d32]">
          <Link
            href="/startup/settings"
            title={collapsed ? "Settings" : undefined}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition relative overflow-hidden group ${pathname?.startsWith("/startup/settings")
                ? "bg-[#0f3d32] text-white"
                : "text-[#8ba39e] hover:text-white hover:bg-[#0a2921]"
              }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            {(!collapsed || mobileOpen) && "Settings"}
            {pathname?.startsWith("/startup/settings") && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#10b981] rounded-l-full"></div>
            )}
          </Link>
        </div>

      </div>
      </aside>
    </>
  );
}
