"use client";

import type { JurisdictionResult } from "@/ui/hooks/useSimulation";
import { FLAG, LABEL, formatEUR, formatPercent } from "@/lib/formatters";
import { BreakdownBar } from "./BreakdownBar";

interface Props {
  data: JurisdictionResult;
  revenueGrossEUR: number;
  onClose: () => void;
}

export function DetailPanel({ data, revenueGrossEUR, onClose }: Props) {
  const { result, col, netInHandEUR, prosCons } = data;
  const b = result.socialContributionsBreakdown;

  const line = (label: string, amount: number, note?: string) => (
    <tr>
      <td>{label}</td>
      <td className="num">{formatEUR(amount)}</td>
      <td className="pct">
        {revenueGrossEUR > 0 ? formatPercent(amount / revenueGrossEUR, 0) : "—"}
        {note ? <span className="text-dim"> {note}</span> : null}
      </td>
    </tr>
  );

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2>
          {FLAG[data.jurisdiction]} {LABEL[data.jurisdiction]} — détail fiscal
        </h2>
        <button data-variant="ghost" onClick={onClose} aria-label="Fermer le détail">
          ✕ Fermer
        </button>
      </div>
      <p className="text-muted" style={{ fontSize: "0.9rem" }}>
        Structure : <strong>{result.structure}</strong>
      </p>

      <h3 className="mt-4">Décomposition du revenu brut</h3>
      <BreakdownBar
        netInHand={netInHandEUR}
        effectivelyValuable={b.effectivelyValuable}
        nominallyValuable={b.nominallyValuable}
        pureCost={b.pureCost}
      />

      <h3 className="mt-4">Impôts & cotisations sur {formatEUR(revenueGrossEUR)} de CA</h3>
      <table className="detail-table">
        <tbody>
          {result.corporateTax > 0 && line("Impôt société (IS)", result.corporateTax)}
          {result.socialContributions > 0 &&
            line("Cotisations sociales", result.socialContributions)}
          {b.effectivelyValuable > 0 && (
            <tr className="text-muted">
              <td style={{ paddingLeft: "1rem" }}>✓ Effectivement perçues</td>
              <td className="num">{formatEUR(b.effectivelyValuable)}</td>
              <td className="pct">
                {formatPercent(b.effectivelyValuable / Math.max(1, revenueGrossEUR), 0)}
              </td>
            </tr>
          )}
          {b.nominallyValuable > 0 && (
            <tr className="text-warning">
              <td style={{ paddingLeft: "1rem" }}>⚠ Nominalement valables</td>
              <td className="num">{formatEUR(b.nominallyValuable)}</td>
              <td className="pct">
                {formatPercent(b.nominallyValuable / Math.max(1, revenueGrossEUR), 0)}
              </td>
            </tr>
          )}
          {b.pureCost > 0 && (
            <tr className="text-danger">
              <td style={{ paddingLeft: "1rem" }}>✗ Pure cost / dead weight</td>
              <td className="num">{formatEUR(b.pureCost)}</td>
              <td className="pct">
                {formatPercent(b.pureCost / Math.max(1, revenueGrossEUR), 0)}
              </td>
            </tr>
          )}
          {result.dividendTax > 0 && line("Flat tax dividendes", result.dividendTax)}
          {result.incomeTax > 0 && line("Impôt sur le revenu", result.incomeTax)}
          {result.otherTaxes > 0 && line("Autres (franchise, MCTMT, etc.)", result.otherTaxes)}
          <tr className="total">
            <td>TOTAL PRÉLEVÉ</td>
            <td className="num">{formatEUR(result.totalTax)}</td>
            <td className="pct">{formatPercent(result.effectiveRate, 0)}</td>
          </tr>
          <tr>
            <td>Net en poche (après impôts)</td>
            <td className="num text-primary">{formatEUR(netInHandEUR)}</td>
            <td className="pct">
              {formatPercent(netInHandEUR / Math.max(1, revenueGrossEUR), 0)}
            </td>
          </tr>
          <tr>
            <td>Coût de vie standardisé / an</td>
            <td className="num text-danger">-{formatEUR(col.totalAnnual)}</td>
            <td className="pct">—</td>
          </tr>
          <tr className="total">
            <td>CASHFLOW DISPONIBLE / AN</td>
            <td className="num">{formatEUR(netInHandEUR - col.totalAnnual)}</td>
            <td className="pct">
              {formatPercent((netInHandEUR - col.totalAnnual) / Math.max(1, revenueGrossEUR), 0)}
            </td>
          </tr>
          <tr>
            <td>Cashflow disponible / mois</td>
            <td className="num text-primary" style={{ fontSize: "1.05rem", fontWeight: 700 }}>
              {formatEUR((netInHandEUR - col.totalAnnual) / 12)}
            </td>
            <td />
          </tr>
        </tbody>
      </table>

      <h3 className="mt-4">Coût de vie détaillé (mensuel EUR)</h3>
      <table className="detail-table">
        <tbody>
          {[
            ["Loyer", col.rent],
            ["Alimentation (courses)", col.food],
            ["Restaurant (dining out)", col.diningOut],
            ["Transport", col.transport],
            ["Santé (privée)", col.healthcare],
            ["Utilities + internet", col.utilities],
            ["Gym", col.gym],
          ].map(([l, v]) => (
            <tr key={l as string}>
              <td>{l}</td>
              <td className="num">{formatEUR(v as number)}</td>
              <td />
            </tr>
          ))}
          <tr className="total">
            <td>TOTAL / MOIS</td>
            <td className="num">{formatEUR(col.totalMonthly)}</td>
            <td />
          </tr>
        </tbody>
      </table>

      <h3 className="mt-4">Points positifs & négatifs (objectifs)</h3>
      <div className="pros-cons">
        <div>
          <strong className="text-primary">✅ Pros</strong>
          <ul>
            {prosCons.pros.length === 0 ? (
              <li className="text-dim" style={{ paddingLeft: 0 }}>
                Rien de particulier à signaler.
              </li>
            ) : (
              prosCons.pros.map((p, i) => (
                <li key={i} className="pro">
                  {p}
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <strong className="text-danger">❌ Cons</strong>
          <ul>
            {prosCons.cons.length === 0 ? (
              <li className="text-dim" style={{ paddingLeft: 0 }}>
                Rien à signaler côté négatif.
              </li>
            ) : (
              prosCons.cons.map((c, i) => (
                <li key={i} className="con">
                  {c}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
