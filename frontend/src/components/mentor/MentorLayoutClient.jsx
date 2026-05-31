"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NotificationBell from "@/components/NotificationBell";
import Sidebar from "@/components/mentor/Sidebar";
import AccountAccessGuard from "@/components/auth/AccountAccessGuard";
import { clearSession } from "@/lib/authStorage";
import { fetchMentorDashboard } from "@/lib/mentorApi";
import ProfilePictureAvatar from "@/components/auth/ProfilePictureAvatar";
import { MentorLocaleProvider } from "@/components/mentor/MentorLocaleProvider";

function Icon({ path, className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d={path}
      />
    </svg>
  );
}

function initials(name) {
  return (
    String(name || "Mentor")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "M"
  );
}

function pagePlaceholder(pathname) {
  if (pathname?.includes("/sessions")) return "Search startups, sessions...";
  if (pathname?.includes("/requests")) return "Search startups, requests...";
  if (pathname?.includes("/startups"))
    return "Search startups, founders, industries...";
  if (pathname?.includes("/messages")) return "Search conversations...";
  if (pathname?.includes("/resources")) return "Search resources...";
  if (pathname?.includes("/reports")) return "Search reports...";
  return "Search startups, sessions, or resources...";
}

function MentorTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    let alive = true;
    fetchMentorDashboard()
      .then((data) => {
        if (alive) {
          setProfile(data?.profile || null);
          setProfileError("");
        }
      })
      .catch((error) => {
        if (alive)
          setProfileError(error.message || "Unable to load mentor profile.");
      });
    return () => {
      alive = false;
    };
  }, []);

  const name =
    `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
    profile?.full_name ||
    "Mentor";
  const title =
    profile?.headline || profile?.professional_title || "Lead Mentor";

  function onSearchSubmit(event) {
    event.preventDefault();
    const q = search.trim();
    if (q) router.push(`/mentor/startups?search=${encodeURIComponent(q)}`);
  }

  function logout() {
    clearSession();
    router.push("/login");
  }

  return (
    <div className="sticky top-0 z-30 shrink-0 bg-white/95 backdrop-blur">
      <header className="flex h-[72px] items-center justify-between border-b border-slate-200/80 px-5 sm:px-8">
        {pathname !== "/mentor/dashboard" ? (
          <form
            onSubmit={onSearchSubmit}
            className="relative w-full max-w-[460px]"
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
              <Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </div>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={pagePlaceholder(pathname)}
              className="h-10 w-full rounded-full border border-transparent bg-[#eef1f4] pl-11 pr-4 text-xs font-medium text-gray-700 outline-none transition focus:border-[#0b4a3c]/20 focus:bg-white focus:ring-2 focus:ring-[#0b4a3c]/10"
            />
          </form>
        ) : (
          <div />
        )}

        <div className="ml-4 flex items-center gap-3">
          <NotificationBell />
          <Link
            href="/mentor/settings"
            className="hidden h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-50 hover:text-gray-700 sm:flex"
            aria-label="Settings"
          >
            <Icon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </Link>
          <div className="hidden h-8 w-px bg-gray-200 sm:block" />
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-gray-50"
              aria-label="Profile menu"
            >
              <div className="hidden min-w-0 text-right sm:block">
                <p className="max-w-[160px] truncate text-xs font-black text-gray-950">
                  {name}
                </p>
                <p className="max-w-[160px] truncate text-[10px] font-medium text-gray-500">
                  {title}
                </p>
              </div>
              <ProfilePictureAvatar
                initials={initials(name)}
                className="h-10 w-10 rounded-full ring-2 ring-white"
              />
              <Icon
                path="M19 9l-7 7-7-7"
                className={`hidden h-3.5 w-3.5 text-gray-400 transition sm:block ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl">
                <Link
                  href="/mentor/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50 hover:text-[#0b4a3c]"
                >
                  <Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-gray-600 transition hover:bg-gray-50 hover:text-red-600"
                >
                  <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  Sign Out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      {profileError ? (
        <p
          role="alert"
          className="border-b border-red-100 bg-red-50 px-5 py-2 text-xs font-semibold text-red-700 sm:px-8"
        >
          {profileError}
        </p>
      ) : null}
    </div>
  );
}

export default function MentorLayoutClient({ children }) {
  return (
    <AccountAccessGuard requiredRole="Mentor">
      <MentorLocaleProvider>
        <div
          data-mentor-locale-root
          className="flex h-screen bg-[#f6f8f7] font-sans text-gray-900 overflow-hidden"
        >
          <Sidebar />
          <div className="flex-grow flex flex-col overflow-hidden bg-[#f6f8f7]">
            <MentorTopbar />
            <main className="mentor-content flex-grow overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </MentorLocaleProvider>
      <style jsx global>{`
        .mentor-content > div > header:first-child {
          display: none;
        }
      `}</style>
    </AccountAccessGuard>
  );
}
