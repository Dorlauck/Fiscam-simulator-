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
  const { t } = useI18n();
  const { result, col, verdict, netInHandEUR, netAfterColAnnualEUR } = data;

  const exitLabel = {
    none: { key: "card.exitTax.none" as const, variant: "ok" },
    low: { key: "card.exitTax.low" as const, variant: "ok" },
    moderate: { key: "card.exitTax.moderate" as const, variant: "warn" },
    high: { key: "card.exitTax.high" as const, variant: "danger" },
  }[verdict.exitTaxRisk];

  return (
    <button
      className="jcard"
      data-rank={rank + 1}
      onClick={onClick}
      style={{
        textAlign: "left",
        width: "100%",
        fontFamily: "inherit",
        color: "inherit",
        cursor: "pointer",
      }}
    >
      <div className="jcard-header">
        <div className="jcard-name">
          <span style={{ marginRight: "0.5rem" }}>{FLAG[data.jurisdiction]}</span>
          {LABEL[data.jurisdiction]}
          {rank === 0 ? <span style={{ marginLeft: "0.5rem" }}>🥇</span> : null}
        </div>
        <div className="jcard-score">
          {t("card.score")} {verdict.score}/100
        </div>
      </div>
      <div className="jcard-breakdown">
        <div className="jcard-row">
          <span className="text-muted">{t("card.structure")}</span>
          <span style={{ fontSize: "0.8rem" }}>{result.structure}</span>
        </div>
        <div className="jcard-row">
          <span className="text-muted">{t("card.taxesAndContrib")}</span>
          <span className="text-danger">-{formatEUR(result.totalTax)}</span>
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
          <span>{formatPercent(result.effectiveRate, 1)}</span>
        </div>
      </div>
      <div className="row">
        <span className="badge" data-variant={exitLabel.variant}>
          {t(exitLabel.key)}
        </span>
      </div>
    </button>
  );
}
