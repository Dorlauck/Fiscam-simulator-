"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { LOCALES, translate, type Locale, type StringKey } from "@/lib/i18n";

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: StringKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "fiscam.locale";

function detectLocale(): Locale {
  if (typeof window === "undefined") return "fr";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && (LOCALES as string[]).includes(stored)) return stored as Locale;
  const nav = window.navigator.language?.toLowerCase() ?? "fr";
  return nav.startsWith("en") ? "en" : "fr";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // SSR-safe default — même valeur server et first client render
  const [locale, setLocaleState] = useState<Locale>("fr");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLocaleState(detectLocale());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, locale);
      document.documentElement.lang = locale;
    }
  }, [locale, hydrated]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
  }, []);

  const t = useCallback(
    (key: StringKey, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale]
  );

  const value = useMemo<I18nContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback en cas d'usage hors Provider (ne devrait pas arriver)
    return {
      locale: "fr",
      setLocale: () => {},
      t: (key, params) => translate("fr", key, params),
    };
  }
  return ctx;
}
