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
  foreignIncomeTotalEUR: number;
  remittanceToMaltaEUR: number;
  maltaSourceIncomeEUR: number;
  familyStatus: FamilyStatus;
  children: number;
}

/**
 * Scheme non-dom Malte — remittance basis.
 * - Malta-source income : toujours imposé (barème progressif)
 * - Foreign income remitté : imposé au barème
 * - Foreign income NON remitté : exonéré
 * - Minimum tax €5k si foreign income > €35k/an
 */
export function calculateMaltaNonDom(
  input: MaltaNonDomInput,
  data: MaltaData
): StructureResult {
  const brackets =
    input.children > 0
      ? data.personalIncomeTaxBrackets_parent_2026_EUR
      : data.personalIncomeTaxBrackets_single_2026_EUR;

  const taxableIncome = input.maltaSourceIncomeEUR + input.remittanceToMaltaEUR;
  let incomeTax = applyProgressiveBrackets(taxableIncome, brackets);

  // Minimum tax non-dom
  if (input.foreignIncomeTotalEUR > 35_000) {
    incomeTax = Math.max(incomeTax, data.nonDomRegime.minimumTax.amount_EUR);
  }

  const grossAccessible = input.foreignIncomeTotalEUR + input.maltaSourceIncomeEUR;
  const netInHand = grossAccessible - incomeTax;

  // Malta non-dom : pas de cotisations sociales structurelles ici.
  // L'IR entier est classé "pureCost" — pas de contrepartie sociale directe.
  const breakdown: ContributionBreakdown = {
    effectivelyValuable: 0,
    nominallyValuable: 0,
    pureCost: incomeTax,
  };

  const flow: TaxFlow = {
    currency: "EUR",
    revenue: grossAccessible,
    businessExpenses: 0,
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
    effectiveRate: incomeTax / Math.max(1, grossAccessible),
    warnings: [
      "Scheme Malta non-dom valide UNIQUEMENT si vous résidez réellement à Malte (>183 jours/an) avec substance économique. Voir règles CFC 209B du CGI français.",
    ],
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

  // Refund 6/7 sur la taxe imputable à la part distribuée
  const taxOnDistributed = netProfit > 0 ? (distributed / netProfit) * initialCorpTax : 0;
  const refund = taxOnDistributed * (6 / 7);

  const effectiveCorpTax = initialCorpTax - refund;
  const effectiveCorpRate = effectiveCorpTax / input.profitBeforeTaxEUR;
  const distributedNet = distributed + refund; // Via Holdco (participation exemption)

  return {
    initialCorpTax,
    refund,
    effectiveCorpTax,
    effectiveCorpRate,
    distributedNet,
  };
}
