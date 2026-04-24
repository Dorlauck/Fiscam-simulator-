"use client";

import type { JurisdictionResult } from "@/ui/hooks/useSimulation";
import { FLAG, LABEL, formatEUR, formatPercent } from "@/lib/formatters";
import { BreakdownBar } from "./BreakdownBar";
import { TaxFlowWaterfall } from "./TaxFlowWaterfall";
import { useI18n } from "@/ui/hooks/useI18n";

interface Props {
  data: JurisdictionResult;
  revenueGrossEUR: number;
  onClose: () => void;
}

export function DetailPanel({ data, revenueGrossEUR, onClose }: Props) {
  const { t, locale } = useI18n();
  const L = (fr: string, en: string) => (locale === "en" ? en : fr);
  const { flowEUR, col, prosCons, result } = data;
  const b = result.socialContributionsBreakdown;

  // Classification : on convertit le breakdown des cotisations en EUR à la main (même facteur).
  const factor =
    flowEUR.currency === "EUR"
      ? 1
      : result.jurisdiction === "JP"
        ? 1 / 163
        : result.jurisdiction === "UK"
          ? 1 / 0.83
          : 1 / 1.09;
  const breakdownEUR = {
    effectivelyValuable: b.effectivelyValuable * factor,
    nominallyValuable: b.nominallyValuable * factor,
    pureCost: b.pureCost * factor,
  };

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

      {/* SECTION 1 — Waterfall : D'OÙ VIENT ET OÙ VA LE CASH */}
      <h3 className="mt-4">
        {L("💸 Trajet de l'argent — du CA jusqu'à ta poche", "💸 Money flow — from revenue to your pocket")}
      </h3>
      <p className="text-muted" style={{ fontSize: "0.85rem" }}>
        {L(
          "Chaque ligne montre ce qui est prélevé dans l'ordre où ça se fait fiscalement.",
          "Each line shows what's deducted in the actual fiscal order."
        )}
      </p>
      <div className="mt-3">
        <TaxFlowWaterfall flow={flowEUR} jurisdiction={data.jurisdiction} />
      </div>

      {/* SECTION 2 — Classification objective des cotisations */}
      <h3 className="mt-4">
        {L("🏷️ Classification objective des cotisations", "🏷️ Objective contribution classification")}
      </h3>
      <p className="text-muted" style={{ fontSize: "0.85rem" }}>
        {L(
          "Sur les cotisations prélevées, quelle portion t'offre vraiment quelque chose ?",
          "Of the contributions taken, how much do you actually get in return?"
        )}
      </p>
      <div className="mt-2">
        <BreakdownBar
          netInHand={flowEUR.netTakeHome}
          effectivelyValuable={breakdownEUR.effectivelyValuable}
          nominallyValuable={breakdownEUR.nominallyValuable}
          pureCost={breakdownEUR.pureCost}
        />
      </div>
      <table className="detail-table mt-2">
        <tbody>
          {breakdownEUR.effectivelyValuable > 0 && (
            <tr className="text-primary">
              <td>{t("detail.row.effectivelyValuable")}</td>
              <td className="num">{formatEUR(breakdownEUR.effectivelyValuable)}</td>
              <td className="pct">
                {formatPercent(breakdownEUR.effectivelyValuable / Math.max(1, revenueGrossEUR), 0)}
              </td>
            </tr>
          )}
          {breakdownEUR.nominallyValuable > 0 && (
            <tr className="text-warning">
              <td>{t("detail.row.nominallyValuable")}</td>
              <td className="num">{formatEUR(breakdownEUR.nominallyValuable)}</td>
              <td className="pct">
                {formatPercent(breakdownEUR.nominallyValuable / Math.max(1, revenueGrossEUR), 0)}
              </td>
            </tr>
          )}
          {breakdownEUR.pureCost > 0 && (
            <tr className="text-danger">
              <td>{t("detail.row.pureCost")}</td>
              <td className="num">{formatEUR(breakdownEUR.pureCost)}</td>
              <td className="pct">
                {formatPercent(breakdownEUR.pureCost / Math.max(1, revenueGrossEUR), 0)}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* SECTION 3 — Coût de vie */}
      <h3 className="mt-4">{t("detail.col.title")}</h3>
      <p className="text-muted" style={{ fontSize: "0.85rem" }}>
        {L(
          "Panier standardisé — pour comparer équitablement les villes.",
          "Standardized basket — to compare cities fairly."
        )}
      </p>
      <table className="detail-table mt-2">
        <tbody>
          {[
            [t("detail.col.rent"), col.rent],
            [t("detail.col.food"), col.food],
            [t("detail.col.dining"), col.diningOut],
            [t("detail.col.transport"), col.transport],
            [t("detail.col.healthcare"), col.healthcare],
            [t("detail.col.utilities"), col.utilities],
            [t("detail.col.gym"), col.gym],
          ]
            .filter(([, v]) => (v as number) > 0)
            .map(([l, v]) => (
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

      {/* SECTION 4 — Synthèse mensuelle */}
      <h3 className="mt-4">
        {L("📊 Synthèse — cashflow mensuel disponible", "📊 Summary — available monthly cashflow")}
      </h3>
      <table className="detail-table mt-2">
        <tbody>
          <tr>
            <td>{L("Net en poche / an", "Net in pocket / yr")}</td>
            <td className="num text-primary">{formatEUR(flowEUR.netTakeHome)}</td>
            <td className="pct">
              {formatPercent(flowEUR.netTakeHome / Math.max(1, revenueGrossEUR), 0)}
            </td>
          </tr>
          <tr>
            <td>{L("Coût de vie / an", "Cost of living / yr")}</td>
            <td className="num text-danger">-{formatEUR(col.totalAnnual)}</td>
            <td className="pct">—</td>
          </tr>
          <tr className="total">
            <td>{t("detail.row.cashflowAnnual")}</td>
            <td className="num">{formatEUR(flowEUR.netTakeHome - col.totalAnnual)}</td>
            <td className="pct">
              {formatPercent(
                (flowEUR.netTakeHome - col.totalAnnual) / Math.max(1, revenueGrossEUR),
                0
              )}
            </td>
          </tr>
          <tr>
            <td>{t("detail.row.cashflowMonthly")}</td>
            <td className="num text-primary" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
              {formatEUR((flowEUR.netTakeHome - col.totalAnnual) / 12)}
            </td>
            <td />
          </tr>
        </tbody>
      </table>

      {/* SECTION 5 — Pros/cons */}
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
