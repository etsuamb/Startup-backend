"use client";

import { useEffect, useState } from "react";
import { getStartupDashboardStatus } from "@/lib/startupApi";

export function useStartupApproval() {
  const [approved, setApproved] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getStartupDashboardStatus();
        if (!cancelled) {
          setApproved(data.status !== "Pending");
        }
      } catch {
        if (!cancelled) {
          setApproved(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    approved: approved === true,
    pending: approved === false,
    loading,
  };
}
