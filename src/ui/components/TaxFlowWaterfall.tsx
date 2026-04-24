"use client";

import type { TaxFlow } from "@/engine/types";
import { formatEUR, formatPercent } from "@/lib/formatters";
import { useI18n } from "@/ui/hooks/useI18n";

interface Props {
  flow: TaxFlow;
}

type RowKind = "gross" | "deduction" | "subtotal" | "net" | "retained";

interface Row {
  label: string;
  amount: number;
  kind: RowKind;
  /** 0 = racine, 1 = niveau société, 2 = niveau perso */
  indent?: 0 | 1 | 2;
  /** Ratio par rapport au CA brut (affiché en %) */
  pctOfRevenue?: number;
  /** Sous-label (explication inline) */
  note?: string;
}

/**
 * Waterfall visuel : affiche le trajet fiscal du CA brut jusqu'au net dans la poche.
 * Indentation pour distinguer niveau société / niveau personne physique.
 * Couleurs : vert = gain/net, rouge = déduction/impôt, gris = sous-total / retenu.
 */
export function TaxFlowWaterfall({ flow }: Props) {
  const { t, locale } = useI18n();
  const L = (fr: string, en: string) => (locale === "en" ? en : fr);
  const rev = flow.revenue;
  const pct = (v: number) => (rev > 0 ? v / rev : 0);

  // On construit la séquence de lignes selon que la structure est :
  //   A. Sole-prop pass-through (micro FR, LLC US, Japan sole, Malta non-dom)
  //   B. Société avec salaire + dividendes (SASU FR, UK Ltd, S-Corp US)
  //   C. EURL TNS (hybride)
  const hasCompany = flow.profitBeforeCorpTax !== 0 || flow.corporateTax !== 0 || flow.salaryCost !== 0;
  const hasSalary = flow.salaryGross > 0;
  const hasDividend = flow.dividendGross > 0;
  const hasSelfEmploymentTax = flow.selfEmploymentTax > 0;
  const hasSoleIncomeTax = flow.soleIncomeTax > 0;
  const hasOtherTaxes = flow.otherTaxes > 0;

  const rows: Row[] = [];

  // --- Racine : CA brut
  rows.push({
    label: L("Chiffre d'affaires brut", "Gross revenue"),
    amount: rev,
    kind: "gross",
    indent: 0,
    pctOfRevenue: 1,
  });

  // --- Charges pro (si déclarées)
  if (flow.businessExpenses > 0) {
    rows.push({
      label: L("– Charges pro déductibles", "– Business expenses"),
      amount: -flow.businessExpenses,
      kind: "deduction",
      indent: 0,
      pctOfRevenue: -pct(flow.businessExpenses),
    });
  }

  // ==== NIVEAU SOCIÉTÉ ====
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
        amount: -flow.salaryCost,
        kind: "deduction",
        indent: 1,
        pctOfRevenue: -pct(flow.salaryCost),
        note: L(
          `dont ${formatEUR(flow.employerContrib)} cotisations employeur`,
          `incl. ${formatEUR(flow.employerContrib)} employer contributions`
        ),
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
        label: L("   – Impôt société (IS / CT)", "   – Corporate income tax"),
        amount: -flow.corporateTax,
        kind: "deduction",
        indent: 1,
        pctOfRevenue: -pct(flow.corporateTax),
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

  // ==== NIVEAU PERSONNE PHYSIQUE ====
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
        amount: -flow.employeeContrib,
        kind: "deduction",
        indent: 2,
        pctOfRevenue: -pct(flow.employeeContrib),
      });
    }
    if (flow.salaryIncomeTax > 0) {
      rows.push({
        label: L("   – IR sur le salaire (barème progressif)", "   – Income tax on salary"),
        amount: -flow.salaryIncomeTax,
        kind: "deduction",
        indent: 2,
        pctOfRevenue: -pct(flow.salaryIncomeTax),
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
        amount: -flow.dividendTax,
        kind: "deduction",
        indent: 2,
        pctOfRevenue: -pct(flow.dividendTax),
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

  // Cas sole-prop (pass-through) : pas de salaire ni société, taxes vont directement
  if (!hasSalary && !hasDividend && (hasSelfEmploymentTax || hasSoleIncomeTax || hasOtherTaxes)) {
    if (hasSelfEmploymentTax) {
      rows.push({
        label: L("   – Cotisations sociales / SE tax", "   – Social contributions / SE tax"),
        amount: -flow.selfEmploymentTax,
        kind: "deduction",
        indent: 0,
        pctOfRevenue: -pct(flow.selfEmploymentTax),
      });
    }
    if (hasSoleIncomeTax) {
      rows.push({
        label: L("   – Impôt sur le revenu", "   – Income tax"),
        amount: -flow.soleIncomeTax,
        kind: "deduction",
        indent: 0,
        pctOfRevenue: -pct(flow.soleIncomeTax),
      });
    }
    if (hasOtherTaxes) {
      rows.push({
        label: L("   – Taxes additionnelles", "   – Additional taxes"),
        amount: -flow.otherTaxes,
        kind: "deduction",
        indent: 0,
        pctOfRevenue: -pct(flow.otherTaxes),
      });
    }
  } else if (hasOtherTaxes) {
    // Société + autres taxes (MCTMT, franchise CA)
    rows.push({
      label: L("   – Taxes additionnelles (MCTMT, franchise, etc.)", "   – Additional taxes (MCTMT, franchise, etc.)"),
      amount: -flow.otherTaxes,
      kind: "deduction",
      indent: 2,
      pctOfRevenue: -pct(flow.otherTaxes),
    });
  }

  // Retenu en société (le cas échéant)
  if (flow.retainedAmount > 0) {
    rows.push({
      label: L("🏦 Reste conservé en société (réserves)", "🏦 Kept in company (retained earnings)"),
      amount: flow.retainedAmount,
      kind: "retained",
      indent: 1,
      pctOfRevenue: pct(flow.retainedAmount),
      note: L(
        "pas en poche, mais dans le bilan de ta société",
        "not in pocket, but on your company's balance sheet"
      ),
    });
  }

  // --- Racine : total en poche
  rows.push({
    label: L("💰 NET EN POCHE (personne physique)", "💰 NET IN POCKET (person)"),
    amount: flow.netTakeHome,
    kind: "net",
    indent: 0,
    pctOfRevenue: pct(flow.netTakeHome),
  });

  return (
    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem" }}>
      {rows.map((r, i) => (
        <WaterfallRow key={i} row={r} />
      ))}
      <div
        style={{
          marginTop: "0.75rem",
          paddingTop: "0.75rem",
          borderTop: "1px solid var(--border)",
          fontSize: "0.85rem",
          color: "var(--text-muted)",
          fontFamily: "var(--font-sans)",
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
  const isMainSubtotal =
    row.indent === 0 && (row.kind === "net" || row.kind === "subtotal");
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 140px 60px",
        alignItems: "baseline",
        padding: "0.3rem 0",
        paddingLeft: `${indent * 0.75}rem`,
        borderBottom: isMainSubtotal ? "1px solid var(--border)" : "1px dashed var(--border)",
        borderTop: isMainSubtotal && row.indent === 0 ? "1px solid var(--border)" : undefined,
        color: colorMap[row.kind],
        fontWeight: weight[row.kind],
      }}
    >
      <div style={{ fontFamily: "var(--font-sans)" }}>
        {row.label}
        {row.note && (
          <span
            style={{
              display: "block",
              fontSize: "0.75rem",
              color: "var(--text-dim)",
              fontWeight: 400,
              paddingLeft: "1rem",
            }}
          >
            {row.note}
          </span>
        )}
      </div>
      <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {row.amount < 0 ? "" : ""}
        {formatEUR(row.amount)}
      </div>
      <div
        style={{
          textAlign: "right",
          color: "var(--text-dim)",
          fontSize: "0.8rem",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {row.pctOfRevenue !== undefined ? formatPercent(row.pctOfRevenue) : ""}
      </div>
    </div>
  );
}
