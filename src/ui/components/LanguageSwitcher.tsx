"use client";

import { useI18n } from "@/ui/hooks/useI18n";
import { LOCALES } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className="segmented" style={{ padding: "0.15rem" }} aria-label={t("lang.switcher.aria")}>
      {LOCALES.map((l) => (
        <button
          key={l}
          data-active={locale === l}
          onClick={() => setLocale(l)}
          style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem", fontWeight: 600 }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
