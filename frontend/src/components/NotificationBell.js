"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationAsRead,
} from "@/lib/notificationApi";
import { getRole } from "@/lib/authStorage";
import { resolveNotificationHref } from "@/lib/notificationNavigation";

const POLL_INTERVAL_MS = 10000;

function formatNotificationTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationBell({ className = "" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    setError("");
    try {
      const data = await getNotifications({ limit: 10 });
      const nextNotifications = data.notifications || [];
      setNotifications(nextNotifications);
      setUnread(Number(data.unread || 0));
    } catch (err) {
      setError(err.message || "Unable to load notifications.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function loadInitial() {
      setLoading(true);
      await loadNotifications();
      if (active) setLoading(false);
    }
    loadInitial();
    const intervalId = setInterval(loadNotifications, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [loadNotifications]);

  useEffect(() => {
    function onPointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  async function handleToggle() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) await loadNotifications();
  }

  async function handleMarkRead(notificationId) {
    setNotifications((items) =>
      items.map((item) =>
        item.notification_id === notificationId ? { ...item, is_read: true } : item,
      ),
    );
    setUnread((count) => Math.max(0, count - 1));
    try {
      await markNotificationAsRead(notificationId, true);
      await loadNotifications();
    } catch (err) {
      setError(err.message || "Unable to update notification.");
      await loadNotifications();
    }
  }

  async function handleMarkAllRead() {
    setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    setUnread(0);
    try {
      await markAllNotificationsRead();
      await loadNotifications();
    } catch (err) {
      setError(err.message || "Unable to update notifications.");
      await loadNotifications();
    }
  }

  function handleNotificationClick(notification) {
    setOpen(false);
    if (!notification.is_read) {
      void handleMarkRead(notification.notification_id);
    }
    router.push(resolveNotificationHref(notification, getRole()));
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={handleToggle}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
            {unread > 0 && (
              <button type="button" onClick={handleMarkAllRead} className="text-[11px] font-bold text-[#0a4d3c] hover:text-[#07382b]">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading notifications...</div>
            ) : error ? (
              <div className="p-4 text-sm text-red-600">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.notification_id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`block w-full border-b border-gray-50 p-4 text-left transition hover:bg-gray-50 ${
                    !notification.is_read ? "bg-emerald-50" : "bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!notification.is_read && <span className="mt-1.5 h-2 w-2 rounded-full bg-[#0a4d3c] shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-xs font-bold text-gray-900">{notification.title}</h4>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-600">{notification.message}</p>
                      <p className="mt-2 text-[10px] font-semibold text-gray-400">{formatNotificationTime(notification.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
