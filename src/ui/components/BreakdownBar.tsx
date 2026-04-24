"use client";

import { formatEUR } from "@/lib/formatters";
import { useI18n } from "@/ui/hooks/useI18n";

interface Props {
  netInHand: number;
  effectivelyValuable: number;
  nominallyValuable: number;
  pureCost: number;
}

export function BreakdownBar({
  netInHand,
  effectivelyValuable,
  nominallyValuable,
  pureCost,
}: Props) {
  const { t } = useI18n();
  const total = netInHand + effectivelyValuable + nominallyValuable + pureCost;
  if (total <= 0) return null;
  const pct = (v: number) => (v / total) * 100;

  return (
    <div>
      <div className="breakdown-bar">
        <div
          className="breakdown-segment"
          style={{ width: `${pct(netInHand)}%`, background: "var(--primary)" }}
          title={formatEUR(netInHand)}
        />
        <div
          className="breakdown-segment"
          style={{ width: `${pct(effectivelyValuable)}%`, background: "#34d399" }}
          title={formatEUR(effectivelyValuable)}
        />
        <div
          className="breakdown-segment"
          style={{ width: `${pct(nominallyValuable)}%`, background: "var(--warning)" }}
          title={formatEUR(nominallyValuable)}
        />
        <div
          className="breakdown-segment"
          style={{ width: `${pct(pureCost)}%`, background: "var(--danger)" }}
          title={formatEUR(pureCost)}
        />
      </div>
      <div className="breakdown-legend">
        <span>
          <span className="breakdown-legend-dot" style={{ background: "var(--primary)" }} />
          {t("breakdown.legend.net")}
        </span>
        <span>
          <span className="breakdown-legend-dot" style={{ background: "#34d399" }} />
          {t("breakdown.legend.effectivelyValuable")}
        </span>
        <span>
          <span className="breakdown-legend-dot" style={{ background: "var(--warning)" }} />
          {t("breakdown.legend.nominallyValuable")}
        </span>
        <span>
          <span className="breakdown-legend-dot" style={{ background: "var(--danger)" }} />
          {t("breakdown.legend.pureCost")}
        </span>
      </div>
    </div>
  );
}
