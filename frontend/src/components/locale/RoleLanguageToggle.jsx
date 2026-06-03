"use client";

export default function RoleLanguageToggle({
  locale,
  setLocale,
  className = "",
  dark = false,
  compact = false,
}) {
  const isAmharic = locale === "am";
  const nextLocale = isAmharic ? "en" : "am";
  const nextLanguage = isAmharic ? "English" : "Amharic";

  return (
    <button
      type="button"
      onClick={() => setLocale(nextLocale)}
      className={[
        "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-[#10b981]/30",
        dark
          ? "border-white/10 bg-white/10 text-white hover:bg-white/15"
          : "border-gray-100 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:text-[#0f3d32]",
        compact ? "w-10 px-0" : "",
        className,
      ].join(" ")}
      aria-label={`Switch to ${nextLanguage}`}
      title={`Switch to ${nextLanguage}`}
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10m-6.5-3h5M12.5 5C11.6 10.2 8.8 13.8 5 16"
        />
      </svg>
      {!compact ? <span>{isAmharic ? "AM" : "EN"}</span> : null}
    </button>
  );
}
