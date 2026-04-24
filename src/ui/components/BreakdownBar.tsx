"use client";

import { formatEUR } from "@/lib/formatters";

interface Props {
  netInHand: number;
  effectivelyValuable: number;
  nominallyValuable: number;
  pureCost: number;
}

/**
 * Barre empilée 4 segments : net + effectively/nominally/pureCost.
 * Les segments sont proportionnels au revenue brut (somme des 4).
 */
export function BreakdownBar({
  netInHand,
  effectivelyValuable,
  nominallyValuable,
  pureCost,
}: Props) {
  const total = netInHand + effectivelyValuable + nominallyValuable + pureCost;
  if (total <= 0) return null;

  const pct = (v: number) => (v / total) * 100;

  return (
    <div>
      <div className="breakdown-bar">
        <div
          className="breakdown-segment"
          style={{ width: `${pct(netInHand)}%`, background: "var(--primary)" }}
          title={`Net : ${formatEUR(netInHand)}`}
        />
        <div
          className="breakdown-segment"
          style={{ width: `${pct(effectivelyValuable)}%`, background: "#34d399" }}
          title={`Cotis. effectivement perçues : ${formatEUR(effectivelyValuable)}`}
        />
        <div
          className="breakdown-segment"
          style={{ width: `${pct(nominallyValuable)}%`, background: "var(--warning)" }}
          title={`Cotis. nominales : ${formatEUR(nominallyValuable)}`}
        />
        <div
          className="breakdown-segment"
          style={{ width: `${pct(pureCost)}%`, background: "var(--danger)" }}
          title={`Pure cost : ${formatEUR(pureCost)}`}
        />
      </div>
      <div className="breakdown-legend">
        <span>
          <span className="breakdown-legend-dot" style={{ background: "var(--primary)" }} />
          Net en poche
        </span>
        <span>
          <span className="breakdown-legend-dot" style={{ background: "#34d399" }} />
          Effectivement perçu
        </span>
        <span>
          <span className="breakdown-legend-dot" style={{ background: "var(--warning)" }} />
          Nominal
        </span>
        <span>
          <span className="breakdown-legend-dot" style={{ background: "var(--danger)" }} />
          Pure cost
        </span>
      </div>
    </div>
  );
}
