"use client";

import { useEffect, useState } from "react";

const KEY = "sc_sidebar_collapsed";

function loadPreference() {
  try {
    return localStorage.getItem(KEY) === "true";
  } catch {
    return false;
  }
}

function savePreference(value) {
  try {
    localStorage.setItem(KEY, String(value));
  } catch {
    /* The toggle still works for the current page when storage is unavailable. */
  }
}

export function useSidebarCollapse(pathname) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setCollapsed(loadPreference()));
  }, []);

  useEffect(() => {
    queueMicrotask(() => setMobileOpen(false));
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      savePreference(next);
      return next;
    });
  }

  return {
    collapsed,
    mobileOpen,
    toggleCollapsed,
    toggleMobile: () => setMobileOpen((current) => !current),
    closeMobile: () => setMobileOpen(false),
  };
}
