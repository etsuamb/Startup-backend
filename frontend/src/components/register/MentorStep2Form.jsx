"use client";

import Link from "next/link";
import { useRegFlow } from "@/components/register/RegFlowProvider";
import { IndustrySelectWithOther } from "@/components/register/IndustryFields";
import RegistrationStepForm from "@/components/register/RegistrationStepForm";
import ProfilePictureField from "@/components/register/ProfilePictureField";

export default function MentorRegistrationStep2Form() {
  const { fields } = useRegFlow();
  const f = fields || {};
  
  // Convert startup_stage to array if it's not already
  const selectedStages = Array.isArray(f.startup_stage) 
    ? f.startup_stage 
    : (f.startup_stage ? [f.startup_stage] : []);

  const stages = ["Idea Stage", "Pre-Seed", "Seed", "Early Growth"];

  return (
    <RegistrationStepForm nextHref="/register/mentor/step3" className="space-y-6">
      <ProfilePictureField />
      <div className="grid gap-6">
        <label className="block text-sm font-bold text-[#0f3d32]">
          Professional title
          <input
            type="text"
            name="professional_title"
            required
            defaultValue={f.professional_title || ""}
            placeholder="e.g. Strategy Director"
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150]"
          />
        </label>

        <label className="block text-sm font-bold text-[#0f3d32]">
          Language(s)
          <input
            type="text"
            name="language"
            required
            defaultValue={f.language || ""}
            placeholder="e.g. Amharic, English"
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150]"
          />
        </label>
      </div>

      <div className="grid gap-6">
        <label className="block text-sm font-bold text-[#0f3d32]">
          Expertise area
          <input
            type="text"
            name="expertise_area"
            required
            defaultValue={f.expertise_area || ""}
            placeholder="e.g. Product strategy, growth, fundraising"
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150]"
          />
        </label>

        <label className="block text-sm font-bold text-[#0f3d32]">
          Professional bio
          <textarea
            name="professional_bio"
            required
            minLength={50}
            maxLength={300}
            rows="4"
            defaultValue={f.professional_bio || ""}
            placeholder="Briefly describe your mentoring background and what you bring to founders."
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150] resize-none"
          />
          <p className="text-[10px] text-gray-500 mt-2">50–300 characters</p>
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <label className="block text-sm font-bold text-[#0f3d32]">
          Current organization
          <input
            type="text"
            name="current_organization"
            required
            defaultValue={f.current_organization || ""}
            placeholder="e.g. Ethio Telecom"
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150]"
          />
        </label>

        <label className="block text-sm font-bold text-[#0f3d32]">
          Current title
          <input
            type="text"
            name="current_title"
            required
            defaultValue={f.current_title || ""}
            placeholder="e.g. Head of Product"
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150]"
          />
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <label className="block text-sm font-bold text-[#0f3d32]">
          Years of experience
          <select
            name="year_of_experience"
            required
            defaultValue={f.year_of_experience || ""}
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150] appearance-none"
          >
            <option value="">Select years</option>
            <option value="1">1 year</option>
            <option value="2">2 years</option>
            <option value="3">3 years</option>
            <option value="4">4 years</option>
            <option value="5">5 years</option>
            <option value="6">6 years</option>
            <option value="7">7 years</option>
            <option value="8">8 years</option>
            <option value="9">9 years</option>
            <option value="10">10+ years</option>
          </select>
        </label>

        <label className="block text-sm font-bold text-[#0f3d32]">
          LinkedIn or portfolio URL
          <input
            type="url"
            name="linkedin_portfolio"
            required
            defaultValue={f.linkedin_portfolio || ""}
            placeholder="https://linkedin.com/in/yourname"
            pattern="https?://.+"
            title="Please provide a valid URL starting with http:// or https://"
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150]"
          />
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <label className="block text-sm font-bold text-[#0f3d32]">
          Preferred availability
          <select
            name="availability_preference"
            required
            defaultValue={f.availability_preference || ""}
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150] appearance-none"
          >
            <option value="">Choose availability</option>
            <option value="1-2 hours/week">1 - 2 hours / week</option>
            <option value="3-5 hours/week">3 - 5 hours / week</option>
            <option value="5+ hours/week">5+ hours / week</option>
          </select>
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <IndustrySelectWithOther
          name="primary_industry"
          label="Primary industry"
          required
          defaultValue={f.primary_industry || ""}
          selectClassName="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150] appearance-none"
          inputClassName="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150]"
        />

        <IndustrySelectWithOther
          name="secondary_industry"
          label="Secondary industry"
          defaultValue={f.secondary_industry || ""}
          selectClassName="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150] appearance-none"
          inputClassName="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150]"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <label className="block text-sm font-bold text-[#0f3d32]">
          City / location
          <div className="mt-3 relative">
            <select
              name="city_location"
              required
              defaultValue={f.city_location || ""}
              className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150]"
            >
              <option value="">Select location</option>
              <option value="Addis Ababa">Addis Ababa</option>
              <option value="Adama">Adama</option>
              <option value="Bahir Dar">Bahir Dar</option>
              <option value="Dire Dawa">Dire Dawa</option>
              <option value="Gondar">Gondar</option>
              <option value="Hawassa">Hawassa</option>
              <option value="Jimma">Jimma</option>
              <option value="Mekelle">Mekelle</option>
              <option value="Nekemte">Nekemte</option>
              <option value="Semera">Semera</option>
              <option value="Shashemene">Shashemene</option>
              <option value="Harar">Harar</option>
              <option value="Bishoftu">Bishoftu</option>
              <option value="Assosa">Assosa</option>
              <option value="Dessie">Dessie</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </label>

        <label className="block text-sm font-bold text-[#0f3d32]">
          Mentor platform
          <div className="mt-3 grid gap-3">
            <label className="inline-flex items-center gap-3">
              <input type="radio" name="mentor_platform" value="Remote" className="h-4 w-4 text-[#136150] focus:ring-[#136150]" defaultChecked={f.mentor_platform === "Remote" || !f.mentor_platform} />
              <span className="text-sm text-gray-700">Remote</span>
            </label>
            <label className="inline-flex items-center gap-3">
              <input type="radio" name="mentor_platform" value="In-person" className="h-4 w-4 text-[#136150] focus:ring-[#136150]" defaultChecked={f.mentor_platform === "In-person"} />
              <span className="text-sm text-gray-700">In-person</span>
            </label>
          </div>
        </label>
      </div>

      <div className="grid gap-6">
        <label className="block text-sm font-bold text-[#0f3d32]">
          Session frequency
          <input
            type="text"
            name="session_frequency"
            required
            defaultValue={f.session_frequency || ""}
            placeholder="e.g. Twice weekly, Weekends"
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150]"
          />
        </label>

        <label className="block text-sm font-bold text-[#0f3d32]">
          Available time slots
          <textarea
            name="required_time_slots"
            required
            rows="3"
            defaultValue={f.required_time_slots || ""}
            placeholder="e.g. Mon/Wed 6–8pm, Saturday mornings"
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150] resize-none"
          />
          <p className="text-[10px] text-gray-500 mt-2">Enter your ideal time windows as plain text.</p>
        </label>
      </div>

      <div className="grid gap-6">
        <label className="block text-sm font-bold text-[#0f3d32]">
          Mentoring style or approach
          <textarea
            name="mentoring_style"
            required
            maxLength={180}
            rows="4"
            defaultValue={f.mentoring_style || ""}
            placeholder="Describe how you structure mentor sessions and work with founders."
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150] resize-none"
          />
          <p className="text-[10px] text-gray-500 mt-2">Maximum 180 characters.</p>
        </label>
      </div>

      <div className="grid gap-6">
        <label className="block text-sm font-bold text-[#0f3d32]">
          Notable startups or projects mentored
          <textarea
            name="notable_startups_mentored"
            rows="3"
            required
            maxLength={250}
            defaultValue={f.notable_startups_mentored || ""}
            placeholder="Name the startups, products, or programs you have advised."
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150] resize-none"
          />
          <p className="text-[10px] text-gray-500 mt-2">Maximum 250 characters.</p>
        </label>

        <label className="block text-sm font-bold text-[#0f3d32]">
          Key achievement
          <textarea
            name="key_achievement"
            rows="3"
            required
            maxLength={180}
            defaultValue={f.key_achievement || ""}
            placeholder="Summarize one career win that best shows your mentor impact."
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150] resize-none"
          />
          <p className="text-[10px] text-gray-500 mt-2">Maximum 180 characters.</p>
        </label>
      </div>

      <div className="grid gap-6">
        <label className="block text-sm font-bold text-[#0f3d32]">
          Typical session price range (ETB)
          <span className="mt-3 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            <input type="number" name="session_pricing_min" min="0" required defaultValue={f.session_pricing_min || ""} placeholder="Minimum" className="w-full min-w-0 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150]" />
            <input type="number" name="session_pricing" min={f.session_pricing_min || "0"} required defaultValue={f.session_pricing || ""} placeholder="Maximum" className="w-full min-w-0 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150]" />
          </span>
        </label>
      </div>

      {/* Startup Stage Focus with Dynamic Checked State */}
      <div className="grid gap-6">
        <label className="block text-sm font-bold text-[#0f3d32]">
          Startup stage focus
          <div className="mt-3 grid gap-2 text-sm text-gray-700">
            {stages.map((stage) => (
              <label key={stage} className="inline-flex items-center gap-3">
                <input 
                  type="checkbox" 
                  name="startup_stage" 
                  value={stage}
                  defaultChecked={selectedStages.includes(stage)}
                  className="h-4 w-4 text-[#136150] focus:ring-[#136150]"
                />
                {stage}
              </label>
            ))}
          </div>
        </label>
      </div>

      <div className="flex flex-col gap-4 pt-4 border-t border-gray-200">
        <label className="flex items-start gap-3 text-sm font-bold text-[#0f3d32]">
          <input type="checkbox" name="mentor_acknowledgement" value="agree" required className="mt-1 h-4 w-4 rounded border-gray-300 text-[#136150] focus:ring-[#136150]" />
          I confirm that the above information is accurate and I am ready to support founders with integrity.
        </label>
      </div>

      <div className="flex justify-between items-center mt-2 pt-4 border-t border-gray-200">
        <Link href="/register/mentor" className="text-sm font-bold text-gray-600 hover:text-[#136150] transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back
        </Link>
        <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-[#0f3d32] px-8 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#0a2921]">
          Continue to Review
        </button>
      </div>
    </RegistrationStepForm>
  );
}
