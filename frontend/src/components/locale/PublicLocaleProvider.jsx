"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import {
  visibleTextAm,
  visiblePatternsAm,
} from "@/components/locale/LocaleMap";

const STORAGE_KEY = "startupconnect_public_locale";
const DEFAULT_LOCALE = "en";

function translateVisibleText(text) {
  if (visibleTextAm[text]) return visibleTextAm[text];
  for (const [pattern, replacement] of visiblePatternsAm) {
    if (pattern.test(text)) return text.replace(pattern, replacement);
  }
  return text;
}

const PublicLocaleContext = createContext(null);

export function PublicLocaleProvider({ children }) {
  const pathname = usePathname();
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);
  const originalTextRef = useRef(new WeakMap());

  // Detect if the pathname belongs to an authenticated portal page
  const isPortal = useMemo(() => {
    return (
      pathname?.startsWith("/admin") ||
      pathname?.startsWith("/investor") ||
      pathname?.startsWith("/mentor") ||
      pathname?.startsWith("/startup")
    );
  }, [pathname]);

  const setLocale = useCallback((nextLocale) => {
    const normalized =
      nextLocale === "am" || nextLocale === "Amharic" ? "am" : "en";
    setLocaleState(normalized);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, normalized);
      document.cookie = `public_locale=${normalized}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = normalized;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      queueMicrotask(() => {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === "am" || stored === "en") setLocale(stored);
      });
    }
  }, [setLocale]);

  useEffect(() => {
    if (isPortal) return undefined;

    const root = document.querySelector("[data-public-locale-root]");
    if (!root) return undefined;

    const translateText = (node) => {
      const current = node.textContent;
      const existing = originalTextRef.current.get(node);
      if (
        !existing ||
        (current !== existing.original && current !== existing.translated)
      ) {
        originalTextRef.current.set(node, {
          original: current,
          translated: current,
        });
      }
      const record = originalTextRef.current.get(node);
      const original = record.original;
      const trimmed = original.trim();
      const translated =
        locale === "am" ? translateVisibleText(trimmed) : original;
      const nextText =
        translated === original
          ? original
          : original.replace(trimmed, translated);
      record.translated = nextText;
      if (node.textContent !== nextText) node.textContent = nextText;
    };

    const translateAttributes = (element) => {
      for (const attribute of ["placeholder", "title", "aria-label"]) {
        if (!element.hasAttribute(attribute)) continue;
        const originalKey = `data-public-original-${attribute}`;
        const current = element.getAttribute(attribute);
        const previousOriginal = element.getAttribute(originalKey);
        if (
          !previousOriginal ||
          (current !== previousOriginal &&
            current !== translateVisibleText(previousOriginal))
        ) {
          element.setAttribute(originalKey, current);
        }
        const original = element.getAttribute(originalKey);
        const nextValue =
          locale === "am" ? translateVisibleText(original) : original;
        if (current !== nextValue) element.setAttribute(attribute, nextValue);
      }
    };

    const translateTree = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        translateText(node);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      translateAttributes(node);
      for (const child of node.childNodes) translateTree(child);
    };

    translateTree(root);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") translateTree(mutation.target);
        if (mutation.type === "attributes")
          translateAttributes(mutation.target);
        for (const node of mutation.addedNodes) translateTree(node);
      }
    });
    observer.observe(root, {
      attributeFilter: ["aria-label", "placeholder", "title"],
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [locale, isPortal, pathname]);

  const value = useMemo(
    () => ({
      locale,
      language: locale === "am" ? "Amharic" : "English",
      setLocale,
    }),
    [locale, setLocale],
  );

  // Do not wrap or render switcher inside portal layouts to avoid interference
  if (isPortal) {
    return (
      <PublicLocaleContext.Provider value={value}>
        {children}
      </PublicLocaleContext.Provider>
    );
  }

  return (
    <PublicLocaleContext.Provider value={value}>
      <div data-public-locale-root className="min-h-screen w-full relative">
        {children}

        {/* Floating Language Switcher Widget */}
        <div className="fixed bottom-6 right-6 z-[9999]">
          <div>
            <button
              type="button"
              onClick={() => setLocale(locale === "en" ? "Amharic" : "English")}
              aria-label={`Switch to ${locale === "en" ? "Amharic" : "English"}`}
              title={`Switch to ${locale === "en" ? "Amharic" : "English"}`}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/90 text-[#115b4c] shadow-[0_8px_24px_rgba(15,92,74,0.16)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#115b4c] hover:text-white hover:shadow-[0_12px_28px_rgba(15,92,74,0.24)] focus:outline-none focus:ring-2 focus:ring-[#115b4c]/30 focus:ring-offset-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.2-2.42 3.33-5.42 3.33-9S14.2 5.42 12 3m0 18c-2.2-2.42-3.33-5.42-3.33-9S9.8 5.42 12 3M3.6 9h16.8M3.6 15h16.8" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setLocale("Amharic")}
              className={`hidden px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 ${
                locale === "am"
                  ? "bg-[#115b4c] text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-[#115b4c]"
              }`}
            >
              አማ
            </button>
          </div>
        </div>
      </div>
    </PublicLocaleContext.Provider>
  );
}

export function usePublicLocale() {
  const context = useContext(PublicLocaleContext);
  if (!context) {
    throw new Error("usePublicLocale must be used inside PublicLocaleProvider");
  }
  return context;
}
