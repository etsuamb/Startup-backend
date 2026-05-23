"use client";
import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/startup/Sidebar";
import { getStartupProfile, updateStartupProfile, getNotificationSettings, updateNotificationSettings } from "@/lib/startupApi";

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

const inputClass =
  "w-full rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:border-[#0f3d32] focus:ring-2 focus:ring-[#0f3d32]/20";

export default function StartupSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [pitchDeck, setPitchDeck] = useState(null);
  const [businessPlan, setBusinessPlan] = useState(null);
  const [showPitchDeckInput, setShowPitchDeckInput] = useState(false);
  const [showBusinessPlanInput, setShowBusinessPlanInput] = useState(false);

  const currentPitchDeck = documents.find(
    (doc) => (doc.description || "").toLowerCase().replace(/_/g, " ") === "pitch deck"
  );
  const currentBusinessPlan = documents.find(
    (doc) => (doc.description || "").toLowerCase().replace(/_/g, " ") === "business plan"
  );
  const otherDocuments = documents.filter((doc) => {
    const desc = (doc.description || "").toLowerCase().replace(/_/g, " ");
    return desc !== "pitch deck" && desc !== "business plan";
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [founderFullName, setFounderFullName] = useState("");
  const [startupName, setStartupName] = useState("");
  const [industry, setIndustry] = useState("");
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

  // Notification settings state
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
  const [notificationError, setNotificationError] = useState(null);
  const [notificationSuccess, setNotificationSuccess] = useState(null);

  const formSetters = {
    setFirstName,
    setLastName,
    setEmail,
    setPhoneNumber,
    setFounderFullName,
    setStartupName,
    setIndustry,
    setTagline,
    setStage,
    setStartupType,
    setDescription,
    setFoundedYear,
    setTeamSize,
    setRegion,
    setCity,
    setFounderRole,
    setLocation,
    setWebsite,
    setFundingNeeded,
    setAdminStatus,
  };

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStartupProfile();
      const profile = data.startup;
      if (!profile) {
        setError("No startup profile found. Complete registration first.");
        return;
      }
      applyProfileToState(profile, formSetters);
      setDocuments(data.documents || []);
      setShowPitchDeckInput(false);
      setShowBusinessPlanInput(false);
    } catch (err) {
      setError(err.message || "Unable to load startup profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNotificationSettings = useCallback(async () => {
    setLoadingNotifications(true);
    setNotificationError(null);
    try {
      const data = await getNotificationSettings();
      setNotificationSettings(data.settings || {
        email_notifications: true,
        push_notifications: true,
        rating_notifications: true,
        mentorship_notifications: true,
        investment_notifications: true,
        message_notifications: true,
      });
    } catch (err) {
      setNotificationError(err.message || "Unable to load notification settings.");
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadNotificationSettings();
  }, [loadProfile, loadNotificationSettings]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!startupName.trim()) {
      setError("Startup name is required.");
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.");
      return;
    }

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

    if (pitchDeck) formData.append("pitch_deck", pitchDeck);
    if (businessPlan) formData.append("business_plan", businessPlan);

    setSaving(true);
    try {
      const data = await updateStartupProfile(formData);
      if (data.startup) {
        applyProfileToState(data.startup, formSetters);
      }
      if (data.documents) {
        setDocuments(data.documents);
      }
      setPitchDeck(null);
      setBusinessPlan(null);
      setShowPitchDeckInput(false);
      setShowBusinessPlanInput(false);
      setSuccess(data.message || "Settings saved successfully.");
    } catch (err) {
      setError(err.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleNotificationSettingsUpdate(event) {
    event.preventDefault();
    setNotificationError(null);
    setNotificationSuccess(null);

    setSavingNotifications(true);
    try {
      await updateNotificationSettings(notificationSettings);
      setNotificationSuccess("Notification settings updated successfully.");
    } catch (err) {
      setNotificationError(err.message || "Unable to update notification settings.");
    } finally {
      setSavingNotifications(false);
    }
  }

  const toggleNotification = (key) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto">
        <header className="px-8 py-6 bg-white border-b border-gray-100 sticky top-0 z-10">
          <h1 className="text-3xl font-bold text-gray-900">Startup Settings</h1>
          <p className="text-sm text-gray-500 mt-1">View and update your account and startup profile stored in the database.</p>
        </header>

        <div className="px-4 sm:px-10 py-8 w-full max-w-[1200px] mx-auto pb-24">
          {error && <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          {success && <div className="mb-6 rounded-3xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{success}</div>}
          {loading ? (
            <div className="rounded-[30px] border border-gray-100 bg-white p-10 shadow-sm text-center text-gray-500">Loading settings…</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid gap-8 lg:grid-cols-[1.5fr_0.8fr]">
                <div className="space-y-8">
                  <section className="rounded-[30px] border border-gray-100 bg-white p-8 shadow-sm space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Account</h2>
                      <p className="text-sm text-gray-500 mt-1">Your login and contact details.</p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">First name</label>
                        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} required />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Last name</label>
                        <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} required />
                      </div>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Email</label>
                        <input value={email} readOnly className={`${inputClass} bg-gray-100 text-gray-500 cursor-not-allowed`} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Phone</label>
                        <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Founder full name</label>
                      <input
                        value={founderFullName}
                        onChange={(e) => setFounderFullName(e.target.value)}
                        placeholder="As shown on your startup profile"
                        className={inputClass}
                      />
                    </div>
                  </section>

                  <section className="rounded-[30px] border border-gray-100 bg-white p-8 shadow-sm space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Startup profile</h2>
                      <p className="text-sm text-gray-500 mt-1">Company information investors and mentors see.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Startup name</label>
                      <input value={startupName} onChange={(e) => setStartupName(e.target.value)} className={inputClass} required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Tagline</label>
                      <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputClass} />
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Industry</label>
                        <div className="relative">
                          <select
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className={`${inputClass} appearance-none pr-10`}
                          >
                            <option value="">Select Industry</option>
                            <option value="Agriculture">Agriculture</option>
                            <option value="Agro-processing">Agro-processing</option>
                            <option value="Construction">Construction</option>
                            <option value="Education">Education</option>
                            <option value="Energy">Energy</option>
                            <option value="Environment and Water">Environment and Water</option>
                            <option value="Finance and Insurance">Finance and Insurance</option>
                            <option value="Food and Beverage">Food and Beverage</option>
                            <option value="Health and Wellness">Health and Wellness</option>
                            <option value="ICT / Technology">ICT / Technology</option>
                            <option value="Logistics and Transportation">Logistics and Transportation</option>
                            <option value="Manufacturing">Manufacturing</option>
                            <option value="Media and Entertainment">Media and Entertainment</option>
                            <option value="Mining and Extractives">Mining and Extractives</option>
                            <option value="Professional Services">Professional Services</option>
                            <option value="Real Estate">Real Estate</option>
                            <option value="Retail and Consumer Goods">Retail and Consumer Goods</option>
                            <option value="Tourism and Hospitality">Tourism and Hospitality</option>
                            <option value="Textiles and Apparel">Textiles and Apparel</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Business stage</label>
                        <div className="relative">
                          <select
                            value={stage}
                            onChange={(e) => setStage(e.target.value)}
                            className={`${inputClass} appearance-none pr-10`}
                          >
                            <option value="">Select Stage</option>
                            <option value="Idea Stage">Idea Stage</option>
                            <option value="Pre-Seed">Pre-Seed</option>
                            <option value="Seed">Seed</option>
                            <option value="Early Growth">Early Growth</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Startup type</label>
                      <div className="relative">
                        <select
                          value={startupType}
                          onChange={(e) => setStartupType(e.target.value)}
                          className={`${inputClass} appearance-none pr-10`}
                        >
                          <option value="">Select Type</option>
                          <option value="B2B">B2B (Business to Business)</option>
                          <option value="B2C">B2C (Business to Consumer)</option>
                          <option value="B2G">B2G (Business to Gov)</option>
                          <option value="Marketplace">Marketplace</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className={inputClass}
                        placeholder="Describe your startup, mission, and what makes it unique..."
                      />
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Founded year</label>
                        <input
                          type="number"
                          value={foundedYear}
                          onChange={(e) => setFoundedYear(e.target.value)}
                          className={inputClass}
                          placeholder="YYYY"
                          min="1900"
                          max="2100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Team size</label>
                        <select
                          value={teamSize}
                          onChange={(e) => setTeamSize(e.target.value)}
                          className={`${inputClass} appearance-none pr-10`}
                        >
                          <option value="">Select size</option>
                          <option value="1-10">1-10</option>
                          <option value="11-50">11-50</option>
                          <option value="51-200">51-200</option>
                          <option value="201+">201+</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Region</label>
                        <input value={region} onChange={(e) => setRegion(e.target.value)} className={inputClass} placeholder="e.g., California" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">City</label>
                        <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="e.g., San Francisco" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Founder role</label>
                      <input
                        value={founderRole}
                        onChange={(e) => setFounderRole(e.target.value)}
                        className={inputClass}
                        placeholder="e.g., CEO, CTO, Founder"
                      />
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Website</label>
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className={inputClass}
                          placeholder="https://yourstartup.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Funding needed</label>
                        <input
                          type="number"
                          value={fundingNeeded}
                          onChange={(e) => setFundingNeeded(e.target.value)}
                          className={inputClass}
                          placeholder="Amount in USD"
                          min="0"
                        />
                      </div>
                    </div>
                  </section>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center rounded-full bg-[#0f3d32] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#0b2a1d] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <section className="rounded-[30px] border border-gray-100 bg-white p-8 shadow-sm space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">Status</h2>
                    <p className="text-sm text-gray-500">Admin review status for your startup listing.</p>
                    <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Admin status</p>
                      <p className="text-lg font-bold text-gray-900 capitalize">{adminStatus || "Pending"}</p>
                    </div>
                  </section>

                  <section className="rounded-[30px] border border-gray-100 bg-white p-8 shadow-sm space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Documents</h2>
                      <p className="text-sm text-gray-500 mt-2">Upload or replace your pitch deck and business plan.</p>
                    </div>
                    {otherDocuments.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Other Documents</h3>
                        <ul className="space-y-2 rounded-2xl border border-gray-100 bg-[#f8fafc] p-4 text-sm">
                          {otherDocuments.map((doc) => (
                            <li key={doc.document_id} className="flex justify-between gap-2 text-gray-700 items-center">
                              <span className="truncate font-medium">{doc.description || doc.file_name}</span>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs text-gray-400">
                                  {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ""}
                                </span>
                                <a
                                  href={`/${doc.file_path.replace(/\\/g, "/")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-bold text-[#0f3d32] hover:underline"
                                >
                                  View
                                </a>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Pitch deck (PDF)</label>
                      {currentPitchDeck && !showPitchDeckInput ? (
                        <div className="flex items-center justify-between p-4 rounded-2xl border border-green-200 bg-green-50/40">
                          <div className="flex items-center gap-3 min-w-0">
                            <svg className="w-8 h-8 text-[#0f3d32] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{currentPitchDeck.file_name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Uploaded on {new Date(currentPitchDeck.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-4">
                            <a
                              href={`/${currentPitchDeck.file_path.replace(/\\/g, "/")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-[#0f3d32] hover:underline"
                            >
                              View
                            </a>
                            <button
                              type="button"
                              onClick={() => setShowPitchDeckInput(true)}
                              className="text-xs font-bold text-gray-500 hover:text-gray-900 hover:underline"
                            >
                              Replace
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={(e) => setPitchDeck(e.target.files?.[0] || null)}
                            className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-[#0f3d32]/10 file:text-[#0f3d32] hover:file:bg-[#0f3d32]/20 cursor-pointer"
                          />
                          {currentPitchDeck && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500">Uploading will replace the current file.</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPitchDeckInput(false);
                                  setPitchDeck(null);
                                }}
                                className="font-bold text-red-600 hover:underline"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Business plan (PDF)</label>
                      {currentBusinessPlan && !showBusinessPlanInput ? (
                        <div className="flex items-center justify-between p-4 rounded-2xl border border-green-200 bg-green-50/40">
                          <div className="flex items-center gap-3 min-w-0">
                            <svg className="w-8 h-8 text-[#0f3d32] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{currentBusinessPlan.file_name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Uploaded on {new Date(currentBusinessPlan.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-4">
                            <a
                              href={`/${currentBusinessPlan.file_path.replace(/\\/g, "/")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-[#0f3d32] hover:underline"
                            >
                              View
                            </a>
                            <button
                              type="button"
                              onClick={() => setShowBusinessPlanInput(true)}
                              className="text-xs font-bold text-gray-500 hover:text-gray-900 hover:underline"
                            >
                              Replace
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={(e) => setBusinessPlan(e.target.files?.[0] || null)}
                            className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-[#0f3d32]/10 file:text-[#0f3d32] hover:file:bg-[#0f3d32]/20 cursor-pointer"
                          />
                          {currentBusinessPlan && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500">Uploading will replace the current file.</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowBusinessPlanInput(false);
                                  setBusinessPlan(null);
                                }}
                                className="font-bold text-red-600 hover:underline"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="rounded-[30px] border border-gray-100 bg-white p-8 shadow-sm space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Notification Settings</h2>
                      <p className="text-sm text-gray-500 mt-2">Manage how you receive notifications.</p>
                    </div>
                    {notificationError && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{notificationError}</div>}
                    {notificationSuccess && <div className="rounded-2xl border border-green-200 bg-green-50 p-3 text-xs text-green-700">{notificationSuccess}</div>}
                    {loadingNotifications ? (
                      <div className="text-center text-sm text-gray-500 py-4">Loading notification settings...</div>
                    ) : (
                      <form onSubmit={handleNotificationSettingsUpdate} className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">Email Notifications</p>
                              <p className="text-xs text-gray-500">Receive notifications via email</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleNotification('email_notifications')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notificationSettings.email_notifications ? 'bg-[#0f3d32]' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notificationSettings.email_notifications ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">Push Notifications</p>
                              <p className="text-xs text-gray-500">Receive in-app notifications</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleNotification('push_notifications')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notificationSettings.push_notifications ? 'bg-[#0f3d32]' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notificationSettings.push_notifications ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">Rating Notifications</p>
                              <p className="text-xs text-gray-500">When mentors rate your startup</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleNotification('rating_notifications')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notificationSettings.rating_notifications ? 'bg-[#0f3d32]' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notificationSettings.rating_notifications ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">Mentorship Notifications</p>
                              <p className="text-xs text-gray-500">Updates on mentorship requests</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleNotification('mentorship_notifications')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notificationSettings.mentorship_notifications ? 'bg-[#0f3d32]' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notificationSettings.mentorship_notifications ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">Investment Notifications</p>
                              <p className="text-xs text-gray-500">Updates on investment opportunities</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleNotification('investment_notifications')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notificationSettings.investment_notifications ? 'bg-[#0f3d32]' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notificationSettings.investment_notifications ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">Message Notifications</p>
                              <p className="text-xs text-gray-500">New messages from investors and mentors</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleNotification('message_notifications')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notificationSettings.message_notifications ? 'bg-[#0f3d32]' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notificationSettings.message_notifications ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={savingNotifications}
                            className="w-full inline-flex items-center justify-center rounded-full bg-[#0f3d32] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b2a1d] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {savingNotifications ? "Saving..." : "Save Notification Settings"}
                          </button>
                        </div>
                      </form>
                    )}
                  </section>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
