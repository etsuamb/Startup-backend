"use client";

import { useMemo, useState } from "react";

export const INDUSTRY_OPTIONS = [
  "Agriculture",
  "Agro-processing",
  "Construction",
  "Education",
  "Energy",
  "Environment and Water",
  "Finance and Insurance",
  "Food and Beverage",
  "Health and Wellness",
  "ICT / Technology",
  "Logistics and Transportation",
  "Manufacturing",
  "Media and Entertainment",
  "Mining and Extractives",
  "Professional Services",
  "Real Estate",
  "Retail and Consumer Goods",
  "Tourism and Hospitality",
  "Textiles and Apparel",
];

const OTHER_VALUE = "__other_industry__";

export function IndustrySelectWithOther({
  name,
  label,
  defaultValue = "",
  required = false,
  placeholder = "Select industry",
  labelClassName = "block text-sm font-bold text-[#0f3d32]",
  selectClassName = "",
  inputClassName = "",
}) {
  const isKnownValue = useMemo(
    () => !defaultValue || INDUSTRY_OPTIONS.includes(defaultValue),
    [defaultValue],
  );
  const [choice, setChoice] = useState(isKnownValue ? defaultValue : OTHER_VALUE);
  const [customValue, setCustomValue] = useState(isKnownValue ? "" : defaultValue);
  const value = choice === OTHER_VALUE ? customValue.trim() : choice;

  return (
    <label className={labelClassName}>
      {label}
      <input type="hidden" name={name} value={value} />
      <select
        required={required}
        value={choice}
        onChange={(event) => setChoice(event.target.value)}
        className={selectClassName}
      >
        <option value="">{placeholder}</option>
        {INDUSTRY_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value={OTHER_VALUE}>Other / not listed</option>
      </select>
      {choice === OTHER_VALUE ? (
        <input
          type="text"
          required={required}
          value={customValue}
          onChange={(event) => setCustomValue(event.target.value)}
          placeholder="Enter your industry or sector"
          className={inputClassName || selectClassName}
        />
      ) : null}
    </label>
  );
}

export function CustomIndustryInput({ name, label = "Other industry or sector", defaultValue = "" }) {
  return (
    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest">
      {label}
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        placeholder="Enter another industry or sector"
        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#136150] focus:ring-2 focus:ring-[#136150]"
      />
    </label>
  );
}
