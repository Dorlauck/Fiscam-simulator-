"use client";

import { useI18n } from "@/ui/hooks/useI18n";
import franceData from "@/data/france-2026.json";

/**
 * Affiche un bandeau d'avertissement si la date actuelle > 12 mois après
 * la date de dernière mise à jour (meta.lastUpdated). Utilise la France
 * comme source canonique (toutes les juridictions sont mises à jour ensemble).
 */
export function StalenessBanner() {
  const { t, locale } = useI18n();
  const lastUpdated = franceData.meta.lastUpdated; // "2026-04-24"
  const lastDate = new Date(lastUpdated);
  const now = new Date();
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  if (Number.isNaN(lastDate.getTime())) return null;
  if (now.getTime() - lastDate.getTime() < oneYearMs) return null;

  const formatted = lastDate.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="container" style={{ paddingTop: 0, paddingBottom: 0 }}>
      <div className="banner" style={{ marginTop: "1rem", marginBottom: 0 }}>
        {t("staleness.banner", { date: formatted })}
      </div>
    </div>
  );
}
