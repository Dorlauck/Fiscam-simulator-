"use client";

import type { JurisdictionResult } from "@/ui/hooks/useSimulation";
import { FLAG, LABEL, formatEUR, formatPercent } from "@/lib/formatters";
import { useI18n } from "@/ui/hooks/useI18n";

interface Props {
  data: JurisdictionResult;
  rank: number;
  onClick?: () => void;
}

export function JurisdictionCard({ data, rank, onClick }: Props) {
  const { t, locale } = useI18n();
  const L = (fr: string, en: string) => (locale === "en" ? en : fr);
  const { result, flowEUR, col, verdict, netInHandEUR, netAfterColAnnualEUR, netAfterColMonthlyEUR } = data;
  const effectiveRateEUR = flowEUR.revenue > 0 ? flowEUR.totalLevied / flowEUR.revenue : 0;

  const exitLabel = {
    none: { key: "card.exitTax.none" as const, variant: "ok" },
    low: { key: "card.exitTax.low" as const, variant: "ok" },
    moderate: { key: "card.exitTax.moderate" as const, variant: "warn" },
    high: { key: "card.exitTax.high" as const, variant: "danger" },
  }[verdict.exitTaxRisk];

  return (
    <div
      className="jcard"
      data-rank={rank + 1}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      <div className="jcard-header">
        <div className="jcard-name">
          <span style={{ fontSize: "1.2rem" }}>{FLAG[data.jurisdiction]}</span>
          <span>{LABEL[data.jurisdiction]}</span>
          {rank === 0 ? <span aria-label="Rang 1">🥇</span> : null}
        </div>
        <span className="jcard-score">{verdict.score}/100</span>
      </div>

      <div>
        <div className="jcard-cashflow">
          {formatEUR(netAfterColMonthlyEUR)}
          <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 500 }}>
            /mois
          </span>
        </div>
        <div className="jcard-cashflow-label">
          {L("Cashflow réel mensuel", "Real monthly cashflow")}
        </div>
      </div>

      <div className="jcard-breakdown">
        <div className="jcard-row">
          <span className="text-muted">{t("card.structure")}</span>
          <span style={{ fontSize: "0.82rem", textAlign: "right" }}>{result.structure}</span>
        </div>
        <div className="jcard-row">
          <span className="text-muted">{t("card.taxesAndContrib")}</span>
          <span className="text-danger">-{formatEUR(flowEUR.totalLevied)}</span>
        </div>
        <div className="jcard-row">
          <span className="text-muted">{t("card.colAnnual")}</span>
          <span className="text-danger">-{formatEUR(col.totalAnnual)}</span>
        </div>
        <div className="jcard-row">
          <span className="text-muted">{t("card.netAfterTax")}</span>
          <span>{formatEUR(netInHandEUR)}</span>
        </div>
        <div className="jcard-row" data-emphasis="total">
          <span>{t("card.cashflowAnnual")}</span>
          <span>{formatEUR(netAfterColAnnualEUR)}</span>
        </div>
        <div className="jcard-row">
          <span className="text-muted">{t("card.effectiveRate")}</span>
          <span>{formatPercent(effectiveRateEUR, 1)}</span>
        </div>
      </div>

      <div className="row" style={{ gap: "6px" }}>
        <span className="badge" data-variant={exitLabel.variant}>
          {t(exitLabel.key)}
        </span>
      </div>
    </div>
  );
}
