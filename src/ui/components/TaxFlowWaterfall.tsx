"use client";

import type { Jurisdiction, TaxFlow } from "@/engine/types";
import { formatEUR, formatPercent } from "@/lib/formatters";
import { useI18n } from "@/ui/hooks/useI18n";

interface Props {
  flow: TaxFlow;
  jurisdiction: Jurisdiction;
}

type RowKind = "gross" | "deduction" | "subtotal" | "net" | "retained";

interface Row {
  label: string;
  /** Taux explicite (ex. "IS 15% → 42.5k, puis 25%", "PFU 31.4%"). Affiché en petit à droite du label. */
  rate?: string;
  /** Annotation critique factuelle courte (ex. "Sans contrepartie directe"). Affiché sous la ligne en italique. */
  note?: string;
  amount: number;
  kind: RowKind;
  indent?: 0 | 1 | 2;
  pctOfRevenue?: number;
}

/**
 * Waterfall visuel : affiche le trajet fiscal du CA brut jusqu'au net dans la poche,
 * avec les TAUX explicites à côté de chaque prélèvement et une annotation critique
 * factuelle en petit sous chaque ligne "on te prend de l'argent parce que...".
 */
export function TaxFlowWaterfall({ flow, jurisdiction }: Props) {
  const { locale } = useI18n();
  const L = (fr: string, en: string) => (locale === "en" ? en : fr);
  const rev = flow.revenue;
  const pct = (v: number) => (rev > 0 ? v / rev : 0);

  const hasCompany =
    flow.profitBeforeCorpTax !== 0 || flow.corporateTax !== 0 || flow.salaryCost !== 0;
  const hasSalary = flow.salaryGross > 0;
  const hasDividend = flow.dividendGross > 0;
  const hasSelfEmploymentTax = flow.selfEmploymentTax > 0;
  const hasSoleIncomeTax = flow.soleIncomeTax > 0;
  const hasOtherTaxes = flow.otherTaxes > 0;

  // --- Annotations spécifiques par juridiction (taux + critique factuelle)
  const A = {
    // Impôt société
    corpTaxRate: (() => {
      switch (jurisdiction) {
        case "FR":
          return L(
            "IS 15 % jusqu'à 42 500 €, puis 25 %",
            "Corp tax 15% up to €42,500, then 25%"
          );
        case "UK":
          return L(
            "CT 19 % < £50k · 25 % > £250k · marginal relief 3/200",
            "CT 19% < £50k · 25% > £250k · marginal relief 3/200"
          );
        case "MT":
          return L(
            "35 % nominal (effectif ~5 % après refund 6/7 à une Holdco)",
            "35% nominal (~5% effective after 6/7 refund to a Holdco)"
          );
        case "JP":
          return L("Corp tax combiné ~34 % (national + local)", "Combined corp tax ~34%");
        default:
          return "";
      }
    })(),
    corpTaxNote: (() => {
      switch (jurisdiction) {
        case "FR":
          return L(
            "Taux réduit 15 % conditionné : CA < 10 M€, capital libéré, détenu 75 %+ par personnes physiques.",
            "Reduced 15% rate requires: revenue < €10M, paid-up capital, 75%+ held by individuals."
          );
        case "MT":
          return L(
            "Le 35 % paraît brutal mais l'actionnaire non-dom récupère 6/7 = 30 % via refund → ~5 % net effectif.",
            "35% looks harsh but the non-dom shareholder recovers 6/7 = 30% via refund → ~5% net effective."
          );
        default:
          return undefined;
      }
    })(),

    // Cotisations patronales
    employerContribRate:
      jurisdiction === "FR"
        ? L("Charges patronales ~45 % du salaire brut", "Employer contributions ~45% of gross")
        : jurisdiction === "UK"
          ? L("Employer NI 15 % au-delà de £5 000 (2026)", "Employer NI 15% above £5,000 (2026)")
          : jurisdiction === "US_NY" || jurisdiction === "US_CA" || jurisdiction === "US_FL_MIAMI"
            ? L("Employer FICA 7.65 % (SS 6.2 % + Medicare 1.45 %)", "Employer FICA 7.65% (SS 6.2% + Medicare 1.45%)")
            : "",
    employerContribNote:
      jurisdiction === "FR"
        ? L(
            "Santé, retraite, famille, allocations, CSG employeur. Le chômage est prélevé mais le président SASU n'y a PAS droit.",
            "Health, pension, family, social benefits, employer CSG. Unemployment is levied but SASU president is NOT eligible."
          )
        : undefined,

    // Cotisations salariales / employee NI
    employeeContribRate:
      jurisdiction === "FR"
        ? L("Charges salariales ~22 % du brut", "Employee contributions ~22% of gross")
        : jurisdiction === "UK"
          ? L("Employee NI 8 % (entre £12 570 et £50 270)", "Employee NI 8% (£12,570 – £50,270)")
          : "",
    employeeContribNote:
      jurisdiction === "FR"
        ? L(
            "Dont 9.7 % de CSG/CRDS sans contrepartie directe. Le reste finance santé, retraite.",
            "Incl. 9.7% CSG/CRDS with no direct benefit. The rest funds health & pension."
          )
        : undefined,

    // SE tax (US)
    seTaxRate:
      jurisdiction === "US_NY" || jurisdiction === "US_CA" || jurisdiction === "US_FL_MIAMI"
        ? L("SE Tax 15.3 % (SS 12.4 % + Medicare 2.9 %)", "SE Tax 15.3% (SS 12.4% + Medicare 2.9%)")
        : jurisdiction === "FR"
          ? L("Cotisations micro-entreprise 25.6 % BNC (libéral)", "Micro-entreprise 25.6% BNC (liberal)")
          : jurisdiction === "JP"
            ? L("Kenko Hoken ~10 % (cap ¥1 040 000) + Kokumin Nenkin ¥16 980/mois", "Kenko Hoken ~10% (capped) + Kokumin Nenkin ¥16,980/mo")
            : "",
    seTaxNote:
      jurisdiction === "US_NY" || jurisdiction === "US_CA" || jurisdiction === "US_FL_MIAMI"
        ? L(
            "Social Security (12.4 %) cappé à $184 500. Medicare (2.9 %) sans cap, +0.9 % au-delà de $200k. Avant 65 ans : Medicare = pure taxe, aucune prestation.",
            "Social Security (12.4%) capped at $184,500. Medicare (2.9%) uncapped, +0.9% above $200k. Before 65: Medicare is pure tax, no benefit."
          )
        : undefined,

    // IR salarié / sole prop
    incomeTaxRate:
      jurisdiction === "FR"
        ? L(
            "Barème 0 % / 11 % / 30 % / 41 % / 45 % + CEHR 3-4 % > 250k",
            "Progressive 0/11/30/41/45% + CEHR surtax 3-4% above €250k"
          )
        : jurisdiction === "UK"
          ? L("0 % (Personal Allowance £12 570) puis 20 / 40 / 45 %", "0% (Personal Allowance £12,570) then 20/40/45%")
          : jurisdiction === "US_NY"
            ? L("Fédéral 10–37 % + NY State 4–10.9 % + NYC 3.08–3.88 %", "Federal 10–37% + NY State 4–10.9% + NYC 3.08–3.88%")
            : jurisdiction === "US_CA"
              ? L("Fédéral 10–37 % + CA State 1–13.3 %", "Federal 10–37% + CA State 1–13.3%")
              : jurisdiction === "US_FL_MIAMI"
                ? L("Fédéral seul 10–37 % · FL : 0 % State, 0 % City", "Federal only 10–37% · FL: 0% state, 0% city")
                : jurisdiction === "JP"
                  ? L("National 5–45 % + surtax 2.1 % + local flat 10 %", "National 5–45% + 2.1% surtax + 10% local flat")
                  : jurisdiction === "MT"
                    ? L("0 % / 15 % / 25 % / 35 % · min €5 000 si foreign > €35k", "0/15/25/35% · €5k min if foreign > €35k")
                    : "",
    incomeTaxNote:
      jurisdiction === "US_NY"
        ? L(
            "NYC est l'une des rares villes US à prélever un impôt sur le revenu municipal. New York Métro = 3 couches fiscales empilées.",
            "NYC is one of the few US cities levying municipal income tax. New York metro = 3 stacked fiscal layers."
          )
        : jurisdiction === "JP"
          ? L(
            "Reconstruction surtax 2.1 % = finance la reconstruction post-Fukushima, toujours en vigueur jusqu'en 2037.",
            "Reconstruction surtax 2.1% funds post-Fukushima rebuild, still in force until 2037."
          )
          : undefined,

    // Dividend tax
    divTaxRate:
      jurisdiction === "FR"
        ? L("PFU 31.4 % (12.8 % IR + 18.6 % prélèvements sociaux)", "PFU flat tax 31.4% (12.8% IR + 18.6% social levies)")
        : jurisdiction === "UK"
          ? L("10.75 % / 35.75 % / 39.35 % selon tranche (+£500 franchise)", "10.75 / 35.75 / 39.35% by bracket (+£500 allowance)")
          : jurisdiction === "US_NY" || jurisdiction === "US_CA" || jurisdiction === "US_FL_MIAMI"
            ? L("Pas de flat tax : dividende S-Corp passe au fédéral + state IR", "No flat tax: S-Corp distribution taxed as federal + state IR")
            : "",
    divTaxNote:
      jurisdiction === "FR"
        ? L(
            "Avant 2018 le PFU était à 15.5 % → hausse en 2 étapes à 31.4 %. Cumulé à l'IS 25 %, la double imposition réelle = ~48.5 %.",
            "Before 2018 PFU was 15.5% → raised twice to 31.4%. Combined with 25% corp tax, real double taxation ≈ 48.5%."
          )
        : jurisdiction === "UK"
          ? L(
            "Hausse Autumn Budget 2025 : +2 pts sur basic et higher dès avril 2026. Stratégie 'petit salaire + gros div' ressortira affaiblie.",
            "Autumn Budget 2025: +2 pts on basic and higher from April 2026. The 'small salary + big dividend' strategy is now less effective."
          )
          : undefined,

    // Other taxes
    otherTaxRate: (() => {
      if (jurisdiction === "US_NY") {
        return L(
          "MCTMT 0.47 % > $50k SE / 0.60 % > $150k SE",
          "MCTMT 0.47% > $50k SE / 0.60% > $150k SE"
        );
      }
      if (jurisdiction === "US_CA") {
        return L(
          "Franchise $800 + gross receipts 900/2500/6000/11790 $",
          "Franchise $800 + gross receipts fee 900/2500/6000/11790"
        );
      }
      if (jurisdiction === "JP") {
        return L("Enterprise tax préfectural 5 % > ¥2.9M", "Prefectural enterprise tax 5% > ¥2.9M");
      }
      return "";
    })(),
    otherTaxNote: (() => {
      if (jurisdiction === "US_NY") {
        return L(
          "Metropolitan Commuter Transportation Mobility Tax : tu finances le métro de NYC, même si tu vis à Queens sans prendre le subway.",
          "Metropolitan Commuter Transportation Mobility Tax: you fund NYC's subway even if you live in Queens and drive."
        );
      }
      if (jurisdiction === "US_CA") {
        return L(
          "Franchise $800 est dû même en déficit, la 1ère année d'exercice exceptée.",
          "Franchise tax $800 owed even at a loss, except for the 1st fiscal year."
        );
      }
      return undefined;
    })(),
  };

  const rows: Row[] = [];

  rows.push({
    label: L("Chiffre d'affaires brut", "Gross revenue"),
    amount: rev,
    kind: "gross",
    indent: 0,
    pctOfRevenue: 1,
  });

  if (flow.businessExpenses > 0) {
    rows.push({
      label: L("– Charges pro déductibles", "– Business expenses"),
      amount: -flow.businessExpenses,
      kind: "deduction",
      indent: 0,
      pctOfRevenue: -pct(flow.businessExpenses),
      note: L(
        "Loyer bureau, outils, freelances sous-traités, etc. Déductibles du bénéfice imposable.",
        "Office rent, tools, subcontractors. Deductible from taxable profit."
      ),
    });
  }

  if (hasCompany) {
    const companyGross = rev - flow.businessExpenses;
    rows.push({
      label: L("💼 Bénéfice comptable (société)", "💼 Company accounting profit"),
      amount: companyGross,
      kind: "subtotal",
      indent: 1,
      pctOfRevenue: pct(companyGross),
    });
    if (flow.salaryCost > 0) {
      rows.push({
        label: L("   – Coût salarial du dirigeant", "   – Director salary cost"),
        rate: A.employerContribRate,
        amount: -flow.salaryCost,
        kind: "deduction",
        indent: 1,
        pctOfRevenue: -pct(flow.salaryCost),
        note: A.employerContribNote,
      });
    }
    rows.push({
      label: L("= Bénéfice avant IS", "= Profit before corp tax"),
      amount: flow.profitBeforeCorpTax,
      kind: "subtotal",
      indent: 1,
      pctOfRevenue: pct(flow.profitBeforeCorpTax),
    });
    if (flow.corporateTax > 0) {
      rows.push({
        label: L("   – Impôt société (IS)", "   – Corporate income tax"),
        rate: A.corpTaxRate,
        amount: -flow.corporateTax,
        kind: "deduction",
        indent: 1,
        pctOfRevenue: -pct(flow.corporateTax),
        note: A.corpTaxNote,
      });
    }
    if (flow.profitAfterCorpTax !== flow.profitBeforeCorpTax) {
      rows.push({
        label: L("= Bénéfice après IS (distribuable)", "= Profit after corp tax (distributable)"),
        amount: flow.profitAfterCorpTax,
        kind: "subtotal",
        indent: 1,
        pctOfRevenue: pct(flow.profitAfterCorpTax),
      });
    }
  }

  if (hasSalary) {
    rows.push({
      label: L("👤 Salaire brut versé", "👤 Gross salary paid"),
      amount: flow.salaryGross,
      kind: "gross",
      indent: 2,
      pctOfRevenue: pct(flow.salaryGross),
    });
    if (flow.employeeContrib > 0) {
      rows.push({
        label: L("   – Cotisations salariales", "   – Employee contributions"),
        rate: A.employeeContribRate,
        amount: -flow.employeeContrib,
        kind: "deduction",
        indent: 2,
        pctOfRevenue: -pct(flow.employeeContrib),
        note: A.employeeContribNote,
      });
    }
    if (flow.salaryIncomeTax > 0) {
      rows.push({
        label: L("   – IR sur le salaire", "   – Income tax on salary"),
        rate: A.incomeTaxRate,
        amount: -flow.salaryIncomeTax,
        kind: "deduction",
        indent: 2,
        pctOfRevenue: -pct(flow.salaryIncomeTax),
        note: A.incomeTaxNote,
      });
    }
    rows.push({
      label: L("   = Salaire net en poche", "   = Salary take-home"),
      amount: flow.salaryTakeHome,
      kind: "net",
      indent: 2,
      pctOfRevenue: pct(flow.salaryTakeHome),
    });
  }

  if (hasDividend) {
    rows.push({
      label: L("👤 Dividendes distribués (brut)", "👤 Dividends distributed (gross)"),
      amount: flow.dividendGross,
      kind: "gross",
      indent: 2,
      pctOfRevenue: pct(flow.dividendGross),
    });
    if (flow.dividendTax > 0) {
      rows.push({
        label: L("   – PFU / dividend tax", "   – PFU / dividend tax"),
        rate: A.divTaxRate,
        amount: -flow.dividendTax,
        kind: "deduction",
        indent: 2,
        pctOfRevenue: -pct(flow.dividendTax),
        note: A.divTaxNote,
      });
    }
    rows.push({
      label: L("   = Dividende net en poche", "   = Dividend take-home"),
      amount: flow.dividendNet,
      kind: "net",
      indent: 2,
      pctOfRevenue: pct(flow.dividendNet),
    });
  }

  if (!hasSalary && !hasDividend && (hasSelfEmploymentTax || hasSoleIncomeTax || hasOtherTaxes)) {
    if (hasSelfEmploymentTax) {
      rows.push({
        label: L("   – Cotisations sociales / SE tax", "   – Social contributions / SE tax"),
        rate: A.seTaxRate,
        amount: -flow.selfEmploymentTax,
        kind: "deduction",
        indent: 0,
        pctOfRevenue: -pct(flow.selfEmploymentTax),
        note: A.seTaxNote,
      });
    }
    if (hasSoleIncomeTax) {
      rows.push({
        label: L("   – Impôt sur le revenu", "   – Income tax"),
        rate: A.incomeTaxRate,
        amount: -flow.soleIncomeTax,
        kind: "deduction",
        indent: 0,
        pctOfRevenue: -pct(flow.soleIncomeTax),
        note: A.incomeTaxNote,
      });
    }
    if (hasOtherTaxes) {
      rows.push({
        label: L("   – Taxes additionnelles", "   – Additional taxes"),
        rate: A.otherTaxRate,
        amount: -flow.otherTaxes,
        kind: "deduction",
        indent: 0,
        pctOfRevenue: -pct(flow.otherTaxes),
        note: A.otherTaxNote,
      });
    }
  } else if (hasOtherTaxes) {
    rows.push({
      label: L("   – Taxes additionnelles", "   – Additional taxes"),
      rate: A.otherTaxRate,
      amount: -flow.otherTaxes,
      kind: "deduction",
      indent: 2,
      pctOfRevenue: -pct(flow.otherTaxes),
      note: A.otherTaxNote,
    });
  }

  if (flow.retainedAmount > 0) {
    rows.push({
      label: L("🏦 Reste conservé en société", "🏦 Kept in company (retained earnings)"),
      amount: flow.retainedAmount,
      kind: "retained",
      indent: 1,
      pctOfRevenue: pct(flow.retainedAmount),
      note: L(
        "Pas en poche — sur le bilan de ta société. Réemployable pour réinvestir, ou distribuable plus tard (à nouveau PFU si tu sors).",
        "Not in your pocket — on your company's balance sheet. Can be reinvested or distributed later (PFU will hit again)."
      ),
    });
  }

  rows.push({
    label: L("💰 NET EN POCHE (personne physique)", "💰 NET IN POCKET (person)"),
    amount: flow.netTakeHome,
    kind: "net",
    indent: 0,
    pctOfRevenue: pct(flow.netTakeHome),
  });

  return (
    <div>
      {rows.map((r, i) => (
        <WaterfallRow key={i} row={r} />
      ))}
      <div
        style={{
          marginTop: "14px",
          paddingTop: "12px",
          borderTop: "1px solid var(--border)",
          fontSize: "0.85rem",
          color: "var(--text-muted)",
        }}
      >
        {L(
          `Sur ${formatEUR(rev)} de CA, ${formatEUR(flow.totalLevied)} partent en impôts & cotisations (${formatPercent(pct(flow.totalLevied))}), ${formatEUR(flow.netTakeHome)} arrivent en poche (${formatPercent(pct(flow.netTakeHome))})${flow.retainedAmount > 0 ? `, et ${formatEUR(flow.retainedAmount)} restent en société (${formatPercent(pct(flow.retainedAmount))}).` : "."}`,
          `Out of ${formatEUR(rev)} revenue, ${formatEUR(flow.totalLevied)} go to taxes & contributions (${formatPercent(pct(flow.totalLevied))}), ${formatEUR(flow.netTakeHome)} reach your pocket (${formatPercent(pct(flow.netTakeHome))})${flow.retainedAmount > 0 ? `, and ${formatEUR(flow.retainedAmount)} stay in the company (${formatPercent(pct(flow.retainedAmount))}).` : "."}`
        )}
      </div>
    </div>
  );
}

function WaterfallRow({ row }: { row: Row }) {
  const indent = row.indent ?? 0;
  const colorMap: Record<RowKind, string> = {
    gross: "var(--text)",
    deduction: "var(--danger)",
    subtotal: "var(--text-muted)",
    net: "var(--primary)",
    retained: "var(--warning)",
  };
  const weight: Record<RowKind, number> = {
    gross: 500,
    deduction: 400,
    subtotal: 600,
    net: 700,
    retained: 600,
  };
  const isMainSubtotal = row.indent === 0 && (row.kind === "net" || row.kind === "subtotal");
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 150px 54px",
        alignItems: "baseline",
        padding: "8px 0",
        paddingLeft: `${indent * 14}px`,
        borderBottom: isMainSubtotal ? "1px solid var(--border)" : "1px dashed var(--border-soft)",
        borderTop: isMainSubtotal && row.indent === 0 ? "1px solid var(--border)" : undefined,
        color: colorMap[row.kind],
        fontWeight: weight[row.kind],
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
          <span>{row.label}</span>
          {row.rate && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-dim)",
                fontWeight: 500,
                background: "var(--bg-inset)",
                padding: "2px 7px",
                borderRadius: "999px",
                letterSpacing: "-0.005em",
              }}
            >
              {row.rate}
            </span>
          )}
        </div>
        {row.note && (
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-dim)",
              fontWeight: 400,
              fontStyle: "italic",
              marginTop: "3px",
              lineHeight: 1.4,
              maxWidth: "620px",
            }}
          >
            {row.note}
          </div>
        )}
      </div>
      <div
        style={{
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          fontFamily: "var(--font-sans)",
        }}
      >
        {formatEUR(row.amount)}
      </div>
      <div
        style={{
          textAlign: "right",
          color: "var(--text-dim)",
          fontSize: "0.78rem",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {row.pctOfRevenue !== undefined ? formatPercent(row.pctOfRevenue) : ""}
      </div>
    </div>
  );
}
