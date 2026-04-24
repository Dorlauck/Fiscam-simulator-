"use client";

import type { JurisdictionResult } from "@/ui/hooks/useSimulation";
import { FLAG, LABEL, formatEUR, formatPercent } from "@/lib/formatters";
import { useI18n } from "@/ui/hooks/useI18n";

interface Props {
  topResult: JurisdictionResult;
  revenueGrossEUR: number;
}

/**
 * Carte hero affichant le chiffre clé (cashflow mensuel dispo) en grand,
 * avec des KPI secondaires à côté. Inspiré du style Apple / Linear :
 * un gros nombre dominant, des métriques satellites discrètes.
 */
export function ResultsHero({ topResult, revenueGrossEUR }: Props) {
  const { t, locale } = useI18n();
  const L = (fr: string, en: string) => (locale === "en" ? en : fr);
  const monthly = topResult.netAfterColMonthlyEUR;
  const annual = topResult.netAfterColAnnualEUR;
  const taxRate = topResult.flowEUR.totalLevied / Math.max(1, topResult.flowEUR.revenue);
  const colAnnual = topResult.col.totalAnnual;
  const pocketShare = topResult.flowEUR.netTakeHome / Math.max(1, revenueGrossEUR);

  return (
    <div className="hero-result">
      <div>
        <div className="kpi-label">
          {L("🥇 Meilleur cashflow mensuel — ", "🥇 Best monthly cashflow — ")}
          {FLAG[topResult.jurisdiction]} {LABEL[topResult.jurisdiction]}
        </div>
        <div className="big-number" style={{ marginTop: "12px" }}>
          {formatEUR(monthly)}
          <span className="big-number-suffix">/mois</span>
        </div>
        <div className="big-label">
          {L(
            `Sur un CA de ${formatEUR(revenueGrossEUR)} — après impôts, cotisations, loyer, bouffe, transport et santé.`,
            `On ${formatEUR(revenueGrossEUR)} revenue — after taxes, contributions, rent, food, transport and health.`
          )}
        </div>
      </div>

      <div className="kpi-col">
        <div className="kpi">
          <div className="kpi-label">{L("Cashflow annuel", "Annual cashflow")}</div>
          <div className="kpi-value">{formatEUR(annual)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">{L("Taux effectif global", "Overall effective rate")}</div>
          <div className="kpi-value text-danger">{formatPercent(taxRate, 1)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">{L("Coût de vie / an", "Cost of living / yr")}</div>
          <div className="kpi-value">{formatEUR(colAnnual)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">{L("% en poche sur le CA", "% in pocket of revenue")}</div>
          <div className="kpi-value text-primary">{formatPercent(pocketShare, 0)}</div>
        </div>
      </div>
    </div>
  );
}
