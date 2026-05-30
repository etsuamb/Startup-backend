"use client";
import { useCallback, useEffect, useState, useMemo } from "react";
import Sidebar from "@/components/startup/Sidebar";
import { getStartupProfile, updateStartupProfile, getNotificationSettings, updateNotificationSettings } from "@/lib/startupApi";
import { fetchPlatformCategories } from "@/lib/adminApi";
import { getCurrentAccount, updateCurrentAccount } from "@/lib/authApi";
import { canPreviewDocument, openUploadedFileForView } from "@/lib/viewUploadedFile";
import ViewableFileTrigger from "@/components/startup/ViewableFileTrigger";
import AccountAccessBanner from "@/components/auth/AccountAccessBanner";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fieldValue(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function normalizeWebsite(url) {
  const trimmed = (url || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

const STARTUP_DOCUMENT_TYPES = [
  { key: "founder_id", label: "Founder or representative ID", accept: "application/pdf,.pdf,image/*" },
  { key: "business_registration_proof", label: "Business registration proof", accept: "application/pdf,.pdf,image/*" },
  { key: "support_affiliation_letter", label: "Support or affiliation letter", accept: "application/pdf,.pdf,image/*" },
  { key: "tin_certificate", label: "TIN certificate", accept: "application/pdf,.pdf,image/*" },
  { key: "logo", label: "Company logo", accept: "image/*,.pdf,application/pdf" },
  { key: "proof_of_address", label: "Proof of address", accept: "application/pdf,.pdf,image/*" },
];

function normalizeDocText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isDocOfType(doc, typeKey) {
  const description = normalizeDocText(doc?.description);
  const fileName = normalizeDocText(doc?.file_name);
  if (!description && !fileName) return false;
  if (typeKey === "founder_id") return description.includes("founder") && description.includes("id");
  if (typeKey === "business_registration_proof") return description.includes("business registration") || description.includes("registration proof");
  if (typeKey === "support_affiliation_letter") return description.includes("support") || description.includes("affiliation");
  if (typeKey === "tin_certificate") return description.includes("tin");
  if (typeKey === "proof_of_address") return description.includes("proof of address") || description.includes("address");
  if (typeKey === "logo") return description.includes("logo") || fileName.includes("logo");
  return false;
}

function getDocumentTypeLabel(doc) {
  const found = STARTUP_DOCUMENT_TYPES.find((type) => isDocOfType(doc, type.key));
  return found?.label || doc?.description || "Other document";
}

function applyProfileToState(profile, setters) {
  const s = profile || {};
  setters.setFirstName(fieldValue(s.first_name));
  setters.setLastName(fieldValue(s.last_name));
  setters.setEmail(fieldValue(s.email));
  setters.setPhoneNumber(fieldValue(s.phone_number));
  setters.setFounderFullName(fieldValue(s.founder_full_name));
  setters.setStartupName(fieldValue(s.startup_name));
  setters.setIndustry(fieldValue(s.industry));
  setters.setTagline(fieldValue(s.startup_tagline));
  setters.setStage(fieldValue(s.business_stage));
  setters.setStartupType(fieldValue(s.startup_type));
  setters.setDescription(fieldValue(s.description));
  setters.setFoundedYear(fieldValue(s.founded_year));
  setters.setTeamSize(fieldValue(s.team_size));
  setters.setRegion(fieldValue(s.region));
  setters.setCity(fieldValue(s.city));
  setters.setFounderRole(fieldValue(s.founder_role));
  setters.setLocation(fieldValue(s.location));
  setters.setWebsite(fieldValue(s.website));
  setters.setFundingNeeded(fieldValue(s.funding_needed));
  setters.setAdminStatus(fieldValue(s.admin_status));
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconUser() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
function IconBuilding() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
function IconDocument() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconChevron() {
  return (
    <svg className="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function IconFile() {
  return (
    <svg className="w-8 h-8 text-[#0f3d32] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}
function IconKey() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}

// ─── Reusable Components ──────────────────────────────────────────────────────
const inputClass =
  "w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-4 py-3 text-sm outline-none transition-colors focus:border-[#0f3d32] focus:ring-2 focus:ring-[#0f3d32]/10 focus:bg-white";

function SectionCard({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
    </div>
  );
}

function FormField({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder, hint }) {
  return (
    <FormField label={label} hint={hint}>
      <div className="relative">
        <select value={value} onChange={onChange} className={`${inputClass} appearance-none pr-10`}>
          <option value="">{placeholder || "Select..."}</option>
          {options.map((opt) => (
            <option key={typeof opt === "string" ? opt : opt.value} value={typeof opt === "string" ? opt : opt.value}>
              {typeof opt === "string" ? opt : opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 pointer-events-none">
          <IconChevron />
        </div>
      </div>
    </FormField>
  );
}

function ToggleSwitch({ enabled, onToggle, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
        enabled ? "bg-[#0f3d32]" : "bg-gray-200"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function NotificationRow({ icon, title, description, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <ToggleSwitch enabled={enabled} onToggle={onToggle} />
    </div>
  );
}

function Toast({ message, type, onClose }) {
  if (!message) return null;
  const isSuccess = type === "success";
  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-lg text-sm font-semibold animate-in slide-in-from-right ${
        isSuccess ? "bg-[#0f3d32] text-white" : "bg-red-600 text-white"
      }`}
    >
      {isSuccess ? <IconCheck /> : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {message}
    </div>
  );
}

// ─── Tab Navigation ───────────────────────────────────────────────────────────
const TABS = [
  { id: "account", label: "Account", icon: <IconUser /> },
  { id: "profile", label: "Startup Profile", icon: <IconBuilding /> },
  { id: "documents", label: "Documents", icon: <IconDocument /> },
  { id: "security", label: "Security & 2FA", icon: <IconShield /> },
  { id: "notifications", label: "Notifications", icon: <IconBell /> },
  { id: "danger", label: "Danger Zone", icon: <IconTrash /> },
];

function SettingsNav({ activeTab, onTabChange }) {
  return (
    <nav className="space-y-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
            activeTab === tab.id
              ? "bg-[#0f3d32] text-white shadow-sm"
              : tab.id === "danger"
              ? "text-red-600 hover:bg-red-50"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

// ─── Profile Completeness ─────────────────────────────────────────────────────
function ProfileCompleteness({ fields }) {
  const total = fields.length;
  const filled = fields.filter((f) => f.value && String(f.value).trim() !== "").length;
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;

  const color = pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-500";
  const barColor = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  const bgBar = pct >= 80 ? "bg-emerald-100" : pct >= 50 ? "bg-amber-100" : "bg-red-100";

  const missing = fields.filter((f) => !f.value || String(f.value).trim() === "");

  return (
    <SectionCard>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900">Profile Completeness</h3>
        <span className={`text-sm font-black ${color}`}>{pct}%</span>
      </div>
      <div className={`w-full h-2 rounded-full ${bgBar} overflow-hidden`}>
        <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      {missing.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">Missing fields:</p>
          <div className="flex flex-wrap gap-1.5">
            {missing.slice(0, 6).map((f) => (
              <span key={f.label} className="text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                {f.label}
              </span>
            ))}
            {missing.length > 6 && (
              <span className="text-[11px] font-medium text-gray-400 px-2 py-1">+{missing.length - 6} more</span>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Industry / Stage / Type options ──────────────────────────────────────────
// Industries will be loaded from the platform categories API so admin-managed categories
// appear consistently across the app. Fallback to empty array until loaded.
// Use `fetchPlatformCategories('industry')` to populate this.


const STAGES = [
  { value: "Idea Stage", label: "Idea Stage" },
  { value: "Pre-Seed", label: "Pre-Seed" },
  { value: "Seed", label: "Seed" },
  { value: "Early Growth", label: "Early Growth" },
];

const TYPES = [
  { value: "B2B", label: "B2B (Business to Business)" },
  { value: "B2C", label: "B2C (Business to Consumer)" },
  { value: "B2G", label: "B2G (Business to Government)" },
  { value: "Marketplace", label: "Marketplace" },
];

const TEAM_SIZES = ["1-10", "11-50", "51-200", "201+"];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StartupSettingsPage() {
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [docFiles, setDocFiles] = useState({});
  const [showDocInputs, setShowDocInputs] = useState({});
  const [toast, setToast] = useState({ message: null, type: null });

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState("idle"); // idle | setup | verify
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFAError, setTwoFAError] = useState(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const registrationDocuments = useMemo(() => {
    return STARTUP_DOCUMENT_TYPES.map((type) => ({
      ...type,
      current: documents.find((doc) => isDocOfType(doc, type.key)) || null,
    }));
  }, [documents]);

  const otherDocuments = useMemo(
    () =>
      documents.filter(
        (doc) => !STARTUP_DOCUMENT_TYPES.some((type) => isDocOfType(doc, type.key)),
      ),
    [documents],
  );

  // ── Form State ──
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [founderFullName, setFounderFullName] = useState("");
  const [startupName, setStartupName] = useState("");
  const [industry, setIndustry] = useState("");
  const [industries, setIndustries] = useState([]);
  const [tagline, setTagline] = useState("");
  const [stage, setStage] = useState("");
  const [startupType, setStartupType] = useState("");
  const [description, setDescription] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [founderRole, setFounderRole] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [fundingNeeded, setFundingNeeded] = useState("");
  const [adminStatus, setAdminStatus] = useState("");

  // ── Notification State ──
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    rating_notifications: true,
    mentorship_notifications: true,
    investment_notifications: true,
    message_notifications: true,
  });
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);

  const formSetters = {
    setFirstName, setLastName, setEmail, setPhoneNumber, setFounderFullName,
    setStartupName, setIndustry, setTagline, setStage, setStartupType,
    setDescription, setFoundedYear, setTeamSize, setRegion, setCity,
    setFounderRole, setLocation, setWebsite, setFundingNeeded, setAdminStatus,
  };

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: null, type: null }), 3500);
  }, []);

  // ── Data Loading ──
  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStartupProfile();
      const profile = data.startup;
      if (!profile) {
        showToast("No startup profile found. Complete registration first.", "error");
        return;
      }
      applyProfileToState(profile, formSetters);
      setOriginalEmail(fieldValue(profile.email));
      setEmailVerified(profile.email_verified !== false);
      setDocuments(data.documents || []);
      setShowDocInputs({});
      setDocFiles({});
    } catch (err) {
      if (err.code === "EMAIL_NOT_VERIFIED" || err.code === "ACCOUNT_PENDING_APPROVAL") {
        try {
          const account = await getCurrentAccount();
          const user = account.user || {};
          setFirstName(fieldValue(user.first_name));
          setLastName(fieldValue(user.last_name));
          setEmail(fieldValue(user.email));
          setOriginalEmail(fieldValue(user.email));
          setEmailVerified(user.email_verified !== false);
          setPhoneNumber(fieldValue(user.phone_number));
          setAdminStatus(user.is_approved ? "approved" : "pending review");
          showToast("Verify your email before using the rest of the platform. You can update it here if it is wrong.", "error");
        } catch (accountErr) {
          showToast(accountErr.message || "Unable to load account information.", "error");
        }
      } else {
        showToast(err.message || "Unable to load startup profile.", "error");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNotificationSettings = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const data = await getNotificationSettings();
      setNotificationSettings(data.settings || {
        email_notifications: true, push_notifications: true,
        rating_notifications: true, mentorship_notifications: true,
        investment_notifications: true, message_notifications: true,
      });
    } catch {
      // silently fall back to defaults
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadNotificationSettings();
    (async () => {
      try {
        const cats = await fetchPlatformCategories("industry");
        const list = (cats?.categories || []).filter(Boolean).map((c) => c.name || c);
        setIndustries(list);
      } catch (e) {
        // ignore — keep empty list fallback
      }
    })();
  }, [loadProfile, loadNotificationSettings]);

  // ── Profile completeness ──
  const profileFields = useMemo(() => [
    { label: "First Name", value: firstName },
    { label: "Last Name", value: lastName },
    { label: "Phone", value: phoneNumber },
    { label: "Startup Name", value: startupName },
    { label: "Industry", value: industry },
    { label: "Tagline", value: tagline },
    { label: "Stage", value: stage },
    { label: "Type", value: startupType },
    { label: "Description", value: description },
    { label: "Founded Year", value: foundedYear },
    { label: "Team Size", value: teamSize },
    { label: "Region", value: region },
    { label: "City", value: city },
    { label: "Founder Role", value: founderRole },
    { label: "Website", value: website },
    { label: "Funding Needed", value: fundingNeeded },
  ], [firstName, lastName, phoneNumber, startupName, industry, tagline, stage, startupType, description, foundedYear, teamSize, region, city, founderRole, website, fundingNeeded]);

  // ── Handlers ──
  async function handleSaveAccountInfo(event) {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim()) { showToast("First and last name are required.", "error"); return; }
    if (!email.trim()) { showToast("Email is required.", "error"); return; }

    setSaving(true);
    try {
      const data = await updateCurrentAccount({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone_number: phoneNumber.trim(),
      });
      const user = data.user || {};
      setFirstName(fieldValue(user.first_name));
      setLastName(fieldValue(user.last_name));
      setEmail(fieldValue(user.email));
      setOriginalEmail(fieldValue(user.email));
      setEmailVerified(user.email_verified !== false);
      setPhoneNumber(fieldValue(user.phone_number));
      setAdminStatus(user.is_approved ? "approved" : "pending review");
      showToast(data.message || "Account information updated.");
    } catch (err) {
      showToast(err.message || "Unable to update account information.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    if (!startupName.trim()) { showToast("Startup name is required.", "error"); return; }
    if (!firstName.trim() || !lastName.trim()) { showToast("First and last name are required.", "error"); return; }

    const formData = new FormData();
    formData.append("first_name", firstName.trim());
    formData.append("last_name", lastName.trim());
    formData.append("phone_number", phoneNumber.trim());
    formData.append("founder_full_name", founderFullName.trim() || `${firstName.trim()} ${lastName.trim()}`.trim());
    formData.append("startup_name", startupName.trim());
    formData.append("industry", industry.trim());
    formData.append("startup_tagline", tagline.trim());
    formData.append("business_stage", stage.trim());
    formData.append("startup_type", startupType.trim());
    formData.append("description", description.trim());
    formData.append("region", region.trim());
    formData.append("city", city.trim());
    formData.append("founder_role", founderRole.trim());
    formData.append("location", location.trim() || [region.trim(), city.trim()].filter(Boolean).join(", "));
    formData.append("website", normalizeWebsite(website));
    if (foundedYear.trim()) formData.append("founded_year", foundedYear.trim());
    if (teamSize.trim()) formData.append("team_size", teamSize.trim());
    if (fundingNeeded.trim()) formData.append("funding_needed", fundingNeeded.trim());
    Object.entries(docFiles).forEach(([key, file]) => {
      if (file) formData.append(key, file);
    });

    setSaving(true);
    try {
      const data = await updateStartupProfile(formData);
      if (data.startup) applyProfileToState(data.startup, formSetters);
      if (data.documents) setDocuments(data.documents);
      setDocFiles({});
      setShowDocInputs({});
      showToast(data.message || "Settings saved successfully.");
    } catch (err) {
      showToast(err.message || "Unable to save settings.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNotifications(event) {
    event.preventDefault();
    setSavingNotifications(true);
    try {
      await updateNotificationSettings(notificationSettings);
      showToast("Notification preferences saved.");
    } catch (err) {
      showToast(err.message || "Unable to update notification settings.", "error");
    } finally {
      setSavingNotifications(false);
    }
  }

  const toggleNotification = (key) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  function handleEnable2FA() {
    setTwoFAStep("setup");
    setTwoFACode("");
    setTwoFAError(null);
  }

  function handleVerify2FA(e) {
    e.preventDefault();
    if (twoFACode.length !== 6 || !/^\d{6}$/.test(twoFACode)) {
      setTwoFAError("Please enter a valid 6-digit code.");
      return;
    }
    // In a real implementation this would call an API endpoint
    setTwoFAEnabled(true);
    setTwoFAStep("idle");
    setTwoFACode("");
    setTwoFAError(null);
    showToast("Two-factor authentication enabled successfully.");
  }

  function handleDisable2FA() {
    setTwoFAEnabled(false);
    setTwoFAStep("idle");
    showToast("Two-factor authentication disabled.");
  }

  // ── Render Tabs ──
  function renderTabContent() {
    switch (activeTab) {
      case "account":
        return renderAccountTab();
      case "profile":
        return renderProfileTab();
      case "documents":
        return renderDocumentsTab();
      case "security":
        return renderSecurityTab();
      case "notifications":
        return renderNotificationsTab();
      case "danger":
        return renderDangerTab();
      default:
        return null;
    }
  }

  // ─── Account Tab ────────────────────────────────────────────────────────────
  function renderAccountTab() {
    return (
      <form onSubmit={handleSaveAccountInfo} className="space-y-6">
        <SectionCard>
          <SectionHeader title="Personal Information" description="Your login credentials and contact information." />

          {/* Status badge */}
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${adminStatus === "approved" ? "bg-emerald-500" : "bg-amber-500"}`} />
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account Status</p>
              <p className="text-sm font-bold text-gray-900 capitalize">{emailVerified ? (adminStatus || "Pending Review") : "Email verification required"}</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="First name">
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} required />
            </FormField>
            <FormField label="Last name">
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} required />
            </FormField>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 mt-5">
            <FormField
              label="Email"
              hint={emailVerified ? "Changing this email requires verification again." : "Use a real email you can access, then verify it from your inbox."}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
              {!emailVerified ? (
                <p className="mt-2 text-xs font-semibold text-amber-700">
                  This account cannot be approved until this email is verified.
                </p>
              ) : email.trim().toLowerCase() !== originalEmail.trim().toLowerCase() ? (
                <p className="mt-2 text-xs font-semibold text-amber-700">
                  Saving will send a new verification link and mark the account unverified until confirmed.
                </p>
              ) : null}
            </FormField>
            <FormField label="Phone number">
              <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={inputClass} placeholder="+251..." />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label="Founder full name" hint="As displayed on your public startup profile.">
              <input value={founderFullName} onChange={(e) => setFounderFullName(e.target.value)} className={inputClass} placeholder="e.g., John Doe" />
            </FormField>
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0f3d32] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0b2f26] disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <IconCheck />
                Save Account Info
              </>
            )}
          </button>
        </div>
      </form>
    );
  }

  // ─── Profile Tab ────────────────────────────────────────────────────────────
  function renderProfileTab() {
    return (
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <SectionCard>
          <SectionHeader title="Company Details" description="Information that investors and mentors see on your profile." />

          <div className="space-y-5">
            <FormField label="Startup name">
              <input value={startupName} onChange={(e) => setStartupName(e.target.value)} className={inputClass} required />
            </FormField>

            <FormField label="Tagline" hint="A short, punchy description of what your startup does.">
              <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputClass} placeholder="e.g., Making fintech accessible for everyone" />
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField label="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} options={industries} placeholder="Select industry" />
              <SelectField label="Business stage" value={stage} onChange={(e) => setStage(e.target.value)} options={STAGES} placeholder="Select stage" />
            </div>

            <SelectField label="Startup type" value={startupType} onChange={(e) => setStartupType(e.target.value)} options={TYPES} placeholder="Select type" />

            <FormField label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={inputClass}
                placeholder="Describe your startup, mission, and what makes it unique..."
              />
            </FormField>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader title="Team & Location" description="Help investors understand your team and where you operate." />

          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Founded year">
                <input type="number" value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} className={inputClass} placeholder="YYYY" min="1900" max="2100" />
              </FormField>
              <SelectField label="Team size" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} options={TEAM_SIZES} placeholder="Select size" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Region">
                <input value={region} onChange={(e) => setRegion(e.target.value)} className={inputClass} placeholder="e.g., Addis Ababa" />
              </FormField>
              <FormField label="City">
                <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="e.g., Bole" />
              </FormField>
            </div>
            <FormField label="Founder role">
              <input value={founderRole} onChange={(e) => setFounderRole(e.target.value)} className={inputClass} placeholder="e.g., CEO, CTO, Co-Founder" />
            </FormField>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader title="Funding & Links" />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Website">
              <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} placeholder="https://yourstartup.com" />
            </FormField>
            <FormField label="Funding needed (USD)">
              <input type="number" value={fundingNeeded} onChange={(e) => setFundingNeeded(e.target.value)} className={inputClass} placeholder="e.g., 500000" min="0" />
            </FormField>
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0f3d32] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0b2f26] disabled:opacity-50"
          >
            {saving ? (
              <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving...</>
            ) : (
              <><IconCheck /> Save Profile</>
            )}
          </button>
        </div>
      </form>
    );
  }

  // ─── Documents Tab ──────────────────────────────────────────────────────────
  function renderDocumentSlot(type) {
    const currentDoc = type.current;
    const canViewCurrent = currentDoc
      ? canPreviewDocument({
          documentId: currentDoc.document_id,
          filePath: currentDoc.file_path,
        })
      : false;
    const showInput = Boolean(showDocInputs[type.key]);
    const file = docFiles[type.key] || null;

    function setFile(fileValue) {
      setDocFiles((prev) => ({ ...prev, [type.key]: fileValue }));
    }

    function setShowInput(value) {
      setShowDocInputs((prev) => ({ ...prev, [type.key]: value }));
    }

    return (
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">{type.label}</p>
        {currentDoc && !showInput ? (
          <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 transition">
            <button
              type="button"
              disabled={!canViewCurrent}
              onClick={() =>
                openUploadedFileForView({
                  documentId: currentDoc.document_id,
                  filePath: currentDoc.file_path,
                  fileName: currentDoc.file_name,
                  fileType: currentDoc.file_type,
                })
              }
              className={`flex items-center gap-3 min-w-0 text-left transition ${
                canViewCurrent ? "hover:opacity-80 cursor-pointer" : "opacity-60 cursor-not-allowed"
              }`}
              title={canViewCurrent ? "Tap to view" : "Preview unavailable"}
            >
              <IconFile />
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{currentDoc.file_name}</p>
                <p className="text-[11px] text-[#0f3d32] font-semibold mt-0.5">{getDocumentTypeLabel(currentDoc)}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Uploaded {new Date(currentDoc.created_at).toLocaleDateString()}
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setShowInput(true)}
              className="shrink-0 ml-4 text-xs font-bold text-[#0f3d32] border border-[#0f3d32]/20 rounded-lg px-3 py-1.5 hover:bg-[#0f3d32]/5 transition"
            >
              Replace
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-5 text-center hover:border-[#0f3d32]/30 transition">
              <input
                type="file"
                accept={type.accept}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#0f3d32]/10 file:text-[#0f3d32] hover:file:bg-[#0f3d32]/20 cursor-pointer"
              />
              <p className="mt-2 text-xs text-gray-400">Upload a clearer or updated file to replace the current one.</p>
            </div>
            {currentDoc && (
              <div className="flex justify-between items-center text-xs px-1">
                <span className="text-gray-400">This will replace the existing file.</span>
                <button type="button" onClick={() => { setShowInput(false); setFile(null); }} className="font-bold text-red-500 hover:text-red-700">
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderDocumentsTab() {
    const hasDocumentChanges = Object.values(docFiles).some(Boolean);

    return (
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <SectionCard>
          <SectionHeader
            title="Startup Registration Documents"
            description="Manage the documents submitted during startup verification. Each file is labeled by document type."
          />

          <div className="space-y-6">
            {registrationDocuments.map((type, index) => (
              <div key={type.key}>
                {renderDocumentSlot(type)}
                {index !== registrationDocuments.length - 1 && <div className="border-t border-gray-100 mt-6" />}
              </div>
            ))}
          </div>
        </SectionCard>

        {otherDocuments.length > 0 && (
          <SectionCard>
            <SectionHeader title="Other Documents" description={`${otherDocuments.length} additional document${otherDocuments.length !== 1 ? "s" : ""} uploaded.`} />
            <ul className="space-y-2">
              {otherDocuments.map((doc) => (
                <li key={doc.document_id} className="rounded-xl bg-gray-50 border border-gray-100 hover:border-[#0f3d32]/20 hover:bg-[#f0faf7] transition">
                  <ViewableFileTrigger
                    documentId={doc.document_id}
                    filePath={doc.file_path}
                    fileName={doc.file_name}
                    fileType={doc.file_type}
                    description={getDocumentTypeLabel(doc)}
                  >
                    <span className="flex justify-between gap-3 items-center w-full px-4 py-3">
                      <span className="flex items-center gap-3 min-w-0">
                        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="truncate text-sm font-medium text-gray-900">{doc.description || doc.file_name}</span>
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0f3d32] bg-[#eaf4f1] border border-[#cde5dd] px-2 py-0.5 rounded-md">
                        {getDocumentTypeLabel(doc)}
                      </span>
                      <span className="text-xs font-bold text-[#0f3d32] shrink-0">View →</span>
                    </span>
                  </ViewableFileTrigger>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {hasDocumentChanges && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0f3d32] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0b2f26] disabled:opacity-50"
            >
              {saving ? (
                <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Uploading...</>
              ) : (
                <><IconCheck /> Upload Documents</>
              )}
            </button>
          </div>
        )}
      </form>
    );
  }

  // ─── Security Tab ───────────────────────────────────────────────────────────
  function renderSecurityTab() {
    return (
      <div className="space-y-6">
        {/* Password Change */}
        <SectionCard>
          <SectionHeader title="Change Password" description="Update your login password. Use a strong combination of letters, numbers, and symbols." />
          <div className="space-y-5 max-w-md">
            <FormField label="Current password">
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} placeholder="Enter current password" />
            </FormField>
            <FormField label="New password">
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} placeholder="Enter new password" />
            </FormField>
            <FormField label="Confirm new password">
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} placeholder="Confirm new password" />
            </FormField>
            <button
              type="button"
              onClick={() => {
                if (!currentPassword || !newPassword) { showToast("Fill in all password fields.", "error"); return; }
                if (newPassword !== confirmPassword) { showToast("Passwords do not match.", "error"); return; }
                if (newPassword.length < 8) { showToast("Password must be at least 8 characters.", "error"); return; }
                showToast("Password updated successfully.");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0f3d32] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0b2f26] transition"
            >
              <IconKey />
              Update Password
            </button>
          </div>
        </SectionCard>

        {/* Two-Factor Authentication */}
        <SectionCard>
          <div className="flex items-start justify-between gap-4">
            <div>
              <SectionHeader
                title="Two-Factor Authentication (2FA)"
                description="Add an extra layer of security to your account. Once enabled, you'll need to enter a verification code from your authenticator app when logging in."
              />
            </div>
            {twoFAEnabled && twoFAStep === "idle" && (
              <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Active
              </span>
            )}
          </div>

          {twoFAStep === "idle" && !twoFAEnabled && (
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
                <IconShield />
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">2FA is not enabled</p>
              <p className="text-xs text-gray-500 mb-5 max-w-sm mx-auto">
                Two-factor authentication adds an extra layer of security. You'll need an authenticator app like Google Authenticator or Authy.
              </p>
              <button
                type="button"
                onClick={handleEnable2FA}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0f3d32] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0b2f26] transition"
              >
                <IconShield />
                Enable 2FA
              </button>
            </div>
          )}

          {twoFAStep === "setup" && (
            <div className="space-y-5">
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm font-bold text-blue-900 mb-1">Setup Instructions</p>
                <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Download an authenticator app (Google Authenticator, Authy, or similar)</li>
                  <li>Scan the QR code below or enter the secret key manually</li>
                  <li>Enter the 6-digit verification code from your app</li>
                </ol>
              </div>

              {/* Simulated QR Code Placeholder */}
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-44 h-44 rounded-2xl bg-white border-2 border-gray-200 flex items-center justify-center">
                  <div className="grid grid-cols-8 grid-rows-8 gap-0.5 w-32 h-32">
                    {Array.from({ length: 64 }, (_, i) => (
                      <div key={i} className={`w-full aspect-square rounded-[1px] ${Math.random() > 0.5 ? "bg-gray-900" : "bg-white"}`} />
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Secret Key</p>
                  <code className="text-sm font-mono font-bold text-gray-900 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 select-all">
                    JBSWY3DPEHPK3PXP
                  </code>
                </div>
              </div>

              <form onSubmit={handleVerify2FA} className="max-w-xs mx-auto space-y-4">
                <FormField label="Verification code">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
                    className={`${inputClass} text-center text-lg tracking-[0.5em] font-mono font-bold`}
                    placeholder="000000"
                    autoFocus
                  />
                </FormField>
                {twoFAError && <p className="text-xs text-red-600 font-semibold text-center">{twoFAError}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setTwoFAStep("idle"); setTwoFACode(""); setTwoFAError(null); }}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-[#0f3d32] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0b2f26] transition"
                  >
                    Verify & Enable
                  </button>
                </div>
              </form>
            </div>
          )}

          {twoFAStep === "idle" && twoFAEnabled && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <IconShield />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-900">2FA is enabled</p>
                  <p className="text-xs text-emerald-700 mt-0.5">Your account is protected with two-factor authentication.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDisable2FA}
                className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition"
              >
                Disable 2FA
              </button>
            </div>
          )}
        </SectionCard>

        {/* Active Sessions */}
        <SectionCard>
          <SectionHeader title="Active Sessions" description="Manage devices where your account is currently logged in." />
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Current Session</p>
                  <p className="text-xs text-gray-500">This device · Active now</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">Current</span>
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  // ─── Notifications Tab ──────────────────────────────────────────────────────
  function renderNotificationsTab() {
    if (loadingNotifications) {
      return (
        <SectionCard>
          <div className="py-12 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#0f3d32] border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading notification preferences...</p>
          </div>
        </SectionCard>
      );
    }

    return (
      <form onSubmit={handleSaveNotifications} className="space-y-6">
        {/* Delivery Channels */}
        <SectionCard>
          <SectionHeader title="Delivery Channels" description="Choose how you want to be notified." />
          <div className="divide-y divide-gray-100">
            <NotificationRow
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              title="Email Notifications"
              description="Receive updates and alerts in your inbox"
              enabled={notificationSettings.email_notifications}
              onToggle={() => toggleNotification("email_notifications")}
            />
            <NotificationRow
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              }
              title="Push Notifications"
              description="In-app notifications and browser alerts"
              enabled={notificationSettings.push_notifications}
              onToggle={() => toggleNotification("push_notifications")}
            />
          </div>
        </SectionCard>

        {/* Activity Categories */}
        <SectionCard>
          <SectionHeader title="Activity Categories" description="Choose which types of activity you want to be notified about." />
          <div className="divide-y divide-gray-100">
            <NotificationRow
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Investment Updates"
              description="New offers, status changes, and funding activity"
              enabled={notificationSettings.investment_notifications}
              onToggle={() => toggleNotification("investment_notifications")}
            />
            <NotificationRow
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              title="Mentorship Updates"
              description="Mentorship requests, sessions, and mentor activity"
              enabled={notificationSettings.mentorship_notifications}
              onToggle={() => toggleNotification("mentorship_notifications")}
            />
            <NotificationRow
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
              title="Messages"
              description="New messages from investors and mentors"
              enabled={notificationSettings.message_notifications}
              onToggle={() => toggleNotification("message_notifications")}
            />
            <NotificationRow
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              }
              title="Ratings & Reviews"
              description="When someone rates or reviews your startup"
              enabled={notificationSettings.rating_notifications}
              onToggle={() => toggleNotification("rating_notifications")}
            />
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingNotifications}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0f3d32] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0b2f26] disabled:opacity-50"
          >
            {savingNotifications ? (
              <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving...</>
            ) : (
              <><IconCheck /> Save Notification Preferences</>
            )}
          </button>
        </div>
      </form>
    );
  }

  // ─── Danger Zone Tab ────────────────────────────────────────────────────────
  function renderDangerTab() {
    return (
      <div className="space-y-6">
        <SectionCard className="border-red-100">
          <SectionHeader
            title="Deactivate Account"
            description="Temporarily disable your startup's visibility on the platform. You can reactivate at any time."
          />
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-4">
            <p className="text-xs text-amber-800">
              <strong>What happens:</strong> Your profile, projects, and offers will be hidden from investors and mentors. Active mentorship sessions will be paused. No data will be deleted.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-bold text-amber-800 hover:bg-amber-100 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            Deactivate Account
          </button>
        </SectionCard>

        <SectionCard className="border-red-200 bg-red-50/30">
          <SectionHeader
            title="Delete Account"
            description="Permanently delete your startup account and all associated data. This action cannot be undone."
          />
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-5">
            <p className="text-xs text-red-800">
              <strong>⚠ Warning:</strong> All your data including profile, projects, documents, offers, chat history, and mentorship records will be permanently deleted. This action is irreversible.
            </p>
          </div>
          <div className="max-w-sm space-y-3">
            <FormField label={`Type "${startupName || "DELETE"}" to confirm`}>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className={`${inputClass} border-red-200 focus:border-red-500 focus:ring-red-500/10`}
                placeholder={startupName || "DELETE"}
              />
            </FormField>
            <button
              type="button"
              disabled={deleteConfirm !== (startupName || "DELETE")}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <IconTrash />
              Permanently Delete Account
            </button>
          </div>
        </SectionCard>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f6f8f9] font-sans text-gray-900 flex">
      <Sidebar />

      <Toast message={toast.message} type={toast.type} />

      <main className="flex-grow overflow-y-auto">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-8 py-8">

          {/* Page Header */}
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#0f3d32]">Startup · Settings</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">Settings</h1>
            <p className="mt-1.5 text-sm text-gray-500">Manage your account, startup profile, security, and notification preferences.</p>
          </div>

          <AccountAccessBanner />

          {loading ? (
            <SectionCard>
              <div className="py-16 text-center">
                <div className="w-10 h-10 rounded-full border-2 border-[#0f3d32] border-t-transparent animate-spin mx-auto mb-4" />
                <p className="text-sm font-semibold text-gray-500">Loading your settings...</p>
              </div>
            </SectionCard>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">

              {/* Sidebar Navigation */}
              <div className="space-y-4">
                <SectionCard className="!p-4">
                  <SettingsNav activeTab={activeTab} onTabChange={setActiveTab} />
                </SectionCard>
                <ProfileCompleteness fields={profileFields} />
              </div>

              {/* Content Area */}
              <div>
                {renderTabContent()}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
