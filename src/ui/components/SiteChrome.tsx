"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/ui/hooks/useI18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { StalenessBanner } from "./StalenessBanner";

export function SiteChrome({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <>
      <header className="site-header">
        <div className="brand">
          <span className="brand-dot" />
          {t("nav.brand")}
        </div>
        <div className="row" style={{ gap: "1rem" }}>
          <div className="text-dim mono" style={{ fontSize: "0.8rem" }}>
            {t("nav.dataDate")}
          </div>
          <LanguageSwitcher />
        </div>
      </header>
      <StalenessBanner />
      {children}
      <footer className="footer">
        <p>⚠️ {t("footer.disclaimer")}</p>
        <p className="text-dim">{t("footer.noTracking")}</p>
      </footer>
    </>
  );
}
