"use client";

import { useI18n } from "@/ui/hooks/useI18n";
import { formatEUR, formatPercent } from "@/lib/formatters";

interface Props {
  /** Salaire brut annuel actuel (pour estimer le taux marginal IR) — optionnel */
  currentSalaryGross?: number;
  /** Profit avant IS (pour savoir quel taux IS appliquer au scénario dividende) — optionnel */
  profitBeforeIS?: number;
}

/**
 * Comparaison tranchée salaire vs dividende en SASU France.
 * Base : 1 000 € de coût société additionnel, pour voir quelle route optimise le net.
 *
 * Paramètres 2026 :
 * - Cotisations patronales SASU ≈ 45% sur le brut
 * - Cotisations salariales ≈ 22% sur le brut
 * - Abattement IR 10%
 * - IS 15% < 42 500€ / 25% au-delà
 * - PFU (flat tax) dividendes 31.4% (2026)
 */
export function SalaryVsDividend({ currentSalaryGross = 0, profitBeforeIS = 100_000 }: Props) {
  const { t, locale } = useI18n();
  const L = (fr: string, en: string) => (locale === "en" ? en : fr);
  const companyCostBudget = 1_000;

  // --- Route SALAIRE : 1000€ coût société → salaire brut × 1.45 = 1000 → brut = 689.66
  const salaryGross = companyCostBudget / 1.45;
  const employerContrib = salaryGross * 0.45;
  const employeeContrib = salaryGross * 0.22;
  const netAfterSocial = salaryGross - employeeContrib;
  // Estimation du taux marginal IR sur le salaire :
  // - si current salary < 11k : 0%
  // - si current < 29k : 11%
  // - si current < 84k : 30%
  // - sinon 41%
  const marginalRate =
    currentSalaryGross < 11_497
      ? 0
      : currentSalaryGross < 29_315
        ? 0.11
        : currentSalaryGross < 83_823
          ? 0.30
          : currentSalaryGross < 180_294
            ? 0.41
            : 0.45;
  const taxableIR = netAfterSocial * 0.9;
  const incomeTax = taxableIR * marginalRate;
  const salaryNet = netAfterSocial - incomeTax;

  // --- Route DIVIDENDE : 1000€ de bénéfice avant IS
  // IS 25% (approximation — en réalité 15% si < 42 500). On prend 25% comme cas général
  // pour cette comparaison tranchée, mais on affiche la note si bénéfice < cap.
  const isRate = profitBeforeIS > 42_500 ? 0.25 : 0.15;
  const isAmount = companyCostBudget * isRate;
  const distributable = companyCostBudget - isAmount;
  const pfuRate = 0.314;
  const pfuAmount = distributable * pfuRate;
  const dividendNet = distributable - pfuAmount;

  const salaryEfficiency = salaryNet / companyCostBudget;
  const dividendEfficiency = dividendNet / companyCostBudget;
  const winner = dividendNet > salaryNet ? "dividend" : "salary";

  const marginalRateLabel = `${(marginalRate * 100).toFixed(0)}%`;
  const isRateLabel = `${(isRate * 100).toFixed(0)}%`;

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h3>{t("svd.title")}</h3>
          <p className="text-muted" style={{ fontSize: "0.9rem", marginTop: "4px" }}>
            {t("svd.subtitle")}
          </p>
        </div>
        <div className="badge" data-variant="ok" style={{ fontSize: "0.72rem" }}>
          {t("svd.breakdown.title")}
        </div>
      </div>

      <div className="svd mt-4">
        {/* ---- Colonne SALAIRE ---- */}
        <div className="svd-col" data-kind="salary">
          <div className="svd-title">
            <span>{t("svd.salary.title")}</span>
            {winner === "salary" && <span className="badge" data-variant="ok">{L("Meilleur", "Best")}</span>}
          </div>
          <div>
            <div className="svd-hero">{formatEUR(salaryNet)}</div>
            <div className="svd-hero-sub">{t("svd.netToDirector")}</div>
          </div>
          <table className="svd-table">
            <tbody>
              <tr>
                <td className="text-muted">{t("svd.salary.row.cost")}</td>
                <td className="num">{formatEUR(companyCostBudget)}</td>
              </tr>
              <tr>
                <td className="text-muted" style={{ paddingLeft: "12px", fontSize: "0.8rem" }}>
                  {t("svd.salary.row.salaryGross")}
                </td>
                <td className="num text-muted" style={{ fontSize: "0.8rem" }}>
                  {formatEUR(salaryGross)}
                </td>
              </tr>
              <tr>
                <td className="text-muted" style={{ paddingLeft: "12px", fontSize: "0.8rem" }}>
                  {t("svd.salary.row.employerContrib")}
                </td>
                <td className="num text-danger" style={{ fontSize: "0.8rem" }}>
                  -{formatEUR(employerContrib)}
                </td>
              </tr>
              <tr>
                <td className="text-danger">{t("svd.salary.row.employeeContrib")}</td>
                <td className="num text-danger">-{formatEUR(employeeContrib)}</td>
              </tr>
              <tr>
                <td className="text-danger">
                  {t("svd.salary.row.incomeTax")} ({marginalRateLabel})
                </td>
                <td className="num text-danger">-{formatEUR(incomeTax)}</td>
              </tr>
              <tr className="total">
                <td>{t("svd.salary.row.net")}</td>
                <td className="num text-primary">{formatEUR(salaryNet)}</td>
              </tr>
              <tr>
                <td className="text-muted">{t("svd.efficiency")}</td>
                <td className="num">{formatPercent(salaryEfficiency)}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ fontSize: "0.85rem", lineHeight: 1.5, color: "var(--text-muted)" }}>
            <div style={{ color: "var(--primary)", fontWeight: 600 }}>{t("svd.advantages.salary.title")}</div>
            <div>{t("svd.advantages.salary.list")}</div>
            <div style={{ color: "var(--warning)", marginTop: "6px", fontWeight: 500 }}>
              {t("svd.advantages.salary.warning")}
            </div>
          </div>
        </div>

        {/* ---- Colonne DIVIDENDE ---- */}
        <div className="svd-col" data-kind="dividend">
          <div className="svd-title">
            <span>{t("svd.dividend.title")}</span>
            {winner === "dividend" && <span className="badge" data-variant="ok">{L("Meilleur", "Best")}</span>}
          </div>
          <div>
            <div className="svd-hero">{formatEUR(dividendNet)}</div>
            <div className="svd-hero-sub">{t("svd.netToDirector")}</div>
          </div>
          <table className="svd-table">
            <tbody>
              <tr>
                <td className="text-muted">{t("svd.div.row.companyCost")}</td>
                <td className="num">{formatEUR(companyCostBudget)}</td>
              </tr>
              <tr>
                <td className="text-danger">
                  {t("svd.div.row.is")} ({isRateLabel})
                </td>
                <td className="num text-danger">-{formatEUR(isAmount)}</td>
              </tr>
              <tr>
                <td className="text-muted">{t("svd.div.row.distributable")}</td>
                <td className="num text-muted">{formatEUR(distributable)}</td>
              </tr>
              <tr>
                <td className="text-danger">{t("svd.div.row.pfu")}</td>
                <td className="num text-danger">-{formatEUR(pfuAmount)}</td>
              </tr>
              <tr className="total">
                <td>{t("svd.div.row.net")}</td>
                <td className="num text-primary">{formatEUR(dividendNet)}</td>
              </tr>
              <tr>
                <td className="text-muted">{t("svd.efficiency")}</td>
                <td className="num">{formatPercent(dividendEfficiency)}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ fontSize: "0.85rem", lineHeight: 1.5, color: "var(--text-muted)" }}>
            <div style={{ color: "var(--primary)", fontWeight: 600 }}>
              {t("svd.advantages.dividend.title")}
            </div>
            <div>{t("svd.advantages.dividend.list")}</div>
            <div style={{ color: "var(--warning)", marginTop: "6px", fontWeight: 500 }}>
              {t("svd.advantages.dividend.warning")}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4" style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
        {winner === "salary" ? t("svd.verdict.salary") : t("svd.verdict.dividend")}
      </div>
    </div>
  );
}
