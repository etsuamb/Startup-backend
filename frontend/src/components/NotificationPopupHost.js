"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getToken } from "@/lib/authStorage";
import { getNotifications } from "@/lib/notificationApi";

const seenNotificationIds = new Set();
const POLL_INTERVAL_MS = 10000;
const POPUP_DURATION_MS = 5500;

function buildPopup(notification) {
  return {
    notification_id: notification.notification_id || `notification-${Date.now()}`,
    title: notification.title || "New notification",
    message: notification.message || "You have a new update.",
    created_at: notification.created_at || new Date().toISOString(),
  };
}

export default function NotificationPopupHost() {
  const [popups, setPopups] = useState([]);
  const initializedRef = useRef(false);
  const mountedRef = useRef(false);

  const addPopups = useCallback((notifications) => {
    const nextPopups = notifications.map(buildPopup);
    setPopups((items) => {
      const merged = [...nextPopups, ...items];
      const unique = [];
      const seen = new Set();

      merged.forEach((notification) => {
        if (!seen.has(notification.notification_id)) {
          seen.add(notification.notification_id);
          unique.push(notification);
        }
      });

      return unique.slice(0, 3);
    });
  }, []);

  const pollNotifications = useCallback(async () => {
    if (!getToken()) {
      initializedRef.current = false;
      return;
    }

    try {
      const data = await getNotifications({ limit: 10 });
      const notifications = data.notifications || [];

      if (!initializedRef.current) {
        notifications.forEach((notification) => {
          if (notification.notification_id) {
            seenNotificationIds.add(notification.notification_id);
          }
        });
        initializedRef.current = true;
        return;
      }

      const newUnread = notifications.filter((notification) => {
        const id = notification.notification_id;
        return id && !notification.is_read && !seenNotificationIds.has(id);
      });

      if (newUnread.length === 0) return;
      newUnread.forEach((notification) => seenNotificationIds.add(notification.notification_id));
      addPopups(newUnread);
    } catch {
      // Notification popups should never block the current page.
    }
  }, [addPopups]);

  useEffect(() => {
    mountedRef.current = true;
    const startupPollId = setTimeout(pollNotifications, 0);
    const intervalId = setInterval(pollNotifications, POLL_INTERVAL_MS);

    function onTestNotification(event) {
      const detail = event.detail || {};
      addPopups([
        {
          notification_id: detail.notification_id || `debug-${Date.now()}`,
          title: detail.title || "Test notification",
          message: detail.message || "This is a local notification popup test.",
          created_at: new Date().toISOString(),
        },
      ]);
    }

    window.addEventListener("startupconnect:test-notification", onTestNotification);

    return () => {
      mountedRef.current = false;
      clearTimeout(startupPollId);
      clearInterval(intervalId);
      window.removeEventListener("startupconnect:test-notification", onTestNotification);
    };
  }, [addPopups, pollNotifications]);

  useEffect(() => {
    if (popups.length === 0) return undefined;

    const timers = popups.map((notification) =>
      setTimeout(() => {
        if (!mountedRef.current) return;
        setPopups((items) =>
          items.filter((item) => item.notification_id !== notification.notification_id),
        );
      }, POPUP_DURATION_MS),
    );

    return () => timers.forEach(clearTimeout);
  }, [popups]);

  if (popups.length === 0) return null;

  return (
    <div className="fixed right-5 top-20 z-[90] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-3">
      {popups.map((notification) => (
        <div
          key={notification.notification_id}
          role="status"
          className="rounded-2xl border border-emerald-100 bg-white p-4 text-left shadow-xl ring-1 ring-black/5"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0f3d32] text-white">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d32]">
                New notification
              </p>
              <h4 className="mt-1 line-clamp-1 text-sm font-black text-gray-950">
                {notification.title}
              </h4>
              <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-gray-600">
                {notification.message}
              </p>
            </div>
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
          </div>
        </div>
      ))}
    </div>
  );
}
