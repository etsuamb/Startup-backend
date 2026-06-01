"use client";

export default function SidebarCollapseButton({ collapsed, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="relative z-20 hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#8fb8ad] transition hover:bg-white/10 hover:text-white md:flex"
    >
      <svg className={`h-4 w-4 transition ${collapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );
}

export function SidebarMobileToggle({ open, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={open ? "Close sidebar" : "Open sidebar"}
      aria-expanded={open}
      title={open ? "Close sidebar" : "Open sidebar"}
      className={`fixed top-4 z-[90] flex h-10 w-10 items-center justify-center rounded-lg border shadow-lg transition-all md:hidden ${
        open
          ? "left-[208px] border-white/15 bg-[#0f3d32] text-white"
          : "left-4 border-gray-200 bg-white text-[#0f3d32]"
      }`}
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
        />
      </svg>
    </button>
  );
}
