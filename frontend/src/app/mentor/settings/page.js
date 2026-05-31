"use client";
import { useCallback, useEffect, useState } from "react";
import { fetchMentorDocument, fetchMentorProfile, updateMentorProfile } from "@/lib/mentorApi";
import { fetchPlatformCategories } from "@/lib/adminApi";
import { getCurrentAccount, updateCurrentAccount } from "@/lib/authApi";
import { clearSession } from "@/lib/authStorage";
import { useRouter } from "next/navigation";
import AccountAccessBanner from "@/components/auth/AccountAccessBanner";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fieldValue(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function Icon({ path, className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
    </svg>
  );
}

function IconUser() {
  return <Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />;
}
function IconBriefcase() {
  return <Icon path="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />;
}
function IconShield() {
  return <Icon path="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />;
}
function IconBell() {
  return <Icon path="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />;
}
function IconClock() {
  return <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />;
}
function IconTrash() {
  return <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />;
}
function IconCheck() {
  return <Icon path="M5 13l4 4L19 7" className="w-4 h-4" />;
}
function IconKey() {
  return <Icon path="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />;
}
function IconGlobe() {
  return <Icon path="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
}
function IconLinkedIn() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

// ─── Reusable UI Components ───────────────────────────────────────────────────
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
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
        {label}
      </label>
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
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
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-[#f0faf7] flex items-center justify-center text-[#0f3d32] shrink-0">
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
  if (type === "error") {
    return (
      <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        {message}
      </p>
    );
  }
  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-xl text-sm font-semibold transition-all animate-bounce-once ${
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

// ─── Tab Configuration ────────────────────────────────────────────────────────
const TABS = [
  { id: "profile",       label: "My Profile",       icon: <IconUser /> },
  { id: "expertise",     label: "Expertise",         icon: <IconBriefcase /> },
  { id: "availability",  label: "Availability",      icon: <IconClock /> },
  { id: "notifications", label: "Notifications",     icon: <IconBell /> },
  { id: "security",      label: "Security & 2FA",    icon: <IconShield /> },
  { id: "danger",        label: "Danger Zone",       icon: <IconTrash /> },
];

function SettingsNav({ activeTab, onTabChange }) {
  return (
    <nav className="space-y-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          id={`settings-tab-${tab.id}`}
          onClick={() => onTabChange(tab.id)}
          className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
            activeTab === tab.id
              ? "bg-[#061e16] text-white shadow-sm"
              : tab.id === "danger"
              ? "text-red-600 hover:bg-red-50"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <span className={activeTab === tab.id ? "text-[#10b981]" : ""}>
            {tab.icon}
          </span>
          {tab.label}
          {activeTab === tab.id && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#10b981]" />
          )}
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
        <div className={`h-full rounded-full ${barColor} transition-all duration-700`} style={{ width: `${pct}%` }} />
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

// ─── Constants ────────────────────────────────────────────────────────────────
const EXPERTISE_AREAS = [
  "Business Strategy", "Product Development", "Marketing & Growth",
  "Finance & Fundraising", "Technology & Engineering", "Operations & Scaling",
  "Legal & Compliance", "Sales & Business Development", "UI/UX Design",
  "Data & Analytics", "HR & Team Building", "Agri-tech", "Health Tech",
  "Fintech", "EdTech", "CleanTech", "E-commerce", "SaaS", "Supply Chain",
];

// Industries are loaded from platform categories so admin-managed values appear everywhere.


const LANGUAGES = [
  "Amharic", "English", "Oromo", "Tigrinya", "Somali", "Sidama",
  "Wolayta", "Afar", "Arabic", "French", "Swahili",
];

const TIMEZONES = [
  { value: "Africa/Addis_Ababa", label: "Addis Ababa (EAT, UTC+3)" },
  { value: "Africa/Nairobi",     label: "Nairobi (EAT, UTC+3)" },
  { value: "Africa/Cairo",       label: "Cairo (EET, UTC+2)" },
  { value: "Europe/London",      label: "London (GMT/BST)" },
  { value: "America/New_York",   label: "New York (EST/EDT)" },
  { value: "America/Los_Angeles",label: "Los Angeles (PST/PDT)" },
  { value: "Asia/Dubai",         label: "Dubai (GST, UTC+4)" },
];

const SESSION_DURATIONS = [
  { value: "30",  label: "30 minutes" },
  { value: "45",  label: "45 minutes" },
  { value: "60",  label: "1 hour" },
  { value: "90",  label: "1.5 hours" },
  { value: "120", label: "2 hours" },
];

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function MentorSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState({ message: null, type: null });

  // ── Profile state ──
  const [firstName,         setFirstName]         = useState("");
  const [lastName,          setLastName]           = useState("");
  const [email,             setEmail]             = useState("");
  const [originalEmail,     setOriginalEmail]     = useState("");
  const [emailVerified,     setEmailVerified]     = useState(true);
  const [phone,             setPhone]             = useState("");
  const [headline,          setHeadline]          = useState("");
  const [bio,               setBio]               = useState("");
  const [location,          setLocation]          = useState("");
  const [linkedin,          setLinkedin]          = useState("");
  const [website,           setWebsite]           = useState("");
  const [yearsExperience,   setYearsExperience]   = useState("");
  const [currentCompany,    setCurrentCompany]    = useState("");
  const [currentTitle,      setCurrentTitle]      = useState("");

  // ── Expertise state ──
  const [expertiseAreas,    setExpertiseAreas]    = useState([]);
  const [primaryIndustry,   setPrimaryIndustry]   = useState("");
  const [industries,        setIndustries]        = useState([]);
  const [spokenLanguages,   setSpokenLanguages]   = useState([]);
  const [mentorshipFocus,   setMentorshipFocus]   = useState("");
  const [sessionRate,       setSessionRate]       = useState("");
  const [maxStartups,       setMaxStartups]       = useState("");

  // ── Availability state ──
  const [timezone,          setTimezone]          = useState("Africa/Addis_Ababa");
  const [sessionDuration,   setSessionDuration]   = useState("60");
  const [availableDays,     setAvailableDays]     = useState(["Monday","Wednesday","Friday"]);
  const [availableFrom,     setAvailableFrom]     = useState("09:00");
  const [availableTo,       setAvailableTo]       = useState("17:00");
  const [acceptingMentees,  setAcceptingMentees]  = useState(true);

  // ── Notification state ──
  const [notifications, setNotifications] = useState({
    email_new_request:    true,
    email_session_remind: true,
    email_message:        true,
    email_report_due:     true,
    push_new_request:     true,
    push_session_remind:  true,
    push_message:         true,
    push_report_due:      false,
    weekly_digest:        true,
    monthly_summary:      false,
  });

  // ── Security state ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFAEnabled,    setTwoFAEnabled]    = useState(false);
  const [twoFAStep,       setTwoFAStep]       = useState("idle");
  const [twoFACode,       setTwoFACode]       = useState("");
  const [twoFAError,      setTwoFAError]      = useState(null);
  const [showCurrent,     setShowCurrent]     = useState(false);
  const [showNew,         setShowNew]         = useState(false);

  // ── Danger state ──
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    if (type !== "error") {
      setTimeout(() => setToast({ message: null, type: null }), 3500);
    }
  }, []);

  // ── Load profile data ──
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchMentorProfile()
      .then((data) => {
        if (!alive) return;
        const p = data?.profile || data?.mentor || data || {};
        setFirstName(fieldValue(p.first_name));
        setLastName(fieldValue(p.last_name));
        setEmail(fieldValue(p.email));
        setOriginalEmail(fieldValue(p.email));
        setEmailVerified(p.email_verified !== false);
        setPhone(fieldValue(p.phone_number || p.phone));
        setHeadline(fieldValue(p.headline || p.professional_title));
        setBio(fieldValue(p.bio || p.description));
        setLocation(fieldValue(p.location || p.city));
        setLinkedin(fieldValue(p.linkedin_url || p.linkedin));
        setWebsite(fieldValue(p.website));
        setYearsExperience(fieldValue(p.years_experience || p.experience_years));
        setCurrentCompany(fieldValue(p.current_company || p.company));
        setCurrentTitle(fieldValue(p.current_title || p.job_title));
        if (Array.isArray(p.expertise_areas)) setExpertiseAreas(p.expertise_areas);
        if (p.primary_industry) setPrimaryIndustry(p.primary_industry);
        if (Array.isArray(p.languages)) setSpokenLanguages(p.languages);
        if (p.mentorship_focus) setMentorshipFocus(p.mentorship_focus);
        if (p.session_rate)     setSessionRate(fieldValue(p.session_rate));
        if (p.max_startups)     setMaxStartups(fieldValue(p.max_startups));
        if (p.timezone)         setTimezone(p.timezone);
        if (p.session_duration) setSessionDuration(fieldValue(p.session_duration));
        if (Array.isArray(p.available_days)) setAvailableDays(p.available_days);
        if (p.available_from)   setAvailableFrom(p.available_from);
        if (p.available_to)     setAvailableTo(p.available_to);
        if (typeof p.accepting_mentees === "boolean") setAcceptingMentees(p.accepting_mentees);
        else if (typeof availability.accepting_mentees === "boolean") setAcceptingMentees(availability.accepting_mentees);
        else if (p.availability_preference) setAcceptingMentees(!/not|unavailable|closed/i.test(p.availability_preference));
      })
      .catch(async (err) => {
        if (!alive || err.code !== "EMAIL_NOT_VERIFIED") return;
        try {
          const account = await getCurrentAccount();
          if (!alive) return;
          const user = account.user || {};
          setFirstName(fieldValue(user.first_name));
          setLastName(fieldValue(user.last_name));
          setEmail(fieldValue(user.email));
          setOriginalEmail(fieldValue(user.email));
          setEmailVerified(user.email_verified !== false);
          setPhone(fieldValue(user.phone_number));
          showToast("Verify your email before using the rest of the platform. You can update it here if it is wrong.", "error");
        } catch (accountErr) {
          showToast(accountErr.message || "Unable to load account information.", "error");
        }
      })
      .finally(() => alive && setLoading(false));

    // load platform industries for selects
    (async () => {
      try {
        const cats = await fetchPlatformCategories("industry");
        const list = (cats?.categories || []).map((c) => c.name || c).filter(Boolean);
        setIndustries(list);
      } catch (e) {
        // ignore
      }
    })();
    return () => { alive = false; };
  }, []);

  // ── Save helpers ──
  async function saveProfile() {
    if (!firstName.trim() || !lastName.trim()) {
      showToast("First and last name are required.", "error");
      return;
    }
    if (!email.trim()) {
      showToast("Email is required.", "error");
      return;
    }
    setSaving(true);
    try {
      const emailChanged = email.trim().toLowerCase() !== originalEmail.trim().toLowerCase();
      if (!emailVerified || emailChanged) {
        const data = await updateCurrentAccount({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone_number: phone.trim(),
        });
        const user = data.user || {};
        setFirstName(fieldValue(user.first_name));
        setLastName(fieldValue(user.last_name));
        setEmail(fieldValue(user.email));
        setOriginalEmail(fieldValue(user.email));
        setEmailVerified(user.email_verified !== false);
        setPhone(fieldValue(user.phone_number));
        showToast(data.message || "Account information updated.");
        return;
      }
      const payload = {
        // user account fields
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        email: email.trim(),
        phone_number: phone.trim(),
        headline:   headline.trim(),
        bio:        bio.trim(),
        location:   location.trim(),
        linkedin_url: linkedin.trim(),
        website:    website.trim(),
        years_experience: yearsExperience,
        current_company:  currentCompany.trim(),
        current_title:    currentTitle.trim(),
        // expertise
        expertise_areas:   expertiseAreas,
        primary_industry:  primaryIndustry,
        languages:         spokenLanguages,
        mentorship_focus:  mentorshipFocus.trim(),
        session_rate:      sessionRate,
        max_startups:      maxStartups,
        // availability
        timezone,
        session_duration:  sessionDuration,
        available_days:    availableDays,
        available_from:    availableFrom,
        available_to:      availableTo,
        accepting_mentees: acceptingMentees,
      }
      showToast("Settings saved successfully.");
    } catch (err) {
      showToast(err.message || "Unable to save settings.", "error");
    } finally {
      setSaving(false);
    }
  }

  function toggleExpertise(area) {
    setExpertiseAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  function toggleLanguage(lang) {
    setSpokenLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  }

  function toggleDay(day) {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function toggleNotification(key) {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleVerify2FA(e) {
    e.preventDefault();
    if (twoFACode.length !== 6 || !/^\d{6}$/.test(twoFACode)) {
      setTwoFAError("Please enter a valid 6-digit code.");
      return;
    }
    setTwoFAEnabled(true);
    setTwoFAStep("idle");
    setTwoFACode("");
    setTwoFAError(null);
    showToast("Two-factor authentication enabled.");
  }

  // ─── Profile completeness fields ─────────────────────────────────────────
  const profileFields = [
    { label: "First Name",        value: firstName },
    { label: "Last Name",         value: lastName },
    { label: "Phone",             value: phone },
    { label: "Headline",          value: headline },
    { label: "Bio",               value: bio },
    { label: "Location",          value: location },
    { label: "LinkedIn",          value: linkedin },
    { label: "Current Company",   value: currentCompany },
    { label: "Current Title",     value: currentTitle },
    { label: "Years Experience",  value: yearsExperience },
    { label: "Primary Industry",  value: primaryIndustry },
    { label: "Mentorship Focus",  value: mentorshipFocus },
  ];

  // ─── Tab Renderers ────────────────────────────────────────────────────────

  // ── PROFILE TAB ──────────────────────────────────────────────────────────
  function renderProfileTab() {
    return (
      <div className="space-y-6">
        {/* Avatar Card */}
        <SectionCard>
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#061e16] to-[#0f3d32] flex items-center justify-center text-2xl font-black text-white shadow-lg">
                {[firstName, lastName].filter(Boolean).map((n) => n[0]).join("").toUpperCase() || "M"}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#10b981] flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
              </div>
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">
                {[firstName, lastName].filter(Boolean).join(" ") || "Your Name"}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">{headline || "Mentor"}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                  acceptingMentees
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-gray-50 text-gray-500 border border-gray-200"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${acceptingMentees ? "bg-emerald-500" : "bg-gray-400"}`} />
                  {acceptingMentees ? "Accepting mentees" : "Not accepting"}
                </span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Personal Info */}
        <SectionCard>
          <SectionHeader title="Personal Information" description="Your contact and identity information." />
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="First name">
                <input id="mentor-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} placeholder="Abebe" required />
              </FormField>
              <FormField label="Last name">
                <input id="mentor-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder="Bekele" required />
              </FormField>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Email"
                hint={emailVerified ? "Changing this email requires verification again." : "Use a real email you can access, then verify it from your inbox."}
              >
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
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
                <input id="mentor-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+251 9XX XXX XXX" />
              </FormField>
            </div>
            <FormField label="Location">
              <input id="mentor-location" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="e.g., Addis Ababa, Ethiopia" />
            </FormField>
          </div>
        </SectionCard>

        {/* Professional Profile */}
        <SectionCard>
          <SectionHeader title="Professional Profile" description="Help startups understand your background and expertise." />
          <div className="space-y-5">
            <FormField label="Professional headline" hint="Shown prominently on your mentor profile card.">
              <input
                id="mentor-headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className={inputClass}
                placeholder="e.g., Serial Entrepreneur | VC-backed Founder | 15+ Years in Fintech"
              />
            </FormField>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Current company">
                <input id="mentor-company" value={currentCompany} onChange={(e) => setCurrentCompany(e.target.value)} className={inputClass} placeholder="e.g., Safaricom Ethiopia" />
              </FormField>
              <FormField label="Current title / role">
                <input id="mentor-title" value={currentTitle} onChange={(e) => setCurrentTitle(e.target.value)} className={inputClass} placeholder="e.g., CEO, VP of Product" />
              </FormField>
            </div>
            <FormField label="Years of experience">
              <input id="mentor-experience" type="number" min="0" max="60" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} className={inputClass} placeholder="e.g., 12" />
            </FormField>
            <FormField label="Bio" hint="Write a compelling mentor bio. 150–300 words is ideal.">
              <textarea
                id="mentor-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                className={inputClass}
                placeholder="Tell startups about your journey, your successes, and how you can help them grow..."
              />
            </FormField>
          </div>
        </SectionCard>

        {/* Social & Links */}
        <SectionCard>
          <SectionHeader title="Social & Links" description="Connect your professional profiles." />
          <div className="space-y-4">
            <FormField label="LinkedIn URL">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#0a66c2]">
                  <IconLinkedIn />
                </div>
                <input id="mentor-linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className={`${inputClass} pl-12`} placeholder="https://linkedin.com/in/your-profile" />
              </div>
            </FormField>
            <FormField label="Personal website or portfolio">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                  <IconGlobe />
                </div>
                <input id="mentor-website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={`${inputClass} pl-12`} placeholder="https://yourwebsite.com" />
              </div>
            </FormField>
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <button
            type="button"
            id="save-profile-btn"
            onClick={saveProfile}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0f3d32] px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#061e16] disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <IconCheck />
                Save Profile
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── EXPERTISE TAB ─────────────────────────────────────────────────────────
  function renderExpertiseTab() {
    return (
      <div className="space-y-6">
        <SectionCard>
          <SectionHeader title="Areas of Expertise" description="Select all the areas where you can guide startups. This helps match you with the right mentees." />
          <div className="flex flex-wrap gap-2">
            {EXPERTISE_AREAS.map((area) => {
              const selected = expertiseAreas.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  id={`expertise-${area.replace(/\s+/g, "-").toLowerCase()}`}
                  onClick={() => toggleExpertise(area)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all border ${
                    selected
                      ? "bg-[#061e16] text-white border-[#061e16] shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#0f3d32] hover:text-[#0f3d32]"
                  }`}
                >
                  {selected && <span className="mr-1.5">✓</span>}
                  {area}
                </button>
              );
            })}
          </div>
          {expertiseAreas.length > 0 && (
            <p className="mt-4 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
              ✓ {expertiseAreas.length} area{expertiseAreas.length !== 1 ? "s" : ""} selected
            </p>
          )}
        </SectionCard>

        <SectionCard>
          <SectionHeader title="Industry Focus" description="Your primary industry focus helps startups find the right mentor." />
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              label="Primary industry"
              value={primaryIndustry}
              onChange={(e) => setPrimaryIndustry(e.target.value)}
              options={industries}
              placeholder="Select primary industry"
            />
            <FormField label="Mentorship focus statement" hint="A one-liner about your unique mentorship style.">
              <input
                id="mentor-focus"
                value={mentorshipFocus}
                onChange={(e) => setMentorshipFocus(e.target.value)}
                className={inputClass}
                placeholder="e.g., Helping early-stage startups find product-market fit"
              />
            </FormField>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader title="Languages" description="Languages you can mentor in." />
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => {
              const selected = spokenLanguages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  id={`language-${lang.toLowerCase()}`}
                  onClick={() => toggleLanguage(lang)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all border ${
                    selected
                      ? "bg-[#061e16] text-white border-[#061e16]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#0f3d32] hover:text-[#0f3d32]"
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader title="Mentorship Capacity" description="Manage your workload and pricing." />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Max active startups" hint="Maximum startups you can mentor at once.">
              <input
                id="mentor-max-startups"
                type="number"
                min="1"
                max="20"
                value={maxStartups}
                onChange={(e) => setMaxStartups(e.target.value)}
                className={inputClass}
                placeholder="e.g., 5"
              />
            </FormField>
            <FormField label="Session rate (ETB)" hint="Leave blank if you mentor for free.">
              <input
                id="mentor-session-rate"
                type="number"
                min="0"
                value={sessionRate}
                onChange={(e) => setSessionRate(e.target.value)}
                className={inputClass}
                placeholder="e.g., 500"
              />
            </FormField>
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <button
            type="button"
            id="save-expertise-btn"
            onClick={saveProfile}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0f3d32] px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#061e16] disabled:opacity-50"
          >
            {saving ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving...</> : <><IconCheck /> Save Expertise</>}
          </button>
        </div>
      </div>
    );
  }

  // ── AVAILABILITY TAB ──────────────────────────────────────────────────────
  function renderAvailabilityTab() {
    return (
      <div className="space-y-6">
        {/* Accepting mentees toggle */}
        <SectionCard>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Accepting New Mentees</h2>
              <p className="text-sm text-gray-500 mt-1">
                When turned off, you won't appear in search results and startups cannot send you new requests.
              </p>
            </div>
            <ToggleSwitch enabled={acceptingMentees} onToggle={() => setAcceptingMentees((v) => !v)} />
          </div>
          {!acceptingMentees && (
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs font-semibold text-amber-800">
              ⚠ You are currently not accepting new mentorship requests.
            </div>
          )}
        </SectionCard>

        {/* Time settings */}
        <SectionCard>
          <SectionHeader title="Schedule & Timezone" description="Set your working hours so startups know when to book sessions." />
          <div className="space-y-5">
            <SelectField
              label="Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              options={TIMEZONES}
              placeholder="Select timezone"
            />
            <SelectField
              label="Default session duration"
              value={sessionDuration}
              onChange={(e) => setSessionDuration(e.target.value)}
              options={SESSION_DURATIONS}
              placeholder="Select duration"
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Available from">
                <input
                  id="available-from"
                  type="time"
                  value={availableFrom}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                  className={inputClass}
                />
              </FormField>
              <FormField label="Available until">
                <input
                  id="available-to"
                  type="time"
                  value={availableTo}
                  onChange={(e) => setAvailableTo(e.target.value)}
                  className={inputClass}
                />
              </FormField>
            </div>
          </div>
        </SectionCard>

        {/* Available days */}
        <SectionCard>
          <SectionHeader title="Available Days" description="Select the days of the week you are available for sessions." />
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day) => {
              const selected = availableDays.includes(day);
              const short    = day.slice(0, 3);
              return (
                <button
                  key={day}
                  type="button"
                  id={`day-${day.toLowerCase()}`}
                  onClick={() => toggleDay(day)}
                  className={`flex flex-col items-center rounded-xl py-3 px-1 text-xs font-bold transition-all border ${
                    selected
                      ? "bg-[#061e16] text-white border-[#061e16] shadow-sm"
                      : "bg-white text-gray-500 border-gray-200 hover:border-[#0f3d32] hover:text-[#0f3d32]"
                  }`}
                >
                  <span className="text-[10px] opacity-60 mb-0.5">{short.slice(0, 1)}</span>
                  <span>{short}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            {availableDays.length} day{availableDays.length !== 1 ? "s" : ""} selected: {availableDays.join(", ")}
          </p>
        </SectionCard>

        <div className="flex justify-end">
          <button
            type="button"
            id="save-availability-btn"
            onClick={saveProfile}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0f3d32] px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#061e16] disabled:opacity-50"
          >
            {saving ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving...</> : <><IconCheck /> Save Availability</>}
          </button>
        </div>
      </div>
    );
  }

  // ── NOTIFICATIONS TAB ─────────────────────────────────────────────────────
  function renderNotificationsTab() {
    const emailNotifs = [
      { key: "email_new_request",    title: "New Mentorship Request",    description: "Receive email when a startup sends you a mentorship request." },
      { key: "email_session_remind", title: "Session Reminders",         description: "Get reminded 1 hour before a scheduled session." },
      { key: "email_message",        title: "New Messages",              description: "Email alert when you receive a new chat message." },
      { key: "email_report_due",     title: "Report Due Alerts",         description: "Be notified when a progress report is due." },
    ];
    const pushNotifs = [
      { key: "push_new_request",     title: "Push: New Request",         description: "Instant push notification for new mentorship requests." },
      { key: "push_session_remind",  title: "Push: Session Reminder",    description: "Push notification 15 minutes before a session starts." },
      { key: "push_message",         title: "Push: Messages",            description: "Real-time notification for new messages." },
      { key: "push_report_due",      title: "Push: Report Due",          description: "Push alert when a report submission deadline is near." },
    ];
    const digestNotifs = [
      { key: "weekly_digest",        title: "Weekly Digest",             description: "A weekly summary of your mentorship activity." },
      { key: "monthly_summary",      title: "Monthly Summary",           description: "Monthly analytics and impact report to your email." },
    ];

    return (
      <div className="space-y-6">
        <SectionCard>
          <SectionHeader title="Email Notifications" description="Control which emails you receive from StartupConnect." />
          <div className="divide-y divide-gray-50">
            {emailNotifs.map(({ key, title, description }) => (
              <NotificationRow
                key={key}
                icon={<IconBell />}
                title={title}
                description={description}
                enabled={notifications[key]}
                onToggle={() => toggleNotification(key)}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader title="Push Notifications" description="Manage browser and mobile push alerts." />
          <div className="divide-y divide-gray-50">
            {pushNotifs.map(({ key, title, description }) => (
              <NotificationRow
                key={key}
                icon={<IconBell />}
                title={title}
                description={description}
                enabled={notifications[key]}
                onToggle={() => toggleNotification(key)}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader title="Digest & Reports" description="Periodic summaries of your mentorship activity." />
          <div className="divide-y divide-gray-50">
            {digestNotifs.map(({ key, title, description }) => (
              <NotificationRow
                key={key}
                icon={<IconBell />}
                title={title}
                description={description}
                enabled={notifications[key]}
                onToggle={() => toggleNotification(key)}
              />
            ))}
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <button
            type="button"
            id="save-notifications-btn"
            onClick={() => showToast("Notification preferences saved.")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0f3d32] px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#061e16]"
          >
            <IconCheck />
            Save Preferences
          </button>
        </div>
      </div>
    );
  }

  // ── SECURITY TAB ──────────────────────────────────────────────────────────
  function renderSecurityTab() {
    const passwordStrength = () => {
      if (!newPassword) return null;
      const score = [newPassword.length >= 8, /[A-Z]/.test(newPassword), /[0-9]/.test(newPassword), /[^A-Za-z0-9]/.test(newPassword)].filter(Boolean).length;
      if (score <= 1) return { label: "Weak",   color: "bg-red-500",   w: "w-1/4" };
      if (score === 2) return { label: "Fair",   color: "bg-amber-500", w: "w-2/4" };
      if (score === 3) return { label: "Good",   color: "bg-blue-500",  w: "w-3/4" };
      return               { label: "Strong",  color: "bg-emerald-500", w: "w-full" };
    };
    const strength = passwordStrength();

    return (
      <div className="space-y-6">
        {/* Password */}
        <SectionCard>
          <SectionHeader title="Change Password" description="Use a strong password with a mix of letters, numbers and symbols." />
          <div className="space-y-4 max-w-md">
            <FormField label="Current password">
              <div className="relative">
                <input
                  id="current-password"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`${inputClass} pr-11`}
                  placeholder="Enter current password"
                />
                <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-gray-600">
                  {showCurrent
                    ? <Icon path="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" className="w-4 h-4" />
                    : <Icon path="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" className="w-4 h-4" />
                  }
                </button>
              </div>
            </FormField>
            <FormField label="New password">
              <div className="relative">
                <input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inputClass} pr-11`}
                  placeholder="Enter new password"
                />
                <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-gray-600">
                  {showNew
                    ? <Icon path="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" className="w-4 h-4" />
                    : <Icon path="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" className="w-4 h-4" />
                  }
                </button>
              </div>
              {strength && (
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${strength.color} ${strength.w}`} />
                  </div>
                  <p className="text-xs font-semibold mt-1" style={{ color: strength.color.replace("bg-", "").replace("-500","") }}>
                    Password strength: {strength.label}
                  </p>
                </div>
              )}
            </FormField>
            <FormField label="Confirm new password">
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`${inputClass} ${confirmPassword && confirmPassword !== newPassword ? "border-red-300 focus:border-red-400" : ""}`}
                placeholder="Repeat new password"
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-red-600 font-semibold mt-1.5">Passwords do not match.</p>
              )}
            </FormField>
            <button
              type="button"
              id="update-password-btn"
              onClick={() => {
                if (!currentPassword || !newPassword) { showToast("Fill in all password fields.", "error"); return; }
                if (newPassword !== confirmPassword)  { showToast("Passwords do not match.", "error"); return; }
                if (newPassword.length < 8)           { showToast("Password must be at least 8 characters.", "error"); return; }
                showToast("Password updated successfully.");
                setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0f3d32] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#061e16] transition"
            >
              <IconKey />
              Update Password
            </button>
          </div>
        </SectionCard>

        {/* 2FA */}
        <SectionCard>
          <div className="flex items-start justify-between gap-4">
            <SectionHeader
              title="Two-Factor Authentication (2FA)"
              description="Protect your account with an extra verification step using an authenticator app."
            />
            {twoFAEnabled && twoFAStep === "idle" && (
              <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            )}
          </div>

          {twoFAStep === "idle" && !twoFAEnabled && (
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4 text-amber-600">
                <IconShield />
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">2FA is not enabled</p>
              <p className="text-xs text-gray-500 mb-5 max-w-sm mx-auto">
                Two-factor authentication adds a strong layer of security. Download Google Authenticator or Authy to get started.
              </p>
              <button
                type="button"
                id="enable-2fa-btn"
                onClick={() => { setTwoFAStep("setup"); setTwoFACode(""); setTwoFAError(null); }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0f3d32] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#061e16] transition"
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
                  <li>Download Google Authenticator, Authy, or a similar app</li>
                  <li>Scan the QR code below or enter the secret key manually</li>
                  <li>Enter the 6-digit code shown in your app</li>
                </ol>
              </div>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-44 h-44 rounded-2xl bg-white border-2 border-gray-200 flex items-center justify-center p-3">
                  <div className="grid grid-cols-8 grid-rows-8 gap-0.5 w-full h-full">
                    {Array.from({ length: 64 }, (_, i) => (
                      <div key={i} className={`w-full aspect-square rounded-[1px] ${[0,8,16,7,15,23,56,57,58,59,60,61,62,63,48,40,32,24].includes(i) || Math.random() > 0.6 ? "bg-gray-900" : "bg-white"}`} />
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
                <FormField label="6-digit verification code">
                  <input
                    id="two-fa-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
                    className={`${inputClass} text-center text-xl tracking-[0.5em] font-mono font-bold`}
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
                  <button type="submit" className="flex-1 rounded-xl bg-[#0f3d32] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#061e16] transition">
                    Verify & Enable
                  </button>
                </div>
              </form>
            </div>
          )}

          {twoFAStep === "idle" && twoFAEnabled && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <IconShield />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-900">2FA is enabled</p>
                  <p className="text-xs text-emerald-700 mt-0.5">Your account is protected with two-factor authentication.</p>
                </div>
              </div>
              <button
                type="button"
                id="disable-2fa-btn"
                onClick={() => { setTwoFAEnabled(false); setTwoFAStep("idle"); showToast("Two-factor authentication disabled."); }}
                className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition"
              >
                Disable 2FA
              </button>
            </div>
          )}
        </SectionCard>

        {/* Active Sessions */}
        <SectionCard>
          <SectionHeader title="Active Sessions" description="Devices where your account is currently logged in." />
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
                  PC
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Chrome on Windows</p>
                  <p className="text-xs text-gray-500">Current session • Addis Ababa, ET</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">Current</span>
            </div>
          </div>
          <button
            type="button"
            id="sign-out-all-btn"
            onClick={() => showToast("All other sessions have been signed out.")}
            className="mt-4 text-xs font-bold text-red-600 hover:text-red-800 transition"
          >
            Sign out of all other sessions →
          </button>
        </SectionCard>
      </div>
    );
  }

  // ── DANGER ZONE TAB ───────────────────────────────────────────────────────
  function renderDangerTab() {
    return (
      <div className="space-y-6">
        {/* Deactivate */}
        <SectionCard className="border-amber-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 mb-1">Pause Mentorship Activity</h3>
              <p className="text-sm text-gray-500 mb-4">
                Temporarily pause your mentor account. You won't appear in search results, and no new requests can be sent to you. Your existing mentorships remain active.
              </p>
              <button
                type="button"
                id="pause-account-btn"
                onClick={() => showToast("Your mentor account has been paused.", "error")}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-bold text-amber-800 hover:bg-amber-100 transition"
              >
                Pause Account
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Export data */}
        <SectionCard>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 mb-1">Export My Data</h3>
              <p className="text-sm text-gray-500 mb-4">
                Download all your mentor profile data, session history, and mentorship records as a JSON file.
              </p>
              <button
                type="button"
                id="export-data-btn"
                onClick={() => showToast("Your data export is being prepared. You'll receive an email shortly.")}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-bold text-blue-800 hover:bg-blue-100 transition"
              >
                Request Data Export
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Delete account */}
        <SectionCard className="border-red-200 bg-red-50/30">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0 mt-0.5">
              <IconTrash />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-red-700 mb-1">Delete Mentor Account</h3>
              <p className="text-sm text-gray-600 mb-5">
                This permanently deletes your mentor account, profile, all session history, reports, and mentorship data.
                <strong className="text-red-700"> This action cannot be undone.</strong>
              </p>

              <div className="rounded-xl bg-white border border-red-200 p-5 space-y-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Type <span className="text-red-600 font-black">DELETE MY ACCOUNT</span> to confirm
                </p>
                <input
                  id="delete-confirm-input"
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className={`${inputClass} border-red-200 focus:border-red-400`}
                  placeholder="DELETE MY ACCOUNT"
                />
                <button
                  type="button"
                  id="delete-account-btn"
                  disabled={deleteConfirm !== "DELETE MY ACCOUNT"}
                  onClick={() => {
                    clearSession();
                    router.push("/login");
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <IconTrash />
                  Permanently Delete Account
                </button>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  function renderTabContent() {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#0f3d32] border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading your settings...</p>
        </div>
      );
    }
    switch (activeTab) {
      case "profile":       return renderProfileTab();
      case "expertise":     return renderExpertiseTab();
      case "availability":  return renderAvailabilityTab();
      case "notifications": return renderNotificationsTab();
      case "security":      return renderSecurityTab();
      case "danger":        return renderDangerTab();
      default:              return null;
    }
  }

  const currentTabLabel = TABS.find((t) => t.id === activeTab)?.label || "Settings";

  return (
    <div className="min-h-full bg-[#f8fafc] text-[#061f1a]">
      {/* Toast */}
      <Toast {...toast} />

      {/* Top bar */}
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-gray-100 bg-white px-5 sm:px-8 shadow-sm">
        <div>
          <h1 className="text-lg font-black text-[#052b23] tracking-tight">Settings</h1>
          <p className="text-xs font-medium text-gray-400 mt-0.5">Manage your mentor profile and preferences</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Breadcrumb badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#f0faf7] border border-[#c6e8dc] text-[#0f3d32] text-xs font-bold px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            {currentTabLabel}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1120px] px-5 py-8 lg:px-8">
        <AccountAccessBanner />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">

          {/* Sidebar Nav */}
          <aside className="lg:sticky lg:top-[88px] lg:self-start">
            {/* Profile completeness */}
            <div className="mb-6">
              <ProfileCompleteness fields={profileFields} />
            </div>

            {/* Settings Nav */}
            <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 py-2">Navigation</p>
              <SettingsNav activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {/* Quick tip */}
            <div className="mt-4 rounded-xl border-l-2 border-[#0f3d32] bg-[#f0faf7] p-4">
              <p className="text-[10px] font-black text-[#0f3d32] uppercase tracking-widest mb-1">Mentor Tip</p>
              <p className="text-xs text-[#0a3026] leading-relaxed">
                Mentors with complete profiles receive <strong>3x more</strong> mentorship requests.
              </p>
            </div>
          </aside>

          {/* Main content */}
          <div className="min-w-0">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
