"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, getRole, getUserName } from "@/lib/authStorage";
import { getInvestorProfile } from "@/lib/investorApi";
import NotificationBell from "@/components/NotificationBell";
import ProfilePictureAvatar from "@/components/auth/ProfilePictureAvatar";
import SidebarCollapseButton, { SidebarMobileToggle } from "@/components/SidebarCollapseButton";
import { useSidebarCollapse } from "@/hooks/useSidebarCollapse";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileRole, setProfileRole] = useState("Investor");
  const [profileError, setProfileError] = useState("");
  const { collapsed, mobileOpen, toggleCollapsed, toggleMobile, closeMobile } = useSidebarCollapse(pathname);

  useEffect(() => {
    let ignore = false;
    queueMicrotask(() => {
      if (ignore) return;
      const storedName = getUserName();
      const storedRole = getRole();
      if (storedName) setProfileName(storedName);
      if (storedRole) setProfileRole(storedRole.charAt(0).toUpperCase() + storedRole.slice(1));
    });

    getInvestorProfile()
      .then((data) => {
        if (ignore) return;
        const investor = data?.investor || {};
        const userName = `${investor.first_name || ""} ${investor.last_name || ""}`.trim();
        const name = investor.full_name
          || investor.name
          || investor.investor_name
          || userName
          || investor.organization_name
          || investor.company_name;
        const role = investor.investor_type || investor.role || investor.title;
        if (name) setProfileName(name);
        if (role) setProfileRole(String(role).replace(/_/g, " ").toUpperCase());
        setProfileError("");
      })
      .catch((error) => {
        if (!ignore) setProfileError(error.message || "Unable to load investor profile.");
      });

    return () => {
      ignore = true;
    };
  }, []);

  const primaryLinks = [
    { 
      name: "Dashboard", 
      href: "/investor/dashboard", 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path> 
    },
    { 
      name: "Startups", 
      href: "/investor/discover", 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path> 
    },
    { 
      name: "Recommendations", 
      href: "/investor/recommendations", 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path> 
    },
    { 
      name: "Funding Requests", 
      href: "/investor/funding", 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path> 
    },
    { 
      name: "Offers", 
      href: "/investor/offers", 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path> 
    },
    { 
      name: "Payment", 
      href: "/investor/payment", 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path> 
    },
    {
      name: "Reports",
      href: "/investor/reports",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 8.414V19a2 2 0 01-2 2z"></path>
    },
    {
      name: "Rating",
      href: "/investor/feedback",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
    }
  ];

  const commLinks = [
    {
      name: "Connections",
      href: "/investor/connections",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72M12 15.75a6 6 0 00-6 6m6-6a6 6 0 016 6m-6-6a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z"></path>
    },
    { 
      name: "Messages", 
      href: "/investor/messages", 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path> 
    },
    { 
      name: "Meetings", 
      href: "/investor/meetings", 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path> 
    }
  ];

  const systemLinks = [
    { 
      name: "Settings", 
      href: "/investor/settings", 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path> 
    }
  ];

  const profileInitials = profileName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "IN";

  function logout() {
    clearSession();
    setIsProfileMenuOpen(false);
    router.push("/login");
  }

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 ${collapsed ? "md:left-[72px]" : "md:left-[260px]"} z-50 flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 md:px-6 transition-[left] duration-200`}>
        <div />

        <div className="relative flex items-center gap-3 shrink-0">
          <NotificationBell />

          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((current) => !current)}
            className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-gray-50"
            aria-expanded={isProfileMenuOpen}
          >
            <ProfilePictureAvatar
              initials={profileInitials}
              className="w-9 h-9 rounded-full shrink-0"
            />
            <div className="hidden sm:flex w-[150px] flex-col overflow-hidden">
              <span className="truncate text-sm font-bold leading-tight text-gray-900">{profileName || "Loading..."}</span>
              <span className="truncate text-[10px] font-semibold uppercase leading-tight tracking-wide text-gray-500">{profileRole}</span>
            </div>
            <svg
              className={`hidden sm:block w-4 h-4 text-gray-400 transition ${isProfileMenuOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {isProfileMenuOpen && (
          <div className="absolute right-0 top-12 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
            {systemLinks.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsProfileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold transition ${
                    isActive
                      ? "bg-[#e9f7ef] text-[#0a4d3c]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {link.icon}
                  </svg>
                  {link.name}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-gray-600 transition hover:bg-red-50 hover:text-red-600"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log out
            </button>
          </div>
        )}
        {profileError ? (
          <p role="alert" className="absolute right-4 top-16 max-w-sm rounded-b-lg border border-t-0 border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 md:right-6">
            {profileError}
          </p>
        ) : null}
      </div>

      <SidebarMobileToggle open={mobileOpen} onToggle={toggleMobile} />
      {mobileOpen && <button type="button" aria-label="Close sidebar" onClick={closeMobile} className="fixed inset-0 z-[70] bg-black/40 md:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-[80] flex w-[260px] flex-col bg-[#061e16] border-r border-[#0f3d32] shrink-0 h-screen overflow-y-auto transition-transform duration-200 md:sticky md:top-0 md:z-auto md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "md:w-[72px]" : "md:w-[260px]"}`}>
      {/* Abstract Green Light Beams / Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#061e16]"></div>
        <div className="absolute top-[-10%] left-[10%] w-[150%] h-[30px] bg-[#008f64] opacity-30 transform -rotate-[55deg] blur-[2px]"></div>
        <div className="absolute top-[10%] left-[10%] w-[150%] h-[40px] bg-[#008f64] opacity-30 transform -rotate-[55deg] blur-[2px]"></div>
        <div className="absolute top-[30%] left-[0%] w-[150%] h-[20px] bg-[#008f64] opacity-30 transform -rotate-[55deg] blur-[2px]"></div>
        <div className="absolute top-[50%] left-[-10%] w-[150%] h-[60px] bg-[#008f64] opacity-20 transform -rotate-[55deg] blur-[4px]"></div>
        <div className="absolute top-[70%] left-[-20%] w-[150%] h-[25px] bg-[#008f64] opacity-40 transform -rotate-[55deg] blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#061e16]/60 via-transparent to-[#061e16]/90"></div>
      </div>

      {/* Logo */}
      <div className={`relative z-10 flex items-center ${collapsed ? "justify-center p-4" : "gap-4 px-4 pb-2 pt-6"}`}>
        {(!collapsed || mobileOpen) && <Link href="/" className="flex min-w-0 flex-1 items-center gap-3">
          <img src="/logo.png" alt="StartupConnect Logo" className="w-10 h-10 object-contain" />
          <div className="flex flex-col">
             <span className="font-bold text-white text-lg tracking-tight leading-tight">StartupConnect</span>
             <span className="text-[9px] font-bold text-[#10b981] uppercase tracking-widest leading-tight">Investor Dashboard</span>
          </div>
        </Link>}
        <SidebarCollapseButton collapsed={collapsed} onToggle={toggleCollapsed} />
      </div>

      {/* Primary Nav */}
      <div className={`${collapsed ? "px-2" : "px-4"} py-4 flex flex-col gap-1 mt-2 relative z-10`}>
        {primaryLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/investor/dashboard" && pathname?.startsWith(link.href));
          return (
            <Link 
              key={link.name} 
              href={link.href} 
              title={collapsed ? link.name : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition relative overflow-hidden group ${
                isActive 
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

      {/* Communication Nav */}
      <div className={`${collapsed ? "px-2" : "px-4"} py-2 mt-2 flex flex-col gap-1 relative z-10`}>
        <p className={`${collapsed && !mobileOpen ? "sr-only" : ""} text-[10px] font-bold text-[#4d7066] uppercase tracking-widest px-4 mb-2`}>Communication</p>
        {commLinks.map((link) => {
          const isActive = pathname === link.href || pathname?.startsWith(link.href);
          return (
            <Link 
              key={link.name} 
              href={link.href} 
              title={collapsed ? link.name : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition relative overflow-hidden group ${
                isActive 
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

      </aside>
    </>
  );
}
