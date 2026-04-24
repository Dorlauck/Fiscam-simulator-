import type { Bracket, ContributionBreakdown, FamilyStatus, StructureResult, TaxFlow } from "../types";
import { applyProgressiveBrackets } from "../progressiveBrackets";

interface MaltaData {
  personalIncomeTaxBrackets_single_2026_EUR: Bracket[];
  personalIncomeTaxBrackets_parent_2026_EUR: Bracket[];
  nonDomRegime: {
    minimumTax: { amount_EUR: number; condition: string };
  };
  corporate: {
    nominalRate: number;
    refundSystem_6_7: { effectiveRate_trading: number };
  };
}

export interface MaltaNonDomInput {
  /** Revenu foreign BRUT avant charges pro (CA). */
  foreignIncomeTotalEUR: number;
  /**
   * Charges pro déductibles (loyer bureau, outils, freelances sous-traités, etc.).
   * Déduites du foreign income avant tout calcul d'imposition.
   * Par défaut 0 si la source est passive (dividende holding, royalty, etc.).
   */
  businessExpensesEUR?: number;
  /** Montant remitté à Malte (destiné à la consommation locale). Capé au bénéfice net. */
  remittanceToMaltaEUR: number;
  /** Revenu de source maltaise (toujours taxable peu importe la remittance). */
  maltaSourceIncomeEUR: number;
  familyStatus: FamilyStatus;
  children: number;
}

/**
 * Scheme non-dom Malte — remittance basis.
 * - Charges pro déductibles du foreign income (bugfix 2026-04)
 * - Foreign profit (après charges) NON remitté : exonéré à Malta
 * - Foreign profit remitté + Malta-source : taxés au barème progressif maltais
 * - Minimum tax €5 000 si foreign income brut > €35 000/an
 */
export function calculateMaltaNonDom(
  input: MaltaNonDomInput,
  data: MaltaData
): StructureResult {
  const brackets =
    input.children > 0
      ? data.personalIncomeTaxBrackets_parent_2026_EUR
      : data.personalIncomeTaxBrackets_single_2026_EUR;

  const businessExpenses = Math.max(0, input.businessExpensesEUR ?? 0);
  // Profit foreign net après charges pro — c'est ce qui est réellement disponible
  const foreignProfit = Math.max(0, input.foreignIncomeTotalEUR - businessExpenses);

  // La remittance ne peut pas excéder le profit net disponible
  const actualRemittance = Math.min(Math.max(0, input.remittanceToMaltaEUR), foreignProfit);

  const taxableIncome = input.maltaSourceIncomeEUR + actualRemittance;
  let incomeTax = applyProgressiveBrackets(taxableIncome, brackets);

  // Minimum tax non-dom : déclenché sur le foreign income BRUT (pas le net), selon la loi maltaise
  if (input.foreignIncomeTotalEUR > 35_000) {
    incomeTax = Math.max(incomeTax, data.nonDomRegime.minimumTax.amount_EUR);
  }

  // Revenu effectivement disponible = profit net foreign + source maltaise
  const grossAccessible = foreignProfit + input.maltaSourceIncomeEUR;
  const netInHand = grossAccessible - incomeTax;

  const breakdown: ContributionBreakdown = {
    effectivelyValuable: 0,
    nominallyValuable: 0,
    pureCost: incomeTax,
  };

  const flow: TaxFlow = {
    currency: "EUR",
    revenue: input.foreignIncomeTotalEUR + input.maltaSourceIncomeEUR,
    businessExpenses,
    salaryCost: 0,
    profitBeforeCorpTax: 0,
    corporateTax: 0,
    profitAfterCorpTax: 0,
    dividendGross: 0,
    retainedInCompany: 0,
    salaryGross: 0,
    employerContrib: 0,
    employeeContrib: 0,
    salaryNet: 0,
    salaryIncomeTax: 0,
    salaryTakeHome: 0,
    dividendTax: 0,
    dividendNet: 0,
    selfEmploymentTax: 0,
    soleIncomeTax: incomeTax,
    otherTaxes: 0,
    totalLevied: incomeTax,
    netTakeHome: netInHand,
    retainedAmount: 0,
  };

  const warnings = [
    "Scheme Malta non-dom valide UNIQUEMENT si vous résidez réellement à Malte (>183 jours/an) avec substance économique. Voir règles CFC 209B du CGI français.",
  ];

  if (input.remittanceToMaltaEUR > foreignProfit + 0.5) {
    warnings.push(
      `Remittance cible (${Math.round(input.remittanceToMaltaEUR).toLocaleString("fr-FR")}€) supérieure au profit net foreign disponible (${Math.round(foreignProfit).toLocaleString("fr-FR")}€). Ramenée au maximum distribuable.`
    );
  }

  return {
    structure: "Malta non-dom (remittance basis)",
    jurisdiction: "MT",
    corporateTax: 0,
    socialContributions: 0,
    socialContributionsBreakdown: breakdown,
    dividendTax: 0,
    incomeTax,
    otherTaxes: 0,
    totalTax: incomeTax,
    netInHand,
    effectiveRate: incomeTax / Math.max(1, input.foreignIncomeTotalEUR + input.maltaSourceIncomeEUR),
    warnings,
    flow,
  };
}

/**
 * OpCo Malta payant 35% d'IS puis refund 6/7 à l'actionnaire/holdco.
 * Taux net effectif ≈ 5%.
 */
export interface MaltaLtdInput {
  profitBeforeTaxEUR: number;
  distributedToShareholderEUR: number;
}

export function calculateMaltaLtd_6_7(
  input: MaltaLtdInput,
  data: MaltaData
): {
  initialCorpTax: number;
  refund: number;
  effectiveCorpTax: number;
  effectiveCorpRate: number;
  distributedNet: number;
} {
  const initialCorpTax = input.profitBeforeTaxEUR * data.corporate.nominalRate;
  const netProfit = input.profitBeforeTaxEUR - initialCorpTax;
  const distributed = Math.min(Math.max(0, input.distributedToShareholderEUR), netProfit);

  const taxOnDistributed = netProfit > 0 ? (distributed / netProfit) * initialCorpTax : 0;
  const refund = taxOnDistributed * (6 / 7);

  const effectiveCorpTax = initialCorpTax - refund;
  const effectiveCorpRate = effectiveCorpTax / input.profitBeforeTaxEUR;
  const distributedNet = distributed + refund;

  return {
    initialCorpTax,
    refund,
    effectiveCorpTax,
    effectiveCorpRate,
    distributedNet,
  };
}
