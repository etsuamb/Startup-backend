"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/admin/Sidebar";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";
import {
	fetchNotifications,
	markNotificationRead,
	markAllNotificationsRead,
	fetchUnreadNotificationCount
} from "@/lib/adminApi";
import { resolveNotificationHref } from "@/lib/notificationNavigation";
import { getCurrentAccount } from "@/lib/authApi";
import { getUserName } from "@/lib/authStorage";

export default function AdminLayoutClient({ children }) {
	const router = useRouter();
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [isOpen, setIsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState("all");
	const [notificationError, setNotificationError] = useState("");
	const [adminName, setAdminName] = useState("System Admin");
	const [adminInitial, setAdminInitial] = useState("A");
	const dropdownRef = useRef(null);

	useEffect(() => {
		const timer = setTimeout(() => {
			const storedName = getUserName();
			if (storedName) {
				setAdminName(storedName);
				setAdminInitial(storedName.trim()[0]?.toUpperCase() || "A");
			}
		}, 0);
		getCurrentAccount()
			.then((data) => {
				const user = data?.user;
				if (!user) return;
				const name = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || "System Admin";
				setAdminName(name);
				setAdminInitial((user.first_name?.[0] || user.email?.[0] || "A").toUpperCase());
			})
			.catch(() => {});
		return () => clearTimeout(timer);
	}, []);

	const loadNotifications = async () => {
		try {
			setNotificationError("");
			const data = await fetchNotifications();
			if (data && data.notifications) {
				setNotifications(data.notifications);
			}
			const countData = await fetchUnreadNotificationCount();
			if (countData && typeof countData.unread === "number") {
				setUnreadCount(countData.unread);
			}
		} catch (err) {
			setNotificationError(err.message || "Failed to load notifications.");
		}
	};

	useEffect(() => {
		queueMicrotask(loadNotifications);
		// Poll every 15 seconds for real-time notifications
		const interval = setInterval(loadNotifications, 15000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		function handleClickOutside(event) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleMarkRead = async (id, isRead) => {
		if (isRead) return;
		try {
			await markNotificationRead(id);
			setNotifications((prev) =>
				prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
			);
			setUnreadCount((prev) => Math.max(0, prev - 1));
		} catch (err) {
			setNotificationError(err.message || "Failed to mark notification as read.");
		}
	};

	const handleMarkAllRead = async () => {
		try {
			await markAllNotificationsRead();
			setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
			setUnreadCount(0);
		} catch (err) {
			setNotificationError(err.message || "Failed to mark all notifications as read.");
		}
	};

	const handleNotificationClick = (notification) => {
		setIsOpen(false);
		if (!notification.is_read) {
			void handleMarkRead(notification.notification_id, false);
		}
		router.push(resolveNotificationHref(notification, "admin"));
	};

	const filteredNotifications = notifications.filter((n) => {
		if (activeTab === "all") return true;
		if (activeTab === "registrations") return n.notification_type === "registration";
		if (activeTab === "verifications") return n.notification_type === "verification";
		if (activeTab === "alerts") return n.notification_type === "system" || n.notification_type === "alert";
		return true;
	});

	return (
		<AdminAuthGuard>
			<div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-[#006054] selection:text-white">
				<Sidebar />
				<div className="flex-1 flex flex-col h-screen overflow-hidden">
					<header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 relative z-30">
						<div className="flex-1" />

						{/* Right Actions */}
						<div className="flex items-center gap-4">
							{/* Notification Bell Dropdown */}
							<div className="relative" ref={dropdownRef}>
								<button
									onClick={() => setIsOpen(!isOpen)}
									className="p-2.5 hover:bg-slate-100 rounded-full transition relative text-slate-600 hover:text-slate-900 focus:outline-none"
									aria-label="Notifications"
								>
									<svg
										className="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
										/>
									</svg>
									{unreadCount > 0 && (
										<span className="absolute top-1.5 right-1.5 w-5 h-5 bg-rose-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
											{unreadCount}
										</span>
									)}
								</button>

								{isOpen && (
									<div className="absolute right-0 mt-3 w-[420px] bg-white rounded-3xl shadow-xl border border-slate-100 z-50 overflow-hidden transition-all duration-200 transform origin-top-right">
										{/* Header */}
										<div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#061e16] to-[#0a2f23] text-white">
											<div>
												<h3 className="font-bold text-base">Notifications</h3>
												<p className="text-xs text-emerald-400 mt-0.5">{unreadCount} unread alerts</p>
											</div>
											{unreadCount > 0 && (
												<button
													onClick={handleMarkAllRead}
													className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition focus:outline-none"
												>
													Mark all read
												</button>
											)}
										</div>

										{/* Tabs */}
										<div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5">
											{[
												{ id: "all", label: "All" },
												{ id: "registrations", label: "Users" },
												{ id: "verifications", label: "KYC" },
												{ id: "alerts", label: "Alerts" }
											].map((tab) => (
												<button
													key={tab.id}
													onClick={() => setActiveTab(tab.id)}
													className={`flex-1 py-1.5 text-xs font-medium rounded-xl transition ${
														activeTab === tab.id
															? "bg-white text-slate-800 shadow-sm"
															: "text-slate-500 hover:text-slate-800"
													}`}
												>
													{tab.label}
												</button>
											))}
										</div>

										{notificationError ? (
											<p role="alert" className="border-b border-red-100 bg-red-50 px-5 py-3 text-xs font-semibold text-red-700">
												{notificationError}
											</p>
										) : null}

										{/* List */}
										<div className="max-h-[360px] overflow-y-auto divide-y divide-slate-50">
											{filteredNotifications.length > 0 ? (
												filteredNotifications.map((notif) => (
													<div
														key={notif.notification_id}
														onClick={() => handleNotificationClick(notif)}
														className={`p-5 flex gap-4 transition cursor-pointer hover:bg-slate-50/80 ${
															!notif.is_read ? "bg-[#eaf5f2]/40" : ""
														}`}
													>
														{/* Icon based on type */}
														<div className="shrink-0">
															{notif.notification_type === "registration" ? (
																<div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
																	<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
																	</svg>
																</div>
															) : notif.notification_type === "verification" ? (
																<div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
																	<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
																	</svg>
																</div>
															) : (
																<div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
																	<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
																	</svg>
																</div>
															)}
														</div>

														<div className="flex-1 min-w-0">
															<div className="flex items-center justify-between gap-2">
																<p className={`text-sm font-semibold truncate ${!notif.is_read ? "text-slate-900" : "text-slate-600"}`}>
																	{notif.title}
																</p>
																{!notif.is_read && (
																	<span className="w-2 h-2 bg-[#006054] rounded-full shrink-0"></span>
																)}
															</div>
															<p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
																{notif.message}
															</p>
															<p className="text-[10px] text-slate-400 mt-2 font-medium">
																{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.created_at).toLocaleDateString()}
															</p>
														</div>
													</div>
												))
											) : (
												<div className="py-12 flex flex-col items-center justify-center text-slate-400">
													<div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3">
														<svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
														</svg>
													</div>
													<p className="text-sm font-medium text-slate-500">All caught up!</p>
													<p className="text-xs text-slate-400 mt-1">No notifications found in this tab.</p>
												</div>
											)}
										</div>
									</div>
								)}
							</div>

							{/* Admin Profile Badge */}
							<Link href="/admin/settings" className="flex items-center gap-3 rounded-xl border-l border-slate-100 pl-4 pr-2 py-1.5 transition hover:bg-slate-50">
								<div className="w-9 h-9 bg-emerald-800 text-white rounded-full flex items-center justify-center font-bold text-sm">
									{adminInitial}
								</div>
								<div className="hidden lg:block text-left">
									<p className="text-xs font-bold text-slate-800 leading-tight">{adminName}</p>
									<p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider mt-0.5">Administrator</p>
								</div>
							</Link>
						</div>
					</header>
					<main className="flex-1 overflow-y-auto bg-[#f8fafc] p-8">{children}</main>
				</div>
			</div>
		</AdminAuthGuard>
	);
}
