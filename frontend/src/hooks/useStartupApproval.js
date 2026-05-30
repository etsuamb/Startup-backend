"use client";

import { useEffect, useState } from "react";
import { getStartupDashboardStatus } from "@/lib/startupApi";

export function useStartupApproval() {
  const [approved, setApproved] = useState(null);
  const [reason, setReason] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getStartupDashboardStatus();
        if (!cancelled) {
          setApproved(data.status !== "Pending");
          setReason(data.status === "Pending" ? "admin_approval" : null);
          setMessage(
            data.status === "Pending"
              ? "Your startup account is waiting for admin approval."
              : "",
          );
        }
      } catch (err) {
        if (!cancelled) {
          setApproved(false);
          setReason(err?.code === "EMAIL_NOT_VERIFIED" ? "email_verification" : "admin_approval");
          setMessage(err?.message || "Your account must be verified and approved before you can use this feature.");
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
    reason,
    message,
    loading,
  };
}
