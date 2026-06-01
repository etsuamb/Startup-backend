"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/investor/Sidebar";
import AccountAccessBanner from "@/components/auth/AccountAccessBanner";
import AccountSecurityPanel from "@/components/auth/AccountSecurityPanel";
import { IndustrySelectWithOther } from "@/components/register/IndustryFields";
import { getCurrentAccount, updateCurrentAccount } from "@/lib/authApi";
import {
  changeInvestorPassword,
  getInvestorSettings,
  updateInvestorSettings,
} from "@/lib/investorApi";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-4 py-3 text-sm outline-none transition-colors focus:border-[#0f3d32] focus:bg-white focus:ring-2 focus:ring-[#0f3d32]/10";

const TABS = [
  { id: "account", label: "Account", icon: <IconUser /> },
  { id: "profile", label: "Investor Profile", icon: <IconBuilding /> },
  { id: "security", label: "Security & 2FA", icon: <IconShield /> },
  { id: "notifications", label: "Notifications", icon: <IconBell /> },
  { id: "danger", label: "Danger Zone", icon: <IconTrash /> },
];

const INVESTOR_TYPES = [
  "Individual",
  "Angel Investor",
  "Venture Capital",
  "Investment Company",
  "Corporate Investor",
  "Diaspora",
  "Family Office",
  "Private Equity",
];

const STAGES = ["Idea Stage", "Pre-Seed", "Seed", "Early Growth"];

function valueOf(value) {
  return value === null || value === undefined ? "" : String(value);
}

function splitFullName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return { first_name: parts[0] || "", last_name: parts.slice(1).join(" ") || "" };
}

function SectionCard({ children, className = "" }) {
  return <section className={`rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8 ${className}`}>{children}</section>;
}

function SectionHeader({ title, description }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
    </div>
  );
}

function FormField({ label, hint, children }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">{label}</label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-gray-400">{hint}</p> : null}
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <FormField label={label}>
      <select value={value} onChange={onChange} className={`${inputClass} appearance-none`}>
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </FormField>
  );
}

function SettingsNav({ activeTab, onTabChange }) {
  return (
    <nav className="space-y-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
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

function ProfileCompleteness({ fields }) {
  const filled = fields.filter((field) => String(field.value || "").trim()).length;
  const percentage = Math.round((filled / fields.length) * 100);
  const missing = fields.filter((field) => !String(field.value || "").trim());
  return (
    <SectionCard className="!p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Profile Completeness</h3>
        <span className="text-sm font-black text-emerald-600">{percentage}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${percentage}%` }} />
      </div>
      {missing.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {missing.slice(0, 6).map((field) => (
            <span key={field.label} className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-1 text-[11px] text-gray-500">{field.label}</span>
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}

function ToggleSwitch({ enabled, onToggle }) {
  return (
    <button type="button" onClick={onToggle} aria-pressed={enabled} className={`relative h-6 w-11 rounded-full transition ${enabled ? "bg-[#0f3d32]" : "bg-gray-200"}`}>
      <span className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function SaveButton({ saving, label = "Save Changes" }) {
  return (
    <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#0f3d32] px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#061e16] disabled:opacity-50">
      <IconCheck />
      {saving ? "Saving..." : label}
    </button>
  );
}

function IconBase({ children }) {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{children}</svg>;
}
function IconUser() { return <IconBase><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></IconBase>; }
function IconBuilding() { return <IconBase><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 21h18M5 21V5l7-3 7 3v16M9 9h.01M15 9h.01M9 13h.01M15 13h.01M10 21v-4h4v4" /></IconBase>; }
function IconShield() { return <IconBase><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3l7 3v5c0 4.4-2.9 8.4-7 10-4.1-1.6-7-5.6-7-10V6l7-3z" /></IconBase>; }
function IconBell() { return <IconBase><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" /></IconBase>; }
function IconTrash() { return <IconBase><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.9 12.1A2 2 0 0116.1 21H7.9a2 2 0 01-2-1.9L5 7m5 4v6m4-6v6m1-10V4H9v3M4 7h16" /></IconBase>; }
function IconCheck() { return <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>; }

export default function InvestorSettingsPage() {
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(true);
  const [isApproved, setIsApproved] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [investorType, setInvestorType] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [preferredIndustry, setPreferredIndustry] = useState("");
  const [investmentStage, setInvestmentStage] = useState("");
  const [investmentBudget, setInvestmentBudget] = useState("");
  const [locationPreference, setLocationPreference] = useState("");
  const [linkedInOrWebsite, setLinkedInOrWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [notifications, setNotifications] = useState({ opportunities: true, offers: true, messages: true, reports: false });

  const applySettings = useCallback((settings = {}) => {
    setFullName([valueOf(settings.first_name), valueOf(settings.last_name)].filter(Boolean).join(" "));
    setEmail(valueOf(settings.email));
    setOriginalEmail(valueOf(settings.email));
    setEmailVerified(settings.email_verified !== false);
    setIsApproved(settings.user_is_approved !== false && settings.is_approved !== false);
    setPhoneNumber(valueOf(settings.phone_number));
    setInvestorType(valueOf(settings.investor_type));
    setOrganizationName(valueOf(settings.organization_name));
    setPreferredIndustry(valueOf(settings.preferred_industry));
    setInvestmentStage(valueOf(settings.investment_stage));
    setInvestmentBudget(valueOf(settings.investment_budget));
    setLocationPreference(valueOf(settings.location_preference));
    setLinkedInOrWebsite(valueOf(settings.linked_in_or_website));
    setBio(valueOf(settings.bio));
  }, []);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getInvestorSettings();
      applySettings(data.settings || data.investor);
    } catch (err) {
      if (err.code === "EMAIL_NOT_VERIFIED" || err.code === "ACCOUNT_PENDING_APPROVAL") {
        try {
          const account = await getCurrentAccount();
          applySettings(account.user);
          setError(err.message);
        } catch (accountErr) {
          setError(accountErr.message || "Unable to load account details.");
        }
      } else {
        setError(err.message || "Unable to load investor settings.");
      }
    } finally {
      setLoading(false);
    }
  }, [applySettings]);

  useEffect(() => {
    queueMicrotask(loadSettings);
  }, [loadSettings]);

  const profileFields = useMemo(() => [
    { label: "Full Name", value: fullName },
    { label: "Phone", value: phoneNumber },
    { label: "Investor Type", value: investorType },
    { label: "Industry", value: preferredIndustry },
    { label: "Stage", value: investmentStage },
    { label: "Budget", value: investmentBudget },
    { label: "Location", value: locationPreference },
    { label: "Bio", value: bio },
  ], [bio, fullName, investmentBudget, investmentStage, investorType, locationPreference, phoneNumber, preferredIndustry]);

  function showMessage(text) {
    setMessage(text);
    setTimeout(() => setMessage(""), 3500);
  }

  async function saveAccount(event) {
    event.preventDefault();
    setError("");
    const names = splitFullName(fullName);
    if (!names.first_name || !names.last_name || !email.trim()) return setError("Enter your first name, last name, and email.");
    setSaving(true);
    try {
      const data = await updateCurrentAccount({ ...names, email: email.trim(), phone_number: phoneNumber.trim() });
      applySettings({ ...data.user, investor_type: investorType, organization_name: organizationName, preferred_industry: preferredIndustry, investment_stage: investmentStage, investment_budget: investmentBudget, location_preference: locationPreference, linked_in_or_website: linkedInOrWebsite, bio });
      showMessage(data.message || "Account details updated.");
    } catch (err) {
      setError(err.message || "Unable to update account details.");
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    if (!emailVerified || !isApproved) return setError("Verify your email and wait for approval before updating investor preferences.");
    setSaving(true);
    try {
      const names = splitFullName(fullName);
      const data = await updateInvestorSettings({
        ...names, email: email.trim(), phone_number: phoneNumber.trim(), investor_type: investorType.trim(),
        organization_name: organizationName.trim(), preferred_industry: preferredIndustry.trim(),
        investment_stage: investmentStage.trim(), investment_budget: investmentBudget.trim(),
        location_preference: locationPreference.trim(), linked_in_or_website: linkedInOrWebsite.trim(), bio: bio.trim(),
      });
      applySettings(data.settings || data.investor);
      showMessage(data.message || "Investor profile updated.");
    } catch (err) {
      setError(err.message || "Unable to update investor profile.");
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const data = await changeInvestorPassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      showMessage(data.message || "Password updated.");
    } catch (err) {
      setError(err.message || "Unable to update password.");
    } finally {
      setSaving(false);
    }
  }

  function renderTab() {
    if (activeTab === "account") return (
      <form onSubmit={saveAccount} className="space-y-6">
        <SectionCard>
          <SectionHeader title="Account Information" description="Manage your personal contact and sign-in details." />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Full name"><input value={fullName} onChange={(event) => setFullName(event.target.value)} className={inputClass} /></FormField>
            <FormField label="Phone number"><input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className={inputClass} /></FormField>
            <FormField label="Email" hint="Changing your email requires verification again."><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} /></FormField>
          </div>
        </SectionCard>
        <div className="flex justify-end"><SaveButton saving={saving} label="Save Account" /></div>
      </form>
    );
    if (activeTab === "profile") return (
      <form onSubmit={saveProfile} className="space-y-6">
        <SectionCard>
          <SectionHeader title="Investor Profile" description="Tell founders what kind of investments you are looking for." />
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField label="Investor type" value={investorType} onChange={(event) => setInvestorType(event.target.value)} options={INVESTOR_TYPES} placeholder="Select investor type" />
            <FormField label="Organization"><input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} className={inputClass} /></FormField>
            <IndustrySelectWithOther label="Preferred industry" value={preferredIndustry} onChange={setPreferredIndustry} labelClassName="block text-xs font-bold uppercase tracking-wider text-gray-500" selectClassName={`${inputClass} mt-2 appearance-none normal-case tracking-normal`} inputClassName={`${inputClass} mt-3 normal-case tracking-normal`} />
            <SelectField label="Preferred startup stage" value={investmentStage} onChange={(event) => setInvestmentStage(event.target.value)} options={STAGES} placeholder="Select startup stage" />
            <FormField label="Investment budget"><input type="number" min="0" value={investmentBudget} onChange={(event) => setInvestmentBudget(event.target.value)} className={inputClass} /></FormField>
            <FormField label="Preferred location"><input value={locationPreference} onChange={(event) => setLocationPreference(event.target.value)} className={inputClass} /></FormField>
            <FormField label="LinkedIn or website"><input value={linkedInOrWebsite} onChange={(event) => setLinkedInOrWebsite(event.target.value)} className={inputClass} /></FormField>
            <div className="sm:col-span-2"><FormField label="Bio"><textarea rows={5} value={bio} onChange={(event) => setBio(event.target.value)} className={inputClass} /></FormField></div>
          </div>
        </SectionCard>
        <div className="flex justify-end"><SaveButton saving={saving} label="Save Investor Profile" /></div>
      </form>
    );
    if (activeTab === "security") return (
      <div className="space-y-6">
        <SectionCard><SectionHeader title="Two-Factor Authentication" description="Protect your investor account with an additional verification step." /><AccountSecurityPanel /></SectionCard>
        <form onSubmit={savePassword}><SectionCard><SectionHeader title="Change Password" description="Use a strong password with a capital letter, number, and special character." /><div className="grid gap-5 sm:grid-cols-2"><FormField label="Current password"><input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={inputClass} /></FormField><FormField label="New password"><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={inputClass} /></FormField></div><div className="mt-6 flex justify-end"><SaveButton saving={saving} label="Update Password" /></div></SectionCard></form>
      </div>
    );
    if (activeTab === "notifications") return (
      <SectionCard>
        <SectionHeader title="Notification Preferences" description="Choose the investor activity you want to follow." />
        {[["opportunities", "Startup opportunities"], ["offers", "Funding offer updates"], ["messages", "New messages"], ["reports", "Portfolio reports"]].map(([key, label]) => <div key={key} className="flex items-center justify-between border-b border-gray-100 py-4 last:border-0"><span className="text-sm font-semibold text-gray-800">{label}</span><ToggleSwitch enabled={notifications[key]} onToggle={() => setNotifications((current) => ({ ...current, [key]: !current[key] }))} /></div>)}
        <p className="mt-4 text-xs text-gray-400">These display preferences are stored for this session. Account notifications continue to follow platform events.</p>
      </SectionCard>
    );
    return (
      <SectionCard className="border-red-200 bg-red-50/30">
        <SectionHeader title="Danger Zone" description="Sensitive investor-account actions belong here." />
        <p className="text-sm text-gray-600">Contact support to pause or permanently remove your investor account and associated portfolio records.</p>
      </SectionCard>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f6f8f9] font-sans text-gray-900">
      <Sidebar />
      {message ? <div className="fixed right-5 top-5 z-50 rounded-xl bg-[#0f3d32] px-5 py-3 text-sm font-semibold text-white shadow-lg">{message}</div> : null}
      <main className="flex-grow overflow-y-auto">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8">
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#0f3d32]">Investor · Settings</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">Settings</h1>
            <p className="mt-1.5 text-sm text-gray-500">Manage your account, investor profile, security, and notification preferences.</p>
          </div>
          <AccountAccessBanner />
          {error ? <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
          {loading ? <SectionCard><p className="py-16 text-center text-sm font-semibold text-gray-500">Loading your settings...</p></SectionCard> : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
              <aside className="space-y-4">
                <SectionCard className="!p-4"><SettingsNav activeTab={activeTab} onTabChange={setActiveTab} /></SectionCard>
                <ProfileCompleteness fields={profileFields} />
              </aside>
              <div>{renderTab()}</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
