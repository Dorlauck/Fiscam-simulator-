"use client";

import type { JurisdictionResult } from "@/ui/hooks/useSimulation";
import { FLAG, LABEL, formatEUR, formatPercent } from "@/lib/formatters";
import { BreakdownBar } from "./BreakdownBar";
import { useI18n } from "@/ui/hooks/useI18n";

interface Props {
  data: JurisdictionResult;
  revenueGrossEUR: number;
  onClose: () => void;
}

export function DetailPanel({ data, revenueGrossEUR, onClose }: Props) {
  const { t } = useI18n();
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
          {FLAG[data.jurisdiction]} {LABEL[data.jurisdiction]} — {t("detail.title")}
        </h2>
        <button data-variant="ghost" onClick={onClose} aria-label={t("detail.close")}>
          {t("detail.close")}
        </button>
      </div>
      <p className="text-muted" style={{ fontSize: "0.9rem" }}>
        {t("card.structure")} : <strong>{result.structure}</strong>
      </p>

      <h3 className="mt-4">{t("detail.breakdown.title")}</h3>
      <BreakdownBar
        netInHand={netInHandEUR}
        effectivelyValuable={b.effectivelyValuable}
        nominallyValuable={b.nominallyValuable}
        pureCost={b.pureCost}
      />

      <h3 className="mt-4">
        {t("detail.taxes.title")} · {formatEUR(revenueGrossEUR)}
      </h3>
      <table className="detail-table">
        <tbody>
          {result.corporateTax > 0 && line(t("detail.row.corpTax"), result.corporateTax)}
          {result.socialContributions > 0 &&
            line(t("detail.row.socialContrib"), result.socialContributions)}
          {b.effectivelyValuable > 0 && (
            <tr className="text-muted">
              <td style={{ paddingLeft: "1rem" }}>{t("detail.row.effectivelyValuable")}</td>
              <td className="num">{formatEUR(b.effectivelyValuable)}</td>
              <td className="pct">
                {formatPercent(b.effectivelyValuable / Math.max(1, revenueGrossEUR), 0)}
              </td>
            </tr>
          )}
          {b.nominallyValuable > 0 && (
            <tr className="text-warning">
              <td style={{ paddingLeft: "1rem" }}>{t("detail.row.nominallyValuable")}</td>
              <td className="num">{formatEUR(b.nominallyValuable)}</td>
              <td className="pct">
                {formatPercent(b.nominallyValuable / Math.max(1, revenueGrossEUR), 0)}
              </td>
            </tr>
          )}
          {b.pureCost > 0 && (
            <tr className="text-danger">
              <td style={{ paddingLeft: "1rem" }}>{t("detail.row.pureCost")}</td>
              <td className="num">{formatEUR(b.pureCost)}</td>
              <td className="pct">
                {formatPercent(b.pureCost / Math.max(1, revenueGrossEUR), 0)}
              </td>
            </tr>
          )}
          {result.dividendTax > 0 && line(t("detail.row.divTax"), result.dividendTax)}
          {result.incomeTax > 0 && line(t("detail.row.incomeTax"), result.incomeTax)}
          {result.otherTaxes > 0 && line(t("detail.row.other"), result.otherTaxes)}
          <tr className="total">
            <td>{t("detail.row.totalLevied")}</td>
            <td className="num">{formatEUR(result.totalTax)}</td>
            <td className="pct">{formatPercent(result.effectiveRate, 0)}</td>
          </tr>
          <tr>
            <td>{t("detail.row.netAfterTax")}</td>
            <td className="num text-primary">{formatEUR(netInHandEUR)}</td>
            <td className="pct">
              {formatPercent(netInHandEUR / Math.max(1, revenueGrossEUR), 0)}
            </td>
          </tr>
          <tr>
            <td>{t("detail.row.colAnnual")}</td>
            <td className="num text-danger">-{formatEUR(col.totalAnnual)}</td>
            <td className="pct">—</td>
          </tr>
          <tr className="total">
            <td>{t("detail.row.cashflowAnnual")}</td>
            <td className="num">{formatEUR(netInHandEUR - col.totalAnnual)}</td>
            <td className="pct">
              {formatPercent((netInHandEUR - col.totalAnnual) / Math.max(1, revenueGrossEUR), 0)}
            </td>
          </tr>
          <tr>
            <td>{t("detail.row.cashflowMonthly")}</td>
            <td className="num text-primary" style={{ fontSize: "1.05rem", fontWeight: 700 }}>
              {formatEUR((netInHandEUR - col.totalAnnual) / 12)}
            </td>
            <td />
          </tr>
        </tbody>
      </table>

      <h3 className="mt-4">{t("detail.col.title")}</h3>
      <table className="detail-table">
        <tbody>
          {[
            [t("detail.col.rent"), col.rent],
            [t("detail.col.food"), col.food],
            [t("detail.col.dining"), col.diningOut],
            [t("detail.col.transport"), col.transport],
            [t("detail.col.healthcare"), col.healthcare],
            [t("detail.col.utilities"), col.utilities],
            [t("detail.col.gym"), col.gym],
          ].map(([l, v]) => (
            <tr key={l as string}>
              <td>{l}</td>
              <td className="num">{formatEUR(v as number)}</td>
              <td />
            </tr>
          ))}
          <tr className="total">
            <td>{t("detail.col.totalMonth")}</td>
            <td className="num">{formatEUR(col.totalMonthly)}</td>
            <td />
          </tr>
        </tbody>
      </table>

      <h3 className="mt-4">{t("detail.prosCons.title")}</h3>
      <div className="pros-cons">
        <div>
          <strong className="text-primary">✅ Pros</strong>
          <ul>
            {prosCons.pros.length === 0 ? (
              <li className="text-dim" style={{ paddingLeft: 0 }}>
                {t("detail.pros.empty")}
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
                {t("detail.cons.empty")}
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
