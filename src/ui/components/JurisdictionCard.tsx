"use client";

import type { JurisdictionResult } from "@/ui/hooks/useSimulation";
import { FLAG, LABEL, formatEUR, formatPercent } from "@/lib/formatters";

interface Props {
  data: JurisdictionResult;
  rank: number;
  onClick?: () => void;
}

export function JurisdictionCard({ data, rank, onClick }: Props) {
  const { result, col, verdict, netInHandEUR, netAfterColAnnualEUR } = data;

  const exitBadge: Record<typeof verdict.exitTaxRisk, { label: string; variant: string }> = {
    none: { label: "Exit tax : aucune", variant: "ok" },
    low: { label: "Exit tax : faible", variant: "ok" },
    moderate: { label: "Exit tax : modérée", variant: "warn" },
    high: { label: "Exit tax : élevée", variant: "danger" },
  };
  const exit = exitBadge[verdict.exitTaxRisk];

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
        <div className="jcard-score">Score {verdict.score}/100</div>
      </div>
      <div className="jcard-breakdown">
        <div className="jcard-row">
          <span className="text-muted">Structure</span>
          <span style={{ fontSize: "0.8rem" }}>{result.structure}</span>
        </div>
        <div className="jcard-row">
          <span className="text-muted">Impôts & cotis.</span>
          <span className="text-danger">-{formatEUR(result.totalTax)}</span>
        </div>
        <div className="jcard-row">
          <span className="text-muted">Coût de vie / an</span>
          <span className="text-danger">-{formatEUR(col.totalAnnual)}</span>
        </div>
        <div className="jcard-row">
          <span className="text-muted">Net après impôts</span>
          <span>{formatEUR(netInHandEUR)}</span>
        </div>
        <div className="jcard-row" data-emphasis="total">
          <span>Cashflow dispo / an</span>
          <span>{formatEUR(netAfterColAnnualEUR)}</span>
        </div>
        <div className="jcard-row">
          <span className="text-muted">Taux effectif</span>
          <span>{formatPercent(result.effectiveRate, 1)}</span>
        </div>
      </div>
      <div className="row">
        <span className="badge" data-variant={exit.variant}>
          {exit.label}
        </span>
      </div>
    </button>
  );
}
