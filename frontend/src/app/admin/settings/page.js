"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchMaintenanceStatus,
  changeAdminPassword,
  fetchActiveSessions,
  revokeActiveSession,
  revokeAllOtherSessions,
  fetchPlatformSettings,
  updatePlatformSettings,
  fetchAuditLogs,
  downloadAuditLogsExport,
} from "@/lib/adminApi";
import { getCurrentAccount, updateCurrentAccount } from "@/lib/authApi";
import { clearSession, getRefreshToken, getToken, setSession } from "@/lib/authStorage";
import AccountSecurityPanel from "@/components/auth/AccountSecurityPanel";
import { useAdminLocale } from "@/components/admin/AdminLocaleProvider";

const DEFAULT_PLATFORM_CONFIG = {
  userRegistration: true,
  strictVerification: false,
  twoFactorRequired: false,
  notifNewUsers: true,
  notifVerification: true,
  notifAlerts: true,
  language: "English",
  defaultSignupRole: "Startup",
};

export default function AdminSettingsPage() {
  const { language, setLocale, t } = useAdminLocale();
  const [dbStatus, setDbStatus] = useState(null);
  const [liveLogs, setLiveLogs] = useState([]);

  // Core configuration states
  const [toggles, setToggles] = useState({
    userRegistration: true,
    strictVerification: false,
    twoFactor: true,
    notifNewUsers: true,
    notifVerification: true,
    notifAlerts: false,
  });

  const [profile, setProfile] = useState({ firstName: "", lastName: "", email: "", phone_number: "", role: "Admin" });
  const [accountLoading, setAccountLoading] = useState(true);
  const [langPreference, setLangPreference] = useState(language);

  // Modal active states
  const [activeModal, setActiveModal] = useState(null);

  // Form states
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", email: "", phone_number: "" });
  const [passwordForm, setPasswordForm] = useState({ current: "", newPassword: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, newPassword: false, confirm: false });
  const [roleForm, setRoleForm] = useState({ defaultRole: "Startup" });
  const [resetInput, setResetInput] = useState("");

  // Sessions list
  const [sessions, setSessions] = useState([]);

  // Toast alert status
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  const loadSessions = async () => {
    try {
      const data = await fetchActiveSessions();
      if (data && data.sessions) {
        const currentToken = getRefreshToken() || "";
        const formatted = data.sessions.map((s) => ({
          id: s.token,
          device: s.device || "Unknown Device",
          location: s.location || "Addis Ababa, ET",
          ip: s.ip_address || "127.0.0.1",
          active: s.token === currentToken
        }));
        setSessions(formatted);
      }
    } catch (err) {
      console.error("Failed to load active sessions:", err.message);
    }
  };

  // Load from server on mount
  useEffect(() => {
    fetchMaintenanceStatus()
      .then((d) => setDbStatus(d))
      .catch(() => setDbStatus({ database: "error" }));

    queueMicrotask(loadSessions);

    fetchPlatformSettings()
      .then((data) => {
        const cfg = data.settings?.platform_config;
        if (cfg) {
          setToggles({
            userRegistration: cfg.userRegistration !== false,
            strictVerification: cfg.strictVerification === true,
            twoFactor: cfg.twoFactorRequired === true,
            notifNewUsers: cfg.notifNewUsers !== false,
            notifVerification: cfg.notifVerification !== false,
            notifAlerts: cfg.notifAlerts === true,
          });
          if (cfg.language) {
            setLangPreference(cfg.language);
            setLocale(cfg.language);
          }
          if (cfg.defaultSignupRole) setRoleForm({ defaultRole: cfg.defaultSignupRole });
        }
      })
      .catch(() => {});

    fetchAuditLogs({ limit: 20 })
      .then((data) => setLiveLogs(data.logs || []))
      .catch(() => setLiveLogs([]));

    getCurrentAccount()
      .then((data) => {
        const user = data?.user || {};
        setProfile({
          firstName: user.first_name || "",
          lastName: user.last_name || "",
          email: user.email || "",
          phone_number: user.phone_number || "",
          role: user.role || "Admin",
        });
      })
      .catch(() => {})
      .finally(() => setAccountLoading(false));
  }, [setLocale]);

  useEffect(() => {
    queueMicrotask(() => setLangPreference(language));
  }, [language]);

  const handleToggle = (key) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Profile management
  const openEditProfile = () => {
    setProfileForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone_number: profile.phone_number || "",
    });
    setActiveModal("editProfile");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      triggerToast("First and last name are required.", "error");
      return;
    }
    try {
      const data = await updateCurrentAccount({
        first_name: profileForm.firstName.trim(),
        last_name: profileForm.lastName.trim(),
        email: profileForm.email.trim(),
        phone_number: profileForm.phone_number.trim() || null,
      });
      const user = data?.user || {};
      setProfile({
        firstName: user.first_name || profileForm.firstName.trim(),
        lastName: user.last_name || profileForm.lastName.trim(),
        email: user.email || profileForm.email.trim(),
        phone_number: user.phone_number || profileForm.phone_number.trim(),
        role: user.role || profile.role,
      });
      setSession({ token: getToken(), userName: `${user.first_name || profileForm.firstName} ${user.last_name || profileForm.lastName}`.trim() });
      triggerToast("Profile updated successfully.", "success");
      setActiveModal(null);
    } catch (err) {
      triggerToast(err.message || "Failed to update profile.", "error");
    }
  };

  // Password validation helper
  const isStrongPassword = (password) => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const hasLength = password.length >= 8;
    return hasUppercase && hasLowercase && hasNumber && hasSpecial && hasLength;
  };

  const getPasswordStrengthColor = (password) => {
    if (!password) return "bg-slate-200";
    const checks = [
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      password.length >= 8
    ];
    const strength = checks.filter(Boolean).length;
    if (strength <= 2) return "bg-red-300";
    if (strength <= 3) return "bg-orange-300";
    if (strength <= 4) return "bg-yellow-300";
    return "bg-emerald-400";
  };

  // Password change management
  const openChangePassword = () => {
    setPasswordForm({ current: "", newPassword: "", confirm: "" });
    setShowPasswords({ current: false, newPassword: false, confirm: false });
    setActiveModal("changePassword");
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.current) {
      triggerToast("Current password is required.", "error");
      return;
    }
    if (!passwordForm.newPassword) {
      triggerToast("New password is required.", "error");
      return;
    }
    if (!passwordForm.confirm) {
      triggerToast("Password confirmation is required.", "error");
      return;
    }
    if (!isStrongPassword(passwordForm.newPassword)) {
      triggerToast("Password must be 8+ characters with uppercase, lowercase, number, and special character.", "error");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirm) {
      triggerToast("New passwords do not match.", "error");
      return;
    }
    try {
      const result = await changeAdminPassword(passwordForm.current, passwordForm.newPassword);
      if (result.message) {
        triggerToast("Password changed successfully! Verification email has been sent.", "success");
        setPasswordForm({ current: "", newPassword: "", confirm: "" });
        setShowPasswords({ current: false, newPassword: false, confirm: false });
        setActiveModal(null);
      }
    } catch (err) {
      triggerToast(err.message || "Failed to change password. Please try again.", "error");
    }
  };

  // Revoke session
  const revokeSession = async (token) => {
    try {
      await revokeActiveSession(token);
      triggerToast("Selected session terminated.", "success");
      loadSessions();
    } catch (err) {
      triggerToast(err.message || "Failed to terminate session.", "error");
    }
  };

  // Export configurations
  const handleDownloadData = async () => {
    try {
      await downloadAuditLogsExport();
      triggerToast("Audit logs exported successfully.", "success");
    } catch (err) {
      triggerToast(err.message || "Failed to export audit logs.", "error");
    }
  };

  const handleResetData = async () => {
    if (resetInput !== "RESET") {
      triggerToast("Please type RESET to confirm.", "error");
      return;
    }
    try {
      await updatePlatformSettings({ ...DEFAULT_PLATFORM_CONFIG });
      setToggles({
        userRegistration: DEFAULT_PLATFORM_CONFIG.userRegistration,
        strictVerification: DEFAULT_PLATFORM_CONFIG.strictVerification,
        twoFactor: DEFAULT_PLATFORM_CONFIG.twoFactorRequired,
        notifNewUsers: DEFAULT_PLATFORM_CONFIG.notifNewUsers,
        notifVerification: DEFAULT_PLATFORM_CONFIG.notifVerification,
        notifAlerts: DEFAULT_PLATFORM_CONFIG.notifAlerts,
      });
      setLangPreference(DEFAULT_PLATFORM_CONFIG.language);
      setLocale(DEFAULT_PLATFORM_CONFIG.language);
      setRoleForm({ defaultRole: DEFAULT_PLATFORM_CONFIG.defaultSignupRole });
      setActiveModal(null);
      setResetInput("");
      triggerToast("Platform settings reset to server defaults.", "success");
    } catch (err) {
      triggerToast(err.message || "Failed to reset platform settings.", "error");
    }
  };

  // Save/Discard overall settings
  const handleSaveAll = async () => {
    try {
      await updatePlatformSettings({
        userRegistration: toggles.userRegistration,
        strictVerification: toggles.strictVerification,
        twoFactorRequired: toggles.twoFactor,
        notifNewUsers: toggles.notifNewUsers,
        notifVerification: toggles.notifVerification,
        notifAlerts: toggles.notifAlerts,
        defaultSignupRole: roleForm.defaultRole,
        language: langPreference,
      });
      triggerToast("Platform settings saved on the server.", "success");
    } catch (err) {
      triggerToast(err.message || "Failed to save platform settings.", "error");
    }
  };

  const handleDiscardChanges = async () => {
    try {
      const data = await fetchPlatformSettings();
      const cfg = data.settings?.platform_config;
      if (cfg) {
        setToggles({
          userRegistration: cfg.userRegistration !== false,
          strictVerification: cfg.strictVerification === true,
          twoFactor: cfg.twoFactorRequired === true,
          notifNewUsers: cfg.notifNewUsers !== false,
          notifVerification: cfg.notifVerification !== false,
          notifAlerts: cfg.notifAlerts !== false,
        });
        if (cfg.language) {
          setLangPreference(cfg.language);
          setLocale(cfg.language);
        }
        if (cfg.defaultSignupRole) setRoleForm({ defaultRole: cfg.defaultSignupRole });
      }
      const account = await getCurrentAccount();
      const user = account?.user || {};
      setProfile({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        role: user.role || "Admin",
      });
      triggerToast("Reloaded settings from the server.", "info");
    } catch {
      triggerToast("Failed to reload settings.", "error");
    }
  };

  const handleLogoutEverywhere = async () => {
    try {
      await revokeAllOtherSessions(getRefreshToken() || "");
      clearSession();
      triggerToast("All sessions terminated. Redirecting to login...", "success");
      setActiveModal(null);
      setTimeout(() => { window.location.href = "/login"; }, 1500);
    } catch (err) {
      triggerToast(err.message || "Failed to terminate all sessions.", "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-fade-in relative">
      
      {/* Toast Alert */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border animate-slide-in-right ${
          toast.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-800" :
          toast.type === "error" ? "bg-rose-50 border-rose-100 text-rose-800" :
          "bg-blue-50 border-blue-100 text-blue-800"
        }`}>
          {toast.type === "success" && (
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {toast.type === "error" && (
            <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          {toast.type === "info" && (
            <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <p className="text-sm font-semibold">{toast.message}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Settings</h1>
          <p className="text-slate-500 mt-1">Configure global platform parameters and account security.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDiscardChanges}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition"
          >
            Discard Changes
          </button>
          <button 
            onClick={handleSaveAll}
            className="px-5 py-2.5 rounded-xl bg-[#006054] text-white font-bold text-sm hover:bg-[#004d43] transition shadow-md shadow-[#006054]/20"
          >
            Save All Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Profile Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-[#006054] flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {accountLoading ? "…" : `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase() || "AD"}
                </span>
              </div>
              <button 
                onClick={openEditProfile}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#006054] text-white rounded-full flex items-center justify-center border-2 border-white hover:bg-[#004d43] transition shadow"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </button>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {accountLoading ? "Loading…" : `${profile.firstName} ${profile.lastName}`.trim() || "Administrator"}
            </h2>
            <div className="px-3 py-1 rounded-md bg-[#e6f0ee] text-[#006054] text-[10px] font-bold tracking-widest uppercase mb-4">
              {profile.role}
            </div>
            <p className="text-sm text-slate-500 mb-2 leading-relaxed max-w-[280px] break-all">{profile.email || "—"}</p>
            <p className="text-xs text-slate-400 mb-8">{profile.phone_number || "No phone on file"}</p>
            <button 
              onClick={openEditProfile}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-[#006054] text-[#006054] font-bold text-sm hover:bg-[#f0fdf4] transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
              Edit Profile
            </button>
          </div>

          {/* Platform Settings Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <svg className="w-5 h-5 text-[#006054]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <h2 className="text-lg font-bold text-slate-800">Platform Settings</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">User Registration Control</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Allow new users to sign up without direct invitation.</p>
                </div>
                <button
                  onClick={() => handleToggle('userRegistration')}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 shrink-0 ${toggles.userRegistration ? 'bg-[#006054]' : 'bg-slate-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 ${toggles.userRegistration ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                </button>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Strict Verification</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Manual KYC approval required for all new startups.</p>
                </div>
                <button 
                  onClick={() => handleToggle('strictVerification')}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 shrink-0 ${toggles.strictVerification ? 'bg-[#006054]' : 'bg-slate-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 ${toggles.strictVerification ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                </button>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Require 2FA Platform-Wide</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Require two-factor authentication for all user logins.</p>
                </div>
                <button
                  onClick={() => handleToggle('twoFactor')}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 shrink-0 ${toggles.twoFactor ? 'bg-[#006054]' : 'bg-slate-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 ${toggles.twoFactor ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                </button>
              </div>

              <div className="pt-2">
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <button 
                    onClick={() => { setLangPreference("English"); setLocale("English"); triggerToast(t("language.englishSelected"), "info"); }}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${langPreference === "English" ? "bg-white text-[#006054] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    {t("language.english")}
                  </button>
                  <button 
                    onClick={() => { setLangPreference("Amharic"); setLocale("Amharic"); triggerToast(t("language.amharicSelected"), "info"); }}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${langPreference === "Amharic" ? "bg-white text-[#006054] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    {t("language.amharic")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reports & Logs Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <svg className="w-5 h-5 text-[#006054]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h2 className="text-lg font-bold text-slate-800">Reports & Logs</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setActiveModal("systemLogs")}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-100 transition text-left group"
              >
                <svg className="w-6 h-6 text-slate-400 group-hover:text-[#006054] transition mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <h3 className="font-bold text-sm text-slate-800">View System Logs</h3>
                <p className="text-[10px] text-slate-500 mt-1">Real-time activity tracking</p>
              </button>
              <button 
                onClick={handleDownloadData}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-100 transition text-left group"
              >
                <svg className="w-6 h-6 text-slate-400 group-hover:text-[#006054] transition mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                <h3 className="font-bold text-sm text-slate-800">Download Data</h3>
                <p className="text-[10px] text-slate-500 mt-1">Export platform analytics</p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Account & Security Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <svg className="w-5 h-5 text-[#006054]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              <h2 className="text-lg font-bold text-slate-800">Account & Security</h2>
            </div>

            <div className="space-y-4">
              <button 
                onClick={openChangePassword}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition group"
              >
                <div className="flex items-center gap-4">
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-[#006054] transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                  <div className="text-left">
                    <h3 className="font-bold text-sm text-slate-800">Change Password</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Fully functional security manager</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>

              <div className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition">
                <div className="flex items-center gap-4">
                  <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                  <div className="text-left">
                    <h3 className="font-bold text-sm text-slate-800">Two-Factor Authentication</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Manage your personal 2FA</p>
                  </div>
                </div>
                <button type="button" onClick={() => setActiveModal("twoFactor")} className="text-xs font-bold text-[#006054] hover:underline">Manage</button>
              </div>

              <button 
                onClick={() => setActiveModal("manageSessions")}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition group"
              >
                <div className="flex items-center gap-4">
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-[#006054] transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  <div className="text-left">
                    <h3 className="font-bold text-sm text-slate-800">Manage Sessions</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{sessions.length} active devices globally</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <svg className="w-5 h-5 text-[#006054]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
              <h2 className="text-lg font-bold text-slate-800">Notifications</h2>
            </div>

            <div className="space-y-6 mb-10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700">New User Registrations</h3>
                <button 
                  onClick={() => handleToggle('notifNewUsers')}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 shrink-0 ${toggles.notifNewUsers ? 'bg-[#006054]' : 'bg-slate-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 ${toggles.notifNewUsers ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700">Verification Requests</h3>
                <button 
                  onClick={() => handleToggle('notifVerification')}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 shrink-0 ${toggles.notifVerification ? 'bg-[#006054]' : 'bg-slate-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 ${toggles.notifVerification ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700">System Alerts</h3>
                <button 
                  onClick={() => handleToggle('notifAlerts')}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 shrink-0 ${toggles.notifAlerts ? 'bg-[#006054]' : 'bg-slate-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 ${toggles.notifAlerts ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <svg className="w-5 h-5 text-[#006054]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              <h2 className="text-lg font-bold text-slate-800">User Management</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setActiveModal("userRoles")}
                className="py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition"
              >
                Default User Roles
              </button>
              <button 
                onClick={() => setActiveModal("permissions")}
                className="py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition"
              >
                Permissions Overview
              </button>
            </div>
          </div>

          {/* Danger Zone Card */}
          <div className="bg-red-50/30 rounded-3xl p-8 border border-red-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <h2 className="text-lg font-bold text-red-600">Danger Zone</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Reset Platform Settings</h3>
                  <p className="text-xs text-slate-500 mt-1">Restore registration, verification, and notification defaults on the server.</p>
                </div>
                <button 
                  onClick={() => { setResetInput(""); setActiveModal("resetData"); }}
                  className="px-5 py-2 rounded-xl border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition shrink-0"
                >
                  Reset All
                </button>
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Logout Everywhere</h3>
                  <p className="text-xs text-slate-500 mt-1">Terminate all active sessions for this account.</p>
                </div>
                <button 
                  onClick={handleLogoutEverywhere}
                  className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition shadow-md shadow-red-600/20 shrink-0"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Details */}
      <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between text-[10px] font-bold text-slate-400 tracking-widest uppercase">
        <p>StartupConnect Admin • © {new Date().getFullYear()}</p>
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <span>System Status: {dbStatus?.database === "ok" ? "Database OK" : dbStatus ? "Check backend" : "…"}</span>
          <Link href="/admin/activity" className="hover:text-slate-600 transition">Activity Logs</Link>
          <Link href="/admin/maintenance" className="hover:text-slate-600 transition">Maintenance</Link>
        </div>
      </div>

      {/* Modals overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 max-w-lg w-full mx-4 shadow-2xl relative transition-transform duration-300 transform scale-100">
            <button 
              onClick={() => { setActiveModal(null); setResetInput(""); }}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {activeModal === "twoFactor" && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800">Two-Factor Authentication</h3>
                <AccountSecurityPanel showToast={triggerToast} />
                <div className="flex justify-end pt-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2 rounded-xl bg-slate-800 text-white font-bold text-sm">Close</button>
                </div>
              </div>
            )}

            {/* Edit Profile Modal */}
            {activeModal === 'editProfile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800">Edit Profile Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">First Name</label>
                    <input type="text" value={profileForm.firstName} onChange={(e) => setProfileForm(p => ({ ...p, firstName: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#006054] text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Last Name</label>
                    <input type="text" value={profileForm.lastName} onChange={(e) => setProfileForm(p => ({ ...p, lastName: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#006054] text-sm" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Email</label>
                  <input type="email" value={profileForm.email} onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#006054] text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Phone Number</label>
                  <input type="tel" value={profileForm.phone_number} onChange={(e) => setProfileForm(p => ({ ...p, phone_number: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#006054] text-sm" placeholder="+251..." />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setActiveModal(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#006054] text-white font-bold text-sm hover:bg-[#004d43] transition shadow-md shadow-[#006054]/20"
                  >
                    Apply Changes
                  </button>
                </div>
              </form>
            )}

            {/* Change Password Modal */}
            {activeModal === 'changePassword' && (
              <form onSubmit={handleSavePassword} className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800">Change Password</h3>
                <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                  New password must contain: 8+ characters, uppercase, lowercase, number, and special character.
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Current Password</label>
                  <div className="relative">
                    <input 
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                      className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:border-[#006054] text-sm font-medium"
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 text-lg"
                    >
                      {showPasswords.current ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">New Password</label>
                  <div className="relative">
                    <input 
                      type={showPasswords.newPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:border-[#006054] text-sm font-medium"
                      placeholder="8+ characters with uppercase, lowercase, number, special char"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(p => ({ ...p, newPassword: !p.newPassword }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 text-lg"
                    >
                      {showPasswords.newPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  {passwordForm.newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-xs mb-1">
                        <div className={`h-1.5 flex-1 rounded-full ${getPasswordStrengthColor(passwordForm.newPassword)}`}></div>
                        <span className="text-slate-600 font-medium min-w-fit">
                          {passwordForm.newPassword.length < 8 ? "Too short" : 
                           isStrongPassword(passwordForm.newPassword) ? "✓ Strong" : "Weak"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {!/[A-Z]/.test(passwordForm.newPassword) && "• Missing uppercase letter"}
                        {!/[a-z]/.test(passwordForm.newPassword) && "• Missing lowercase letter"}
                        {!/\d/.test(passwordForm.newPassword) && "• Missing number"}
                        {!/[!@#$%^&*()_+\-=\[\]{};':"\\\|,.<>\/?]/.test(passwordForm.newPassword) && "• Missing special character"}
                        {passwordForm.newPassword.length < 8 && "• At least 8 characters required"}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input 
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                      className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:border-[#006054] text-sm font-medium"
                      placeholder="Repeat new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 text-lg"
                    >
                      {showPasswords.confirm ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  {passwordForm.confirm && passwordForm.newPassword !== passwordForm.confirm && (
                    <p className="text-xs text-red-600 mt-1">✗ Passwords do not match</p>
                  )}
                  {passwordForm.confirm && passwordForm.newPassword === passwordForm.confirm && (
                    <p className="text-xs text-emerald-600 mt-1">✓ Passwords match</p>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setActiveModal(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={!isStrongPassword(passwordForm.newPassword) || passwordForm.newPassword !== passwordForm.confirm}
                    className="px-5 py-2.5 rounded-xl bg-[#006054] text-white font-bold text-sm hover:bg-[#004d43] transition shadow-md shadow-[#006054]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            )}

            {/* View System Logs Modal */}
            {activeModal === 'systemLogs' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800">System Logs</h3>
                <div className="bg-slate-900 rounded-2xl p-4 text-[11px] font-mono text-emerald-400 space-y-2.5 max-h-[300px] overflow-y-auto shadow-inner border border-slate-950">
                  {(liveLogs.length ? liveLogs : []).map((log, i) => (
                    <div key={log.audit_log_id || i} className="flex flex-col border-b border-slate-800/80 pb-1.5 last:border-0 last:pb-0">
                      <span className="text-slate-500 font-bold">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : log.time} [{log.type || "AUDIT"}]
                      </span>
                      <span className="text-slate-200 mt-0.5">
                        {log.text || `${log.action?.replace(/_/g, " ")} · ${log.entity_type || ""} ${log.entity_id ? `#${log.entity_id}` : ""} ${log.details || ""}`.trim()}
                      </span>
                    </div>
                  ))}
                  {!liveLogs.length ? (
                    <p className="text-slate-500">No recent audit activity.</p>
                  ) : null}
                </div>
                <div className="flex justify-end pt-2">
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="px-5 py-2 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 transition"
                  >
                    Close Viewer
                  </button>
                </div>
              </div>
            )}

            {/* Manage Sessions Modal */}
            {activeModal === 'manageSessions' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800">Active Sessions</h3>
                <p className="text-xs text-slate-500 mb-2">These devices are currently logged in to your account. Revoke any session to force log out.</p>
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                  {sessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">{s.device}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{s.location} • {s.ip}</p>
                      </div>
                      {s.active ? (
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">Current</span>
                      ) : (
                        <button 
                          onClick={() => revokeSession(s.id)}
                          className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-100 transition"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-2">
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Default User Roles Modal */}
            {activeModal === 'userRoles' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800">Default User Roles</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Specify the default role and status initialized when a new user registers on the platform.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Default Signup Role</label>
                    <select 
                      value={roleForm.defaultRole} 
                      onChange={(e) => setRoleForm({ defaultRole: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#006054] text-sm text-slate-800 font-medium bg-white"
                    >
                      <option value="Startup">Startup Founder</option>
                      <option value="Investor">Verified Investor</option>
                      <option value="Mentor">Certified Mentor</option>
                    </select>
                  </div>
                  <div>
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 font-medium leading-relaxed">
                      Note: Default verification state for registration control will follow the global toggles configured under Platform Settings.
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      triggerToast(`Default user role updated to ${roleForm.defaultRole}. Save settings to persist.`, "success");
                      setActiveModal(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#006054] text-white font-bold text-sm hover:bg-[#004d43] transition shadow-md shadow-[#006054]/20"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            )}

            {/* Permissions Overview Modal */}
            {activeModal === 'permissions' && (
              <div className="space-y-4 max-w-lg w-full">
                <h3 className="text-xl font-bold text-slate-800">Permissions Matrix</h3>
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 bg-slate-50 uppercase font-bold tracking-wider">
                        <th className="p-3">Module / Feature</th>
                        <th className="p-3 text-center">Admin</th>
                        <th className="p-3 text-center">Startup</th>
                        <th className="p-3 text-center">Investor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      <tr>
                        <td className="p-3 font-semibold text-slate-800">User Management</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓ Full</td>
                        <td className="p-3 text-center text-slate-400">✗ None</td>
                        <td className="p-3 text-center text-slate-400">✗ None</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-800">Reports & Audit</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓ Full</td>
                        <td className="p-3 text-center text-amber-600 font-bold">⚠ Own</td>
                        <td className="p-3 text-center text-amber-600 font-bold">⚠ Own</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-800">Verify KYC status</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓ Full</td>
                        <td className="p-3 text-center text-slate-400">✗ None</td>
                        <td className="p-3 text-center text-slate-400">✗ None</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-800">Submit Investments</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓ Full</td>
                        <td className="p-3 text-center text-slate-400">✗ None</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓ Full</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end pt-4">
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Reset Data Modal */}
            {activeModal === 'resetData' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                  <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Critical Warning!
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  This action will reset your profile data, stored local configuration preferences, and passwords to default. This cannot be undone.
                </p>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase">To confirm, type <span className="text-red-600 font-bold">RESET</span> below:</label>
                  <input 
                    type="text"
                    value={resetInput}
                    onChange={(e) => setResetInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-red-200 focus:outline-none focus:border-red-600 text-sm font-semibold text-red-700"
                    placeholder="RESET"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    onClick={() => { setActiveModal(null); setResetInput(""); }}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleResetData}
                    className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition shadow-md shadow-red-600/20"
                  >
                    Confirm Full Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
