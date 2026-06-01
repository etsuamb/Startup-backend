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
import {
  visibleTextAm,
  visiblePatternsAm,
} from "@/components/locale/LocaleMap";

const STORAGE_KEY = "startupconnect_mentor_locale";
const DEFAULT_LOCALE = "en";

function translateVisibleText(text) {
  if (visibleTextAm[text]) return visibleTextAm[text];
  for (const [pattern, replacement] of visiblePatternsAm) {
    if (pattern.test(text)) return text.replace(pattern, replacement);
  }
  return text;
}

const MentorLocaleContext = createContext(null);

export function MentorLocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);
  const originalTextRef = useRef(new WeakMap());

  const setLocale = useCallback((nextLocale) => {
    const normalized =
      nextLocale === "am" || nextLocale === "Amharic" ? "am" : "en";
    setLocaleState(normalized);
    window.localStorage.setItem(STORAGE_KEY, normalized);
    document.cookie = `mentor_locale=${normalized}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = normalized;
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "am" || stored === "en") setLocale(stored);
    });
  }, [setLocale]);

  useEffect(() => {
    const root = document.querySelector("[data-mentor-locale-root]");
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
        const originalKey = `data-mentor-original-${attribute}`;
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
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      language: locale === "am" ? "Amharic" : "English",
      setLocale,
    }),
    [locale, setLocale],
  );

  return (
    <MentorLocaleContext.Provider value={value}>
      {children}
    </MentorLocaleContext.Provider>
  );
}

export function useMentorLocale() {
  const context = useContext(MentorLocaleContext);
  if (!context)
    throw new Error("useMentorLocale must be used inside MentorLocaleProvider");
  return context;
}
