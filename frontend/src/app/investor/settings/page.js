"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/investor/Sidebar";
import { getInvestorSettings, updateInvestorSettings } from "@/lib/investorApi";
import { getCurrentAccount, updateCurrentAccount } from "@/lib/authApi";
import AccountSecurityPanel from "@/components/auth/AccountSecurityPanel";

const inputClass =
  "w-full bg-white border border-gray-200 text-gray-800 py-3.5 px-4 rounded-xl outline-none focus:border-[#0a4d3c]/50 focus:ring-4 focus:ring-[#0a4d3c]/10 transition text-[14px]";

function valueOf(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function splitFullName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    first_name: parts[0] || "",
    last_name: parts.slice(1).join(" ") || "",
  };
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [investorType, setInvestorType] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [preferredIndustry, setPreferredIndustry] = useState("");
  const [investmentStage, setInvestmentStage] = useState("");
  const [investmentBudget, setInvestmentBudget] = useState("");
  const [locationPreference, setLocationPreference] = useState("");
  const [linkedInOrWebsite, setLinkedInOrWebsite] = useState("");
  const [bio, setBio] = useState("");

  const applySettings = useCallback((settings) => {
    const first = valueOf(settings?.first_name);
    const last = valueOf(settings?.last_name);
    setFullName([first, last].filter(Boolean).join(" "));
    setEmail(valueOf(settings?.email));
    setOriginalEmail(valueOf(settings?.email));
    setEmailVerified(settings?.email_verified !== false);
    setPhoneNumber(valueOf(settings?.phone_number));
    setInvestorType(valueOf(settings?.investor_type));
    setOrganizationName(valueOf(settings?.organization_name));
    setPreferredIndustry(valueOf(settings?.preferred_industry));
    setInvestmentStage(valueOf(settings?.investment_stage));
    setInvestmentBudget(valueOf(settings?.investment_budget));
    setLocationPreference(valueOf(settings?.location_preference));
    setLinkedInOrWebsite(valueOf(settings?.linked_in_or_website));
    setBio(valueOf(settings?.bio));
  }, []);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getInvestorSettings();
      applySettings(data.settings || data.investor);
    } catch (err) {
      if (err.code === "EMAIL_NOT_VERIFIED") {
        try {
          const account = await getCurrentAccount();
          const user = account.user || {};
          setFullName([valueOf(user.first_name), valueOf(user.last_name)].filter(Boolean).join(" "));
          setEmail(valueOf(user.email));
          setOriginalEmail(valueOf(user.email));
          setEmailVerified(user.email_verified !== false);
          setPhoneNumber(valueOf(user.phone_number));
          setError("Verify your email before using the rest of the platform. You can update it here if it is wrong.");
        } catch (accountErr) {
          setError(accountErr.message || "Unable to load account information.");
        }
      } else {
        setError(err.message || "Unable to load investor settings.");
      }
    } finally {
      setLoading(false);
    }
  }, [applySettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const names = splitFullName(fullName);
    if (!names.first_name || !names.last_name) {
      setError("Enter both first and last name.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    const emailChanged = email.trim().toLowerCase() !== originalEmail.trim().toLowerCase();
    if (!emailVerified || emailChanged) {
      setSaving(true);
      try {
        const data = await updateCurrentAccount({
          ...names,
          email: email.trim(),
          phone_number: phoneNumber.trim(),
        });
        const user = data.user || {};
        setFullName([valueOf(user.first_name), valueOf(user.last_name)].filter(Boolean).join(" "));
        setEmail(valueOf(user.email));
        setOriginalEmail(valueOf(user.email));
        setEmailVerified(user.email_verified !== false);
        setPhoneNumber(valueOf(user.phone_number));
        setSuccess(data.message || "Account information updated.");
      } catch (err) {
        setError(err.message || "Unable to update account information.");
      } finally {
        setSaving(false);
      }
      return;
    }
    if (!investorType.trim()) {
      setError("Investor type is required.");
      return;
    }

    setSaving(true);
    try {
      const data = await updateInvestorSettings({
        ...names,
        email: email.trim(),
        phone_number: phoneNumber.trim(),
        investor_type: investorType.trim(),
        organization_name: organizationName.trim(),
        preferred_industry: preferredIndustry.trim(),
        investment_stage: investmentStage.trim(),
        investment_budget: investmentBudget.trim(),
        location_preference: locationPreference.trim(),
        linked_in_or_website: linkedInOrWebsite.trim(),
        bio: bio.trim(),
      });
      applySettings(data.settings || data.investor);
      setSuccess(data.message || "Investor settings saved.");
    } catch (err) {
      setError(err.message || "Unable to save investor settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans text-gray-900 overflow-hidden">
      <Sidebar />

      <div className="flex-grow flex flex-col overflow-hidden bg-white">
        <header className="flex justify-between items-center px-10 py-4 bg-white border-b border-gray-100 z-10 shrink-0 h-[72px]">
          <div>
            <span className="text-[13px] font-bold text-gray-800">Investor Settings</span>
          </div>
          <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
        </header>

        <main className="flex-grow flex flex-col overflow-y-auto bg-[#f8f9fa] relative">
          <div className="p-10 max-w-[900px] w-full mx-auto flex flex-col pb-32 z-10 relative">
            <div className="mb-8">
              <h1 className="text-[32px] font-bold text-[#091a15] tracking-tight mb-2">Settings</h1>
              <p className="text-gray-500 text-[14px]">Manage your account details, investment preferences, and security settings.</p>
            </div>

            {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
            {success && <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{success}</div>}

            {loading ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">Loading settings...</div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <h2 className="text-xl font-bold text-gray-900">Profile Settings</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Full Name</label>
                      <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Email Address</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                      {!emailVerified ? (
                        <p className="mt-2 text-xs font-semibold text-amber-700">
                          This account cannot be approved until this email is verified.
                        </p>
                      ) : email.trim().toLowerCase() !== originalEmail.trim().toLowerCase() ? (
                        <p className="mt-2 text-xs font-semibold text-amber-700">
                          Saving will send a new verification link and mark the account unverified until confirmed.
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Phone Number</label>
                      <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Investor Type</label>
                      <select value={investorType} onChange={(e) => setInvestorType(e.target.value)} className={inputClass}>
                        <option value="">Select investor type</option>
                        <option>Venture Capitalist</option>
                        <option>Angel Investor</option>
                        <option>Syndicate Lead</option>
                        <option>Institutional Fund</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Organization</label>
                      <input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </section>

                <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <h2 className="text-xl font-bold text-gray-900">Investment Preferences</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Preferred Industry</label>
                      <input value={preferredIndustry} onChange={(e) => setPreferredIndustry(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Preferred Startup Stage</label>
                      <input value={investmentStage} onChange={(e) => setInvestmentStage(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Investment Budget</label>
                      <input type="number" min="0" value={investmentBudget} onChange={(e) => setInvestmentBudget(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Preferred Location</label>
                      <input value={locationPreference} onChange={(e) => setLocationPreference(e.target.value)} className={inputClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">LinkedIn or Website</label>
                      <input value={linkedInOrWebsite} onChange={(e) => setLinkedInOrWebsite(e.target.value)} className={inputClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Bio</label>
                      <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className={inputClass} />
                    </div>
                  </div>
                </section>

                <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Security & 2FA</h2>
                  <p className="text-[13px] text-gray-500 mb-6">Manage two-factor authentication for your account.</p>
                  <AccountSecurityPanel showToast={(message, type) => (type === "error" ? setError(message) : setSuccess(message))} />
                </section>

                <div className="mt-2 flex justify-end">
                  <button disabled={saving} className="px-6 py-3 bg-[#0a3a2e] text-white font-bold text-[14px] rounded-xl hover:bg-[#072a21] shadow-md transition disabled:opacity-60">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
